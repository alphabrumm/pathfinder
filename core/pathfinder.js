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
 */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent; };
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
};
const INFO_KINDS = { merke: ['💡', 'Merke'], tipp: ['👉', 'Tipp'], achtung: ['⚠️', 'Achtung'], begriff: ['📘', 'Begriff'], regel: ['📏', 'Regel'], figur: ['🗨', 'Figur sagt'], abschluss: ['🏁', 'Abschluss'] };
const ANIMS = { tippen: 'Schreibmaschine', einblenden: 'Einblenden', glitch: 'Glitch', leuchten: 'Leuchten' };
const ANIM_OPTS = [['', 'keine'], ...Object.entries(ANIMS)];

/* ---------- Bausteine des Kerns ---------- */
const CORE = {
  text: { n: 'Text', ic: '¶', g: 'Grundbausteine', h: 'Absatz mit fett, kursiv, Code, Link', make: () => ({ html: '' }) },
  info: { n: 'Infokasten', ic: '💡', g: 'Grundbausteine', h: 'Merke, Tipp, Regel, Figur sagt …', make: () => ({ kind: 'merke', title: '', html: '', img: '', name: '' }) },
  figur: { n: 'Figur sagt', ic: '🗨', g: 'Grundbausteine', h: 'Figur mit Bild und Sprechblase', alias: 'info', make: () => ({ kind: 'figur', title: '', html: '', img: '', name: 'Debbie Debug' }) },
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
    cert: { on: true, need: 'alle', pct: 80, text: 'hat den Lernpfad erfolgreich bearbeitet.', show: { zeit: true, tipps: true, quiz: true, xp: true } },
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
  let doc = null;
  {
    const cur = LS.get(CUR); doc = cur && loadDoc(cur);
    if (!doc && opts.legacy) { const l = opts.legacy(); if (l) doc = migrate(l); }
    if (!doc) doc = migrate(sample());
  }
  let mode = 'edit', selId = null, curSid = null, single = false, fz = 1;
  let hist = [JSON.stringify(doc)], fut = [], pending = null;
  const freshProg = () => ({ solved: {}, quiz: {}, tips: {}, sol: {}, visited: {}, tries: {}, start: Date.now() });
  let prog = freshProg();

  const lp = $('#lp'), scroller = $('#scroll');
  function save() {
    const ok = LS.set(DOCKEY(doc.id), JSON.stringify(doc));
    LS.set(CUR, doc.id);
    const l = docList(), i = l.findIndex(x => x.id === doc.id), e = { id: doc.id, title: doc.title || 'ohne Titel', form: doc.form, t: Date.now() };
    if (i >= 0) l[i] = e; else l.unshift(e); saveDocList(l);
    $('#saved').textContent = ok ? '✓ gesichert' : '⚠ zu groß zum Sichern';
  }
  function commit() {
    clearTimeout(pending); pending = null;
    const s = JSON.stringify(doc); if (s === hist[hist.length - 1]) return;
    hist.push(s); if (hist.length > 200) hist.shift(); fut = []; save(); updUndo();
  }
  function softCommit() { $('#saved').textContent = '…'; clearTimeout(pending); pending = setTimeout(commit, 500); }
  function undo() { if (pending) commit(); if (hist.length < 2) return; fut.push(hist.pop()); doc = JSON.parse(hist[hist.length - 1]); save(); render(); updUndo(); }
  function redo() { if (!fut.length) return; const s = fut.pop(); hist.push(s); doc = JSON.parse(s); save(); render(); updUndo(); }
  function updUndo() { $('#bUndo').disabled = hist.length < 2; $('#bRedo').disabled = !fut.length; }
  function openDoc(d) { if (pending) commit(); doc = migrate(d); hist = [JSON.stringify(doc)]; fut = []; prog = freshProg(); selId = null; curSid = null; host.reset?.(); save(); render(); updUndo(); scroller.scrollTop = 0; }

  function findBlock(id) {
    for (const st of doc.stations) { const i = st.blocks.findIndex(b => b.id === id); if (i >= 0) return { st, i, b: st.blocks[i] }; }
    return null;
  }
  function toast(msg, ms = 2400) { $$('.ed-toast').forEach(x => x.remove()); const t = document.createElement('div'); t.className = 'ed-toast'; t.innerHTML = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }

  /* ---------- Text säubern ---------- */
  const OK_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'CODE', 'A', 'BR', 'UL', 'OL', 'LI', 'SUB', 'SUP', 'KBD']);
  function clean(html) {
    const d = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.firstChild;
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
    $('.lpwrap').style.background = p.l.bg;
  }
  function render() {
    const sc = scroller.scrollTop;
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
      + (d.hero !== 'hintergrund' ? `<div class="lp-logo${d.hero === 'logo' && opts.logo ? ' applogo' : ''}"${E() ? ' title="Antippen: eigenes Bild oder GIF setzen"' : ''}>${logo}</div>` : '')
      + `<div style="min-width:0">${ce('$kicker', doc.kicker, 'Kopfzeile', { tag: 'small' })}${ce('$title', doc.title, 'Titel des Lernpfads', { tag: 'h1', anim: doc.anim?.title })}${ce('$subtitle', doc.subtitle, 'Untertitel', { tag: 'p', rich: true, anim: doc.anim?.subtitle })}`
      + (goals.length ? `<ul class="lp-goals">${goals.map((g, i) => ce('$goals.' + i, g, 'Lernziel', { tag: 'li', rich: true })).join('')}</ul>` : '')
      + (doc.rank ? `<div class="lp-rank">${ce('$rank', doc.rank, 'Rang', { tag: 'span', rich: true })}</div>` : '')
      + (E() && (!goals.length || !doc.rank) ? `<div class="ed-hint" style="display:inline-block">Lernziele und Rang: 🎨 Design → Kopf</div>` : '')
      + `</div></header>`;
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
    h += `</main><footer class="lp-foot">${doc.form === 'challenge' ? 'Challenge' : 'Lernpfad'} · erstellt mit PathFinder · läuft komplett im Browser</footer>`;
    lp.innerHTML = h;
    runAnims();
    scroller.scrollTop = sc;
    if (selId && !findBlock(selId)) selId = null;
    markSel();
  }
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
  const wrap = (b, inner, cls = '') => `<div class="blk ${cls}" data-id="${b.id}">${E() ? tools(b) : ''}${inner}</div>`;
  const imgHtml = (src, cap, size) => src ? `<figure class="lp-img"${size === 'klein' ? ' style="max-width:45%"' : ''}><img src="${src}" alt="">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>` : '';
  const xpTag = b => doc.form === 'challenge' && b.xp ? `<span class="xp">+${b.xp} XP</span>` : '';
  /** Aufgabenkarte (auch für Aufgaben der Apps): Kopf, Bild, Auftrag, eigene Knöpfe, Tipps, Lösung */
  function taskCard(b, { buttons = '', hint = '', where = '' } = {}) {
    const ok = !!prog.solved[b.id];
    let h = `<div class="lp-card lp-task${ok ? ' ok' : ''}"><div class="hd">${ce('title', b.title, 'Aufgabe 1', { tag: 'b', cls: 'lp-ctitle' })}${xpTag(b)}${where ? `<span class="where">${esc(where)}</span>` : ''}<span class="lp-state">${ok ? '✓ geschafft' : ''}</span></div>`;
    h += imgHtml(b.img, '', 'klein') + ce('html', b.html, 'Arbeitsauftrag …', { rich: true });
    h += `<div>${buttons}</div>` + (E() && hint ? `<div class="ed-hint">${hint}</div>` : '');
    (b.tips || []).forEach((t, i) => { h += `<details data-tip="${i}"><summary>Tipp ${i + 1}</summary><div>${t}</div></details>`; });
    if (b.solution) h += `<details data-sol="1"><summary>Lösung anzeigen</summary><div>${b.solution}</div></details>`;
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
      case 'task': return wrap(b, taskCard(b, { buttons: `<button class="lp-btn${ok ? ' alt' : ''}" data-run="done">${ok ? '✓ erledigt' : 'Erledigt'}</button>` }));
      case 'quiz': {
        const st = prog.quiz[b.id] || {};
        let h = `<div class="lp-card lp-quiz"><div class="hd"><b class="lp-ctitle">${b.qs.length > 1 ? `Quiz · ${b.qs.length} Fragen` : 'Quiz'}</b>${xpTag(b)}<span class="lp-state">${ok ? '✓ alles richtig' : ''}</span></div>`;
        b.qs.forEach((q, qi) => {
          h += `<div class="qq">${b.qs.length > 1 ? `<span class="qn">${qi + 1}</span>` : ''}${ce(`qs.${qi}.q`, q.q, 'Frage …', { rich: true, cls: 'qt' })}`;
          q.opts.forEach((o, i) => {
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
      case 'code': return wrap(b, `<div class="lp-card lp-code"><b class="lp-ctitle">Code</b> <span style="color:var(--ink-2);font-size:.85em">${esc(b.lang)}</span>${E() ? `<pre contenteditable="true" data-f="code" data-ph="Code …" spellcheck="false">${esc(b.code)}</pre>` : `<pre>${esc(b.code)}</pre>`}<button class="lp-btn alt" data-run="copy">⧉ ${esc(host.copyLabel || 'Kopieren')}</button></div>`);
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
    return `<div class="lp-cert" id="st-cert"><div class="seal">★</div><div><b>${doc.form === 'challenge' ? 'Challenge geschafft?' : 'Zertifikat'}</b><br>${E() ? `Am Ende: Name eingeben, PDF mit Bearbeitungszeit und Erfolgsübersicht.<br><button class="lp-btn alt" data-act="certcfg">⚙ Zertifikat einstellen</button><button class="lp-btn alt" data-act="certprev">Muster ansehen</button>`
      : (can ? `Alles geschafft – erstelle dein Zertifikat.<br><button class="lp-btn" data-act="certprev">★ Zertifikat (PDF) erstellen</button>` : `Wird frei, wenn ${c.need === 'alle' ? 'alle Aufgaben gelöst sind' : c.need === 'pct' ? `mindestens ${c.pct} % gelöst sind` : '…'}.<br><button class="lp-btn" disabled>★ Zertifikat (PDF) erstellen</button>`)}</div></div>`;
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
  function isGapOk(b, i, v) { const a = [...(b.html || '').matchAll(/\[\[(.+?)\]\]/g)][i]; return !!a && a[1].split('|').some(x => normAns(x) === normAns(v)); }

  /* ---------- Eingaben im Bearbeiten-Modus ---------- */
  function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; while (ks.length > 1) { const k = ks.shift(); if (o[k] == null) o[k] = {}; o = o[k]; } o[ks[0]] = val; }
  lp.addEventListener('input', ev => {
    const el = ev.target.closest('[data-f]'); if (!el || !E()) return;
    const f = el.dataset.f, val = el.dataset.rich ? clean(el.innerHTML) : el.textContent.replace(/\s+/g, ' ').trim();
    if (f === 'code') { const r = findBlock(el.closest('.blk').dataset.id); r.b.code = el.innerText.replace(/\n$/, ''); softCommit(); return; }
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
    if (E() && t.closest('.lp-logo, .lp-hero.has-bg') && !t.closest('[data-f]')) { openDesign(); return; }
    const fzb = t.closest('[data-fz]'); if (fzb) { fz = Math.min(1.5, Math.max(.8, +(fz + (fzb.dataset.fz === '+' ? .1 : -.1)).toFixed(2))); lp.style.setProperty('--fz', fz); return; }
    const stop = t.closest('#stops a'); if (stop) { if (stop.dataset.sid === 'cert') { $('#st-cert')?.scrollIntoView({ behavior: 'smooth' }); return; } goStation(stop.dataset.sid, true); return; }
    const sd = t.closest('[data-sdone]'); if (sd && !E()) { prog.solved['st:' + sd.dataset.sdone] = sd.checked; render(); return; }
    const act = t.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'addStation') { const s = { id: uid(), title: '', sub: '', check: false, blocks: [{ id: uid(), type: 'text', html: '' }] }; doc.stations.push(s); curSid = s.id; commit(); render(); goStation(s.id, true); setTimeout(() => $(`#st-${s.id} h2[data-f]`)?.focus(), 350); return; }
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
    if (E()) { const blk = t.closest('.blk'); selId = blk ? blk.dataset.id : null; markSel(); if (blk) curSid = blk.closest('.lp-station')?.dataset.sid || curSid; return; }
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
      const items = Object.entries(T).filter(([k, t]) => !filter || (t.n + ' ' + t.h + ' ' + k).toLowerCase().includes(filter));
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
    if (g) { e.preventDefault(); const blk = g.closest('.blk'); selId = blk.dataset.id; markSel(); drag = { kind: 'blk', id: blk.dataset.id, el: blk, line: document.createElement('div') }; drag.line.className = 'ed-drop-line'; blk.classList.add('drag-ghost'); g.setPointerCapture(e.pointerId); return; }
    const stop = e.target.closest('#stops a[data-sid]');
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
    const d = drag; drag = null;
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
    drag = { kind: 'chip', el: c, x: e.clientX, y: e.clientY, moved: false, pid: e.pointerId, gap: !!c.dataset.gchip };
  }
  function chipMove(e) {
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    if (!drag.moved) { drag.moved = true; try { drag.el.setPointerCapture(drag.pid); } catch (er) { } drag.ghost = drag.el.cloneNode(true); Object.assign(drag.ghost.style, { position: 'fixed', zIndex: 300, pointerEvents: 'none', width: drag.el.offsetWidth + 'px', opacity: .9, boxShadow: '0 8px 20px rgba(0,0,0,.25)' }); document.body.appendChild(drag.ghost); }
    drag.ghost.style.left = (e.clientX - drag.el.offsetWidth / 2) + 'px'; drag.ghost.style.top = (e.clientY - 20) + 'px';
    $$('.hover', lp).forEach(s => s.classList.remove('hover'));
    document.elementsFromPoint(e.clientX, e.clientY).find(x => x.matches?.(drag.gap ? '[data-gslot]' : '[data-slot]'))?.classList.add('hover');
  }
  function chipUp(e) {
    const d = drag; drag = null; if (!d.moved) return;
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
    const el = $(`#st-${sid}`, lp); if (el) scroller.scrollTo({ top: el.offsetTop - ($('.lp-trail', lp)?.offsetHeight || 0) - 4, behavior: smooth ? 'smooth' : 'auto' });
  }
  scroller.addEventListener('scroll', () => {
    if (single) return;
    const top = scroller.getBoundingClientRect().top + ($('.lp-trail', lp)?.offsetHeight || 0) + 40;
    let cur = null; for (const s of $$('.lp-station', lp)) { if (s.getBoundingClientRect().top <= top) cur = s.dataset.sid; }
    cur = cur || doc.stations[0]?.id;
    if (cur && cur !== curSid) { curSid = cur; if (mode === 'preview') prog.visited[cur] = 1; $$('.lp-station', lp).forEach(s => s.classList.toggle('cur', s.dataset.sid === cur)); $$('#stops a', lp).forEach(a => a.classList.toggle('cur', a.dataset.sid === cur)); $('#stops a.cur', lp)?.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
  }, { passive: true });

  /* ---------- Einstellungen (⚙) ---------- */
  const XP = { k: 'xp', l: 'XP (Challenge)', t: 'number', show: () => doc.form === 'challenge' };
  const FORMS = {
    text: [{ k: 'anim', l: 'Textanimation', t: 'select', o: ANIM_OPTS, help: 'Läuft einmal, sobald der Text ins Bild scrollt (nur in Vorschau und für Schüler).' }],
    info: [{ k: 'kind', l: 'Art', t: 'select', o: Object.entries(INFO_KINDS).map(([k, v]) => [k, v[0] + ' ' + v[1]]) }, { k: 'title', l: 'Überschrift', t: 'text', help: 'leer = Name der Art', show: b => b.kind !== 'figur' }, { k: 'name', l: 'Name der Figur', t: 'text', show: b => b.kind === 'figur' }, { k: 'img', l: 'Bild (Figur, Abschluss)', t: 'image', show: b => b.kind === 'figur' || b.kind === 'abschluss' }, { k: 'anim', l: 'Textanimation', t: 'select', o: ANIM_OPTS }],
    image: [{ k: 'src', l: 'Bild oder GIF', t: 'image' }, { k: 'caption', l: 'Bildunterschrift', t: 'text' }, { k: 'alt', l: 'Alternativtext (für Vorlese-Programme)', t: 'text' }, { k: 'size', l: 'Größe', t: 'select', o: [['voll', 'volle Breite'], ['klein', 'klein']] }],
    table: [{ k: 'head', l: 'Erste Zeile ist Kopfzeile', t: 'check' }, { k: 'rows', l: 'Größe', t: 'grid' }],
    reveal: [{ k: 'summary', l: 'Überschrift der Klappbox', t: 'text' }],
    file: [{ k: 'data', l: 'Datei', t: 'file' }, { k: 'name', l: 'Dateiname', t: 'text' }],
    html: [{ k: 'html', l: 'HTML', t: 'code', help: 'Wird für Schüler so angezeigt. Skripte laufen erst im exportierten Lernpfad.' }],
    task: [{ k: 'title', l: 'Titel', t: 'text' }, { k: 'tips', l: 'Tipps (werden nacheinander aufgedeckt)', t: 'list', ph: 'Tipp' }, { k: 'solution', l: 'Lösung zum Aufdecken (leer = keine)', t: 'text' }, { k: 'img', l: 'Bild oder GIF zur Aufgabe', t: 'image' }, XP],
    quiz: [{ k: 'qs', l: 'Fragen', t: 'qs' }, XP],
    gap: [{ k: 'bank', l: 'Begriffe zum Ziehen anbieten (statt Tippen)', t: 'check' }, { k: 'extra', l: 'Zusätzliche falsche Begriffe (Ablenker)', t: 'list', ph: 'Begriff', show: b => b.bank }, { k: 'heft', l: 'Als Hefteintrag gestalten (mit Titel)', t: 'check' }, XP],
    match: [{ k: 'title', l: 'Überschrift', t: 'text' }, { k: 'pairs', l: 'Paare', t: 'pairs' }, XP],
    lock: [{ k: 'after', l: 'Frei, sobald gelöst ist:', t: 'target' }],
    code: [{ k: 'lang', l: 'Sprache', t: 'select', o: [['java', 'Java'], ['python', 'Python'], ['sql', 'SQL'], ['text', 'Text']] }],
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
  function openForm(id) {
    let fields, b, title, apply;
    if (id === 'cert') {
      b = clone(doc.cert); title = '★ Zertifikat';
      fields = [{ k: 'on', l: 'Zertifikat am Ende anbieten', t: 'check' },
        { k: 'need', l: 'Erreichbar, wenn …', t: 'select', o: [['alle', 'alle Aufgaben gelöst sind'], ['pct', 'ein Mindestanteil gelöst ist'], ['immer', 'immer']] },
        { k: 'pct', l: 'Mindestanteil in %', t: 'number', show: x => x.need === 'pct' },
        { k: 'text', l: 'Text auf dem Zertifikat', t: 'text', help: '„Max Muster … hat den Lernpfad erfolgreich bearbeitet.“' },
        { k: 'show.zeit', l: 'Bearbeitungszeit zeigen', t: 'check' }, { k: 'show.tipps', l: 'Benutzte Tipps und Lösungshilfen zeigen', t: 'check' },
        { k: 'show.quiz', l: 'Ergebnis je Station zeigen', t: 'check' }, { k: 'show.xp', l: 'XP zeigen (Challenge)', t: 'check' }];
      apply = () => { doc.cert = b; commit(); render(); };
    } else if (id.startsWith('st:')) {
      const s = doc.stations.find(x => x.id === id.slice(3)); b = { title: s.title, sub: s.sub, nr: s.nr || '', check: s.check, anim: s.anim || '' }; title = '⚙ Station';
      fields = [{ k: 'title', l: 'Titel', t: 'text' }, { k: 'sub', l: 'Untertitel', t: 'text' }, { k: 'nr', l: 'Eigenes Zeichen statt Nummer (z. B. ✂)', t: 'text', help: 'leer = automatische Nummer' }, { k: 'check', l: 'Haken „Station erledigt“ am Ende', t: 'check' }, { k: 'anim', l: 'Animation des Stationstitels', t: 'select', o: ANIM_OPTS }];
      apply = () => { Object.assign(s, b); commit(); render(); };
    } else {
      const r = findBlock(id); b = clone(r.b); const t = def(b);
      fields = t?.form || FORMS[b.type] || [];
      title = b.type === 'info' ? (INFO_KINDS[b.kind]?.[0] + ' ' + INFO_KINDS[b.kind]?.[1]) : (t?.ic || '') + ' ' + (t?.n || b.type);
      apply = () => { const rr = findBlock(id); if (rr) rr.st.blocks[rr.i] = b; commit(); render(); };
    }
    const { el, bd } = dialog(); bd.onclick = () => closeDlg(true);
    dlg = { el, bd, apply };
    const takeBtn = (kind, k) => host.selectedCell ? `<button class="take" data-take="${kind}" data-tk="${k}">${kind === 'cell' ? '▦ gewählte Zelle' : 'fx aus ' + esc(host.name || 'App')}</button>` : '';
    const draw = () => {
      let h = `<header><b>${esc(title)}</b><button data-x="cancel">Abbrechen</button><button class="ok" data-x="ok">Fertig</button></header><div class="ed-form">`;
      fields.forEach(f => {
        if (f.show && !f.show(b)) return;
        const v = getP(b, f.k), help = f.help ? `<span class="help">${esc(f.help)}</span>` : '';
        if (FIELDS[f.t]) { h += FIELDS[f.t].html(f, v, b, ctx); return; }
        if (f.t === 'text') h += `<label>${esc(f.l)}<input type="text" data-k="${f.k}" value="${esc(plain(v ?? ''))}">${help}</label>`;
        else if (f.t === 'number') h += `<label>${esc(f.l)}<input type="number" min="0" data-k="${f.k}" value="${esc(v ?? 0)}">${help}</label>`;
        else if (f.t === 'check') h += `<label class="chk"><input type="checkbox" data-k="${f.k}"${v ? ' checked' : ''}>${esc(f.l)}</label>`;
        else if (f.t === 'select') h += `<label>${esc(f.l)}<select data-k="${f.k}">${f.o.map(([k, n]) => `<option value="${k}"${k === (v ?? '') ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>${help}</label>`;
        else if (f.t === 'code') h += `<label>${esc(f.l)}<textarea class="mono" data-k="${f.k}" style="min-height:220px" spellcheck="false">${esc(v)}</textarea>${help}</label>`;
        else if (f.t === 'cell') h += `<div class="row"><label>${esc(f.l)}<input type="text" class="mono" data-k="${f.k}" value="${esc(v)}" placeholder="D2" autocapitalize="characters"></label>${takeBtn('cell', f.k)}</div>`;
        else if (f.t === 'formula') h += `<div class="row"><label>${esc(f.l)}<input type="text" class="mono" data-k="${f.k}" value="${esc(v)}" placeholder="=B2*C2" autocapitalize="off" autocorrect="off" spellcheck="false">${help}</label>${takeBtn('formula', f.k)}</div>`;
        else if (f.t === 'list') h += `<label>${esc(f.l)}</label><div class="list">${(v || []).map((t, i) => `<div class="it"><input type="text" data-li="${f.k}" data-i="${i}" value="${esc(plain(t))}" placeholder="${esc(f.ph)} ${i + 1}"><button data-ldel="${f.k}" data-i="${i}" aria-label="entfernen">✕</button></div>`).join('')}<button class="add" data-ladd="${f.k}">＋ ${esc(f.ph)}</button></div>`;
        else if (f.t === 'qs') h += `<label>${esc(f.l)}</label>${v.map((q, qi) => `<fieldset><legend>Frage ${qi + 1}</legend><input type="text" data-qq="${qi}" value="${esc(plain(q.q))}" placeholder="Frage"><div class="list">${q.opts.map((o, i) => `<div class="it"><input type="radio" name="ok${qi}" data-qok2="${qi}.${i}"${o.ok ? ' checked' : ''} title="richtig" style="width:24px;height:24px"><input type="text" data-qt="${qi}.${i}" value="${esc(plain(o.t))}" placeholder="Antwort ${i + 1}"><button data-qodel="${qi}.${i}" aria-label="entfernen">✕</button></div><div class="it" style="padding-left:30px"><input type="text" data-qfb="${qi}.${i}" value="${esc(plain(o.fb))}" placeholder="Rückmeldung zu dieser Antwort (optional)" style="font-size:13px"></div>`).join('')}<div class="row" style="align-items:center"><button class="add" data-qoadd="${qi}">＋ Antwort</button>${v.length > 1 ? `<button class="add" data-qdel="${qi}">Frage entfernen</button>` : ''}</div></div></fieldset>`).join('')}<button class="add" data-qadd="1">＋ Frage</button>`;
        else if (f.t === 'pairs') h += `<label>${esc(f.l)}</label><div class="list">${v.map((p, i) => `<div class="it"><input type="text" data-pa="${i}" value="${esc(p.a)}" placeholder="Karte"><span>→</span><input type="text" data-pb="${i}" value="${esc(p.b)}" placeholder="passt zu"><button data-pdel="${i}" aria-label="entfernen">✕</button></div>`).join('')}<button class="add" data-padd="1">＋ Paar</button></div>`;
        else if (f.t === 'image') h += `<label>${esc(f.l)}</label><div class="imgprev">${v ? `<img src="${v}" alt="">` : ''}<label class="take" style="display:inline-flex;align-items:center;cursor:pointer">🖼 ${v ? 'Anderes Bild' : 'Bild/GIF wählen'}<input type="file" accept="image/*" data-img="${f.k}" hidden></label>${v ? `<button class="add" data-imgdel="${f.k}">entfernen</button>` : ''}</div><span class="help">Große Fotos werden verkleinert, GIFs bleiben animiert.</span>`;
        else if (f.t === 'file') h += `<label>${esc(f.l)}</label><div class="imgprev"><span class="help">${v ? `${esc(b.name)} · ${Math.round(v.length * .75 / 1024)} KB` : 'noch keine Datei'}</span><label class="take" style="display:inline-flex;align-items:center;cursor:pointer">📎 Datei wählen<input type="file" data-file="${f.k}" hidden></label></div>`;
        else if (f.t === 'grid') { const R = v.length, C = v[0]?.length || 0; h += `<label>${esc(f.l)}: ${R} Zeilen × ${C} Spalten</label><div class="row" style="flex-wrap:wrap"><button class="add" data-g="r+">＋ Zeile</button><button class="add" data-g="r-">− Zeile</button><button class="add" data-g="c+">＋ Spalte</button><button class="add" data-g="c-">− Spalte</button></div>`; }
        else if (f.t === 'target') { const o = doc.stations.flatMap(s => s.blocks.filter(isCheck).map(x => [x.id, s.title + ' · ' + blockLabel(x)])); h += `<label>${esc(f.l)}<select data-k="${f.k}"><option value="">– bitte wählen –</option>${o.map(([k, n]) => `<option value="${k}"${k === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select><span class="help">Alles unter der Sperre (bis zum Ende der Station) wird erst danach frei.</span></label>`; }
      });
      el.innerHTML = h + '</div>';
    };
    draw();
    el.addEventListener('input', e => {
      const t = e.target, d = t.dataset;
      for (const F of Object.values(FIELDS)) F.input?.(t, b, draw);
      if (d.k) { const f = fields.find(x => x.k === d.k); let v = t.type === 'checkbox' ? t.checked : t.type === 'number' ? +t.value : t.value; if (f?.t === 'cell') v = v.toUpperCase().replace(/\s/g, ''); setPath(b, d.k, v); if (t.tagName === 'SELECT' || t.type === 'checkbox') draw(); }
      if (d.li) getP(b, d.li)[+d.i] = esc(t.value);
      if (d.qq != null) b.qs[+d.qq].q = esc(t.value);
      if (d.qt) { const [qi, i] = d.qt.split('.').map(Number); b.qs[qi].opts[i].t = esc(t.value); }
      if (d.qfb) { const [qi, i] = d.qfb.split('.').map(Number); b.qs[qi].opts[i].fb = esc(t.value); }
      if (d.qok2) { const [qi, i] = d.qok2.split('.').map(Number); b.qs[qi].opts.forEach((o, k) => o.ok = k === i); }
      if (d.pa != null) b.pairs[+d.pa].a = t.value;
      if (d.pb != null) b.pairs[+d.pb].b = t.value;
    });
    el.addEventListener('change', async e => {
      const t = e.target;
      if (t.dataset.img && t.files[0]) { const url = await loadImage(t.files[0]); if (url) { setPath(b, t.dataset.img, url); draw(); } }
      if (t.dataset.file && t.files[0]) { const f = t.files[0]; if (f.size > 5e6) toast('⚠ Die Datei ist größer als 5 MB.'); const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); }); b.data = String(url).split(',')[1]; if (!b.name) b.name = f.name; draw(); }
    });
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      const d = t.dataset;
      if (d.x) { closeDlg(d.x === 'ok'); return; }
      for (const F of Object.values(FIELDS)) F.click?.(d, b, draw, ctx);
      if (d.ladd) { getP(b, d.ladd).push(''); draw(); $$(`[data-li]`, el).pop()?.focus(); }
      if (d.ldel) { getP(b, d.ldel).splice(+d.i, 1); draw(); }
      if (d.qadd) { b.qs.push({ q: '', opts: [{ t: '', ok: true, fb: '' }, { t: '', ok: false, fb: '' }] }); draw(); }
      if (d.qdel) { b.qs.splice(+d.qdel, 1); draw(); }
      if (d.qoadd) { b.qs[+d.qoadd].opts.push({ t: '', ok: false, fb: '' }); draw(); }
      if (d.qodel) { const [qi, i] = d.qodel.split('.').map(Number); b.qs[qi].opts.splice(i, 1); draw(); }
      if (d.padd) { b.pairs.push({ a: '', b: '' }); draw(); }
      if (d.pdel) { b.pairs.splice(+d.pdel, 1); draw(); }
      if (d.imgdel) { setPath(b, d.imgdel, ''); draw(); }
      if (d.g) { const R = b.rows, C = R[0]?.length || 1; if (d.g === 'r+') R.push(Array(C).fill('')); if (d.g === 'r-' && R.length > 1) R.pop(); if (d.g === 'c+') R.forEach(r => r.push('')); if (d.g === 'c-' && C > 1) R.forEach(r => r.pop()); draw(); }
      if (d.take === 'cell') { const a = host.selectedCell(); setPath(b, d.tk, a); draw(); toast(`Zelle ${a} übernommen`); }
      if (d.take === 'formula') { const a = host.selectedCell(), f = host.cellFormula?.(a); if (!f || !String(f).startsWith('=')) { toast(`In ${a} steht keine Formel – erst eine Formel eintragen.`); return; } setPath(b, d.tk, f); const ck = d.tk.replace(/target$/, 'cell'); if (ck !== d.tk) setPath(b, ck, a); draw(); toast(`${a}: ${esc(f)} übernommen`); }
    });
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
    const { el, bd } = dialog('dock'); bd.onclick = () => closeDlg(true);
    dlg = { el, bd, apply: () => commit() };
    const seg = (k, o, cur) => `<span class="ed-dseg" data-seg="${k}">${o.map(([v, n]) => `<button data-v="${v}" aria-pressed="${v === cur}">${n}</button>`).join('')}</span>`;
    const sel = (k, cur) => `<select data-anim-k="${k}">${ANIM_OPTS.map(([v, n]) => `<option value="${v}"${(cur || '') === v ? ' selected' : ''}>${n}</option>`).join('')}</select>`;
    const draw = () => {
      const d = doc.design;
      el.innerHTML = `<header><b>🎨 Design</b><button class="ok" data-x="ok">Fertig</button></header><div class="ed-form">
        <label>Form</label>${seg('form', [['lernpfad', 'Lernpfad'], ['challenge', 'Challenge']], doc.form)}
        <label>Farbpalette <span class="help">${esc(PALETTES[d.pal].n)}</span></label><div class="ed-sw">${PALETTES.map((p, i) => `<button data-pal="${i}" title="${esc(p.n)}" aria-pressed="${i === d.pal}"><span style="background:${p.l.a1}"></span><span style="background:${p.l.a2}"></span><span style="background:${p.l.a3}"></span></button>`).join('')}</div>
        <label>Schrift</label>${seg('font', Object.entries(FONTS).map(([k, f]) => [k, f.n]), d.font)}
        <label>Stationen</label>${seg('shape', [['eckig', '▢ eckig'], ['rund', '◯ rund']], d.shape)}
        <fieldset><legend>Kopf</legend>${seg('hero', [['logo', 'App-Logo'], ['bild', 'eigenes Bild'], ['gross', 'großes Bild rechts'], ['hintergrund', 'Bild als Hintergrund']], d.hero)}
        ${d.hero !== 'logo' ? `<div class="imgprev">${d.heroImg ? `<img src="${d.heroImg}" alt="">` : ''}<label class="take" style="display:inline-flex;align-items:center;cursor:pointer">🖼 ${d.heroImg ? 'Anderes Bild' : 'Bild/GIF wählen'}<input type="file" accept="image/*" id="heroFile" hidden></label></div>` : ''}
        <label>Lernziele</label><div class="list">${(doc.goals || []).map((g, i) => `<div class="it"><input type="text" data-goal="${i}" value="${esc(plain(g))}" placeholder="Lernziel ${i + 1}"><button data-gdel="${i}" aria-label="entfernen">✕</button></div>`).join('')}<button class="add" data-gadd="1">＋ Lernziel</button></div>
        <label>Rang / Abzeichen (optional)<input type="text" id="rankIn" value="${esc(plain(doc.rank))}" placeholder="z. B. Dein Rang: HACKER NEWBIE"></label>
        <div class="row"><label>Animation Titel${sel('title', doc.anim?.title)}</label><label>Animation Untertitel${sel('subtitle', doc.anim?.subtitle)}</label></div>
        ${d.hero === 'gross' ? `<label>Tipp-Zeilen auf dem großen Bild (wie ein Terminal)<textarea id="linesIn" class="mono" placeholder="&gt; login crew&#10;&gt; lade daten.exe">${esc((doc.typeLines || []).join('\n'))}</textarea><span class="help">Jede Zeile wird nacheinander getippt.</span></label>` : ''}</fieldset>
      </div>`;
    };
    draw();
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.x) { closeDlg(true); return; }
      if (t.dataset.pal) doc.design.pal = +t.dataset.pal;
      if (t.dataset.gadd) doc.goals.push('');
      if (t.dataset.gdel) doc.goals.splice(+t.dataset.gdel, 1);
      const sg = t.closest('[data-seg]'); if (sg) { const k = sg.dataset.seg; if (k === 'form') doc.form = t.dataset.v; else doc.design[k] = t.dataset.v; }
      draw(); render(); if (t.dataset.gadd) $$('[data-goal]', el).pop()?.focus();
    });
    el.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.goal != null) { doc.goals[+t.dataset.goal] = esc(t.value); render(); }
      if (t.id === 'rankIn') { doc.rank = esc(t.value); render(); }
      if (t.dataset.animK) { doc.anim = { ...(doc.anim || {}), [t.dataset.animK]: t.value }; animDone.clear(); render(); }
      if (t.id === 'linesIn') { doc.typeLines = t.value.split('\n').filter(x => x.trim()); animDone.delete('$lines'); render(); }
    });
    el.addEventListener('change', async e => { if (e.target.id === 'heroFile' && e.target.files[0]) { doc.design.heroImg = await loadImage(e.target.files[0]); draw(); render(); } });
  }

  /* ---------- Zertifikat (Muster; das PDF folgt mit dem Export) ---------- */
  function certPreview() {
    const { el, bd } = dialog(); bd.onclick = () => closeDlg(false); dlg = { el, bd, apply: () => { } };
    const mins = Math.max(1, Math.round((Date.now() - prog.start) / 60000));
    const c = doc.cert, p = PALETTES[doc.design.pal].l;
    const rows = doc.stations.map(s => { const ch = checksOf(s), n = ch.filter(id => prog.solved[id]).length; const tips = s.blocks.reduce((a, b) => a + Object.keys(prog.tips).filter(k => k.startsWith(b.id + ':')).length, 0); const sols = s.blocks.filter(b => prog.sol[b.id]).length; return `<tr><td>${esc(s.title)}</td><td>${ch.length ? `${n} / ${ch.length}` : '–'}</td>${c.show.tipps ? `<td>${tips || sols ? `${tips} Tipp${tips === 1 ? '' : 's'}${sols ? `, ${sols} Lösung` : ''}` : 'ohne Hilfe'}</td>` : ''}</tr>`; }).join('');
    el.innerHTML = `<header><b>★ Zertifikat – Muster</b><button class="ok" data-x="ok">Schließen</button></header>
      <div class="ed-form"><label>Dein Name<input type="text" id="certName" value="Max Muster"></label></div>
      <div class="ed-certprev" style="border-color:${p.a1}"><div style="font-size:12px;letter-spacing:.14em;color:#888">${esc(plain(doc.kicker)).toUpperCase()}</div>
      <h2 style="color:${p.a1}">${doc.form === 'challenge' ? 'Challenge-Urkunde' : 'Zertifikat'}</h2><div style="font-size:20px;font-weight:700;margin:8px 0" id="certN">Max Muster</div>
      <div>${esc(c.text)}</div><div style="font-weight:700;margin-top:4px">„${esc(doc.title)}“</div>
      ${c.show.zeit ? `<div style="margin-top:8px;font-size:14px">Aktive Bearbeitungszeit: <b>${mins} min</b> · ${new Date(prog.start).toLocaleDateString('de-DE')} – ${new Date().toLocaleDateString('de-DE')}</div>` : ''}
      ${c.show.quiz ? `<table><tr><td><b>Station</b></td><td><b>gelöst</b></td>${c.show.tipps ? '<td><b>Hilfen</b></td>' : ''}</tr>${rows}</table>` : ''}
      ${c.show.xp && doc.form === 'challenge' ? `<div>⚡ ${xpNow()} von ${xpMax()} XP</div>` : ''}
      <div class="code">Prüfcode K7M-2QX</div></div>
      <div class="ed-form"><span class="help">Mit dem Export entsteht daraus ein PDF zum Speichern oder Hochladen in Moodle. Die Zeit zählt nur, solange der Lernpfad offen ist und benutzt wird.</span></div>`;
    el.addEventListener('input', e => { if (e.target.id === 'certName') $('#certN', el).textContent = e.target.value; });
    el.addEventListener('click', e => { if (e.target.closest('[data-x]')) closeDlg(false); });
  }

  /* ---------- Knöpfe in Lernpfaden ---------- */
  function runAction(id, a) {
    const r = findBlock(id); if (!r) return;
    const b = r.b, t = def(b);
    if (t?.run) { t.run(a, b, ctx); return; }
    if (E() && a !== 'download') { toast('In der <b>Vorschau</b> (⌘P) ausprobieren'); return; }
    if (a === 'done') { prog.solved[id] = !prog.solved[id]; render(); }
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
    h += '<button data-new="lernpfad"><b>＋ Neuer Lernpfad</b><span>leer beginnen</span></button><button data-new="challenge"><b>＋ Neue Challenge</b><span>leer beginnen</span></button>';
    if (ex.length) h += `<div class="grp">${esc(opts.examplesTitle || 'Beispiele')}</div>` + ex.map(e => `<button data-ex="${esc(e.file)}"><b>${esc(e.title)}</b><span>${esc(e.note || '')}</span></button>`).join('');
    $('#openList', pop).innerHTML = h; placePop(anchor);
    pop.onclick = async ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.open) { const d = loadDoc(b.dataset.open); closePop(); if (d) openDoc(d); }
      if (b.dataset.new) { closePop(); openDoc(emptyDoc(b.dataset.new)); }
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
  function placePop(anchor) { const r = anchor.getBoundingClientRect(); pop.style.left = Math.max(10, Math.min(innerWidth - pop.offsetWidth - 10, r.right - pop.offsetWidth)) + 'px'; pop.style.top = (r.bottom + 6) + 'px'; }

  /* ---------- Leiste oben ---------- */
  function setMode(m) {
    if (pending) commit();
    mode = m; selId = null; closePop();
    $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    if (m === 'preview') { prog.visited[curSid] = 1; animDone.clear(); }
    render();
    toast(m === 'preview' ? '▶ Vorschau – so sehen es die Schüler. Fortschritt wird hier nur probeweise gezählt.' : '✎ Bearbeiten');
  }
  $('#modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
  $('#bUndo').onclick = undo; $('#bRedo').onclick = redo;
  $('#bSingle').onclick = () => { single = !single; $('#bSingle').classList.toggle('on', single); $('#bSingle').setAttribute('aria-pressed', String(single)); render(); scroller.scrollTop = 0; };
  $('#bDesign').onclick = openDesign;
  $('#bOpen').onclick = e => openChooser(e.currentTarget);
  const bWide = $('#bWide'); if (bWide) bWide.onclick = () => $('#app').classList.toggle('lp-only');
  function infoDlg(title, html) { const { el, bd } = dialog(); bd.onclick = () => closeDlg(false); dlg = { el, bd, apply: () => { } }; el.innerHTML = `<header><b>${title}</b><button class="ok" data-x="1">Schließen</button></header>${html}`; el.onclick = ev => { if (ev.target.closest('[data-x]')) closeDlg(false); }; }
  $('#bMore').onclick = e => {
    closePop(); pop = document.createElement('div'); pop.className = 'ed-pop';
    pop.innerHTML = `<h3>Mehr</h3><div class="ed-pal">
      <button data-m="reset"><b>↺ Vorschau-Fortschritt zurücksetzen</b><span>Haken, Quiz, Sperren wieder leer</span></button>
      <button data-m="json"><b>{ } Dokument ansehen</b><span>so wird der Lernpfad gespeichert</span></button>
      <button data-m="keys"><b>⌘ Tastenkürzel</b><span>für die iPad-Tastatur</span></button>
      <button data-m="del"><b>🗑 Diesen Lernpfad löschen</b><span>nur in diesem Browser</span></button>
      <button data-m="export" disabled style="opacity:.5"><b>⇩ Export</b><span>HTML für Moodle · SCORM-Lernpaket – folgt</span></button></div>`;
    document.body.appendChild(pop); placePop(e.currentTarget);
    pop.onclick = ev => {
      const m = ev.target.closest('[data-m]')?.dataset.m; if (!m) return; closePop();
      if (m === 'reset') { prog = freshProg(); host.reset?.(); render(); toast('Fortschritt zurückgesetzt'); }
      if (m === 'del') { if (!confirm('„' + (doc.title || 'ohne Titel') + '“ in diesem Browser löschen?')) return; LS.del(DOCKEY(doc.id)); saveDocList(docList().filter(x => x.id !== doc.id)); const next = docList()[0]; openDoc(next ? loadDoc(next.id) : sample()); }
      if (m === 'json') infoDlg('{ } Dokument', `<pre style="margin:0;padding:12px;font:12px/1.4 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-all">${esc(JSON.stringify(doc, (k, v) => typeof v === 'string' && v.length > 200 && /^(data:|[A-Za-z0-9+/=]{200})/.test(v) ? v.slice(0, 40) + '…' : v, 2))}</pre>`);
      if (m === 'keys') infoDlg('⌘ Tastenkürzel', `<div class="ed-form"><table style="border-collapse:collapse;font-size:15px">${[['⌘B / ⌘I', 'fett / kursiv'], ['⌘E', 'Code'], ['⌘K', 'Link'], ['⌘Z / ⇧⌘Z', 'rückgängig / wiederholen'], ['⌘↵', 'neuer Textbaustein darunter'], ['⌥↑ / ⌥↓', 'gewählten Baustein verschieben'], ['⌘P', 'Vorschau ein/aus'], ['/', 'in leerem Text: Bausteinauswahl, weitertippen filtert (z. B. /quiz ↵)'], ['Esc', 'Auswahl aufheben']].map(([k, v]) => `<tr><td style="padding:5px 14px 5px 0;font-weight:700;white-space:nowrap">${k}</td><td>${v}</td></tr>`).join('')}</table></div>`);
    };
  };
  addEventListener('beforeunload', () => { if (pending) commit(); });

  /* ---------- Schnittstelle für Erweiterungen und die App ---------- */
  const ctx = {
    E, esc, plain, uid, ce, toast, imgHtml, xpTag, taskCard, shuffled, findBlock, blockLabel, host,
    get prog() { return prog; }, get doc() { return doc; }, get mode() { return mode; },
    solve: id => solve(id), render: () => render(),
  };
  save(); render(); updUndo();
  return ctx;
}
