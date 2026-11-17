// PathFinder – Digitale Prüfung: Zerlegen in Schülerfassung und Lösungsschlüssel, Bewerten mit Teilpunkten.
//   splitExam(doc)                 → { student, key, warnings }
//   gradeExam(key, answers, opt)   → { items, total, max, pct, pending }
//   gradeFor(pct) / pointsFor(pct) → Note 1–6 bzw. 0–15 Punkte nach Notenschlüssel
// Kein DOM, keine Bibliothek: läuft im Browser (Editor, Prüfungsplattform) und in Node (Tests).
//
// Antworten (answers[blockId]) – so speichert sie der Prüfungsmodus des Abspielers:
//   quiz  { Fragennummer: Options-Schlüssel k }
//   gap   { Lückennummer: Text bzw. gezogener Begriff }
//   match { Schlüssel kb der rechten Karte: Schlüssel ka der gezogenen linken Karte }
//   task  Text (kurze Antwort, wenn die Aufgabe ein Ergebnis hat, sonst Freitext)
//   essay Text

export const EXAM_TYPES = new Set(['task', 'quiz', 'gap', 'match', 'essay']);
/** Bausteine ohne Lösungen, die unverändert in die Schülerfassung dürfen */
const SAFE_TYPES = new Set(['text', 'info', 'image', 'table', 'reveal', 'file', 'code', 'uml', 'html']);
/** Standard-Notenschlüssel (wie im Abitur): ab 20 % Note 5, ab 40 % Note 4, ab 55 % Note 3, ab 70 % Note 2, ab 85 % Note 1 */
export const GRADE_KEY = [20, 40, 55, 70, 85];
/** Abitur-Tabelle für 0–15 Punkte: ab x % gibt es 1, 2, … 15 Punkte */
export const POINTS_KEY = [20, 27, 33, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];

