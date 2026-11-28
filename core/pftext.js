/* PathFinder-Text: ein einfaches, lesbares Textformat für Lernpfade.
 * Damit kann eine KI (oder ein Mensch) einen Lernpfad schreiben, ohne PathFinder intern zu kennen.
 *   parseText(text, env)  → { doc, errors, warnings, stats }
 *   docToText(doc, env)   → Text
 *   promptFor(info, env)  → fertige Anleitung für eine KI
 * env: { emptyDoc, palettes, figures, uid, plugins }
 * Läuft komplett im Browser, schickt nichts weg. */

const INFO = { merke: 'merke', tipp: 'tipp', achtung: 'achtung', begriff: 'begriff', regel: 'regel', abschluss: 'abschluss', hinweis: 'tipp', wichtig: 'achtung', definition: 'begriff' };
// Figuren: ohne Zusatz das Kugelwesen Pfadi (Standard), mit „Smiley …“ bzw. „Pixel …“ die anderen Stile
const FIG = { ente: 'ente', pfadi: 'pfadiAha', nachdenken: 'pfadiDenken', denken: 'pfadiDenken', aha: 'pfadiAha', achtung: 'pfadiAchtung', 'pass gut auf': 'pfadiAchtung', 'pass auf': 'pfadiAchtung',
  'smiley nachdenken': 'smileyDenken', 'smiley denken': 'smileyDenken', 'smiley aha': 'smileyAha', 'smiley achtung': 'smileyAchtung', 'smiley pass auf': 'smileyAchtung',
  'pixel nachdenken': 'denken', 'pixel denken': 'denken', 'pixel aha': 'aha', 'pixel achtung': 'achtung', 'pixel pass auf': 'achtung' };
const FIG_NAME = { ente: 'Ente', pfadiAha: 'Aha', pfadiDenken: 'Nachdenken', pfadiAchtung: 'Achtung', smileyAha: 'Smiley Aha', smileyDenken: 'Smiley Nachdenken', smileyAchtung: 'Smiley Achtung', aha: 'Pixel Aha', denken: 'Pixel Nachdenken', achtung: 'Pixel Achtung' };
const FONTS = { pixel: 'pixel', schlicht: 'schlicht', elegant: 'elegant', hand: 'hand', handwriting: 'hand', handschrift: 'hand' };
const norm = s => String(s || '').trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

/* ---------- kleine Formatierung: **fett**, *kursiv*, `Code`, [Link](url), Listen ---------- */
const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** Indizes und Hochzahlen: v_A, v_{End}, m/s^2, 10^{-3} → <sub>/<sup> (nur nach Buchstabe, Ziffer oder Klammer;
 *  ohne Klammern nur ein einzelnes Zeichen – snake_case bleibt also unverändert) */
export function subSup(s) {
  return String(s)
    .replace(/([\p{L}\p{N})\]])_\{([^{}]{1,24})\}/gu, '$1<sub>$2</sub>')
    .replace(/([\p{L}\p{N})])_([\p{L}\p{N}])(?![\p{L}\p{N}])/gu, '$1<sub>$2</sub>')
    .replace(/([\p{L}\p{N})\]])\^\{([^{}]{1,24})\}/gu, '$1<sup>$2</sup>')
    .replace(/([\p{L}\p{N})])\^(-?\p{N}+|\p{L})(?![\p{L}\p{N}])/gu, '$1<sup>$2</sup>');
}
/** Farben, Markierungen, Schriftgrad, Unterstreichen: [Text]{rot}, [Text]{markiert}, [Text]{groß unterstrichen} */
export const FMT_TOK = { rot: 'c-rot', orange: 'c-orange', 'grün': 'c-gruen', gruen: 'c-gruen', blau: 'c-blau', lila: 'c-lila', grau: 'c-grau',
  markiert: 'h-gelb', 'markiert-gelb': 'h-gelb', 'markiert-grün': 'h-gruen', 'markiert-gruen': 'h-gruen', 'markiert-blau': 'h-blau', 'markiert-rosa': 'h-rosa',
  klein: 'fs-klein', 'groß': 'fs-gross', gross: 'fs-gross', 'sehr-groß': 'fs-xgross', 'sehr-gross': 'fs-xgross', unterstrichen: 'u' };
const FMT_NAME = { 'c-rot': 'rot', 'c-orange': 'orange', 'c-gruen': 'grün', 'c-blau': 'blau', 'c-lila': 'lila', 'c-grau': 'grau', 'h-gelb': 'markiert', 'h-gruen': 'markiert-grün', 'h-blau': 'markiert-blau', 'h-rosa': 'markiert-rosa', 'fs-klein': 'klein', 'fs-gross': 'groß', 'fs-xgross': 'sehr-groß' };
const fmtSpan = (txt, toks) => {
  const ks = String(toks).toLowerCase().split(/[\s,]+/).map(t => FMT_TOK[t]).filter(Boolean); if (!ks.length) return null;
  let h = txt; if (ks.includes('u')) h = `<u>${h}</u>`;
  const cl = ks.filter(k => k !== 'u'); return cl.length ? `<span class="${cl.map(k => 'pf-' + k).join(' ')}">${h}</span>` : h;
};
export function inline(s) {
  const codes = []; s = String(s).replace(/`([^`]+)`/g, (m, c) => `\u0000${codes.push(c) - 1}\u0000`);
  const gaps = []; s = s.replace(/\[\[[^\]]*\]\]/g, m => `\u0001${gaps.push(m) - 1}\u0001`);
  const links = []; s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, t, u) => `\u0002${links.push([t, u]) - 1}\u0002`);
  s = subSup(escH(s)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<i>$2</i>')
    .replace(/\[([^\[\]]+)\]\{([^{}]+)\}/g, (m, t, k) => fmtSpan(t, k) ?? m));
  return s.replace(/\u0002(\d+)\u0002/g, (m, i) => `<a href="${escH(links[i][1])}" target="_blank" rel="noopener">${escH(links[i][0])}</a>`)
    .replace(/\u0001(\d+)\u0001/g, (m, i) => escH(gaps[i])).replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${escH(codes[i])}</code>`);
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
    if (t === 'u' || t === 'span') {
      const ks = t === 'u' ? ['unterstrichen'] : [...n.classList].map(c => FMT_NAME[c.replace(/^pf-/, '')]).filter(Boolean);
      let x = inner(); if (!ks.length || !x.trim()) return x;
      const m = x.match(/^\[([^\[\]]+)\]\{([^{}]+)\}$/); if (m) return `[${m[1]}]{${ks.join(' ')} ${m[2]}}`; // verschachtelt → zusammenfassen
      return `[${x}]{${ks.join(' ')}}`;
    }
    if (t === 'sub' || t === 'sup') { const x = inner().trim(), c = t === 'sub' ? '_' : '^'; return x ? (/^[\p{L}\p{N}]$/u.test(x) || (t === 'sup' && /^-?\d+$/.test(x)) ? c + x : c + '{' + x + '}') : ''; }
    if (t === 'a') return `[${inner()}](${n.getAttribute('href') || ''})`;
    if (t === 'br') return '\n';
    if (t === 'ul' || t === 'ol') { let k = 0; return '\n' + [...n.children].map(li => (t === 'ol' ? `${++k}. ` : '- ') + walk(li, ctx).trim()).join('\n') + '\n'; }
    if (t === 'p' || t === 'div') return '\n' + inner().trim() + '\n';
    return inner();
  };
  return [...d.childNodes].map(c => walk(c)).join('').replace(/\n{3,}/g, '\n\n').trim();
}


/* ---------- Bilder und Animationen von der KI ----------
 * SVG kommt als Code (```svg name … ```) – das kann jede KI, auch animiert (SMIL, CSS-@keyframes).
 * Rasterbilder (PNG, GIF, JPG, WebP) nur als data:-Adresse mit Base64. Alles wird geprüft und bereinigt. */
