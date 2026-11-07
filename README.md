# PathFinder – Lernpfade bauen

PathFinder ist ein Editor für interaktive Lernpfade: Stationen mit Texten, Infokästen, Bildern, Aufgaben,
Quiz, Lückentexten, Zuordnungen, Sperren und Zertifikat – direkt im Browser bearbeitet, so wie die Schüler
die Seite später sehen. Gebaut für das iPad (mit oder ohne Tastatur).

* **Alles lokal:** kein Login, kein Server, keine Daten an Dritte. Lernpfade werden im Browser gespeichert.
* **Design zum Zusammenklicken:** Lernpfad oder Challenge, 10 Farbpaletten, 3 Schriftstile, runde oder eckige Stationen,
  eigenes Kopfbild, Textanimationen.
* **Export** als eigenständige HTML-Datei (z. B. für Moodle/ByCS) und als SCORM-Lernpaket – in Arbeit.

## Kern und Erweiterungen

`core/pathfinder.js` ist der Kern und kennt keine App. Apps wie **FlowPad**, **JPad** oder **QPad** binden den Kern ein
(als Git-Submodul) und stecken eigene Bausteine als Erweiterung dazu – etwa FlowPad seine Rechenblätter und
Formel-/Diagramm-Aufgaben:

```js
import { startPathFinder } from './vendor/pathfinder/core/pathfinder.js';
startPathFinder({ plugins: [flowpadPlugin], host: { /* Verbindung zur App */ }, storage: 'flowpad.lernpfade' });
```

Eine Erweiterung ist ein Objekt `{ id, name, blocks, fields, migrate, css }` – Details stehen oben in `core/pathfinder.js`.
Bausteine einer App, die gerade nicht geladen ist, zeigt PathFinder als Kasten „braucht FlowPad“ an; nichts geht verloren.

## Bauen und veröffentlichen

```
node tools/build.mjs dist     # fertige App nach dist/
```

Jeder Push auf `main` veröffentlicht auf GitHub Pages (Settings → Pages → Source = „GitHub Actions“).
Auf den eigenen Webspace kommt ein getesteter Stand mit `git push origin main:live`
(Repository-Secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_DIR`).

Schriften: Atkinson Hyperlegible, Pixelify Sans (SIL OFL, in `fonts/`).
