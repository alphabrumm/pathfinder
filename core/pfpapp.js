// Probe-Apps: kleine HTML-Apps (z. B. „Zellaufbau“), die links neben einem Lernpfad laufen.
// Eine Probe-App ist EINE HTML-Datei. Sie enthält ihren Steckbrief als
//   <script type="application/json" id="probe-app">{ "name": …, "events": [ … ] }</script>
// und läuft in einem abgeschotteten Rahmen (sandbox="allow-scripts", eigener Ursprung, Content-Security-Policy ohne Netz):
// kein Zugriff auf Probe, keine Verbindungen nach außen. Sie spricht nur per postMessage mit dem Player:
//
//   App → Player  { type:'probe-app', action:'ready', v:1 }                    sobald sie bereit ist (wiederholen, bis load kommt)
//   Player → App  { type:'probe-app', action:'load', state, readonly }         gespeicherter Stand (null = neu) bzw. nur ansehen
//   App → Player  { type:'probe-app', action:'state', state, summary? }        nach Änderungen; state = kleines JSON (≤ 200 kB),
//                                                                             summary = { pct, text } für die Lehrkraft
//   App → Player  { type:'probe-app', action:'event', name, data? }           etwas ist passiert – App-Aufgaben im Lernpfad prüfen das
//   Player → App  { type:'probe-app', action:'flush', req }                   sofort „state“ mit req schicken
//   App → Player  { type:'probe-app', action:'error', msg }                   (vom Player eingesetzter Fehlermelder)
//   Player → App  { type:'probe-app', action:'task', task:{ id, title, vorlage, pruefung } }   (v2) eine App-Aufgabe wird geöffnet:
//                                                                             Vorlage laden (Text oder data:-URL), Prüfung merken
//   App → Player  { type:'probe-app', action:'solved', task: id }             (v2) die geöffnete Aufgabe ist gelöst (Prüfung erfüllt)
//
// Steckbrief (Pflicht: name, events): name, icon (ein Emoji), beschreibung, fach (leer = alle Fächer), jg (z. B. "5-7"), version,
// events: [{ name, text }], summary (was „pct“ bedeutet), layout ('geteilt' | 'nur-app'), regeln (Hinweise für die KI, die den
// Lernpfad dazu schreibt), lernpfad (optional: PathFinder-Dokument als eingebauter Beispiel-Lernpfad),
// vorlagen (v2: wie eine Vorlage aussieht, z. B. „GeoGebra-Befehle, einer pro Zeile“), pruefung (v2: wie eine Prüfung geschrieben wird),
// vorlageBeispiel / pruefungBeispiel (v2: je ein Beispiel – der Probe-Check probiert es aus).

