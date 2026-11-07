# PathFinder – Lernpfade bauen

PathFinder ist ein Editor für interaktive Lernpfade: Stationen mit Texten, Infokästen, Bildern, Aufgaben,
Quiz, Lückentexten, Zuordnungen, Sperren und Zertifikat – direkt im Browser bearbeitet, so wie die Schüler
die Seite später sehen. Gebaut für das iPad (mit oder ohne Tastatur).

* **Alles lokal:** kein Login, kein Server, keine Daten an Dritte. Lernpfade werden im Browser gespeichert.
* **Design zum Zusammenklicken:** Lernpfad oder Challenge, 10 Farbpaletten, 3 Schriftstile, runde oder eckige Stationen,
  eigenes Kopfbild, Textanimationen.
* **Export** (⋯ → Export) als eigenständige HTML-Datei für Moodle/ByCS (läuft offline, Fortschritt im Browser) und als
  **SCORM-1.2-Lernpaket** für die Aktivität „Lernpaket“: Moodle speichert den Fortschritt und erhält Punkte, Bestanden/nicht bestanden,
  Bearbeitungszeit und die gelösten Aufgaben. App-Bausteine (z. B. FlowPad-Aufgaben) werden dabei zur Selbstkontrolle umgewandelt.

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

## Vorhandene Lernpfade übernehmen (Originaldesign)

📂 Öffnen → **HTML-Lernpfad importieren** übernimmt eine fertige Lernpfad-Seite. Das Aussehen bleibt genau wie im
Original (Farben, Schriften, Bilder, Animationen, eigene Skripte), die Inhalte werden Bausteine: Absätze, Listen und
Zwischenüberschriften als Text, `.note` als Infokasten, `.task` als Aufgabe, `.code[data-src]` als Code,
`.quiz[data-quiz]` als Quiz, Bilder mit Bildunterschrift als Bild. Interaktive Teile mit eigener Logik (z. B. Labore)
bleiben HTML-Bausteine. Quelltexte und Quizfragen stehen in der Seite als `const SRC = {…}` und `const QUIZ = {…}`;
PathFinder liest sie dort und schreibt sie beim Export zurück.

Erwartet wird der Aufbau `<section class="station">` mit `.station-head` (Nummer, `<small>`, `<h2>`) und `.done-row`.
Die exportierte Datei ist wieder die ursprüngliche Seite und enthält das Dokument (`#pf-doc`), damit sie sich später
erneut in PathFinder öffnen lässt. Code: `core/pfskin.js`.

## Bauen und veröffentlichen

```
node tools/build.mjs dist     # fertige App nach dist/
```

Jeder Push auf `main` veröffentlicht auf GitHub Pages (Settings → Pages → Source = „GitHub Actions“).
Auf den eigenen Webspace kommt ein getesteter Stand mit `git push origin main:live`
(Repository-Secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_DIR`).

Schriften: Atkinson Hyperlegible, Pixelify Sans (SIL OFL, in `fonts/`).
