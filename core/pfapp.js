// PathFinder – App-Aufgaben: Programmieren in einer eigenen Web-App (JPad, später QPad, FlowPad) innerhalb einer Prüfung.
//
// Die App läuft in einem Vollbild-Fenster über der Prüfung (iframe). Die Prüfung hält den Stand (Dateien, letzter
// Programmlauf) als Antwort der Aufgabe; die App ist nur das Werkzeug. Ablauf (postMessage, Protokoll „pf-app“ v1):
//
//   App-Adresse + ?pfapp=1   → App startet im Prüfungsmodus (ohne Projektliste, Lernpfade, Dateien sichern)
//   App  → Prüfung  { type:'pf-app', action:'ready', app:'jpad', v:1 }                    (wiederholt, bis „load“ kommt)
//   Prüfung → App   { type:'pf-app', action:'load', task, title, files:[{name,text}], readonly }
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
function frameFor(url) {
  let f = frames.get(url);
  if (f) return f;
  const ifr = document.createElement('iframe');
  ifr.src = url + (url.includes('?') ? '&' : '?') + 'pfapp=' + APP_PROTOCOL;
  ifr.allow = 'clipboard-read; clipboard-write; fullscreen';
  ifr.title = 'App';
  ifr.hidden = true;
  OV.querySelector('[data-body]').appendChild(ifr);
  f = { url, origin: new URL(url, location.href).origin, ifr, ready: false, waiters: [], reqs: {} };
  frames.set(url, f);
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
  if (m.action === 'state') {
    if (m.req && f.reqs[m.req]) { const w = f.reqs[m.req]; delete f.reqs[m.req]; w(m); }
    if (!cur || cur.frame !== f || m.task !== cur.task || cur.readonly) return;
    const files = cleanFiles(m.files), sig = filesSig(files);
    const st = { files, sig, at: Date.now() };
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
  post(cur.frame, { type: 'pf-app', action: 'load', task: cur.task, title: cur.title, files: cur.files, readonly: !!cur.readonly });
}

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
 */
export function openApp({ app, url, task, title = '', files = [], readonly = false, onState, onClose, closeLabel } = {}) {
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
  if (!d.url) { msg.hidden = false; msg.innerHTML = `<b>${esc(d.n)} ist für Prüfungen noch nicht eingerichtet.</b><span>Bitte gib deiner Lehrkraft Bescheid.</span>`; cur = null; return { close: closeApp }; }
  const f = frameFor(d.url);
  frames.forEach(x => { x.ifr.hidden = x !== f; });
  cur = { task, title, files: cleanFiles(files), readonly, onState, onClose, frame: f, loaded: false };
  if (f.ready) sendLoad();
  else {
    msg.hidden = false; msg.innerHTML = `<span>${esc(d.n)} wird geladen …</span>`;
    const me = cur, t = setTimeout(() => {
      if (cur !== me || f.ready) return;
      msg.innerHTML = `<b>${esc(d.n)} antwortet nicht.</b><span>Prüfe die Internetverbindung. Deine bisherigen Antworten sind gespeichert.</span><button data-retry>Nochmal versuchen</button>`;
      msg.querySelector('[data-retry]').onclick = () => { frames.delete(d.url); f.ifr.remove(); closeApp(true); openApp({ app, url, task, title, files: me.files, readonly, onState, onClose, closeLabel }); };
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
  if (c && !silent) await flushApp(800);
  if (c) post(c.frame, { type: 'pf-app', action: 'stop' });
  if (cur === c) cur = null;
  OV.hidden = true;
  if (!silent) c?.onClose?.();
}
export const appOpen = () => !!OV && !OV.hidden;