export const PAPP_VERSION = 2;
const MAX_HTML = 3e6, MAX_STATE = 2e5;
/** keine Verbindungen nach außen: nur eingebettete Daten (data:, blob:) */
export const PAPP_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'";

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Steckbrief aus dem HTML lesen und prüfen → { m, errors, warnings } */
export function readManifest(html) {
  const errors = [], warnings = [];
  const g = String(html || '').match(/<script[^>]*id=["']probe-app["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!g) return { m: null, errors: ['Der Steckbrief fehlt: <script type="application/json" id="probe-app">{ … }</script>'], warnings };
  let raw; try { raw = JSON.parse(g[1]); } catch (e) { return { m: null, errors: ['Der Steckbrief ist kein gültiges JSON: ' + e.message], warnings }; }
  return normManifest(raw, errors, warnings);
}
export function normManifest(raw, errors = [], warnings = []) {
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const m = {
    name: s(raw?.name, 60), icon: s(raw?.icon, 8) || '🧩', beschreibung: s(raw?.beschreibung, 600), fach: s(raw?.fach, 40), jg: s(raw?.jg, 12),
    version: s(raw?.version, 20) || '1', summary: s(raw?.summary, 200), layout: raw?.layout === 'nur-app' ? 'nur-app' : 'geteilt', regeln: s(raw?.regeln, 4000),
    events: (Array.isArray(raw?.events) ? raw.events : []).slice(0, 40).map(e => ({ name: s(e?.name, 40).replace(/[^a-z0-9_-]/gi, '-').toLowerCase(), text: s(e?.text, 160) })).filter(e => e.name),
    ...(raw?.lernpfad && typeof raw.lernpfad === 'object' && Array.isArray(raw.lernpfad.stations) ? { lernpfad: raw.lernpfad } : {}),
    ...(typeof (raw?.demo ?? raw?.lernpfadText) === 'string' && (raw.demo ?? raw.lernpfadText).trim() ? { lernpfadText: (raw.demo ?? raw.lernpfadText).slice(0, 60000) } : {}), // Demo-Lernpfad im PathFinder-Textformat („demo“, früher „lernpfadText“)
    vorlagen: s(raw?.vorlagen, 2000), pruefung: s(raw?.pruefung, 2000), vorlageBeispiel: s(raw?.vorlageBeispiel, 4000), pruefungBeispiel: s(raw?.pruefungBeispiel, 400),
  };
  if (!m.name) errors.push('Im Steckbrief fehlt „name“.');
  if (!m.lernpfad && !m.lernpfadText) errors.push('Die App bringt keinen Demo-Lernpfad mit („demo“ im Steckbrief): Jede Probe-App braucht einen kleinen Lernpfad, der ihre Grundfunktionen vorstellt.');
  if (!m.events.length && !m.pruefung) errors.push('Die App meldet nichts, was der Lernpfad prüfen kann: Im Steckbrief stehen weder Ereignisse („events“) noch Prüfungen („pruefung“).');
  if (m.vorlagen && !m.vorlageBeispiel) warnings.push('Im Steckbrief steht „vorlagen“, aber kein „vorlageBeispiel“ – der Probe-Check kann das Laden einer Vorlage nicht ausprobieren.');
  if (!m.beschreibung) warnings.push('Im Steckbrief fehlt eine „beschreibung“ – die KI weiß dann wenig über die App.');
  return { m, errors, warnings };
}

/** Demo-Lernpfad der App als PathFinder-Dokument → { doc, errors } (Steckbrief: lernpfad oder demo/lernpfadText) */
export async function demoDoc(m) {
  if (m?.lernpfad) return { doc: JSON.parse(JSON.stringify(m.lernpfad)), errors: [] };
  if (!m?.lernpfadText) return { doc: null, errors: ['kein Demo-Lernpfad'] };
  const T = await import('./pftext.js'), uid = () => Math.random().toString(36).slice(2, 10);
  const emptyDoc = (form = 'lernpfad') => ({ v: 2, id: uid(), form, design: { pal: 0, font: 'pixel', shape: 'eckig', hero: 'logo', heroImg: '' }, kicker: '', title: '', subtitle: '', goals: [], rank: '', anim: {}, typeLines: [],
    stations: [{ id: uid(), title: '', sub: '', check: false, blocks: [{ id: uid(), type: 'text', html: '' }] }], cert: { on: true, need: 'immer', pct: 80, text: 'hat den Lernpfad mit folgendem Ergebnis bearbeitet:', show: { zeit: true, tipps: true, quiz: true, xp: true } } });
  const r = T.parseText(m.lernpfadText, { plugins: [pappPlugin], palettes: [{ n: 'Standard' }], figures: {}, uid, emptyDoc, isCheck: () => false, appName: 'Probe', attachments: {}, files: {} });
  return { doc: r.errors?.length ? null : r.doc, errors: (r.errors || []).map(e => typeof e === 'string' ? e : `Zeile ${e.n}: ${e.m}`) };
}
/** passt die App zum Fach? (fach im Steckbrief: leer = alle Fächer, sonst Liste mit Kommas) */
export function appFitsFach(m, fach) {
  const L = String(m?.fach || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return !L.length || !fach || L.includes(String(fach).trim().toLowerCase());
}
/** passt die App zur Jahrgangsstufe? (jg: „5“, „5-7“, „ab 8“; leer = alle) */
export function appFitsJg(m, jg) {
  const n = +jg || 0, s = String(m?.jg || '').trim(); if (!n || !s) return true;
  const r = s.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/); if (r) return n >= +r[1] && n <= +r[2];
  const a = s.match(/ab\s*(\d{1,2})/i); if (a) return n >= +a[1];
  const e = s.match(/^(\d{1,2})$/); return e ? n === +e[1] : true;
}
/** HTML für den abgeschotteten Rahmen: Netzsperre (CSP) und Fehlermelder ganz vorn einsetzen */
export function sandboxHtml(html) {
  const head = `<meta http-equiv="Content-Security-Policy" content="${PAPP_CSP}"><meta name="viewport" content="width=device-width, initial-scale=1">`
    + `<script>(function(){var r=function(m){try{parent.postMessage({type:'probe-app',action:'error',msg:String(m)},'*')}catch(x){}};`
    + `addEventListener('error',function(e){r(e.message||e)});addEventListener('unhandledrejection',function(e){r('Unbehandelter Fehler: '+((e.reason&&e.reason.message)||e.reason))});`
    + `addEventListener('securitypolicyviolation',function(e){r('Gesperrt (nicht erlaubt in Probe-Apps): '+(e.blockedURI||e.violatedDirective))});`
    + `window.alert=window.confirm=window.prompt=function(){r('alert/confirm/prompt sind in Probe-Apps nicht erlaubt');return null}})();</script>`;
  const h = String(html || '');
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, m => m + head);
  if (/<html[^>]*>/i.test(h)) return h.replace(/<html[^>]*>/i, m => m + '<head>' + head + '</head>');
  return '<!doctype html><html><head>' + head + '</head><body>' + h + '</body></html>';
}

/**
 * App in einen Rahmen setzen.
 *   el        Element, in das der Rahmen kommt (füllt es aus)
 *   html      die App
 *   state     gespeicherter Stand (oder null)
 *   readonly  nur ansehen (Lehrkraft, beendete Einheit)
 *   onState   (state, summary) => …   onEvent (name, data) => …   onError msg => …   onReady () => …
 * Gibt { frame, load(state, readonly), flush(ms) → Promise<{state, summary}|null>, destroy() } zurück.
 */
