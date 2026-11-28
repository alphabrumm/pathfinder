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
//
// Steckbrief (Pflicht: name, events): name, icon (ein Emoji), beschreibung, fach (leer = alle Fächer), jg (z. B. "5-7"), version,
// events: [{ name, text }], summary (was „pct“ bedeutet), layout ('geteilt' | 'nur-app'), regeln (Hinweise für die KI, die den
// Lernpfad dazu schreibt), lernpfad (optional: PathFinder-Dokument als eingebauter Beispiel-Lernpfad).

export const PAPP_VERSION = 1;
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
    ...(typeof raw?.lernpfadText === 'string' && raw.lernpfadText.trim() ? { lernpfadText: raw.lernpfadText.slice(0, 60000) } : {}), // eingebauter Lernpfad im PathFinder-Textformat
  };
  if (!m.name) errors.push('Im Steckbrief fehlt „name“.');
  if (!m.events.length) warnings.push('Im Steckbrief stehen keine Ereignisse („events“) – App-Aufgaben im Lernpfad können dann nichts prüfen.');
  if (!m.beschreibung) warnings.push('Im Steckbrief fehlt eine „beschreibung“ – die KI weiß dann wenig über die App.');
  return { m, errors, warnings };
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
    + `<script>addEventListener('error',function(e){try{parent.postMessage({type:'probe-app',action:'error',msg:String(e.message||e)},'*')}catch(x){}});</script>`;
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
export function mountApp(el, { html, state = null, readonly = false, onState, onEvent, onError, onReady } = {}) {
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
      if (!cur.readonly) { cur.state = st; onState?.(st, sum); }
      return;
    }
    if (m.action === 'event' && !cur.readonly) { onEvent?.(String(m.name ?? '').slice(0, 40).toLowerCase(), m.data); return; }
    if (m.action === 'error') onError?.(String(m.msg ?? '').slice(0, 300));
  };
  addEventListener('message', on);
  return {
    frame: ifr,
    load(state, readonly = cur.readonly) { cur = { state, readonly }; if (loaded) post({ action: 'load', state, readonly: !!readonly }); },
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
  if (/\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|navigator\.sendBeacon/.test(h)) warnings.push('Die App versucht Netzwerkzugriffe (fetch, XMLHttpRequest …) – im Player sind sie gesperrt und schlagen fehl.');
  if (/localStorage|sessionStorage|indexedDB/.test(h)) warnings.push('Die App nutzt Browser-Speicher (localStorage …) – im Player gibt es ihn nicht. Den Stand bitte nur über „state“ an den Player melden.');
  if (!/probe-app/.test(h.replace(/<script[^>]*id=["']probe-app["'][\s\S]*?<\/script>/i, ''))) errors.push('Die App spricht das Probe-Protokoll nicht (postMessage mit type „probe-app“: ready, load, state, event).');
  if (errors.length && errors.some(e => /HTML-Seite|zu groß/.test(e))) return { ok: false, errors, warnings, m };
  // Probelauf
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-3000px;top:0;width:1024px;height:700px;opacity:0;pointer-events:none';
  document.body.appendChild(box);
  const errs = [], states = [], events = [];
  let ready = false;
  const app = mountApp(box, { html: h, onReady: () => { ready = true; }, onState: (s, sum) => states.push({ s, sum }), onEvent: n => events.push(n), onError: e => errs.push(e) });
  const until = (f, ms) => new Promise(ok => { const t0 = Date.now(), iv = setInterval(() => { if (f() || Date.now() - t0 > ms) { clearInterval(iv); ok(f()); } }, 100); });
  await until(() => ready, timeout);
  if (!ready) errors.push(`Die App meldet sich nicht (keine Nachricht „ready“ innerhalb von ${Math.round(timeout / 1000)} s).`);
  else {
    await new Promise(r => setTimeout(r, 900));
    const f = await app.flush(1500);
    if (!f) warnings.push('Die App antwortet nicht auf „flush“ – vor dem Schließen kann der letzte Stand fehlen.');
    else if (f.state != null) { app.load(f.state, false); await new Promise(r => setTimeout(r, 600)); } // gespeicherten Stand wieder laden
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
export function createAppHost({ events = [], name = 'App' } = {}) {
  let api = null; const count = {};
  return {
    name, appEvents: events,
    attach(a) { api = a; },
    event(n) {
      if (!api) return;
      count[n] = (count[n] || 0) + 1;
      const open = api.doc.stations.flatMap(s => s.blocks).filter(b => b.type === 'apptask' && b.event === n && !api.prog.solved[b.id]);
      for (const b of open) {
        if (count[n] < (+b.count || 1)) continue;
        if (api.mode === 'preview' || !api.E()) api.solve(b.id); else api.toast(`✓ App: „${esc(b.title || 'App-Aufgabe')}“ wäre jetzt gelöst (in der Vorschau zählt es)`);
      }
    },
  };
}
export const pappPlugin = {
  id: 'papp', name: 'Probe-App',
  blocks: {
    apptask: {
      n: 'App-Aufgabe', ic: '🧩', g: 'App', h: 'Gelöst, wenn die App links ein bestimmtes Ereignis meldet', openForm: true,
      make: () => ({ title: '', html: '', event: '', count: 1, xp: 20, tips: [], solution: '', solHide: true, img: '' }),
      check: () => true,
      label: b => b.title || 'die App-Aufgabe',
      render(b, x) {
        const ev = (x.host.appEvents || []).find(e => e.name === b.event);
        const hint = b.event ? `Die App links prüft: ${esc(ev?.text || b.event)}${+b.count > 1 ? ` (${+b.count}×)` : ''}.` : '⚙ → Ereignis der App wählen';
        return x.taskCard(b, { hint, where: '🧩 App' });
      },
      exportAs: b => ({ type: 'task', id: b.id, title: b.title, html: b.html || '' }),
      form: [
        { k: 'title', l: 'Titel', t: 'text' },
        { k: 'event', l: 'Gelöst, wenn die App meldet …', t: 'pa-event' },
        { k: 'count', l: 'Wie oft? (meist 1)', t: 'number' },
        { k: 'tips', l: 'Tipps (werden nacheinander aufgedeckt)', t: 'list', ph: 'Tipp', vis: 'tipsHide' },
        { k: 'solution', l: 'Lösung zum Aufdecken (leer = keine)', t: 'text' },
        { k: 'solHide', l: 'Lösung für Schüler sichtbar', t: 'shown', show: b => !!b.solution },
        { k: 'xp', l: 'XP', t: 'number' },
      ],
    },
  },
  fields: {
    'pa-event': {
      html(f, v, b, x) {
        const E = x.host.appEvents || [], has = E.some(e => e.name === v);
        return `<label>${esc(f.l)}<select data-k="${f.k}"><option value="">– Ereignis wählen –</option>${E.map(e => `<option value="${esc(e.name)}"${e.name === v ? ' selected' : ''}>${esc(e.text || e.name)} (${esc(e.name)})</option>`).join('')}${v && !has ? `<option value="${esc(v)}" selected>${esc(v)} (nicht im Steckbrief)</option>` : ''}</select></label>`;
      },
    },
  },
  text: {
    'app-aufgabe': {
      n: 'App-Aufgabe', type: 'apptask', alias: ['appaufgabe', 'app'], keys: ['ereignis', 'anzahl', 'tipp', 'loesung', 'xp'],
      help: `### App-Aufgabe: Titel
Arbeitsauftrag, z. B. „Zieh den Zellkern an die richtige Stelle.“
Ereignis: zellkern-richtig      (Name aus der Liste der Ereignisse der App – genau so geschrieben)
Anzahl: 1                       (optional: wie oft das Ereignis kommen muss)
Tipp: …
XP: 20`,
      make(S, H) {
        const b = { type: 'apptask', title: S.title, html: H.md(S.body), event: (S.one('ereignis') || '').trim().toLowerCase(), count: S.num('anzahl', 1),
          xp: S.num('xp', 20), tips: S.all('tipp').map(H.inline || (t => t)), solution: S.one('loesung') ? (H.inline || (t => t))(S.one('loesung')) : '', img: '' };
        if (!b.event) H.warn(S.line, `App-Aufgabe „${S.title}“: Es fehlt „Ereignis:“ – sonst kann die App sie nicht lösen.`);
        return H.hideDefaults ? H.hideDefaults(b, S) : b;
      },
      toText(b, { md }) {
        return [`### App-Aufgabe: ${md(b.title || '')}`, md(b.html || ''), `Ereignis: ${b.event || ''}`, +b.count > 1 ? `Anzahl: ${+b.count}` : '',
          ...(b.tips || []).map(t => `Tipp: ${md(t)}`), b.solution ? `Lösung: ${md(b.solution)}` : '', `XP: ${b.xp ?? 20}`].filter(Boolean).join('\n');
      },
    },
  },
};

/** Regeln für die KI, die zu einer App den Lernpfad schreibt (kommt in den Prompt) */
export function appPromptRules(m) {
  return `APP-LERNUMGEBUNG „${m.name}“: Links neben dem Lernpfad läuft die interaktive App „${m.name}“${m.beschreibung ? ` – ${m.beschreibung}` : ''}.
- Baue in die Stationen „### App-Aufgabe“-Abschnitte (Format siehe unten): Die Schüler tun etwas in der App, die App meldet ein Ereignis, und die Aufgabe ist gelöst.
- Verwende NUR diese Ereignisse der App (Name genau so schreiben):
${m.events.map(e => `  • ${e.name} – ${e.text || ''}`).join('\n')}
- Erkläre im Lernpfad, was die Schüler in der App tun sollen (die App selbst erklärt wenig); ergänze Quiz, Lückentexte und Zuordnungen zum Verständnis.
${m.regeln ? m.regeln.split('\n').map(l => l.trim() ? `- ${l.replace(/^[-•]\s*/, '')}` : '').filter(Boolean).join('\n') + '\n' : ''}`;
}

/** Prompt für eine andere KI, die eine neue Probe-App baut („Beschreibe deine Probe-App“) */
export function appBuildPrompt({ name = '', fach = '', jg = '', beschreibung = '', ideen = '' } = {}) {
  return `Du baust eine PROBE-APP: eine kleine, interaktive Lern-App als EINE HTML-Datei für iPads im Unterricht (Plattform Probe/PathFinder).
Sie läuft links neben einem Lernpfad. Der Lernpfad erklärt und stellt Aufgaben; die App ist die Fläche zum Ausprobieren.

DIE APP
- Name: ${name || '[Name der App]'}
- Fach: ${fach || 'ohne Zuordnung'}${jg ? `, Jahrgangsstufe ${jg}` : ''}
- Was sie können soll: ${beschreibung || '[Beschreibung]'}
${ideen ? `- Hinweise der Lehrkraft: ${ideen}\n` : ''}
TECHNISCHE REGELN (sonst läuft die App nicht)
- Genau EINE HTML-Datei mit allem darin: HTML, CSS, JavaScript, Bilder als SVG oder data:-URL. KEINE Dateien oder Bibliotheken aus dem Internet (kein CDN, keine Webfonts, kein fetch) – die App läuft ohne Netz in einem abgeschotteten Rahmen.
- Kein localStorage, sessionStorage oder IndexedDB, keine alert()/confirm()/prompt(), keine Pop-ups, keine Formulare, die etwas senden.
- iPad-tauglich: Bedienung mit dem Finger (Pointer-Events statt nur Maus; Drag & Drop mit pointerdown/pointermove/pointerup), große Ziele (mind. 44 px), passt sich der Breite an (sie bekommt etwa die halbe Bildschirmbreite, 400–700 px), keine Mausüber-Effekte als einzige Information.
- Deutsch, Schüler werden mit „du“ angesprochen, kurze Texte. Freundliche, klare Gestaltung; die App selbst erklärt nur das Nötigste.
- Steckbrief im HTML (genau so, gültiges JSON):
  <script type="application/json" id="probe-app">
  { "name": "…", "icon": "ein Emoji", "beschreibung": "1–2 Sätze, was man in der App tut", "fach": "${fach}", "jg": "${jg}", "version": "1",
    "events": [ { "name": "kurzer-name", "text": "was dieses Ereignis bedeutet" } ],
    "summary": "was der Fortschritt in Prozent bedeutet",
    "regeln": "Hinweise für die KI, die später den Lernpfad zur App schreibt (Fachbegriffe, was die App kann und was nicht)" }
  </script>
  Ereignisnamen: klein, ohne Leerzeichen und Umlaute (z. B. „zellkern-richtig“, „alle-richtig“). 3–10 Ereignisse, die zu sinnvollen Aufgaben passen.

PROTOKOLL MIT DEM PLAYER (window.parent.postMessage(…, '*'), Nachrichten mit type: 'probe-app')
- Beim Start „ready“ schicken – jede Sekunde wiederholen, bis „load“ kommt:  parent.postMessage({ type: 'probe-app', action: 'ready', v: 1 }, '*')
- Auf „load“ hören: addEventListener('message', e => { const m = e.data; if (m && m.type === 'probe-app' && m.action === 'load') … })
  m.state = gespeicherter Stand (oder null = neu beginnen); m.readonly = true → nur ansehen, nichts verändern lassen.
- Nach jeder Änderung den Stand melden (kleines JSON, unter 200 kB) und den Fortschritt:
  parent.postMessage({ type: 'probe-app', action: 'state', state: {…}, summary: { pct: 0–100, text: 'z. B. 5 von 8 richtig' } }, '*')
- Bei „flush“ sofort „state“ mit derselben req schicken: if (m.action === 'flush') parent.postMessage({ type: 'probe-app', action: 'state', state, summary, req: m.req }, '*')
- Wenn etwas Lernrelevantes passiert, ein Ereignis melden: parent.postMessage({ type: 'probe-app', action: 'event', name: 'zellkern-richtig' }, '*')
  (genau die Namen aus dem Steckbrief; ein Ereignis darf mehrfach kommen)
- Einen „Neu beginnen“-Knopf, der den Stand zurücksetzt.

AUSGABE
- Die komplette HTML-Datei in EINEM Codeblock (oder als Datei „app.html“), ohne Text davor oder danach.`;
}
