/* PathFinder – Lernpfade bauen, im Browser, ohne Server.
 *
 * Ein Lernpfad ist ein Dokument (JSON) aus Stationen mit Bausteinen. Daraus entsteht die Seite –
 * im Bearbeiten-Modus mit Werkzeugen, in der Vorschau genau so, wie sie Schüler sehen.
 * Gespeichert wird lokal im Browser (localStorage).
 *
 * Der Kern kennt keine App. Apps wie FlowPad, JPad oder QPad stecken eigene Bausteine als
 * Erweiterung dazu:  startPathFinder({ plugins: [flowpadPlugin], host: { … } })
 *
 * Eine Erweiterung ist ein Objekt
 *   { id, name, blocks: { typ: Baustein }, fields: { feldtyp: Feld }, migrate(block), css }
 * Ein Baustein: { n: Name, ic: Symbol, g: Gruppe, h: Hinweis, make(): Startwerte, alias?: gespeicherter Typ,
 *   render(b, ctx) → HTML, form: [Felder für ⚙], check?(b) → zählt als Aufgabe, run?(aktion, b, ctx), label?(b) }
 * Ein Feld (für ⚙): { html(f, wert, b, ctx), input?(ziel, b, neuZeichnen), click?(dataset, b, neuZeichnen) }
 * host (Verbindung zur App, alles optional): u. a. adopt(html, titel) → „In dieses Projekt übernehmen“,
 *   exportProject(html, titel) → Export „Als App-Projekt exportieren“ (Projektdatei mit Lernpfad und Code), exportProjectHelp
 */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent; };
const QUIZ_SALT = String(Math.random()).slice(2, 8); // Quiz-Antworten je Seitenaufruf anders gemischt
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };

/* ---------- Design ---------- */
export const PALETTES = [
  { n: 'Pastell', l: { bg: '#fdf8f3', surface: '#fff', 'surface-2': '#f7edf2', ink: '#2a2340', 'ink-2': '#6c6280', line: '#eedbe4', a1: '#5b6fc2', a1s: '#b9cdf5', a2: '#c75a8c', a2s: '#f6c3d8', a3: '#f6bf3a', a3d: '#d99a0b', a3s: '#fdf0cf', a3ink: '#2b2300', g1: '#b9cdf5', g2: '#f6c3d8', g3: '#fbd98a', heroink: '#2a2340' } },
  { n: 'Meer', l: { bg: '#f3f8fa', surface: '#fff', 'surface-2': '#e6f1f5', ink: '#14303d', 'ink-2': '#55707c', line: '#d3e5ec', a1: '#1f6f8b', a1s: '#a9dbe8', a2: '#0f9d8a', a2s: '#bfece5', a3: '#f2c879', a3d: '#c99a3c', a3s: '#fbf0d9', a3ink: '#33250a', g1: '#8fd3e8', g2: '#bfece5', g3: '#f7e2b3', heroink: '#10303b' } },
  { n: 'Wald', l: { bg: '#f6f7f0', surface: '#fff', 'surface-2': '#ecefe1', ink: '#22301f', 'ink-2': '#5f6b58', line: '#dde3cd', a1: '#3e7a3a', a1s: '#c4e0b5', a2: '#9a6b2f', a2s: '#ecd9b8', a3: '#e7c14f', a3d: '#b38f1c', a3s: '#f7efcf', a3ink: '#2c2400', g1: '#c4e0b5', g2: '#e3ebc4', g3: '#f3dfa0', heroink: '#22301f' } },
  { n: 'Sonnenuntergang', l: { bg: '#fff7f1', surface: '#fff', 'surface-2': '#fdebe0', ink: '#3a1f2b', 'ink-2': '#7a5a62', line: '#f6d9c9', a1: '#c2410c', a1s: '#fdc9a8', a2: '#9d2b6b', a2s: '#f4bdd6', a3: '#fbbf24', a3d: '#d68f00', a3s: '#fff0c8', a3ink: '#2e2100', g1: '#fdba8c', g2: '#f9a8c9', g3: '#c4a5f0', heroink: '#3a1f2b' } },
  { n: 'Lavendel', l: { bg: '#f8f6fd', surface: '#fff', 'surface-2': '#efebfb', ink: '#2b2545', 'ink-2': '#6b6588', line: '#e2dcf5', a1: '#6d4fc4', a1s: '#d4c8f6', a2: '#2f9e86', a2s: '#c2eadf', a3: '#a6e3c7', a3d: '#4fae86', a3s: '#e4f6ee', a3ink: '#11372a', g1: '#d4c8f6', g2: '#e9d5f7', g3: '#c2eadf', heroink: '#2b2545' } },
  { n: 'Bonbon', l: { bg: '#fff8fb', surface: '#fff', 'surface-2': '#ffeef6', ink: '#3b2340', 'ink-2': '#7d6283', line: '#fbdbe9', a1: '#e0458f', a1s: '#ffc6de', a2: '#16a3a3', a2s: '#bdf0ee', a3: '#fde047', a3d: '#d6b400', a3s: '#fff8c7', a3ink: '#332a00', g1: '#ffc6de', g2: '#bdf0ee', g3: '#fff19a', heroink: '#3b2340' } },
  { n: 'Papier', l: { bg: '#faf6ee', surface: '#fffdf8', 'surface-2': '#f3ecdf', ink: '#2f2a24', 'ink-2': '#6f6558', line: '#e7dccb', a1: '#8c3b2e', a1s: '#ead1c6', a2: '#2e5a6b', a2s: '#c9dde4', a3: '#d9b56a', a3d: '#a8822f', a3s: '#f5ead1', a3ink: '#2c2208', g1: '#efe3cc', g2: '#e8d6c4', g3: '#dfe6e0', heroink: '#2f2a24' } },
  { n: 'Schiefer', l: { bg: '#f4f6f8', surface: '#fff', 'surface-2': '#e9edf1', ink: '#1e2833', 'ink-2': '#5b6876', line: '#d9e0e7', a1: '#34506b', a1s: '#c4d3e2', a2: '#e0662f', a2s: '#fbd2bf', a3: '#f59e0b', a3d: '#c27c00', a3s: '#fdecc8', a3ink: '#2a1c00', g1: '#c4d3e2', g2: '#dde4ea', g3: '#fbd2bf', heroink: '#1e2833' } },
  { n: 'Retro-Arcade', l: { bg: '#14112b', surface: '#1e1a3d', 'surface-2': '#2a2552', ink: '#f2eeff', 'ink-2': '#b3aad8', line: '#3a3470', a1: '#29e0ff', a1s: '#123d55', a2: '#ff3fb4', a2s: '#4a1440', a3: '#ffe23f', a3d: '#c9a800', a3s: '#3a3410', a3ink: '#1a1600', g1: '#3b1f7a', g2: '#9a1f7a', g3: '#e05a2a', heroink: '#ffffff' } },
  { n: 'Terminal', l: { bg: '#0d1410', surface: '#121c16', 'surface-2': '#18261d', ink: '#d9f7e3', 'ink-2': '#8fb79c', line: '#1f3328', a1: '#4ade80', a1s: '#143322', a2: '#38bdf8', a2s: '#0f2c3a', a3: '#a3e635', a3d: '#6c9d1a', a3s: '#1d2a10', a3ink: '#0b1400', g1: '#0f2e1c', g2: '#123b2a', g3: '#1d4a20', heroink: '#d9f7e3' } },
];
const FONTS = {
  pixel: { n: 'Pixel', d: '"Pixelify Sans", "Courier New", monospace', w: 700, ls: '0' },
  schlicht: { n: 'Schlicht', d: '"Atkinson Hyperlegible", -apple-system, system-ui, sans-serif', w: 700, ls: '-.01em' },
  elegant: { n: 'Elegant', d: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', w: 600, ls: '.005em' },
  hand: { n: 'Handwriting', d: '"Caveat", "Bradley Hand", "Segoe Print", cursive', w: 700, ls: '0' },
};
const INFO_KINDS = { merke: ['💡', 'Merke'], tipp: ['👉', 'Tipp'], achtung: ['⚠️', 'Achtung'], begriff: ['📘', 'Begriff'], regel: ['📏', 'Regel'], figur: ['🗨', 'Figur sagt'], abschluss: ['🏁', 'Abschluss'] };
const ANIMS = { tippen: 'Schreibmaschine', einblenden: 'Einblenden', glitch: 'Glitch', leuchten: 'Leuchten' };
const ANIM_OPTS = [['', 'keine'], ...Object.entries(ANIMS)];

/* ---------- Bausteine des Kerns ---------- */
const CORE = {
  text: { n: 'Text', ic: '¶', g: 'Grundbausteine', h: 'Absatz mit fett, kursiv, Code, Link', make: () => ({ html: '' }) },
  heading: { n: 'Zwischenüberschrift', ic: 'H', g: 'Grundbausteine', h: 'Überschrift innerhalb einer Station', alias: 'text', skinOnly: true, make: () => ({ html: '', tag: 'h3' }) },
  info: { n: 'Infokasten', ic: '💡', g: 'Grundbausteine', h: 'Merke, Tipp, Regel, Figur sagt …', make: () => ({ kind: 'merke', title: '', html: '', img: '', name: '' }) },
  figur: { n: 'Figur sagt', ic: '🗨', g: 'Grundbausteine', h: 'Figur mit Bild und Sprechblase', alias: 'info', make: () => ({ kind: 'figur', title: '', html: '', img: FIGURES.pfadiAha.src, name: 'Pfadi' }) },
  image: { n: 'Bild / GIF', ic: '🖼', g: 'Grundbausteine', h: 'mit Bildunterschrift', make: () => ({ src: '', alt: '', caption: '', size: 'voll' }) },
  table: { n: 'Tabelle', ic: '▤', g: 'Grundbausteine', h: 'Text-Tabelle zum Nachschlagen', make: () => ({ head: true, rows: [['Spalte 1', 'Spalte 2'], ['', '']] }) },
  reveal: { n: 'Aufdecken', ic: '▸', g: 'Grundbausteine', h: 'Klappbox, z. B. „Mehr erfahren“', make: () => ({ summary: 'Mehr erfahren', html: '' }) },
  file: { n: 'Datei', ic: '📎', g: 'Grundbausteine', h: 'zum Herunterladen, z. B. Vorlage', make: () => ({ name: '', data: '', html: '' }) },
  code: { n: 'Code', ic: '{ }', g: 'Grundbausteine', h: 'Programmcode mit Kopierknopf', make: () => ({ lang: 'java', code: '' }) },
  uml: { n: 'UML-Klasse', ic: '▭', g: 'Grundbausteine', h: 'Klassenkarte mit Attributen und Methoden', make: () => ({ name: 'Hund', attrs: ['name: String'], methods: ['bellen()'] }) },
  html: { n: 'HTML', ic: '</>', g: 'Grundbausteine', h: 'freies HTML, z. B. GeoGebra', make: () => ({ html: '' }) },
  task: { n: 'Aufgabe', ic: '✎', g: 'Aufgaben', h: 'Auftrag mit Tipps, Lösung, Haken', make: () => ({ title: '', html: '', xp: 20, tips: [], solution: '', img: '' }) },
  quiz: { n: 'Quiz', ic: '?', g: 'Aufgaben', h: 'eine oder mehrere Fragen mit Rückmeldung', make: () => ({ qs: [{ q: '', opts: [{ t: '', ok: true, fb: '' }, { t: '', ok: false, fb: '' }, { t: '', ok: false, fb: '' }] }], xp: 10 }) },
  gap: { n: 'Lückentext', ic: '▭', g: 'Aufgaben', h: 'Lücken als [[Antwort]], auch mit Begriffen zum Ziehen', make: () => ({ html: 'Das Wort in der Lücke ist [[richtig]].', bank: false, extra: [], heft: false, title: '', sub: '', xp: 10 }) },
  match: { n: 'Zuordnen', ic: '⇄', g: 'Aufgaben', h: 'Paare per Drag & Drop', make: () => ({ title: 'Ordne zu', pairs: [{ a: '', b: '' }, { a: '', b: '' }], xp: 10 }) },
  lock: { n: 'Sperre', ic: '🔒', g: 'Ablauf', h: 'Ab hier erst frei, wenn … gelöst', make: () => ({ after: '' }) },
};
const CORE_CHECK = new Set(['task', 'quiz', 'gap', 'match']);



/* ---------- Syntaxhervorhebung für Code-Bausteine (Schüleransicht) ---------- */
const HL_KW = {
  java: 'abstract boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long new null package private protected public return short static super switch this throw throws true false try void while var',
  python: 'and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print',
  sql: 'select from where and or not insert into values update set delete create table drop alter join inner left right outer on group by order having as distinct count sum avg min max like in is null between limit asc desc primary key',
};
const HL_SETS = {};
export function highlightCode(code, lang) {
  const L = String(lang || '').toLowerCase(), kw = HL_KW[L];
  if (!kw) return esc(code);
  const set = HL_SETS[L] || (HL_SETS[L] = new Set(kw.split(' ')));
  const sql = L === 'sql', py = L === 'python';
  const re = py ? /(#.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_äöüÄÖÜß]\w*)/gm
    : sql ? /(--.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_äöüÄÖÜß]\w*)/gm
      : /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_äöüÄÖÜß][\wäöüÄÖÜß]*)/gm;
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index)); last = re.lastIndex;
    const t = esc(m[0]);
    if (m[1]) out += `<span class="hl-com">${t}</span>`;
    else if (m[2]) out += `<span class="hl-str">${t}</span>`;
    else if (m[3]) out += `<span class="hl-num">${t}</span>`;
    else {
      const w = m[0];
      if (set.has(sql ? w.toLowerCase() : w)) out += `<span class="hl-kw">${t}</span>`;
      else if (!sql && /^\s*\(/.test(code.slice(re.lastIndex)) && !/^[A-Z]/.test(w)) out += `<span class="hl-fn">${t}</span>`;
      else if (!sql && /^[A-Z]/.test(w)) out += `<span class="hl-ty">${t}</span>`;
      else out += t;
    }
  }
  return out + esc(code.slice(last));
}