const GAP_RE = /\[\[(.+?)\]\]/g;
const clone = o => JSON.parse(JSON.stringify(o));
const strip = h => String(h ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function rnd(n) {
  const c = globalThis.crypto;
  if (c?.getRandomValues) return c.getRandomValues(new Uint32Array(1))[0] % n;
  return Math.floor(Math.random() * n);
}
/** zufälliger Schlüssel (8 Zeichen, ohne verwechselbare Zeichen) */
export function rid() { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 8; i++) s += A[rnd(A.length)]; return s; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export const ptsOf = b => Math.max(0, +(b.pts ?? 1) || 0);
/** Lücken eines Lückentexts: je Lücke die erlaubten Antworten */
export const gapAnswers = html => [...String(html || '').matchAll(GAP_RE)].map(m => m[1].split('|').map(s => s.trim()));
export const normAns = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
/** Antwort prüfen: Text ohne Groß/Klein und Leerzeichen, Zahlen auch mit Komma und kleinen Rundungsunterschieden (wie im Lernpfad) */
export function isAnswer(expected, v) {
  if (String(v ?? '').trim() === '') return false;
  const num = x => { const t = String(x).trim().replace(/\s|€|%/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); return /^[-+]?\d*\.?\d+$/.test(t) ? parseFloat(t) : NaN; };
  return String(expected || '').split('|').some(e => { const a = num(e), b = num(v); if (!isNaN(a) && !isNaN(b)) return Math.abs(a - b) <= Math.max(1e-9, Math.abs(a) * 1e-9, 0.005); return normAns(e) === normAns(v); });
}
/** Teilpunkte: auf halbe Punkte abrunden */
export const halfFloor = x => Math.floor(x * 2 + 1e-9) / 2;

/** Art der Bewertung eines Prüfungsbausteins */
export function taskKind(b) {
  if (b.type === 'task') return b.answer || b.short ? 'short' : 'free';
  if (b.type === 'essay') return 'free';
  return b.type;
}
/** Kurzer Titel einer Aufgabe für Listen und Protokolle */
export function taskTitle(b) {
  if (b.title && strip(b.title)) return strip(b.title);
  if (b.type === 'quiz') return (b.qs || []).length > 1 ? `Quiz (${b.qs.length} Fragen)` : strip(b.qs?.[0]?.q).slice(0, 60) || 'Quiz';
  if (b.type === 'gap') return 'Lückentext';
  if (b.type === 'match') return 'Zuordnen';
  if (b.type === 'essay') return 'Freitext';
  return strip(b.html).slice(0, 60) || 'Aufgabe';
}

/** Stabile Schlüssel für Antwortoptionen und Zuordnungskarten (ändert das Dokument) */
export function ensureKeys(doc) {
  for (const s of doc.stations || []) for (const b of s.blocks || []) {
    if (b.type === 'quiz') for (const q of b.qs || []) for (const o of q.opts || []) o.k = o.k || rid();
    if (b.type === 'match') for (const p of b.pairs || []) { p.ka = p.ka || rid(); p.kb = p.kb || rid(); if (p.ka === p.kb) p.kb = rid(); }
  }
  return doc;
}

/**
 * Prüfung zerlegen. Die Schülerfassung enthält alle Inhalte und Aufgabenstellungen, aber keine Lösung:
 * keine richtigen Antworten, Rückmeldungen, Tipps, Musterlösungen oder Erwartungshorizonte; Antwortoptionen gemischt.
 * Der Lösungsschlüssel enthält alles, was zum Bewerten nötig ist.
 */
export function splitExam(doc) {
  const d = ensureKeys(clone(doc)), warnings = [], tasks = [];
  const student = {
    v: d.v, id: d.id, form: 'pruefung', design: d.design, kicker: d.kicker || '', title: d.title || '', subtitle: d.subtitle || '',
    goals: [], rank: '', anim: d.anim || {}, typeLines: d.typeLines || [], pointsOn: true,
    cert: { ...(d.cert || {}), on: false }, exam: { student: true }, stations: []
  };
  for (const s of d.stations || []) {
    const out = { id: s.id, title: s.title || '', sub: s.sub || '', nr: s.nr || '', check: false, anim: s.anim || '', blocks: [] };
    for (const b of s.blocks || []) {
      const pts = ptsOf(b), title = taskTitle(b);
      if (b.type === 'quiz') {
        out.blocks.push({ id: b.id, type: 'quiz', pts, qs: (b.qs || []).map(q => ({ q: q.q || '', opts: shuffle((q.opts || []).map(o => ({ k: o.k, t: o.t || '' }))) })) });
        tasks.push({ id: b.id, type: 'quiz', pts, title, qs: (b.qs || []).map(q => ({ q: q.q || '', ok: (q.opts || []).filter(o => o.ok).map(o => o.k), opts: (q.opts || []).map(o => ({ k: o.k, t: o.t || '', ok: !!o.ok, fb: o.fb || '' })) })) });
        if ((b.qs || []).some(q => !(q.opts || []).some(o => o.ok))) warnings.push(`Quiz „${title}“: eine Frage hat keine richtige Antwort.`);
      } else if (b.type === 'gap') {
        const gaps = gapAnswers(b.html), x = { id: b.id, type: 'gap', pts, title: b.title || '', sub: b.sub || '', heft: !!b.heft, bank: !!b.bank, html: String(b.html || '').replace(GAP_RE, '[[…]]') };
        if (b.bank) x.words = shuffle(gaps.map(g => g[0]).concat(b.extra || []));
        out.blocks.push(x);
        tasks.push({ id: b.id, type: 'gap', pts, title, bank: !!b.bank, html: b.html || '', gaps });
        if (!gaps.length) warnings.push(`Lückentext „${title}“ hat keine Lücke.`);
      } else if (b.type === 'match') {
        const P = b.pairs || [];
        out.blocks.push({ id: b.id, type: 'match', pts, title: b.title || '', left: shuffle(P.map(p => ({ k: p.ka, t: p.a || '' }))), right: shuffle(P.map(p => ({ k: p.kb, t: p.b || '' }))) });
        tasks.push({ id: b.id, type: 'match', pts, title, pairs: P.map(p => ({ a: p.a || '', b: p.b || '', ka: p.ka, kb: p.kb })) });
      } else if (b.type === 'task') {
        const short = !!b.answer;
        out.blocks.push({ id: b.id, type: 'task', pts, title: b.title || '', html: b.html || '', img: b.img || '', ...(short ? { short: true, answerPh: b.answerPh || '' } : {}) });
        tasks.push({ id: b.id, type: 'task', pts, title, short, answer: b.answer || '', solution: b.solution || '' });
      } else if (b.type === 'essay') {
        out.blocks.push({ id: b.id, type: 'essay', pts, title: b.title || '', html: b.html || '', img: b.img || '', lines: b.lines || 6 });
        tasks.push({ id: b.id, type: 'essay', pts, title, rubric: (b.rubric || []).map(r => ({ t: r.t || '', p: +r.p || 0 })), solution: b.solution || '' });
      } else if (SAFE_TYPES.has(b.type) || b.type === 'heading') {
        const c = clone(b); delete c.anim; out.blocks.push(c);
      } else if (b.type === 'lock') {
        // Sperren gibt es in Prüfungen nicht
      } else warnings.push(`Baustein „${b.type}“ wird in Prüfungen nicht unterstützt und fehlt in der Schülerfassung.`);
    }
    if (!out.blocks.length) out.blocks.push({ id: rid(), type: 'text', html: '' });
    student.stations.push(out);
  }
  if (!tasks.length) warnings.push('Die Prüfung enthält keine Aufgabe.');
  return { student, key: { v: 1, docId: d.id, title: strip(d.title), tasks }, warnings };
}

/**
 * Bewerten. opt (alles optional):
 *   manual   { id: Punkte }               – Punkte der Lehrkraft für Freitext
 *   override { id: Punkte }               – Neubewertung einer automatisch bewerteten Aufgabe
 *   accept   { id: { Lücke/Frage: [Antworten] } } – zusätzlich akzeptierte Antworten (Lücke bzw. kurze Antwort: Schlüssel 0)
 *   drop     [ids]                        – Aufgaben aus der Wertung nehmen
 */
export function gradeExam(key, answers = {}, opt = {}) {
  const drop = new Set(opt.drop || []);
  const items = key.tasks.map(t => {
    const a = answers?.[t.id], acc = opt.accept?.[t.id] || {};
    const it = { id: t.id, type: t.type, kind: taskKind(t), title: t.title, max: t.pts, pts: 0, auto: true, open: false, parts: [] };
    if (t.type === 'quiz') {
      t.qs.forEach((q, qi) => {
        const g = a?.[qi], o = q.opts.find(x => x.k === g);
        const ok = q.ok.includes(g) || (o && (acc[qi] || []).includes(o.k));
        it.parts.push({ label: t.qs.length > 1 ? strip(q.q) || `Frage ${qi + 1}` : 'Antwort', given: o ? strip(o.t) : '', ok: !!ok, expected: q.opts.filter(x => x.ok).map(x => strip(x.t)).join(' oder ') });
      });
    } else if (t.type === 'gap') {
      t.gaps.forEach((alts, i) => {
        const g = a?.[i] ?? '', all = alts.concat(acc[i] || []);
        const ok = String(g).trim() !== '' && (t.bank ? all.some(x => normAns(x) === normAns(g)) : isAnswer(all.join('|'), g));
        it.parts.push({ label: `Lücke ${i + 1}`, given: String(g), ok, expected: alts.join(' oder ') });
      });
    } else if (t.type === 'match') {
      t.pairs.forEach(p => {
        const g = a?.[p.kb], got = t.pairs.find(x => x.ka === g);
        it.parts.push({ label: strip(p.b), given: got ? strip(got.a) : '', ok: g === p.ka, expected: strip(p.a) });
      });
    } else if (t.type === 'task' && t.short) {
      const g = typeof a === 'string' ? a : '';
      it.parts.push({ label: 'Antwort', given: g, ok: isAnswer([t.answer].concat(acc[0] || []).join('|'), g), expected: String(t.answer).split('|').join(' oder ') });
    } else { // Freitext: bewertet die Lehrkraft
      it.auto = false; it.text = typeof a === 'string' ? a : '';
      const m = opt.manual?.[t.id];
      if (m == null) { it.open = true; it.pts = null; } else it.pts = Math.max(0, Math.min(t.pts, +m || 0));
    }
    if (it.auto) {
      const n = it.parts.length, good = it.parts.filter(p => p.ok).length;
      it.pts = n ? halfFloor(t.pts * good / n) : 0;
    }
    if (opt.override?.[t.id] != null) { it.pts = Math.max(0, Math.min(t.pts, +opt.override[t.id] || 0)); it.open = false; it.overridden = true; }
    if (drop.has(t.id)) { it.dropped = true; it.max = 0; it.pts = 0; it.open = false; }
    return it;
  });
  const total = items.reduce((s, x) => s + (x.pts || 0), 0), max = items.reduce((s, x) => s + x.max, 0);
  return { items, total, max, pct: max ? 100 * total / max : 0, pending: items.filter(x => x.open).length };
}

/** Note 1–6 nach Notenschlüssel (Grenzen in Prozent, aufsteigend: ab key[0] % Note 5 … ab key[4] % Note 1) */
export function gradeFor(pct, key = GRADE_KEY) { let n = 6; key.forEach((g, i) => { if (pct >= g - 1e-9) n = 5 - i; }); return n; }
/** 0–15 Punkte nach Abitur-Tabelle (Grenzen in Prozent, aufsteigend für 1 … 15 Punkte) */
export function pointsFor(pct, key = POINTS_KEY) { let n = 0; key.forEach((g, i) => { if (pct >= g - 1e-9) n = i + 1; }); return n; }
