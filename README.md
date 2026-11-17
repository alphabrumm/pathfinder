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

## Digitale Prüfung

Neben „Lernpfad“ und „Challenge“ gibt es das Format **Digitale Prüfung** (`doc.form = 'pruefung'`, 📂 Dokumente → ＋ Neue digitale Prüfung
oder ⚙ Einstellungen → Art). Es ist die Grundlage für die Prüfungsplattform **Probe**:

* Eine neue Prüfung beginnt mit der Wahl: **aus einem Lernpfad** (Aufgaben übernehmen oder von der KI neue Aufgaben zu seinem Inhalt
  schreiben lassen), **mit KI** oder **leer**. Der Lernpfad selbst bleibt unverändert.
* `index.html?nur=pruefung` zeigt PathFinder so, wie er in Probe eingebettet ist: nur Prüfungen, Lernpfade werden beim Öffnen zur Prüfung.
* Vorgaben für den KI-Dialog: `?fach=Physik&jg=8&min=45` (statt `jg` auch `klasse=8b`, dazu `kopf=…` für die Kopfzeile) bzw.
  `startPathFinder({ ki: { fach, jg, min, kopf } })` – Fach, Jahrgangsstufe und Umfang sind dann schon ausgefüllt.
* Eingebettet: `startPathFinder({ forms: ['pruefung'], doc, startDialog: true, lernpfadStorage: 'pathfinder', host: { saved(doc), done(doc), doneLabel } })`
* Schreibgeschützt: `readOnly: true` (optional `readOnlyLabel`) – Bearbeiten-Ansicht mit Lösungen und Punkten ohne Werkzeuge, nichts lässt sich ändern, nichts wird gespeichert; die Vorschau zum Ausprobieren bleibt
  – `saved` bekommt jede Änderung, der Knopf „✓ Fertig“ ruft `done` auf (vorher Prüfung auf fehlende Lösungen); „Dokumente“ ist dann ausgeblendet.
* Ohne Probe: ⋯ → Export → „Prüfungsdatei für Probe (.json)“; die Datei lässt sich über 📂 Dokumente → Datei öffnen wieder laden.

* Punkte für jede Aufgabe, keine Tipps, Lösungen, Sperren oder Zertifikat. Neuer Baustein **Freitext** mit Erwartungshorizont
  (Teilaspekte mit Punkten). Aufgaben mit Ergebnis werden automatisch bewertet, Aufgaben ohne Ergebnis und Freitexte von der Lehrkraft.
* In der Vorschau (und bei Schülern) gibt es **keine Rückmeldung**: Die Antworten werden nur erfasst (`prog.ans`).
  „Abgeben“ zeigt im Editor eine Probe-Auswertung, ein „Protokoll (PDF)“ mit allen Antworten und Prüfcode entsteht jederzeit offline.
* `core/pfsplit.js` zerlegt eine Prüfung in eine **Schülerfassung ohne Lösungen** und einen **Lösungsschlüssel** (`splitExam`)
  und bewertet Antworten mit Teilpunkten, auf halbe Punkte abgerundet (`gradeExam`); dazu der Notenschlüssel (`gradeFor`, `pointsFor`).
  Tests: `node tools/test-pfsplit.mjs`.
* Abspielen für die Plattform: `startPathFinder({ player: true, doc: schuelerfassung, answers, host: { onAnswer, submit, studentName, examToken } })`.
* Textformat und KI-Prompts kennen „Art: Prüfung“, „### Freitext“ mit „Erwartung: … (Punkte)“ und „Punkte: n“ je Aufgabe.
* HTML- und SCORM-Export sind für Prüfungen gesperrt, weil die Datei die Lösungen enthielte.

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
