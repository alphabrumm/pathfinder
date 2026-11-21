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
//   app   { files:[{name,text}], sig, at, run:{ output, error, at, sig } } – Stand aus der App (JPad …), siehe pfapp.js;
//         Aufgaben mit demselben „project“ teilen sich den Stand (er steht dann bei jeder dieser Aufgaben)

export const EXAM_TYPES = new Set(['task', 'quiz', 'gap', 'match', 'essay', 'mark', 'sort', 'order', 'app']);
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
/** Lückenpaare, die zusammen eine ganze Gleichung bilden („[[3x]] = [[9]]“, davor nichts außer z. B. „I + II:“, dahinter Zeilenende):
 *  dort ist auch die vertauschte Reihenfolge richtig (9 = 3x). Liefert [[i, j], …] */
export function gapSwaps(html) {
  const s = String(html || '').replace(/&nbsp;|\u00a0/g, ' '), m = [...s.matchAll(/\[\[(.+?)\]\]/g)], out = [];
  const startOk = t => { t = t.replace(/\s+$/, ''); return !t || /(<(?!\/?su[bp]\b)[^>]*>|[:;,|⇒⇔→])$/.test(t); };
  const endOk = t => { t = t.replace(/^\s+/, ''); return !t || /^(<(?!su[bp]\b)|[,;.|⇒⇔→])/.test(t); };
  for (let i = 0; i + 1 < m.length; i++) {
    const a = m[i], b = m[i + 1], ea = a.index + a[0].length, eb = b.index + b[0].length;
    if (/^\s*=\s*$/.test(s.slice(ea, b.index)) && startOk(s.slice(0, a.index)) && endOk(s.slice(eb))) { out.push([i, i + 1]); i++; }
  }
  return out;
}
/** je Lücke richtig/falsch; ok(i, v) prüft Antwort v für Lücke i. Vertauschte Seiten einer Gleichung zählen als richtig. */
export function gapOks(html, n, given, ok) {
  const r = Array.from({ length: n }, (_, i) => ok(i, given?.[i]));
  for (const [i, j] of gapSwaps(html)) if (!(r[i] && r[j]) && ok(i, given?.[j]) && ok(j, given?.[i])) r[i] = r[j] = true;
  return r;
}
export const normAns = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
/** Antwort prüfen: Text ohne Groß/Klein und Leerzeichen, Zahlen auch mit Komma und kleinen Rundungsunterschieden (wie im Lernpfad) */
export function isAnswer(expected, v) {
  if (String(v ?? '').trim() === '') return false;
  const num = x => { const t = String(x).trim().replace(/\s|€|%/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); return /^[-+]?\d*\.?\d+$/.test(t) ? parseFloat(t) : NaN; };
  return String(expected || '').split('|').some(e => { const a = num(e), b = num(v); if (!isNaN(a) && !isNaN(b)) return Math.abs(a - b) <= Math.max(1e-9, Math.abs(a) * 1e-9, 0.005); return normAns(e) === normAns(v); });
}
/** Markieren: Wörter des Textes (wie markParse in pathfinder.js) und die Indizes der Zielwörter in {{…}} */
export function markWords(html) {
  const words = [], targets = []; let on = false;
  for (const part of String(html || '').split(/(<[^>]*>)/)) {
    if (part.startsWith('<')) continue;
    for (const m of part.matchAll(/&[#\w]+;|\{\{|\}\}|[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)) {
      if (m[0] === '{{') on = true; else if (m[0] === '}}') on = false; else if (m[0][0] !== '&') { if (on) targets.push(words.length); words.push(m[0]); }
    }
  }
  return { words, targets };
}
const ordNorm = t => strip(t).replace(/\s+/g, ' ').trim().toLowerCase();
/** längste gemeinsame Teilfolge: welche Stellen der Lösung sol stehen in der Eingabe g in richtiger Reihenfolge? */
function lcsHits(sol, g) {
  const n = sol.length, m = g.length, D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) D[i][j] = sol[i] === g[j] ? D[i + 1][j + 1] + 1 : Math.max(D[i + 1][j], D[i][j + 1]);
  const hit = new Array(n).fill(false); let i = 0, j = 0;
  while (i < n && j < m) { if (sol[i] === g[j]) { hit[i] = true; i++; j++; } else if (D[i + 1][j] >= D[i][j + 1]) i++; else j++; }
  return hit;
}
/** Teilpunkte: auf halbe Punkte abrunden */
export const halfFloor = x => Math.floor(x * 2 + 1e-9) / 2;

/* ---------- App-Aufgaben (JPad …): Ausgabe und Pflicht-Code prüfen ---------- */
const APP_NAMES = { jpad: 'JPad', qpad: 'QPad', flowpad: 'FlowPad' };
export const appName = a => APP_NAMES[a] || a || 'App';
const normOut = s => String(s ?? '').replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').trim();
const squash = s => normOut(s).replace(/\s+/g, ' ');
/** Kommentare weglassen, damit „Muss: while“ nicht schon in einem Kommentar erfüllt ist */
const noComments = (s, sql) => { s = String(s ?? '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1'); return sql ? s.replace(/--[^\n]*/g, ' ') : s; };
/** Teilprüfungen einer App-Aufgabe: Ausgabe (enthält / genau gleich) und Pflicht-Code */
export function appParts(t, a) {
  const parts = [], run = a?.run, code = noComments((a?.files || []).map(f => f.text).join('\n'), t.app === 'qpad');
  if (t.expect) {
    const want = t.expect, out = run?.output ?? '';
    const ok = !!run && !run.error && (t.compare === 'gleich' ? normOut(out) === normOut(want) : squash(out).includes(squash(want)));
    const given = !run ? 'Programm nie ausgeführt' : run.error ? 'mit Fehler abgebrochen' : (squash(out).slice(0, 80) + (squash(out).length > 80 ? '…' : '')) || '(keine Ausgabe)';
    parts.push({ label: t.compare === 'gleich' ? 'Ausgabe (genau)' : 'Ausgabe enthält', given, ok, expected: squash(want) });
  }
  for (const n of (t.needs || []).filter(Boolean)) { const ok = code.includes(n); parts.push({ label: `Code enthält „${n}“`, given: ok ? 'ja' : 'nein', ok, expected: 'ja' }); }
  return parts;
}
/** Stand einer App-Aufgabe als lesbarer Text (Korrektur, Protokoll, Ergebnisseite) */
export function appText(a) {
  const files = a?.files || [];
  if (!files.length) return '';
  let s = files.map(f => (files.length > 1 ? `// ── ${f.name} ──\n` : '') + String(f.text).replace(/\s+$/, '')).join('\n\n');
  const r = a.run;
  if (r) s += `\n\n▶ Letzter Programmlauf${r.error ? ' (mit Fehler abgebrochen)' : ''}:\n${String(r.output || '').replace(/\s+$/, '') || '(keine Ausgabe)'}`;
  else s += '\n\n▶ Programm wurde nie ausgeführt.';
  if (r && a.sig && r.sig && r.sig !== a.sig) s += '\n⚠ Der Code wurde nach diesem Programmlauf noch geändert.';
  return s;
}
/** Wie wird eine App-Aufgabe bewertet? 'rubric' (Lehrkraft mit Erwartungshorizont), 'auto' (Ausgabe/Pflicht-Code), 'free' (Lehrkraft) */
export const appMode = t => (t.rubric || []).length ? 'rubric' : (t.expect || (t.needs || []).some(Boolean)) ? 'auto' : 'free';

/** Art der Bewertung eines Prüfungsbausteins */
export function taskKind(b) {
  if (b.type === 'task') return b.answer || b.short ? 'short' : 'free';
  if (b.type === 'essay') return 'free';
  if (b.type === 'app') return 'app';
  return b.type;
}
/** Kurzer Titel einer Aufgabe für Listen und Protokolle */
export function taskTitle(b) {
  if (b.title && strip(b.title)) return strip(b.title);
  if (b.type === 'quiz') return (b.qs || []).length > 1 ? `Quiz (${b.qs.length} Fragen)` : strip(b.qs?.[0]?.q).slice(0, 60) || 'Quiz';
  if (b.type === 'gap') return 'Lückentext';
  if (b.type === 'match') return 'Zuordnen';
  if (b.type === 'essay') return 'Freitext';
  if (b.type === 'mark') return 'Markieren';
  if (b.type === 'sort') return 'Sortieren';
  if (b.type === 'order') return b.words ? 'Satzpuzzle' : 'Reihenfolge';
  if (b.type === 'app') return `${appName(b.app)}-Aufgabe`;
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
    goals: [], rank: '', anim: d.anim || {}, typeLines: d.typeLines || [], pointsOn: true, ...(d.pages === 'stationen' ? { pages: 'stationen' } : {}),
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
      } else if (b.type === 'mark') {
        const { words, targets } = markWords(b.html);
        out.blocks.push({ id: b.id, type: 'mark', pts, title: b.title || '', html: String(b.html || '').replace(/\{\{|\}\}/g, '') });
        tasks.push({ id: b.id, type: 'mark', pts, title, words, targets });
        if (!targets.length) warnings.push(`Markieren „${title}“ hat kein Zielwort {{…}}.`);
      } else if (b.type === 'sort') {
        const items = []; (b.groups || []).forEach((g, gi) => (g.items || []).forEach(t => { if (String(t).trim()) items.push({ k: rid(), t: String(t), g: gi }); }));
        const groups = (b.groups || []).map(g => g.name || '');
        out.blocks.push({ id: b.id, type: 'sort', pts, title: b.title || '', gnames: groups, sitems: shuffle(items.map(x => ({ k: x.k, t: x.t }))) });
        tasks.push({ id: b.id, type: 'sort', pts, title, groups, items });
        if (groups.length < 2 || !items.length) warnings.push(`Sortieren „${title}“ braucht mindestens zwei Gruppen mit Begriffen.`);
      } else if (b.type === 'order') {
        const pool = (b.items || []).map(t => ({ k: rid(), t: String(t) }));
        out.blocks.push({ id: b.id, type: 'order', pts, title: b.title || '', words: !!b.words, opool: shuffle(pool) });
        tasks.push({ id: b.id, type: 'order', pts, title, words: !!b.words, pool, items: (b.items || []).map(String), alts: (b.alts || []).map(a => a.map(String)) });
        if (pool.length < 2) warnings.push(`${b.words ? 'Satzpuzzle' : 'Reihenfolge'} „${title}“ braucht mindestens zwei Teile.`);
      } else if (b.type === 'task') {
        const short = !!b.answer;
        out.blocks.push({ id: b.id, type: 'task', pts, title: b.title || '', html: b.html || '', img: b.img || '', ...(short ? { short: true, answerPh: b.answerPh || '' } : {}) });
        tasks.push({ id: b.id, type: 'task', pts, title, short, answer: b.answer || '', solution: b.solution || '' });
      } else if (b.type === 'essay') {
        out.blocks.push({ id: b.id, type: 'essay', pts, title: b.title || '', html: b.html || '', img: b.img || '', lines: b.lines || 6 });
        tasks.push({ id: b.id, type: 'essay', pts, title, rubric: (b.rubric || []).map(r => ({ t: r.t || '', p: +r.p || 0 })), solution: b.solution || '' });
      } else if (b.type === 'app') {
        // Startcode gehört zur Aufgabe; erwartete Ausgabe, Pflicht-Code, Erwartungshorizont und Musterlösung nicht
        const files = (b.files || []).filter(f => f && (f.text || '').trim()).map(f => ({ name: String(f.name || ''), text: String(f.text) }));
        out.blocks.push({ id: b.id, type: 'app', pts, app: b.app || 'jpad', title: b.title || '', html: b.html || '', img: b.img || '', files, ...(b.project ? { project: String(b.project) } : {}) });
        const t = { id: b.id, type: 'app', pts, title, app: b.app || 'jpad', expect: b.expect || '', compare: b.compare === 'gleich' ? 'gleich' : 'enthaelt', needs: (b.needs || []).filter(Boolean), rubric: (b.rubric || []).map(r => ({ t: r.t || '', p: +r.p || 0 })), solution: b.solution || '', files };
        tasks.push(t);
        if (appMode(t) === 'free') warnings.push(`${title}: ohne erwartete Ausgabe, Pflicht-Code oder Erwartungshorizont – du bewertest sie nach der Abgabe von Hand.`);
      } else if (SAFE_TYPES.has(b.type) || b.type === 'heading') {
        const c = clone(b); delete c.anim; out.blocks.push(c);
      } else if (b.type === 'page') {
        out.blocks.push({ id: b.id, type: 'page' }); // Seitenumbruch
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
      const oks = gapOks(t.html, t.gaps.length, a, (i, g) => { g = g ?? ''; const all = t.gaps[i].concat(acc[i] || []); return String(g).trim() !== '' && (t.bank ? all.some(x => normAns(x) === normAns(g)) : isAnswer(all.join('|'), g)); });
      t.gaps.forEach((alts, i) => it.parts.push({ label: `Lücke ${i + 1}`, given: String(a?.[i] ?? ''), ok: oks[i], expected: alts.join(' oder ') }));
    } else if (t.type === 'match') {
      t.pairs.forEach(p => {
        const g = a?.[p.kb], got = t.pairs.find(x => x.ka === g);
        it.parts.push({ label: strip(p.b), given: got ? strip(got.a) : '', ok: g === p.ka, expected: strip(p.a) });
      });
    } else if (t.type === 'mark') {
      const sel = new Set(Object.keys(a || {}).filter(k => a[k]).map(Number)), tg = new Set(t.targets);
      t.targets.forEach(i => it.parts.push({ label: t.words[i], given: sel.has(i) ? 'markiert' : 'nicht markiert', ok: sel.has(i), expected: 'markieren' }));
      [...sel].filter(i => !tg.has(i)).sort((x, y) => x - y).forEach(i => it.parts.push({ label: t.words[i] ?? `Wort ${i + 1}`, given: 'markiert', ok: false, expected: 'nicht markieren' }));
    } else if (t.type === 'sort') {
      t.items.forEach(x => { const g = a?.[x.k]; it.parts.push({ label: strip(x.t), given: g != null ? strip(t.groups[g] ?? '') : '', ok: g === x.g, expected: strip(t.groups[x.g]) }); });
    } else if (t.type === 'order') {
      const byK = Object.fromEntries(t.pool.map(x => [x.k, x.t])), seq = (Array.isArray(a) ? a : []).map(k => byK[k]).filter(x => x != null), g = seq.map(ordNorm);
      let best = null;
      for (const s of [t.items, ...(t.alts || [])]) { const hit = lcsHits(s.map(ordNorm), g), n = hit.filter(Boolean).length; if (!best || n > best.n) best = { s, hit, n }; }
      best.s.forEach((x, i) => { const p = g.indexOf(ordNorm(x)); it.parts.push({ label: strip(x), given: p < 0 ? '' : `an Stelle ${p + 1}`, ok: best.hit[i], expected: `an Stelle ${i + 1}` }); });
      it.answer = seq.map(strip).join(t.words ? ' ' : ' | ').replace(/^./, c => t.words ? c.toUpperCase() : c);
    } else if (t.type === 'task' && t.short) {
      const g = typeof a === 'string' ? a : '';
      it.parts.push({ label: 'Antwort', given: g, ok: isAnswer([t.answer].concat(acc[0] || []).join('|'), g), expected: String(t.answer).split('|').join(' oder ') });
    } else if (t.type === 'app') {
      it.text = appText(a); it.app = t.app; it.files = a?.files || [];
      it.parts = appParts(t, a);
      if (appMode(t) !== 'auto') {
        it.auto = false;
        const m = opt.manual?.[t.id];
        if (m == null) { it.open = true; it.pts = null; } else it.pts = Math.max(0, Math.min(t.pts, +m || 0));
        // Vorschlag aus den automatischen Prüfungen (nur Hilfe für die Lehrkraft)
        if (it.parts.length) it.suggest = halfFloor(t.pts * it.parts.filter(p => p.ok).length / it.parts.length);
      }
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