const ANIM = { tippen: 'tippen', schreibmaschine: 'tippen', einblenden: 'einblenden', glitch: 'glitch', leuchten: 'leuchten' };
const MAX_SVG = 400 * 1024, MAX_DATA = 3 * 1024 * 1024;
export function cleanSvg(code) {
  let s = String(code || '').trim();
  if (!/^<svg[\s>]/i.test(s.replace(/^<\?xml[^>]*>\s*/i, ''))) return null;
  s = s.replace(/^<\?xml[^>]*>\s*/i, '')
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '').replace(/<script[^>]*\/>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(xlink:)?href\s*=\s*("|')(?!#|data:image\/)[^"']*\2/gi, '')
    .replace(/url\(\s*(['"]?)(?!#|data:image\/)[^)]*\)/gi, 'none')
    .replace(/@import[^;]*;/gi, '');
  if (!/\sxmlns\s*=/.test(s.slice(0, s.indexOf('>')))) s = s.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return s.length > MAX_SVG ? null : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}
const MAGIC = { png: '\x89PNG', gif: 'GIF8', jpeg: '\xFF\xD8\xFF', jpg: '\xFF\xD8\xFF', webp: 'RIFF' };
/** data:-Adresse prüfen → { src } oder { err } */
export function checkData(url) {
  const m = String(url || '').replace(/\s+/g, '').match(/^data:image\/(png|gif|jpe?g|webp|svg\+xml)(;charset=[\w-]+)?(;base64)?,(.*)$/i);
  if (!m) return { err: 'keine gültige Bildadresse (erlaubt: data:image/png, gif, jpeg, webp oder svg+xml)' };
  if (m[0].length > MAX_DATA) return { err: 'Bild ist zu groß (höchstens etwa 2 MB)' };
  const type = m[1].toLowerCase();
  if (type === 'svg+xml') { let code; try { code = m[3] ? atob(m[4]) : decodeURIComponent(m[4]); } catch (e) { return { err: 'SVG lässt sich nicht lesen' }; } const src = cleanSvg(code); return src ? { src } : { err: 'kein gültiges SVG' }; }
  if (!m[3]) return { err: 'Rasterbilder müssen Base64-codiert sein' };
  let bin; try { bin = atob(m[4]); } catch (e) { return { err: 'Base64 ist beschädigt' }; }
  const mg = MAGIC[type.replace('jpeg', 'jpg')] || MAGIC[type];
  if (mg && !bin.startsWith(mg)) return { err: `die Daten sind kein echtes ${type.toUpperCase()}-Bild (KI hat vermutlich Base64 erfunden)` };
  return { src: m[0] };
}

/** Anhang lesen: Zeilen mit ```svg name … ``` oder name: data:… → { name: src } */
export function readAttachments(lines, warn = () => { }) {
  const att = {}; if (typeof lines === 'string') lines = lines.replace(/\r\n?/g, '\n').split('\n');
  for (let j = 0; j < lines.length; j++) {
    const l = lines[j].trim(); let m;
    if (/^#{1,3}\s/.test(l) || /^(`{3,}|~{3,})\s*(text|markdown|md|txt)?\s*$/i.test(l)) continue;
    if ((m = l.match(/^```\s*svg\s+([\w äöüÄÖÜß.-]+)\s*$/i))) { const code = []; const n0 = j + 1; j++; while (j < lines.length && !/^\s*```\s*$/.test(lines[j])) code.push(lines[j++]); const src = cleanSvg(code.join('\n')); if (src) att[norm(m[1].replace(/\.svg$/i, ''))] = src; else warn(n0, `SVG „${m[1]}“ ist ungültig oder zu groß.`); continue; }
    if ((m = l.match(/^([\w äöüÄÖÜß.-]{1,40}):\s*(<svg[\s\S]*)$/i))) {
      const code = [m[2]], n0 = j + 1; while (!/<\/svg\s*>/i.test(code[code.length - 1]) && j + 1 < lines.length) code.push(lines[++j]);
      const src = cleanSvg(code.join('\n')); if (src) att[norm(m[1].replace(/\.svg$/i, ''))] = src; else warn(n0, `SVG „${m[1]}“ ist ungültig, unvollständig oder zu groß.`); continue;
    }
    if ((m = l.match(/^([\w äöüÄÖÜß.-]{1,40}):\s*(data:\S+)$/i))) { const r = checkData(m[2]); if (r.err) warn(j + 1, `Bild „${m[1]}“: ${r.err}.`); else att[norm(m[1])] = r.src; continue; }
    if (l && !/^%%/.test(l)) warn(j + 1, `Im Anhang nicht verstanden: „${l.slice(0, 40)}“`);
  }
  return att;
}
/** ZIP lesen (gespeichert oder deflate) – nur im Browser, ohne Bibliothek */
export async function unzip(buf) {
  const u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), out = [];
  let e = u.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('kein ZIP');
  let p = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true);
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), fl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u.subarray(p + 46, p + 46 + fl)); p += 46 + fl + xl + cl;
    const start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), raw = u.subarray(start, start + csize);
    if (name.endsWith('/') || /(^|\/)(__MACOSX|\.)/.test(name)) continue;
    let data = raw;
    if (method === 8) data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else if (method !== 0) continue;
    out.push({ name, data });
  }
  return out;
}
const RASTER = { png: 'image/png', gif: 'image/gif', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
function b64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
/** Von der KI gelieferte Dateien (anhang.txt, einzelne .svg/.png/.gif, ZIP) → { att, notes } */
export async function readFiles(files) {
  const att = {}, notes = []; let text = '';
  const one = async (name, bytes) => {
    const base = name.split('/').pop(), ext = (base.split('.').pop() || '').toLowerCase(), key = norm(base.replace(/\.[^.]+$/, ''));
    if (ext === 'zip') { try { for (const f of await unzip(bytes)) await one(f.name, f.data); } catch (e) { notes.push(`${base}: ZIP ließ sich nicht öffnen.`); } return; }
    if (ext === 'svg') { const src = cleanSvg(new TextDecoder().decode(bytes)); if (src) { att[key] = src; notes.push(`✓ ${base} → anhang:${key}`); } else notes.push(`${base}: kein gültiges SVG.`); return; }
    if (RASTER[ext]) { const r = checkData(`data:${RASTER[ext]};base64,${b64(bytes)}`); if (r.src) { att[key] = r.src; notes.push(`✓ ${base} → anhang:${key}`); } else notes.push(`${base}: ${r.err}.`); return; }
    if (['txt', 'md', 'text', 'markdown'].includes(ext)) {
      const t = new TextDecoder().decode(bytes), w = [];
      if (/^\s*(`{3,}\w*\s*)?#\s/.test(t) || /^##\s+station/im.test(t)) { text = t; notes.push(`✓ ${base} → Lernpfad-Text übernommen`); return; }
      const a = readAttachments(t, (n, m) => w.push(`${base} Zeile ${n}: ${m}`));
      Object.assign(att, a); notes.push(...Object.keys(a).map(k => `✓ ${base} → anhang:${k}`), ...w); if (!Object.keys(a).length && !w.length) notes.push(`${base}: keine Bilder gefunden.`); return;
    }
    notes.push(`${base}: Dateityp wird nicht unterstützt.`);
  };
  for (const f of files) await one(f.name, new Uint8Array(await f.arrayBuffer()));
  return { att, notes, text };
}

/** Standard für Tipps und Lösung: Lösung und – ab zwei Tipps – der letzte Tipp sind für Schüler verborgen.
 *  Hat der Text selbst etwas als verborgen markiert, gilt genau diese Angabe. */
export function hideDefaults(b, S) {
  const th = S ? S.hid('tipp') : [], explicit = th.some(Boolean);
  if (explicit) b.tipsHide = th; else if ((b.tips || []).length >= 2) b.tipsHide = b.tips.map((t, i) => i === b.tips.length - 1);
  if (b.solution) b.solHide = true;
  return b;
}

/* ---------- App-Aufgabe (JPad, QPad, FlowPad) ---------- */
const APP_MAIN = { jpad: 'Hauptprogramm', qpad: 'Abfrage', flowpad: 'Programm' };
/** Dateiname zum Startcode: angegeben („```java start Rakete“), sonst Klassenname, sonst Hauptprogramm */
function appFileName(app, given, code, used) {
  let n = String(given || '').trim().replace(/\.(java|sql|txt)$/i, '');
  if (!n && app === 'jpad') n = (String(code).match(/\b(?:class|interface|enum)\s+([A-Za-z_]\w*)/) || [])[1] || '';
  n = (n || APP_MAIN[app] || 'Datei').replace(/[^\wÄÖÜäöüß-]+/g, '');
  let k = n, i = 2; while (used.has(k.toLowerCase())) k = n + i++;
  used.add(k.toLowerCase()); return k;
}
function appSection(app, name) {
  return { n: name, fences: true, keys: ['ausgabe', 'vergleich', 'muss', 'erwartung', 'punkte', 'bild', 'loesung', 'projekt'], make(S, H) {
    const isSol = c => /^(loesung|losung|solution|muster|musterloesung)\b/.test(c.tag), isOut = c => /^(ausgabe|output)\b/.test(c.tag);
    const used = new Set(), files = S.code.filter(c => !isSol(c) && !isOut(c)).map(c => ({ name: appFileName(app, (c.raw || '').replace(/^start\b\s*/i, ''), c.code, used), text: c.code }));
    const outFence = S.code.find(isOut), sols = S.code.filter(isSol);
    const expect = outFence ? outFence.code : (S.one('ausgabe') || '').replace(/\\n/g, '\n');
    const rubric = S.all('erwartung').map(x => { const m = x.match(/^(.*?)\s*\((\d+(?:[.,]\d+)?)\s*(?:P\.?|Punkte?)?\)\s*$/i); return m ? { t: m[1].trim(), p: parseFloat(m[2].replace(',', '.')) } : { t: x.trim(), p: 1 }; }).filter(r => r.t);
    const b = { type: 'app', app, title: S.title, html: H.md(S.body), img: S.one('bild') ? H.img(S.one('bild'), S.line) : '', files, expect,
      compare: /gleich|genau/i.test(S.one('vergleich') || '') ? 'gleich' : 'enthaelt', needs: S.all('muss').map(x => x.trim()).filter(Boolean), rubric,
      solution: sols.map(c => c.code).join('\n\n') || S.one('loesung') || '' };
    if (S.one('projekt')) b.project = S.one('projekt').trim().slice(0, 40);
    if (rubric.length) b.pts = rubric.reduce((a, r) => a + r.p, 0);
    if (!expect && !b.needs.length && !rubric.length) H.warn(S.line, `${name}-Aufgabe „${S.title || ''}“: ohne „Ausgabe:“, „Muss:“ oder „Erwartung:“ wird sie nicht automatisch bewertet – du bewertest sie von Hand.`);
    return b;
  } };
}

/* ---------- Aufbau der Bausteine aus Abschnitten ---------- */
const CORE_SECTIONS = {
  aufgabe: { n: 'Aufgabe', keys: ['antwort', 'tipp', 'loesung', 'xp', 'punkte', 'bild'], make(S, H) {
    const b = { type: 'task', title: S.title, html: H.md(S.body), xp: S.num('xp', 20), tips: S.all('tipp').map(inline), solution: S.one('loesung') ? inline(S.one('loesung')) : '', img: S.one('bild') ? H.img(S.one('bild'), S.line) : '' };
    if (S.one('antwort')) b.answer = S.one('antwort');
    hideDefaults(b, S);
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
  lueckentext: { n: 'Lückentext', keys: ['wortbank', 'extra', 'frei', 'hefteintrag', 'xp', 'punkte'], make(S, H) {
    const html = H.md(S.body); if (!/\[\[[^\]]+\]\]/.test(html)) H.err(S.line, 'Lückentext ohne Lücke – schreibe Lücken als [[Antwort]].');
    // Frei: ja → jede Wahl zählt (z. B. Hypothese); die Wortbank zeigt alle Möglichkeiten aus [[a|b|c]]
    const free = /^(ja|yes|true|an)$/i.test(S.one('frei') || '');
    const bank = free || /^(ja|yes|true|an)$/i.test(S.one('wortbank') || '') || !!S.one('extra');
    const b = { type: 'gap', title: S.title, sub: '', html, bank, extra: (S.one('extra') || '').split(/\s*[,;]\s*/).filter(Boolean), heft: false, xp: S.num('xp', 10) };
    if (free) b.free = true;
    // Hefteintrag: ja | kariert | ohne Linien | Handschrift … – gestaltet wie eine Heftseite, Titel als Überschrift
    const hv = norm(S.one('hefteintrag') || '');
    if (hv && !/^(nein|no|false|aus)$/.test(hv)) {
      b.heft = true;
      if (/kariert/.test(hv)) b.heftBg = 'kariert'; else if (/blanko|ohne|leer|unliniert/.test(hv)) b.heftBg = 'blanko';
      const f = hv.match(/pixel|standard|schlicht|elegant|handschrift|handwriting|hand/); if (f) b.heftFont = { standard: 'schlicht', handschrift: 'hand', handwriting: 'hand' }[f[0]] || f[0];
    }
    return b;
  } },
  zuordnen: { n: 'Zuordnen', keys: ['xp', 'punkte'], make(S, H) {
    const pairs = [];
    for (const [l, n] of S.bodyN) { if (!l.trim()) continue; const m = l.replace(/^\s*[-•]\s*/, '').split(/\s*(?:->|→|=>)\s*/); if (m.length === 2) pairs.push({ a: m[0].trim(), b: m[1].trim() }); else H.warn(n, `Zuordnen: „${l.trim().slice(0, 40)}“ – schreibe Paare als „links -> rechts“.`); }
    if (pairs.length < 2) H.err(S.line, 'Zuordnen braucht mindestens zwei Paare „links -> rechts“.');
    return { type: 'match', title: S.title || 'Ordne zu', pairs, xp: S.num('xp', 10) };
  } },
  freitext: { n: 'Freitext', keys: ['erwartung', 'zeilen', 'punkte', 'bild'], make(S, H) {
    // Erwartung: Teilaspekt (2)  → Teilaspekt mit 2 Punkten; ohne Zahl 1 Punkt
    const rubric = S.all('erwartung').map(x => { const m = x.match(/^(.*?)\s*\((\d+(?:[.,]\d+)?)\s*(?:P\.?|Punkte?)?\)\s*$/i); return m ? { t: m[1].trim(), p: parseFloat(m[2].replace(',', '.')) } : { t: x.trim(), p: 1 }; }).filter(r => r.t);
    const b = { type: 'essay', title: S.title, html: H.md(S.body), img: S.one('bild') ? H.img(S.one('bild'), S.line) : '', lines: Math.max(2, Math.min(30, parseInt(S.one('zeilen')) || 6)), rubric };
    if (rubric.length) b.pts = rubric.reduce((a, r) => a + r.p, 0); else H.warn(S.line, `Freitext „${S.title || ''}“ ohne Erwartungshorizont – schreibe Zeilen „Erwartung: Teilaspekt (Punkte)“.`);
    return b;
  } },
  // Handschriftliche Aufgabe: wie Freitext, die Schüler fotografieren ihre Lösung auf Papier
  handschrift: { n: 'Handschrift', keys: ['erwartung', 'punkte', 'bild', 'loesung'], make(S, H) {
    const b = CORE_SECTIONS.freitext.make(S, H); delete b.lines; b.hand = true;
    const sol = S.all('loesung').join('\n').trim(); if (sol) b.solution = sol; // Musterlösung (Text/LaTeX), mehrere Zeilen „Lösung: …“
    return b;
  } },
  // Befragung (Art: Befragung): Fragen ohne richtig/falsch. Gemeinsame Zeilen: „Hinweis:“ und „Weitergabe: ja“ (Gesprächsbogen)
  skala: { n: 'Skala', keys: ['von', 'bis', 'hinweis', 'weitergabe'], make(S, H) {
    const p = x => { const m = String(x || '').match(/^\s*(-?\d+)\s*(?:[=:–-]\s*(.*))?$/); return m ? [+m[1], (m[2] || '').trim()] : null; };
    const a = p(S.one('von')) || [1, ''], z = p(S.one('bis')) || [10, ''];
    if (z[0] <= a[0]) H.warn(S.line, 'Skala: „Bis“ muss größer sein als „Von“ – 1 bis 10 übernommen.');
    return { type: 'scale', q: svQ(S), min: z[0] > a[0] ? a[0] : 1, max: z[0] > a[0] ? z[0] : 10, lo: a[1], hi: z[1], ...svFlags(S) };
  } },
  auswahl: { n: 'Auswahl', keys: ['hinweis', 'weitergabe'], make: (S, H) => svChoice(S, H, false) },
  mehrfachauswahl: { n: 'Mehrfachauswahl', keys: ['hinweis', 'weitergabe'], make: (S, H) => svChoice(S, H, true) },
  janein: { n: 'Ja/Nein', keys: ['hinweis', 'weitergabe'], make: (S, H) => ({ type: 'choice', q: svQ(S), opts: ['Ja', 'Nein'], multi: false, ...svFlags(S) }) },
  einwilligung: { n: 'Einwilligung', keys: ['hinweis'], make(S, H) { const b = svChoice(S, H, false, ['Ja, das ist okay.', 'Nein, das möchte ich nicht.']); b.consent = true; b.share = false; b.q = b.q || 'Einwilligung zur Weitergabe'; return b; } },
  raster: { n: 'Raster', keys: ['spalten', 'hinweis', 'weitergabe'], make(S, H) {
    const items = S.body.filter(l => /^\s*([-•]|\d+[.)])\s+/.test(l)).map(l => l.replace(/^\s*([-•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
    const cols = S.one('spalten') ? S.one('spalten').split(/\s*[,;|]\s*/).map(x => x.trim()).filter(Boolean) : ['+3', '+2', '+1', '−1', '−2', '−3'];
    if (items.length < 1) H.err(S.line, 'Raster braucht Aussagen als Zeilen „- Aussage“.');
    if (cols.length < 2) H.err(S.line, 'Raster braucht mindestens zwei Spalten, z. B. „Spalten: trifft zu, trifft eher zu, trifft eher nicht zu, trifft nicht zu“.');
    return { type: 'matrix', q: svQ(S), items, cols, ...svFlags(S) };
  } },
  offenefrage: { n: 'Offene Frage', keys: ['zeilen', 'hinweis', 'weitergabe'], make: S => ({ type: 'open', q: svQ(S), rows: Math.max(1, Math.min(20, parseInt(S.one('zeilen')) || 3)), ...svFlags(S) }) },
  datum: { n: 'Datum', keys: ['hinweis', 'weitergabe'], make: S => ({ type: 'datefield', q: svQ(S), ...svFlags(S) }) },
  // Im Text markieren: Zielwörter in {{…}} – Schüler tippen alle passenden Wörter an
  markieren: { n: 'Markieren', keys: ['xp', 'punkte'], make(S, H) {
    const html = H.md(S.body); if (!/\{\{[^}]+\}\}/.test(html)) H.err(S.line, 'Markieren ohne Zielwort – schreibe die richtigen Wörter als {{Wort}}.');
    return { type: 'mark', title: S.title || 'Markiere die passenden Wörter', html, xp: S.num('xp', 10) };
  } },
  // In Gruppen sortieren: je Zeile „Gruppe: Begriff, Begriff“
  sortieren: { n: 'Sortieren', keys: ['xp', 'punkte'], make(S, H) {
    const groups = [];
    for (const [l, n] of S.bodyN) { if (!l.trim()) continue; const m = l.replace(/^\s*[-•]\s*/, '').match(/^([^:]{1,60}):\s*(.+)$/); if (m) groups.push({ name: m[1].trim(), items: m[2].split(/\s*[,;]\s*/).map(x => x.trim()).filter(Boolean) }); else H.warn(n, `Sortieren: „${l.trim().slice(0, 40)}“ – jede Zeile „Gruppe: Begriff, Begriff“.`); }
    if (groups.length < 2) H.err(S.line, 'Sortieren braucht mindestens zwei Gruppen „Gruppe: Begriff, Begriff“.');
    return { type: 'sort', title: S.title || 'Sortiere in die Gruppen', groups, xp: S.num('xp', 10) };
  } },
  // Satzpuzzle: Wörter in richtiger Reihenfolge, getrennt mit „ / “; weitere richtige Reihenfolgen mit „Auch richtig:“
  satzpuzzle: { n: 'Satzpuzzle', keys: ['auch richtig', 'xp', 'punkte'], make(S, H) {
    const cut = l => { l = l.trim(); return (l.includes('/') ? l.split(/\s*\/\s*/) : l.split(/\s+/)).map(x => x.trim()).filter(Boolean); };
    const first = S.body.find(l => l.trim()) || '', items = cut(first), alts = S.all('auch richtig').map(cut).filter(a => a.length);
    if (items.length < 2) H.err(S.line, 'Satzpuzzle braucht mindestens zwei Teile, getrennt mit „ / “.');
    const key = a => a.map(x => x.toLowerCase()).sort().join('\u0001');
    alts.forEach(a => { if (key(a) !== key(items)) H.warn(S.line, `Satzpuzzle: „Auch richtig: ${a.join(' / ')}“ benutzt andere Teile als die Lösung – weggelassen.`); });
    return { type: 'order', words: true, title: S.title || 'Bring die Wörter in die richtige Reihenfolge', items, alts: alts.filter(a => key(a) === key(items)), xp: S.num('xp', 10) };
  } },
  // Reihenfolge (Textpuzzle): je Zeile ein Abschnitt, in der richtigen Reihenfolge
  reihenfolge: { n: 'Reihenfolge', keys: ['xp', 'punkte'], make(S, H) {
    const items = S.body.map(l => l.replace(/^\s*([-•]|\d+[.)])\s*/, '').trim()).filter(Boolean).map(inline);
    if (items.length < 2) H.err(S.line, 'Reihenfolge braucht mindestens zwei Zeilen.');
    return { type: 'order', words: false, title: S.title || 'Bring die Abschnitte in die richtige Reihenfolge', items, alts: [], xp: S.num('xp', 10) };
  } },
  // Programmieren in einer App (nur Prüfungen): ### JPad: Titel – Startcode ```java start Name```, Musterlösung ```java lösung```
  jpad: appSection('jpad', 'JPad'), qpad: appSection('qpad', 'QPad'), flowpad: appSection('flowpad', 'FlowPad'),
  aufdecken: { n: 'Aufdecken', make: (S, H) => ({ type: 'reveal', summary: S.title || 'Mehr erfahren', html: H.md(S.body) }) },
  uml: { n: 'UML', make(S) {
    const L = S.body.map(l => l.replace(/^\s*[-+#~•]\s*/, '').trim()).filter(Boolean);
    return { type: 'uml', name: S.title || 'Klasse', attrs: L.filter(l => !l.includes('(')), methods: L.filter(l => l.includes('(')) };
  } },
  html: { n: 'HTML', make: S => ({ type: 'html', html: S.raw.join('\n') }) },
  // Widget „Experiment“: Hypothese → Experiment (Größen wählen, messen) → Auswertung → Schlussfolgerung
  experiment: { n: 'Experiment', keys: ['frage', 'hypothese', 'groesse', 'ergebnis', 'animation', 'untersuche', 'auswertung', 'extra', 'schlussfolgerung', 'xp', 'punkte'], make: (S, H) => parseExperiment(S, H, S.title) },
  // Widget: ### Widget: Experiment (wie oben) oder ### Widget: HTML mit eigenem ```html … ``` (läuft geschützt in einem Rahmen)
  widget: { n: 'Widget', fences: true, keys: ['frage', 'hypothese', 'groesse', 'ergebnis', 'animation', 'untersuche', 'auswertung', 'extra', 'schlussfolgerung', 'erledigt', 'hoehe', 'xp', 'punkte'], make(S, H) {
    const tm = String(S.title || '').trim().match(/^([^|:–]+?)(?:\s*[|:–]\s*(.*))?$/) || [], kind = (tm[1] || '').trim(), rest = [tm[2] || '']; const k = norm(kind);
    if (k === 'experiment' || k === 'versuch') return parseExperiment(S, H, rest.join(' ').trim());
    if (k === 'html' || k === 'eigenes' || k === 'eigen' || !k) {
      const code = (S.code.find(c => /^html?$/.test(c.lang)) || S.code[0] || {}).code || '';
      if (!code.trim()) H.err(S.line, 'Widget „HTML“ ohne Inhalt – schreibe das HTML in einen Block ```html … ```.');
      const b = { type: 'widget', kind: 'html', title: rest.join(' ').trim(), html: H.md(S.body), code, h: parseInt(S.one('hoehe')) > 0 ? Math.max(80, Math.min(2000, parseInt(S.one('hoehe')))) : 0, xp: S.num('xp', 10) };
      if (/^(ja|yes|true|an)$/i.test(S.one('erledigt') || '')) b.check = true;
      return b;
    }
    H.warn(S.line, `Widget „${kind}“ gibt es nicht – möglich: Experiment, HTML.`); return null;
  } },
};
/** Experiment aus den Zeilen Größe:, Ergebnis:, Hypothese:, Auswertung:, Schlussfolgerung: */
function parseNum(x) { return parseFloat(String(x).replace(/\s/g, '').replace(',', '.')); }
export function parseVar(line) {
  // „Kraft F in N = Isaac 30, Anne 60, Vater 90 | fest“  →  { name, sym, unit, opts: [{ l, v }], fixed }
  const [main, ...flags] = String(line).split(/\s+\|\s*/); const eq = main.indexOf('='); if (eq < 0) return null;
  const head = main.slice(0, eq).trim(), vals = main.slice(eq + 1).trim();
  const hm = head.match(/^(.*?)\s+in\s+(.+)$/i); const nameSym = (hm ? hm[1] : head).trim(), unit = hm ? hm[2].trim() : '';
  const parts = nameSym.split(/\s+/), sym = parts.length > 1 ? parts.pop() : parts[0], name = parts.join(' ') || sym;
  const opts = vals.split(/\s*;\s*|\s*,\s+(?=\D|\d)/).map(x => x.trim()).filter(Boolean).map(x => {
    const m = x.match(/-?\d+(?:[.,]\d+)?/); if (!m) return null;
    const l = x.replace(m[0], '').replace(/[()]/g, '').replace(/\s+/g, ' ').trim(); return { l, v: parseNum(m[0]) };
  }).filter(Boolean);
  const fl = flags.join(' '), fm = fl.match(/fest(?:\s*=?\s*(-?\d+(?:[.,]\d+)?))?/i);
  const v = { name, sym, unit, opts, fixed: !!fm };
  if (fm && fm[1] != null) { const k = opts.findIndex(o => o.v === parseNum(fm[1])); if (k > 0) v.fix = k; }
  return v;
}
/** Rechenvorschrift der Größen (z. B. „F · Δt / m“) → Funktion(werte[]) oder null */
export function expFormula(f, vars) {
  let e = ' ' + String(f || '').replace(/[·×⋅]/g, '*').replace(/:/g, '/').replace(/(\d),(\d)/g, '$1.$2').replace(/\^/g, '**').replace(/²/g, '**2').replace(/³/g, '**3') + ' ';
  const idx = vars.map((v, i) => [v.sym, i]).sort((a, b) => b[0].length - a[0].length);
  for (const [sym, i] of idx) { if (!sym) continue; const q = sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); e = e.replace(new RegExp(`(^|[^\\p{L}\\p{N}_\\]])${q}(?![\\p{L}\\p{N}_])`, 'gu'), `$1 v[${i}] `); }
  if (!/^[\s\d.+\-*/()v\[\]]*$/.test(e) || !e.trim()) return null;
  try { const fn = new Function('v', `"use strict";return (${e});`); const t = fn(vars.map(v => v.opts[0]?.v ?? 1)); return typeof t === 'number' ? fn : null; } catch (er) { return null; }
}
function parseExperiment(S, H, title) {
  const vars = S.all('groesse').map(parseVar);
  vars.forEach((v, k) => { if (!v) H.err(S.line, `Experiment: „Größe: ${S.all('groesse')[k]}“ nicht verstanden – schreibe z. B. „Größe: Kraft F in N = Isaac 30, Anne 60, Vater 90“.`); else if (v.opts.length < 2 && !v.fixed) H.warn(S.line, `Experiment: Größe „${v.name}“ hat weniger als zwei Werte.`); });
  const V = vars.filter(Boolean), er = S.one('ergebnis') || '', em = er.match(/^(.*?)=(.*)$/);
  let res = null;
  if (!em) H.err(S.line, 'Experiment ohne „Ergebnis:“ – schreibe z. B. „Ergebnis: Zusatzgeschwindigkeit Δv in m/s = F · Δt / m“.');
  else { const r = parseVar(em[1] + '= 0') || { name: em[1].trim(), sym: em[1].trim(), unit: '' }; res = { name: r.name, sym: r.sym, unit: r.unit, f: em[2].trim() }; if (!expFormula(res.f, V)) H.err(S.line, `Experiment: Rechenvorschrift „${res.f}“ nicht verstanden – erlaubt sind die Symbole der Größen (${V.map(v => v.sym).join(', ')}), Zahlen, + − · / und Klammern.`); }
  if (!V.some(v => !v.fixed)) H.warn(S.line, 'Experiment: Mindestens eine Größe sollte veränderbar sein (ohne „| fest“).');
  const anim = norm(S.one('animation') || ''), md = L => L.length ? mdToHtml(L) : '';
  let main; const un = (S.one('untersuche') || '').trim();
  if (un) { main = V.findIndex(v => v.sym === un || norm(v.name) === norm(un)); if (main < 0) { H.warn(S.line, `Experiment: „Untersuche: ${un}“ – keine Größe mit diesem Symbol oder Namen.`); main = undefined; } }
  return { ...(main != null ? { main } : {}), type: 'widget', kind: 'experiment', title: inline(S.one('frage') || title || ''), intro: H.md(S.body), hyp: md(S.all('hypothese')), vars: V, res: res || { name: 'Ergebnis', sym: 'y', unit: '', f: '0' },
    anim: /wagen|schieb/.test(anim) ? 'wagen' : '', evalHtml: md(S.all('auswertung')), extra: (S.one('extra') || '').split(/\s*[,;]\s*/).filter(Boolean), concl: md(S.all('schlussfolgerung')), xp: S.num('xp', 30) };
}
const svQ = S => S.title || S.body.filter(l => l.trim() && !/^\s*[-•]/.test(l)).join(' ').trim();
const svYes = v => /^(ja|yes|an|true|x)$/i.test(String(v || '').trim());
const svFlags = S => ({ hint: (S.one('hinweis') || '').trim(), share: svYes(S.one('weitergabe')) });
function svChoice(S, H, multi, def) {
  const opts = S.body.filter(l => /^\s*([-•*]|\[[ x]?\])\s*/.test(l)).map(l => l.replace(/^\s*([-•*]|\[[ x]?\])\s*/, '').trim()).filter(Boolean);
  const text = S.title ? S.body.filter(l => l.trim() && !/^\s*([-•*]|\[[ x]?\])/.test(l)).join(' ').trim() : '';
  if (opts.length < 2 && !def) H.err(S.line, 'Auswahl braucht mindestens zwei Antworten als Zeilen „- Antwort“.');
  return { type: 'choice', q: svQ(S), opts: opts.length >= 2 ? opts : def || opts, multi, ...(text ? { text } : {}), ...svFlags(S) };
}
const SEC_ALIAS = { aufgabe: 'aufgabe', auftrag: 'aufgabe', quiz: 'quiz', test: 'quiz', lueckentext: 'lueckentext', luecken: 'lueckentext', zuordnen: 'zuordnen', zuordnung: 'zuordnen', aufdecken: 'aufdecken', aufklappen: 'aufdecken', 'mehr erfahren': 'aufdecken', uml: 'uml', 'uml-klasse': 'uml', klasse: 'uml', html: 'html', freitext: 'freitext', 'offene aufgabe': 'freitext', essay: 'freitext', handschrift: 'handschrift', 'handschriftliche aufgabe': 'handschrift', foto: 'handschrift',
  markieren: 'markieren', markiere: 'markieren', 'im text markieren': 'markieren', sortieren: 'sortieren', sortiere: 'sortieren', gruppen: 'sortieren', kategorisieren: 'sortieren',
  satzpuzzle: 'satzpuzzle', wortpuzzle: 'satzpuzzle', satzbau: 'satzpuzzle', reihenfolge: 'reihenfolge', textpuzzle: 'reihenfolge', ordnen: 'reihenfolge',
  jpad: 'jpad', 'jpad-aufgabe': 'jpad', qpad: 'qpad', 'qpad-aufgabe': 'qpad', flowpad: 'flowpad', 'flowpad-aufgabe': 'flowpad',
  widget: 'widget', experiment: 'experiment', versuch: 'experiment',
  skala: 'skala', bewertung: 'skala', auswahl: 'auswahl', einfachauswahl: 'auswahl', 'einfache auswahl': 'auswahl', mehrfachauswahl: 'mehrfachauswahl', mehrfach: 'mehrfachauswahl', 'mehrfache auswahl': 'mehrfachauswahl',
  'ja/nein': 'janein', 'ja-nein': 'janein', janein: 'janein', 'ja oder nein': 'janein', einwilligung: 'einwilligung', raster: 'raster', matrix: 'raster',
  'offene frage': 'offenefrage', offen: 'offenefrage', textfeld: 'offenefrage', datum: 'datum' };
/** Bausteine, die als Aufgabe zählen (Punkte, Fortschritt) */
export const CHECK_TYPES = ['task', 'quiz', 'gap', 'match', 'essay', 'mark', 'sort', 'order', 'app'];

export function parseText(src, env) {
  const errors = [], warnings = [];
  const H = { err: (n, m) => errors.push({ n, m }), warn: (n, m) => warnings.push({ n, m }), md: mdToHtml, inline, hideDefaults };
  const att = { ...(env.attachments || {}) }, images = [];
  H.img = (ref, n) => {
    ref = String(ref || '').trim().replace(/^<|>$/g, '');
    let src = '';
    const a = ref.match(/^(?:anhang|bild):\s*(.+)$/i);
    if (a) { src = att[norm(a[1])] || ''; if (!src) { H.warn(n, `Bild „${a[1]}“ fehlt im Anhang.`); return ''; } }
    else if (/^data:/i.test(ref)) { const r = checkData(ref); if (r.err) { H.warn(n, 'Bild weggelassen: ' + r.err + '.'); return ''; } src = r.src; }
    else if (/^https?:/i.test(ref)) { H.warn(n, 'Bilder aus dem Internet werden nicht geladen – bitte selbst einsetzen.'); return ''; }
    else return '';
    images.push({ n, src }); return src;
  };
  const doc = env.emptyDoc('lernpfad'); doc.stations = []; doc.goals = [];
  const SECS = { ...CORE_SECTIONS }, ALIAS = { ...SEC_ALIAS };
  for (const p of env.plugins || []) for (const [k, t] of Object.entries(p.text || {})) { SECS[k] = t; ALIAS[k] = k; for (const a of t.alias || []) ALIAS[norm(a)] = k; }
  let lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  // Antwort der KI steckt oft in einem äußeren ```text … ``` – den entfernen
  { const f = lines.findIndex(l => l.trim()), e = lines.length - 1 - [...lines].reverse().findIndex(l => l.trim());
    const of = f >= 0 && lines[f].trim().match(/^(`{3,}|~{3,})\s*(text|markdown|md|txt|plaintext)?\s*$/i);
    if (of && e > f && lines[e].trim() === of[1]) lines = [...lines.slice(0, f), '', ...lines.slice(f + 1, e), ''];
    else { const g = lines.findIndex(l => /^#\s/.test(l)); if (g > 0) { lines = lines.map((l, k) => k < g ? '' : l); const h = lines.length - 1 - [...lines].reverse().findIndex(l => l.trim()); if (/^(`{3,}|~{3,})\s*$/.test(lines[h]?.trim())) lines[h] = ''; } } }
  // Anhang (## Anhang / ## Bilder): name: data:… oder ```svg name … ``` – wird vorab eingesammelt und aus dem Text genommen
  { const k = lines.findIndex(l => /^##\s+(anhang|anhänge|bilder|material)\s*$/i.test(l.trim()));
    if (k >= 0) {
      Object.assign(att, readAttachments(lines.slice(k + 1), (n, m) => H.warn(n + k + 1, m)));
      lines = lines.slice(0, k);
      // übrig gebliebene Codeblock-Grenzen zwischen Lernpfad und Anhang weg – aber nicht das Ende eines echten Code-Beispiels
      const isF = l => /^(`{3,}|~{3,})[\w-]*$/.test(l.trim());
      for (;;) { const t = lines.length ? lines[lines.length - 1].trim() : null; if (t === '') { lines.pop(); continue; } if (t !== null && /^(`{3,}|~{3,})(text|markdown|md|txt)$/i.test(t)) { lines.pop(); continue; } if (t !== null && isF(t) && lines.filter(isF).length % 2 === 1) { lines.pop(); continue; } break; }
    } }
  Object.assign(att, env.files || {}); // mitgelieferte Dateien haben Vorrang
  let st = null, sec = null, para = [], i = 0, inHead = true, goalsMode = false, pendAnim = '', stepAll = false, pendHide = false;
  const uid = env.uid;
  const station = (n) => { if (!st) { H.warn(n, 'Inhalt vor der ersten Station – eine Station „Start“ wurde angelegt.'); st = { id: uid(), title: 'Start', sub: '', check: false, blocks: [] }; doc.stations.push(st); } return st; };
  const push = (b, n) => { b.id = b.id || uid(); if (pendAnim && (b.type === 'text' || b.type === 'info')) b.anim = pendAnim; pendAnim = ''; if (pendHide) b.hide = true; pendHide = false; station(n).blocks.push(b); };
  const flushPara = () => {
    if (!para.length) return; const n = para[0][1]; const L = para.map(x => x[0]); para = [];
    if (!L.join('').trim()) return;
    // Lücken oder Abschnitts-Angaben im normalen Text: Der Abschnitt wurde vorzeitig beendet (z. B. durch ein Bild)
    if (/\[\[[^\]]+\]\]/.test(L.join('\n'))) H.err(n, 'Lücken [[…]] stehen im normalen Text statt in einem Lückentext. Vermutlich hat ein Bild oder Infokasten den Abschnitt „### Lückentext“ vorzeitig beendet – Bilder gehören vor oder hinter den Abschnitt.');
    else { const k = para0Key(L); if (k) H.err(n, `„${k}:“ steht im normalen Text statt in einem Abschnitt. Vermutlich hat ein Bild oder Infokasten den Abschnitt davor vorzeitig beendet.`); }
    push({ type: 'text', html: mdToHtml(L) }, n);
  };
  const para0Key = L => { for (const l of L) { const m = l.trim().match(/^(Wortbank|Extra|Antwort|Tipp|Lösung|Loesung|XP)\s*(\((?:verborgen|versteckt)\))?:/i); if (m) return m[1]; } return ''; };
  const closeSec = () => {
    if (!sec) return; const S = sec; sec = null;
    const def = SECS[S.kind]; const keys = new Set(def.keys || []);
    const kv = {}, kh = {}; const body = [], bodyN = [];
    for (const [l, n] of S.lines) { const m = l.match(/^\s*([A-Za-zÄÖÜäöüß -]{2,24}?)\s*(\((?:verborgen|versteckt)\))?:\s*(.*)$/i); const k = m && norm(m[1]); if (m && keys.has(k)) { (kv[k] = kv[k] || []).push(m[3].trim()); (kh[k] = kh[k] || []).push(!!m[2]); } else { body.push(l); bodyN.push([l, n]); } }
    while (body.length && !body[body.length - 1].trim()) { body.pop(); bodyN.pop(); }
    const Sx = { title: S.title, line: S.line, body, bodyN, raw: S.lines.map(x => x[0]), table: S.table, code: S.code || [], kv, one: k => (kv[k] || [])[0], all: k => kv[k] || [], hid: k => kh[k] || [], num: (k, d) => { const v = (kv[k] || kv.punkte || [])[0]; return v != null && !isNaN(parseInt(v)) ? parseInt(v) : d; } };
    try { const b = def.make(Sx, H, env); if (b && b.type === 'widget' && doc.form === 'pruefung') { if (b.kind !== 'experiment') { H.warn(S.line, 'Eigene Widgets (HTML) gibt es nur in Lernpfaden und Challenges – in der Prüfung weggelassen.'); return; } if (!kv.punkte) b.pts = 2 + (String(b.evalHtml || '').match(/\[\[(.+?)\]\]/g) || []).length; } if (b) { if (kv.punkte) b.pts = parseFloat(String(kv.punkte[0]).replace(',', '.')) || undefined; push(b, S.line); } } catch (e) { H.err(S.line, `Abschnitt „${S.head}“: ${e.message}`); }
  };
  const KEYRE = /^\s*([A-Za-zÄÖÜäöüß -]{2,24}?)\s*(\((?:verborgen|versteckt)\))?:\s*(.*)$/i;
  const isKeyLine = (S, l) => { const m = l.match(KEYRE); return !!m && (SECS[S.kind].keys || []).includes(norm(m[1])); };
  const GRAMMAR = { quiz: l => /^\?\s*\S|^\[( |x|X|✓)?\]/.test(l), zuordnen: l => /->|→|=>/.test(l), sortieren: l => /^[-•]?\s*[^:]{1,60}:\s*\S/.test(l) };
  const isBoundary = l => /^(#{1,3}\s|!\[|```|-{3,}|\[\s*(merke|tipp|achtung|begriff|regel|abschluss|hinweis|wichtig|definition|figur|überschrift|ueberschrift)\b)/i.test(l);
  function secEnds(S, l, at) {
    if (isKeyLine(S, l)) return false;
    const g = GRAMMAR[S.kind];
    if (g) { if (g(l)) return false; for (let k = at + 1; k < lines.length; k++) { const x = lines[k].trim(); if (isBoundary(x)) break; if (x && g(x)) return false; } return true; }
    if (S.kind === 'html') return !!S.fenced;
    return !!S.sawKey || (!!S.fenced && SECS[S.kind].fences && S.kind === 'widget');
  }
  const lastCheckable = () => { const bl = st ? st.blocks : []; for (let k = bl.length - 1; k >= 0; k--) if (CHECK_TYPES.includes(bl[k].type) || (env.isCheck && env.isCheck(bl[k]))) return bl[k]; return null; };

  for (; i < lines.length; i++) {
    const raw = lines[i], n = i + 1, l = raw.trim();
    // Code-Block ```sprache
    const fence = l.match(/^```\s*([\w+#-]*)(?:\s+[\wäöüÄÖÜß.-]+){0,3}\s*$/);
    if (fence) {
      const code = []; i++; while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
      if (i >= lines.length) H.warn(n, 'Code-Block ohne schließendes ```.');
      if (sec && sec.kind === 'html') { sec.lines.push(...code.map((c, k) => [c, n + k + 1])); sec.fenced = true; continue; }
      // Abschnitte mit eigenen Codeblöcken (z. B. Startcode, Musterlösung) – Zusatz nach der Sprache: ```java start
      if (sec && SECS[sec.kind].fences) { sec.fenced = true; const extra = raw.trim().replace(/^`{3,}\s*[\w+#-]*\s*/, ''); sec.code.push({ lang: (fence[1] || '').toLowerCase(), tag: norm(extra), raw: extra, code: code.join('\n') }); continue; }
      closeSec(); flushPara();
      if (/^svg$/i.test(fence[1])) { const src = cleanSvg(code.join('\n')); if (src) { images.push({ n, src }); push({ type: 'image', src, alt: '', caption: '', size: 'voll' }, n); } else H.warn(n, 'SVG-Grafik ist ungültig oder zu groß – weggelassen.'); continue; }
      push({ type: 'code', lang: (fence[1] || 'text').toLowerCase(), code: code.join('\n'), ...(/\s(ohne-knopf|nocopy)\s*$/i.test(l) ? { nocopy: true } : {}) }, n); continue;
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
    if (inHead && (m = l.match(/^([A-Za-zÄÖÜäöüß -]{3,24}):\s*(.*)$/))) {
      const k = norm(m[1]), v = m[2].trim();
      if (k === 'untertitel') { doc.subtitle = v; continue; }
      if (k === 'art') { doc.form = /challenge/i.test(v) ? 'challenge' : /pr(ü|ue|u)fung|klausur|schulaufgabe|test/i.test(v) ? 'pruefung' : /befragung|umfrage|fragebogen|gespr(ä|ae)chsbogen|reflexion|feedback/i.test(v) ? 'befragung' : 'lernpfad'; if (doc.form === 'befragung') { doc.pointsOn = false; doc.cert.on = false; doc.design.font = 'schlicht'; doc.design.shape = 'eckig'; doc.design.theme = 'lumi'; continue; } if (doc.form === 'pruefung') { doc.pointsOn = true; doc.cert.on = false; } else doc.kicker = doc.kicker.replace(/Lernpfad|Challenge/, doc.form === 'challenge' ? 'Challenge' : 'Lernpfad'); continue; }
      if (k === 'kopfzeile') { doc.kicker = v; continue; }
      if (k === 'aufdecken') { if (/schritt/i.test(v)) stepAll = true; continue; }
      if (k === 'seiten') { if (/station/i.test(v)) doc.pages = 'stationen'; else if (!/^(nein|aus|keine|eine)$/i.test(v.trim())) H.warn(n, 'Seiten: „Stationen“ (jede Station auf einer eigenen Seite) oder weglassen.'); continue; }
      if (k === 'farbe' || k === 'farben') { const p = env.palettes.findIndex(x => norm(x.n) === norm(v)); if (p >= 0) doc.design.pal = p; else H.warn(n, `Farbe „${v}“ gibt es nicht. Möglich: ${env.palettes.map(x => x.n).join(', ')}.`); continue; }
      if (k === 'schrift') { const f = FONTS[norm(v)]; if (f) doc.design.font = f; else H.warn(n, 'Schrift: Pixel, schlicht, elegant oder Handwriting.'); continue; }
      if (k === 'kopfbild') { const src = H.img(v, n); if (src) { doc.design.heroImg = src; doc.design.hero = doc.design.hero === 'logo' ? 'bild' : doc.design.hero; } continue; }
      if (k === 'kopfbild-art' || k === 'kopfbild art') { const a = { klein: 'bild', gross: 'gross', 'groß': 'gross', hintergrund: 'hintergrund', kein: 'keins', keins: 'keins', ohne: 'keins', 'kein bild': 'keins' }[norm(v)] || { gross: 'gross' }[norm(v)]; if (a) doc.design.hero = a; else H.warn(n, 'Kopfbild-Art: klein, groß oder Hintergrund.'); continue; }
      if (k === 'titel-animation' || k === 'untertitel-animation') { const a = ANIM[norm(v)]; if (a) doc.anim[k.startsWith('titel') ? 'title' : 'subtitle'] = a; else H.warn(n, 'Animation: tippen, einblenden, glitch oder leuchten.'); continue; }
      if (k === 'zertifikat') { doc.cert.on = doc.form !== 'pruefung' && doc.form !== 'befragung' && !/^(nein|aus|no|false)$/i.test(v); continue; }
      if (k === 'rang') { doc.rank = inline(v); continue; }
      if (k === 'punkte') { doc.pointsOn = doc.form === 'pruefung' || /^(ja|an|yes|true)$/i.test(v); continue; }
      if (k === 'ziele' || k === 'lernziele') { goalsMode = true; if (v) doc.goals.push(inline(v)); continue; }
    }
    if (inHead && goalsMode && (m = l.match(/^[-•*]\s+(.+)$/))) { doc.goals.push(inline(m[1])); continue; }
    if (st && !sec && !st.blocks.length && !para.length && (m = l.match(/^aufdecken:\s*(.+)$/i))) { if (/schritt/i.test(m[1])) st.step = true; else if (!/^(nein|aus|alles|sofort)$/i.test(m[1].trim())) H.warn(n, 'Aufdecken: „schrittweise“ (nächster Baustein erst, wenn die Aufgabe davor gelöst ist) oder weglassen.'); continue; }
    if (st && !sec && !st.blocks.length && !para.length && (m = l.match(/^animation:\s*(.+)$/i))) { const a = ANIM[norm(m[1])]; if (a) st.anim = a; else H.warn(n, 'Animation: tippen, einblenden, glitch oder leuchten.'); continue; }
    if (/^\{\s*(ausgeblendet|verborgen|versteckt)\s*\}$/i.test(l)) { closeSec(); flushPara(); pendHide = true; continue; } // nächster Baustein für Schüler unsichtbar
    if (!sec && (m = l.match(/^\{\s*(tippen|schreibmaschine|einblenden|glitch|leuchten)\s*\}\s*(.*)$/i))) { flushPara(); pendAnim = ANIM[norm(m[1])]; if (!m[2]) continue; lines[i] = m[2]; i--; continue; }
    if (inHead && l && !st) { if (/^[-•*]\s/.test(l) || /^[A-Za-zÄÖÜäöüß ]{3,20}:/.test(l)) { H.warn(n, `Kopf: „${l.slice(0, 40)}“ nicht erkannt.`); continue; } }
    if ((m = l.match(/^###\s+(.+)$/))) {
      closeSec(); flushPara();
      const [h, ...rest] = m[1].split(':'); const kind = ALIAS[norm(h)];
      if (!kind) { H.warn(n, `Unbekannter Abschnitt „### ${h.trim()}“ – als Text übernommen. Möglich: ${Object.keys(SECS).map(k => SECS[k].n || k).join(', ')}.`); para.push([`**${rest.join(':').trim() || h.trim()}**`, n]); continue; }
      sec = { kind, head: h.trim(), title: rest.join(':').trim(), line: n, lines: [], table: [], code: [] }; continue;
    }
    if (/^-{3,}\s*(n(ä|ae)chste\s+)?seite\s*-{0,}$/i.test(l) || /^\[\s*(n(ä|ae)chste\s+)?seite\s*\]$/i.test(l)) { // Seitenumbruch: ab hier eine neue Seite
      closeSec(); flushPara(); push({ type: 'page' }, n); continue;
    }
    if (/^-{3,}\s*sperre\s*-{0,}$/i.test(l) || /^\[\s*sperre\s*\]$/i.test(l)) {
      closeSec(); flushPara(); const c = lastCheckable();
      if (!c) H.warn(n, 'Sperre ohne Aufgabe davor in dieser Station – weggelassen.'); else push({ type: 'lock', after: c.id }, n); continue;
    }
    if ((m = l.match(/^\[\s*(?:ü|ue|u)berschrift\s*([123])?\s*\]\s*(.*)$/i))) { // Absatzstil des Textbausteins
      closeSec(); flushPara(); if (m[2].trim()) push({ type: 'text', html: inline(m[2].trim()), ps: 'h' + (m[1] || 1) }, n); continue;
    }
    if ((m = l.match(/^\[\s*([^\]:]+?)\s*(?::\s*([^\]]+))?\]\s*(.*)$/)) && (INFO[norm(m[1])] || norm(m[1]) === 'figur')) {
      closeSec(); flushPara();
      const body = [m[3]]; while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,3}\s|\[|```|-{3,})/.test(lines[i + 1].trim())) body.push(lines[++i]);
      if (norm(m[1]) === 'figur' && /^(anhang|bild|data):/i.test((m[2] || '').trim())) {
        const [ref, nm] = m[2].split(/\s*\|\s*/); const src = H.img(ref, n);
        push({ type: 'info', kind: 'figur', title: '', html: mdToHtml(body), img: src, name: (nm || '').trim() }, n);
      } else if (norm(m[1]) === 'figur') {
        const fk = FIG[norm(m[2] || 'aha')]; if (!fk) H.warn(n, `Figur „${m[2]}“ gibt es nicht – Pfadi genommen. Möglich: Nachdenken, Aha, Achtung (davor optional „Smiley“ oder „Pixel“), Ente.`);
        const F = env.figures[fk || 'pfadiAha']; push({ type: 'info', kind: 'figur', title: '', html: mdToHtml(body), img: F.src, name: F.name }, n);
      } else push({ type: 'info', kind: INFO[norm(m[1])], title: m[2] ? m[2].trim() : '', html: mdToHtml(body), img: '', name: '' }, n);
      continue;
    }
    if ((m = l.match(/^!\[([^\]]*)\]\(\s*([^)]*?)\s*\)$/))) {
      closeSec(); flushPara(); const [cap, size] = m[1].split(/\s*\|\s*/); const src = m[2] ? H.img(m[2], n) : '';
      if (!src && !m[2]) H.warn(n, `Bild „${cap || 'ohne Titel'}“: Platzhalter – bitte im Editor ein Bild einsetzen.`);
      push({ type: 'image', src, alt: cap || '', caption: cap || '', size: /klein/i.test(size || '') ? 'klein' : 'voll' }, n); continue;
    }
    if (/^\|.*\|$/.test(l) && !sec) {
      flushPara(); const rows = []; let k = i; let head = false;
      while (k < lines.length && /^\s*\|.*\|\s*$/.test(lines[k])) { const r = lines[k].trim().slice(1, -1).split('|').map(c => c.trim()); if (r.every(c => /^:?-{2,}:?$/.test(c))) head = true; else rows.push(r.map(inline)); k++; }
      i = k - 1; const w = Math.max(...rows.map(r => r.length)); rows.forEach(r => { while (r.length < w) r.push(''); });
      push({ type: 'table', head, rows }, n); continue;
    }
    // Normaler Text nach einer Leerzeile beendet einen Abschnitt, wenn er nicht mehr dazugehören kann
    // (z. B. Text nach einem Quiz oder nach „Wortbank:“, „XP:“ …) – dann geht es mit normalem Text weiter
    if (sec && l && sec.blank && secEnds(sec, l, i)) { closeSec(); i--; continue; }
    if (sec) { sec.blank = !l; if (l && isKeyLine(sec, l)) sec.sawKey = true; if (/^\s*\|.*\|\s*$/.test(raw)) { const r = l.slice(1, -1).split('|').map(c => c.trim()); if (!r.every(c => /^:?-{2,}:?$/.test(c))) sec.table.push(r); } else sec.lines.push([raw, n]); continue; }
    if (!st && !l) continue;
    if (!l) { flushPara(); continue; }
    if (!st && inHead) { doc.subtitle = doc.subtitle || l; continue; }
    para.push([raw, n]);
  }
  closeSec(); flushPara();
  if (!doc.title) H.err(1, 'Titel fehlt – die erste Zeile sollte „# Titel“ sein.');
  if (!doc.stations.length) H.err(1, 'Keine Station gefunden – Stationen beginnen mit „## Station: Titel“.');
  doc.stations.forEach(s => { if (!s.blocks.length) s.blocks.push({ id: uid(), type: 'text', html: '' }); if (stepAll) s.step = true; });
  const all = doc.stations.flatMap(s => s.blocks);
  const stats = { stations: doc.stations.length, blocks: all.length, tasks: all.filter(b => CHECK_TYPES.includes(b.type) || (env.isCheck && env.isCheck(b))).length };
  stats.images = images.length;
  return { doc, errors, warnings, stats, images };
}

/* ---------- Lernpfad → Text (zum Weitergeben an eine KI oder zum Nachlesen) ---------- */
const svOut = b => [...(b.hint ? [`Hinweis: ${b.hint}`] : []), ...(b.share ? ['Weitergabe: ja'] : [])];
export function docToText(doc, env, out = {}) {
  const md = htmlToMd, L = [];
  // Bilder: SVG als Code in den Anhang, Rasterbilder nur als Verweis (die bleiben hier im Editor gespeichert)
  const att = [], bySrc = new Map(); out.attachments = out.attachments || {};
  const ref = (src, base) => {
    if (!src) return '';
    if (bySrc.has(src)) return 'anhang:' + bySrc.get(src);
    const name = base + (att.length + 1); bySrc.set(src, name);
    if (/^data:image\/svg\+xml/i.test(src) && !out.refs) { let code = ''; try { const m = src.match(/^data:image\/svg\+xml(;charset=[\w-]+)?(;base64)?,(.*)$/i); code = m[2] ? atob(m[3]) : decodeURIComponent(m[3]); } catch (e) { } att.push({ name, svg: code }); }
    else { att.push({ name, raster: true }); out.attachments[name] = src; }
    return 'anhang:' + name;
  };
  const plug = {}; for (const p of env.plugins || []) for (const [k, t] of Object.entries(p.text || {})) if (t.type) plug[t.type] = { ...t, key: k };
  L.push(`# ${md(doc.title)}`);
  if (doc.subtitle) L.push(`Untertitel: ${md(doc.subtitle)}`);
  L.push(`Art: ${doc.form === 'challenge' ? 'Challenge' : doc.form === 'pruefung' ? 'Prüfung' : doc.form === 'befragung' ? 'Befragung' : 'Lernpfad'}`);
  if (doc.kicker) L.push(`Kopfzeile: ${md(doc.kicker)}`);
  if (doc.pages === 'stationen') L.push('Seiten: Stationen');
  L.push(`Farbe: ${env.palettes[doc.design.pal]?.n || 'Pastell'}`, `Schrift: ${doc.design.font}`);
  if (doc.goals?.length) { L.push('Ziele:'); doc.goals.forEach(g => L.push('- ' + md(g))); }
  if (doc.rank) L.push(`Rang: ${md(doc.rank)}`);
  if (doc.design.hero === 'keins') L.push('Kopfbild-Art: kein');
  else if (doc.design.heroImg && doc.design.hero !== 'logo') { L.push(`Kopfbild: ${ref(doc.design.heroImg, 'kopf')}`); L.push(`Kopfbild-Art: ${{ bild: 'klein', gross: 'groß', hintergrund: 'Hintergrund' }[doc.design.hero] || 'klein'}`); }
  if (doc.anim?.title) L.push(`Titel-Animation: ${doc.anim.title}`);
  if (doc.anim?.subtitle) L.push(`Untertitel-Animation: ${doc.anim.subtitle}`);
  if (doc.pointsOn && doc.form !== 'pruefung' && doc.form !== 'befragung') L.push('Punkte: ja');
  if (doc.form !== 'pruefung' && doc.form !== 'befragung') L.push(`Zertifikat: ${doc.cert?.on ? 'ja' : 'nein'}`);
  for (const s of doc.stations) {
    L.push('', `## Station: ${md(s.title)}${s.sub ? ' | ' + md(s.sub) : ''}`);
    if (s.anim) L.push(`Animation: ${s.anim}`);
    if (s.step) L.push('Aufdecken: schrittweise');
    for (const b of s.blocks) {
      L.push('');
      if (b.hide) L.push('{ausgeblendet}');
      if (b.anim && (b.type === 'text' || b.type === 'info')) L.push(`{${b.anim}}`);
      const key = Object.entries(env.figures).find(([k, F]) => F.src === b.img)?.[0];
      const figName = FIG_NAME[key] || 'Aha';
      switch (b.type) {
        case 'text': L.push(/^h[123]$/.test(b.ps || '') ? `[Überschrift ${b.ps[1]}] ${md(b.html).replace(/\s*\n+\s*/g, ' ')}` : md(b.html)); break;
        case 'info': L.push(b.kind === 'figur' ? (key || !b.img ? `[Figur: ${figName}] ${md(b.html)}` : `[Figur: ${ref(b.img, 'figur')} | ${b.name || ''}] ${md(b.html)}`) : (K => `[${K}${b.title && md(b.title).toLowerCase() !== K.toLowerCase() ? ': ' + md(b.title) : ''}] ${md(b.html)}`)(b.kind[0].toUpperCase() + b.kind.slice(1))); break;
        case 'image': L.push(`![${b.caption || b.alt || 'Bild'}${b.size === 'klein' ? ' | klein' : ''}](${ref(b.src, 'bild')})`); break;
        case 'table': L.push(...b.rows.map((r, k) => '| ' + r.map(md).join(' | ') + ' |' + (k === 0 && b.head ? '\n|' + r.map(() => ' --- ').join('|') + '|' : ''))); break;
        case 'reveal': L.push(`### Aufdecken: ${md(b.summary)}`, md(b.html)); break;
        case 'code': L.push('```' + (b.lang || '') + (b.nocopy ? ' ohne-knopf' : ''), b.code, '```'); break;
        case 'uml': L.push(`### UML: ${b.name}`, ...b.attrs.map(a => '- ' + a), ...b.methods.map(a => '+ ' + a)); break;
        case 'html': L.push('### HTML', '```html', b.html, '```'); break;
        case 'task': L.push(`### Aufgabe: ${md(b.title)}`, md(b.html)); if (b.answer) L.push(`Antwort: ${b.answer}`); if (b.img) L.push(`Bild: ${ref(b.img, 'bild')}`); (b.tips || []).forEach((t, i) => L.push(`Tipp${b.tipsHide?.[i] ? ' (verborgen)' : ''}: ${md(t)}`)); if (b.solution) L.push(`Lösung${b.solHide ? ' (verborgen)' : ''}: ${md(b.solution).replace(/\n+/g, ' ')}`); if (doc.form !== 'pruefung') L.push(`XP: ${b.xp}`); break;
        case 'essay': L.push(`### ${b.hand ? 'Handschrift' : 'Freitext'}: ${md(b.title)}`, md(b.html)); if (b.img) L.push(`Bild: ${ref(b.img, 'bild')}`); (b.rubric || []).forEach(r => L.push(`Erwartung: ${r.t} (${String(r.p).replace('.', ',')})`)); if (!b.hand && (b.lines || 6) !== 6) L.push(`Zeilen: ${b.lines}`); if (b.hand && b.solution) String(b.solution).split('\n').forEach(z => L.push(`Lösung: ${z}`)); break;
        case 'quiz': L.push('### Quiz'); b.qs.forEach(q => { L.push(`? ${md(q.q)}`); q.opts.forEach(o => L.push(`[${o.ok ? 'x' : ' '}] ${md(o.t)}${o.fb ? ' // ' + md(o.fb) : ''}`)); }); break;
        case 'gap': L.push(`### Lückentext${b.title ? ': ' + md(b.title) : ''}`, md(b.html)); if (b.free) L.push('Frei: ja'); else if (b.bank) L.push('Wortbank: ja'); if (b.heft) L.push('Hefteintrag: ' + ([{ kariert: 'kariert', blanko: 'ohne Linien' }[b.heftBg], { pixel: 'Pixel', schlicht: 'Standard', elegant: 'Elegant', hand: 'Handschrift' }[b.heftFont]].filter(Boolean).join(', ') || 'ja')); if (b.extra?.length) L.push(`Extra: ${b.extra.join(', ')}`); break;
        case 'match': L.push(`### Zuordnen: ${md(b.title)}`, ...b.pairs.map(p => `${p.a} -> ${p.b}`)); break;
        case 'mark': L.push(`### Markieren: ${md(b.title)}`, md(b.html)); break;
        case 'scale': L.push(`### Skala: ${b.q || ''}`, `Von: ${b.min ?? 1}${b.lo ? ' = ' + b.lo : ''}`, `Bis: ${b.max ?? 10}${b.hi ? ' = ' + b.hi : ''}`, ...svOut(b)); break;
        case 'choice': { const yn = !b.consent && !b.multi && (b.opts || []).join('|') === 'Ja|Nein';
          L.push(`### ${b.consent ? 'Einwilligung' : yn ? 'Ja/Nein' : b.multi ? 'Mehrfachauswahl' : 'Auswahl'}: ${b.q || ''}`, ...(b.text ? [b.text] : []), ...(yn ? [] : (b.opts || []).map(o => '- ' + o)), ...svOut(b)); break; }
        case 'matrix': L.push(`### Raster: ${b.q || ''}`, `Spalten: ${(b.cols || []).join(', ')}`, ...(b.items || []).map(x => '- ' + x), ...svOut(b)); break;
        case 'open': L.push(`### Offene Frage: ${b.q || ''}`, ...(+b.rows !== 3 ? [`Zeilen: ${+b.rows || 1}`] : []), ...svOut(b)); break;
        case 'datefield': L.push(`### Datum: ${b.q || ''}`, ...svOut(b)); break;
        case 'sort': L.push(`### Sortieren: ${md(b.title)}`, ...(b.groups || []).map(g => `${g.name}: ${(g.items || []).join(', ')}`)); break;
        case 'order': if (b.words) L.push(`### Satzpuzzle: ${md(b.title)}`, (b.items || []).join(' / '), ...(b.alts || []).map(a => `Auch richtig: ${a.join(' / ')}`));
          else L.push(`### Reihenfolge: ${md(b.title)}`, ...(b.items || []).map(x => '- ' + md(x))); break;
        case 'app': {
          const N = { jpad: 'JPad', qpad: 'QPad', flowpad: 'FlowPad' }[b.app] || 'JPad', lang = { jpad: 'java', qpad: 'sql' }[b.app] || 'text';
          L.push(`### ${N}: ${md(b.title || '')}`, md(b.html || ''));
          if (b.img) L.push(`Bild: ${ref(b.img, 'bild')}`);
          if (b.project) L.push(`Projekt: ${b.project}`);
          if (b.expect && !b.expect.includes('\n')) L.push(`Ausgabe: ${b.expect}`);
          if (b.compare === 'gleich') L.push('Vergleich: gleich');
          (b.needs || []).filter(Boolean).forEach(n => L.push(`Muss: ${n}`));
          (b.rubric || []).forEach(r => L.push(`Erwartung: ${r.t} (${String(r.p).replace('.', ',')})`));
          if (b.expect && b.expect.includes('\n')) L.push('```text ausgabe', b.expect, '```');
          (b.files || []).forEach(f => L.push('```' + lang + ' start ' + f.name, f.text, '```'));
          if (b.solution) L.push('```' + lang + ' lösung', b.solution, '```');
          break;
        }
        case 'widget': L.push(...widgetToText(b, md, doc.form === 'pruefung')); break;
        case 'lock': L.push('--- Sperre ---'); break;
        case 'page': L.push('--- Seite ---'); break;
        case 'file': L.push(`%% Datei „${b.name}“ (nur im Editor)`); break;
        default: { const t = plug[b.type]; L.push(t?.toText ? t.toText(b, { md }) : `%% Baustein „${b.type}“ – im Textformat nicht darstellbar`); }
      }
      // Punkte je Aufgabe (bei Freitext mit Erwartungshorizont ergeben sie sich aus den Teilpunkten)
      if (doc.pointsOn && b.pts != null && (CHECK_TYPES.includes(b.type) || (b.type === 'widget' && b.kind === 'experiment')) && !((b.type === 'essay' || b.type === 'app') && (b.rubric || []).length)) L.push(`Punkte: ${b.pts}`);
    }
  }
  if (att.length) {
    L.push('', '## Anhang');
    for (const a of att) { if (a.svg) L.push('', `${a.name}: ${a.svg.trim()}`); else L.push(`%% ${a.name}: Rasterbild – bleibt im Editor gespeichert, Verweis „anhang:${a.name}“ einfach stehen lassen`); }
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

/** Widget → Textzeilen */
export function varToText(v) {
  const n = x => String(x).replace('.', ',');
  return `${v.name && v.name !== v.sym ? v.name + ' ' : ''}${v.sym}${v.unit ? ' in ' + v.unit : ''} = ${(v.opts || []).map(o => o.l ? (/^\d/.test(o.l) ? `${n(o.v)} (${o.l})` : `${o.l} ${n(o.v)}`) : n(o.v)).join(', ')}${v.fixed ? ' | fest' + (v.fix ? ' = ' + n(v.opts[v.fix]?.v) : '') : ''}`;
}
function widgetToText(b, md, exam) {
  const L = [], lines = h => md(h || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  if (b.kind === 'experiment') {
    L.push('### Widget: Experiment'); if (b.title) L.push(`Frage: ${md(b.title)}`); if (b.intro) L.push(md(b.intro));
    if (b.main != null && b.vars?.[b.main]) L.push(`Untersuche: ${b.vars[b.main].sym}`);
    lines(b.hyp).forEach(x => L.push(`Hypothese: ${x}`));
    (b.vars || []).forEach(v => L.push(`Größe: ${varToText(v)}`));
    if (b.res) L.push(`Ergebnis: ${b.res.name && b.res.name !== b.res.sym ? b.res.name + ' ' : ''}${b.res.sym}${b.res.unit ? ' in ' + b.res.unit : ''} = ${b.res.f}`);
    if (b.anim) L.push(`Animation: ${b.anim === 'wagen' ? 'Wagen' : b.anim}`);
    lines(b.evalHtml).forEach(x => L.push(`Auswertung: ${x}`)); if (b.extra?.length) L.push(`Extra: ${b.extra.join(', ')}`);
    lines(b.concl).forEach(x => L.push(`Schlussfolgerung: ${x}`));
    if (!exam) L.push(`XP: ${b.xp ?? 30}`); return L;
  }
  L.push(`### Widget: HTML${b.title ? ' | ' + md(b.title) : ''}`); if (b.html) L.push(md(b.html));
  if (b.check) L.push('Erledigt: ja'); if (b.h) L.push(`Höhe: ${b.h}`);
  L.push('```html', b.code || '', '```'); return L;
}

/* ---------- Aufgabenstile für digitale Prüfungen (KI-Dialog) ---------- */
// [Schlüssel, Name, Hinweis im Dialog, Anweisung für die KI]
export const EXAM_STYLES = [
  ['quiz', 'Multiple Choice', 'Quiz mit einer richtigen Antwort', '„### Quiz“ – Fragen mit genau einer richtigen Antwort und plausiblen falschen Antworten'],
  ['gapbank', 'Lückentext mit Begriffen', 'Begriffe in Lücken ziehen', '„### Lückentext“ mit „Wortbank: ja“ und zwei bis drei Ablenkern unter „Extra:“'],
  ['gap', 'Lückentext zum Eintippen', 'Schüler tippen die Wörter selbst', '„### Lückentext“ ohne Wortbank (Schüler tippen; eindeutige Fachbegriffe, alle richtigen Schreibweisen mit | angeben)'],
  ['match', 'Zuordnen', 'Paare per Drag & Drop', '„### Zuordnen“ mit vier bis sechs Paaren'],
  ['steps', 'Lösungsschritte mit Drag & Drop', 'z. B. Gleichungssystem: Terme in den Rechenweg ziehen', '„### Lückentext“ mit „Wortbank: ja“: ein Rechenweg (z. B. ein Gleichungssystem mit I und II) Schritt für Schritt, jeder Schritt in einer eigenen Zeile; Terme, Zahlen und Rechenzeichen sind Lücken [[…]], unter „Extra:“ zwei bis drei falsche Bausteine als Ablenker; Malpunkt · statt *, Hochzahlen als ² und ³, negative Zahlen ohne Leerzeichen nach dem Minus; möglichst nur eine Seite einer Gleichung als Lücke (z. B. „3x = [[9]]“) – stehen beide Seiten ganz als Lücken da („[[3x]] = [[9]]“), wird auch die vertauschte Reihenfolge als richtig gewertet'],
  ['short', 'Rechnen / kurze Antwort', 'Ergebnis wird automatisch bewertet', '„### Aufgabe“ mit „Antwort:“ (Zahl ohne Einheit oder ein Wort; mehrere richtige mit | trennen) – die erwartete Einheit steht im Auftrag'],
  ['mark', 'Im Text markieren', 'Wörter antippen, z. B. alle Verben im simple past', '„### Markieren: Arbeitsauftrag“ mit einem kurzen Text; die richtigen Wörter stehen in {{…}} (3–6 Zielwörter; im Text auch ähnliche Wörter, die NICHT markiert werden dürfen)'],
  ['sort', 'In Gruppen sortieren', 'Begriffe in Spalten ziehen', '„### Sortieren“ mit 2–4 Gruppen und je 2–5 eindeutig zuzuordnenden Begriffen (je Zeile „Gruppe: Begriff, Begriff“)'],
  ['puzzle', 'Satzpuzzle', 'Wörter in die richtige Reihenfolge bringen', '„### Satzpuzzle“ – ein Satz in einer Zeile, Teile mit „ / “ getrennt (feste Wendungen wie „to London“ als ein Teil); jede weitere korrekte Wortstellung als Zeile „Auch richtig: …“ mit denselben Teilen; das erste Wort klein schreiben (außer Namen und „I“), ohne Satzzeichen am Ende – PathFinder schreibt den Satzanfang selbst groß'],
  ['textorder', 'Textpuzzle (Reihenfolge)', 'Abschnitte oder Dialogzeilen ordnen', '„### Reihenfolge“ – 4–6 Abschnitte, Sätze oder Dialogzeilen, je Zeile einer, in der richtigen Reihenfolge; die Reihenfolge muss eindeutig sein (Signalwörter, Handlungsablauf)'],
  ['experiment', 'Experiment (Erkenntnisgewinnung)', 'Messreihe planen, messen und auswerten – Naturwissenschaften', '„### Widget: Experiment“ – die Schüler planen und messen selbst: „Frage:“, „Untersuche: <Symbol der untersuchten Größe>“, zwei bis drei „Größe:“-Zeilen mit je 3 Werten OHNE „| fest“ (die faire Messreihe zu planen ist Teil der Leistung), „Ergebnis:“ mit physikalisch richtiger Rechenvorschrift, „Auswertung:“ als Lückentext (Je-desto-Satz, Proportionalität) mit zwei Ablenkern unter „Extra:“; keine „Hypothese:“- und „Schlussfolgerung:“-Zeilen – die Hypothese mit Begründung davor als „### Freitext“, eine Vorhersage danach als „### Aufgabe“ mit „Antwort:“; Punkte: 2 für die Messreihe plus 1 je Auswertungslücke'],
  ['essay', 'Freitext', 'mit Erwartungshorizont, du bewertest', '„### Freitext“ mit Erwartungshorizont aus mehreren Zeilen „Erwartung: … (Punkte)“'],
  ['hand', 'Handschriftliche Aufgabe', 'Lösung auf Papier, Foto als Schwarz-Weiß-Bild, du bewertest', '„### Handschrift: Titel“ – eine kleine Aufgabe, die die Schüler auf Papier lösen (Rechnung, Skizze, Diagramm) und dann fotografieren; Erwartungshorizont aus mehreren Zeilen „Erwartung: … (Punkte)“ und eine Musterlösung in Zeilen „Lösung: …“ (Formeln in LaTeX zwischen $…$); Platz für eine halbe Seite, nicht mehr'],
  ['jpad', 'Programmieren in JPad', 'Java-Programm in JPad schreiben, nur für Informatik', '„### JPad: Titel“ – die Schüler programmieren in JPad (Java): kurzer Auftrag, Startcode als ```java start Klassenname … ``` (optional, je Datei ein Block), „Ausgabe:“ mit der erwarteten Programmausgabe (Teil der Ausgabe genügt) und/oder „Muss:“ für Pflicht-Code (z. B. while); Musterlösung als ```java lösung … ``` (sieht nur die Lehrkraft). Ohne „Erwartung:“-Zeilen wird automatisch nach Ausgabe und Pflicht-Code bewertet; mit „Erwartung: … (Punkte)“ bewertet die Lehrkraft. Java wie in JPad üblich: println() und print() ohne System.out, Wrapper-Typen Integer, Double, Boolean, Character statt int, double, boolean, char'],
];
/**
 * Java in JPad (Dialekt der Online-IDE, Unterrichtskonventionen) – für Programmier-Aufgaben in Lernpfaden (JPad-Lernumgebung)
 * und JPad-Aufgaben in Prüfungen. jg = Jahrgangsstufe (ab 11: zusätzlich public/private mit Gettern und Settern);
 * ohne Jahrgangsstufe stehen beide Stufen im Text.
 */
export function javaRules(jg) {
  const n = +jg || 0, ober = n >= 11, unter = n && n <= 10;
  const vis = ober ? `- Sichtbarkeit (Jahrgangsstufe ab 11): Attribute „private“, Methoden, Konstruktoren und Getter/Setter „public“ (z. B. „public Integer getAlter()“, „public void setAlter(Integer alter)“); Klassen selbst ohne „public“ („class Schaf“). Von außen nur über Getter und Setter zugreifen.`
    : unter ? `- Ohne Sichtbarkeit: „class Schaf“, Attribute „String name;“, Methoden „void maehen()“, Konstruktoren „Schaf(String name)“ – KEIN public, private oder static; Attribute setzt man von außen direkt mit dem Punkt („s1.name = "Dolli";“), keine Getter und Setter.`
    : `- Sichtbarkeit nach Jahrgangsstufe: bis Jahrgangsstufe 10 OHNE public/private (Klassen, Attribute, Methoden, Konstruktoren; Attribute von außen direkt mit dem Punkt setzen, keine Getter/Setter); ab Jahrgangsstufe 11 Attribute „private“, Methoden, Konstruktoren, Getter und Setter „public“, Klassen selbst ohne „public“.`;
  return `JAVA IN JPAD – diese Regeln gelten für den GESAMTEN Java-Code (Startcode, Lösungen, Beispiele, erwartete Ausgaben):
- Nur die Datentypen String, Integer, Double, Boolean und Character – NIE int, double, boolean, char, long oder float. Kommazahlen mit Punkt (4.5).
- Ausgabe mit println(…) bzw. print(…) – NIE System.out.println. Text und Werte mit + verbinden; Leerzeichen stehen in den Anführungszeichen.
- Hauptprogramm: Die Anweisungen stehen direkt in der Datei „Hauptprogramm“ – ohne Klasse, ohne main-Methode, ohne import. Kleine Hilfsmethoden dürfen dort direkt stehen („void begruessen(String name) { … }“).
- Jede Klasse in einer eigenen Datei, die genau wie die Klasse heißt (class Schaf → Datei Schaf); Klassennamen groß, Attribute, Methoden und Variablen klein, deutsche Namen in camelCase; Ja/Nein-Attribute beginnen mit „ist“ (istGeschoren).
${vis}
- Im Konstruktor Attribute mit this setzen („this.name = name;“); bei Vererbung („class Dackel extends Hund“) steht super(…) als erste Zeile des Konstruktors.
- Wiederholungen mit while und einem Integer-Zähler – keine for-Schleife. Hoch- und Runterzählen ausgeschrieben („i = i + 1;“) – kein ++, --, += oder -=.
- Bedingungen mit Vergleichsoperatoren (==, !=, <, <=, >, >=); Boolean-Werte ausgeschrieben vergleichen („if (istStubenrein == true)“).
- Arrays: „Schaf[] herde = new Schaf[5];“, Index ab 0, Länge mit herde.length, Durchlauf mit while.
- Zufall NUR mit der JPad-Bibliothek: Random.randint(von, bis) für ganze Zahlen (beide Grenzen eingeschlossen) und Random.randdouble(von, bis) für Kommazahlen – NIE Math.random() oder new Random().
- Grafik (nur wenn es zum Thema passt): Zeichenfläche 800 × 600; Hintergrund „Sprite himmel = new Sprite(400, 300, SpriteLibrary.Background, 2); himmel.setAsBackgroundImage();“; eigene Figuren als „class Vogel extends Sprite“ mit „super(x, y, SpriteLibrary.Bird, 0);“, Methoden scale(…), move(dx, dy), setImageIndex(…), getCenterX(); Pause mit SystemTools.pause(Millisekunden).
- Einrückung mit 3 Leerzeichen; kurze Kommentare mit //.`;
}
/** vorausgewählte Aufgabenstile (Lösungsschritte nur, wenn das Thema Rechenwege hat) */
export const EXAM_STYLES_DEFAULT = ['quiz', 'gapbank', 'gap', 'match', 'short', 'essay'];

/* ---------- Anleitung für die KI ---------- */
/** Formatbeschreibung; art = 'pruefung' / 'lernpfad' / 'challenge' lässt die Befragungs-Bausteine weg, 'befragung' oder leer nimmt sie auf */
export function formatHelp(env, art) {
  const svHelp = !art || art === 'befragung';
  const extra = (env.plugins || []).flatMap(p => Object.values(p.text || {}).map(t => t.help).filter(Boolean));
  return `FORMAT (PathFinder-Text):
# Titel des Lernpfads
Untertitel: kurze Unterzeile
Art: Lernpfad            (oder: Challenge, Prüfung)
Farbe: ${env.palettes.map(p => p.n).join(' | ')}
Schrift: Pixel | schlicht | elegant | Handwriting
Ziele:
- Lernziel 1
- Lernziel 2
Kopfbild: anhang:logo          (optional, Bild aus dem Anhang)
Kopfbild-Art: klein | groß | Hintergrund | kein
Titel-Animation: tippen | einblenden | glitch | leuchten   (optional, ebenso Untertitel-Animation)
Seiten: Stationen              (optional: jede Station auf einer eigenen Seite mit „Weiter“ und „Zurück“)

Aufdecken: schrittweise        (optional, nicht in Prüfungen: in allen Stationen erscheint der nächste Baustein erst, wenn die Aufgabe davor gelöst ist)

## Station: Titel der Station | kurze Unterzeile
Animation: einblenden          (optional, direkt nach der Stationszeile: Animation des Stationstitels)
Aufdecken: schrittweise        (optional, direkt nach der Stationszeile: nur in dieser Station Schritt für Schritt aufdecken)
Normaler Text. Leerzeile = neuer Absatz. **fett**, *kursiv*, \`Code\`, Listen mit „- “.
Sparsam hervorheben: [Text]{rot} (auch orange, grün, blau, lila, grau), [Text]{markiert} (auch markiert-grün, -blau, -rosa), [Text]{groß} (auch klein, sehr-groß), [Text]{unterstrichen} – kombinierbar: [Text]{rot groß}.
Indizes und Hochzahlen: v_A, v_{End}, m/s^2, 10^{-3}   (ein Zeichen ohne Klammern, mehrere in { })
[Überschrift 1] Zwischenüberschrift   (auch [Überschrift 2] und [Überschrift 3]: kleinere Überschriften innerhalb einer Station)

[Merke] Wichtiger Merksatz.          (auch: [Tipp], [Achtung], [Begriff: Wort], [Regel], [Abschluss])
[Figur: Aha] Eine Figur sagt etwas.  (Figuren: Nachdenken, Aha, Achtung – davor optional „Smiley“ oder „Pixel“ für einen anderen Stil – und Ente)
[Figur: anhang:roboter | Robo] Eigene Figur mit Bild aus dem Anhang und Namen.
{ausgeblendet}           (eigene Zeile vor einem Baustein: Schüler sehen ihn nicht, er zählt nicht)
{tippen} Text mit Animation (vor einem Absatz oder Infokasten: {tippen}, {einblenden}, {glitch}, {leuchten})

![Bildunterschrift](anhang:diagramm)        Bild aus dem Anhang (mit „| klein“ nach der Unterschrift kleiner)

### Aufgabe: Titel
Auftrag für die Schüler.
Antwort: 12,60          (optional: genaue Antwort → wird automatisch geprüft; Zahl oder kurzes Wort)
Tipp: erster Tipp       (beliebig viele Tipp-Zeilen, vom kleinen zum großen Tipp)
Lösung: Musterlösung
Bild: anhang:skizze     (optional: Bild zur Aufgabe)
                        („Tipp (verborgen):“ bzw. „Lösung (verborgen):“ = nur für die Lehrkraft, Schüler sehen sie nicht)
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
Hefteintrag: ja         (optional: gestaltet wie eine Heftseite mit dem Titel als Überschrift – gut für einen Screenshot ins Heft;
                         statt „ja“ auch Hintergrund und Schrift, z. B. „kariert, Handschrift“: liniert | kariert | ohne Linien, Pixel | Standard | Elegant | Handschrift)
Frei: ja                (optional, z. B. für eine Hypothese: jede Wahl zählt; die Wortbank zeigt alle Möglichkeiten aus [[a|b|c]])

### Zuordnen: Ordne zu
Begriff -> Erklärung
Begriff -> Erklärung

### Markieren: Markiere alle Verben im simple past.
Yesterday I {{went}} to the park and {{played}} football. It is sunny today.
                        (die richtigen Wörter in {{…}}; Schüler tippen sie im Text an – mehrere Wörter: {{has been}})

### Sortieren: Sortiere die Wörter.
regular verbs: play, watch, visit
irregular verbs: go, see, buy
                        (je Zeile eine Gruppe „Gruppe: Begriff, Begriff“; Schüler sehen alle Begriffe gemischt)

### Satzpuzzle: Bring die Wörter in die richtige Reihenfolge.
I / have / never / been / to London
Auch richtig: never / have / I / been / to London   (optional: weitere korrekte Reihenfolgen mit denselben Teilen; Satzanfang klein, ohne Schlusspunkt – PathFinder schreibt ihn groß)

### Reihenfolge: Bring die Geschichte in die richtige Reihenfolge.
- Tom woke up early.
- He had breakfast.
- Then he went to school.
                        (je Zeile ein Abschnitt oder eine Dialogzeile, in der richtigen Reihenfolge – Schüler sehen sie gemischt)

### Freitext: Titel       (nur in Prüfungen: offene Antwort, die die Lehrkraft bewertet)
Aufgabenstellung.
Erwartung: erster Teilaspekt der erwarteten Antwort (2)   (Erwartungshorizont, Zahl in Klammern = Punkte)
Erwartung: zweiter Teilaspekt (1)
Zeilen: 6               (optional: Höhe des Antwortfelds)

### Handschrift: Titel     (nur in Prüfungen: Lösung auf Papier – die Schüler fotografieren sie, Probe macht daraus ein Schwarz-Weiß-Bild)
Aufgabenstellung (eine kleine Aufgabe: Rechnung, Skizze, Diagramm).
Erwartung: Teilaspekt (2)   (Erwartungshorizont wie beim Freitext, die Lehrkraft bewertet)
Lösung: $F = m \\cdot a = 2\\,\\text{kg} \\cdot 3\\,\\text{m/s}^2 = 6\\,\\text{N}$   (Musterlösung, auch mehrere Zeilen; Formeln in LaTeX zwischen $…$ – nie in der Prüfung, nur Lehrkraft, Respizienz und Ergebnisseite)

${svHelp ? `BEFRAGUNG (nur mit „Art: Befragung“: Umfrage, Fragebogen, Selbstreflexion, Gesprächsbogen – Fragen ohne richtig oder falsch, ohne Punkte;
jede Station ist ein Abschnitt; Text, Infokästen, Bilder und Tabellen sind erlaubt):
### Skala: Wie wohl fühlst du dich gerade in der Schule?
Von: 1 = gar nicht wohl
Bis: 10 = sehr wohl

### Auswahl: Ich fühle mich in meiner Klasse …      (genau eine Antwort)
- wohl / zugehörig
- teils / teils
- eher allein

### Mehrfachauswahl: Im Moment fällt mir schwer:   (mehrere Antworten möglich)
- Motivation / Anfangen
- Konzentration

### Ja/Nein: Hast du einen festen Lernplatz zu Hause?

### Raster: Wie gut kannst du das schon?            (mehrere Aussagen auf derselben Skala)
Spalten: +3, +2, +1, −1, −2, −3
- Vor einer Gruppe laut vorlesen
- Wichtige Informationen in einem Text finden

### Offene Frage: Was tut dir gut?
Zeilen: 3               (1 = kurze Antwort in einer Zeile)
Hinweis: Du musst nichts aufschreiben, was du lieber im Gespräch erzählst.   (bei jeder Frage möglich)

### Datum: Wir schauen wieder drauf am

### Einwilligung: Weitergabe an die nächste Klassenleitung   (nur im Gesprächsbogen der Lehrkraft)
Darf deine Klassenleitung deine Ziele, Hilfen und Ergebnisse an die nächste Klassenleitung weitergeben?
- Ja, das ist okay.
- Nein, das möchte ich nicht.
Weitergabe: ja          (bei jeder Frage im Gesprächsbogen: diese Antwort darf mit Einwilligung weitergegeben werden)

` : ''}### JPad: Titel         (nur in Prüfungen: Programmieraufgabe, die Schüler in JPad bearbeiten)
Arbeitsauftrag.
Ausgabe: Start in 3 2 1  (optional: was das Programm ausgeben soll; mehrzeilig als \`\`\`text ausgabe … \`\`\`)
Vergleich: enthält | gleich   (Standard: enthält – Leerzeichen und Zeilenumbrüche zählen nicht)
Muss: while              (optional, mehrfach: muss im Code vorkommen)
Erwartung: Teilaspekt (2)   (optional: Erwartungshorizont – dann bewertet die Lehrkraft, die Prüfungen oben sind nur Hinweise)
Projekt: Rakete          (optional: JPad-Aufgaben mit demselben Projekt bauen aufeinander auf – jede startet mit einer Kopie des Codes der Aufgabe davor und wird mit ihrem eigenen Stand bewertet; Startcode nur bei der ersten)
\`\`\`java start Rakete
Startcode (optional, je Datei ein Block; Name nach „start“, sonst Klassenname bzw. Hauptprogramm)
\`\`\`
\`\`\`java lösung
Musterlösung (nur für die Lehrkraft)
\`\`\`
Punkte: 6               (ohne Erwartungshorizont: Punkte × Anteil erfüllter Prüfungen)

Punkte: 2               (in jeder Aufgabe, jedem Quiz, Lückentext, Zuordnen, Markieren, Sortieren, Satzpuzzle, jeder Reihenfolge oder JPad-Aufgabe: Punkte für diese Aufgabe)

### Aufdecken: Mehr erfahren
Text, der erst nach Antippen erscheint.

### Widget: Experiment     (Lernpfad: Schritt für Schritt Hypothese → Experiment → Auswertung → Schlussfolgerung mit Rückmeldung;
                          Prüfung: alles auf einmal ohne Rückmeldung – bewertet werden die Messreihe und die Auswertung, keine Schlussfolgerung)
Frage: Wie hängt Δv von der Kraft ab?
Hypothese: Wenn stärker geschoben wird, dann [[wird Δv größer|wird Δv kleiner|bleibt Δv gleich]].
                        (jede Wahl zählt; die erste Möglichkeit ist das, was die Messung zeigt – sie wird nach dem Messen verglichen)
Größe: Kraft F in N = Isaac 30, Anne 60, Vater 90      (Name, Symbol, Einheit = Werte zum Auswählen, gern mit Namen)
Größe: Masse m in kg = 30 (leer), 60 (1 Sack) | fest   („| fest“: bleibt in dieser Messreihe gleich – faire Messreihe)
Größe: Einwirkungsdauer Δt in s = 1, 2, 3 | fest
Untersuche: F            (optional: Symbol der untersuchten Größe; sonst die erste Größe ohne „| fest“)
Ergebnis: Zusatzgeschwindigkeit Δv in m/s = F · Δt / m   (Rechenvorschrift mit den Symbolen, + − · / und Klammern)
Animation: Wagen        (optional: Wagen wird angeschoben – braucht Größen in N, kg und s; ohne: Messanzeige)
Auswertung: Je größer die Kraft, desto [[größer]] ist Δv.   (Lückentext nach dem Messen, mehrere Zeilen möglich)
Extra: kleiner, halb    (Ablenker für die Auswertung)
Schlussfolgerung: Δv ist proportional zur Kraft.   (erscheint am Ende als Merksatz)
XP: 30

### Widget: HTML | Titel    (nicht in Prüfungen; eigene kleine Web-App, läuft geschützt in einem Rahmen und passt ihre Höhe selbst an)
Erledigt: ja            (optional: zählt als Aufgabe – das HTML ruft pfDone() auf, wenn die Schüler fertig sind)
\`\`\`html
<button onclick="pfDone()">Fertig</button>
\`\`\`

### UML: Klassenname
- attribut: Typ
+ methode()

\`\`\`java
Programmcode (Sprache nach den drei Backticks)
\`\`\`
(\`\`\`java ohne-knopf: Code nur zum Anschauen, ohne Knopf zum Übernehmen – z. B. wenn er schon im Projekt steht oder eine Aufgabe verraten würde)

| Kopf | Kopf |
| --- | --- |
| Zelle | Zelle |

--- Sperre ---          (alles danach in der Station erst frei, wenn die Aufgabe davor gelöst ist)
--- Seite ---           (Seitenumbruch: ab hier eine neue Seite mit „Weiter“ und „Zurück“; Kopf und Stationstitel stehen auf jeder Seite)

## Anhang               (immer ganz am Ende, im selben Textblock: Bilder, auf die oben mit anhang:name verwiesen wird)
diagramm: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160">
  …  (SVG darf über mehrere Zeilen gehen, endet mit </svg>)
</svg>
foto: data:image/png;base64,iVBORw0KGgo…
${extra.length ? '\nZUSÄTZLICH IN DIESER APP:\n' + extra.join('\n\n') + '\n' : ''}${env.appRules ? '\n' + env.appRules.replace(/\s*$/, '\n') : ''}`;
}
export function promptFor(info, env) {
  const f = (k, d) => (info[k] || '').trim() || d;
  const ch = info.art === 'challenge', ex = info.art === 'pruefung', mix = info.mix || [40, 40, 20];
  const sv = info.art === 'befragung';
  const appR = !ex && !sv ? (info.appRules || env.appRules || '') : ''; // Lernpfad/Challenge zu einer App (Probe): Regeln und Ereignisse der App
  const app = env.appName && env.appName !== 'PathFinder' ? ` (App: ${env.appName})` : '';
  const intro = sv
    ? `Du erstellst eine BEFRAGUNG (Umfrage, Fragebogen oder Selbstreflexion) für die Plattform PathFinder${app}. Die Teilnehmenden füllen sie am iPad aus; es gibt kein richtig oder falsch und keine Punkte. Ausgewertet wird nach Abschluss als Statistik je Frage.`
    : ex
    ? `Du erstellst eine DIGITALE PRÜFUNG (Leistungsnachweis) für die Plattform PathFinder${app}. Die Schüler bearbeiten sie am iPad ohne Rückmeldung; bewertet wird erst nach der Abgabe – geschlossene Aufgaben automatisch, Freitexte von der Lehrkraft.`
    : ch
    ? `Du erstellst eine CHALLENGE (Übungsaufgaben) für die Plattform PathFinder${app}. Eine Challenge bringt nichts Neues bei: Sie greift auf das Vorwissen der Schüler zurück und lässt sie es an abwechslungsreichen Aufgaben anwenden, üben und vertiefen.`
    : `Du erstellst einen interaktiven LERNPFAD FÜR NEUES WISSEN für die Plattform PathFinder${app}. Der Lernpfad führt die Schüler Schritt für Schritt an ein neues Thema heran und festigt das Gelernte direkt mit Quiz, Aufgaben, Lückentexten und Zuordnungen.`;
  const artRules = sv
    ? `- Schreibe im Kopf die Zeile „Art: Befragung“.
- Verwende NUR die Befragungs-Bausteine Skala, Auswahl, Mehrfachauswahl, Ja/Nein, Raster, Offene Frage und Datum – KEINE Aufgaben, Quiz, Lückentexte, Punkte, Tipps oder Lösungen.
- Gliedere in wenige Stationen als Themenabschnitte (z. B. „## Station: Wie geht es mir?“); vor einer Station höchstens ein kurzer Satz zur Einordnung.
- Formuliere neutral, kurz und altersgerecht; keine Suggestivfragen, keine doppelten Verneinungen, je Frage nur ein Gedanke.
- Bevorzuge geschlossene Fragen (Skala, Auswahl, Raster) – sie lassen sich auswerten. Offene Fragen sparsam und freiwillig („Du musst nichts aufschreiben …“ als Hinweis).
- Antwortmöglichkeiten einer Auswahl decken alle Fälle ab und überschneiden sich nicht; bei Bedarf „weiß nicht“ oder „Sonstiges“.
- Keine Fragen, die Gesundheit, Familie oder andere sehr persönliche Dinge direkt abfragen, außer die Lehrkraft verlangt es ausdrücklich.
`
    : ex
    ? `- Schreibe im Kopf die Zeile „Art: Prüfung“.
- KEINE Erklärungen, Merkkästen, Figuren, Tipps, Lösungen zum Aufdecken oder Sperren – nur kurze Arbeitsanweisungen, Material (Texte, Tabellen, Abbildungen) und Aufgaben.
- Gliedere die Prüfung in Stationen als Teilaufgaben oder Themenblöcke (z. B. „## Station: Teil A | Grundwissen“).
- Gib JEDER Aufgabe (Aufgabe, Quiz, Lückentext, Zuordnen, Markieren, Sortieren, Satzpuzzle, Reihenfolge, Freitext, Handschrift, JPad) eine Zeile „Punkte: n“. Die Punkte spiegeln den Aufwand; ein Quiz bekommt etwa 1 Punkt je Frage, ein Lückentext etwa 1 Punkt je Lücke oder je zwei Lücken, Markieren und Sortieren etwa 1 Punkt je zwei Wörter bzw. Begriffe, ein Satzpuzzle 1–2 Punkte.
${!info.types?.length || info.types.includes('short') ? `- Rechenaufgaben mit eindeutigem Ergebnis als „### Aufgabe“ mit „Antwort:“ (Zahl, ohne Einheit, mehrere richtige mit | trennen) – sie werden automatisch bewertet. Schreibe die erwartete Einheit in den Auftrag.` : ''}
${!info.types?.length || info.types.includes('essay') ? `- Offene Aufgaben (erklären, begründen, beschreiben, beurteilen) als „### Freitext“ mit Erwartungshorizont: mehrere Zeilen „Erwartung: … (Punkte)“; die Summe ergibt die Punkte der Aufgabe.` : ''}
${info.ask ? `- AUFGABENARTEN – verwende die Arten, die die Lehrkraft gewählt hat, und zwar JEDE mindestens einmal; ohne Vorgabe eine abwechslungsreiche, zum Thema passende Auswahl (Lösungsschritte nur bei Rechenwegen):
${EXAM_STYLES.map(s => `  • ${s[1]}: ${s[3]}`).join('\n')}
` : ''}${info.types?.length ? `- AUFGABENSTILE – verwende AUSSCHLIESSLICH diese Aufgabenarten, und zwar JEDE mindestens einmal (sinnvoll auf die Prüfung verteilt):
${EXAM_STYLES.filter(s => info.types.includes(s[0])).map(s => `  • ${s[1]}: ${s[3]}`).join('\n')}
` : ''}- Anforderungsbereiche: ${info.ask ? 'wie von der Lehrkraft angegeben, sonst ' : ''}etwa ${mix[0]} % der Punkte Reproduktion (AFB I), ${mix[1]} % Anwendung und Transfer (AFB II), ${mix[2]} % Problemlösen und Beurteilen (AFB III); von leicht nach schwer.
${info.types?.includes('jpad') || (!info.types?.length && (info.ask || /informatik/i.test(info.fach || ''))) ? `- ${info.types?.includes('jpad') ? '' : 'Nur für JPad-Aufgaben (Informatik): '}${javaRules(info.ask ? 0 : info.jg).replace(/\n/g, '\n  ')}
` : ''}${!info.types?.length || info.types.includes('quiz') ? `- Quizfragen mit genau einer richtigen Antwort und plausiblen falschen Antworten; Rückmeldungen nach // sind nicht nötig.` : ''}
${!info.types?.length || info.types.includes('gap') ? `- Lückentexte ohne Wortbank werden tolerant bewertet (Groß/Klein egal); mehrdeutige Lücken vermeiden oder alle richtigen Antworten mit | angeben.` : ''}
`
    : ch
    ? `- Schreibe im Kopf die Zeile „Art: Challenge“ und „Punkte: ja“.
- KEINE neuen Inhalte erklären. Höchstens ein kurzer [Merke]-Kasten pro Station zur Erinnerung an Bekanntes; der Schwerpunkt liegt ganz auf Aufgaben, Quiz, Lückentexten und Zuordnungen.
- Schwierigkeitsmischung der Aufgaben: etwa ${mix[0]} % Grundlagen, ${mix[1]} % Fortgeschritten, ${mix[2]} % Experte. Ordne die Stationen von leicht nach schwer (z. B. „Station: Grundlagen“, „Station: Fortgeschritten“, „Station: Experte“; Stufen mit 0 % weglassen).
- Schreibe die Stufe in den Titel jeder Aufgabe (z. B. „### Aufgabe: Grundlagen – …“) und vergib XP nach Stufe: Grundlagen 10, Fortgeschritten 20, Experte 30.
- Grundlagen = direkte Anwendung des Gelernten; Fortgeschritten = Transfer, mehrere Schritte; Experte = offene, knifflige Probleme oder neue Zusammenhänge.
- Tipps erinnern an das nötige Vorwissen, statt es neu zu erklären.
${info.types?.length ? `- AUFGABENSTILE – verwende ${appR ? 'neben den App-Aufgaben (Pflicht, siehe unten) nur' : 'AUSSCHLIESSLICH'} diese Aufgabenarten (dazu höchstens kurze Merkkästen), und zwar JEDE mindestens einmal, sinnvoll auf die Stufen verteilt:
${EXAM_STYLES.filter(s => s[0] !== 'essay' && s[0] !== 'jpad' && info.types.includes(s[0])).map(s => `  • ${s[1]}: ${s[3]}`).join('\n')}
` : ''}${info.jpad ? `- JPAD-CHALLENGE: Die Challenge steht in JPad direkt neben dem Code-Editor; die Schüler programmieren dort in Java (Dialekt der Online-IDE). Jede Stufe enthält mindestens eine „### Programmier-Aufgabe“ (Format siehe unten) mit „Ausgabe:“ und/oder „Muss:“, damit JPad die Lösung selbst prüft; Startcode als \`\`\`java start-Block, wo sinnvoll. Ergänzend Quiz und Lückentexte (z. B. Was gibt dieses Programm aus?).
${javaRules(info.jg)}
` : ''}${appR ? `- APP-AUFGABEN SIND PFLICHT: Jede Stufe enthält mindestens eine „### App-Aufgabe“, in der die Schüler in der App links etwas tun; die Challenge lebt von der App. Fragen ohne App nur ergänzend.
${appR.replace(/\s*$/, '\n')}` : ''}`
    : `- Schreibe im Kopf die Zeile „Art: Lernpfad“.
- Jede Station: kurzer Einstieg, dann Erklärung des Neuen (mit Beispiel, gern einem Schaubild), dann mindestens eine Übung (Aufgabe, Quiz, Lückentext oder Zuordnen), die das Neue sofort festigt.
- Von einfach zu schwer; jede Station baut auf der vorigen auf. Eine abschließende Station wiederholt das Wichtigste.
${info.jpad ? `- JPAD-LERNUMGEBUNG: Der Lernpfad steht in JPad direkt neben dem Code-Editor; die Schüler programmieren dort in Java (Dialekt der Online-IDE: Anweisungen des Hauptprogramms stehen ohne Klasse und ohne main-Methode direkt im Hauptprogramm, Ausgabe mit println(…); eigene Klassen jeweils als eigene Datei).
- Gib JEDER Station mindestens eine „### Programmier-Aufgabe“ (Format siehe unten) mit „Ausgabe:“ und/oder „Muss:“, damit JPad die Lösung nach dem Programmlauf selbst prüfen kann; Startcode als \`\`\`java start-Block, wenn die Schüler nicht bei null beginnen sollen.
- Code, den die Schüler übernehmen sollen (z. B. eine fertige Klasse), als \`\`\`java-Codeblock – er bekommt in JPad den Knopf „In JPad übernehmen“. Reine Anschauungsbeispiele als \`\`\`java ohne-knopf.
- Ergänze die Programmier-Aufgaben durch Quiz und Lückentexte zum Verständnis (z. B. Was gibt dieses Programm aus?).
${javaRules(info.jg)}
` : ''}${appR ? `- APP-AUFGABEN SIND PFLICHT: Jede Station enthält mindestens eine „### App-Aufgabe“, in der die Schüler in der App links etwas tun.
${appR.replace(/\s*$/, '\n')}` : ''}`;
  // Arbeitsmaterial der Lehrkraft (Arbeitsblätter, Hefteinträge …): direkt angehängt (API) oder für eine externe KI angekündigt
  const mat = info.material || {}, was = sv ? 'die Befragung' : ex ? 'die Prüfung' : ch ? 'die Challenge' : 'der Lernpfad';
  const matTop = mat.extern ? `ZUERST – ARBEITSMATERIAL DER LEHRKRAFT
Die Lehrkraft gibt dir zusätzlich eigenes Arbeitsmaterial mit (z. B. Arbeitsblätter, Hefteinträge, Folien, Fotos von Tafelbildern) – als angehängte Dateien, Bilder oder eingefügten Text. ${was[0].toUpperCase() + was.slice(1)} soll auf diesem Material aufbauen.
- Prüfe, BEVOR du irgendetwas erstellst, ob dieses Material in der Nachricht enthalten ist.
- Fehlt es: Erstelle NOCH NICHTS. Antworte nur mit einer kurzen Bitte, das Arbeitsmaterial hochzuladen oder einzufügen, und warte auf die Antwort der Lehrkraft. (Diese Rückfrage ist die einzige Ausnahme von der Regel, nur mit einem Codeblock zu antworten.)
- Liegt es vor: Lies es vollständig und lege es zugrunde (siehe ARBEITSMATERIAL weiter unten). Dann erstellst du ${was} wie beschrieben.

` : '';
  const matRule = sv ? 'Beziehe die Fragen auf Inhalte, Methoden und Begriffe dieses Materials (z. B. die Unterrichtseinheit, zu der befragt wird); ein mitgeschickter bisheriger Fragebogen dient als Vorlage, die du verbessern darfst.'
    : ex ? 'Prüfe genau die Inhalte, Fachbegriffe, Darstellungen, Beispiele und das Niveau dieses Materials. Formuliere neue Aufgaben, statt Aufgaben aus dem Material wörtlich zu übernehmen (außer die Lehrkraft wünscht es ausdrücklich), und prüfe nichts, was weder im Material noch im Lehrplanbezug vorkommt.'
    : ch ? 'Übe genau die Inhalte, Fachbegriffe und Verfahren aus diesem Material, im Niveau passend dazu; Aufgaben aus dem Material nicht wörtlich kopieren, sondern abwandeln und erweitern.'
    : 'Baue auf Inhalt, Fachbegriffen, Beispielen und Darstellungen dieses Materials auf, damit Lernpfad und Unterricht zusammenpassen; übernimm Merksätze sinngemäß.';
  const matBody = mat.files?.length ? `ARBEITSMATERIAL DER LEHRKRAFT: ${mat.files.length === 1 ? 'Die angehängte Datei' : `Die ${mat.files.length} angehängten Dateien`} (${mat.files.map(n => `„${n}“`).join(', ')}) ${mat.files.length === 1 ? 'ist' : 'sind'} die Grundlage. ${matRule}
`
    : mat.extern ? `ARBEITSMATERIAL DER LEHRKRAFT: das mitgeschickte Material (siehe ganz oben) ist die Grundlage. ${matRule}
` : '';
  const askTop = info.ask ? `ZUERST – RÜCKFRAGE AN DIE LEHRKRAFT
Erstelle NOCH NICHTS. Frage die Lehrkraft zuerst in EINER kurzen, übersichtlichen Nachricht nach allem, was sie nicht schon geschrieben hat:
1. Fach, Jahrgangsstufe und Schulart
2. Thema bzw. Lernbereich (gern mit Lehrplanbezug) und welche Inhalte geprüft werden sollen
3. Bearbeitungszeit in Minuten
4. gewünschte Aufgabenarten – biete die Liste unter AUFGABENARTEN (weiter unten) zur Auswahl an – und den Anteil der Anforderungsbereiche (Vorschlag: 40 % AFB I, 40 % AFB II, 20 % AFB III)
5. ob sie Arbeitsmaterial mitgibt (Arbeitsblätter, Hefteinträge, Fotos vom Tafelbild) – dann soll sie es jetzt hochladen oder einfügen
Warte auf die Antwort. Diese Rückfrage ist die einzige Ausnahme von der Regel, nur mit einem Codeblock zu antworten. Danach erstellst du die Prüfung genau nach diesen Angaben; liegt Arbeitsmaterial vor, baut sie darauf auf. ${matRule}

` : '';
  return `${askTop}${matTop}${intro}

${info.ask ? `THEMA, FACH, ZIELGRUPPE, UMFANG: laut Antwort der Lehrkraft auf deine Rückfrage
` : `THEMA: ${f('thema', info.basisTitle ? `Inhalte des Lernpfads „${info.basisTitle}“` : '[bitte Thema eintragen]')}
${info.fach?.trim() ? 'FACH: ' + info.fach.trim() + '\n' : ''}ZIELGRUPPE: ${f('klasse', '[Jahrgangsstufe / Schulart]')}
UMFANG: ${f('umfang', 'etwa 4 Stationen, ca. 45 Minuten')}
`}${sv && info.titel?.trim() ? 'TITEL DER BEFRAGUNG (genau so als „# Titel“ verwenden): ' + info.titel.trim() + '\n' : ''}${info.lehrplan ? 'LEHRPLANBEZUG: ' + info.lehrplan + '\n' : ''}${info.inhalte?.length ? 'ZU BEHANDELNDE LEHRPLANINHALTE: ' + info.inhalte.join('; ') + '\n' : info.lehrplan && info.alleInhalte?.length ? 'INHALTE DES LERNBEREICHS (sinnvoll auswählen, passend zum Umfang): ' + info.alleInhalte.join('; ') + '\n' : ''}${info.basis ? 'GRUNDLAGE – der Lernpfad, mit dem die Schüler gelernt haben. Prüfe genau diese Inhalte und Fachbegriffe, aber formuliere neue Aufgaben, statt die Übungen des Lernpfads zu kopieren:\n<<<\n' + info.basis.trim() + '\n>>>\n' : ''}${matBody}${info.extra?.trim() ? 'WEITERE WÜNSCHE DER LEHRKRAFT (bitte genau umsetzen): ' + info.extra.trim() + '\n' : ''}
REGELN
- WICHTIG – alles in EINEN kopierbaren Textblock: Der komplette Lernpfad samt Anhang mit allen Grafiken steht in einem einzigen Codeblock, damit die Lehrkraft nur einmal kopieren und einfügen muss. Beginne den Block mit vier Backticks und „text“ (\`\`\`\`text) und beende ihn mit vier Backticks (\`\`\`\`), damit Code-Beispiele darin den Block nicht vorzeitig schließen. Kein Text davor oder danach, nichts auf mehrere Blöcke oder Nachrichten verteilen.
- Halte dich exakt an das unten beschriebene PathFinder-Textformat, damit der Lernpfad ohne Nacharbeit eingelesen werden kann.
- Wenn du Dateien zum Herunterladen erzeugen kannst, liefere denselben Inhalt zusätzlich als eine Textdatei „${sv ? 'befragung' : ex ? 'pruefung' : ch ? 'challenge' : 'lernpfad'}.txt“.
- Sprache: Deutsch, Schüler werden mit „du“ angesprochen, kurze Sätze.${/englisch|französisch|franzoesisch|spanisch|italienisch|russisch|latein|griechisch/i.test(info.fach || '') ? ` Ausnahme Fremdsprache (${info.fach.trim()}): Texte, Beispiele, Sätze und Wörter der Aufgaben stehen in der Zielsprache (Latein/Griechisch: Originalsprache mit deutscher Übersetzung, wo nötig); Arbeitsanweisungen auf Deutsch, ab der Mittelstufe gern in der Zielsprache.` : ''}
${info.ask ? '- Schreibe im Kopf die Zeile „Kopfzeile: <Fach> · <Jahrgangsstufe>“ (mit den Angaben der Lehrkraft).\n' : ''}${(info.kopf || [info.fach, info.klasse].map(x => (x || '').trim()).filter(Boolean).join(' · ')) ? `- Schreibe im Kopf die Zeile „Kopfzeile: ${info.kopf || [info.fach, info.klasse].map(x => (x || '').trim()).filter(Boolean).join(' · ')}“.` : ''}${info.lehrplan ? '- Bleib beim Lehrplanbezug: Inhalte, Fachbegriffe und Schwierigkeit passend zu dieser Jahrgangsstufe, nichts vorwegnehmen, was erst später im Lehrplan kommt.\n' : ''}${artRules}${sv ? '' : `- Aufgaben mit eindeutiger Lösung bekommen eine „Antwort:“-Zeile, damit sie automatisch geprüft werden.
`}${ex || sv ? '' : `- Tipps bauen aufeinander auf: zuerst ein kleiner Denkanstoß, zuletzt fast die Lösung.
- Beim Quiz: 3–4 Antworten, genau eine oder mehrere mit [x], zu falschen Antworten eine kurze Rückmeldung.
`}- Bilder und Animationen: Zeichne passende Abbildungen selbst als SVG – im Abschnitt ## Anhang am Ende als „name: <svg …> … </svg>“, oben mit anhang:name einbinden. SVG darf animiert sein (<animate>, <animateTransform>, <animateMotion> oder CSS-@keyframes in <style> innerhalb des SVG). Immer viewBox angeben, gut lesbare Schrift (font-family="sans-serif"), keine Skripte, keine externen Links, Schriften oder Bilder. Lieber wenige, aussagekräftige Grafiken (z. B. Schaubild, Ablauf, Beispiel-Tabelle) als Deko.
- Rasterbilder (PNG, GIF, JPG) nur als data:image/…;base64,…, und nur wenn du die Datei wirklich erzeugt hast (z. B. mit einem Code-Werkzeug) – niemals Base64 ausdenken. Sonst ein Bild-Platzhalter: ![Beschreibung]()
- Keine Bilder aus dem Internet.
${ex || sv ? '' : `- KOPFBILD (Pflicht): Zeichne ein zum Thema passendes Titelbild als SVG und setze es im Kopf ein – im Anhang als „kopf: <svg …>“, im Kopf „Kopfbild: anhang:kopf“ und dazu entweder „Kopfbild-Art: klein“ (ein klares, quadratisches Motiv, viewBox="0 0 200 200", ohne Text) oder „Kopfbild-Art: Hintergrund“ (eine breite, ruhige Szene, viewBox="0 0 1200 400", gedeckte Farben und wenig Details, damit Titel und Untertitel darauf gut lesbar bleiben). Kein Logo, keine Schrift im Bild.
`}- Innerhalb eines ###-Abschnitts (Aufgabe, Quiz, Lückentext, Zuordnen …) keine Bild-Zeilen und keine Infokästen: Sie beenden den Abschnitt. Bilder und Kästen gehören davor oder dahinter (bei Aufgaben stattdessen „Bild: anhang:name“). Normaler Text nach einem Abschnitt steht nach einer Leerzeile.
- Im Lückentext ist JEDE [[Lücke]] eine Antwort, die Schüler einsetzen müssen – Arbeitsanweisungen ohne Lücken als normalen Text vor den Abschnitt schreiben.

${formatHelp({ ...env, appRules: '' }, info.art || 'lernpfad')}`;
}
