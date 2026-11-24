// PathFinder – Befragung: aus einem Dokument der Art „Befragung“ die Vorlage machen, mit der eine Plattform (Probe)
// Fragebögen anzeigt, ausfüllen lässt, druckt und auswertet.
//   surveySpec(doc) → { id, title, sub, kicker, sections:[{ title, qs:[…] }], consent, share, stats }
// Kein DOM, keine Bibliothek: läuft im Browser und in Node (Tests).
//
// Fragen (qs) – Feld t:
//   scale   { id, q, min, max, lo, hi }                 Antwort: Zahl
//   single  { id, q, opts:[…], text? }                  Antwort: Text der gewählten Antwort
//   multi   { id, q, opts:[…] }                         Antwort: [Texte]
//   matrix  { id, q, items:[…], cols:[…], vals:[…] }    Antwort: { Zeilennummer: Wert aus vals }
//   text    { id, q, rows }  ·  line { id, q }          Antwort: Text (geht nie in Statistiken ein)
//   date    { id, q }                                   Antwort: JJJJ-MM-TT
//   info    { html }                                    nur Anzeige (Text, Infokasten, Bild, Tabelle) – vor dem Anzeigen bereinigen
// Gemeinsame Felder: hint (Hinweis), w (darf mit Einwilligung weitergegeben werden), stat (geht in Statistiken ein).
// consent = die Einwilligung zur Weitergabe (t:'consent', id 'weitergabe'; die erste Antwort bedeutet „Ja“).

const plain = s => String(s ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = c => { const m = String(c).replace('−', '-').replace(',', '.').match(/^\s*([+-]?\d+(?:\.\d+)?)\s*$/); return m ? +m[1] : null; };

/** Werte eines Rasters: Spalten wie „+3, +2 … −3“ zählen als Zahlen (Mittelwerte), sonst die Stufe 1, 2, 3 … von links */
export function matrixVals(cols) {
  const n = cols.map(num);
  return n.every(x => x != null) ? n : cols.map((_, i) => cols.length - i);
}

function infoHtml(b) {
  if (b.type === 'text') return b.html || '';
  if (b.type === 'info') return `${b.title ? `<b>${esc(plain(b.title))}</b><br>` : ''}${b.html || ''}`;
  if (b.type === 'image') return b.src ? `<img src="${esc(b.src)}" alt="${esc(b.alt || '')}">${b.caption ? `<br><small>${esc(b.caption)}</small>` : ''}` : '';
  if (b.type === 'table') return `<table>${(b.rows || []).map((r, i) => `<tr>${r.map(c => b.head && !i ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  return '';
}

export function surveySpec(doc) {
  const sections = []; let consent = null, share = false;
  for (const s of doc.stations || []) {
    const qs = [];
    for (const b of s.blocks || []) {
      if (b.hide) continue;
      const base = { id: b.id, q: plain(b.q), ...(b.hint ? { hint: plain(b.hint) } : {}), ...(b.share ? { w: true } : {}) };
      if (b.share) share = true;
      if (b.type === 'scale') { const lo = Number.isFinite(+b.min) ? +b.min : 1, hi = Number.isFinite(+b.max) && +b.max > lo ? +b.max : lo + 9; qs.push({ ...base, t: 'scale', min: lo, max: hi, lo: plain(b.lo), hi: plain(b.hi), stat: true }); }
      else if (b.type === 'choice') {
        const q = { ...base, t: b.consent ? 'consent' : b.multi ? 'multi' : 'single', opts: (b.opts || []).map(plain).filter(Boolean), stat: true, ...(b.text ? { text: plain(b.text) } : {}) };
        if (b.consent) { if (!consent) consent = { ...q, id: 'weitergabe', w: false }; } else qs.push(q);
      }
      else if (b.type === 'matrix') { const cols = (b.cols || []).map(plain).filter(Boolean); qs.push({ ...base, t: 'matrix', items: (b.items || []).map(plain).filter(Boolean), cols, vals: matrixVals(cols), stat: true }); }
      else if (b.type === 'open') qs.push({ ...base, t: (+b.rows || 1) <= 1 ? 'line' : 'text', rows: Math.max(1, +b.rows || 3) });
      else if (b.type === 'datefield') qs.push({ ...base, t: 'date' });
      else if (['text', 'info', 'image', 'table'].includes(b.type)) { const html = infoHtml(b); if (plain(html) || /<img/i.test(html)) qs.push({ t: 'info', html }); }
    }
    if (qs.length) sections.push({ title: plain(s.title), sub: plain(s.sub), qs });
  }
  const all = sections.flatMap(x => x.qs);
  return { id: doc.id, title: plain(doc.title), sub: plain(doc.subtitle), kicker: plain(doc.kicker), sections, consent, share,
    stats: all.filter(q => q.stat).length + (consent ? 1 : 0), questions: all.filter(q => q.t !== 'info').length + (consent ? 1 : 0) };
}
