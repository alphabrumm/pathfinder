// PathFinder – App-Aufgaben: Programmieren in einer eigenen Web-App (JPad, später QPad, FlowPad) innerhalb einer Prüfung.
//
// Die App läuft in einem Vollbild-Fenster über der Prüfung (iframe). Die Prüfung hält den Stand (Dateien, letzter
// Programmlauf) als Antwort der Aufgabe; die App ist nur das Werkzeug. Ablauf (postMessage, Protokoll „pf-app“ v1):
//
//   App-Adresse + ?pfapp=1   → App startet im Prüfungsmodus (ohne Projektliste, Lernpfade, Dateien sichern)
//   App  → Prüfung  { type:'pf-app', action:'ready', app:'jpad', v:1 }                    (wiederholt, bis „load“ kommt)
//   Prüfung → App   { type:'pf-app', action:'load', task, title, files:[{name,text}], readonly, info?:{ html } }
//                   info.html = Aufgabenstellung als ganze HTML-Seite; die App zeigt sie neben dem Code (JPad: Reiter „Aufgabe“)
//   App  → Prüfung  { type:'pf-app', action:'state', task, files, run?:{ output, error } } (nach Änderungen, nach jedem Lauf)
//   Prüfung → App   { type:'pf-app', action:'flush', req }  → App antwortet sofort mit „state“ (req zurück)
//   Prüfung → App   { type:'pf-app', action:'stop' }        → laufendes Programm anhalten (Fenster geschlossen)
//
// Neue App anbinden: Eintrag in APPS, App versteht ?pfapp=1 und die Meldungen oben. Bewertung: pfsplit.js (appParts).

export const APP_PROTOCOL = 1;
/** Bekannte Apps. url = Standardadresse; die Plattform kann sie überschreiben (z. B. Testinstanz). */
export const APPS = {
  jpad: { n: 'JPad', ic: '☕', lang: 'java', what: 'Java', url: 'https://jpad.pandapy.de/', main: 'Hauptprogramm' },
  qpad: { n: 'QPad', ic: '🗄', lang: 'sql', what: 'SQL', url: '', main: 'Abfrage' },
  flowpad: { n: 'FlowPad', ic: '🔀', lang: 'text', what: 'Flussdiagramm', url: '', main: 'Programm' },
};
export const appDef = (app, urls) => { const d = APPS[app] || { n: app, ic: '▶', lang: 'text', what: app, url: '', main: 'Datei' }; return { ...d, url: (urls && urls[app]) || d.url }; };

