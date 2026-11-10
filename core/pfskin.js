/* PathFinder · Originaldesign
 *
 * Bestehende HTML-Lernpfade (z. B. die Lernpfade zu JPad) behalten ihr Aussehen: Farben, Schriften,
 * Bilder, Animationen und eigene Skripte der Seite bleiben, wie sie sind. Die Inhalte werden zu
 * PathFinder-Bausteinen (Text, Infokasten, Aufgabe, Quiz, Code, Bild) und lassen sich bearbeiten.
 * Was in keinen Baustein passt (z. B. ein interaktives Labor), bleibt ein HTML-Baustein.
 *
 * Erwartet wird der Aufbau  <section class="station"> … <div class="station-head"> … <h2> …</section>.
 * Quelltexte und Quizfragen liest PathFinder aus  const SRC = {…}  und  const QUIZ = {…}  im Skript der
 * Seite und schreibt sie beim Export dorthin zurück.
 *
 * doc.skin = { head, htmlAttrs, bodyAttrs, before, after, src, quiz, head0, done }
 *   before/after: HTML vor und nach den Stationen mit Platzhaltern {{pf:title}} usw.
 *   station.skin = { head, cls, unlock, attrs }
 */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SC = '<' + '/script>';

/** JS-Literal hinter  const NAME =  finden (Klammern zählen, Zeichenketten und Kommentare überspringen) */
export function findLiteral(js, name) {
  const m = new RegExp('\\b(?:const|let|var)\\s+' + name + '\\s*=\\s*').exec(js); if (!m) return null;
  const start = m.index + m[0].length; if (js[start] !== '{' && js[start] !== '[') return null;
  let depth = 0;
  for (let i = start; i < js.length; i++) {
    const c = js[i];
    if (c === '"' || c === "'" || c === '`') { i++; while (i < js.length && js[i] !== c) { if (js[i] === '\\') i++; i++; } continue; }
    if (c === '/' && js[i + 1] === '/') { i = js.indexOf('\n', i); if (i < 0) return null; continue; }
    if (c === '/' && js[i + 1] === '*') { i = js.indexOf('*/', i) + 1; if (!i) return null; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { if (--depth === 0) return { start, end: i + 1, text: js.slice(start, i + 1) }; }
  }
  return null;
}

const attrsOf = (el, skip = []) => [...el.attributes].filter(a => !skip.includes(a.name)).map(a => ` ${a.name}${a.value === '' && a.name.startsWith('data-') ? '=""' : `="${esc(a.value)}"`}`).join('');
const isHook = el => el.id || [...el.attributes].some(a => a.name.startsWith('data-') || a.name.startsWith('aria-live')) || el.querySelector('[id], script');
const NOTE_KIND = { rule: 'merke', warn: 'achtung' };
const KIND_CLS = { merke: 'rule', regel: 'rule', begriff: 'rule', achtung: 'warn' };

/** Klassen des Infokastens im Originaldesign */
export const noteCls = b => ['note', KIND_CLS[b.kind] || '', b.extra || ''].filter(Boolean).join(' ');

/**
 * HTML-Seite → PathFinder-Dokument mit Originaldesign (oder null, wenn die Seite keine Stationen hat).
 * opts: { uid, appName, inline(url) → Promise<dataURL|null> } – inline bettet relative Bilder ein.
 */
export async function importHtml(html, { uid, appName = '', inline } = {}) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const own = dom.querySelector('script#pf-doc');
  if (own) { try { return JSON.parse(own.textContent); } catch (e) { } }
  const secs = [...dom.querySelectorAll('section.station')];
  if (!secs.length) return null;

  // Bilder mit relativem Pfad einbetten, damit der Lernpfad auch als einzelne Datei vollständig ist
  if (inline) {
    for (const im of dom.querySelectorAll('img[src]')) {
      const s = im.getAttribute('src'); if (/^(data:|https?:|blob:)/i.test(s)) continue;
      const d = await inline(s); if (d) im.setAttribute('src', d);
    }
  }

  // Skript: Quelltexte und Quizfragen herauslösen
  let src = {}, quiz = {};
  for (const sc of dom.querySelectorAll('script:not([src])')) {
    if (sc.type && !/javascript|module/i.test(sc.type)) continue;
    let js = sc.textContent;
    for (const [name, set] of [['SRC', v => src = v], ['QUIZ', v => quiz = v]]) {
      const lit = findLiteral(js, name); if (!lit) continue;
      try { set(new Function('return (' + lit.text + ')')()); js = js.slice(0, lit.start) + `__PF_${name}__` + js.slice(lit.end); } catch (e) { }
    }
    sc.textContent = js;
  }

  const doc = {
    v: 2, id: uid(), form: 'lernpfad', design: { pal: 0, font: 'schlicht', shape: 'rund', hero: 'logo', heroImg: '' },
    kicker: '', title: '', subtitle: '', goals: [], rank: '', anim: {}, typeLines: [], stations: [],
    cert: { on: false, need: 'immer', pct: 80, text: 'hat den Lernpfad mit folgendem Ergebnis bearbeitet:', show: { zeit: true, tipps: true, quiz: true, xp: true } },
  };

  // Kopf: Kopfzeile, Titel, Untertitel, Lernziele werden zu Feldern des Lernpfads
  const outside = el => el && !el.closest('section.station');
  const h1 = [...dom.body.querySelectorAll('h1')].find(outside);
  const mark = (el, k, val) => { if (!el) return; el.setAttribute('data-pf', k); el.innerHTML = `{{pf:${k}}}`; return val; };
  if (h1) {
    doc.title = h1.textContent.replace(/\s+/g, ' ').trim();
    if (!h1.children.length) mark(h1, 'title');
    const box = h1.parentElement;
    const kick = box.querySelector('.eyebrow, .kicker');
    if (outside(kick)) doc.kicker = mark(kick, 'kicker', kick.innerHTML.trim());
    const lead = box.querySelector('.lead') || (h1.nextElementSibling?.tagName === 'P' ? h1.nextElementSibling : null);
    if (outside(lead)) doc.subtitle = mark(lead, 'subtitle', lead.innerHTML.trim());
    const goals = box.querySelector('ul.goals');
    if (outside(goals)) { doc.goals = [...goals.children].map(li => li.innerHTML.trim()); mark(goals, 'goals'); }
  } else doc.title = dom.title || 'Lernpfad';
  if (!doc.kicker) doc.kicker = appName ? `${appName} · Lernpfad` : 'Lernpfad';
  // Seitentitel mitführen, wenn er den Titel enthält
  const tEl = dom.querySelector('title');
  if (tEl && doc.title && tEl.textContent.includes(doc.title)) tEl.textContent = tEl.textContent.replace(doc.title, '{{pf:title}}');

  // Stationen
  let done = '';
  const nrs = [];
  for (const sec of secs) {
    const head = [...sec.children].find(c => c.classList.contains('station-head'));
    const h2 = (head || sec).querySelector('h2'), small = head?.querySelector('small');
    const badge = head?.querySelector('.badge');
    const st = { id: uid(), title: h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : '', sub: small ? small.textContent.replace(/\s+/g, ' ').trim() : '', check: false, blocks: [], skin: {} };
    if (head) {
      const t = head.cloneNode(true);
      const q = sel => t.querySelector(sel);
      for (const [el, k] of [[q('.badge'), 'nr'], [q('small'), 'sub'], [q('h2'), 'title']]) if (el) { el.setAttribute('data-pf', k); el.innerHTML = `{{pf:${k}}}`; }
      st.skin.head = t.outerHTML;
    }
    const cls = [...sec.classList].filter(c => c !== 'station');
    if (cls.length) st.skin.cls = cls.join(' ');
    const extra = {}; for (const a of sec.attributes) if (!['class', 'id', 'data-station', 'data-unlock'].includes(a.name)) extra[a.name] = a.value;
    if (Object.keys(extra).length) st.skin.attrs = extra;
    if (sec.dataset.unlock) st.skin.unlockNr = sec.dataset.unlock;
    nrs.push(sec.dataset.station || String(nrs.length + 1));
    if (badge && badge.textContent.trim() !== String(doc.stations.length + 1)) st.nr = badge.textContent.trim();
    for (const ch of sec.children) {
      if (ch === head) continue;
      if (ch.classList.contains('done-row')) {
        st.check = true;
        if (!done) { const t = ch.cloneNode(true); t.querySelector('[data-done]')?.setAttribute('data-done', '{{pf:nr}}'); done = t.outerHTML; }
        continue;
      }
      st.blocks.push({ id: uid(), ...toBlock(ch, src, quiz) });
    }
    doc.stations.push(st);
  }
  // Bonus-Stationen: „frei nach Station 10“ als Verweis auf die Station merken (bleibt beim Verschieben richtig)
  for (const st of doc.stations) if (st.skin.unlockNr) { const i = nrs.indexOf(st.skin.unlockNr); if (i >= 0) st.skin.unlock = doc.stations[i].id; delete st.skin.unlockNr; }

  // Seite um die Stationen herum: Platzhalter statt der Stationen
  const first = secs[0];
  first.before(dom.createComment('PF-STATIONEN'));
  secs.forEach(s => s.remove());
  const body = dom.body.innerHTML, at = body.indexOf('<!--PF-STATIONEN-->');
  doc.skin = {
    v: 1,
    head: dom.head.innerHTML,
    htmlAttrs: attrsOf(dom.documentElement),
    bodyAttrs: attrsOf(dom.body),
    before: body.slice(0, at), after: body.slice(at + '<!--PF-STATIONEN-->'.length),
    src, quiz,
    stHead: doc.stations.find(s => s.skin.head && !s.skin.cls)?.skin.head || doc.stations[0]?.skin.head || '<div class="station-head"><div class="badge" data-pf="nr">{{pf:nr}}</div><div><small data-pf="sub">{{pf:sub}}</small><h2 data-pf="title">{{pf:title}}</h2></div></div>',
    done: done || '<div class="done-row"><label class="done"><input type="checkbox" data-done="{{pf:nr}}"> Station erledigt</label></div>',
  };
  // gleiche Kopf-Vorlage nicht in jeder Station speichern
  for (const st of doc.stations) if (st.skin.head === doc.skin.stHead) delete st.skin.head;
  return doc;
}