export function mountApp(el, { html, state = null, readonly = false, onState, onEvent, onSolved, onError, onReady, onRoState } = {}) {
  const ifr = document.createElement('iframe');
  ifr.setAttribute('sandbox', 'allow-scripts');
  ifr.setAttribute('title', 'App');
  ifr.style.cssText = 'border:0;width:100%;height:100%;display:block;background:#fff';
  ifr.srcdoc = sandboxHtml(html);
  el.appendChild(ifr);
  let cur = { state, readonly }, loaded = false, reqs = {};
  const post = m => { try { ifr.contentWindow?.postMessage({ type: 'probe-app', ...m }, '*'); } catch (e) { } };
  const on = ev => {
    if (ev.source !== ifr.contentWindow) return; // der Rahmen hat keinen eigenen Ursprung („null“) – erkannt wird er am Fenster
    const m = ev.data; if (!m || m.type !== 'probe-app') return;
    if (m.action === 'ready') { if (!loaded) { loaded = true; onReady?.(); } post({ action: 'load', state: cur.state, readonly: !!cur.readonly }); return; }
    if (m.action === 'state') {
      let st = m.state; try { if (JSON.stringify(st ?? null).length > MAX_STATE) { onError?.('Der Stand der App ist zu groß (über 200 kB) und wird nicht gespeichert.'); return; } } catch (e) { return; }
      const sum = m.summary && typeof m.summary === 'object' ? { pct: Math.max(0, Math.min(100, +m.summary.pct || 0)), text: String(m.summary.text ?? '').slice(0, 120) } : null;
      if (m.req && reqs[m.req]) { const w = reqs[m.req]; delete reqs[m.req]; w({ state: st, summary: sum }); }
      if (!cur.readonly) { cur.state = st; onState?.(st, sum); } else if (!m.req) onRoState?.();
      return;
    }
    if (m.action === 'event' && !cur.readonly) { onEvent?.(String(m.name ?? '').slice(0, 40).toLowerCase(), m.data); return; }
    if (m.action === 'solved' && !cur.readonly) { onSolved?.(String(m.task ?? '').slice(0, 40)); return; }
    if (m.action === 'error') onError?.(String(m.msg ?? '').slice(0, 300));
  };
  addEventListener('message', on);
  return {
    frame: ifr,
    load(state, readonly = cur.readonly) { cur = { state, readonly }; if (loaded) post({ action: 'load', state, readonly: !!readonly }); },
    /** App-Aufgabe öffnen (v2): Vorlage laden, Prüfung merken */
    task(t) { if (loaded && !cur.readonly) post({ action: 'task', task: { id: String(t.id), title: String(t.title || ''), vorlage: String(t.vorlage || ''), pruefung: String(t.pruefung || '') } }); },
    get ready() { return loaded; },
    flush(ms = 800) { if (!loaded) return Promise.resolve(null); const req = 'f' + Math.random().toString(36).slice(2); return new Promise(ok => { const t = setTimeout(() => { delete reqs[req]; ok(null); }, ms); reqs[req] = v => { clearTimeout(t); ok(v); }; post({ action: 'flush', req }); }); },
    get state() { return cur.state; },
    destroy() { removeEventListener('message', on); ifr.remove(); },
  };
}

/**
 * Probe-Check: Steckbrief, Größe, Netzzugriffe (Quelltext), dann ein Probelauf im Rahmen: meldet sich die App,
 * nimmt sie einen Stand an, gibt es Fehler? → { ok, errors, warnings, m }
 */