/** kurzer Prüfwert über die Dateien (zeigt, ob nach dem letzten Lauf noch geändert wurde) */
export function filesSig(files) {
  let h = 0x811c9dc5; const s = JSON.stringify((files || []).map(f => [f.name, f.text]));
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
/** Prüfwert nur über den Inhalt: leere Dateien und Leerzeichen am Zeilenende zählen nicht (zeigt, ob wirklich etwas geändert wurde) */
export function codeSig(files) {
  return filesSig((files || []).map(f => ({ name: String(f.name || '').toLowerCase(), text: String(f.text || '').replace(/[ \t]+$/gm, '').replace(/\s+$/, '') })).filter(f => f.text));
}
const MAX_FILES = 40, MAX_TEXT = 200000, MAX_OUT = 20000;
/** Meldung der App bereinigen (nur Text, Größen begrenzt) */
export function cleanFiles(files) {
  let total = 0;
  return (Array.isArray(files) ? files : []).slice(0, MAX_FILES).map(f => ({ name: String(f?.name ?? '').slice(0, 80), text: String(f?.text ?? '') }))
    .filter(f => { total += f.text.length; return total <= MAX_TEXT; });
}

const CSS = `
.pfapp-ov{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:var(--bg,#fff);color:var(--ink,#222)}
.pfapp-ov[hidden]{display:none}
.pfapp-bar{display:flex;align-items:center;gap:10px;padding:6px 10px;padding-top:max(6px,env(safe-area-inset-top));background:var(--surface-2,#f1f1f4);border-bottom:1px solid var(--line,#ddd);font:600 15px/1.3 -apple-system,system-ui,sans-serif}
.pfapp-bar .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pfapp-bar .s{font-weight:400;font-size:13px;color:var(--ink-2,#666);white-space:nowrap}
.pfapp-bar button{font:600 15px -apple-system,system-ui,sans-serif;border:0;border-radius:10px;padding:9px 14px;background:var(--a1,#3157f5);color:#fff;cursor:pointer;min-height:40px}
.pfapp-bar button.alt{background:transparent;color:var(--a1,#3157f5);border:1px solid currentColor}
.pfapp-body{position:relative;flex:1;min-height:0}
.pfapp-body iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}
.pfapp-msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:24px;text-align:center;background:var(--bg,#fff);font:16px/1.4 -apple-system,system-ui,sans-serif}
.pfapp-msg[hidden]{display:none}
.pfapp-msg button{font:600 15px -apple-system,system-ui,sans-serif;border:0;border-radius:10px;padding:10px 16px;background:var(--a1,#3157f5);color:#fff}
`;

let OV = null; // ein Fenster für alle App-Aufgaben; je App-Adresse ein iframe, das offen bleibt (App lädt nur einmal)
const frames = new Map();
let cur = null; // { task, frame, onState, readonly }
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function overlay() {
  if (OV) return OV;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'pfapp-ov'; el.hidden = true;
  el.innerHTML = `<div class="pfapp-bar"><span class="t" data-t></span><span class="s" data-s></span><button data-close>✓ Fertig</button></div><div class="pfapp-body" data-body><div class="pfapp-msg" data-msg hidden></div></div>`;
  (document.fullscreenElement || document.webkitFullscreenElement || document.body).appendChild(el);
  el.querySelector('[data-close]').onclick = () => closeApp();
  addEventListener('message', onMessage);
  OV = el; return el;
}
function frameFor(url, mode) {
  const key = url + (mode ? '#' + mode : '');
  let f = frames.get(key);
  if (f) return f;
  const ifr = document.createElement('iframe');
  ifr.src = url + (url.includes('?') ? '&' : '?') + 'pfapp=' + (mode || APP_PROTOCOL); // mode 'unterricht': Lernmodus (Probe, Modul Unterricht)
  ifr.allow = 'clipboard-read; clipboard-write; fullscreen';
  ifr.title = 'App';
  ifr.hidden = true;
  OV.querySelector('[data-body]').appendChild(ifr);
  f = { url, key, origin: new URL(url, location.href).origin, ifr, ready: false, waiters: [], reqs: {} };
  frames.set(key, f);
  return f;
}
function post(f, m) { try { f.ifr.contentWindow.postMessage(m, f.origin); } catch (e) { } }
function onMessage(e) {
  const m = e.data; if (!m || m.type !== 'pf-app') return;
  const f = [...frames.values()].find(x => x.ifr.contentWindow === e.source && x.origin === e.origin); if (!f) return;
  if (m.action === 'ready') {
    if (!f.ready) { f.ready = true; f.waiters.splice(0).forEach(w => w()); }
    if (cur?.frame === f && !cur.loaded) sendLoad();
    return;
  }
  if (m.action === 'cursor') { if (m.req && f.reqs[m.req]) { const w = f.reqs[m.req]; delete f.reqs[m.req]; w(m); } return; }
  if (m.action === 'state') {
    if (m.req && f.reqs[m.req]) { const w = f.reqs[m.req]; delete f.reqs[m.req]; w(m); }
    if (!cur || cur.frame !== f || m.task !== cur.task || cur.readonly) return;
    const files = cleanFiles(m.files), sig = filesSig(files);
    const st = { files, sig, at: Date.now() };
    if (typeof m.lernpfadHtml === 'string' && m.lernpfadHtml.length < 2e7) { st.lernpfadHtml = m.lernpfadHtml; st.lernpfadTitle = String(m.lernpfadTitle || '').slice(0, 200); } // JPad-Lernumgebung (Probe)
    if (m.run && typeof m.run === 'object') st.run = { output: String(m.run.output ?? '').slice(0, MAX_OUT), error: !!m.run.error, at: Date.now(), sig };
    cur.onState?.(st);
    status(st);
  }
}
function status(st) {
  const el = OV?.querySelector('[data-s]'); if (!el) return;
  el.textContent = st?.run ? `▶ zuletzt ausgeführt ${new Date(st.run.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : st ? '✓ gespeichert' : '';
}
function sendLoad() {
  if (!cur) return; cur.loaded = true;
  post(cur.frame, { type: 'pf-app', action: 'load', ...(cur.extra || {}), task: cur.task, title: cur.title, files: cur.files, readonly: !!cur.readonly, ...(cur.info ? { info: cur.info } : {}) });
}
/** Live-Ansicht (Unterricht): neuen Stand in die offene, schreibgeschützte App schicken, ohne sie neu zu laden */
export function updateApp(files) {
  if (!cur?.loaded || !cur.readonly) return;
  post(cur.frame, { type: 'pf-app', action: 'files', task: cur.task, files: cleanFiles(files) });
}
/** Unterricht: schreibgeschützt umschalten (Lehrkraft übernimmt bzw. gibt zurück); text = Hinweis in der App */
export function setAppReadonly(on, text = '') {
  if (!cur) return; cur.readonly = !!on;
  if (cur.loaded) post(cur.frame, { type: 'pf-app', action: 'readonly', task: cur.task, on: !!on, text });
}
/** Unterricht: Kommentare der Lehrkraft [{ id, file, line, text, snip }] */
export function appComments(list) { if (cur?.loaded) post(cur.frame, { type: 'pf-app', action: 'comments', task: cur.task, list: list || [] }); }
/** Unterricht: Datei, Zeile und Zeilentext an der Cursorposition der App */
export function appCursor(ms = 1500) {
  if (!cur?.frame?.ready) return Promise.resolve(null);
  const f = cur.frame, req = 'c' + Math.random().toString(36).slice(2);
  return new Promise(ok => { const t = setTimeout(() => { delete f.reqs[req]; ok(null); }, ms); f.reqs[req] = m => { clearTimeout(t); ok(m); }; post(f, { type: 'pf-app', action: 'cursor', req, task: cur.task }); });
}
/** Kopfleiste des App-Fensters (z. B. für eigene Knöpfe) */
export const appBar = () => OV?.querySelector('.pfapp-bar') || null;
/** Zeile rechts in der Kopfleiste selbst setzen (z. B. „zuletzt geändert …“) */
export function appStatus(text) { const el = OV?.querySelector('[data-s]'); if (el) el.textContent = text || ''; }

/**
 * App-Fenster öffnen.
 *   app       'jpad' | 'qpad' | 'flowpad'
 *   url       Adresse der App (sonst Standard aus APPS)
 *   task      Kennung der Aufgabe (Meldungen anderer Aufgaben werden ignoriert)
 *   title     Text in der Kopfleiste
 *   files     Ausgangsstand [{ name, text }]
 *   readonly  nur ansehen und ausführen (z. B. Lehrkraft bei der Korrektur): Änderungen werden nicht gemeldet
 *   onState   (stand) => …  bei jeder Änderung: { files, sig, at, run? }
 *   onClose   () => …
 *   info      { html } – Aufgabenstellung als HTML-Seite, die die App neben dem Code anzeigt (optional)
 *   mode      'unterricht' – Lernmodus der App (Probe, Modul Unterricht: mit Lernpfad und Hilfen); sonst Prüfungsmodus
 *   extra     weitere Felder der load-Meldung (Unterricht: jcode, project, observe; Lernumgebung bauen: lernpfadDoc)
 *   flushMs   so lange wartet „Fertig“ auf den letzten Stand (Standard 800 ms)
 */
export function openApp({ app, url, task, title = '', files = [], readonly = false, onState, onClose, closeLabel, info, mode, extra, flushMs } = {}) {
  const d = appDef(app, url ? { [app]: url } : null);
  overlay();
  if (cur) closeApp(true);
  const msg = OV.querySelector('[data-msg]');
  OV.querySelector('[data-t]').textContent = `${d.ic} ${d.n}${title ? ' · ' + title : ''}`;
  OV.querySelector('[data-close]').textContent = closeLabel || (readonly ? 'Schließen' : '✓ Fertig – zurück zur Prüfung');
  status(null);
  // im Vollbild muss das Fenster im Vollbild-Element liegen, sonst ist es unsichtbar
  const host = document.fullscreenElement || document.webkitFullscreenElement || document.body;
  if (OV.parentElement !== host) host.appendChild(OV);
  OV.hidden = false;
  if (!d.url) { msg.hidden = false; msg.innerHTML = `<b>${esc(d.n)} ist ${mode ? 'hier' : 'für Prüfungen'} noch nicht eingerichtet.</b><span>Bitte gib deiner Lehrkraft Bescheid.</span>`; cur = null; return { close: closeApp }; }
  const f = frameFor(d.url, mode);
  frames.forEach(x => { x.ifr.hidden = x !== f; });
  cur = { task, title, files: cleanFiles(files), readonly, onState, onClose, frame: f, loaded: false, extra: extra || null, flushMs: flushMs || 800, info: info && typeof info.html === 'string' && info.html.length < 4e6 ? { html: info.html } : null };
  if (f.ready) sendLoad();
  else {
    msg.hidden = false; msg.innerHTML = `<span>${esc(d.n)} wird geladen …</span>`;
    const me = cur, t = setTimeout(() => {
      if (cur !== me || f.ready) return;
      msg.innerHTML = `<b>${esc(d.n)} antwortet nicht.</b><span>Prüfe die Internetverbindung. ${mode ? 'Dein bisheriger Stand ist gespeichert.' : 'Deine bisherigen Antworten sind gespeichert.'}</span><button data-retry>Nochmal versuchen</button>`;
      msg.querySelector('[data-retry]').onclick = () => { frames.delete(f.key); f.ifr.remove(); closeApp(true); openApp({ app, url, task, title, files: me.files, readonly, onState, onClose, closeLabel, info, mode, extra, flushMs }); };
    }, 25000);
    f.waiters.push(() => { clearTimeout(t); if (cur === me) msg.hidden = true; });
  }
  if (f.ready) msg.hidden = true;
  return { close: closeApp, flush: flushApp };
}
/** aktuellen Stand sofort von der App holen (z. B. vor der Abgabe); wartet höchstens ms */
export function flushApp(ms = 1500) {
  if (!cur?.frame?.ready || cur.readonly) return Promise.resolve();
  const f = cur.frame, req = 'f' + Math.random().toString(36).slice(2);
  return new Promise(ok => { const t = setTimeout(() => { delete f.reqs[req]; ok(); }, ms); f.reqs[req] = () => { clearTimeout(t); ok(); }; post(f, { type: 'pf-app', action: 'flush', req, task: cur.task }); });
}
/** Fenster schließen (der Stand wurde laufend gemeldet; vorher noch einmal holen) */
export async function closeApp(silent = false) {
  if (!OV || OV.hidden) return;
  const c = cur;
  if (c && !silent) await flushApp(c.flushMs || 800);
  if (c) post(c.frame, { type: 'pf-app', action: 'stop' });
  if (cur === c) cur = null;
  OV.hidden = true;
  if (!silent) c?.onClose?.();
}
export const appOpen = () => !!OV && !OV.hidden;

/**
 * Aufgabenstellung als eigenständige HTML-Seite für die App (läuft dort in einem abgeschotteten iframe).
 * tasks: [{ title, html, img, pts, current }] – meist nur die geöffnete Aufgabe; note: Hinweis darüber (z. B. „baut auf … auf“)
 */
export function taskPage({ head = '', project = '', tasks = [], note = '' } = {}) {
  const one = tasks.length === 1;
  const card = (t, i) => `<section class="t${t.current ? ' cur' : ''}"${t.current ? ' id="aktuell"' : ''}><h2>${one ? '' : `<span class="n">${i + 1}</span>`}${esc(t.title || 'Aufgabe')}${t.pts != null ? `<span class="p">${String(t.pts).replace('.', ',')} P.</span>` : ''}</h2>`
    + `${t.current && !one ? '<div class="now">▶ gerade geöffnet</div>' : ''}${t.img ? `<img src="${esc(t.img)}" alt="">` : ''}<div class="b">${t.html || ''}</div></section>`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{color-scheme:light dark;--bg:#fff;--ink:#1d1f27;--ink2:#5d6275;--line:#e3e5ee;--acc:#3157f5;--soft:#eef2ff;--code:#f2f3f7}
@media (prefers-color-scheme:dark){:root{--bg:#161821;--ink:#eceef6;--ink2:#a3a8bb;--line:#2c3040;--acc:#8ea6ff;--soft:#1f2640;--code:#232634}}
body{margin:0;padding:14px 16px 40px;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,system-ui,sans-serif}
.k{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin-bottom:10px}
.pr{font-size:13px;color:var(--ink2);margin:-4px 0 12px}
.t{border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 0 12px}
.t.cur{border:2px solid var(--acc);background:var(--soft)}
h2{font-size:17px;margin:2px 0 6px;display:flex;gap:8px;align-items:baseline}
.n{display:inline-flex;min-width:1.5em;justify-content:center;border-radius:6px;background:var(--line);font-size:13px;padding:0 4px}
.cur .n{background:var(--acc);color:#fff}
.p{margin-left:auto;font-size:13px;font-weight:600;color:var(--ink2);white-space:nowrap}
.now{font-size:13px;font-weight:700;color:var(--acc);margin-bottom:4px}
img{max-width:100%;border-radius:8px}
code,pre{font-family:ui-monospace,Menlo,monospace;font-size:.92em;background:var(--code);border-radius:5px}
code{padding:1px 4px} pre{padding:8px 10px;overflow-x:auto;white-space:pre-wrap}
p{margin:.4em 0}
</style></head><body>${head ? `<div class="k">${esc(head)}</div>` : ''}${note ? `<div class="pr">${esc(note)}</div>` : project && !one ? `<div class="pr">🔗 Projekt „${esc(project)}“</div>` : ''}
${tasks.map(card).join('')}
<script>var a=document.getElementById('aktuell');if(a&&a.previousElementSibling)a.scrollIntoView({block:'start'});</script></body></html>`;
}