/** Ein Element einer Station → Baustein */
function toBlock(el, src, quiz) {
  const tag = el.tagName.toLowerCase(), cls = el.getAttribute('class') || '';
  if (el.matches('.code[data-src]') && el.dataset.src in src) {
    return { type: 'code', lang: 'java', code: String(src[el.dataset.src]), skinKey: el.dataset.src, file: el.dataset.file || '', mark: el.dataset.mark || '', nocopy: el.hasAttribute('data-nocopy') };
  }
  if (el.matches('.quiz[data-quiz]') && Array.isArray(quiz[el.dataset.quiz])) {
    return { type: 'quiz', skinKey: el.dataset.quiz, xp: 10, qs: quiz[el.dataset.quiz].map(it => ({ q: it.q || '', opts: (it.o || []).map(([t, ok, fb]) => ({ t: t || '', ok: !!ok, fb: fb || '' })) })) };
  }
  if (isHook(el)) return { type: 'html', html: el.outerHTML };
  if (/^(p|h3|h4|ul|ol)$/.test(tag) && el.attributes.length <= (cls ? 1 : 0)) {
    return { type: 'text', tag, cls, html: el.innerHTML.trim() };
  }
  if (tag === 'div' && el.classList.contains('note') && el.firstElementChild?.classList.contains('note-title') && el.attributes.length === 1) {
    const c = el.cloneNode(true), t = c.firstElementChild; t.remove();
    const kinds = [...el.classList].filter(k => NOTE_KIND[k]);
    return { type: 'info', kind: NOTE_KIND[kinds[0]] || 'tipp', extra: [...el.classList].filter(k => k !== 'note' && !NOTE_KIND[k]).join(' '), title: t.innerHTML.trim(), html: c.innerHTML.trim(), img: '', name: '' };
  }
  if (tag === 'div' && cls === 'task' && el.children.length === 2 && el.children[0].className === 'task-head' && el.children[1].className === 'task-body') {
    return { type: 'task', title: el.children[0].innerHTML.trim(), html: el.children[1].innerHTML.trim(), xp: 20, tips: [], solution: '', img: '' };
  }
  if (tag === 'figure' && el.querySelectorAll('img').length === 1 && el.children.length <= 2 && el.firstElementChild.tagName === 'IMG' && (el.children.length === 1 || el.children[1].tagName === 'FIGCAPTION')) {
    const im = el.firstElementChild;
    return { type: 'image', src: im.getAttribute('src') || '', alt: im.getAttribute('alt') || '', caption: el.children[1]?.innerHTML.trim() || '', size: 'voll', cls, imgAttrs: attrsOf(im, ['src', 'alt']) };
  }
  return { type: 'html', html: el.outerHTML };
}