/* ---------- Kleiner PDF-Schreiber (für das Zertifikat; alles lokal, keine Bibliothek) ---------- */
const WIN = { '€': 128, '‚': 130, '„': 132, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '™': 153 };
function pdfStr(t) {
  let o = ''; for (const ch of String(t ?? '')) { const c = ch.codePointAt(0); let b = c < 128 || (c >= 160 && c < 256) ? c : WIN[ch]; if (b == null) continue; const x = String.fromCharCode(b); o += x === '(' || x === ')' || x === '\\' ? '\\' + x : x; }
  return '(' + o + ')';
}
function rgb(hex) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(v => +v.toFixed(3)).join(' '); }
const measureCtx = (() => { let c; return () => c || (c = document.createElement('canvas').getContext('2d')); })();
function textW(t, size, bold) { const c = measureCtx(); c.font = `${bold ? 'bold ' : ''}${size}px Helvetica, Arial, sans-serif`; return c.measureText(String(t).replace(/[^\u0000-ɏ€„“”‚‘’…–—•]/gu, '')).width; }
function fitText(t, size, bold, w) { t = String(t); if (textW(t, size, bold) <= w) return t; while (t.length > 1 && textW(t + '…', size, bold) > w) t = t.slice(0, -1); return t.trim() + '…'; }
function wrapText(t, size, bold, w) { const out = []; let line = ''; for (const word of String(t).split(/\s+/)) { const tr = line ? line + ' ' + word : word; if (textW(tr, size, bold) > w && line) { out.push(line); line = word; } else line = tr; } if (line) out.push(line); return out; }
class Pdf {
  constructor() { this.ops = []; this.img = null; }
  color(hex, stroke) { this.ops.push(`${rgb(hex)} ${stroke ? 'RG' : 'rg'}`); return this; }
  rect(x, y, w, h, fill, stroke, lw = 1) { if (fill) this.color(fill); if (stroke) { this.color(stroke, true); this.ops.push(`${lw} w`); } this.ops.push(`${x} ${842 - y - h} ${w} ${h} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`); return this; }
  line(x1, y1, x2, y2, col, lw = 1) { this.color(col, true); this.ops.push(`${lw} w ${x1} ${842 - y1} m ${x2} ${842 - y2} l S`); return this; }
  text(t, x, y, size, { bold, col = '#222222', align = 'left', spacing = 0 } = {}) {
    const w = textW(t, size, bold) + spacing * Math.max(0, [...String(t)].length - 1);
    const xx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    this.color(col); this.ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${spacing} Tc ${xx.toFixed(2)} ${(842 - y).toFixed(2)} Td ${pdfStr(t)} Tj ET`); return this;
  }
  image(jpeg, x, y, w, h) { this.img = jpeg; this.ops.push(`q ${w} 0 0 ${h} ${x} ${842 - y - h} cm /Im1 Do Q`); return this; }
  bytes() {
    const objs = [];
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${this.img ? ' /XObject << /Im1 7 0 R >>' : ''} >> /Contents 6 0 R >>`);
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const cs = this.ops.join('\n'); objs.push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
    if (this.img) objs.push(`<< /Type /XObject /Subtype /Image /Width ${this.img.w} /Height ${this.img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${this.img.data.length} >>\nstream\n${this.img.data}\nendstream`);
    let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'; const off = [];
    objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info << /Producer (PathFinder) >> >>\nstartxref\n${xref}\n%%EOF`;
    const b = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) b[i] = out.charCodeAt(i) & 255; return b;
  }
}
/** Bild (auch SVG/GIF) als JPEG auf weißem Grund – für das PDF */
function jpegOf(src, size = 240) {
  return new Promise(res => {
    if (!src) return res(null);
    const im = new Image(); im.onload = () => {
      try { const r = Math.min(size / (im.naturalWidth || size), size / (im.naturalHeight || size)); const w = Math.max(1, Math.round((im.naturalWidth || size) * r)), h = Math.max(1, Math.round((im.naturalHeight || size) * r));
        const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
        res({ w, h, data: atob(c.toDataURL('image/jpeg', 0.9).split(',')[1]) }); } catch (e) { res(null); }
    }; im.onerror = () => res(null); im.src = src;
  });
}
/** kurzer Prüfcode aus den Angaben des Zertifikats (erkennt nachträglich geänderte Werte) */
function certCode(parts) {
  let h = 2166136261; for (const ch of parts.join('|')) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) { c += A[h % 32]; h = Math.floor(h / 32) ^ (i * 2654435761 >>> 0); h >>>= 0; }
  return c.slice(0, 3) + '-' + c.slice(3);
}

/* ---------- Standard-Figuren für „Figur sagt“ (Pixel-Stil, passend zur Ente) ---------- */
const FIGURES = {
  pfadiAha: { n: 'Pfadi: Aha!', name: 'Pfadi', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cellipse%20cx%3D%2246%22%20cy%3D%2288%22%20rx%3D%2226%22%20ry%3D%225%22%20fill%3D%22%23000%22%20opacity%3D%22.08%22%2F%3E%3Cpath%20d%3D%22M46%2026c21%200%2032%2015%2032%2033s-10%2028-32%2028-32-10-32-28%2011-33%2032-33z%22%20fill%3D%22%239B8AFB%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223.5%22%2F%3E%3Cpath%20d%3D%22M30%2070c4%209%2028%209%2032%200%22%20fill%3D%22%23C9C0FF%22%20opacity%3D%22.7%22%2F%3E%3Cpath%20d%3D%22M30%2030q-4-9%202-12M60%2030q4-9-2-12%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2218%22%20r%3D%223.5%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2258%22%20cy%3D%2218%22%20r%3D%223.5%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Cpath%20d%3D%22M29%2055q7-8%2014%200M49%2055q7-8%2014%200%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M34%2064q12%2017%2024%200z%22%20fill%3D%22%236B2E5E%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2225%22%20cy%3D%2264%22%20rx%3D%224.5%22%20ry%3D%222.8%22%20fill%3D%22%23F49AC1%22%2F%3E%3Cellipse%20cx%3D%2267%22%20cy%3D%2264%22%20rx%3D%224.5%22%20ry%3D%222.8%22%20fill%3D%22%23F49AC1%22%2F%3E%3Cg%20transform%3D%22translate%2882%2022%29%22%3E%3Cpath%20d%3D%22M0-16a12%2012%200%200%201%207%2022v4h-14v-4A12%2012%200%200%201%200-16z%22%20fill%3D%22%23FFF3A6%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223%22%20stroke-linejoin%3D%22round%22%2F%3E%3Crect%20x%3D%22-6%22%20y%3D%2210%22%20width%3D%2212%22%20height%3D%225%22%20rx%3D%222%22%20fill%3D%22%23B9B4C7%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M64%2010l-4-3M99%2020l-5%200M97%205l-4%203%22%20stroke%3D%22%23F4B731%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E' },
  pfadiDenken: { n: 'Pfadi: Nachdenken', name: 'Pfadi', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cellipse%20cx%3D%2246%22%20cy%3D%2288%22%20rx%3D%2226%22%20ry%3D%225%22%20fill%3D%22%23000%22%20opacity%3D%22.08%22%2F%3E%3Cpath%20d%3D%22M46%2026c21%200%2032%2015%2032%2033s-10%2028-32%2028-32-10-32-28%2011-33%2032-33z%22%20fill%3D%22%239B8AFB%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223.5%22%2F%3E%3Cpath%20d%3D%22M30%2070c4%209%2028%209%2032%200%22%20fill%3D%22%23C9C0FF%22%20opacity%3D%22.7%22%2F%3E%3Cpath%20d%3D%22M30%2030q-4-9%202-12M60%2030q4-9-2-12%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2218%22%20r%3D%223.5%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2258%22%20cy%3D%2218%22%20r%3D%223.5%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Cellipse%20cx%3D%2236%22%20cy%3D%2254%22%20rx%3D%227%22%20ry%3D%228%22%20fill%3D%22%23fff%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Cellipse%20cx%3D%2256%22%20cy%3D%2254%22%20rx%3D%227%22%20ry%3D%228%22%20fill%3D%22%23fff%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2238%22%20cy%3D%2250%22%20r%3D%223.2%22%20fill%3D%22%233d2a73%22%2F%3E%3Ccircle%20cx%3D%2258%22%20cy%3D%2250%22%20r%3D%223.2%22%20fill%3D%22%233d2a73%22%2F%3E%3Cpath%20d%3D%22M40%2070q6-2%2011%201%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M22%2072q8%2010%2018%204%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%227%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M22%2072q8%2010%2018%204%22%20fill%3D%22none%22%20stroke%3D%22%239B8AFB%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2280%22%20cy%3D%2226%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Cpath%20d%3D%22M84%204c8%200%2013%204%2013%209s-5%209-13%209-13-4-13-9%205-9%2013-9z%22%20fill%3D%22%23fff%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Ctext%20x%3D%2284%22%20y%3D%2218%22%20font-family%3D%22Arial%20Rounded%20MT%20Bold%2CArial%2Csans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20fill%3D%22%233d2a73%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E' },
  pfadiAchtung: { n: 'Pfadi: Pass auf!', name: 'Pfadi', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cellipse%20cx%3D%2246%22%20cy%3D%2288%22%20rx%3D%2226%22%20ry%3D%225%22%20fill%3D%22%23000%22%20opacity%3D%22.08%22%2F%3E%3Cpath%20d%3D%22M46%2026c21%200%2032%2015%2032%2033s-10%2028-32%2028-32-10-32-28%2011-33%2032-33z%22%20fill%3D%22%239B8AFB%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223.5%22%2F%3E%3Cpath%20d%3D%22M30%2070c4%209%2028%209%2032%200%22%20fill%3D%22%23C9C0FF%22%20opacity%3D%22.7%22%2F%3E%3Cpath%20d%3D%22M30%2030q-4-9%202-12M60%2030q4-9-2-12%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2218%22%20r%3D%223.5%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2258%22%20cy%3D%2218%22%20r%3D%223.5%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Cellipse%20cx%3D%2236%22%20cy%3D%2254%22%20rx%3D%227%22%20ry%3D%228%22%20fill%3D%22%23fff%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Cellipse%20cx%3D%2256%22%20cy%3D%2254%22%20rx%3D%227%22%20ry%3D%228%22%20fill%3D%22%23fff%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2236%22%20cy%3D%2255%22%20r%3D%223.4%22%20fill%3D%22%233d2a73%22%2F%3E%3Ccircle%20cx%3D%2256%22%20cy%3D%2255%22%20r%3D%223.4%22%20fill%3D%22%233d2a73%22%2F%3E%3Cpath%20d%3D%22M29%2042q7-5%2013-1M50%2041q6-4%2013%201%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M40%2069q6%204.5%2012%200%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M74%2058q8-6%208-20%22%20fill%3D%22none%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M74%2058q8-6%208-20%22%20fill%3D%22none%22%20stroke%3D%22%239B8AFB%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M82%2038V24%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%227%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M82%2038V24%22%20stroke%3D%22%23C9C0FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M14%206h8l-2%2020h-4z%22%20fill%3D%22%23E5484D%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%2232%22%20r%3D%223.4%22%20fill%3D%22%23E5484D%22%20stroke%3D%22%233d2a73%22%20stroke-width%3D%222.5%22%2F%3E%3C%2Fsvg%3E' },
  smileyAha: { n: 'Smiley: Aha!', name: 'Aha!', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2258%22%20r%3D%2233%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M22%2074a33%2033%200%200%200%2050%200a30%2030%200%200%201-50%200z%22%20fill%3D%22%23F4B731%22%20opacity%3D%22.7%22%2F%3E%3Cpath%20d%3D%22M27%2054q6-7%2012%200M49%2054q6-7%2012%200%22%20fill%3D%22none%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M28%2065q16%2022%2032%200z%22%20fill%3D%22%239C3A2E%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223.5%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M37%2074q7-5%2014%200q-7%205-14%200z%22%20fill%3D%22%23F27B7B%22%2F%3E%3Cellipse%20cx%3D%2223%22%20cy%3D%2266%22%20rx%3D%225%22%20ry%3D%223%22%20fill%3D%22%23F49A9A%22%20opacity%3D%22.8%22%2F%3E%3Cellipse%20cx%3D%2266%22%20cy%3D%2266%22%20rx%3D%225%22%20ry%3D%223%22%20fill%3D%22%23F49A9A%22%20opacity%3D%22.8%22%2F%3E%3Cg%20transform%3D%22translate%2880%2022%29%22%3E%3Cpath%20d%3D%22M0-16a12%2012%200%200%201%207%2022v4h-14v-4A12%2012%200%200%201%200-16z%22%20fill%3D%22%23FFF3A6%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223%22%20stroke-linejoin%3D%22round%22%2F%3E%3Crect%20x%3D%22-6%22%20y%3D%2210%22%20width%3D%2212%22%20height%3D%225%22%20rx%3D%222%22%20fill%3D%22%23B9B4C7%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%222.5%22%2F%3E%3Cpath%20d%3D%22M-3%204l3-5%203%205%22%20fill%3D%22none%22%20stroke%3D%22%23E9A800%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M62%2012l-4-4M80-2v0M99%2018l-5%201M96%204l-4%203%22%20stroke%3D%22%23F4B731%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E' },
  smileyDenken: { n: 'Smiley: Nachdenken', name: 'Hmm …', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2258%22%20r%3D%2233%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M22%2074a33%2033%200%200%200%2050%200a30%2030%200%200%201-50%200z%22%20fill%3D%22%23F4B731%22%20opacity%3D%22.7%22%2F%3E%3Cpath%20d%3D%22M27%2046q6-5%2012-1%22%20fill%3D%22none%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M50%2041q6-3%2012%201%22%20fill%3D%22none%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2234%22%20cy%3D%2255%22%20rx%3D%224%22%20ry%3D%225%22%20fill%3D%22%235a3e1b%22%2F%3E%3Cellipse%20cx%3D%2256%22%20cy%3D%2254%22%20rx%3D%224%22%20ry%3D%225%22%20fill%3D%22%235a3e1b%22%2F%3E%3Ccircle%20cx%3D%2235.5%22%20cy%3D%2253%22%20r%3D%221.4%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2257.5%22%20cy%3D%2252%22%20r%3D%221.4%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M36%2074q9-3%2016%201%22%20fill%3D%22none%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M24%2092c-2-8%204-13%2011-12l8%201c3%200%204%203%202%205l-6%202%205%201c3%201%202%205-1%205H30c-3%200-5-1-6-2z%22%20fill%3D%22%23F7A55B%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2276%22%20cy%3D%2227%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2286%22%20cy%3D%2215%22%20r%3D%227%22%20fill%3D%22%23fff%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%222.5%22%2F%3E%3C%2Fsvg%3E' },
  smileyAchtung: { n: 'Smiley: Pass auf!', name: 'Pass gut auf!', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2258%22%20r%3D%2233%22%20fill%3D%22%23FFD54A%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M22%2074a33%2033%200%200%200%2050%200a30%2030%200%200%201-50%200z%22%20fill%3D%22%23F4B731%22%20opacity%3D%22.7%22%2F%3E%3Cpath%20d%3D%22M27%2045q6-5%2012-2M49%2043q6-3%2012%202%22%20fill%3D%22none%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2234%22%20cy%3D%2256%22%20r%3D%225%22%20fill%3D%22%235a3e1b%22%2F%3E%3Ccircle%20cx%3D%2254%22%20cy%3D%2256%22%20r%3D%225%22%20fill%3D%22%235a3e1b%22%2F%3E%3Ccircle%20cx%3D%2235.5%22%20cy%3D%2254.5%22%20r%3D%221.5%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2255.5%22%20cy%3D%2254.5%22%20r%3D%221.5%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M36%2073q8.5%206%2017%200%22%20fill%3D%22none%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M74%2063V20a5%205%200%200%201%2010%200v28l4%201c4%201%205%204%204%208l-2%209c-1%205-5%208-10%208h-5c-6%200-9-4-9-9v-6c0-3%202-5%205-5z%22%20fill%3D%22%23F7A55B%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%223%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M17%208h8l-2%2022h-4z%22%20fill%3D%22%23E5484D%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%222.5%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2221%22%20cy%3D%2237%22%20r%3D%223.6%22%20fill%3D%22%23E5484D%22%20stroke%3D%22%235a3e1b%22%20stroke-width%3D%222.5%22%2F%3E%3C%2Fsvg%3E' },
  ente: { n: 'Pixel-Ente', name: 'Debbie Debug', src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABOCAYAAAC+JjE8AAABGklEQVR42u3bsQ3CMBBGYYNYAInUoWaJjMdKtCxBndRBoqIOC+DCki3HyfcGcODpTr+dc0IAAADb5FDrwZdzv5Rc//2Zqvy3o5oilFBCQehaONVK8/l5LfrcbghLjfRXoYQSSigI3d5ZvnSad8MYcqwfWydX+qtQLU8ooSBUylfjMaftCu7fpF2BCtXyhBIKQsNu3tivjVhqq1AtTygIJXQ/Z/nY2Tx2hk29TVd+Lj8Gc3ktD0IJJVTK53gDn2tuXvwsH/mdIdNdfRWq5QklFIRuL+VzMb3+z837W7eqXYG5vJYnFIQSGszlE9O8lfRXoYQSCkIJ3d4d+2bu0lea46tQLU8ooSB0P1/StYLv5bU8oSCUUAAAgEb4AR5+T9UJMMc5AAAAAElFTkSuQmCC' },
  denken: { n: 'Pixel: Nachdenken', name: 'Hmm …', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20x%3D%2220%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3C%2Fsvg%3E' },
  aha: { n: 'Pixel: Aha!', name: 'Aha!', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2026%2024%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20x%3D%2219%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2225%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fff3a0%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%238b8fa3%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23f58aa0%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23f58aa0%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23f58aa0%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23f58aa0%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23f58aa0%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23f58aa0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3C%2Fsvg%3E' },
  achtung: { n: 'Pixel: Pass auf!', name: 'Pass gut auf!', src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2025%2024%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20x%3D%221%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%224%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e2465a%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%225%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%226%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%227%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%228%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%229%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%2210%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%2211%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%2212%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23c4621a%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%2213%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2223%22%20y%3D%2214%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23ff9a3c%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2215%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2221%22%20y%3D%2216%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%2217%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2218%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2219%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2220%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2221%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%225%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23fdd03b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%23e0a923%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2222%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%229%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2223%22%20width%3D%221.02%22%20height%3D%221.02%22%20fill%3D%22%2317141f%22%2F%3E%3C%2Fsvg%3E' },
};

/* ---------- ZIP-Datei (ohne Kompression) für SCORM-Pakete ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
export function zip(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const [name, content] of Object.entries(files)) {
    const data = typeof content === 'string' ? enc.encode(content) : content, nm = enc.encode(name), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + data.length;
  }
  const size = central.reduce((a, x) => a + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, Object.keys(files).length, true); e.setUint16(10, Object.keys(files).length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  const all = [...parts, ...central, new Uint8Array(e.buffer)], out = new Uint8Array(all.reduce((a, x) => a + x.length, 0)); let p = 0; for (const x of all) { out.set(x, p); p += x.length; }
  return out;
}

/** Startet den Editor in der Seite (die Seite liefert das Gerüst mit #lp, #scroll und der Leiste). */
export function startPathFinder(opts = {}) {
  const plugins = opts.plugins || [], host = opts.host || {};
  const P = opts.storage || 'pathfinder';
  const DOCS = P + '.docs', CUR = P + '.cur', DOCKEY = id => P + '.doc.' + id;
  const appName = opts.appName || 'PathFinder';
  const T = { ...CORE }, FIELDS = {};
  for (const p of plugins) { Object.assign(T, p.blocks || {}); Object.assign(FIELDS, p.fields || {}); if (p.css) { const st = document.createElement('style'); st.textContent = p.css; document.head.appendChild(st); } }
  const def = b => T[b.type];
  const isCheck = b => CORE_CHECK.has(b.type) || !!def(b)?.check?.(b);

  /* ---------- Beispiel und Umwandlung ---------- */
  const emptyDoc = (form = 'lernpfad') => ({
    v: 2, id: uid(), form, design: { pal: 0, font: 'pixel', shape: 'eckig', hero: 'logo', heroImg: '' },
    kicker: `${appName} · ${form === 'challenge' ? 'Challenge' : 'Lernpfad'}`, title: '', subtitle: '', goals: [], rank: '', anim: {}, typeLines: [],
    stations: [{ id: uid(), title: '', sub: '', check: false, blocks: [{ id: uid(), type: 'text', html: '' }] }],
    cert: { on: true, need: 'immer', pct: 80, text: 'hat den Lernpfad mit folgendem Ergebnis bearbeitet:', show: { zeit: true, tipps: true, quiz: true, xp: true } },
  });
  function migrate(d) {
    d.goals = d.goals || []; d.rank = d.rank || ''; d.id = d.id || uid(); d.anim = d.anim || {}; d.typeLines = d.typeLines || [];
    d.cert = d.cert || emptyDoc().cert;
    for (const s of d.stations) {
      s.check = !!s.check;
      for (const b of s.blocks) {
        for (const p of plugins) p.migrate?.(b);
        if (b.type === 'quiz' && !b.qs) { b.qs = [{ q: b.q || '', opts: (b.opts || []).map(o => ({ fb: '', ...o })) }]; delete b.q; delete b.opts; delete b.multi; }
        if (b.type === 'gap') b.extra = b.extra || [];
      }
    }
    return d;
  }
  const sample = () => { const d = (opts.sample || (() => emptyDoc()))(); d.stations.forEach(s => { s.id = s.id || uid(); s.blocks.forEach(b => b.id = b.id || uid()); }); return d; };

  /* ---------- Dokumente (mehrere, lokal) ---------- */
  const docList = () => { try { return JSON.parse(LS.get(DOCS)) || []; } catch (e) { return []; } };
  const saveDocList = l => LS.set(DOCS, JSON.stringify(l));
  const loadDoc = id => { try { const d = JSON.parse(LS.get(DOCKEY(id))); return d ? migrate(d) : null; } catch (e) { return null; } };
  const PLAYER = !!opts.player; // exportierter Lernpfad: nur abspielen, kein Editor
  let doc = null;
  if (PLAYER) doc = migrate(opts.doc);
  else {
    const cur = LS.get(CUR); doc = cur && loadDoc(cur);
    if (!doc && opts.legacy) { const l = opts.legacy(); if (l) doc = migrate(l); }
    if (!doc) doc = migrate(sample());
  }
  let mode = PLAYER ? 'preview' : 'edit', selId = null, curSid = null, single = false, fz = 1;
  let hist = [JSON.stringify(doc)], fut = [], pending = null;
  const freshProg = () => ({ solved: {}, quiz: {}, tips: {}, sol: {}, visited: {}, tries: {}, start: Date.now(), active: 0 });
  let prog = freshProg();
  /* Aktive Bearbeitungszeit: zählt nur, solange die Seite sichtbar ist und in den letzten 2 Minuten benutzt wurde */
  let lastUse = Date.now();
  ['pointerdown', 'keydown', 'scroll', 'input'].forEach(ev => addEventListener(ev, () => { lastUse = Date.now(); }, { capture: true, passive: true }));
  setInterval(() => { if (mode === 'preview' && document.visibilityState === 'visible' && Date.now() - lastUse < 120000) { prog.active = (prog.active || 0) + 10000; if (PLAYER) progSave(); } }, 10000);
  /* Fortschritt im exportierten Lernpfad: im Browser oder – als SCORM-Lernpaket – in Moodle */
  const PROGKEY = 'pathfinder.fortschritt.' + doc.id;
  const scorm = PLAYER && opts.scorm ? scormConnect() : null;
  if (PLAYER) {
    let saved = null;
    try { saved = JSON.parse((scorm && scorm.get('cmi.suspend_data')) || LS.get(PROGKEY) || 'null'); } catch (e) { }
    if (saved) prog = { ...freshProg(), ...saved };
  }
  function progSave() {
    if (!PLAYER) return;
    const keep = { solved: prog.solved, tips: prog.tips, sol: prog.sol, visited: prog.visited, start: prog.start, active: prog.active, sent: prog.sent, quiz: prog.quiz };
    let txt = JSON.stringify(keep);
    if (txt.length > 4000) { delete keep.quiz; txt = JSON.stringify(keep); } // SCORM 1.2 erlaubt höchstens 4096 Zeichen
    LS.set(PROGKEY, txt);
    if (scorm) scorm.report(txt);
  }

  const lp = $('#lp'), scroller = $('#scroll');
  function save() {
    if (PLAYER) return;
    const ok = LS.set(DOCKEY(doc.id), JSON.stringify(doc));
    LS.set(CUR, doc.id);
    const l = docList(), i = l.findIndex(x => x.id === doc.id), e = { id: doc.id, title: doc.title || 'ohne Titel', form: doc.form, t: Date.now() };
    if (i >= 0) l[i] = e; else l.unshift(e); saveDocList(l);
    $('#saved').textContent = ok ? '✓ gesichert' : '⚠ zu groß zum Sichern';
  }
  function commit() {
    clearTimeout(pending); pending = null;
    const s = JSON.stringify(doc); if (s === hist[hist.length - 1]) return;
    hist.push(s); if (hist.length > (s.length > 300000 ? 25 : 200)) hist.shift(); fut = []; save(); updUndo();
    if (panelOpen && !panelEl.contains(document.activeElement) && Date.now() - panelTouched > 1500) drawPanel(); // im Lernpfad Geändertes auch rechts zeigen
  }
  function softCommit() { $('#saved').textContent = '…'; clearTimeout(pending); pending = setTimeout(commit, 500); }
  function undo() { if (pending) commit(); if (hist.length < 2) return; fut.push(hist.pop()); doc = JSON.parse(hist[hist.length - 1]); save(); render(); updUndo(); drawPanel?.(); }
  function redo() { if (!fut.length) return; const s = fut.pop(); hist.push(s); doc = JSON.parse(s); save(); render(); updUndo(); drawPanel?.(); }
  function updUndo() { if (!$('#bUndo')) return; $('#bUndo').disabled = hist.length < 2; $('#bRedo').disabled = !fut.length; }
  function openDoc(d) { if (pending) commit(); if (panelOpen) panelWhat = 'design'; doc = migrate(d); hist = [JSON.stringify(doc)]; fut = []; prog = freshProg(); selId = null; curSid = null; host.reset?.(); save(); render(); updUndo(); scroller.scrollTop = 0; drawPanel(); }

  function findBlock(id) {
    for (const st of doc.stations) { const i = st.blocks.findIndex(b => b.id === id); if (i >= 0) return { st, i, b: st.blocks[i] }; }
    return null;
  }
  function toast(msg, ms = 2400) { $$('.ed-toast').forEach(x => x.remove()); const t = document.createElement('div'); t.className = 'ed-toast'; t.innerHTML = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }

  /* ---------- Text säubern ---------- */
  const OK_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'CODE', 'A', 'BR', 'UL', 'OL', 'LI', 'SUB', 'SUP', 'KBD']);
  function clean(html) {
    if (doc?.skin && SK) return SK.cleanRich(html); // Originaldesign: Auszeichnung der Vorlage behalten
    const d =new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.firstChild;
    const walk = n => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 3) continue;
        if (c.nodeType !== 1) { c.remove(); continue; }
        walk(c);
        if (c.tagName === 'DIV' || c.tagName === 'P') { c.before(document.createElement('br')); c.replaceWith(...c.childNodes); continue; }
        if (!OK_TAGS.has(c.tagName)) { c.replaceWith(...c.childNodes); continue; }
        for (const a of [...c.attributes]) if (!(c.tagName === 'A' && a.name === 'href')) c.removeAttribute(a.name);
        if (c.tagName === 'A') { if (!/^https?:\/\//i.test(c.getAttribute('href') || '')) c.removeAttribute('href'); c.setAttribute('class', 'link'); c.setAttribute('target', '_blank'); }
      }
    };
    walk(d);
    return d.innerHTML.replace(/^(<br>)+/, '').replace(/(<br>)+$/, '');
  }

  /* ---------- Rendern ---------- */
  const E = () => mode === 'edit';
  function ce(path, val, ph, { rich = false, tag = 'div', cls = '', anim = '', key = '' } = {}) {
    if (!E()) return `<${tag}${cls ? ` class="${cls}"` : ''}${anim ? ` data-anim="${anim}" data-ak="${esc(key || path)}"` : ''}>${rich ? (val || '') : esc(val)}</${tag}>`;
    return `<${tag} class="${cls}" contenteditable="true" data-f="${path}"${rich ? ' data-rich="1"' : ''}${anim ? ` data-anim-ed="${ANIMS[anim] || anim}"` : ''} data-ph="${esc(ph)}" spellcheck="true">${rich ? (val || '') : esc(val)}</${tag}>`;
  }

  /* Textanimationen (nur Vorschau, einmal beim Hineinscrollen) */
  const animDone = new Set();
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animObs = null;
  function runAnims() {
    animObs?.disconnect();
    if (E()) return;
    const els = $$('[data-anim]', lp).filter(e => !animDone.has(e.dataset.ak));
    if (reduceMotion()) { els.forEach(e => animDone.add(e.dataset.ak)); return; }
    els.forEach(e => { if (e.dataset.anim === 'tippen' || e.dataset.anim === 'einblenden') e.classList.add('an-wait'); });
    animObs = new IntersectionObserver(ents => ents.forEach(en => { if (!en.isIntersecting) return; animObs.unobserve(en.target); playAnim(en.target); }), { root: scroller, threshold: .3 });
    els.forEach(e => animObs.observe(e));
    typeHeroLines();
  }
  function playAnim(el) {
    animDone.add(el.dataset.ak);
    const a = el.dataset.anim; el.classList.remove('an-wait');
    if (a === 'tippen') typeInto(el);
    else { el.classList.add('an-' + a); if (a !== 'leuchten') setTimeout(() => el.classList.remove('an-' + a), 1600); }
  }
  function typeInto(el) {
    const html = el.innerHTML, txt = el.textContent; let i = 0;
    el.textContent = ''; el.classList.add('an-typing');
    const speed = Math.max(12, Math.min(45, 1800 / Math.max(1, txt.length)));
    (function step() { if (!el.isConnected) return; if (i < txt.length) { el.textContent = txt.slice(0, ++i); setTimeout(step, speed); } else { el.innerHTML = html; el.classList.remove('an-typing'); } })();
  }
  function typeHeroLines() {
    const ty = $('.lp-typing', lp); if (!ty || animDone.has('$lines')) return;
    animDone.add('$lines');
    const lines = doc.typeLines || []; if (reduceMotion()) { ty.textContent = lines.join('\n'); return; }
    let li = 0, ci = 0, txt = ''; ty.textContent = '';
    (function step() { if (!ty.isConnected || li >= lines.length) return; if (ci < lines[li].length) { txt += lines[li][ci++]; ty.textContent = txt; setTimeout(step, 45); } else { txt += '\n'; li++; ci = 0; setTimeout(step, 500); } })();
  }

  function applyDesign() {
    const p = PALETTES[doc.design.pal] || PALETTES[0], f = FONTS[doc.design.font] || FONTS.pixel, st = lp.style;
    for (const k in p.l) st.setProperty('--' + k, p.l[k]);
    st.setProperty('--font-display', f.d); st.setProperty('--display-weight', f.w); st.setProperty('--display-ls', f.ls); st.setProperty('--fz', fz);
    lp.dataset.shape = doc.design.shape; lp.dataset.form = doc.form;
    lp.dataset.divider = doc.design.divider || 'linie'; if (doc.design.divColor) st.setProperty('--div', doc.design.divColor); else st.removeProperty('--div');
    const pat = doc.design.pattern || 'punkte', k = doc.design.patDensity || 1, op = doc.design.patOpacity ?? 1;
    const a = (x) => +(x * op).toFixed(3), sz = n => `${Math.round(n / k)}px ${Math.round(n / k)}px`;
    if (pat === 'punkte') { st.setProperty('--hero-pat', `radial-gradient(rgba(255,255,255,${a(.3)}) 2px, transparent 2px)`); st.setProperty('--hero-pat-size', sz(16)); }
    else if (pat === 'raster') { st.setProperty('--hero-pat', `linear-gradient(rgba(255,255,255,${a(.3)}) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,${a(.3)}) 1px, transparent 1px)`); st.setProperty('--hero-pat-size', sz(22)); }
    else if (pat === 'keins') st.setProperty('--hero-pat', 'none');
    else { // Zeichen oder Emoji als Muster, versetzt angeordnet
      const g = esc(pat), svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><g font-family='sans-serif' font-size='17' text-anchor='middle' fill='white' opacity='${a(.42)}'><text x='16' y='22'>${g}</text><text x='48' y='54'>${g}</text></g></svg>`;
      st.setProperty('--hero-pat', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`); st.setProperty('--hero-pat-size', sz(64));
    }
    lp.classList.toggle('with-pts', !!doc.pointsOn);
    $('.lpwrap').style.background = p.l.bg;
  }
  function render() {
    const sc = scroller.scrollTop;
    if (doc.skin) { try { skinRender(sc); } catch (e) { console.error(e); lp.innerHTML = `<div class="ed-hint" style="padding:40px">⚠ Originaldesign konnte nicht angezeigt werden: ${esc(e.message)}</div>`; } return; }
    if (lp.classList.contains('pf-skin')) { lp.classList.remove('pf-skin'); $('#pf-skin-css')?.remove(); }
    applyDesign();
    lp.classList.toggle('editing', E());
    lp.classList.toggle('single-station', single);
    if (!curSid || !doc.stations.some(s => s.id === curSid)) curSid = doc.stations[0]?.id;
    const d = doc.design, lines = doc.typeLines || [];
    const appLogo = opts.logo ? `<img src="${opts.logo}" alt="">` : esc(appName[0]);
    const logo = ((d.hero === 'bild' || d.hero === 'gross') && d.heroImg ? `<img src="${d.heroImg}" alt="">` : appLogo) + (d.hero === 'gross' && lines.length ? `<div class="lp-typing">${E() ? esc(lines.join('\n')) : ''}</div>` : '');
    let h = `<div class="fontsize"><button data-fz="-" aria-label="Schrift kleiner">A−</button><button data-fz="+" aria-label="Schrift größer">A+</button></div>`;
    const goals = doc.goals || [];
    h += `<header class="lp-hero${d.hero === 'hintergrund' && d.heroImg ? ' has-bg' : ''}${d.hero === 'gross' && d.heroImg ? ' big' : ''}"${d.hero === 'hintergrund' && d.heroImg ? ` style="background-image:url(${d.heroImg})"` : ''}>`
      + (d.hero !== 'hintergrund' ? `<div class="lp-logo${d.hero === 'logo' && opts.logo ? ' applogo' : ''}${d.hero !== 'logo' && d.heroImg ? ' own' : ''}"${E() ? ' title="Antippen: eigenes Bild oder GIF setzen"' : ''}>${logo}</div>` : '')
      + `<div style="min-width:0">${ce('$kicker', doc.kicker, 'Kopfzeile', { tag: 'small' })}${ce('$title', doc.title, 'Titel des Lernpfads', { tag: 'h1', anim: doc.anim?.title })}${ce('$subtitle', doc.subtitle, 'Untertitel', { tag: 'p', rich: true, anim: doc.anim?.subtitle })}`
      + (goals.length ? `<ul class="lp-goals">${goals.map((g, i) => ce('$goals.' + i, g, 'Lernziel', { tag: 'li', rich: true })).join('')}</ul>` : '')
      + (doc.rank ? `<div class="lp-rank">${ce('$rank', doc.rank, 'Rang', { tag: 'span', rich: true })}</div>` : '')
      + (E() && (!goals.length || !doc.rank) ? `<div class="ed-hint" style="display:inline-block">Lernziele und Rang: ⚙ Einstellungen → Kopf</div>` : '')
      + `</div></header><div class="lp-divider" aria-hidden="true"></div>`;
    h += `<nav class="lp-trail"><div class="lp-trail-in"><div class="lp-stops" id="stops">${doc.stations.map((s, i) => `<a data-sid="${s.id}" class="${stationDone(s) ? 'done' : ''}${s.id === curSid ? ' cur' : ''}" title="${esc(s.title)}">${stationDone(s) ? '✓' : esc(s.nr || i + 1)}</a>`).join('')}${doc.cert.on ? '<a data-sid="cert" title="Abschluss">🏁</a>' : ''}</div><span class="lp-count">${doc.stations.filter(stationDone).length} / ${doc.stations.length}</span></div></nav>`;
    h += `<main class="lp-main">`;
    if (doc.form === 'challenge') { const x = xpNow(), mx = xpMax() || 1; h += `<div class="lp-hud"><span>⚡ ${x} XP</span><span class="bar"><i style="width:${Math.round(100 * x / mx)}%"></i></span><span>von ${mx}</span></div>`; }
    doc.stations.forEach((s, si) => {
      h += `<section class="lp-station${s.id === curSid ? ' cur' : ''}" id="st-${s.id}" data-sid="${s.id}">`;
      h += `<div class="lp-sh"><span class="lp-nr">${esc(s.nr || si + 1)}</span><div style="flex:1;min-width:0">${ce('$st.sub', s.sub, 'Untertitel der Station', { tag: 'small' })}${ce('$st.title', s.title, 'Titel der Station', { tag: 'h2', anim: s.anim, key: 'st:' + s.id })}</div>`
        + `<span class="ed-station-tools"><button data-sact="cfg" title="Station einstellen">⚙</button><button data-sact="up" title="Station nach oben">↑</button><button data-sact="down" title="Station nach unten">↓</button><button data-sact="del" title="Station löschen">🗑</button></span></div>`;
      let open = false;
      s.blocks.forEach((b, i) => {
        if (E()) h += plus(s.id, i);
        if (b.type === 'lock' && !E()) {
          if (open) h += '</div></div>';
          const ref = findBlock(b.after), isLocked = !!ref && isCheck(ref.b) && !prog.solved[b.after];
          h += `<div class="lp-lock${isLocked ? ' locked' : ''}"><div class="lp-lock-note">🔒 Geht weiter, sobald ${ref ? esc(blockLabel(ref.b)) : 'die Aufgabe'} gelöst ist.</div><div class="lp-lock-body">`;
          open = true; return;
        }
        h += blockHtml(b);
      });
      if (open) h += '</div></div>';
      if (E()) h += plus(s.id, s.blocks.length);
      if (s.check) { const ok = !!prog.solved['st:' + s.id]; h += `<label class="lp-done${ok ? ' ok' : ''}"><input type="checkbox" data-sdone="${s.id}"${ok ? ' checked' : ''}${E() ? ' disabled' : ''}> Station erledigt</label>`; }
      h += `</section>`;
    });
    if (E()) h += `<button class="ed-add-station" data-act="addStation">＋ Neue Station</button>`;
    if (doc.cert.on || E()) h += certHtml();
    h += `</main><footer class="lp-foot">${doc.form === 'challenge' ? 'Challenge' : 'Lernpfad'} · erstellt mit PathFinder · läuft komplett im Browser${scorm?.ok ? ' · Fortschritt wird in der Lernplattform gespeichert' : ''}</footer>`;
    lp.innerHTML = h;
    runAnims();
    if (PLAYER) progSave();
    scroller.scrollTop = sc;
    if (selId && !findBlock(selId)) selId = null;
    markSel();
  }
  /* ---------- Originaldesign: Lernpfad im Aussehen der Vorlage bearbeiten ---------- */
  let SK = null, skinCssFor = null;
  const loadSkin = async () => SK || (SK = await import(new URL('pfskin.js' + new URL(import.meta.url).search, BASE).href));
  function skinRender(sc) {
    if (!SK) { lp.innerHTML = '<div class="ed-hint" style="padding:40px">lädt …</div>'; loadSkin().then(() => render()).catch(e => toast('Originaldesign nicht geladen: ' + esc(e.message))); return; }
    const sk = doc.skin;
    lp.removeAttribute('style'); lp.classList.add('pf-skin'); lp.classList.toggle('editing', E()); lp.classList.remove('single-station');
    if (skinCssFor !== sk.head) { // Stile der Vorlage nur im Lernpfad wirken lassen
      let st = $('#pf-skin-css'); if (!st) { st = document.createElement('style'); st.id = 'pf-skin-css'; document.head.appendChild(st); }
      st.textContent = SK.scopedCss(sk.head, '#lp.pf-skin') + editorUiCss(); skinCssFor = sk.head;
    }
    if (!curSid || !doc.stations.some(s => s.id === curSid)) curSid = doc.stations[0]?.id;
    if (!E()) { // Vorschau: genau die Seite, die Schüler bekommen
      lp.innerHTML = '<iframe class="pf-skin-frame" title="Vorschau des Lernpfads"></iframe>';
      const f = lp.firstChild; f.style.cssText = `display:block;width:100%;border:0;height:${scroller.clientHeight}px`;
      f.srcdoc = SK.pageHtml(exportDoc({ pass: doc.pass || 80, cert: false }).d);
      $('.lpwrap').style.background = '';
      return;
    }
    const noScript = s => s.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const hm = SK.headMap(doc);
    let h = noScript(sk.before).replace(/\{\{pf:(\w+)\}\}/g, (m, k) => hm[k] ?? m);
    doc.stations.forEach((s, si) => {
      const n = si + 1, cls = (s.skin?.cls || '').replace(/\bis-locked\b/, '').trim();
      h += `<section class="station lp-station${cls ? ' ' + esc(cls) : ''}${s.id === curSid ? ' cur' : ''}" id="st-${s.id}" data-sid="${s.id}">`;
      h += SK.stationHead(doc, s, n).replace(/<\/div>\s*$/, `<span class="ed-station-tools"><button data-sact="cfg" title="Station einstellen">⚙</button><button data-sact="up" title="Station nach oben">↑</button><button data-sact="down" title="Station nach unten">↓</button><button data-sact="del" title="Station löschen">🗑</button></span></div>`);
      if (s.skin?.unlock) { const k = doc.stations.findIndex(x => x.id === s.skin.unlock); h += `<div class="ed-hint">🔒 Bonus-Station: Schüler sehen sie erst, wenn Station ${k + 1} abgehakt ist.</div>`; }
      s.blocks.forEach((b, i) => { h += plus(s.id, i) + skinBlockEdit(b); });
      h += plus(s.id, s.blocks.length);
      if (s.check) h += SK.doneRow(doc, n).replace(/<input\b/, '<input disabled');
      h += '</section>';
    });
    h += `<button class="ed-add-station" data-act="addStation">＋ Neue Station</button>` + noScript(sk.after);
    lp.innerHTML = h;
    // Kopf und Stationstitel direkt bearbeiten
    for (const el of $$('[data-pf]', lp)) {
      const k = el.dataset.pf; if (k === 'nr') continue;
      el.contentEditable = 'true'; el.spellcheck = true;
      if (el.closest('[data-sid]')) { el.dataset.f = '$st.' + k; el.dataset.ph = k === 'title' ? 'Titel der Station' : 'Untertitel'; }
      else { el.dataset.f = k === 'goals' ? '$goalsList' : '$' + k; el.dataset.ph = { title: 'Titel des Lernpfads', kicker: 'Kopfzeile', subtitle: 'Untertitel', goals: 'Lernziele' }[k] || ''; if (k !== 'title') el.dataset.rich = '1'; }
    }
    // Code-Kästen innerhalb von HTML-Bausteinen (z. B. zwei nebeneinander) zeigen und bearbeitbar machen
    for (const c of $$('.pf-skin-html .code[data-src]', lp)) { const k = c.dataset.src; if (!(k in (sk.src || {}))) continue; c.innerHTML = `<div class="code-head"><span class="fname">${esc(c.dataset.file || '')}</span></div><pre contenteditable="true" data-f="$skin.src.${esc(k)}" data-ph="Code …" spellcheck="false">${esc(sk.src[k])}</pre>`; }
    const ts = $('#trailStops', lp); if (ts) ts.innerHTML = doc.stations.map((s, i) => `<a data-skst="${s.id}" title="${esc(s.title)}" style="cursor:pointer">${esc(s.nr || i + 1)}</a>`).join('');
    const tc = $('#trailCount', lp); if (tc) tc.textContent = doc.stations.length + ' Stationen';
    $('.lpwrap').style.background = getComputedStyle(lp).backgroundColor;
    scroller.scrollTop = sc;
    if (selId && !findBlock(selId)) selId = null;
    markSel();
  }
  /** Werkzeuge des Editors (Bausteinleiste, +, Stationsknöpfe) gegen die Stile der Vorlage behaupten */
  function editorUiCss() {
    let out = '';
    const pre = p => p.startsWith('.editing') ? '#lp.pf-skin' + p : p.startsWith('.lp') && !/^\.lp-/.test(p) ? '#lp.pf-skin' + p.slice(3) : '#lp.pf-skin ' + p;
    const walk = rules => { for (const r of rules) { if (r.cssRules && r.media) { const inner = (() => { const o = out; out = ''; walk(r.cssRules); const x = out; out = o; return x; })(); if (inner) out += `@media ${r.media.mediaText} {\n${inner}}\n`; continue; }
      if (r.selectorText && /\.ed-|\[contenteditable\]|\.blk|\.pf-hid/.test(r.selectorText)) out += r.selectorText.split(',').map(x => pre(x.trim())).join(', ') + ` { ${r.style.cssText} }\n`; } };
    for (const sh of document.styleSheets) { if (sh.ownerNode?.id === 'pf-skin-css') continue; try { walk(sh.cssRules); } catch (e) { } }
    return out;
  }
  /** Baustein im Originaldesign, mit Feldern zum Bearbeiten */
  function skinBlockEdit(b) {
    switch (b.type) {
      case 'text': return wrap(b, ce('html', b.html, b.tag === 'h3' || b.tag === 'h4' ? 'Zwischenüberschrift' : 'Text schreiben … ( / für Bausteine)', { rich: true, tag: /^(p|h3|h4|ul|ol)$/.test(b.tag || '') ? b.tag : 'p', cls: esc(b.cls || '') }));
      case 'info': return wrap(b, `<div class="${esc(SK.noteCls(b))}">${ce('title', b.title, 'Überschrift', { rich: true, tag: 'span', cls: 'note-title' })}${ce('html', b.html, 'Inhalt', { rich: true })}</div>`);
      case 'task': {
        let t = (b.tips || []).map((x, i) => `<details class="reveal${b.tipsHide?.[i] ? ' pf-hidden' : ''}"><summary>Tipp${b.tips.length > 1 ? ' ' + (i + 1) : ''}${b.tipsHide?.[i] ? ' · <span class="pf-hid">für Schüler verborgen</span>' : ''}</summary><div class="answer">${x}</div></details>`).join('');
        if (b.solution) t += `<details class="reveal${b.solHide ? ' pf-hidden' : ''}"><summary>Lösung anzeigen${b.solHide ? ' · <span class="pf-hid">für Schüler verborgen</span>' : ''}</summary><div class="answer">${b.solution}</div></details>`;
        return wrap(b, `<div class="task">${ce('title', b.title, 'Aufgabe', { rich: true, cls: 'task-head' })}<div class="task-body">${ce('html', b.html, 'Arbeitsauftrag …', { rich: true })}${t}</div></div>`);
      }
      case 'code': return wrap(b, `<div class="code"><div class="code-head">${ce('file', b.file, 'Datei.java', { tag: 'span', cls: 'fname' })}</div><pre contenteditable="true" data-f="code" data-ph="Code …" spellcheck="false">${esc(b.code)}</pre></div>`);
      case 'quiz': return wrap(b, `<div class="quiz">${(b.qs || []).map((q, qi) => `<div class="q">${ce(`qs.${qi}.q`, q.q, 'Frage …', { rich: true, cls: 'q-text' })}<div class="q-opts">${q.opts.map((o, i) => `<div class="q-opt${o.ok ? ' is-right' : ''}" style="display:flex;gap:8px;align-items:center;cursor:auto"><button data-qok="${qi}.${i}" title="richtig/falsch" style="border:0;background:none;font-size:18px;cursor:pointer;padding:0">${o.ok ? '✅' : '⬜'}</button>${ce(`qs.${qi}.opts.${i}.t`, o.t, 'Antwort ' + (i + 1), { tag: 'span', rich: true })}</div>`).join('')}</div></div>`).join('')}<div class="ed-hint">✅ markiert die richtige Antwort · Fragen und Rückmeldungen über ⚙ · die Antworten werden für Schüler gemischt</div></div>`);
      case 'image': return wrap(b, b.src ? `<figure${b.cls ? ` class="${esc(b.cls)}"` : ''}><img${b.imgAttrs || ' class="shot"'} src="${esc(b.src)}" alt="${esc(b.alt)}">${ce('caption', b.caption, 'Bildunterschrift (optional)', { tag: 'figcaption', rich: true })}</figure>` : `<div class="lp-card" style="text-align:center"><button class="lp-btn alt" data-bact="cfg">🖼 Bild oder GIF wählen</button></div>`);
      case 'html': return wrap(b, b.html ? `<div class="pf-skin-html">${b.html.replace(/<script\b[\s\S]*?<\/script>/gi, '')}</div>` : `<div class="lp-card" style="text-align:center"><button class="lp-btn alt" data-bact="cfg">&lt;/&gt; HTML eingeben</button></div>`);
    }
    return blockHtml(b);
  }
  const SKIN_TYPES = new Set(['text', 'heading', 'info', 'task', 'quiz', 'code', 'image', 'html']);
  const plus = (sid, at) => `<div class="ed-plus" data-sid="${sid}" data-at="${at}"><button title="Baustein einfügen" aria-label="Baustein einfügen">+</button></div>`;
  function blockLabel(b) {
    const dl = def(b)?.label?.(b); if (dl) return dl;
    if (b.type === 'task') return b.title || 'die Aufgabe';
    if (b.type === 'quiz') return 'das Quiz „' + plain(b.qs?.[0]?.q || '').slice(0, 30) + '“';
    return def(b)?.n || b.type;
  }
  function tools(b) {
    const t = def(b);
    const form = b.type === 'info' || (t && (t.form || FORMS[b.type]));
    return `<div class="ed-tools" contenteditable="false"><button class="grip" data-bact="grip" title="Ziehen zum Verschieben" aria-label="Verschieben">⠿</button><span class="lbl">${esc(b.type === 'info' ? (INFO_KINDS[b.kind]?.[1] || 'Infokasten') : t?.n || b.type)}</span>`
      + `<button data-bact="up" title="Nach oben (⌥↑)">↑</button><button data-bact="down" title="Nach unten (⌥↓)">↓</button>`
      + `<button data-bact="dup" title="Verdoppeln">⧉</button>${form ? '<button data-bact="cfg" title="Einstellungen">⚙</button>' : ''}<button class="del" data-bact="del" title="Löschen">🗑</button></div>`;
  }
  const ptsOf = b => Math.max(0, +(b.pts ?? 1) || 0);
  const ptsTag = b => !doc.pointsOn || !isCheck(b) ? '' : E() ? `<label class="pf-pts" title="Punkte für diese Aufgabe"><input type="number" min="0" step="1" inputmode="numeric" data-pts value="${ptsOf(b)}"><span>P.</span></label>` : `<span class="pf-pts">${ptsOf(b)} P.</span>`;
  const wrap = (b, inner, cls = '') => `<div class="blk ${cls}" data-id="${b.id}">${E() ? tools(b) : ''}${ptsTag(b)}${inner}</div>`;
  const imgHtml = (src, cap, size) => src ? `<figure class="lp-img"${size === 'klein' ? ' style="max-width:45%"' : ''}><img src="${src}" alt="">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>` : '';
  const xpTag = b => doc.form === 'challenge' && b.xp ? `<span class="xp">+${b.xp} XP</span>` : '';
  /** Aufgabenkarte (auch für Aufgaben der Apps): Kopf, Bild, Auftrag, eigene Knöpfe, Tipps, Lösung */
  function taskCard(b, { buttons = '', hint = '', where = '' } = {}) {
    const ok = !!prog.solved[b.id];
    let h = `<div class="lp-card lp-task${ok ? ' ok' : ''}"><div class="hd">${ce('title', b.title, 'Aufgabe 1', { tag: 'b', cls: 'lp-ctitle' })}${xpTag(b)}${where ? `<span class="where">${esc(where)}</span>` : ''}<span class="lp-state">${ok ? '✓ geschafft' : ''}</span></div>`;
    h += imgHtml(b.img, '', 'klein') + ce('html', b.html, 'Arbeitsauftrag …', { rich: true });
    h += `<div>${buttons}</div>` + (E() && hint ? `<div class="ed-hint">${hint}</div>` : '');
    let k = 0;
    (b.tips || []).forEach((t, i) => {
      const hid = !!b.tipsHide?.[i]; if (hid && !E()) return; if (!hid) k++;
      h += `<details data-tip="${i}"${hid ? ' class="pf-hidden"' : ''}><summary>${hid ? `Tipp · <span class="pf-hid">für Schüler verborgen</span>` : `Tipp ${k}`}</summary><div>${t}</div></details>`;
    });
    if (b.solution && (!b.solHide || E())) h += `<details data-sol="1"${b.solHide ? ' class="pf-hidden"' : ''}><summary>Lösung anzeigen${b.solHide ? ` · <span class="pf-hid">für Schüler verborgen</span>` : ''}</summary><div>${b.solution}</div></details>`;
    if (E() && !(b.tips || []).length && !b.solution) h += `<div class="ed-hint">Tipps und Lösung über ⚙ hinzufügen</div>`;
    return h + '</div>';
  }

  function blockHtml(b) {
    const ok = !!prog.solved[b.id], t = def(b);
    switch (b.type) {
      case 'text': return wrap(b, ce('html', b.html, 'Text schreiben … ( / für Bausteine)', { rich: true, cls: 'lp-text', anim: b.anim, key: b.id }));
      case 'info': {
        const [ic, dn] = INFO_KINDS[b.kind] || INFO_KINDS.merke;
        if (b.kind === 'figur') return wrap(b, `<div class="lp-figur">${b.img ? `<img src="${b.img}" alt="">` : `<span class="noimg">${E() ? '🖼' : '🙂'}</span>`}<div class="bubble">${ce('name', b.name, 'Name der Figur', { tag: 'b', cls: 'who' })}${ce('html', b.html, 'Was sagt die Figur?', { rich: true, anim: b.anim, key: b.id })}</div></div>`);
        if (b.kind === 'abschluss') return wrap(b, `<div class="lp-abschluss">${b.img ? `<img src="${b.img}" alt="">` : ''}<div>${ce('title', b.title || (E() ? '' : 'Geschafft!'), 'Geschafft!', { tag: 'h3' })}${ce('html', b.html, 'Wie geht es weiter?', { rich: true })}</div></div>`);
        return wrap(b, `<div class="lp-info ${b.kind}"><span class="ic">${ic}</span><div style="flex:1;min-width:0">${ce('title', b.title || (E() ? '' : dn), dn, { tag: 'b', cls: 't' })}${ce('html', b.html, 'Inhalt', { rich: true, anim: b.anim, key: b.id })}</div></div>`);
      }
      case 'image': return wrap(b, b.src ? imgHtml(b.src, b.caption, b.size) : (E() ? `<div class="lp-card" style="text-align:center"><button class="lp-btn alt" data-bact="cfg">🖼 Bild oder GIF wählen</button></div>` : ''));
      case 'table': {
        const rows = b.rows || [];
        return wrap(b, `<div class="lp-tablewrap"><table class="lp-table">${rows.map((r, ri) => `<tr>${r.map((c, ci) => { const tag = b.head && ri === 0 ? 'th' : 'td'; return E() ? `<${tag} contenteditable="true" data-f="rows.${ri}.${ci}" data-rich="1" data-ph="…">${c}</${tag}>` : `<${tag}>${c}</${tag}>`; }).join('')}</tr>`).join('')}</table></div>${E() ? '<div class="ed-hint">Zeilen und Spalten über ⚙</div>' : ''}`);
      }
      case 'reveal': return wrap(b, E() ? `<div class="lp-card">${ce('summary', b.summary, 'Überschrift der Klappbox', { tag: 'b', cls: 'lp-ctitle' })}${ce('html', b.html, 'Inhalt, der aufgeklappt wird', { rich: true })}</div>`
        : `<details class="lp-card"><summary>${esc(b.summary)}</summary><div>${b.html}</div></details>`);
      case 'file': {
        const extra = host.fileButton?.(b) || '';
        return wrap(b, `<div class="lp-card lp-file"><div class="hd"><span class="fic">${/\.xlsx?$/i.test(b.name || '') ? '📊' : '📎'}</span><b>${esc(b.name || (E() ? '(noch keine Datei – ⚙)' : ''))}</b>${b.data ? `<span class="sz">${Math.round(b.data.length * .75 / 1024)} KB</span>` : ''}</div>${ce('html', b.html, 'Beschreibung (optional)', { rich: true })}<div><button class="lp-btn" data-run="download">⇩ Herunterladen</button>${extra}</div></div>`);
      }
      case 'html': return wrap(b, E() ? `<div class="lp-htmlblk"><div class="lab">HTML-Baustein <button class="lp-btn alt" data-bact="cfg" style="min-height:32px;margin:0 0 0 8px;font-size:13px">HTML bearbeiten</button></div><div class="inner">${b.html || '<i>leer</i>'}</div></div>` : `<div class="lp-html">${b.html}</div>`);
      case 'task': {
        if (b.answer) { // Ergebnis eintippen und prüfen lassen
          const st = prog.quiz[b.id];
          const btn = `<span class="lp-answer"><input data-ans value="${esc(st?.v || '')}" placeholder="${esc(b.answerPh || 'Ergebnis')}" autocomplete="off" autocapitalize="off" spellcheck="false"${ok ? ' disabled' : ''}><button class="lp-btn" data-run="answer"${ok ? ' disabled' : ''}>Prüfen</button></span>`
            + (st && !E() ? `<div class="fb" style="color:var(${st.ok ? '--good' : '--bad'})">${st.ok ? '✓ Richtig!' : '✗ Das stimmt noch nicht. Rechne nochmal nach.'}</div>` : '');
          return wrap(b, taskCard(b, { buttons: btn, hint: `Richtig ist: <b>${esc(b.answer.split('|').join(' oder '))}</b>` }));
        }
        return wrap(b, taskCard(b, { buttons: `<button class="lp-btn${ok ? ' alt' : ''}" data-run="done">${ok ? '✓ erledigt' : 'Erledigt'}</button>` }));
      }
      case 'quiz': {
        const st = prog.quiz[b.id] || {};
        let h = `<div class="lp-card lp-quiz"><div class="hd"><b class="lp-ctitle">${b.qs.length > 1 ? `Quiz · ${b.qs.length} Fragen` : 'Quiz'}</b>${xpTag(b)}<span class="lp-state">${ok ? '✓ alles richtig' : ''}</span></div>`;
        b.qs.forEach((q, qi) => {
          h += `<div class="qq">${b.qs.length > 1 ? `<span class="qn">${qi + 1}</span>` : ''}${ce(`qs.${qi}.q`, q.q, 'Frage …', { rich: true, cls: 'qt' })}`;
          // Schüleransicht: Antworten bei jedem Laden neu gemischt (sonst steht die richtige oft vorn); beim Neuzeichnen bleibt die Reihenfolge
          (E() ? q.opts.map((_, i) => i) : shuffled(q.opts.map((_, i) => i), b.id + '.' + qi + QUIZ_SALT)).forEach(i => { const o = q.opts[i];
            if (E()) h += `<div class="opt" style="display:flex;gap:8px;align-items:center"><button data-qok="${qi}.${i}" title="richtig/falsch" style="border:0;background:none;font-size:18px;cursor:pointer">${o.ok ? '✅' : '⬜'}</button>${ce(`qs.${qi}.opts.${i}.t`, o.t, 'Antwort ' + (i + 1), { tag: 'span', rich: true })}</div>`;
            else h += `<button class="opt${st[qi] === i ? (o.ok ? ' ok' : ' no') : ''}" data-opt="${qi}.${i}">${o.t}</button>`;
          });
          if (!E() && st[qi] != null) { const o = q.opts[st[qi]]; h += `<div class="fb" style="color:var(${o?.ok ? '--good' : '--bad'})">${o?.ok ? '✓ ' : '✗ '}${o?.fb || (o?.ok ? 'Richtig!' : 'Leider nicht – versuch es nochmal.')}</div>`; }
          h += '</div>';
        });
        if (E()) h += `<div class="ed-hint">✅ markiert die richtige Antwort · Fragen, Antworten und Rückmeldungen über ⚙</div>`;
        return wrap(b, h + '</div>');
      }
      case 'gap': {
        const head = b.heft ? `<div class="heft-title">${ce('title', b.title, 'Titel des Hefteintrags', { tag: 'span' })}</div><div class="heft-sub">${ce('sub', b.sub, 'Unterzeile', { tag: 'span' })}</div>` : `<b class="lp-ctitle">Lückentext</b>`;
        if (E()) return wrap(b, `<div class="lp-card lp-gap${b.heft ? ' heft' : ''}">${head}${xpTag(b)}${ce('html', b.html, 'Text mit [[Lücke]] …', { rich: true })}<div class="ed-hint">Lücken als <b>[[Antwort]]</b>, mehrere richtige mit | trennen: [[mal|*]]${b.bank ? ` · Begriffe zum Ziehen${b.extra.length ? ` + ${b.extra.length} Ablenker` : ''}` : ''} · ⚙ für Begriffe und Hefteintrag</div></div>`);
        const got = prog.quiz[b.id] || {}; let n = 0;
        if (b.bank) {
          const answers = [...(b.html || '').matchAll(/\[\[(.+?)\]\]/g)].map(m => m[1].split('|')[0]);
          const words = shuffled(answers.concat(b.extra || []), b.id), used = Object.values(got);
          const html = (b.html || '').replace(/\[\[(.+?)\]\]/g, () => { const i = n++; const v = got[i]; const st = prog.quiz[b.id + ':chk'] ? (v != null && isGapOk(b, i, v) ? ' ok' : ' no') : ''; return `<span class="gapslot${v != null ? ' filled' : ''}${st}" data-gslot="${i}" role="button" tabindex="0">${v != null ? esc(v) : ''}</span>`; });
          return wrap(b, `<div class="lp-card lp-gap${b.heft ? ' heft' : ''}">${head}${xpTag(b)}<div>${html}</div><div class="bank"><span class="bl">Begriffe · ziehen oder erst Begriff, dann Lücke antippen</span>${words.map(w => `<span class="gchip${used.includes(w) ? ' used' : ''}" data-gchip="${esc(w)}">${esc(w)}</span>`).join('')}</div><div><button class="lp-btn" data-run="gapcheck">Prüfen</button><span class="lp-state" style="margin-left:8px">${ok ? '✓ alles richtig' : ''}</span></div></div>`);
        }
        const html = (b.html || '').replace(/\[\[(.+?)\]\]/g, () => `<input data-gap="${n}" value="${esc(got[n] || '')}" autocomplete="off" autocapitalize="off" spellcheck="false" data-n="${n++}">`);
        return wrap(b, `<div class="lp-card lp-gap${b.heft ? ' heft' : ''}">${head}${xpTag(b)}<div>${html}</div><div class="lp-state" style="margin-top:6px">${ok ? '✓ alles richtig' : ''}</div></div>`);
      }
      case 'match': {
        if (E()) return wrap(b, `<div class="lp-card lp-match">${ce('title', b.title, 'Ordne zu', { tag: 'b', cls: 'lp-ctitle' })}${xpTag(b)}<div class="grid">${b.pairs.map((p, i) => `<div class="chip" style="cursor:text">${ce(`pairs.${i}.a`, p.a, 'Karte', { tag: 'span' })}</div><div class="slot">${ce(`pairs.${i}.b`, p.b, 'passt zu …', { tag: 'span' })}</div>`).join('')}</div><div class="ed-hint">Links die Karten, rechts das Passende – in der Vorschau werden die Karten gemischt. Paare über ⚙.</div></div>`);
        const got = prog.quiz[b.id] || {}, order = shuffled(b.pairs.map((_, i) => i), b.id), used = new Set(Object.values(got));
        return wrap(b, `<div class="lp-card lp-match"><b class="lp-ctitle">${esc(b.title)}</b>${xpTag(b)}<div class="grid">`
          + b.pairs.map((p, i) => { const ci = order[i], g = got[i]; return `<div class="chip${used.has(ci) ? ' used' : ''}" data-chip="${ci}">${esc(b.pairs[ci].a)}</div><div class="slot${g != null ? (g === i ? ' ok' : ' no') : ''}" data-slot="${i}"><span>${esc(p.b)}</span>${g != null ? `<span class="got">${esc(b.pairs[g].a)}</span>` : ''}</div>`; }).join('')
          + `</div><div class="lp-state" style="margin-top:6px">${ok ? '✓ alles richtig zugeordnet' : 'Karte antippen, dann das Passende – oder ziehen.'}</div></div>`);
      }
      case 'lock': { const ref = findBlock(b.after); return wrap(b, `<div class="lp-card" style="border-style:dashed;text-align:center;color:var(--ink-2)">🔒 <b>Sperre</b> – alles darunter in dieser Station wird erst frei, wenn <b>${ref ? esc(blockLabel(ref.b)) : '<i>(noch keine Aufgabe gewählt – ⚙)</i>'}</b> gelöst ist.</div>`); }
      case 'code': return wrap(b, `<div class="lp-card lp-code"><b class="lp-ctitle">Code</b> <span style="color:var(--ink-2);font-size:.85em">${esc(b.lang)}</span>${E() ? `<pre contenteditable="true" data-f="code" data-ph="Code …" spellcheck="false">${esc(b.code)}</pre>` : `<pre class="hl">${highlightCode(b.code || '', b.lang)}</pre>`}${b.nocopy ? (E() ? '<div class="ed-hint">ohne Knopf – nur zum Anschauen (⚙)</div>' : '') : `<button class="lp-btn alt" data-run="copy">⧉ ${esc(host.copyLabel || 'Kopieren')}</button>`}</div>`);
      case 'uml': return wrap(b, `<div class="lp-uml">${ce('name', b.name, 'Klassenname', { tag: 'div', cls: 'un' })}<div class="us">${(b.attrs || []).map(a => `<div>${esc(a)}</div>`).join('') || '<div>&nbsp;</div>'}</div><div class="us">${(b.methods || []).map(a => `<div>${esc(a)}</div>`).join('') || '<div>&nbsp;</div>'}</div></div>${E() ? '<div class="ed-hint">Attribute und Methoden über ⚙</div>' : ''}`);
    }
    if (t?.render) return wrap(b, t.render(b, ctx));
    // Baustein einer App, die hier nicht geladen ist: Inhalt zeigen, aber nicht prüfen
    const app = b.app || (b.type.startsWith('fp') || ['sheet', 'action', 'legend'].includes(b.type) ? 'FlowPad' : 'eine App');
    return wrap(b, `<div class="lp-missing"><span class="app">braucht ${esc(typeof app === 'string' ? app : 'eine App')}</span>${b.title ? `<div><b>${esc(plain(b.title))}</b></div>` : ''}${b.html ? `<div>${b.html}</div>` : ''}${b.label ? `<div>${esc(b.label)}</div>` : ''}</div>`);
  }
  function certHtml() {
    const c = doc.cert, can = certReady();
    if (!c.on) return `<div class="lp-cert" style="opacity:.5"><div class="seal">★</div><div><b>Zertifikat ist aus</b><br><button class="lp-btn alt" data-act="certcfg">⚙ Zertifikat einstellen</button></div></div>`;
    return `<div class="lp-cert" id="st-cert"><div class="seal">★</div><div><b>${c.need === 'immer' ? 'Nachweis' : doc.form === 'challenge' ? 'Challenge geschafft?' : 'Zertifikat'}</b><br>${E() ? `Am Ende: Name eingeben, PDF mit Bearbeitungszeit und Erfolgsübersicht.<br><button class="lp-btn alt" data-act="certcfg">⚙ Zertifikat einstellen</button><button class="lp-btn alt" data-act="certprev">Muster ansehen</button>`
      : (c.need === 'immer' ? `Erstelle deinen Nachweis mit dem aktuellen Stand – jederzeit, auch wenn noch nicht alles gelöst ist.<br><button class="lp-btn" data-act="certprev">★ Nachweis (PDF) erstellen</button>` : can ? `Alles geschafft – erstelle dein Zertifikat.<br><button class="lp-btn" data-act="certprev">★ Zertifikat (PDF) erstellen</button>` : `Wird frei, wenn ${c.need === 'alle' ? 'alle Aufgaben gelöst sind' : c.need === 'pct' ? `mindestens ${c.pct} % gelöst sind` : '…'}.<br><button class="lp-btn" disabled>★ Zertifikat (PDF) erstellen</button>`)}</div></div>`;
  }
  function shuffled(arr, seed) { let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const checksOf = s => { const c = s.blocks.filter(isCheck).map(b => b.id); if (s.check) c.push('st:' + s.id); return c; };
  const stationDone = s => { const c = checksOf(s); return c.length ? c.every(id => prog.solved[id]) : !!prog.visited[s.id] && mode === 'preview'; };
  const allChecks = () => doc.stations.flatMap(checksOf);
  function certReady() { const all = allChecks(), n = all.filter(id => prog.solved[id]).length; if (doc.cert.need === 'immer') return true; if (doc.cert.need === 'pct') return n >= Math.ceil(all.length * doc.cert.pct / 100); return n === all.length; }
  const xpBlocks = () => doc.stations.flatMap(s => s.blocks.filter(isCheck));
  const xpMax = () => xpBlocks().reduce((a, b) => a + (+b.xp || 0), 0);
  const xpNow = () => xpBlocks().filter(b => prog.solved[b.id]).reduce((a, b) => a + (+b.xp || 0), 0);
  const markSel = () => $$('.blk', lp).forEach(e => e.classList.toggle('sel', e.dataset.id === selId));
  const normAns = s => String(s).trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
  /** Antwort prüfen: Text ohne Groß/Klein und Leerzeichen, Zahlen auch mit Komma und kleinen Rundungsunterschieden */
  function isAnswer(expected, v) {
    const num = x => { const t = String(x).trim().replace(/\s|€|%/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); return /^[-+]?\d*\.?\d+$/.test(t) ? parseFloat(t) : NaN; };
    return String(expected || '').split('|').some(e => { const a = num(e), b = num(v); if (!isNaN(a) && !isNaN(b)) return Math.abs(a - b) <= Math.max(1e-9, Math.abs(a) * 1e-9, 0.005); return normAns(e) === normAns(v); });
  }
  function isGapOk(b, i, v) { const a = [...(b.html || '').matchAll(/\[\[(.+?)\]\]/g)][i]; return !!a && a[1].split('|').some(x => normAns(x) === normAns(v)); }

  /* ---------- Eingaben im Bearbeiten-Modus ---------- */
  function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; while (ks.length > 1) { const k = ks.shift(); if (o[k] == null) o[k] = {}; o = o[k]; } o[ks[0]] = val; }
  lp.addEventListener('input', ev => {
    if (ev.target.matches?.('[data-pts]') && E()) { const r = findBlock(ev.target.closest('.blk').dataset.id); if (r) { r.b.pts = Math.max(0, +ev.target.value || 0); softCommit(); } return; }
    const el = ev.target.closest('[data-f]'); if (!el || !E()) return;
    const f = el.dataset.f, val = el.dataset.rich ? clean(el.innerHTML) : el.textContent.replace(/\s+/g, ' ').trim();
    if (f === 'code') { const r = findBlock(el.closest('.blk').dataset.id); r.b.code = el.innerText.replace(/\n$/, ''); softCommit(); return; }
    if (f.startsWith('$skin.src.')) { doc.skin.src[f.slice(10)] = el.innerText.replace(/\n$/, ''); softCommit(); return; }
    if (f === '$goalsList') { doc.goals = $$('li', el).map(li => clean(li.innerHTML)).filter(g => plain(g).trim()); softCommit(); return; }
    if (f.startsWith('$st.')) { const s = doc.stations.find(x => x.id === el.closest('.lp-station').dataset.sid); s[f.slice(4)] = val; softCommit(); refreshTrail(); return; }
    if (f.startsWith('$')) { setPath(doc, f.slice(1), val); softCommit(); return; }
    const r = findBlock(el.closest('.blk').dataset.id); if (!r) return;
    setPath(r.b, f, val); softCommit();
  });
  lp.addEventListener('paste', ev => {
    const el = ev.target.closest('[data-f]'); if (!el) return;
    ev.preventDefault(); const t = (ev.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, t);
  });
  lp.addEventListener('focusout', ev => { if (ev.target.closest('[data-f]')) commit(); });
  const refreshTrail = () => $$('#stops a[data-sid]', lp).forEach(a => { const s = doc.stations.find(x => x.id === a.dataset.sid); if (s) a.title = s.title; });

  /* ---------- Klicks ---------- */
  lp.addEventListener('click', ev => {
    const t = ev.target;
    if (E() && doc.skin && t.closest('a[href], label') && !t.closest('[data-f], .ed-tools')) ev.preventDefault(); // Links und Haken der Vorlage nicht auslösen
    if (E() && t.closest('.lp-logo, .lp-hero.has-bg') && !t.closest('[data-f]')) { openDesign(); return; }
    const skst = t.closest('[data-skst]'); if (skst) { goStation(skst.dataset.skst, true); return; }
    const fzb = t.closest('[data-fz]'); if (fzb) { fz = Math.min(1.5, Math.max(.8, +(fz + (fzb.dataset.fz === '+' ? .1 : -.1)).toFixed(2))); lp.style.setProperty('--fz', fz); return; }
    const stop = t.closest('#stops a'); if (stop) { if (stop.dataset.sid === 'cert') { $('#st-cert')?.scrollIntoView({ behavior: 'smooth' }); return; } goStation(stop.dataset.sid, true); return; }
    const sd = t.closest('[data-sdone]'); if (sd && !E()) { prog.solved['st:' + sd.dataset.sdone] = sd.checked; render(); return; }
    const act = t.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'addStation') { const s = { id: uid(), title: '', sub: '', check: !!doc.skin, blocks: [{ id: uid(), type: 'text', html: '' }] }; doc.stations.push(s); curSid = s.id; commit(); render(); goStation(s.id, true); setTimeout(() => $(`#st-${s.id} h2[data-f]`)?.focus(), 350); return; }
      if (a === 'certcfg') { openForm('cert'); return; }
      if (a === 'certprev') { certPreview(); return; }
    }
    const sact = t.closest('[data-sact]');
    if (sact) {
      const sid = sact.closest('.lp-station').dataset.sid, i = doc.stations.findIndex(s => s.id === sid), a = sact.dataset.sact;
      if (a === 'cfg') { openForm('st:' + sid); return; }
      if (a === 'del') { if (doc.stations.length < 2) { toast('Die letzte Station bleibt.'); return; } if (!confirm('Station „' + (doc.stations[i].title || 'ohne Titel') + '“ mit allen Bausteinen löschen?')) return; doc.stations.splice(i, 1); }
      else { const j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= doc.stations.length) return; [doc.stations[i], doc.stations[j]] = [doc.stations[j], doc.stations[i]]; }
      commit(); render(); if (a !== 'del') goStation(sid, false); return;
    }
    const pl = t.closest('.ed-plus button'); if (pl) { const p = pl.parentElement; openPalette(pl, { sid: p.dataset.sid, at: +p.dataset.at }); return; }
    const bact = t.closest('[data-bact]');
    if (bact && E()) { blockAction(bact.closest('.blk').dataset.id, bact.dataset.bact); return; }
    const qok = t.closest('[data-qok]');
    if (qok && E()) { const r = findBlock(qok.closest('.blk').dataset.id); const [qi, i] = qok.dataset.qok.split('.').map(Number); r.b.qs[qi].opts.forEach((o, k) => o.ok = k === i); commit(); render(); return; }
    const run = t.closest('[data-run]');
    if (run) { runAction(run.closest('.blk').dataset.id, run.dataset.run); return; }
    if (E()) { const blk = t.closest('.blk'); selId = blk ? blk.dataset.id : null; markSel(); if (blk) curSid = blk.closest('.lp-station')?.dataset.sid || curSid; if (panelOpen && blk && panelWhat !== selId) { panelWhat = selId; drawPanel(); } return; }
    const opt = t.closest('[data-opt]');
    if (opt) { const id = opt.closest('.blk').dataset.id, r = findBlock(id), [qi, i] = opt.dataset.opt.split('.').map(Number); const st = prog.quiz[id] || (prog.quiz[id] = {}); st[qi] = i; if (r.b.qs.every((q, k) => q.opts[st[k]]?.ok)) solve(id); else render(); return; }
    const chip = t.closest('[data-chip], [data-gchip]');
    if (chip && !chip.classList.contains('used')) { $$('.picked', lp).forEach(c => c !== chip && c.classList.remove('picked')); chip.classList.toggle('picked'); return; }
    const slot = t.closest('[data-slot]');
    if (slot) { const pick = $('.chip.picked', slot.closest('.blk')); if (pick) placeChip(slot.closest('.blk').dataset.id, +pick.dataset.chip, +slot.dataset.slot); return; }
    const gs = t.closest('[data-gslot]');
    if (gs) { const id = gs.closest('.blk').dataset.id, pick = $('.gchip.picked', gs.closest('.blk')); placeGap(id, +gs.dataset.gslot, pick ? pick.dataset.gchip : null); }
  });
  lp.addEventListener('toggle', ev => {
    if (E()) return;
    const d = ev.target; if (!d.matches || !d.matches('details') || !d.open) return;
    const id = d.closest('.blk')?.dataset.id; if (!id) return;
    if (d.dataset.tip != null) prog.tips[id + ':' + d.dataset.tip] = 1;
    if (d.dataset.sol) prog.sol[id] = 1;
  }, true);
  lp.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches?.('[data-ans]')) { ev.preventDefault(); runAction(ev.target.closest('.blk').dataset.id, 'answer'); } });
  lp.addEventListener('input', ev => {
    if (E()) return; const inp = ev.target.closest('[data-gap]'); if (!inp) return;
    const id = inp.closest('.blk').dataset.id, r = findBlock(id); (prog.quiz[id] || (prog.quiz[id] = {}))[inp.dataset.n] = inp.value;
    let all = true;
    $$('[data-gap]', inp.closest('.blk')).forEach((e, i) => { const good = isGapOk(r.b, i, e.value); e.classList.toggle('ok', good); e.classList.toggle('no', !good && e.value.trim() !== ''); if (!good) all = false; });
    if (all && !prog.solved[id]) solve(id, true);
  });
  function placeChip(id, chip, slot) {
    const r = findBlock(id), got = prog.quiz[id] || (prog.quiz[id] = {});
    for (const k in got) if (got[k] === chip) delete got[k];
    got[slot] = chip;
    if (r.b.pairs.every((_, i) => got[i] === i)) solve(id); else render();
  }
  function placeGap(id, slot, word) {
    const got = prog.quiz[id] || (prog.quiz[id] = {});
    delete prog.quiz[id + ':chk'];
    if (word == null) delete got[slot]; else { for (const k in got) if (got[k] === word) delete got[k]; got[slot] = word; }
    render();
  }
  function solve(id, keepFocus) {
    prog.solved[id] = true;
    const r = findBlock(id); if (doc.form === 'challenge' && r?.b.xp) toast(`⚡ +${r.b.xp} XP`);
    if (keepFocus) { const s = scroller.scrollTop; const a = document.activeElement, n = a?.dataset?.n; render(); scroller.scrollTop = s; if (n != null) { const e = $(`.blk[data-id="${id}"] [data-n="${n}"]`, lp); e?.focus(); e && (e.selectionStart = e.value.length); } }
    else render();
  }

  /* ---------- Bausteine bearbeiten ---------- */
  function blockAction(id, a) {
    const r = findBlock(id); if (!r) return;
    if (a === 'cfg') { selId = id; markSel(); openForm(id); return; }
    if (a === 'grip') return;
    if (a === 'del') { r.st.blocks.splice(r.i, 1); selId = null; commit(); render(); toast('Baustein gelöscht · <b>⌘Z</b> holt ihn zurück'); return; }
    if (a === 'dup') { const c = clone(r.b); c.id = uid(); r.st.blocks.splice(r.i + 1, 0, c); selId = c.id; commit(); render(); return; }
    if (a === 'up' || a === 'down') moveBlock(id, a === 'up' ? -1 : 1);
  }
  function moveBlock(id, dir) {
    const r = findBlock(id); if (!r) return;
    const si = doc.stations.indexOf(r.st), j = r.i + dir;
    if (j >= 0 && j < r.st.blocks.length) { [r.st.blocks[r.i], r.st.blocks[j]] = [r.st.blocks[j], r.st.blocks[r.i]]; }
    else { const ns = doc.stations[si + dir]; if (!ns) return; r.st.blocks.splice(r.i, 1); if (dir < 0) ns.blocks.push(r.b); else ns.blocks.unshift(r.b); curSid = ns.id; }
    commit(); render(); $(`.blk[data-id="${id}"]`, lp)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function insertBlock(type, sid, at, replaceId) {
    const t = T[type]; const b = { id: uid(), type: t.alias || type, ...t.make() };
    const st = doc.stations.find(s => s.id === sid);
    if (replaceId) { const r = findBlock(replaceId); r.st.blocks.splice(r.i, 1, b); } else st.blocks.splice(at, 0, b);
    selId = b.id; curSid = sid; commit(); render();
    const el = $(`.blk[data-id="${b.id}"]`, lp);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (['image', 'lock', 'file', 'html'].includes(type) || t.openForm) openForm(b.id);
    else setTimeout(() => $('[data-f]', el)?.focus(), 60);
  }

  /* ---------- Bausteinauswahl (+ und /) ---------- */
  let pop = null;
  const closePop = () => { pop?.remove(); pop = null; };
  function openPalette(anchor, c) {
    closePop();
    pop = document.createElement('div'); pop.className = 'ed-pop';
    let filter = '', hi = 0;
    const draw = () => {
      const items = Object.entries(T).filter(([k, t]) => (doc.skin ? SKIN_TYPES.has(k) : !t.skinOnly)).filter(([k, t]) => !filter ||(t.n + ' ' + t.h + ' ' + k).toLowerCase().includes(filter));
      let g = '', h = `<h3>${c.slash ? `Baustein: „/${esc(filter)}“` : 'Baustein einfügen'}</h3><div class="ed-pal">`;
      items.forEach(([k, t], i) => { if (t.g !== g) { g = t.g; h += `<div class="grp">${g}</div>`; } h += `<button data-type="${k}" class="${i === hi ? 'hi' : ''}"><b>${t.ic} ${esc(t.n)}</b><span>${esc(t.h)}</span></button>`; });
      if (!items.length) h += '<div class="grp">nichts gefunden</div>';
      pop.innerHTML = h + '</div>'; pop._items = items;
    };
    draw();
    pop.addEventListener('click', e => { const b = e.target.closest('[data-type]'); if (!b) return; closePop(); insertBlock(b.dataset.type, c.sid, c.at, c.replaceId); });
    pop._key = e => {
      const items = pop._items;
      if (e.key === 'ArrowDown') { hi = Math.min(items.length - 1, hi + 1); draw(); e.preventDefault(); return true; }
      if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); draw(); e.preventDefault(); return true; }
      if (e.key === 'Enter') { e.preventDefault(); const it = items[hi]; closePop(); if (it) insertBlock(it[0], c.sid, c.at, c.replaceId); return true; }
      if (e.key === 'Escape') { closePop(); return true; }
      if (c.slash) {
        if (e.key === 'Backspace') { if (!filter) { closePop(); return false; } filter = filter.slice(0, -1); hi = 0; draw(); return false; }
        if (e.key.length === 1) { filter += e.key.toLowerCase(); hi = 0; draw(); return false; }
      }
      return false;
    };
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, ph = pop.offsetHeight;
    let x = Math.min(innerWidth - w - 10, Math.max(10, r.left + r.width / 2 - w / 2)), y = r.bottom + 6;
    if (y + ph > innerHeight - 10) y = Math.max(10, r.top - ph - 6);
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  document.addEventListener('pointerdown', e => { if (pop && !pop.contains(e.target) && !e.target.closest('.ed-plus') && !e.target.closest('#bMore, #bOpen')) closePop(); }, true);

  /* ---------- Tastenkürzel ---------- */
  document.addEventListener('keydown', e => {
    if (PLAYER) return;
    if (pop && pop._key && pop._key(e)) return;
    if ($('.ed-dlg')) { if (e.key === 'Escape') closeDlg(false); return; }
    if (!e.target.closest?.('#lp, body') || e.target.closest?.('.pf-side')) return; // Eingaben in der App nebenan nicht abfangen
    const mod = e.metaKey || e.ctrlKey, ed = e.target.closest?.('[data-f]');
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); setMode(mode === 'edit' ? 'preview' : 'edit'); return; }
    if (!E()) return;
    if (ed && mod && e.key.toLowerCase() === 'e') { e.preventDefault(); wrapSel('code'); return; }
    if (ed && mod && e.key.toLowerCase() === 'k') { e.preventDefault(); const url = prompt('Link-Adresse (https://…)'); if (url && /^https?:\/\//.test(url)) document.execCommand('createLink', false, url); return; }
    if (ed && mod && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'i') && !ed.dataset.rich) { e.preventDefault(); return; }
    if (mod && e.key === 'Enter') { e.preventDefault(); const r = selId && findBlock(selId); const st = r ? r.st : doc.stations.find(s => s.id === curSid); insertBlock('text', st.id, r ? r.i + 1 : st.blocks.length); return; }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && selId) { e.preventDefault(); if (pending) commit(); moveBlock(selId, e.key === 'ArrowUp' ? -1 : 1); return; }
    if (e.key === '/' && ed && ed.dataset.f === 'html' && ed.textContent.trim() === '') {
      const r = findBlock(ed.closest('.blk').dataset.id);
      if (r && r.b.type === 'text') { e.preventDefault(); openPalette(ed, { sid: r.st.id, at: r.i, replaceId: r.b.id, slash: true }); }
      return;
    }
    if (e.key === 'Escape') { selId = null; markSel(); document.activeElement?.blur(); }
  });
  function wrapSel(tag) {
    const s = getSelection(); if (!s.rangeCount) return; const r = s.getRangeAt(0); if (r.collapsed) return;
    const el = document.createElement(tag); el.appendChild(r.extractContents()); r.insertNode(el);
    s.removeAllRanges(); const nr = document.createRange(); nr.selectNodeContents(el); s.addRange(nr);
    el.closest('[data-f]')?.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ---------- Ziehen: Bausteine, Stationen, Karten ---------- */
  let drag = null, scrollTimer = null, scrollDy = 0;
  lp.addEventListener('pointerdown', e => {
    if (!E()) { chipDown(e); return; }
    const g = e.target.closest('.grip');
    if (g) { e.preventDefault(); const blk = g.closest('.blk'); selId = blk.dataset.id; markSel(); drag = { kind: 'blk', id: blk.dataset.id, el: blk, line: document.createElement('div') }; drag.line.className = 'ed-drop-line'; blk.classList.add('drag-ghost'); document.body.classList.add('pf-dragging'); g.setPointerCapture(e.pointerId); return; }
    const stop = e.target.closest('#stops a[data-sid]');
    if (stop && stop.dataset.sid !== 'cert' && e.pointerType === 'mouse') e.preventDefault();
    if (stop && stop.dataset.sid !== 'cert') drag = { kind: 'st', id: stop.dataset.sid, el: stop, x: e.clientX, moved: false, pid: e.pointerId };
  });
  lp.addEventListener('pointermove', e => {
    if (!drag) return;
    if (drag.kind === 'chip') { chipMove(e); return; }
    if (drag.kind === 'st') {
      if (!drag.moved && Math.abs(e.clientX - drag.x) < 8) return;
      if (!drag.moved) { drag.moved = true; drag.el.classList.add('dragging'); try { drag.el.setPointerCapture(drag.pid); } catch (er) { } }
      $$('#stops a', lp).forEach(a => a.classList.remove('drop-before', 'drop-after'));
      const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('#stops a[data-sid]');
      if (over && over !== drag.el && over.dataset.sid !== 'cert') { const r = over.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2; over.classList.add(after ? 'drop-after' : 'drop-before'); drag.to = { sid: over.dataset.sid, after }; } else drag.to = null;
      return;
    }
    autoScroll(e.clientY);
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    const over = els.map(x => x.closest('.blk')).find(x => x && x !== drag.el);
    drag.line.remove(); drag.to = null;
    if (over) { const r = over.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2; (after ? over.after(drag.line) : over.before(drag.line)); drag.to = { id: over.dataset.id, after }; return; }
    const st = els.map(x => x.closest('.lp-station')).find(Boolean);
    if (st) { [...st.querySelectorAll(':scope > .ed-plus')].pop()?.before(drag.line); drag.to = { sid: st.dataset.sid, end: true }; }
  });
  function endDrag(e) {
    if (!drag) return;
    if (drag.kind === 'chip') { chipUp(e); return; }
    const d = drag; drag = null; document.body.classList.remove('pf-dragging');
    if (d.kind === 'st') {
      $$('#stops a', lp).forEach(a => a.classList.remove('drop-before', 'drop-after', 'dragging'));
      if (d.moved && d.to) { const i = doc.stations.findIndex(s => s.id === d.id); const [s] = doc.stations.splice(i, 1); let j = doc.stations.findIndex(x => x.id === d.to.sid); if (d.to.after) j++; doc.stations.splice(j, 0, s); commit(); render(); toast('Station verschoben'); }
      return;
    }
    d.line.remove(); d.el.classList.remove('drag-ghost'); clearInterval(scrollTimer); scrollTimer = null;
    if (!d.to) return;
    const r = findBlock(d.id); r.st.blocks.splice(r.i, 1);
    if (d.to.end) { const st = doc.stations.find(s => s.id === d.to.sid); st.blocks.push(r.b); curSid = st.id; }
    else { const t = findBlock(d.to.id); t.st.blocks.splice(t.i + (d.to.after ? 1 : 0), 0, r.b); curSid = t.st.id; }
    commit(); render();
  }
  lp.addEventListener('pointerup', endDrag); lp.addEventListener('pointercancel', endDrag);
  function autoScroll(y) {
    const r = scroller.getBoundingClientRect(); scrollDy = y < r.top + 60 ? -12 : y > r.bottom - 60 ? 12 : 0;
    if (scrollDy && !scrollTimer) scrollTimer = setInterval(() => { if (!scrollDy) { clearInterval(scrollTimer); scrollTimer = null; } scroller.scrollTop += scrollDy; }, 16);
  }
  function chipDown(e) {
    const c = e.target.closest('[data-chip], [data-gchip]'); if (!c || c.classList.contains('used')) return;
    if (e.pointerType === 'mouse') e.preventDefault(); // Maus: kein Markieren von Text beim Ziehen
    drag = { kind: 'chip', el: c, x: e.clientX, y: e.clientY, moved: false, pid: e.pointerId, gap: !!c.dataset.gchip };
  }
  // Während gezogen wird, darf der Browser (v. a. Safari am Mac) keinen Text markieren
  document.addEventListener('selectstart', e => { if (drag) e.preventDefault(); });
  function chipMove(e) {
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    if (!drag.moved) { drag.moved = true; document.body.classList.add('pf-dragging'); getSelection()?.removeAllRanges(); try { drag.el.setPointerCapture(drag.pid); } catch (er) { } drag.ghost = drag.el.cloneNode(true); Object.assign(drag.ghost.style, { position: 'fixed', zIndex: 300, pointerEvents: 'none', width: drag.el.offsetWidth + 'px', opacity: .9, boxShadow: '0 8px 20px rgba(0,0,0,.25)' }); document.body.appendChild(drag.ghost); }
    drag.ghost.style.left = (e.clientX - drag.el.offsetWidth / 2) + 'px'; drag.ghost.style.top = (e.clientY - 20) + 'px';
    $$('.hover', lp).forEach(s => s.classList.remove('hover'));
    document.elementsFromPoint(e.clientX, e.clientY).find(x => x.matches?.(drag.gap ? '[data-gslot]' : '[data-slot]'))?.classList.add('hover');
  }
  function chipUp(e) {
    const d = drag; drag = null; document.body.classList.remove('pf-dragging'); if (!d.moved) return;
    d.ghost?.remove(); $$('.hover', lp).forEach(s => s.classList.remove('hover'));
    const s = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.matches?.(d.gap ? '[data-gslot]' : '[data-slot]'));
    if (!s || s.closest('.blk') !== d.el.closest('.blk')) return;
    const id = s.closest('.blk').dataset.id;
    if (d.gap) placeGap(id, +s.dataset.gslot, d.el.dataset.gchip); else placeChip(id, +d.el.dataset.chip, +s.dataset.slot);
  }

  /* ---------- Stationen: springen, aktuelle merken ---------- */
  function goStation(sid, smooth) {
    curSid = sid;
    if (single) { render(); scroller.scrollTop = 0; return; }
    $$('.lp-station', lp).forEach(s => s.classList.toggle('cur', s.dataset.sid === sid));
    $$('#stops a', lp).forEach(a => a.classList.toggle('cur', a.dataset.sid === sid));
    const el = $(`#st-${sid}`, lp); if (el) scroller.scrollTo({ top: el.offsetTop - ($('.lp-trail, .pf-skin.editing .trail', lp)?.offsetHeight || 0) - 4, behavior: smooth ? 'smooth' : 'auto' });
  }
  scroller.addEventListener('scroll', () => {
    if (single) return;
    const top = scroller.getBoundingClientRect().top + ($('.lp-trail, .pf-skin.editing .trail', lp)?.offsetHeight || 0) + 40;
    let cur = null; for (const s of $$('.lp-station', lp)) { if (s.getBoundingClientRect().top <= top) cur = s.dataset.sid; }
    cur = cur || doc.stations[0]?.id;
    if (cur && cur !== curSid) { curSid = cur; if (mode === 'preview') prog.visited[cur] = 1; $$('.lp-station', lp).forEach(s => s.classList.toggle('cur', s.dataset.sid === cur)); $$('#stops a', lp).forEach(a => a.classList.toggle('cur', a.dataset.sid === cur)); $('#stops a.cur', lp)?.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
  }, { passive: true });

  /* ---------- Einstellungen (⚙) ---------- */
  const XP = { k: 'xp', l: 'XP (Challenge)', t: 'number', show: () => doc.form === 'challenge' };
  const FORMS = {
    text: [{ k: 'tag', l: 'Art', t: 'select', o: [['p', 'Absatz'], ['h3', 'Zwischenüberschrift'], ['ul', 'Liste'], ['ol', 'nummerierte Liste']], show: () => !!doc.skin }, { k: 'anim', l: 'Textanimation', t: 'select', o: ANIM_OPTS, help: 'Läuft einmal, sobald der Text ins Bild scrollt (nur in Vorschau und für Schüler).', show: () => !doc.skin }],
    info: [{ k: 'kind', l: 'Art', t: 'select', o: Object.entries(INFO_KINDS).map(([k, v]) => [k, v[0] + ' ' + v[1]]) }, { k: 'title', l: 'Überschrift', t: 'text', help: 'leer = Name der Art', show: b => b.kind !== 'figur' }, { k: 'img', l: 'Figur', t: 'figure', show: b => b.kind === 'figur' }, { k: 'name', l: 'Name der Figur', t: 'text', show: b => b.kind === 'figur' }, { k: 'img', l: 'Eigenes Bild', t: 'image', show: b => b.kind === 'figur' || b.kind === 'abschluss' }, { k: 'anim', l: 'Textanimation', t: 'select', o: ANIM_OPTS }],
    image: [{ k: 'src', l: 'Bild oder GIF', t: 'image' }, { k: 'caption', l: 'Bildunterschrift', t: 'text' }, { k: 'alt', l: 'Alternativtext (für Vorlese-Programme)', t: 'text' }, { k: 'size', l: 'Größe', t: 'select', o: [['voll', 'volle Breite'], ['klein', 'klein']] }],
    table: [{ k: 'head', l: 'Erste Zeile ist Kopfzeile', t: 'check' }, { k: 'rows', l: 'Größe', t: 'grid' }],
    reveal: [{ k: 'summary', l: 'Überschrift der Klappbox', t: 'text' }],
    file: [{ k: 'data', l: 'Datei', t: 'file' }, { k: 'name', l: 'Dateiname', t: 'text' }],
    html: [{ k: 'html', l: 'HTML', t: 'code', help: 'Wird für Schüler so angezeigt. Skripte laufen erst im exportierten Lernpfad.' }],
    task: [{ k: 'title', l: 'Titel', t: 'text' }, { k: 'answer', l: 'Ergebnis zur Selbstkontrolle (optional)', t: 'text', help: 'Leer = Schüler hakt „Erledigt“ ab. Sonst tippen sie das Ergebnis ein; mehrere richtige mit | trennen. Zahlen werden mit Komma oder Punkt erkannt.', show: () => !doc.skin }, { k: 'tips', l: 'Tipps (werden nacheinander aufgedeckt)', t: 'list', ph: 'Tipp', vis: 'tipsHide' }, { k: 'solution', l: 'Lösung zum Aufdecken (leer = keine)', t: 'text' }, { k: 'solHide', l: 'Lösung für Schüler sichtbar', t: 'shown', show: b => !!b.solution }, { k: 'img', l: 'Bild oder GIF zur Aufgabe', t: 'image' }, XP],
    quiz: [{ k: 'qs', l: 'Fragen', t: 'qs' }, XP],
    gap: [{ k: 'bank', l: 'Begriffe zum Ziehen anbieten (statt Tippen)', t: 'check' }, { k: 'extra', l: 'Zusätzliche falsche Begriffe (Ablenker)', t: 'list', ph: 'Begriff', show: b => b.bank }, { k: 'heft', l: 'Als Hefteintrag gestalten (mit Titel)', t: 'check' }, XP],
    match: [{ k: 'title', l: 'Überschrift', t: 'text' }, { k: 'pairs', l: 'Paare', t: 'pairs' }, XP],
    lock: [{ k: 'after', l: 'Frei, sobald gelöst ist:', t: 'target' }],
    code: [{ k: 'lang', l: 'Sprache', t: 'select', o: [['java', 'Java'], ['python', 'Python'], ['sql', 'SQL'], ['text', 'Text']] }, { k: 'file', l: 'Dateiname über dem Code', t: 'text', show: () => !!doc.skin }, { k: 'mark', l: 'Zeilen hervorheben (z. B. 3-5)', t: 'text', show: () => !!doc.skin }, { k: 'nocopy', l: 'ohne Knopf (nur zum Anschauen, z. B. wenn der Code schon im Projekt steht oder eine Aufgabe verraten würde)', t: 'check' }],
    uml: [{ k: 'name', l: 'Klassenname', t: 'text' }, { k: 'attrs', l: 'Attribute', t: 'list', ph: 'Attribut' }, { k: 'methods', l: 'Methoden', t: 'list', ph: 'Methode' }],
  };
  const getP = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  let dlg = null;
  function closeDlg(apply) { if (!dlg) return; if (apply) dlg.apply(); dlg.el.remove(); dlg.bd.remove(); dlg = null; }
  function dialog(cls = '') {
    const bd = document.createElement('div'); bd.className = 'ed-backdrop' + (cls.includes('dock') ? ' clear' : '');
    const el = document.createElement('div'); el.className = 'ed-dlg ' + cls; el.setAttribute('role', 'dialog');
    document.body.append(bd, el); return { el, bd };
  }
  /** Einstellungen als Dialog – oder, auf breiten Bildschirmen, in der Seitenleiste rechts */
  function openForm(id) {
    if (id !== 'cert' && panelFits()) { showPanel(id); return; }
    const { el, bd } = dialog(id === 'cert' ? '' : 'dock'); bd.onclick = () => closeDlg(true);
    dlg = { el, bd, apply: () => { } };
    dlg.apply = formUI(el, id, { live: false });
  }
  /** Formular für Baustein, Station oder Zertifikat. live: Änderungen wirken sofort (Seitenleiste), sonst erst mit „Fertig“. */
  function formUI(el, id, { live }) {
    let fields, b, title, apply;
    if (id === 'cert') {
      b = clone(doc.cert); title = '★ Zertifikat';
      fields = [{ k: 'on', l: 'Zertifikat am Ende anbieten', t: 'check' },
        { k: 'need', l: 'Erreichbar, wenn …', t: 'select', o: [['immer', 'immer – als „Nachweis“ mit dem aktuellen Stand'], ['alle', 'alle Aufgaben gelöst sind'], ['pct', 'ein Mindestanteil gelöst ist']] },
        { k: 'pct', l: 'Mindestanteil in %', t: 'number', show: x => x.need === 'pct' },
        { k: 'text', l: 'Text auf dem Zertifikat', t: 'text', help: '„Max Muster … hat den Lernpfad erfolgreich bearbeitet.“' },
        { k: 'show.zeit', l: 'Bearbeitungszeit zeigen', t: 'check' }, { k: 'show.tipps', l: 'Benutzte Tipps und Lösungshilfen zeigen', t: 'check' },
        { k: 'show.quiz', l: 'Ergebnis je Station zeigen', t: 'check' }, { k: 'show.xp', l: 'XP zeigen (Challenge)', t: 'check' }];
      apply = () => { doc.cert = b; commit(); render(); };
    } else if (id.startsWith('st:')) {
      const s = doc.stations.find(x => x.id === id.slice(3)); b = live ? s : { title: s.title, sub: s.sub, nr: s.nr || '', check: s.check, anim: s.anim || '' }; title = '⚙ Station';
      fields = [{ k: 'title', l: 'Titel', t: 'text' }, { k: 'sub', l: 'Untertitel', t: 'text' }, { k: 'nr', l: 'Eigenes Zeichen statt Nummer (z. B. ✂)', t: 'text', help: 'leer = automatische Nummer' }, { k: 'check', l: 'Haken „Station erledigt“ am Ende', t: 'check' }, { k: 'anim', l: 'Animation des Stationstitels', t: 'select', o: ANIM_OPTS }];
      apply = () => { Object.assign(s, b); commit(); render(); };
    } else {
      const r = findBlock(id); b = live ? r.b : clone(r.b); const t = def(b);
      fields = t?.form || FORMS[b.type] || [];
      title = b.type === 'info' ? (INFO_KINDS[b.kind]?.[0] + ' ' + INFO_KINDS[b.kind]?.[1]) : (t?.ic || '') + ' ' + (t?.n || b.type);
      apply = () => { const rr = findBlock(id); if (rr) rr.st.blocks[rr.i] = b; commit(); render(); };
    }
    if (live) apply = () => { softCommit(); render(); };
    const changed = () => { if (live) apply(); };
    const takeBtn = (kind, k) => host.selectedCell ? `<button class="take" data-take="${kind}" data-tk="${k}">${kind === 'cell' ? '▦ gewählte Zelle' : 'fx aus ' + esc(host.name || 'App')}</button>` : '';
    const draw = () => {
      let h = live ? `<div class="pf-ptitle">${esc(title)}</div><div class="ed-form">` : `<header><b>${esc(title)}</b><button data-x="cancel">Abbrechen</button><button class="ok" data-x="ok">Fertig</button></header><div class="ed-form">`;
      fields.forEach(f => {
        if (f.show && !f.show(b)) return;
        const v = getP(b, f.k), help = f.help ? `<span class="help">${esc(f.help)}</span>` : '';
        if (FIELDS[f.t]) { h += FIELDS[f.t].html(f, v, b, ctx); return; }
        if (f.t === 'text') h += `<label>${esc(f.l)}<input type="text" data-k="${f.k}" value="${esc(plain(v ?? ''))}">${help}</label>`;
        else if (f.t === 'number') h += `<label>${esc(f.l)}<input type="number" min="0" data-k="${f.k}" value="${esc(v ?? 0)}">${help}</label>`;
        else if (f.t === 'check') h += `<label class="chk"><input type="checkbox" data-k="${f.k}"${v ? ' checked' : ''}>${esc(f.l)}</label>`;
        else if (f.t === 'shown') h += `<label class="chk"><input type="checkbox" data-k="${f.k}"${v ? '' : ' checked'}>${esc(f.l)}</label>`;
        else if (f.t === 'select') h += `<label>${esc(f.l)}<select data-k="${f.k}">${f.o.map(([k, n]) => `<option value="${k}"${k === (v ?? '') ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>${help}</label>`;
        else if (f.t === 'code') h += `<label>${esc(f.l)}<textarea class="mono" data-k="${f.k}" style="min-height:220px" spellcheck="false">${esc(v)}</textarea>${help}</label>`;
        else if (f.t === 'cell') h += `<div class="row"><label>${esc(f.l)}<input type="text" class="mono" data-k="${f.k}" value="${esc(v)}" placeholder="D2" autocapitalize="characters"></label>${takeBtn('cell', f.k)}</div>`;
        else if (f.t === 'formula') h += `<div class="row"><label>${esc(f.l)}<input type="text" class="mono" data-k="${f.k}" value="${esc(v)}" placeholder="=B2*C2" autocapitalize="off" autocorrect="off" spellcheck="false">${help}</label>${takeBtn('formula', f.k)}</div>`;
        else if (f.t === 'list') h += `<label>${esc(f.l)}</label>${f.vis ? '<span class="help">👁 = für Schüler sichtbar · antippen zum Verbergen</span>' : ''}<div class="list">${(v || []).map((t, i) => `<div class="it">${f.vis ? (hid => `<button class="pf-eye${hid ? ' off' : ''}" data-lvis="${f.vis}" data-i="${i}" aria-pressed="${!hid}" title="${hid ? 'verborgen – antippen zum Zeigen' : 'sichtbar – antippen zum Verbergen'}">${hid ? '🙈' : '👁'}</button>`)(!!(b[f.vis] || [])[i]) : ''}<input type="text" data-li="${f.k}" data-i="${i}" value="${esc(plain(t))}" placeholder="${esc(f.ph)} ${i + 1}"><button data-ldel="${f.k}" data-i="${i}" aria-label="entfernen">✕</button></div>`).join('')}<button class="add" data-ladd="${f.k}">＋ ${esc(f.ph)}</button></div>`;
        else if (f.t === 'qs') h += `<label>${esc(f.l)}</label>${v.map((q, qi) => `<fieldset><legend>Frage ${qi + 1}</legend><input type="text" data-qq="${qi}" value="${esc(plain(q.q))}" placeholder="Frage"><div class="list">${q.opts.map((o, i) => `<div class="it"><input type="radio" name="ok${qi}" data-qok2="${qi}.${i}"${o.ok ? ' checked' : ''} title="richtig" style="width:24px;height:24px"><input type="text" data-qt="${qi}.${i}" value="${esc(plain(o.t))}" placeholder="Antwort ${i + 1}"><button data-qodel="${qi}.${i}" aria-label="entfernen">✕</button></div><div class="it" style="padding-left:30px"><input type="text" data-qfb="${qi}.${i}" value="${esc(plain(o.fb))}" placeholder="Rückmeldung zu dieser Antwort (optional)" style="font-size:13px"></div>`).join('')}<div class="row" style="align-items:center"><button class="add" data-qoadd="${qi}">＋ Antwort</button>${v.length > 1 ? `<button class="add" data-qdel="${qi}">Frage entfernen</button>` : ''}</div></div></fieldset>`).join('')}<button class="add" data-qadd="1">＋ Frage</button>`;
        else if (f.t === 'pairs') h += `<label>${esc(f.l)}</label><div class="list">${v.map((p, i) => `<div class="it"><input type="text" data-pa="${i}" value="${esc(p.a)}" placeholder="Karte"><span>→</span><input type="text" data-pb="${i}" value="${esc(p.b)}" placeholder="passt zu"><button data-pdel="${i}" aria-label="entfernen">✕</button></div>`).join('')}<button class="add" data-padd="1">＋ Paar</button></div>`;
        else if (f.t === 'image') h += `<label>${esc(f.l)}</label><div class="imgprev">${v ? `<img src="${v}" alt="">` : ''}<label class="take" style="display:inline-flex;align-items:center;cursor:pointer">🖼 ${v ? 'Anderes Bild' : 'Bild/GIF wählen'}<input type="file" accept="image/*" data-img="${f.k}" hidden></label>${v ? `<button class="add" data-imgdel="${f.k}">entfernen</button>` : ''}</div><span class="help">Große Fotos werden verkleinert, GIFs bleiben animiert.</span>`;
        else if (f.t === 'file') h += `<label>${esc(f.l)}</label><div class="imgprev"><span class="help">${v ? `${esc(b.name)} · ${Math.round(v.length * .75 / 1024)} KB` : 'noch keine Datei'}</span><label class="take" style="display:inline-flex;align-items:center;cursor:pointer">📎 Datei wählen<input type="file" data-file="${f.k}" hidden></label></div>`;
        else if (f.t === 'figure') h += `<label>${esc(f.l)}</label><div class="ed-figs">${Object.entries(FIGURES).map(([k, F]) => `<button data-fig="${k}" title="${esc(F.n)}" aria-pressed="${v === F.src}"><img src="${F.src}" alt=""><span>${esc(F.n)}</span></button>`).join('')}</div>`;
        else if (f.t === 'grid') { const R = v.length, C = v[0]?.length || 0; h += `<label>${esc(f.l)}: ${R} Zeilen × ${C} Spalten</label><div class="row" style="flex-wrap:wrap"><button class="add" data-g="r+">＋ Zeile</button><button class="add" data-g="r-">− Zeile</button><button class="add" data-g="c+">＋ Spalte</button><button class="add" data-g="c-">− Spalte</button></div>`; }
        else if (f.t === 'target') { const o = doc.stations.flatMap(s => s.blocks.filter(isCheck).map(x => [x.id, s.title + ' · ' + blockLabel(x)])); h += `<label>${esc(f.l)}<select data-k="${f.k}"><option value="">– bitte wählen –</option>${o.map(([k, n]) => `<option value="${k}"${k === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select><span class="help">Alles unter der Sperre (bis zum Ende der Station) wird erst danach frei.</span></label>`; }
      });
      el.innerHTML = h + '</div>';
    };
    draw();
    el.addEventListener('input', e => {
      const t = e.target, d = t.dataset;
      for (const F of Object.values(FIELDS)) F.input?.(t, b, draw);
      if (d.k) { const f = fields.find(x => x.k === d.k); let v = t.type === 'checkbox' ? (f?.t === 'shown' ? !t.checked : t.checked) : t.type === 'number' ? +t.value : t.value; if (f?.t === 'cell') v = v.toUpperCase().replace(/\s/g, ''); setPath(b, d.k, v); if (t.tagName === 'SELECT' || t.type === 'checkbox') draw(); }
      if (d.li) getP(b, d.li)[+d.i] = esc(t.value);
      if (d.qq != null) b.qs[+d.qq].q = esc(t.value);
      if (d.qt) { const [qi, i] = d.qt.split('.').map(Number); b.qs[qi].opts[i].t = esc(t.value); }
      if (d.qfb) { const [qi, i] = d.qfb.split('.').map(Number); b.qs[qi].opts[i].fb = esc(t.value); }
      if (d.qok2) { const [qi, i] = d.qok2.split('.').map(Number); b.qs[qi].opts.forEach((o, k) => o.ok = k === i); }
      if (d.pa != null) b.pairs[+d.pa].a = t.value;
      if (d.pb != null) b.pairs[+d.pb].b = t.value;
      changed();
    });
    el.addEventListener('change', async e => {
      const t = e.target;
      if (t.dataset.img && t.files[0]) { const url = await loadImage(t.files[0]); if (url) { setPath(b, t.dataset.img, url); draw(); } }
      if (t.dataset.file && t.files[0]) { const f = t.files[0]; if (f.size > 5e6) toast('⚠ Die Datei ist größer als 5 MB.'); const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); }); b.data = String(url).split(',')[1]; if (!b.name) b.name = f.name; draw(); }
      if (t.dataset.img || t.dataset.file) changed(); // „change“ kommt auch beim Verlassen eines Textfelds – dann nicht neu zeichnen
    });
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      const d = t.dataset;
      if (d.x) { closeDlg(d.x === 'ok'); return; }
      for (const F of Object.values(FIELDS)) F.click?.(d, b, draw, ctx);
      if (d.ladd) { getP(b, d.ladd).push(''); draw(); $$(`[data-li]`, el).pop()?.focus(); }
      if (d.ldel) { getP(b, d.ldel).splice(+d.i, 1); const F = fields.find(x => x.k === d.ldel); if (F?.vis && b[F.vis]) b[F.vis].splice(+d.i, 1); draw(); }
      if (d.lvis) { const a = b[d.lvis] = b[d.lvis] || []; a[+d.i] = !a[+d.i]; draw(); }
      if (d.qadd) { b.qs.push({ q: '', opts: [{ t: '', ok: true, fb: '' }, { t: '', ok: false, fb: '' }] }); draw(); }
      if (d.qdel) { b.qs.splice(+d.qdel, 1); draw(); }
      if (d.qoadd) { b.qs[+d.qoadd].opts.push({ t: '', ok: false, fb: '' }); draw(); }
      if (d.qodel) { const [qi, i] = d.qodel.split('.').map(Number); b.qs[qi].opts.splice(i, 1); draw(); }
      if (d.padd) { b.pairs.push({ a: '', b: '' }); draw(); }
      if (d.pdel) { b.pairs.splice(+d.pdel, 1); draw(); }
      if (d.imgdel) { setPath(b, d.imgdel, ''); draw(); }
      if (d.fig) { const F = FIGURES[d.fig]; const old = Object.values(FIGURES).find(x => x.name === b.name); b.img = F.src; if (!b.name || old) b.name = F.name; draw(); }
      if (d.g) { const R = b.rows, C = R[0]?.length || 1; if (d.g === 'r+') R.push(Array(C).fill('')); if (d.g === 'r-' && R.length > 1) R.pop(); if (d.g === 'c+') R.forEach(r => r.push('')); if (d.g === 'c-' && C > 1) R.forEach(r => r.pop()); draw(); }
      if (d.take === 'cell') { const a = host.selectedCell(); setPath(b, d.tk, a); draw(); toast(`Zelle ${a} übernommen`); }
      if (d.take === 'formula') { const a = host.selectedCell(), f = host.cellFormula?.(a); if (!f || !String(f).startsWith('=')) { toast(`In ${a} steht keine Formel – erst eine Formel eintragen.`); return; } setPath(b, d.tk, f); const ck = d.tk.replace(/target$/, 'cell'); if (ck !== d.tk) setPath(b, ck, a); draw(); toast(`${a}: ${esc(f)} übernommen`); }
      changed();
    });
    return apply;
  }
  async function loadImage(file) {
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') { if (file.size > 3e6) toast(`⚠ Das Bild ist ${(file.size / 1e6).toFixed(1)} MB groß – das macht den Lernpfad schwer.`, 3500); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); }); }
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const max = 1600, sc = Math.min(1, max / img.naturalWidth), c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const png = file.type === 'image/png' && file.size < 400e3;
    return c.toDataURL(png ? 'image/png' : 'image/jpeg', .85);
  }

  /* ---------- Design-Fenster ---------- */
  function openDesign() {
    if (panelFits()) { panelOpen && panelWhat === 'design' ? hidePanel() : showPanel('design'); return; }
    const { el, bd } = dialog('dock'); bd.onclick = () => closeDlg(true);
    dlg = { el, bd, apply: () => commit() };
    designUI(el, false);
  }
  const PATTERNS = [['punkte', '• •', 'Punkte'], ['raster', '▦', 'Raster'], ['keins', '–', 'kein Muster'], ...['✦', '★', '♥', '⚡', '💡', '🧪', '⚛', '✏️', '🐾', '{ }', '01', '＋'].map(c => [c, c, c])];
  /** Design-Fenster bei Originaldesign: Aussehen kommt aus der Vorlage; Kopf, Skript und Stile als HTML */
  function skinDesignUI(el, live) {
    el.innerHTML = `${live ? '<div class="pf-ptitle">Allgemein</div>' : '<header><b>Allgemein</b><button class="ok" data-x="ok">Fertig</button></header>'}<div class="ed-form">
      <span class="help">Dieser Lernpfad behält sein <b>Originaldesign</b>: Farben, Schriften, Bilder und Animationen kommen aus der ursprünglichen Seite. Kopfzeile, Titel, Untertitel, Lernziele, Stationen und Bausteine bearbeitest du direkt im Lernpfad. <b>▶ Vorschau</b> zeigt ihn genau so, wie ihn Schüler sehen.</span>
      <label>Für Fortgeschrittene</label>
      <div class="ki-btns" style="flex-direction:column;align-items:stretch">
        <button class="lp-btn alt" data-sked="before">Kopfbereich (HTML)</button>
        <button class="lp-btn alt" data-sked="after">Fußzeile und Skript</button>
        <button class="lp-btn alt" data-sked="head">Seitenkopf mit Stilen (CSS)</button>
      </div>
      <span class="help">Eingebettete Bilder stehen dort als [[bild1]], [[bild2]] … und bleiben erhalten. Die Platzhalter {{pf:title}}, {{pf:kicker}} … nicht löschen.</span>
    </div>`;
    el.onclick = e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.x) { closeDlg(true); return; }
      const k = t.dataset.sked; if (!k) return;
      const box = SK.shrinkData(doc.skin[k] || ''), { el: d, bd } = dialog(); bd.onclick = () => closeDlg(false);
      const prev = dlg; dlg = { el: d, bd, apply: () => { } };
      d.innerHTML = `<header><b>${esc(t.textContent)}</b><button data-c="1">Abbrechen</button><button class="ok" data-s="1">Übernehmen</button></header><div class="ed-form"><textarea class="mono" rows="18" spellcheck="false" style="min-height:50vh">${esc(box.text)}</textarea><span class="help">Änderungen hier wirken sich auf die ganze Seite aus. ⌘Z macht sie rückgängig.</span></div>`;
      d.onclick = ev => {
        if (ev.target.closest('[data-c]')) closeDlg(false);
        if (ev.target.closest('[data-s]')) { doc.skin[k] = box.back($('textarea', d).value); closeDlg(false); commit(); render(); toast('übernommen'); }
        if (!dlg) dlg = prev;
      };
    };
  }
  const paletteDiv = d => { const c = (PALETTES[d.pal] || PALETTES[0]).l.a3 || '#f6bf3a'; return /^#[0-9a-f]{6}$/i.test(c) ? c : '#f6bf3a'; };
  function designUI(el, live) {    if (doc.skin) { skinDesignUI(el, live); return; }
    const seg = (k, o, cur) => `<span class="ed-dseg" data-seg="${k}">${o.map(([v, n]) => `<button data-v="${v}" aria-pressed="${v === cur}">${n}</button>`).join('')}</span>`;
    const sel = (k, cur) => `<select data-anim-k="${k}">${ANIM_OPTS.map(([v, n]) => `<option value="${v}"${(cur || '') === v ? ' selected' : ''}>${n}</option>`).join('')}</select>`;
    const draw = () => {
      const d = doc.design;
      const pat = d.pattern || 'punkte', custom = !PATTERNS.some(x => x[0] === pat);
      el.innerHTML = `${live ? '<div class="pf-ptitle">Allgemein</div>' : '<header><b>Allgemein</b><button class="ok" data-x="ok">Fertig</button></header>'}<div class="ed-form">
        <fieldset><legend>Art</legend>
        ${seg('form', [['lernpfad', 'Lernpfad'], ['challenge', 'Challenge']], doc.form)}
        <span class="help">${doc.form === 'challenge' ? 'Challenge: mit XP-Leiste und Rang – spielerisch.' : 'Lernpfad: Stationen der Reihe nach, ruhig und übersichtlich.'}</span>
        <label class="chk"><input type="checkbox" id="ptsIn"${doc.pointsOn ? ' checked' : ''}>Punkte für Aufgaben vergeben</label><span class="help">Die Punkte stehen links neben jeder Aufgabe, lassen sich dort anpassen und zählen im SCORM-Lernpaket.</span>
        </fieldset>
        <fieldset><legend>Aussehen</legend>
        <label>Farbpalette <span class="help">${esc(PALETTES[d.pal].n)}</span></label><div class="ed-sw">${PALETTES.map((p, i) => `<button data-pal="${i}" title="${esc(p.n)}" aria-pressed="${i === d.pal}"><span style="background:${p.l.a1}"></span><span style="background:${p.l.a2}"></span><span style="background:${p.l.a3}"></span></button>`).join('')}</div>
        <label>Schrift</label>${seg('font', Object.entries(FONTS).map(([k, f]) => [k, f.n]), d.font)}
        <label>Stationen</label>${seg('shape', [['eckig', '▢ eckig'], ['rund', '◯ rund'], ['skizze', '✎ skizziert']], d.shape)}
        <div class="row"><label>Animation Titel${sel('title', doc.anim?.title)}</label><label>Animation Untertitel${sel('subtitle', doc.anim?.subtitle)}</label></div>
        <label>Stil Trennstrich <span class="help">unter dem Kopf</span></label>${seg('divider', [['linie', 'Linie'], ['doppelt', 'Doppelt'], ['gestrichelt', 'Gestrichelt'], ['punkte', 'Punkte'], ['welle', 'Welle'], ['keiner', 'keiner']], d.divider || 'linie')}
        ${(d.divider || 'linie') !== 'keiner' ? `<label>Farbe Trennstrich</label><div class="ed-divc"><button data-divpal="1" aria-pressed="${!d.divColor}">wie Farbpalette</button><label class="ed-color" aria-pressed="${!!d.divColor}"><input type="color" id="divColIn" value="${esc(d.divColor || paletteDiv(d))}"><span>eigene Farbe</span></label></div>` : ''}
        </fieldset>
        <fieldset><legend>Kopf</legend>
        <label>Muster im Hintergrund</label><div class="ed-pat">${PATTERNS.map(([v, n, t]) => `<button data-pat="${esc(v)}" title="${esc(t)}" aria-pressed="${v === pat}">${esc(n)}</button>`).join('')}<input type="text" id="patIn" maxlength="2" placeholder="eigenes" value="${custom ? esc(pat) : ''}" aria-label="eigenes Zeichen oder Emoji"></div>
        ${pat !== 'keins' ? `<div class="row"><label>Dichte<input type="range" id="patK" min="0.5" max="2" step="0.1" value="${d.patDensity || 1}"><span class="help">weiter ← → dichter</span></label><label>Sichtbarkeit<input type="range" id="patO" min="0.15" max="2" step="0.05" value="${d.patOpacity ?? 1}"><span class="help">durchsichtiger ← → kräftiger</span></label></div>` : ''}
        ${seg('hero', [['logo', 'App-Logo'], ['bild', 'eigenes Bild'], ['gross', 'großes Bild rechts'], ['hintergrund', 'Bild als Hintergrund']], d.hero)}
        ${d.hero !== 'logo' ? `<div class="imgprev">${d.heroImg ? `<img src="${d.heroImg}" alt="">` : ''}<label class="take" style="display:inline-flex;align-items:center;cursor:pointer">🖼 ${d.heroImg ? 'Anderes Bild' : 'Bild/GIF wählen'}<input type="file" accept="image/*" id="heroFile" hidden></label></div>` : ''}
        <label>Lernziele</label><div class="list">${(doc.goals || []).map((g, i) => `<div class="it"><input type="text" data-goal="${i}" value="${esc(plain(g))}" placeholder="Lernziel ${i + 1}"><button data-gdel="${i}" aria-label="entfernen">✕</button></div>`).join('')}<button class="add" data-gadd="1">＋ Lernziel</button></div>
        <label>Rang / Abzeichen (optional)<input type="text" id="rankIn" value="${esc(plain(doc.rank))}" placeholder="z. B. Dein Rang: HACKER NEWBIE"></label>
        ${d.hero === 'gross' ? `<label>Tipp-Zeilen auf dem großen Bild (wie ein Terminal)<textarea id="linesIn" class="mono" placeholder="&gt; login crew&#10;&gt; lade daten.exe">${esc((doc.typeLines || []).join('\n'))}</textarea><span class="help">Jede Zeile wird nacheinander getippt.</span></label>` : ''}</fieldset>
      </div>`;
    };
    draw();
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.x) { closeDlg(true); return; }
      if (t.dataset.pal) doc.design.pal = +t.dataset.pal;
      if (t.dataset.pat) doc.design.pattern = t.dataset.pat;
      if (t.dataset.divpal) delete doc.design.divColor;
      if (t.dataset.gadd) doc.goals.push('');
      if (t.dataset.gdel) doc.goals.splice(+t.dataset.gdel, 1);
      const sg = t.closest('[data-seg]'); if (sg) { const k = sg.dataset.seg; if (k === 'form') doc.form = t.dataset.v; else doc.design[k] = t.dataset.v; }
      draw(); render(); if (live) softCommit(); if (t.dataset.gadd) $$('[data-goal]', el).pop()?.focus();
    });
    el.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.goal != null) { doc.goals[+t.dataset.goal] = esc(t.value); render(); }
      if (t.id === 'rankIn') { doc.rank = esc(t.value); render(); }
      if (t.dataset.animK) { doc.anim = { ...(doc.anim || {}), [t.dataset.animK]: t.value }; animDone.clear(); render(); }
      if (t.id === 'linesIn') { doc.typeLines = t.value.split('\n').filter(x => x.trim()); animDone.delete('$lines'); render(); }
      if (t.id === 'patIn') { if (t.value.trim()) { doc.design.pattern = t.value.trim(); render(); $$('[data-pat]', el).forEach(x => x.setAttribute('aria-pressed', 'false')); } }
      if (t.id === 'ptsIn') { doc.pointsOn = t.checked; render(); }
      if (t.id === 'patK') { doc.design.patDensity = +t.value; applyDesign(); }
      if (t.id === 'divColIn') { doc.design.divColor = t.value; applyDesign(); $$('[data-divpal]', el).forEach(x => x.setAttribute('aria-pressed', 'false')); $('.ed-color', el)?.setAttribute('aria-pressed', 'true'); }
      if (t.id === 'patO') { doc.design.patOpacity = +t.value; applyDesign(); }
      if (live) softCommit();
    });
    el.addEventListener('change', async e => { if (e.target.id === 'heroFile' && e.target.files[0]) { doc.design.heroImg = await loadImage(e.target.files[0]); draw(); render(); if (live) softCommit(); } });
  }

  /* ---------- Seitenleiste rechts (wie am iPad): Design und Einstellungen des gewählten Bausteins ---------- */
  let panelOpen = false, panelWhat = 'design', panelEl = null, panelBack = false, panelTouched = 0;
  const wrapEl = $('.lpwrap');
  if (!PLAYER) {
    const body = document.createElement('div'); body.className = 'pf-body';
    scroller.parentNode.insertBefore(body, scroller); body.appendChild(scroller);
    panelEl = document.createElement('aside'); panelEl.className = 'pf-panel'; panelEl.hidden = true; panelEl.setAttribute('aria-label', 'Einstellungen'); ['input', 'change', 'pointerdown'].forEach(t => panelEl.addEventListener(t, () => { panelTouched = Date.now(); }, true));
    body.appendChild(panelEl);
    panelEl.addEventListener('click', e => {
      const t = e.target.closest('[data-pt]'); if (!t) return;
      if (t.dataset.pt === 'close') { hidePanel(); return; }
      panelWhat = t.dataset.pt === 'design' ? 'design' : (selId || 'none'); drawPanel();
    });
    addEventListener('resize', () => { if (panelOpen && !panelFits()) hidePanel(); });
  }
  function panelFits() { return !!panelEl && wrapEl.clientWidth >= 760; }
  function showPanel(what) { panelWhat = what || panelWhat; panelOpen = true; panelEl.hidden = false; wrapEl.classList.add('panel-open'); $('#bDesign')?.classList.add('on'); drawPanel(); }
  function hidePanel() { panelOpen = false; if (panelEl) panelEl.hidden = true; wrapEl.classList.remove('panel-open'); $('#bDesign')?.classList.remove('on'); }
  let panelDrawn = null;
  function drawPanel() {
    if (!panelOpen) return;
    let what = panelWhat;
    if (what.startsWith('st:') ? !doc.stations.some(x => 'st:' + x.id === what) : what !== 'design' && !findBlock(what)) what = 'none';
    // gleiche Ansicht neu gezeichnet (z. B. nach einer Änderung per Schieberegler): Scrollstand behalten
    const keep = panelDrawn === what ? ($('.pf-pbody', panelEl)?.scrollTop || 0) : 0; panelDrawn = what;
    panelEl.innerHTML = `<div class="pf-ptabs"><button data-pt="design" aria-pressed="${what === 'design'}">Allgemein</button><button data-pt="sel" aria-pressed="${what !== 'design'}">Auswahl</button><span class="sp"></span><button data-pt="close" aria-label="Seitenleiste schließen" title="schließen">✕</button></div>`;
    const body = document.createElement('div'); body.className = 'pf-pbody'; panelEl.appendChild(body);
    if (what === 'design') designUI(body, true);
    else if (what === 'none') body.innerHTML = '<div class="ed-form"><span class="help">Tippe im Lernpfad einen Baustein an – hier erscheinen seine Einstellungen. Für eine Station: ⚙ neben dem Stationstitel.</span></div>';
    else formUI(body, what, { live: true });
    if (keep) body.scrollTop = keep;
  }


  /* ---------- Vorlage für KI (Textformat) ---------- */
  let pftext = null;
  const loadText = async () => pftext || (pftext = await import(new URL('pftext.js' + new URL(import.meta.url).search, BASE).href));
  const textEnv = () => ({ emptyDoc, palettes: PALETTES, figures: FIGURES, uid, plugins, isCheck, appName });
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (er) { } ta.remove(); return ok;
    }
  }
  /** gängiges KI-Symbol (Funkelsterne) */
  const KI_ICON = '<svg class="ki-ico" viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true"><path fill="currentColor" d="M10 2.5l1.7 5.3a3 3 0 0 0 1.9 1.9L19 11.5l-5.4 1.8a3 3 0 0 0-1.9 1.9L10 20.5l-1.7-5.3a3 3 0 0 0-1.9-1.9L1 11.5l5.4-1.8a3 3 0 0 0 1.9-1.9z"/><path fill="currentColor" d="M19 1.5l.8 2.2a1.4 1.4 0 0 0 .8.8l2.2.8-2.2.8a1.4 1.4 0 0 0-.8.8l-.8 2.2-.8-2.2a1.4 1.4 0 0 0-.8-.8l-2.2-.8 2.2-.8a1.4 1.4 0 0 0 .8-.8z"/></svg>';
  /** Hinweis nach „KI-Prompt generieren“: was jetzt in der KI zu tun ist */
  function kiCopiedPopup() {
    const w = document.createElement('div'); w.className = 'ki-pop-bd';
    w.innerHTML = `<div class="ki-pop" role="dialog" aria-modal="true"><div class="ki-pop-ico">${KI_ICON}</div>
      <p>Der Prompt für deine KI (ByLKI, Mistral AI, Claude, …) wurde generiert und in die Zwischenablage kopiert. Gehe jetzt zu deinem KI-Chatbot und füge den Prompt per Rechtsklick oder Tastenkürzel (⌘V bzw. Strg+V) ein.</p>
      <p>Warte, bis deine KI mit dem Bau des Lernpfads fertig ist, und kopiere ihr Ergebnis hierher ins Feld „Antwort der KI“.</p>
      <button class="lp-btn" data-ok="1">Erledigt</button></div>`;
    w.addEventListener('click', e => { if (e.target.closest('[data-ok]')) { w.remove(); document.getElementById('kiIn')?.focus(); } });
    document.body.appendChild(w); w.querySelector('[data-ok]').focus();
  }
  async function openKI() {
    const T = await loadText(); const env = textEnv();
    const { el, bd } = dialog('ki-dlg'); bd.onclick = () => closeDlg(false); dlg = { el, bd, apply: () => { } };
    const KK = (opts.storage || 'pathfinder') + '.ki';
    let info = {}; try { info = JSON.parse(LS.get(KK)) || {}; } catch (e) { }
    let parsed = null, lastAtt = {}, fileAtt = {}, tok = 0;
    el.innerHTML = `<header><b>${KI_ICON} Vorlage für KI</b><button class="ok" data-x="1">Schließen</button></header>
      <div class="ed-form">
        <div class="ki-step"><span class="n">1</span><b>Prompt für die KI</b></div>
        <span class="help">Fülle die Felder aus und tippe auf „KI-Prompt generieren“. Den Prompt fügst du in eine KI deiner Wahl ein (z. B. die, die deine Schule erlaubt). Er beschreibt das Textformat – die KI muss PathFinder nicht kennen. Die KI liefert alles (auch Grafiken) in <b>einem</b> Textblock: einmal „Kopieren“ in der KI, unten einfügen, fertig.</span>
        <label>Thema<input type="text" data-k="thema" value="${esc(info.thema || '')}" placeholder="z. B. Relative Zellbezüge in der Tabellenkalkulation"></label>
        <div class="row"><label>Fach<input type="text" data-k="fach" value="${esc(info.fach || '')}" placeholder="Informatik"></label><label>Zielgruppe<input type="text" data-k="klasse" value="${esc(info.klasse || '')}" placeholder="z. B. Gymnasium, 9. Klasse"></label><label>Umfang<input type="text" data-k="umfang" value="${esc(info.umfang || '')}" placeholder="z. B. 4 Stationen, 45 min"></label></div>
        <label>Präzise Beschreibung der gewünschten Inhalte<textarea data-k="extra" rows="3" placeholder="z. B. mit Alltagsbeispiel Pausenverkauf, eine Station als Challenge. Füge zwischen den Stationen wenigstens eine sinnvolle Animation für die Erklärung eines Aspekts ein.">${esc(info.extra || '')}</textarea></label>
        <div class="ki-btns"><button class="lp-btn" data-copy="prompt">${KI_ICON} KI-Prompt generieren</button><button class="lp-btn alt" data-copy="doc" title="Den geöffneten Lernpfad als Text – z. B. um ihn von der KI überarbeiten zu lassen">📋 Aktuellen Lernpfad als Text</button><button class="lp-btn alt" data-copy="show">Format ansehen</button></div>
        <div class="ki-step"><span class="n">2</span><b>Antwort der KI hier einfügen</b></div>
        <textarea id="kiIn" rows="10" spellcheck="false" placeholder="# Titel des Lernpfads&#10;&#10;## Station: …"></textarea>
        <div class="ki-btns"><label class="lp-btn alt" style="cursor:pointer">📎 Datei der KI laden<input type="file" id="kiFiles" multiple accept=".txt,.md,.svg,.png,.gif,.jpg,.jpeg,.webp,.zip" hidden></label><span class="help" style="align-self:center">statt Einfügen: lernpfad.txt – auch zusätzliche Bilder (.svg, .png, .gif, ZIP)</span></div>
        <div id="kiFileList" class="ki-res"></div>
        <div id="kiRes" class="ki-res"></div>
        <div class="ki-btns"><button class="lp-btn" id="kiOpen" disabled>＋ Als neuen Lernpfad öffnen</button></div>
      </div>`;
    const res = $('#kiRes', el), openB = $('#kiOpen', el);
    const check = () => {
      const src = $('#kiIn', el).value;
      if (!src.trim()) { res.innerHTML = ''; openB.disabled = true; parsed = null; return; }
      if (!/^\s*(```[\w-]*\s*)?#\s/.test(src) && /```\s*svg/i.test(src) && !/^##\s/m.test(src.replace(/^##\s+(anhang|bilder)\s*$/gim, ''))) {
        // nur ein Anhang eingefügt? Dann wie eine Anhang-Datei behandeln
        Object.assign(fileAtt, T.readAttachments(src)); $('#kiIn', el).value = ''; res.innerHTML = `<div class="good">✓ ${Object.keys(fileAtt).length} Bild${Object.keys(fileAtt).length === 1 ? '' : 'er'} als Anhang übernommen – jetzt den Lernpfad-Text einfügen.</div>`; return;
      }
      parsed = T.parseText(src, { ...env, attachments: lastAtt, files: fileAtt });
      const { errors, warnings, stats } = parsed;
      res.innerHTML = (errors.length ? `<div class="bad">✗ ${errors.length} Fehler – bitte korrigieren (oder die KI bitten, es zu korrigieren):</div><ul>${errors.map(e => `<li>Zeile ${e.n}: ${esc(e.m)}</li>`).join('')}</ul>` : `<div class="good">✓ Erkannt: „${esc(parsed.doc.title)}“ · ${stats.stations} Station${stats.stations === 1 ? '' : 'en'} · ${stats.blocks} Bausteine · ${stats.tasks} Aufgabe${stats.tasks === 1 ? '' : 'n'}${stats.images ? ` · ${stats.images} Bild${stats.images === 1 ? '' : 'er'}` : ''}</div>`)
        + (warnings.length ? `<div class="warn">Hinweise:</div><ul>${warnings.map(e => `<li>Zeile ${e.n}: ${esc(e.m)}</li>`).join('')}</ul>` : '');
      openB.disabled = !!errors.length;
      // Bilder wirklich laden – erfundenes Base64 fällt erst hier auf
      const my = ++tok, bad = [];
      Promise.all((parsed.images || []).map(im => new Promise(ok => { const x = new Image(); x.onload = () => ok(); x.onerror = () => { bad.push(im); ok(); }; x.src = im.src; }))).then(() => {
        if (my !== tok || !bad.length) return;
        const all = new Set(bad.map(x => x.src));
        for (const st of parsed.doc.stations) for (const b of st.blocks) for (const k of ['src', 'img']) if (all.has(b[k])) b[k] = '';
        if (all.has(parsed.doc.design.heroImg)) { parsed.doc.design.heroImg = ''; parsed.doc.design.hero = 'logo'; }
        res.insertAdjacentHTML('beforeend', `<div class="warn">${bad.length} Bild${bad.length === 1 ? ' lässt' : 'er lassen'} sich nicht anzeigen und ${bad.length === 1 ? 'wird' : 'werden'} weggelassen:</div><ul>${bad.map(x => `<li>Zeile ${x.n}</li>`).join('')}</ul>`);
      });
    };
    el.addEventListener('change', async e => {
      if (e.target.id !== 'kiFiles' || !e.target.files.length) return;
      const { att, notes, text } = await T.readFiles([...e.target.files]); Object.assign(fileAtt, att); e.target.value = '';
      if (text) $('#kiIn', el).value = text;
      $('#kiFileList', el).innerHTML = `${Object.keys(fileAtt).length ? `<div class="good">${Object.keys(fileAtt).length} Bild${Object.keys(fileAtt).length === 1 ? '' : 'er'} aus Dateien</div>` : ''}<ul>${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
      check();
    });
    el.addEventListener('input', e => {
      const k = e.target.dataset.k; if (k) { info[k] = e.target.value; LS.set(KK, JSON.stringify(info)); }
      if (e.target.id === 'kiIn') check();
    });
    el.addEventListener('click', async e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.x) { closeDlg(false); return; }
      if (t.dataset.copy === 'prompt') { if (await copyText(T.promptFor(info, env))) kiCopiedPopup(); else toast('Kopieren ging nicht'); }
      if (t.dataset.copy === 'doc') { const o = {}; const txt = T.docToText(doc, env, o); lastAtt = Object.fromEntries(Object.entries(o.attachments).map(([k, v]) => [k.toLowerCase(), v])); }
      if (t.dataset.copy === 'doc') toast(await copyText('Überarbeite diesen Lernpfad. Behalte das Format genau bei und antworte nur mit dem vollständigen Lernpfad in einem Codeblock. Verweise wie anhang:bild1 ohne Eintrag im Anhang einfach stehen lassen.\n\n' + T.formatHelp(env) + '\nLERNPFAD:\n' + T.docToText(doc, env)) ? '📋 Lernpfad als Text kopiert (mit Formatbeschreibung)' : 'Kopieren ging nicht');
      if (t.dataset.copy === 'show') { const pre = document.createElement('pre'); pre.className = 'ki-fmt'; pre.textContent = T.formatHelp(env); t.closest('.ki-btns').after(pre); t.remove(); }
      if (t.id === 'kiOpen' && parsed && !parsed.errors.length) {
        const d = parsed.doc; closeDlg(false); openDoc(d); toast(`„${esc(d.title)}“ angelegt – jetzt kannst du alles im Editor anpassen.`);
      }
    });
  }

  /* ---------- Zertifikat: Daten, Vorschau, PDF ---------- */
  function certData(name) {
    const c = doc.cert, mins = Math.max(1, Math.round((prog.active || 0) / 60000));
    const rows = doc.stations.map(s => { const ch = checksOf(s), n = ch.filter(id => prog.solved[id]).length; const tips = s.blocks.reduce((a, b) => a + Object.keys(prog.tips).filter(k => k.startsWith(b.id + ':')).length, 0); const sols = s.blocks.filter(b => prog.sol[b.id]).length;
      return { title: plain(s.title) || 'Station', done: ch.length ? `${n} / ${ch.length}` : '–', help: tips || sols ? `${tips} Tipp${tips === 1 ? '' : 's'}${sols ? `, ${sols} Lösung${sols === 1 ? '' : 'en'}` : ''}` : (n ? 'ohne Hilfe' : '–') }; });
    const all = allChecks(), solved = all.filter(id => prog.solved[id]).length;
    const pct = all.length ? Math.round(100 * solved / all.length) : 100;
    const pts = doc.pointsOn ? (() => { const bl = xpBlocks(); return `${bl.filter(b => prog.solved[b.id]).reduce((a, b) => a + ptsOf(b), 0)} von ${bl.reduce((a, b) => a + ptsOf(b), 0)} Punkten`; })() : '';
    const xp = c.show.xp && doc.form === 'challenge' ? `${xpNow()} von ${xpMax()} XP` : '';
    const from = new Date(prog.start || Date.now()).toLocaleDateString('de-DE'), to = new Date().toLocaleDateString('de-DE');
    const code = certCode([doc.id, (name || '').trim().toLowerCase(), pct, mins, to]);
    return { c, name: (name || '').trim(), mins, rows, pct, solved, total: all.length, pts, xp, from, to, code, head: c.need === 'immer' ? 'Nachweis' : doc.form === 'challenge' ? 'Challenge-Urkunde' : 'Zertifikat' };
  }
  function certView(D) {
    const p = PALETTES[doc.design.pal].l, c = D.c;
    return `<div class="ed-certprev" style="border-color:${p.a1}"><div style="font-size:12px;letter-spacing:.14em;color:#888">${esc(plain(doc.kicker)).toUpperCase()}</div>
      <h2 style="color:${p.a1}">${D.head}</h2><div style="font-size:20px;font-weight:700;margin:8px 0">${esc(D.name || '(dein Name)')}</div>
      <div>${esc(c.text)}</div><div style="font-weight:700;margin-top:4px">„${esc(plain(doc.title))}“</div>
      ${c.show.zeit ? `<div style="margin-top:8px;font-size:14px">Aktive Bearbeitungszeit: <b>${D.mins} min</b> · ${D.from}${D.from !== D.to ? ' – ' + D.to : ''}</div>` : ''}
      ${c.show.quiz ? `<table><tr><td><b>Station</b></td><td><b>gelöst</b></td>${c.show.tipps ? '<td><b>Hilfen</b></td>' : ''}</tr>${D.rows.map(r => `<tr><td>${esc(r.title)}</td><td>${r.done}</td>${c.show.tipps ? `<td>${r.help}</td>` : ''}</tr>`).join('')}</table>` : ''}
      <div style="font-weight:700;margin-top:6px">${D.total ? `${D.solved} von ${D.total} Aufgaben gelöst (${D.pct} %)` : ''}${D.pts ? ' · ' + D.pts : ''}${D.xp ? ' · ⚡ ' + D.xp : ''}</div>
      <div class="code">Prüfcode ${D.code}</div></div>`;
  }
  async function certPdf(D) {
    const P = PALETTES[doc.design.pal].l, c = D.c, pdf = new Pdf(), W = 595, M = 46;
    pdf.rect(0, 0, W, 842, P.bg);
    pdf.rect(M - 18, M - 18, W - 2 * (M - 18), 842 - 2 * (M - 18), null, P.a1, 3);
    pdf.rect(M - 10, M - 10, W - 2 * (M - 10), 842 - 2 * (M - 10), null, P.a2s || P.a1s, 1);
    pdf.rect(M - 18, M - 18, W - 2 * (M - 18), 10, P.a1); pdf.rect(M - 18, M - 8, (W - 2 * (M - 18)) / 3, 4, P.a2); pdf.rect(M - 18 + (W - 2 * (M - 18)) / 3, M - 8, (W - 2 * (M - 18)) / 3, 4, P.a3);
    let y = 92;
    const d = doc.design, src = (d.hero === 'bild' || d.hero === 'gross') && d.heroImg ? d.heroImg : opts.logo;
    const img = await jpegOf(src);
    if (img) { const s = 76 / Math.max(img.w, img.h); pdf.image(img, W / 2 - img.w * s / 2, y, img.w * s, img.h * s); y += img.h * s + 26; } else y += 10;
    pdf.text(plain(doc.kicker).toUpperCase(), W / 2, y, 9, { col: '#888888', align: 'center', spacing: 1.6 }); y += 40;
    pdf.text(D.head, W / 2, y, 34, { bold: true, col: P.a1, align: 'center' }); y += 50;
    pdf.text(fitText(D.name || ' ', 24, true, W - 2 * M - 40), W / 2, y, 24, { bold: true, col: '#1f1b2e', align: 'center' }); y += 10;
    pdf.line(W / 2 - 120, y, W / 2 + 120, y, P.a3, 1.5); y += 26;
    for (const l of wrapText(c.text, 13, false, W - 2 * M - 60)) { pdf.text(l, W / 2, y, 13, { col: '#333333', align: 'center' }); y += 18; }
    for (const l of wrapText('„' + plain(doc.title) + '“', 16, true, W - 2 * M - 60)) { pdf.text(l, W / 2, y + 4, 16, { bold: true, col: '#1f1b2e', align: 'center' }); y += 22; }
    y += 14;
    if (c.show.zeit) { pdf.text(`Aktive Bearbeitungszeit: ${D.mins} min   ·   ${D.from}${D.from !== D.to ? ' – ' + D.to : ''}`, W / 2, y, 11, { col: '#555555', align: 'center' }); y += 28; }
    if (c.show.quiz && D.rows.length) {
      const x0 = M + 20, x1 = W - M - 20, cw = c.show.tipps ? [x1 - x0 - 200, 70, 130] : [x1 - x0 - 90, 90];
      pdf.rect(x0, y - 14, x1 - x0, 20, P.a1);
      const hd = ['Station', 'gelöst'].concat(c.show.tipps ? ['Hilfen'] : []); let xx = x0 + 8;
      hd.forEach((t, i) => { pdf.text(t, xx, y, 10, { bold: true, col: '#ffffff' }); xx += cw[i]; }); y += 20;
      const max = Math.min(D.rows.length, 14);
      D.rows.slice(0, max).forEach((r, k) => {
        if (k % 2) pdf.rect(x0, y - 14, x1 - x0, 20, P['surface-2'] || '#f3f3f3');
        let xx = x0 + 8; [r.title, r.done].concat(c.show.tipps ? [r.help] : []).forEach((t, i) => { pdf.text(fitText(t, 10, false, cw[i] - 12), xx, y, 10, { col: '#333333' }); xx += cw[i]; }); y += 20;
      });
      if (D.rows.length > max) { pdf.text(`… und ${D.rows.length - max} weitere Stationen`, x0 + 8, y, 9, { col: '#888888' }); y += 16; }
      pdf.line(x0, y - 14, x1, y - 14, P.line || '#dddddd', 1); y += 14;
    }
    const sum = [D.total ? `${D.solved} von ${D.total} Aufgaben gelöst (${D.pct} %)` : '', D.pts, D.xp].filter(Boolean).join('   ·   ');
    if (sum) { pdf.text(sum, W / 2, y, 12, { bold: true, col: '#1f1b2e', align: 'center' }); y += 20; }
    pdf.text(`Prüfcode ${D.code}`, W / 2, 842 - M - 24, 10, { bold: true, col: P.a1, align: 'center', spacing: 1 });
    pdf.text(`Ausgestellt am ${D.to} · erstellt mit ${appName === 'PathFinder' ? 'PathFinder' : appName + ' / PathFinder'}`, W / 2, 842 - M - 10, 8, { col: '#999999', align: 'center' });
    return new Blob([pdf.bytes()], { type: 'application/pdf' });
  }
  function certPreview() {
    const { el, bd } = dialog(); bd.onclick = () => closeDlg(false); dlg = { el, bd, apply: () => { } };
    const NK = `${opts.storage || 'pathfinder'}.certname`;
    let name = PLAYER ? (LS.get(NK) || '') : 'Max Muster';
    el.classList.add('cert-dlg');
    const draw = () => { $('.cert-body', el).innerHTML = certView(certData(name)); };
    el.innerHTML = `<header><b>★ ${doc.cert.need === 'immer' ? (PLAYER ? 'Dein Nachweis' : 'Nachweis – Muster') : (PLAYER ? 'Dein Zertifikat' : 'Zertifikat – Muster')}</b><button data-pdf="1">⬇︎ PDF speichern</button><button class="ok" data-x="ok">Schließen</button></header>
      <div class="ed-form"><label>Dein Name<input type="text" id="certName" value="${esc(name)}" placeholder="Vor- und Nachname" autocomplete="name"></label></div>
      <div class="cert-body"></div>
      <div class="ed-form"><span class="help">${PLAYER ? 'Das PDF entsteht direkt hier im Browser. Lade es danach z. B. in Moodle hoch.' : 'So sieht das Zertifikat für Schüler aus (mit Musterwerten). Das PDF entsteht bei ihnen direkt im Browser.'} Die Zeit zählt nur, solange der Lernpfad offen ist und benutzt wird. Der Prüfcode ändert sich, wenn Name, Ergebnis, Zeit oder Datum nachträglich verändert werden – prüfen kannst du ihn im Editor unter ⋯ → „Zertifikat prüfen“.</span></div>`;
    draw();
    el.addEventListener('input', e => { if (e.target.id === 'certName') { name = e.target.value; if (PLAYER) LS.set(NK, name); draw(); } });
    el.addEventListener('click', async e => {
      if (e.target.closest('[data-x]')) closeDlg(false);
      if (e.target.closest('[data-pdf]')) {
        if (!name.trim()) { toast('Bitte zuerst deinen Namen eintragen.'); $('#certName', el).focus(); return; }
        const D = certData(name); const blob = await certPdf(D);
        download(blob, `${D.head}_${name.trim().replace(/[^\wäöüÄÖÜß-]+/g, '_')}.pdf`);
      }
    });
  }
  function certCheck() {
    const { el, bd } = dialog(); bd.onclick = () => closeDlg(false); dlg = { el, bd, apply: () => { } };
    el.innerHTML = `<header><b>✓ Zertifikat prüfen</b><button class="ok" data-x="ok">Schließen</button></header>
      <div class="ed-form"><span class="help">Trage die Angaben vom Zertifikat ein. Stimmt der Prüfcode, wurden Name, Ergebnis, Zeit und Datum nicht verändert. (Das Zertifikat muss zu diesem Lernpfad gehören.)</span>
      <label>Name<input type="text" data-c="n"></label><div class="row"><label>gelöst in %<input type="number" data-c="p" min="0" max="100"></label><label>Zeit in min<input type="number" data-c="m" min="1"></label><label>Ausgestellt am<input type="text" data-c="d" placeholder="TT.MM.JJJJ"></label></div>
      <label>Prüfcode<input type="text" data-c="c" placeholder="ABC-DEF"></label><div id="ccRes" style="font-weight:700;font-size:17px;min-height:24px"></div></div>`;
    el.addEventListener('click', e => { if (e.target.closest('[data-x]')) closeDlg(false); });
    el.addEventListener('input', () => {
      const v = k => $(`[data-c=${k}]`, el).value.trim();
      const d = v('d').replace(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, (m, a, b, c) => `${+a}.${+b}.${c}`);
      const want = certCode([doc.id, v('n').toLowerCase(), +v('p'), +v('m'), d]);
      const res = $('#ccRes', el);
      if (!v('c')) { res.textContent = ''; return; }
      const ok = v('c').toUpperCase().replace(/\s/g, '') === want;
      res.innerHTML = ok ? '<span style="color:#2e8b57">✓ Prüfcode stimmt.</span>' : '<span style="color:#c0392b">✗ Prüfcode passt nicht zu diesen Angaben.</span>';
    });
  }

  /* ---------- Knöpfe in Lernpfaden ---------- */
  function runAction(id, a) {
    const r = findBlock(id); if (!r) return;
    const b = r.b, t = def(b);
    if (t?.run) { t.run(a, b, ctx); return; }
    if (E() && a !== 'download') { toast('In der <b>Vorschau</b> (⌘P) ausprobieren'); return; }
    if (a === 'done') { prog.solved[id] = !prog.solved[id]; render(); }
    if (a === 'answer') {
      const inp = $(`.blk[data-id="${id}"] [data-ans]`, lp), v = inp?.value || '';
      const okA = isAnswer(b.answer, v); prog.quiz[id] = { v, ok: okA };
      if (okA) solve(id); else { prog.tries[id] = (prog.tries[id] || 0) + 1; render(); }
    }
    if (a === 'copy') { if (host.copyCode) host.copyCode(b); else { navigator.clipboard?.writeText(b.code || '').then(() => toast('⧉ kopiert'), () => toast('Kopieren nicht möglich')); } }
    if (a === 'gapcheck') { prog.quiz[id + ':chk'] = 1; const n = [...(b.html || '').matchAll(/\[\[(.+?)\]\]/g)].length, got = prog.quiz[id] || {}; let all = true; for (let i = 0; i < n; i++) if (got[i] == null || !isGapOk(b, i, got[i])) all = false; if (all) solve(id); else { render(); toast('Noch nicht alles richtig – rote Lücken nochmal ansehen.'); } }
    if (a === 'download') { if (!b.data) { toast('Noch keine Datei – ⚙'); return; } const bin = atob(b.data), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); const url = URL.createObjectURL(new Blob([u8])); const l = document.createElement('a'); l.href = url; l.download = b.name || 'datei'; document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(url); l.remove(); }, 3000); }
    if (host.runFile && a.startsWith('file:')) host.runFile(a.slice(5), b);
  }

  /* ---------- Öffnen ---------- */
  async function openChooser(anchor) {
    closePop(); pop = document.createElement('div'); pop.className = 'ed-pop';
    pop.innerHTML = '<h3>Lernpfad öffnen</h3><div class="ed-pal" id="openList"><div class="grp">lädt …</div></div>';
    document.body.appendChild(pop); placePop(anchor);
    let ex = []; if (opts.examples) { try { ex = await (await fetch(opts.examples, { cache: 'no-cache' })).json(); } catch (e) { } }
    const base = opts.examples ? opts.examples.replace(/[^/]*$/, '') : '';
    const mine = docList();
    let h = '<div class="grp">Meine Lernpfade (in diesem Browser)</div>';
    h += mine.map(d => `<button data-open="${esc(d.id)}" class="${d.id === doc.id ? 'hi' : ''}"><b>${d.form === 'challenge' ? '⚡' : '📘'} ${esc(d.title)}</b><span>zuletzt ${new Date(d.t).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</span></button>`).join('') || '<div class="grp" style="text-transform:none;letter-spacing:0">noch keine</div>';
    h += '<button data-new="lernpfad"><b>＋ Neuer Lernpfad</b><span>leer beginnen</span></button><button data-new="challenge"><b>＋ Neue Challenge</b><span>leer beginnen</span></button><button data-imp="1"><b>⤒ HTML-Lernpfad importieren</b><span>vorhandene Lernpfad-Seite · Design bleibt wie im Original</span></button>';
    if (ex.length) h += `<div class="grp">${esc(opts.examplesTitle || 'Beispiele')}</div>` + ex.map(e => `<button data-ex="${esc(e.file)}"><b>${esc(e.title)}</b><span>${esc(e.note || '')}</span></button>`).join('');
    $('#openList', pop).innerHTML = h; placePop(anchor);
    pop.onclick = async ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.open) { const d = loadDoc(b.dataset.open); closePop(); if (d) openDoc(d); }
      if (b.dataset.new) { closePop(); openDoc(emptyDoc(b.dataset.new)); }
      if (b.dataset.imp) {
        closePop(); const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.html,.htm,text/html';
        inp.onchange = async () => { const f = inp.files[0]; if (f) importPage(await f.text()); }; inp.click();
      }
      if (b.dataset.ex) {
        closePop(); toast('lädt …');
        try {
          const d = await (await fetch(base + b.dataset.ex, { cache: 'no-cache' })).json();
          const have = loadDoc(d.id);
          if (have && !confirm('Diesen Lernpfad hast du schon geöffnet und vielleicht verändert. Neu laden und deine Änderungen verwerfen?')) { openDoc(have); return; }
          openDoc(d); toast('„' + esc(d.title) + '“ geöffnet');
        } catch (e) { toast('Konnte nicht geladen werden.'); }
      }
    };
  }
  /** Vorhandene HTML-Lernpfad-Seite übernehmen: Inhalte werden Bausteine, das Design bleibt */
  async function importPage(html) {
    try {
      await loadSkin();
      const d = await SK.importHtml(html, { uid, appName });
      if (!d) { toast('Keine Stationen gefunden – erwartet werden Abschnitte &lt;section class="station"&gt;.', 4000); return null; }
      openDoc(d); toast(`„${esc(d.title)}“ übernommen – das Design bleibt wie im Original`); return d;
    } catch (e) { toast('Import fehlgeschlagen: ' + esc(e.message)); return null; }
  }
  function placePop(anchor) { const r = anchor.getBoundingClientRect(); pop.style.left = Math.max(10, Math.min(innerWidth - pop.offsetWidth - 10, r.right - pop.offsetWidth)) + 'px'; pop.style.top = (r.bottom + 6) + 'px'; }

  /* ---------- Leiste oben ---------- */
  function setMode(m) {
    if (pending) commit();
    mode = m; selId = null; closePop();
    $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    if (m === 'preview') { prog.visited[curSid] = 1; animDone.clear(); panelBack = panelOpen; hidePanel(); }
    else if (panelBack && panelFits()) showPanel();
    render();
    toast(m === 'preview' ? '▶ Vorschau – so sehen es die Schüler. Fortschritt wird hier nur probeweise gezählt.' : '✎ Bearbeiten');
  }
  if (!PLAYER) {
  $('#modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
  $('#bUndo').onclick = undo; $('#bRedo').onclick = redo;
  const setSingle = v => { single = v; const b = $('#bSingle'); if (b) { b.classList.toggle('on', single); b.setAttribute('aria-pressed', String(single)); } document.querySelectorAll('#viewSeg button').forEach(x => x.setAttribute('aria-pressed', String((x.dataset.view === 'one') === single))); render(); scroller.scrollTop = 0; };
  if ($('#bSingle')) $('#bSingle').onclick = () => setSingle(!single);
  if ($('#viewSeg')) $('#viewSeg').onclick = e => { const x = e.target.closest('button[data-view]'); if (x) setSingle(x.dataset.view === 'one'); };
  $('#bDesign').onclick = openDesign;
  $('#bOpen').onclick = e => openChooser(e.currentTarget);
  if ($('#bKI')) $('#bKI').onclick = () => openKI(); // nur in der eigenständigen WebApp
  const bWide = $('#bWide'); if (bWide) bWide.onclick = () => $('#app').classList.toggle('lp-only');
  function infoDlg(title, html) { const { el, bd } = dialog(); bd.onclick = () => closeDlg(false); dlg = { el, bd, apply: () => { } }; el.innerHTML = `<header><b>${title}</b><button class="ok" data-x="1">Schließen</button></header>${html}`; el.onclick = ev => { if (ev.target.closest('[data-x]')) closeDlg(false); }; }
  $('#bMore').onclick = e => {
    closePop(); pop = document.createElement('div'); pop.className = 'ed-pop';
    pop.innerHTML = `<h3>Mehr</h3><div class="ed-pal">
      <button data-m="reset"><b>↺ Vorschau-Fortschritt zurücksetzen</b><span>Haken, Quiz, Sperren wieder leer</span></button>
      <button data-m="json"><b>{ } Dokument ansehen</b><span>so wird der Lernpfad gespeichert</span></button>
      <button data-m="ki"><b>${KI_ICON} Vorlage für KI</b><span>Lernpfad von einer KI schreiben lassen und einfügen</span></button>
      <button data-m="certcheck"><b>✓ Zertifikat prüfen</b><span>Prüfcode eines Schüler-Zertifikats nachrechnen</span></button>
      <button data-m="keys"><b>⌘ Tastenkürzel</b><span>für die iPad-Tastatur</span></button>
      <button data-m="del"><b>🗑 Diesen Lernpfad löschen</b><span>nur in diesem Browser</span></button>
      <button data-m="export"><b>⇩ Export</b><span>HTML-Datei für Moodle · SCORM-Lernpaket</span></button></div>`;
    document.body.appendChild(pop); placePop(e.currentTarget);
    pop.onclick = ev => {
      const m = ev.target.closest('[data-m]')?.dataset.m; if (!m) return; closePop();
      if (m === 'export') { openExport(); return; }
      if (m === 'reset') { prog = freshProg(); host.reset?.(); render(); toast('Fortschritt zurückgesetzt'); }
      if (m === 'del') { if (!confirm('„' + (doc.title || 'ohne Titel') + '“ in diesem Browser löschen?')) return; LS.del(DOCKEY(doc.id)); saveDocList(docList().filter(x => x.id !== doc.id)); const next = docList()[0]; openDoc(next ? loadDoc(next.id) : sample()); }
      if (m === 'json') infoDlg('{ } Dokument', `<pre style="margin:0;padding:12px;font:12px/1.4 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-all">${esc(JSON.stringify(doc, (k, v) => typeof v === 'string' && v.length > 200 && /^(data:|[A-Za-z0-9+/=]{200})/.test(v) ? v.slice(0, 40) + '…' : v, 2))}</pre>`);
      if (m === 'certcheck') { certCheck(); return; }
      if (m === 'ki') { openKI(); return; }
      if (m === 'keys') infoDlg('⌘ Tastenkürzel', `<div class="ed-form"><table style="border-collapse:collapse;font-size:15px">${[['⌘B / ⌘I', 'fett / kursiv'], ['⌘E', 'Code'], ['⌘K', 'Link'], ['⌘Z / ⇧⌘Z', 'rückgängig / wiederholen'], ['⌘↵', 'neuer Textbaustein darunter'], ['⌥↑ / ⌥↓', 'gewählten Baustein verschieben'], ['⌘P', 'Vorschau ein/aus'], ['/', 'in leerem Text: Bausteinauswahl, weitertippen filtert (z. B. /quiz ↵)'], ['Esc', 'Auswahl aufheben']].map(([k, v]) => `<tr><td style="padding:5px 14px 5px 0;font-weight:700;white-space:nowrap">${k}</td><td>${v}</td></tr>`).join('')}</table></div>`);
    };
  };
  addEventListener('beforeunload', () => { if (pending) commit(); });
  } // Ende Editor-Leiste
  if (scorm) { addEventListener('pagehide', () => scorm.finish(JSON.stringify(prog))); }

  /* ---------- Export: HTML-Datei und SCORM-Lernpaket ---------- */
  async function appHtml(st) {
    const { d } = exportDoc(st), a = clone(doc); a.cert = { ...a.cert, on: !!st.cert }; a.pass = st.pass;
    return buildHtml(d, false, { plugin: plugins.find(p => p.bundle), doc: a });
  }
  function exportDoc(settings) {
    const d = clone(doc); let converted = 0;
    const env = { doc: d, sheetBefore(st, i) { for (let k = i - 1; k >= 0; k--) { const x = st.blocks[k]; if (x.sheet?.cells) return x.sheet; } for (const s2 of d.stations) { if (s2 === st) break; for (let k = s2.blocks.length - 1; k >= 0; k--) if (s2.blocks[k].sheet?.cells) return s2.blocks[k].sheet; } return null; } };
    for (const st of d.stations) for (const b of st.blocks) {
      // was die Lehrkraft verborgen hat, kommt gar nicht erst in die Datei
      if (b.tipsHide && b.tips) { b.tips = b.tips.filter((t, i) => !b.tipsHide[i]); delete b.tipsHide; }
      if (b.solHide) { b.solution = ''; delete b.solHide; }
    }
    for (const st of d.stations) {
      const out = [];
      st.blocks.forEach((b, i) => {
        const t = def(b);
        if (t?.exportAs) { const r = t.exportAs(b, { ...env, station: st, index: i, ctx }); converted++; [].concat(r || []).forEach(x => out.push({ id: x.id || uid(), ...x })); }
        else out.push(b);
      });
      st.blocks = out;
    }
    d.cert = { ...d.cert, on: !!settings.cert };
    d.pass = settings.pass;
    return { d, converted };
  }
  const BASE = new URL('.', import.meta.url);
  async function fetchText(u) { const r = await fetch(new URL(u, BASE), { cache: 'no-cache' }); if (!r.ok) throw new Error(u); return r.text(); }
  async function fetchData(u, type) { const r = await fetch(new URL(u, BASE)); if (!r.ok) throw new Error(u); const buf = new Uint8Array(await r.arrayBuffer()); let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return `data:${type};base64,${btoa(bin)}`; }

  /** Für Apps (z. B. FlowPad): Erweiterung mit in die Datei packen. Läuft der Lernpfad in der App, prüft die App selbst;
   *  sonst wird der umgewandelte Lernpfad (Selbstkontrolle) gezeigt. */
  async function appScripts(app, SC) {
    const B = app.plugin.bundle, mods = [];
    for (const m of B.modules) { const r = await fetch(m.url, { cache: 'no-cache' }); if (!r.ok) throw new Error(m.url); mods.push({ name: m.name, map: m.map || {}, code: await r.text() }); }
    const j = x => JSON.stringify(x).replace(/</g, '\\u003c');
    return `
<script type="application/json" id="pf-doc-app">${j(app.doc)}${SC}
<script type="application/json" id="pf-mods">${j({ mods, entry: B.entry, plugin: B.exportName, host: B.hostExport, inside: B.inside })}${SC}
<script>
async function pfLoadApp() {
  try {
    const M = JSON.parse(document.getElementById('pf-mods').textContent);
    if (!(await new Function('return ' + M.inside)())) return null; // darf auch ein Promise sein (Handschlag mit der App)
    const urls = {};
    for (const m of M.mods) { let c = m.code; for (const [spec, name] of Object.entries(m.map)) c = c.split("'" + spec + "'").join("'" + urls[name] + "'").split('"' + spec + '"').join('"' + urls[name] + '"'); urls[m.name] = URL.createObjectURL(new Blob([c], { type: 'text/javascript' })); }
    const P = await import(urls[M.entry]);
    return { doc: JSON.parse(document.getElementById('pf-doc-app').textContent), plugins: [P[M.plugin]], host: P[M.host]() };
  } catch (e) { console.warn('App-Erweiterung nicht geladen', e); return null; }
}
${SC}`;
  }
  async function buildHtml(d, scormMode, app) {
    const SC = '<' + '/script>';
    if (d.skin) { // Originaldesign: die Seite der Vorlage, dazu das Dokument zum späteren Bearbeiten
      await loadSkin();
      const keep = app?.doc || d;
      return SK.pageHtml(d, { json: JSON.stringify(keep).replace(/</g, '\\u003c') });
    }
    let css = await fetchText('pathfinder.css');
    if (d.design?.font !== 'hand') css = css.replace(/@font-face \{ font-family: "Caveat";[^}]*\}\n?/, '');
    const fonts = {}; for (const m of css.matchAll(/url\(\.\.\/fonts\/([^)]+)\)/g)) fonts[m[1]] = fonts[m[1]] || await fetchData('../fonts/' + m[1], 'font/ttf');
    css = css.replace(/url\(\.\.\/fonts\/([^)]+)\)/g, (m, f) => `url(${fonts[f]})`);
    css += plugins.map(p => p.css || '').join('\n');
    const js = (await fetchText('pathfinder.js')).replace(/<\/script/gi, '<\\/script');
    const json = JSON.stringify(d).replace(/</g, '\\u003c');
    let logo = ''; if (opts.logo) { try { logo = opts.logo.startsWith('data:') ? opts.logo : await fetchData(new URL(opts.logo, location.href).href, /\.svg(\?|$)/i.test(opts.logo) ? 'image/svg+xml' : 'image/png'); } catch (e) { } }
    return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(d.title || 'Lernpfad')}</title><meta name="generator" content="PathFinder">
<style>${css}</style></head>
<body class="pf-player"><div class="app"><section class="lpwrap"><div class="lp-scroll" id="scroll"><div class="lp" id="lp"></div></div></section></div>
<script type="application/json" id="pf-doc">${json}${SC}${app ? await appScripts(app, SC) : ''}
<script type="module">
${js}
${app ? 'const pfApp = await pfLoadApp();' : 'const pfApp = null;'}
startPathFinder({ player: true, scorm: ${scormMode ? 'true' : 'false'}, appName: ${JSON.stringify(appName)}, logo: ${JSON.stringify(logo)}, storage: ${JSON.stringify(opts.storage || 'pathfinder')}, doc: pfApp ? pfApp.doc : JSON.parse(document.getElementById('pf-doc').textContent), plugins: pfApp ? pfApp.plugins : [], host: pfApp ? pfApp.host : undefined });
${SC}
</body></html>`;
  }
  const fileName = (ext) => (doc.title || 'Lernpfad').replace(/[^\wäöüÄÖÜß -]+/g, '').trim().replace(/\s+/g, '_').slice(0, 60) + ext;
  function download(blob, name) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000); }
  function manifest(d) {
    const t = esc(d.title || 'Lernpfad'), id = 'pathfinder-' + String(d.id).replace(/[^\w-]/g, '');
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org1">
    <organization identifier="org1"><title>${t}</title>
      <item identifier="item1" identifierref="res1" isvisible="true"><title>${t}</title><adlcp:masteryscore>${d.pass}</adlcp:masteryscore></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html"><file href="index.html"/></resource>
  </resources>
</manifest>
`;
  }
  function openExport() {
    if (pending) commit();
    const { el, bd } = dialog(); bd.onclick = () => closeDlg(false); dlg = { el, bd, apply: () => { } };
    const appBlocks = doc.stations.flatMap(s => s.blocks.filter(b => def(b)?.exportAs));
    const bundled = plugins.find(p => p.bundle);
    const st = { fmt: bundled && host.adopt ? 'app' : 'html', pass: doc.pass || 80, cert: doc.cert.on };
    const draw = () => {
      el.innerHTML = `<header><b>⇩ Export</b><button data-x="1">Abbrechen</button><button class="ok" data-go="1">Exportieren</button></header><div class="ed-form">
        <span class="ed-dseg" data-eseg="fmt"><button data-v="html" aria-pressed="${st.fmt === 'html'}">📄 HTML-Datei</button>${doc.skin ? '' : `<button data-v="scorm" aria-pressed="${st.fmt === 'scorm'}">🎓 SCORM-Lernpaket</button>`}${bundled ? `<button data-v="app" aria-pressed="${st.fmt === 'app'}">${esc(bundled.bundle.icon || '📦')} für ${esc(bundled.name)}</button>` : ''}</span>
        ${st.fmt === 'app' ? `<span class="help">Lernpfad für <b>${esc(bundled.name)}-Projekte</b>: In ${esc(bundled.name)} unter „Lernpfad einbetten“ öffnen – die Aufgaben prüft dann ${esc(bundled.name)} selbst. Im normalen Browser stellt sich die Datei automatisch auf Selbstkontrolle um.</span>${host.adopt ? `<button class="lp-btn" data-adopt="1">⤵ In dieses ${esc(bundled.name)}-Projekt übernehmen</button>` : ''}${host.exportProject ? `<button class="lp-btn" data-xproj="1">⇩ Als ${esc(bundled.name)}-Projekt exportieren</button><span class="help">${esc(host.exportProjectHelp || `Projektdatei mit diesem Lernpfad und allem, was gerade im ${bundled.name}-Projekt steht (z. B. Startcode).`)}</span>` : ''}` : ''}
        ${st.fmt === 'app' ? '' : `<span class="help">`}${st.fmt === 'app' ? '' : st.fmt === 'html' ? 'Eine einzige Datei mit Schriften und Bildern – läuft offline. In Moodle/ByCS als <b>Datei</b> hochladen. Der Fortschritt bleibt im Browser des Schülers.' : 'ZIP-Datei für die Aktivität <b>„Lernpaket“</b> in Moodle/ByCS. Moodle speichert den Fortschritt (auch beim Gerätewechsel) und trägt Punkte, Bestanden, Zeit und die Ergebnisse der einzelnen Aufgaben ein.'}${st.fmt === 'app' ? '' : '</span>'}
        ${st.fmt === 'scorm' ? `<label>Bestanden ab (% der Aufgaben${doc.form === 'challenge' ? ' bzw. XP' : ''})<input type="number" min="0" max="100" id="exPass" value="${st.pass}"></label>` : ''}
        ${doc.skin ? '<span class="help">Originaldesign: Die Datei ist die ursprüngliche Seite mit deinen Änderungen. Sie lässt sich später wieder in PathFinder öffnen und bearbeiten.</span><input type="checkbox" id="exCert" hidden>' : `<label class="chk"><input type="checkbox" id="exCert"${st.cert ? ' checked' : ''}>Zertifikat am Ende anbieten</label>`}
        ${appBlocks.length && st.fmt !== 'app' ? `<div class="ed-hint" style="font-size:13px">${appBlocks.length} App-Baustein${appBlocks.length > 1 ? 'e werden' : ' wird'} für den Export umgewandelt: Aufgaben werden zur <b>Selbstkontrolle</b> (Schüler tippen das Ergebnis ein, das vorher berechnet wird), Tabellen werden als Tabelle gezeigt.</div>` : ''}
        <span class="help">Alles entsteht hier im Browser; nichts wird hochgeladen.</span></div>`;
    };
    draw();
    el.addEventListener('click', async e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.x) { closeDlg(false); return; }
      const sg = t.closest('[data-eseg]'); if (sg) { st.fmt = t.dataset.v; draw(); return; }
      if (t.dataset.adopt) {
        st.cert = $('#exCert', el).checked; t.disabled = true; t.textContent = 'übernehme …';
        try { await host.adopt(await appHtml(st), doc.title); closeDlg(false); toast(`⤵ Lernpfad in ${esc(bundled.name)} übernommen`); }
        catch (er) { t.disabled = false; toast('Übernehmen fehlgeschlagen: ' + esc(er.message)); }
        return;
      }
      if (t.dataset.xproj) {
        st.cert = $('#exCert', el).checked; t.disabled = true; t.textContent = 'exportiere …';
        try { await host.exportProject(await appHtml(st), doc.title); closeDlg(false); }
        catch (er) { t.disabled = false; toast('Export fehlgeschlagen: ' + esc(er.message)); }
        return;
      }
      if (t.dataset.go) {
        st.pass = Math.max(0, Math.min(100, +($('#exPass', el)?.value ?? st.pass))); st.cert = $('#exCert', el).checked;
        t.disabled = true; t.textContent = 'erstelle …';
        try {
          const { d } = exportDoc(st);
          const html = st.fmt === 'app' ? await appHtml(st) : await buildHtml(d, st.fmt === 'scorm');
          if (st.fmt === 'app') download(new Blob([html], { type: 'text/html' }), fileName(`_${bundled.name}.html`));
          else if (st.fmt === 'html') download(new Blob([html], { type: 'text/html' }), fileName('.html'));
          else download(new Blob([zip({ 'imsmanifest.xml': manifest(d), 'index.html': html })], { type: 'application/zip' }), fileName('_SCORM.zip'));
          closeDlg(false); toast(st.fmt === 'app' ? `⇩ Lernpfad für ${esc(bundled.name)} erstellt` : st.fmt === 'html' ? '⇩ HTML-Datei erstellt' : '⇩ SCORM-Lernpaket erstellt – in Moodle als „Lernpaket“ hochladen');
        } catch (er) { t.disabled = false; t.textContent = 'Exportieren'; toast('Export fehlgeschlagen: ' + esc(er.message)); }
      }
    });
  }

  /* ---------- SCORM 1.2: Verbindung zur Lernplattform ---------- */
  function scormConnect() {
    let API = null;
    try { let w = window; for (let n = 0; w && n < 12; n++) { if (w.API) { API = w.API; break; } if (w === w.parent) break; w = w.parent; } } catch (e) { }
    try { if (!API && window.opener && window.opener.API) API = window.opener.API; } catch (e) { }
    if (!API) return { ok: false, get: () => '', report() { }, finish() { } };
    const t0 = Date.now();
    API.LMSInitialize('');
    const st = API.LMSGetValue('cmi.core.lesson_status');
    if (!st || st === 'not attempted') API.LMSSetValue('cmi.core.lesson_status', 'incomplete');
    const nInter = () => +API.LMSGetValue('cmi.interactions._count') || 0;
    return {
      ok: true,
      get: k => API.LMSGetValue(k),
      report(txt) {
        const checks = doc.stations.flatMap(s => { const c = s.blocks.filter(isCheck); return c.map(b => ({ id: b.id, w: doc.pointsOn ? ptsOf(b) : doc.form === 'challenge' ? (+b.xp || 1) : 1 })).concat(s.check ? [{ id: 'st:' + s.id, w: doc.form === 'challenge' || doc.pointsOn ? 0 : 1 }] : []); });
        const max = checks.reduce((a, c) => a + c.w, 0) || 1, got = checks.filter(c => prog.solved[c.id]).reduce((a, c) => a + c.w, 0);
        const pct = Math.round(100 * got / max);
        API.LMSSetValue('cmi.core.score.min', '0'); API.LMSSetValue('cmi.core.score.max', '100'); API.LMSSetValue('cmi.core.score.raw', String(pct));
        const allDone = checks.every(c => prog.solved[c.id]);
        API.LMSSetValue('cmi.core.lesson_status', pct >= (doc.pass ?? 80) ? 'passed' : allDone ? 'failed' : 'incomplete');
        prog.sent = prog.sent || []; // schon gemeldete Ergebnisse (SCORM 1.2 kann sie nicht zurücklesen)
        for (const c of checks) if (prog.solved[c.id] && !prog.sent.includes(c.id)) {
          const n = nInter(); prog.sent.push(c.id);
          API.LMSSetValue(`cmi.interactions.${n}.id`, String(c.id).replace(/[^\w:-]/g, '_'));
          API.LMSSetValue(`cmi.interactions.${n}.type`, 'performance');
          API.LMSSetValue(`cmi.interactions.${n}.result`, 'correct');
        }
        API.LMSSetValue('cmi.suspend_data', JSON.stringify({ ...JSON.parse(txt), sent: prog.sent }).slice(0, 4096));
        API.LMSCommit('');
      },
      finish(txt) {
        const s = Math.round((Date.now() - t0) / 1000), hh = String(Math.floor(s / 3600)).padStart(4, '0'), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
        API.LMSSetValue('cmi.core.session_time', `${hh}:${mm}:${ss}`);
        API.LMSSetValue('cmi.core.exit', 'suspend');
        API.LMSCommit(''); API.LMSFinish('');
      },
    };
  }

  /* ---------- Schnittstelle für Erweiterungen und die App ---------- */
  const ctx = {
    E, esc, plain, uid, ce, toast, imgHtml, xpTag, taskCard, shuffled, findBlock, blockLabel, host,
    get prog() { return prog; }, get doc() { return doc; }, get mode() { return mode; },
    solve: id => solve(id), render: () => render(),
    openDoc: d => openDoc(d), get current() { return doc; },
    /** Lernpfad als Datei für die App (Erweiterung eingebaut) – für „Fertig“ im Editor der App */
    buildForApp: () => { if (pending) commit(); return appHtml({ pass: doc.pass || 80, cert: doc.cert?.on !== false }); },
    get dirty() { return hist.length > 1; },
    /** vorhandene HTML-Lernpfad-Seite öffnen (Originaldesign); liefert das Dokument oder null */
    importHtml: html => importPage(html),
  };
  save(); render(); updUndo();
  host.attach?.(ctx);
  return ctx;
}
