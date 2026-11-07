/* PathFinder-Text: ein einfaches, lesbares Textformat für Lernpfade.
 * Damit kann eine KI (oder ein Mensch) einen Lernpfad schreiben, ohne PathFinder intern zu kennen.
 *   parseText(text, env)  → { doc, errors, warnings, stats }
 *   docToText(doc, env)   → Text
 *   promptFor(info, env)  → fertige Anleitung für eine KI
 * env: { emptyDoc, palettes, figures, uid, plugins }
 * Läuft komplett im Browser, schickt nichts weg. */

const INFO = { merke: 'merke', tipp: 'tipp', achtung: 'achtung', begriff: 'begriff', regel: 'regel', abschluss: 'abschluss', hinweis: 'tipp', wichtig: 'achtung', definition: 'begriff' };
const FIG = { ente: 'ente', nachdenken: 'denken', denken: 'denken', aha: 'aha', achtung: 'achtung', 'pass gut auf': 'achtung', 'pass auf': 'achtung' };
const FONTS = { pixel: 'pixel', schlicht: 'schlicht', elegant: 'elegant' };
const norm = s => String(s || '').trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

/* ---------- kleine Formatierung: **fett**, *kursiv*, `Code`, [Link](url), Listen ---------- */
const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function inline(s) {
  const codes = []; s = String(s).replace(/`([^`]+)`/g, (m, c) => `\u0000${codes.push(c) - 1}\u0000`);
  const gaps = []; s = s.replace(/\[\[[^\]]*\]\]/g, m => `\u0001${gaps.push(m) - 1}\u0001`);
  s = escH(s)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s.replace(/\u0001(\d+)\u0001/g, (m, i) => escH(gaps[i])).replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${escH(codes[i])}</code>`);
}
export function mdToHtml(lines) {
  const out = []; let list = null, para = [];
  const flush = () => { if (para.length) { out.push(para.map(inline).join('<br>')); para = []; } if (list) { out.push(`<${list.t}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
  for (const l of lines) {
    const m = l.match(/^\s*([-•*]|\d+[.)])\s+(.*)$/);
    if (m && !/^\*\*/.test(l.trim())) { const t = /\d/.test(m[1]) ? 'ol' : 'ul'; if (para.length || (list && list.t !== t)) flush(); list = list || { t, items: [] }; list.items.push(m[2]); }
    else if (!l.trim()) flush();
    else { if (list) flush(); para.push(l.trim()); }
  }
  flush();
  return out.length > 1 ? out.map(x => /^<(ul|ol)/.test(x) ? x : `<p>${x}</p>`).join('') : (out[0] || '');
}
export function htmlToMd(html) {
  const d = document.createElement('div'); d.innerHTML = html || '';
  const walk = (n, ctx = {}) => {
    if (n.nodeType === 3) return n.textContent.replace(/\s+/g, ' ');
    if (n.nodeType !== 1) return '';
    const t = n.tagName.toLowerCase(), inner = () => [...n.childNodes].map(c => walk(c, ctx)).join('');
    if (t === 'b' || t === 'strong') return `**${inner().trim()}**`;
    if (t === 'i' || t === 'em') return `*${inner().trim()}*`;
    if (t === 'code') return '`' + n.textContent + '`';
    if (t === 'a') return `[${inner()}](${n.getAttribute('href') || ''})`;
    if (t === 'br') return '\n';
    if (t === 'ul' || t === 'ol') { let k = 0; return '\n' + [...n.children].map(li => (t === 'ol' ? `${++k}. ` : '- ') + walk(li, ctx).trim()).join('\n') + '\n'; }
    if (t === 'p' || t === 'div') return '\n' + inner().trim() + '\n';
    return inner();
  };
  return [...d.childNodes].map(c => walk(c)).join('').replace(/\n{3,}/g, '\n\n').trim();
}

/* ---------- Aufbau der Bausteine aus Abschnitten ---------- */
const CORE_SECTIONS = {
  aufgabe: { n: 'Aufgabe', keys: ['antwort', 'tipp', 'loesung', 'xp', 'punkte'], make(S, H) {
    const b = { type: 'task', title: S.title, html: H.md(S.body), xp: S.num('xp', 20), tips: S.all('tipp').map(inline), solution: S.one('loesung') ? inline(S.one('loesung')) : '', img: '' };
    if (S.one('antwort')) b.answer = S.one('antwort');
    return b;
  } },
  quiz: { n: 'Quiz', keys: ['xp', 'punkte'], make(S, H) {
    const qs = []; let q = null;
    for (const [l, n] of S.bodyN) {
      const m = l.match(/^\s*\?\s*(.+)$/), o = l.match(/^\s*\[( |x|X|✓)?\]\s*(.+)$/);
      if (m) { q = { q: inline(m[1]), opts: [] }; qs.push(q); }
      else if (o) { if (!q) { q = { q: '', opts: [] }; qs.push(q); H.err(n, 'Antwort ohne Frage – schreibe vorher eine Zeile mit „? Frage“.'); }
        const [t, fb] = o[2].split(/\s+\/\/\s+/); q.opts.push({ t: inline(t.trim()), ok: !!(o[1] && o[1].trim()), fb: fb ? inline(fb.trim()) : '' }); }
      else if (l.trim()) H.warn(n, `Im Quiz unklar: „${l.trim().slice(0, 40)}“ – Fragen beginnen mit „?“, Antworten mit „[ ]“ oder „[x]“.`);
    }
    if (!qs.length) H.err(S.line, 'Quiz ohne Fragen.');
    qs.forEach(x => { if (x.opts.length < 2) H.err(S.line, `Frage „${x.q.slice(0, 30)}“ braucht mindestens zwei Antworten.`); else if (!x.opts.some(o => o.ok)) H.err(S.line, `Frage „${x.q.slice(0, 30)}“: keine Antwort mit [x] als richtig markiert.`); });
    return { type: 'quiz', qs, xp: S.num('xp', 10) };
  } },
  lueckentext: { n: 'Lückentext', keys: ['wortbank', 'extra', 'xp', 'punkte'], make(S, H) {
    const html = H.md(S.body); if (!/\[\[[^\]]+\]\]/.test(html)) H.err(S.line, 'Lückentext ohne Lücke – schreibe Lücken als [[Antwort]].');
    const bank = /^(ja|yes|true|an)$/i.test(S.one('wortbank') || '') || !!S.one('extra');
    return { type: 'gap', title: S.title, sub: '', html, bank, extra: (S.one('extra') || '').split(/\s*[,;]\s*/).filter(Boolean), heft: false, xp: S.num('xp', 10) };
  } },
  zuordnen: { n: 'Zuordnen', keys: ['xp', 'punkte'], make(S, H) {
    const pairs = [];
    for (const [l, n] of S.bodyN) { if (!l.trim()) continue; const m = l.replace(/^\s*[-•]\s*/, '').split(/\s*(?:->|→|=>)\s*/); if (m.length === 2) pairs.push({ a: m[0].trim(), b: m[1].trim() }); else H.warn(n, `Zuordnen: „${l.trim().slice(0, 40)}“ – schreibe Paare als „links -> rechts“.`); }
    if (pairs.length < 2) H.err(S.line, 'Zuordnen braucht mindestens zwei Paare „links -> rechts“.');
    return { type: 'match', title: S.title || 'Ordne zu', pairs, xp: S.num('xp', 10) };
  } },
  aufdecken: { n: 'Aufdecken', make: (S, H) => ({ type: 'reveal', summary: S.title || 'Mehr erfahren', html: H.md(S.body) }) },
  uml: { n: 'UML', make(S) {
    const L = S.body.map(l => l.replace(/^\s*[-+#~•]\s*/, '').trim()).filter(Boolean);
    return { type: 'uml', name: S.title || 'Klasse', attrs: L.filter(l => !l.includes('(')), methods: L.filter(l => l.includes('(')) };
  } },
  html: { n: 'HTML', make: S => ({ type: 'html', html: S.raw.join('\n') }) },
};
const SEC_ALIAS = { aufgabe: 'aufgabe', auftrag: 'aufgabe', quiz: 'quiz', test: 'quiz', lueckentext: 'lueckentext', luecken: 'lueckentext', zuordnen: 'zuordnen', zuordnung: 'zuordnen', aufdecken: 'aufdecken', aufklappen: 'aufdecken', 'mehr erfahren': 'aufdecken', uml: 'uml', 'uml-klasse': 'uml', klasse: 'uml', html: 'html' };

export function parseText(src, env) {
  const errors = [], warnings = [];
  const H = { err: (n, m) => errors.push({ n, m }), warn: (n, m) => warnings.push({ n, m }), md: mdToHtml, inline };
  const doc = env.emptyDoc('lernpfad'); doc.stations = []; doc.goals = [];
  const SECS = { ...CORE_SECTIONS }, ALIAS = { ...SEC_ALIAS };
  for (const p of env.plugins || []) for (const [k, t] of Object.entries(p.text || {})) { SECS[k] = t; ALIAS[k] = k; for (const a of t.alias || []) ALIAS[norm(a)] = k; }
  let lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  // Antwort der KI steckt oft in einem äußeren ```text … ``` – den entfernen
  { const f = lines.findIndex(l => l.trim()), e = lines.length - 1 - [...lines].reverse().findIndex(l => l.trim());
    if (f >= 0 && /^```\s*(text|markdown|md|txt)?\s*$/i.test(lines[f].trim()) && e > f && /^```\s*$/.test(lines[e].trim())) lines = [...lines.slice(0, f), '', ...lines.slice(f + 1, e), ''];
    else { const g = lines.findIndex(l => /^#\s/.test(l)); if (g > 0) { lines = lines.map((l, k) => k < g ? '' : l); const h = lines.length - 1 - [...lines].reverse().findIndex(l => l.trim()); if (/^```\s*$/.test(lines[h]?.trim())) lines[h] = ''; } } }
  let st = null, sec = null, para = [], i = 0, inHead = true, goalsMode = false;
  const uid = env.uid;
  const station = (n) => { if (!st) { H.warn(n, 'Inhalt vor der ersten Station – eine Station „Start“ wurde angelegt.'); st = { id: uid(), title: 'Start', sub: '', check: false, blocks: [] }; doc.stations.push(st); } return st; };
  const push = (b, n) => { b.id = b.id || uid(); station(n).blocks.push(b); };
  const flushPara = () => { if (!para.length) return; const n = para[0][1]; const L = para.map(x => x[0]); para = []; if (L.join('').trim()) push({ type: 'text', html: mdToHtml(L) }, n); };
  const closeSec = () => {
    if (!sec) return; const S = sec; sec = null;
    const def = SECS[S.kind]; const keys = new Set(def.keys || []);
    const kv = {}; const body = [], bodyN = [];
    for (const [l, n] of S.lines) { const m = l.match(/^\s*([A-Za-zÄÖÜäöüß -]{2,24}):\s*(.*)$/); const k = m && norm(m[1]); if (m && keys.has(k)) (kv[k] = kv[k] || []).push(m[2].trim()); else { body.push(l); bodyN.push([l, n]); } }
    while (body.length && !body[body.length - 1].trim()) { body.pop(); bodyN.pop(); }
    const Sx = { title: S.title, line: S.line, body, bodyN, raw: S.lines.map(x => x[0]), table: S.table, kv, one: k => (kv[k] || [])[0], all: k => kv[k] || [], num: (k, d) => { const v = (kv[k] || kv.punkte || [])[0]; return v != null && !isNaN(parseInt(v)) ? parseInt(v) : d; } };
    try { const b = def.make(Sx, H, env); if (b) { if (kv.punkte) b.pts = parseInt(kv.punkte[0]) || undefined; push(b, S.line); } } catch (e) { H.err(S.line, `Abschnitt „${S.head}“: ${e.message}`); }
  };
  const lastCheckable = () => { const bl = st ? st.blocks : []; for (let k = bl.length - 1; k >= 0; k--) if (['task', 'quiz', 'gap', 'match'].includes(bl[k].type) || (env.isCheck && env.isCheck(bl[k]))) return bl[k]; return null; };

  for (; i < lines.length; i++) {
    const raw = lines[i], n = i + 1, l = raw.trim();
    // Code-Block ```sprache
    const fence = l.match(/^```\s*([\w+#-]*)\s*$/);
    if (fence) {
      const code = []; i++; while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
      if (i >= lines.length) H.warn(n, 'Code-Block ohne schließendes ```.');
      if (sec && sec.kind === 'html') { sec.lines.push(...code.map((c, k) => [c, n + k + 1])); continue; }
      closeSec(); flushPara(); push({ type: 'code', lang: (fence[1] || 'text').toLowerCase(), code: code.join('\n') }, n); continue;
    }
    if (/^%%/.test(l)) continue; // Kommentar
    let m;
    if ((m = l.match(/^#\s+(?!#)(.+)$/))) { doc.title = inline(m[1].replace(/^titel\s*:\s*/i, '')).replace(/<[^>]+>/g, ''); inHead = true; continue; }
    if ((m = l.match(/^##\s+(?!#)(.+)$/))) {
      closeSec(); flushPara(); inHead = false; goalsMode = false;
      const t = m[1].replace(/^station\s*\d*\s*[:.–-]?\s*/i, '').trim();
      const [title, sub] = t.split(/\s+\|\s+/);
      st = { id: uid(), title: inline(title || 'Station').replace(/<[^>]+>/g, ''), sub: sub ? sub.trim() : '', check: false, blocks: [] }; doc.stations.push(st); continue;
    }
    if (inHead && (m = l.match(/^([A-Za-zÄÖÜäöüß ]{3,20}):\s*(.*)$/))) {
      const k = norm(m[1]), v = m[2].trim();
      if (k === 'untertitel') { doc.subtitle = v; continue; }
      if (k === 'art') { doc.form = /challenge/i.test(v) ? 'challenge' : 'lernpfad'; doc.kicker = doc.kicker.replace(/Lernpfad|Challenge/, doc.form === 'challenge' ? 'Challenge' : 'Lernpfad'); continue; }
      if (k === 'kopfzeile') { doc.kicker = v; continue; }
      if (k === 'farbe' || k === 'farben') { const p = env.palettes.findIndex(x => norm(x.n) === norm(v)); if (p >= 0) doc.design.pal = p; else H.warn(n, `Farbe „${v}“ gibt es nicht. Möglich: ${env.palettes.map(x => x.n).join(', ')}.`); continue; }
      if (k === 'schrift') { const f = FONTS[norm(v)]; if (f) doc.design.font = f; else H.warn(n, 'Schrift: Pixel, schlicht oder elegant.'); continue; }
      if (k === 'zertifikat') { doc.cert.on = !/^(nein|aus|no|false)$/i.test(v); continue; }
      if (k === 'rang') { doc.rank = inline(v); continue; }
      if (k === 'punkte') { doc.pointsOn = /^(ja|an|yes|true)$/i.test(v); continue; }
      if (k === 'ziele' || k === 'lernziele') { goalsMode = true; if (v) doc.goals.push(inline(v)); continue; }
    }
    if (inHead && goalsMode && (m = l.match(/^[-•*]\s+(.+)$/))) { doc.goals.push(inline(m[1])); continue; }
    if (inHead && l && !st) { if (/^[-•*]\s/.test(l) || /^[A-Za-zÄÖÜäöüß ]{3,20}:/.test(l)) { H.warn(n, `Kopf: „${l.slice(0, 40)}“ nicht erkannt.`); continue; } }
    if ((m = l.match(/^###\s+(.+)$/))) {
      closeSec(); flushPara();
      const [h, ...rest] = m[1].split(':'); const kind = ALIAS[norm(h)];
      if (!kind) { H.warn(n, `Unbekannter Abschnitt „### ${h.trim()}“ – als Text übernommen. Möglich: ${Object.keys(SECS).map(k => SECS[k].n || k).join(', ')}.`); para.push([`**${rest.join(':').trim() || h.trim()}**`, n]); continue; }
      sec = { kind, head: h.trim(), title: rest.join(':').trim(), line: n, lines: [], table: [] }; continue;
    }
    if (/^-{3,}\s*sperre\s*-{0,}$/i.test(l) || /^\[\s*sperre\s*\]$/i.test(l)) {
      closeSec(); flushPara(); const c = lastCheckable();
      if (!c) H.warn(n, 'Sperre ohne Aufgabe davor in dieser Station – weggelassen.'); else push({ type: 'lock', after: c.id }, n); continue;
    }
    if ((m = l.match(/^\[\s*([^\]:]+?)\s*(?::\s*([^\]]+))?\]\s*(.*)$/)) && (INFO[norm(m[1])] || norm(m[1]) === 'figur')) {
      closeSec(); flushPara();
      const body = [m[3]]; while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,3}\s|\[|```|-{3,})/.test(lines[i + 1].trim())) body.push(lines[++i]);
      if (norm(m[1]) === 'figur') {
        const fk = FIG[norm(m[2] || 'ente')]; if (!fk) H.warn(n, `Figur „${m[2]}“ gibt es nicht – Ente genommen. Möglich: Ente, Nachdenken, Aha, Achtung.`);
        const F = env.figures[fk || 'ente']; push({ type: 'info', kind: 'figur', title: '', html: mdToHtml(body), img: F.src, name: F.name }, n);
      } else push({ type: 'info', kind: INFO[norm(m[1])], title: m[2] ? m[2].trim() : '', html: mdToHtml(body), img: '', name: '' }, n);
      continue;
    }
    if ((m = l.match(/^!\[([^\]]*)\]\(([^)]*)\)$/))) { closeSec(); flushPara(); push({ type: 'image', src: '', alt: m[1], caption: m[1], size: 'voll' }, n); H.warn(n, `Bild „${m[1] || 'ohne Titel'}“: bitte im Editor selbst einsetzen (Bilder werden nicht aus dem Internet geladen).`); continue; }
    if (/^\|.*\|$/.test(l) && !sec) {
      flushPara(); const rows = []; let k = i; let head = false;
      while (k < lines.length && /^\s*\|.*\|\s*$/.test(lines[k])) { const r = lines[k].trim().slice(1, -1).split('|').map(c => c.trim()); if (r.every(c => /^:?-{2,}:?$/.test(c))) head = true; else rows.push(r.map(inline)); k++; }
      i = k - 1; const w = Math.max(...rows.map(r => r.length)); rows.forEach(r => { while (r.length < w) r.push(''); });
      push({ type: 'table', head, rows }, n); continue;
    }
    if (sec) { if (/^\s*\|.*\|\s*$/.test(raw)) { const r = l.slice(1, -1).split('|').map(c => c.trim()); if (!r.every(c => /^:?-{2,}:?$/.test(c))) sec.table.push(r); } else sec.lines.push([raw, n]); continue; }
    if (!st && !l) continue;
    if (!l) { flushPara(); continue; }
    if (!st && inHead) { doc.subtitle = doc.subtitle || l; continue; }
    para.push([raw, n]);
  }
  closeSec(); flushPara();
  if (!doc.title) H.err(1, 'Titel fehlt – die erste Zeile sollte „# Titel“ sein.');
  if (!doc.stations.length) H.err(1, 'Keine Station gefunden – Stationen beginnen mit „## Station: Titel“.');
  doc.stations.forEach(s => { if (!s.blocks.length) s.blocks.push({ id: uid(), type: 'text', html: '' }); });
  const all = doc.stations.flatMap(s => s.blocks);
  const stats = { stations: doc.stations.length, blocks: all.length, tasks: all.filter(b => ['task', 'quiz', 'gap', 'match'].includes(b.type) || (env.isCheck && env.isCheck(b))).length };
  return { doc, errors, warnings, stats };
}

/* ---------- Lernpfad → Text (zum Weitergeben an eine KI oder zum Nachlesen) ---------- */
export function docToText(doc, env) {
  const md = htmlToMd, L = [];
  const plug = {}; for (const p of env.plugins || []) for (const [k, t] of Object.entries(p.text || {})) if (t.type) plug[t.type] = { ...t, key: k };
  L.push(`# ${md(doc.title)}`);
  if (doc.subtitle) L.push(`Untertitel: ${md(doc.subtitle)}`);
  L.push(`Art: ${doc.form === 'challenge' ? 'Challenge' : 'Lernpfad'}`);
  if (doc.kicker) L.push(`Kopfzeile: ${md(doc.kicker)}`);
  L.push(`Farbe: ${env.palettes[doc.design.pal]?.n || 'Pastell'}`, `Schrift: ${doc.design.font}`);
  if (doc.goals?.length) { L.push('Ziele:'); doc.goals.forEach(g => L.push('- ' + md(g))); }
  if (doc.rank) L.push(`Rang: ${md(doc.rank)}`);
  if (doc.pointsOn) L.push('Punkte: ja');
  L.push(`Zertifikat: ${doc.cert?.on ? 'ja' : 'nein'}`);
  for (const s of doc.stations) {
    L.push('', `## Station: ${md(s.title)}${s.sub ? ' | ' + md(s.sub) : ''}`);
    for (const b of s.blocks) {
      L.push('');
      const key = Object.entries(env.figures).find(([k, F]) => F.src === b.img)?.[0];
      const figName = { ente: 'Ente', denken: 'Nachdenken', aha: 'Aha', achtung: 'Achtung' }[key] || 'Ente';
      switch (b.type) {
        case 'text': L.push(md(b.html)); break;
        case 'info': L.push(b.kind === 'figur' ? `[Figur: ${figName}] ${md(b.html)}` : `[${b.kind[0].toUpperCase() + b.kind.slice(1)}${b.title ? ': ' + md(b.title) : ''}] ${md(b.html)}`); break;
        case 'image': L.push(`![${b.caption || b.alt || 'Bild'}]()`); break;
        case 'table': L.push(...b.rows.map((r, k) => '| ' + r.map(md).join(' | ') + ' |' + (k === 0 && b.head ? '\n|' + r.map(() => ' --- ').join('|') + '|' : ''))); break;
        case 'reveal': L.push(`### Aufdecken: ${md(b.summary)}`, md(b.html)); break;
        case 'code': L.push('```' + (b.lang || ''), b.code, '```'); break;
        case 'uml': L.push(`### UML: ${b.name}`, ...b.attrs.map(a => '- ' + a), ...b.methods.map(a => '+ ' + a)); break;
        case 'html': L.push('### HTML', '```html', b.html, '```'); break;
        case 'task': L.push(`### Aufgabe: ${md(b.title)}`, md(b.html)); if (b.answer) L.push(`Antwort: ${b.answer}`); (b.tips || []).forEach(t => L.push(`Tipp: ${md(t)}`)); if (b.solution) L.push(`Lösung: ${md(b.solution).replace(/\n+/g, ' ')}`); L.push(`XP: ${b.xp}`); break;
        case 'quiz': L.push('### Quiz'); b.qs.forEach(q => { L.push(`? ${md(q.q)}`); q.opts.forEach(o => L.push(`[${o.ok ? 'x' : ' '}] ${md(o.t)}${o.fb ? ' // ' + md(o.fb) : ''}`)); }); break;
        case 'gap': L.push(`### Lückentext${b.title ? ': ' + md(b.title) : ''}`, md(b.html)); if (b.bank) L.push('Wortbank: ja'); if (b.extra?.length) L.push(`Extra: ${b.extra.join(', ')}`); break;
        case 'match': L.push(`### Zuordnen: ${md(b.title)}`, ...b.pairs.map(p => `${p.a} -> ${p.b}`)); break;
        case 'lock': L.push('--- Sperre ---'); break;
        case 'file': L.push(`%% Datei „${b.name}“ (nur im Editor)`); break;
        default: { const t = plug[b.type]; L.push(t?.toText ? t.toText(b, { md }) : `%% Baustein „${b.type}“ – im Textformat nicht darstellbar`); }
      }
    }
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

/* ---------- Anleitung für die KI ---------- */
export function formatHelp(env) {
  const extra = (env.plugins || []).flatMap(p => Object.values(p.text || {}).map(t => t.help).filter(Boolean));
  return `FORMAT (PathFinder-Text):
# Titel des Lernpfads
Untertitel: kurze Unterzeile
Art: Lernpfad            (oder: Challenge)
Farbe: ${env.palettes.map(p => p.n).join(' | ')}
Schrift: Pixel | schlicht | elegant
Ziele:
- Lernziel 1
- Lernziel 2

## Station: Titel der Station | kurze Unterzeile
Normaler Text. Leerzeile = neuer Absatz. **fett**, *kursiv*, \`Code\`, Listen mit „- “.

[Merke] Wichtiger Merksatz.          (auch: [Tipp], [Achtung], [Begriff: Wort], [Regel], [Abschluss])
[Figur: Aha] Eine Figur sagt etwas.  (Figuren: Ente, Nachdenken, Aha, Achtung)

### Aufgabe: Titel
Auftrag für die Schüler.
Antwort: 12,60          (optional: genaue Antwort → wird automatisch geprüft; Zahl oder kurzes Wort)
Tipp: erster Tipp       (beliebig viele Tipp-Zeilen, vom kleinen zum großen Tipp)
Lösung: Musterlösung
XP: 20

### Quiz
? Frage
[x] richtige Antwort // Rückmeldung (optional)
[ ] falsche Antwort // warum falsch
? zweite Frage …

### Lückentext: Titel
Satz mit [[Lücke]] und [[Antwort|andere erlaubte Antwort]].
Wortbank: ja            (optional: Begriffe zum Ziehen)
Extra: Ablenker, Ablenker   (optional: falsche Begriffe in der Wortbank)

### Zuordnen: Ordne zu
Begriff -> Erklärung
Begriff -> Erklärung

### Aufdecken: Mehr erfahren
Text, der erst nach Antippen erscheint.

### UML: Klassenname
- attribut: Typ
+ methode()

\`\`\`java
Programmcode (Sprache nach den drei Backticks)
\`\`\`

| Kopf | Kopf |
| --- | --- |
| Zelle | Zelle |

--- Sperre ---          (alles danach in der Station erst frei, wenn die Aufgabe davor gelöst ist)
${extra.length ? '\nZUSÄTZLICH IN DIESER APP:\n' + extra.join('\n\n') + '\n' : ''}`;
}
export function promptFor(info, env) {
  const f = (k, d) => (info[k] || '').trim() || d;
  return `Du erstellst einen interaktiven Lernpfad für die Plattform PathFinder${env.appName && env.appName !== 'PathFinder' ? ` (App: ${env.appName})` : ''}.

THEMA: ${f('thema', '[bitte Thema eintragen]')}
ZIELGRUPPE: ${f('klasse', '[Jahrgangsstufe / Schulart]')}
UMFANG: ${f('umfang', 'etwa 4 Stationen, ca. 45 Minuten')}
${info.extra?.trim() ? 'BESONDERE WÜNSCHE: ' + info.extra.trim() + '\n' : ''}
REGELN
- Antworte NUR mit dem Lernpfad im unten beschriebenen Format, in einem einzigen Codeblock (\`\`\`text … \`\`\`), ohne Erklärungen davor oder danach.
- Sprache: Deutsch, Schüler werden mit „du“ angesprochen, kurze Sätze.
- Jede Station: kurzer Einstieg, dann Erklärung, dann mindestens eine Übung (Aufgabe, Quiz, Lückentext oder Zuordnen).
- Aufgaben mit eindeutiger Lösung bekommen eine „Antwort:“-Zeile, damit sie automatisch geprüft werden.
- Tipps bauen aufeinander auf: zuerst ein kleiner Denkanstoß, zuletzt fast die Lösung.
- Beim Quiz: 3–4 Antworten, genau eine oder mehrere mit [x], zu falschen Antworten eine kurze Rückmeldung.
- Verwende keine Bilder aus dem Internet.

${formatHelp(env)}`;
}