/* ---------- Seite bauen ---------- */
const fillHolders = (html, map) => html.replace(/\{\{pf:(\w+)\}\}/g, (m, k) => k in map ? map[k] : m);
const dropMarks = html => html.replace(/ data-pf="\w+"/g, '');
export const nrOf = (doc, s) => s.nr || String(doc.stations.indexOf(s) + 1);
export const headMap = doc => ({ title: esc(doc.title), kicker: doc.kicker || '', subtitle: doc.subtitle || '', goals: (doc.goals || []).map(g => `<li>${g}</li>`).join('\n') });
export function stationHead(doc, s, n) { return fillHolders(s.skin?.head || doc.skin.stHead, { nr: esc(s.nr || n), sub: esc(s.sub), title: esc(s.title) }); }
export const doneRow = (doc, n) => fillHolders(doc.skin.done, { nr: String(n) });
const tipsHtml = b => (b.tips || []).map((t, i) => `<details class="reveal"><summary>Tipp${b.tips.length > 1 ? ' ' + (i + 1) : ''}</summary><div class="answer">${t}</div></details>`).join('') + (b.solution ? `<details class="reveal"><summary>Lösung anzeigen</summary><div class="answer">${b.solution}</div></details>` : '');
export const keyOf = b => b.skinKey || 'pf_' + b.id;