export async function checkApp(html, { timeout = 7000 } = {}) {
  const h = String(html || ''), { m, errors, warnings } = readManifest(h);
  if (!/<(html|body|script|div|svg|canvas)/i.test(h)) errors.push('Das sieht nicht nach einer HTML-Seite aus.');
  if (h.length > MAX_HTML) errors.push(`Die App ist zu groß (${Math.round(h.length / 1e6 * 10) / 10} MB, höchstens 3 MB).`);
  if (/<(script|link|img|iframe|audio|video|source)[^>]+(src|href)\s*=\s*["']?(https?:)?\/\//i.test(h)) errors.push('Die App lädt etwas aus dem Internet (src/href mit http…). Probe-Apps müssen alles selbst enthalten (Bilder als data:, keine Bibliotheken von außen).');
  if (/@import\s+url\(\s*["']?https?:/i.test(h) || /url\(\s*["']?https?:/i.test(h)) errors.push('Die App lädt Schriften oder Bilder aus dem Internet (CSS url(http…)).');
  if (/\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|navigator\.sendBeacon|\bimport\s*\(\s*["'`]https?:|new\s+Worker\s*\(/.test(h)) errors.push('Die App versucht Netzwerkzugriffe oder lädt Code nach (fetch, XMLHttpRequest, import(…), Worker …) – in Probe-Apps ist das gesperrt.');
  if (/localStorage|sessionStorage|indexedDB|document\.cookie/.test(h)) errors.push('Die App nutzt Browser-Speicher (localStorage, Cookies …) – den gibt es im Player nicht. Den Stand nur über „state“ an den Player melden.');
  if (/\b(alert|confirm|prompt)\s*\(/.test(h)) warnings.push('Die App ruft alert(), confirm() oder prompt() auf – das ist gesperrt; Meldungen bitte in der App selbst anzeigen.');
  if (/window\.open\s*\(|top\.location|parent\.location|target=["']_blank/.test(h)) errors.push('Die App öffnet Fenster oder Seiten (window.open, target="_blank", top.location) – das ist in Probe-Apps gesperrt.');
  if (!/probe-app/.test(h.replace(/<script[^>]*id=["']probe-app["'][\s\S]*?<\/script>/i, ''))) errors.push('Die App spricht das Probe-Protokoll nicht (postMessage mit type „probe-app“: ready, load, state, event).');
  if (errors.length && errors.some(e => /HTML-Seite|zu groß/.test(e))) return { ok: false, errors, warnings, m };
  // Demo-Lernpfad: lesbar und nur mit Ereignissen der App
  if (m && (m.lernpfad || m.lernpfadText)) {
    const D = await demoDoc(m).catch(e => ({ doc: null, errors: [e.message] }));
    if (!D.doc) errors.push('Der Demo-Lernpfad („demo“) lässt sich nicht lesen: ' + D.errors.slice(0, 3).join(' · '));
    else {
      const T = D.doc.stations.flatMap(s => s.blocks).filter(b => b.type === 'apptask');
      if (!D.doc.design?.heroImg) warnings.push('Der Demo-Lernpfad hat kein Kopfbild („Kopfbild: anhang:kopf“ mit einem SVG im „## Anhang“).');
      if (!T.length) warnings.push('Der Demo-Lernpfad hat keine „### App-Aufgabe“ – er sollte zeigen, wie die App mit dem Lernpfad zusammenarbeitet.');
      const bad = [...new Set(T.filter(b => b.event && !m.events.some(e => e.name === b.event)).map(b => b.event))];
      if (bad.length) errors.push('Der Demo-Lernpfad verwendet Ereignisse, die nicht im Steckbrief stehen: ' + bad.join(', '));
    }
  }
  // Probelauf
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-3000px;top:0;width:1024px;height:700px;opacity:0;pointer-events:none';
  document.body.appendChild(box);
  const errs = [], states = [], events = [];
  let ready = false, ro = 0;
  const app = mountApp(box, { html: h, onReady: () => { ready = true; }, onState: (s, sum) => states.push({ s, sum }), onEvent: n => events.push(n), onError: e => errs.push(e), onRoState: () => ro++ });
  const until = (f, ms) => new Promise(ok => { const t0 = Date.now(), iv = setInterval(() => { if (f() || Date.now() - t0 > ms) { clearInterval(iv); ok(f()); } }, 100); });
  const wait = ms => new Promise(r => setTimeout(r, ms)), js = v => { try { return JSON.stringify(v ?? null); } catch (e) { return '?'; } };
  await until(() => ready, timeout);
  if (!ready) errors.push(`Die App meldet sich nicht (keine Nachricht „ready“ innerhalb von ${Math.round(timeout / 1000)} s). Sie muss beim Start „ready“ schicken.`);
  else {
    await wait(900);
    // 1. Stand abfragen (flush) – nötig zum Speichern und für die Live-Ansicht der Lehrkraft
    const f = await app.flush(1500);
    if (!f) errors.push('Die App antwortet nicht auf „flush“ (sofort „state“ mit derselben „req“ schicken) – ohne das gehen Stände verloren.');
    else {
      // 2. Vorlage laden (v2), falls die App Vorlagen kann
      if (m?.vorlagen && m.vorlageBeispiel) {
        const n0 = errs.length; app.task({ id: 'probe-check', title: 'Probe-Check', vorlage: m.vorlageBeispiel, pruefung: m.pruefungBeispiel || '' }); await wait(1500);
        if (errs.length > n0) errors.push('Beim Laden des Vorlage-Beispiels aus dem Steckbrief meldet die App einen Fehler.');
      }
      // 3. gespeicherten Stand wieder laden – schreibgeschützt (so sieht ihn die Lehrkraft) – und erneut abfragen: muss gleich bleiben
      const g = await app.flush(1500);
      if (g && g.state != null) {
        app.load(g.state, true); await wait(800);
        const h2 = await app.flush(1500);
        if (!h2) errors.push('Nach dem Laden eines gespeicherten Stands antwortet die App nicht mehr auf „flush“.');
        else if (js(h2.state) !== js(g.state)) warnings.push('Die App gibt einen geladenen Stand nicht unverändert zurück – Schüler finden ihre Arbeit evtl. nicht so wieder, wie sie sie verlassen haben.');
        const n1 = ro; await wait(600);
        if (ro > n1 + 1) warnings.push('Die App meldet im Nur-Ansehen-Modus (readonly) Änderungen – dort darf sich nichts verändern.');
      } else if (g && g.state == null) warnings.push('Die App meldet als Stand „null“ – dann kann der Player nichts speichern.');
    }
  }
  app.destroy(); box.remove();
  for (const e of [...new Set(errs)].slice(0, 5)) errors.push('Fehler beim Start der App: ' + e);
  const unknown = [...new Set(events)].filter(n => m && !m.events.some(e => e.name === n));
  if (unknown.length) warnings.push('Die App meldet Ereignisse, die nicht im Steckbrief stehen: ' + unknown.join(', '));
  return { ok: !errors.length, errors, warnings, m };
}

/* ---------- Baustein „App-Aufgabe“ für den Lernpfad neben der App ---------- */
/**
 * Host für startPathFinder: verbindet den Lernpfad mit der App.
 *   events   Ereignisse aus dem Steckbrief (für das Formular)
 * host.event(name) aufrufen, wenn die App ein Ereignis meldet – passende App-Aufgaben werden gelöst.
 */
export function createAppHost({ events = [], name = 'App', vorlagen = '' } = {}) {
  let api = null, app = null; const count = {};
  const done = b => { if (api.mode === 'preview' || !api.E()) api.solve(b.id); else api.toast(`✓ App: „${esc(b.title || 'App-Aufgabe')}“ wäre jetzt gelöst (in der Vorschau zählt es)`); };
  return {
    name, appEvents: events, appVorlagen: vorlagen,
    attach(a) { api = a; },
    /** die App (mountApp) bzw. eine Funktion, die Aufgaben an sie schickt (v2) */
    link(a) { app = a; },
    /** App-Aufgabe in der App öffnen: Vorlage laden, Prüfung mitgeben */
    task(b) { if (!app) { api?.toast('Die App ist hier nicht verbunden.'); return; } (typeof app === 'function' ? app : t => app.task(t))({ id: b.id, title: b.title || '', vorlage: b.vorlage || '', pruefung: b.pruefung || '' }); },
    /** die App meldet: Aufgabe gelöst (ihre Prüfung ist erfüllt) */
    solved(id) {
      if (!api) return;
      const b = api.doc.stations.flatMap(s => s.blocks).find(x => x.type === 'apptask' && x.id === id);
      if (b && !api.prog.solved[b.id]) done(b);
    },
    event(n) {
      if (!api) return;
      count[n] = (count[n] || 0) + 1;
      const open = api.doc.stations.flatMap(s => s.blocks).filter(b => b.type === 'apptask' && b.event === n && !api.prog.solved[b.id]);
      for (const b of open) if (count[n] >= (+b.count || 1)) done(b);
    },
  };
}
export const pappPlugin = {
  id: 'papp', name: 'Probe-App',
  css: '.pa-vorlage{font:12.5px/1.4 ui-monospace,Menlo,monospace;background:var(--surface-2,#f3f3f3);padding:8px;border-radius:8px;white-space:pre-wrap;overflow-x:auto;margin-top:8px}',
  blocks: {
    apptask: {
      n: 'App-Aufgabe', ic: '🧩', g: 'App', h: 'Gelöst, wenn die App links ein bestimmtes Ereignis meldet oder die Prüfung zur Vorlage erfüllt ist', openForm: true,
      make: () => ({ title: '', html: '', event: '', count: 1, vorlage: '', pruefung: '', xp: 20, tips: [], solution: '', solHide: true, img: '' }),
      check: () => true,
      label: b => b.title || 'die App-Aufgabe',
      render(b, x) {
        const ev = (x.host.appEvents || []).find(e => e.name === b.event), task = !!(b.vorlage || b.pruefung);
        const hint = b.event ? `Die App links prüft: ${esc(ev?.text || b.event)}${+b.count > 1 ? ` (${+b.count}×)` : ''}.`
          : task ? (b.pruefung ? 'Öffne die Aufgabe in der App – die App prüft deine Lösung.' : 'Öffne die Aufgabe in der App.') : '⚙ → Ereignis der App wählen oder Vorlage/Prüfung eintragen';
        const buttons = task && !x.prog.solved[b.id] ? '<button class="lp-btn" data-run="open">▶ In der App öffnen</button>' : '';
        let h = x.taskCard(b, { hint, buttons, where: '🧩 App' });
        if (task && x.E()) h = h.replace(/<\/div>$/, `<pre class="pa-vorlage">${b.vorlage ? 'Vorlage:\n' + esc(b.vorlage.length > 400 ? b.vorlage.slice(0, 400) + ' …' : b.vorlage) : ''}${b.pruefung ? `${b.vorlage ? '\n' : ''}Prüfung: ${esc(b.pruefung)}` : ''}</pre></div>`);
        return h;
      },
      run(a, b, x) { if (a === 'open') x.host.task ? x.host.task(b) : x.toast('Die App ist hier nicht verbunden.'); },
      exportAs: b => ({ type: 'task', id: b.id, title: b.title, html: b.html || '' }),
      form: [
        { k: 'title', l: 'Titel', t: 'text' },
        { k: 'event', l: 'Gelöst, wenn die App meldet …', t: 'pa-event' },
        { k: 'count', l: 'Wie oft? (meist 1)', t: 'number' },
        { k: 'vorlage', l: 'Vorlage für die App (optional – wird beim Öffnen der Aufgabe in die App geladen)', t: 'pa-vorlage', rows: 6 },
        { k: 'pruefung', l: 'Prüfung (optional – die App meldet „gelöst“, wenn sie erfüllt ist)', t: 'text' },
        { k: 'tips', l: 'Tipps (werden nacheinander aufgedeckt)', t: 'list', ph: 'Tipp', vis: 'tipsHide' },
        { k: 'solution', l: 'Lösung zum Aufdecken (leer = keine)', t: 'text' },
        { k: 'solHide', l: 'Lösung für Schüler sichtbar', t: 'shown', show: b => !!b.solution },
        { k: 'xp', l: 'XP', t: 'number' },
      ],
    },
  },
  fields: {
    'pa-vorlage': {
      html(f, v, b, x) {
        const fmt = x.host.appVorlagen ? `<span class="help">${esc(x.host.appVorlagen)}</span>` : '';
        return `<label>${esc(f.l)}${fmt}<textarea class="mono" data-k="${f.k}" rows="${f.rows || 5}" spellcheck="false" autocapitalize="off">${esc(v || '')}</textarea></label>
          <div class="row"><button class="take" data-pafile="${f.k}">⤒ Datei als Vorlage (z. B. .ggb)</button>${v ? `<button class="take" data-patry="1">▶ In der App ausprobieren</button>` : ''}</div>`;
      },
      click(d, b, draw, x) {
        if (d.patry) { x.host.task?.(b); return; }
        if (!d.pafile) return;
        const inp = document.createElement('input'); inp.type = 'file';
        inp.onchange = () => { const f = inp.files[0]; if (!f) return; if (f.size > 1.5e6) { x.toast('Die Datei ist zu groß (höchstens 1,5 MB).'); return; }
          const r = new FileReader(); r.onload = () => { b[d.pafile] = String(r.result); draw(); x.toast(`„${esc(f.name)}“ als Vorlage übernommen`); };
          if (/^text\/|json|xml|csv/.test(f.type) || /\.(txt|csv|json|xml)$/i.test(f.name)) r.readAsText(f); else r.readAsDataURL(f); };
        inp.click();
      },
    },
    'pa-event': {
      html(f, v, b, x) {
        const E = x.host.appEvents || [], has = E.some(e => e.name === v);
        return `<label>${esc(f.l)}<select data-k="${f.k}"><option value="">– Ereignis wählen –</option>${E.map(e => `<option value="${esc(e.name)}"${e.name === v ? ' selected' : ''}>${esc(e.text || e.name)} (${esc(e.name)})</option>`).join('')}${v && !has ? `<option value="${esc(v)}" selected>${esc(v)} (nicht im Steckbrief)</option>` : ''}</select></label>`;
      },
    },
  },
  text: {
    'app-aufgabe': {
      n: 'App-Aufgabe', type: 'apptask', alias: ['appaufgabe', 'app'], keys: ['ereignis', 'anzahl', 'vorlage', 'pruefung', 'tipp', 'loesung', 'xp'], fences: true,
      help: `### App-Aufgabe: Titel
Arbeitsauftrag, z. B. „Zieh den Zellkern an die richtige Stelle.“
Ereignis: zellkern-richtig      (Name aus der Liste der Ereignisse der App – genau so geschrieben)
Anzahl: 1                       (optional: wie oft das Ereignis kommen muss)
Tipp: …
XP: 20
– nur wenn die App Vorlagen bzw. Prüfungen kann (steht dann bei der App) – statt oder neben „Ereignis:“:
\`\`\`vorlage
(Inhalt der Vorlage genau im Format der App – wird beim Öffnen der Aufgabe in die App geladen)
\`\`\`
Prüfung: …                      (Bedingung im Format der App; die App meldet „gelöst“, wenn sie erfüllt ist)`,
      make(S, H) {
        const vf = (S.code || []).find(c => c.lang === 'vorlage' || /^vorlage$/i.test(c.tag));
        const b = { type: 'apptask', title: S.title, html: H.md(S.body), event: (S.one('ereignis') || '').trim().toLowerCase(), count: S.num('anzahl', 1),
          vorlage: vf ? vf.code : (S.one('vorlage') || '').trim(), pruefung: (S.one('pruefung') || '').trim(),
          xp: S.num('xp', 20), tips: S.all('tipp').map(H.inline || (t => t)), solution: S.one('loesung') ? (H.inline || (t => t))(S.one('loesung')) : '', img: '' };
        if (!b.event && !b.pruefung) H.warn(S.line, `App-Aufgabe „${S.title}“: Es fehlt „Ereignis:“ oder „Prüfung:“ – sonst kann die App sie nicht lösen.`);
        return H.hideDefaults ? H.hideDefaults(b, S) : b;
      },
      toText(b, { md }) {
        return [`### App-Aufgabe: ${md(b.title || '')}`, md(b.html || ''), b.event ? `Ereignis: ${b.event}` : '', +b.count > 1 ? `Anzahl: ${+b.count}` : '',
          b.vorlage ? '```vorlage\n' + b.vorlage + '\n```' : '', b.pruefung ? `Prüfung: ${b.pruefung}` : '',
          ...(b.tips || []).map(t => `Tipp: ${md(t)}`), b.solution ? `Lösung: ${md(b.solution)}` : '', `XP: ${b.xp ?? 20}`].filter(Boolean).join('\n');
      },
    },
  },
};

/** Regeln für die KI, die zu einer App den Lernpfad schreibt (kommt in den Prompt) */
export function appPromptRules(m) {
  return appPromptRaw(m).replace(/\n{2,}/g, '\n');
}
function appPromptRaw(m) {
  return `APP-LERNUMGEBUNG „${m.name}“: Links neben dem Lernpfad läuft die interaktive App „${m.name}“${m.beschreibung ? ` – ${m.beschreibung}` : ''}.
- Baue in die Stationen „### App-Aufgabe“-Abschnitte (Format siehe unten): Die Schüler tun etwas in der App, die App meldet ein Ereignis, und die Aufgabe ist gelöst.
${m.events.length ? `- Verwende NUR diese Ereignisse der App (Name genau so schreiben):
${m.events.map(e => `  • ${e.name} – ${e.text || ''}`).join('\n')}` : '- Die App meldet keine festen Ereignisse – App-Aufgaben arbeiten hier mit Vorlage und Prüfung.'}
${m.vorlagen ? `- VORLAGEN: Diese App lädt zu jeder App-Aufgabe eine Vorlage (\`\`\`vorlage-Block in der App-Aufgabe). Format: ${m.vorlagen}${m.vorlageBeispiel ? `
  Beispiel:
${m.vorlageBeispiel.split('\n').map(l => '    ' + l).join('\n')}` : ''}
- Gib jeder App-Aufgabe, in der die Schüler etwas Neues in der App tun, eine passende Vorlage – genau im Format der App.` : ''}
${m.pruefung ? `- PRÜFUNG: Die App prüft selbst, ob eine App-Aufgabe gelöst ist („Prüfung:“-Zeile). Format: ${m.pruefung}${m.pruefungBeispiel ? ` – Beispiel: Prüfung: ${m.pruefungBeispiel}` : ''}
- App-Aufgaben mit „Prüfung:“ brauchen kein „Ereignis:“. Die Prüfung muss zur Vorlage und zum Arbeitsauftrag passen und eindeutig erfüllbar sein.` : ''}
- Erkläre im Lernpfad, was die Schüler in der App tun sollen (die App selbst erklärt wenig); ergänze Quiz, Lückentexte und Zuordnungen zum Verständnis.
${m.regeln ? m.regeln.split('\n').map(l => l.trim() ? `- ${l.replace(/^[-•]\s*/, '')}` : '').filter(Boolean).join('\n') + '\n' : ''}`;
}

/** Prompt für eine andere KI, die eine neue Probe-App baut („＋ Eigene Probe-App“). Enthält den vollständigen Vertrag:
 *  was die App können MUSS und was sie NICHT darf – sonst läuft sie im Player nicht oder ist für die Lehrkraft nicht beobachtbar. */
export function appBuildPrompt({ name = '', fach = '', jg = '', beschreibung = '', ideen = '' } = {}) {
  return `Du baust eine PROBE-APP: eine kleine, interaktive Lern-App als EINE HTML-Datei für iPads im Unterricht (Plattform Probe/PathFinder).
Im Unterricht läuft sie links neben einem Lernpfad oder einer Challenge. Der Lernpfad erklärt und stellt Aufgaben („App-Aufgaben“);
die App ist die Fläche zum Ausprobieren und meldet dem Lernpfad, was die Schüler tun. Die Lehrkraft sieht den Stand jedes Schülers live
(die App wird bei ihr mit dem gespeicherten Stand schreibgeschützt geöffnet). Die App wird nach dem Erstellen automatisch geprüft
(„Probe-Check“) – hält sie sich nicht an die Regeln unten, wird sie abgelehnt.

DIE APP
- Name: ${name || '[Name der App]'}
- Fach: ${fach || 'alle Fächer'}${jg ? `, Jahrgangsstufe ${jg}` : ''}
- Was sie können soll: ${beschreibung || '[Beschreibung]'}
${ideen ? `- Hinweise der Lehrkraft: ${ideen}\n` : ''}
DIE APP DARF NICHT (sie läuft in einem abgeschotteten Rahmen ohne Internet – alles davon ist dort gesperrt und lässt die App scheitern)
- etwas aus dem Internet laden: keine Bibliotheken, Skripte, CDNs, Webfonts, Bilder, Videos, iframes oder Karten von außen,
  kein fetch, XMLHttpRequest, WebSocket, import() von URLs, keine Web Worker aus Dateien. Alles steckt in dieser EINEN Datei.
- sich auf Werkzeuge stützen, die nur online laufen (z. B. GeoGebra, Desmos, YouTube, Google Maps, Three.js vom CDN). Wenn die Idee so ein
  Werkzeug braucht: das Nötige selbst bauen (SVG, Canvas, eigenes kleines JavaScript) oder weglassen – und in „regeln“ ehrlich notieren,
  was die App kann und was nicht.
- Browser-Speicher benutzen (localStorage, sessionStorage, IndexedDB, Cookies) – den Stand verwaltet der Player.
- alert(), confirm(), prompt(), window.open, Links mit target="_blank", Formulare, die etwas senden, oder top/parent.location.
- Namen, Fotos oder andere personenbezogene Daten abfragen.

DIE APP MUSS
1. Das Probe-Protokoll sprechen (window.parent.postMessage, alle Nachrichten mit type: 'probe-app') – nimm dafür genau dieses Gerüst
   und fülle die mit ★ markierten Stellen:

   <script>
   let state = null, readonly = false, loaded = false, task = null;
   const send = m => parent.postMessage(Object.assign({ type: 'probe-app' }, m), '*');
   const hi = setInterval(() => { if (!loaded) send({ action: 'ready', v: 2 }); else clearInterval(hi); }, 1000); send({ action: 'ready', v: 2 });
   addEventListener('message', e => {
     const m = e.data; if (!m || m.type !== 'probe-app') return;
     if (m.action === 'load') { loaded = true; readonly = !!m.readonly; state = m.state || neuerStand(); zeigeStand(); }
     if (m.action === 'flush') send({ action: 'state', state, summary: zusammenfassung(), req: m.req });
     if (m.action === 'task') { task = m.task; ladeVorlage(task); }                  // nur wenn die App Vorlagen kann (siehe 4.)
   });
   function speichern() { if (!readonly) send({ action: 'state', state, summary: zusammenfassung() }); }   // nach JEDER Änderung aufrufen
   function ereignis(name) { if (!readonly) send({ action: 'event', name }); }       // Namen genau wie im Steckbrief
   function geloest() { if (!readonly && task) send({ action: 'solved', task: task.id }); } // die Prüfung der geöffneten Aufgabe ist erfüllt
   function neuerStand() { return { /* ★ Anfangszustand */ }; }
   function zeigeStand() { /* ★ die GANZE Ansicht aus state aufbauen – auch Auswahl, Modus, offene Ansicht */ }
   function zusammenfassung() { return { pct: /* ★ 0–100 */ 0, text: /* ★ z. B. '5 von 8 richtig' */ '' }; }
   </script>

2. Den Stand vollständig in „state“ halten (kleines JSON, deutlich unter 200 kB, keine Bilder darin): Wird ein gespeicherter Stand geladen,
   sieht alles genau so aus wie vorher – das gilt auch für die Lehrkraft, die so live zuschaut. Gibt man der App einen geladenen Stand
   wieder ab („flush“), muss er unverändert zurückkommen.
3. Bei readonly (Nur ansehen: Lehrkraft, beendete Einheit) nichts verändern lassen: Eingaben, Ziehen und Knöpfe sperren (sichtbar, z. B.
   abgeblendet), keine „state“-, „event“- oder „solved“-Nachrichten schicken.
4. Prüfbares melden – mindestens eines davon:
   a) Ereignisse: 3–10 sinnvolle Ereignisse („event“) für Momente, die eine App-Aufgabe prüfen kann (z. B. „zellkern-richtig“, „alle-richtig“).
      Namen klein, ohne Leerzeichen und Umlaute. Ein Ereignis darf mehrfach kommen.
   b) Vorlagen und Prüfungen (wenn Aufgaben unterschiedliche Ausgangslagen brauchen, z. B. Konstruktionen, Datensätze, Startwerte):
      Bei „task“ lädt die App task.vorlage (Text in einem Format, das DU festlegst und im Steckbrief beschreibst – oder eine data:-URL
      einer Datei) und merkt sich task.pruefung (eine Bedingung in einem Format, das DU festlegst). Ist die Bedingung erfüllt: geloest().
      Der Stand jeder Aufgabe bleibt erhalten (z. B. state.aufgaben[task.id]), damit man zurückkehren kann.
5. Einen sichtbaren „Neu beginnen“-Knopf (setzt den Stand zurück, mit Rückfrage IN der App).
6. iPad-tauglich: Bedienung mit dem Finger (Pointer-Events: pointerdown/pointermove/pointerup, touch-action: none auf Zieh-Flächen), große
   Ziele (mind. 44 px), passt sich der Breite an (die App bekommt etwa die halbe Bildschirmbreite, 400–700 px, Höhe 600–900 px), kein Scrollen
   der ganzen Seite nötig, keine Information nur per Mausüber.
7. Deutsch, Schüler werden mit „du“ angesprochen, kurze Texte; die App erklärt nur das Nötigste (Erklärungen stehen im Lernpfad).
   Klare, freundliche Gestaltung, gut lesbar, auch für Farbenblinde unterscheidbar (nicht nur Rot/Grün).
8. Robust: keine Fehler in der Konsole; unbekannte oder leere Stände führen zu einem sauberen Neustart statt zu einem Absturz.
9. Den Steckbrief im HTML (genau so, gültiges JSON):
   <script type="application/json" id="probe-app">
   { "name": "…", "icon": "ein Emoji", "beschreibung": "1–2 Sätze, was man in der App tut", "fach": "${fach}", "jg": "${jg}", "version": "1",
     "events": [ { "name": "kurzer-name", "text": "was dieses Ereignis bedeutet" } ],
     "summary": "was der Fortschritt in Prozent bedeutet",
     "regeln": "Hinweise für die KI, die später Lernpfade zur App schreibt: was die App kann und was nicht, Fachbegriffe, Bedienung",
     "vorlagen": "nur bei 4b: Format der Vorlage, genau genug, dass eine andere KI gültige Vorlagen schreiben kann",
     "vorlageBeispiel": "nur bei 4b: eine vollständige, gültige Beispiel-Vorlage",
     "pruefung": "nur bei 4b: Format der Prüfung",
     "pruefungBeispiel": "nur bei 4b: eine gültige Beispiel-Prüfung zur Beispiel-Vorlage",
     "demo": "PFLICHT: der Demo-Lernpfad (siehe 10.) als JSON-Text, Zeilenumbrüche als \\n" }
   </script>
   Felder, die nicht zutreffen, weglassen. Der Probe-Check lädt das Vorlage-Beispiel und den Demo-Lernpfad zur Probe.
10. Einen kleinen DEMO-LERNPFAD mitbringen (Pflicht, Feld „demo“): Lehrkräfte öffnen ihn mit „Demo ansehen“, um die App kennenzulernen.
   1–2 Stationen, die die Grundfunktionen der App vorstellen: kurz erklären, was man in der App tut, dann 2–4 „### App-Aufgabe“-Abschnitte,
   die genau die Ereignisse (und ggf. Vorlagen/Prüfungen) der App nutzen, dazu höchstens ein kurzes Quiz. Format (PathFinder-Textformat):
   # Titel der Demo
   Art: Lernpfad
   Kopfbild: anhang:kopf
   Kopfbild-Art: klein          (oder: Hintergrund)
   ## Station: Titel der Station
   Kurzer Erklärtext (Markdown, **fett** erlaubt).
   ### App-Aufgabe: Titel
   Arbeitsauftrag in einem Satz.
   Ereignis: name-aus-events
   Tipp: kleiner Hinweis
   XP: 10
   (bei Vorlagen statt oder neben „Ereignis:“ einen Block \`\`\`vorlage … \`\`\` und eine Zeile „Prüfung: …“)
   ### Quiz
   ? Frage
   [x] richtige Antwort
   [ ] falsche Antwort
   ## Anhang
   kopf: <svg viewBox="0 0 200 200" …>…</svg>
   Das Kopfbild ist Pflicht: ein selbst gezeichnetes SVG, das zur App passt – bei „klein“ ein klares quadratisches Motiv (viewBox 0 0 200 200),
   bei „Hintergrund“ eine breite, ruhige Szene (viewBox 0 0 1200 400, gedeckte Farben); kein Logo, keine Schrift, keine externen Quellen.

BEVOR DU ANTWORTEST – prüfe selbst:
- Kein „http“ in src, href oder url(); kein fetch/XMLHttpRequest/localStorage/alert in deinem Code.
- „ready“ kommt sofort und wiederholt sich, bis „load“ kam; „flush“ wird immer sofort mit derselben req beantwortet.
- Jede Änderung ruft speichern() auf; zeigeStand() baut aus einem geladenen Stand die komplette Ansicht.
- readonly sperrt alles; alle Ereignisnamen stehen genau so im Steckbrief.
- Der Demo-Lernpfad steht im Steckbrief („demo“), ist gültiges JSON (Zeilenumbrüche als \\n, Anführungszeichen maskiert) und benutzt nur Ereignisse aus „events“.

AUSGABE
- Die komplette HTML-Datei in EINEM Codeblock (oder als Datei „app.html“), ohne Text davor oder danach.`;
}

/** Korrektur-Prompt, wenn der Probe-Check Fehler findet: an dieselbe KI zurückgeben */
export function appFixPrompt(res) {
  return `Der Probe-Check hat deine Probe-App geprüft und diese Punkte gefunden. Korrigiere GENAU diese Punkte und halte dich weiter an alle
Regeln aus meiner ersten Nachricht (eine Datei, nichts aus dem Internet, Probe-Protokoll mit ready/load/state/flush/event, readonly, Steckbrief).
${res.errors.length ? `\nFEHLER (müssen weg):\n${res.errors.map(e => '- ' + e).join('\n')}\n` : ''}${res.warnings.length ? `\nHINWEISE (bitte auch beheben):\n${res.warnings.map(e => '- ' + e).join('\n')}\n` : ''}
Gib wieder die komplette HTML-Datei in EINEM Codeblock aus, ohne Text davor oder danach.`;
}
