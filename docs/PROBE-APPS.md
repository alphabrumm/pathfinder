# Probe-Apps

Eine **Probe-App** ist eine kleine, eigenständige Lern-App (eine einzige HTML-Datei), die im Modul Unterricht von Probe
**links neben einem Lernpfad oder einer Challenge** läuft. Die App meldet Ereignisse („Zellkern richtig beschriftet“);
**App-Aufgaben** im Lernpfad sind gelöst, wenn ein bestimmtes Ereignis (ggf. mehrmals) gemeldet wurde.

Code: `core/pfpapp.js` (Protokoll, Sandbox, Probe-Check, Block „App-Aufgabe“, Prompt für KIs).
Große Apps mit eigenem Layout (JPad, später QPad, FlowPad) nutzen weiter das pf-app-Protokoll (`docs/APP-AUFGABEN.md`).

## Steckbrief

Steht in der App-Datei:

```html
<script type="application/json" id="probe-app">
{ "name": "Zellaufbau", "icon": "🔬", "beschreibung": "Tier- und Pflanzenzelle beschriften",
  "fach": "Natur und Technik, Biologie", "jg": "5-8", "version": 1,
  "events": [ { "name": "zellkern-richtig", "text": "Zellkern richtig beschriftet" } ],
  "regeln": "Hinweise für eine KI, die einen Lernpfad zur App baut",
  "lernpfadText": "… optional: Beispiel-Lernpfad im PathFinder-Textformat …" }
</script>
```

- `fach`: Komma-Liste (leer = alle Fächer), `jg`: „5-8“, „ab 11“, „7“ (leer = alle).
- `lernpfad` (Dokument) oder `lernpfadText` (Textformat mit `### App-Aufgabe`, Schlüssel `Ereignis:` und `Anzahl:`).

## Protokoll (postMessage, `type: 'probe-app'`)

| Richtung | action | Daten |
|---|---|---|
| App → Probe | `ready` | – |
| Probe → App | `load` | `state` (oder `null`), `readonly` |
| App → Probe | `state` | `state` (JSON, klein halten), `summary {pct, text}` |
| App → Probe | `event` | `name`, `data` (optional) |
| Probe → App | `flush` | `req` → App antwortet mit `state` und demselben `req` |
| App → Probe | `error` | `msg` (wird vom Rahmen auch selbst gemeldet) |

## Sicherheit

- Die App läuft in `<iframe sandbox="allow-scripts" srcdoc>` (eigener, leerer Ursprung: kein Zugriff auf Probe, Cookies, Speicher).
- In die Datei wird eine CSP ohne Netz eingesetzt (`PAPP_CSP`): keine Verbindungen, keine Bilder/Schriften von außen.
- **Probe-Check** (`checkApp`): Größe (≤ 3 MB), Steckbrief, keine externen Quellen, kein `fetch`/`XMLHttpRequest`/`WebSocket`,
  kein `localStorage`/`indexedDB`, Protokoll vorhanden, Testlauf im versteckten Rahmen (meldet `ready`, keine Fehler).

## Eigene App mit KI

`appBuildPrompt({name, fach, jg, beschreibung, ideen})` liefert einen vollständigen Prompt für eine externe KI.
Die Antwort (HTML) wird in Probe eingefügt, geprüft und als eigene App der Lehrkraft gespeichert.
Im KI-Dialog von PathFinder (Schritt 2) erscheinen passende Apps (Fach/Jahrgangsstufe) als „Als …-Projekt realisieren“
(`opts.kiApps`), die Regeln der App kommen über `appPromptRules` in den Lernpfad-Prompt.

## Im PathFinder Player (Probe, `l.html`)

- **Lernpfad + App** (`form: 'papp'`, `{ app: {id, m, html}, lernpfad }`): links `mountApp`, rechts `startPathFinder` mit `pappPlugin`
  und `createAppHost`. Gespeichert wird `{ app: {state, summary}, sum, prog }`.
- Beendete Einheiten öffnet der Player mit `readonly: true` (nichts lösen, nichts melden); private Kopien mit `progress: …` und eigener
  Dokument-ID, damit sich der Stand nicht mit dem der Einheit mischt.