/** Baustein im Originaldesign (für Schüler). data: { src, quiz } sammelt Quelltexte und Quizfragen. */
export function blockHtml(b, data) {
  switch (b.type) {
    case 'text': { const tag = /^(p|h3|h4|ul|ol)$/.test(b.tag || '') ? b.tag : 'p'; return `<${tag}${b.cls ? ` class="${esc(b.cls)}"` : ''}>${b.html || ''}</${tag}>`; }
    case 'info': return `<div class="${esc(noteCls(b))}">${b.title ? `<span class="note-title">${b.title}</span>` : ''}${b.html || ''}</div>`;
    case 'task': return `<div class="task">\n<div class="task-head">${b.title || 'Aufgabe'}</div>\n<div class="task-body">${b.img ? `<img class="shot" src="${esc(b.img)}" alt="">` : ''}${b.html || ''}${tipsHtml(b)}</div>\n</div>`;
    case 'code': { const k = keyOf(b); data.src[k] = b.code || ''; return `<div class="code" data-src="${esc(k)}" data-file="${esc(b.file || '')}"${b.mark ? ` data-mark="${esc(b.mark)}"` : ''}${b.nocopy ? ' data-nocopy=""' : ''}></div>`; }
    case 'quiz': { const k = keyOf(b); data.quiz[k] = (b.qs || []).map(q => ({ q: q.q, o: q.opts.map(o => [o.t, !!o.ok, o.fb || (o.ok ? 'Richtig!' : 'Leider nicht – versuch es nochmal.')]) })); return `<div class="quiz" data-quiz="${esc(k)}"></div>`; }
    case 'image': return b.src ? `<figure${b.cls ? ` class="${esc(b.cls)}"` : ''}><img${b.imgAttrs || ' class="shot"'} src="${esc(b.src)}" alt="${esc(b.alt)}">${b.caption ? `\n<figcaption>${b.caption}</figcaption>` : ''}</figure>` : '';
    case 'html': return b.html || '';
    case 'reveal': return `<details class="reveal"><summary>${esc(b.summary)}</summary><div class="answer">${b.html || ''}</div></details>`;
    case 'table': return `<table>${(b.rows || []).map((r, ri) => `<tr>${r.map(c => b.head && !ri ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
    case 'uml': return `<div class="umlwrap"><div class="uml"><div class="uml-head">${esc(b.name)}</div><div class="uml-sec">${(b.attrs || []).map(a => `<div>${esc(a)}</div>`).join('')}</div><div class="uml-sec">${(b.methods || []).map(a => `<div>${esc(a)}</div>`).join('')}</div></div></div>`;
  }
  return b.html ? `<div>${b.html}</div>` : '';
}

/** Die ganze Seite für Schüler, so wie das Original aufgebaut. json: Dokument zum späteren Bearbeiten (oder leer). */
export function pageHtml(doc, { json = '' } = {}) {
  const sk = doc.skin, data = { src: { ...(sk.src || {}) }, quiz: { ...(sk.quiz || {}) } };
  const nrById = {}; doc.stations.forEach((s, i) => nrById[s.id] = i + 1);
  let st = '';
  doc.stations.forEach((s, i) => {
    const n = i + 1;
    let a = ` class="${esc(['station', s.skin?.cls].filter(Boolean).join(' '))}" id="s${n}" data-station="${n}"`;
    if (s.skin?.unlock && nrById[s.skin.unlock]) a += ` data-unlock="${nrById[s.skin.unlock]}"`;
    for (const [k, v] of Object.entries(s.skin?.attrs || {})) a += ` ${k}="${esc(v)}"`;
    st += `<section${a}>\n${dropMarks(stationHead(doc, s, n))}\n`;
    for (const b of s.blocks) { const h = blockHtml(b, data); if (h) st += h + '\n'; }
    if (s.check) st += doneRow(doc, n) + '\n';
    st += `</section>\n\n`;
  });
  const lit = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const after = sk.after.replace('__PF_SRC__', () => lit(data.src)).replace('__PF_QUIZ__', () => lit(data.quiz));
  const head = fillHolders(sk.head, { title: esc(doc.title) });
  return `<!doctype html>\n<html${sk.htmlAttrs}>\n<head>${head}</head>\n<body${sk.bodyAttrs}>${dropMarks(fillHolders(sk.before, headMap(doc)))}${st}${after}`
    + (json ? `\n<script type="application/json" id="pf-doc">${json}${SC}\n` : '')
    + `</body>\n</html>\n`;
}

/* ---------- CSS der Seite auf den Editor begrenzen ---------- */
function splitSel(s) { const out = []; let d = 0, cur = ''; for (const c of s) { if (c === '(' || c === '[') d++; if (c === ')' || c === ']') d--; if (c === ',' && !d) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(x => x.trim()).filter(Boolean); }
function scopeSel(sel, scope) {
  // .blk heißt auch die Hülle der PathFinder-Bausteine (mit data-id) – die Regeln der Vorlage sollen sie nicht treffen
  return splitSel(sel).map(p => p.replace(/\.blk(?![\w-])/g, '.blk:not([data-id])')).map(p => {
    const m = /^(:root|html|body)(?![\w-])\s*/.exec(p);
    if (m) { const rest = p.slice(m[0].length); return !rest ? scope : /^[.:[#]/.test(rest) && !/\s/.test(m[0]) ? scope + rest : scope + ' ' + rest.replace(/^(body)(?![\w-])\s*/, ''); }
    return scope + ' ' + p;
  }).join(', ');
}
function scopeRules(rules, scope) {
  let out = '';
  for (const r of rules) {
    if (r.selectorText != null && r.style) out += `${scopeSel(r.selectorText, scope)} { ${r.style.cssText} }\n`;
    else if (r.cssRules && r.conditionText != null) out += `@${r.constructor.name === 'CSSSupportsRule' ? 'supports' : 'media'} ${r.conditionText} {\n${scopeRules(r.cssRules, scope)}}\n`;
    else if (r.cssRules && r.media) out += `@media ${r.media.mediaText} {\n${scopeRules(r.cssRules, scope)}}\n`;
    else out += r.cssText + '\n';
  }
  return out;
}
/** Stile der Seite (aus <head>) so umschreiben, dass sie nur innerhalb von scope wirken */
export function scopedCss(headHtml, scope) {
  const css = [...headHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  try { const sh = new CSSStyleSheet(); sh.replaceSync(css.replace(/@import[^;]+;/g, '')); return scopeRules(sh.cssRules, scope); }
  catch (e) { return ''; }
}

/** Eingegebenes HTML (Originaldesign) säubern: alles darf bleiben außer Skripten und Editor-Merkmalen */
export function cleanRich(html) {
  const d = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.firstChild;
  d.querySelectorAll('script, style, meta, link').forEach(e => e.remove());
  for (const e of d.querySelectorAll('*')) for (const a of [...e.attributes]) if (/^on/i.test(a.name) || ['contenteditable', 'data-f', 'data-ph', 'data-rich', 'spellcheck'].includes(a.name)) e.removeAttribute(a.name);
  return d.innerHTML.replace(/^(<br>)+/, '').replace(/(<br>)+$/, '').trim();
}

/** Große eingebettete Bilder für das Bearbeiten als Text durch kurze Marken ersetzen (und zurück) */
export function shrinkData(s) { const map = {}; let n = 0; const t = s.replace(/data:[\w+.\/-]+;base64,[A-Za-z0-9+/=]{200,}/g, m => { const k = `[[bild${++n}]]`; map[k] = m; return k; }); return { text: t, back: x => x.replace(/\[\[bild\d+\]\]/g, k => map[k] || k) }; }
