# PathFinder – Lernpfade bauen

PathFinder ist ein Editor für interaktive Lernpfade: Stationen mit Texten, Infokästen, Bildern, Aufgaben,
Quiz, Lückentexten, Zuordnungen, Sperren, Seiten (Weiter/Zurück) und Zertifikat – direkt im Browser bearbeitet, so wie die Schüler
die Seite später sehen. Gebaut für das iPad (mit oder ohne Tastatur).

* **Alles lokal:** kein Login, kein Server, keine Daten an Dritte. Lernpfade werden im Browser gespeichert.
* **Design zum Zusammenklicken:** Lernpfad oder Challenge, 10 Farbpaletten, 3 Schriftstile, runde oder eckige Stationen,
  eigenes Kopfbild, Textanimationen.
* **Export** (⋯ → Export) als eigenständige HTML-Datei für Moodle/ByCS (läuft offline, Fortschritt im Browser) und als
  **SCORM-1.2-Lernpaket** für die Aktivität „Lernpaket“: Moodle speichert den Fortschritt und erhält Punkte, Bestanden/nicht bestanden,
  Bearbeitungszeit und die gelösten Aufgaben. App-Bausteine (z. B. FlowPad-Aufgaben) werden dabei zur Selbstkontrolle umgewandelt.

## Widgets und schrittweises Aufdecken (Lernpfad, Challenge)

* **Widget „Experiment“** (`### Widget: Experiment`, Baustein 🔬): führt Schritt für Schritt durch **Hypothese → Experiment → Auswertung → Schlussfolgerung**.
  Die Hypothese ist ein Lückentext, in dem jede Wahl zählt; im Experiment wählen die Schüler die Werte der Größen
  (`Größe: Kraft F in N = Isaac 30, Anne 60 | fest`), messen, und das Ergebnis wird aus der Rechenvorschrift berechnet
  (`Ergebnis: Δv in m/s = F · Δt / m`). Messprotokoll und Diagramm entstehen dabei; „| fest“ sperrt Größen für eine faire Messreihe.
  Nach der Messung wird die Hypothese verglichen, die Auswertung ist ein Lückentext, die Schlussfolgerung erscheint als Merksatz.
  `Animation: Wagen` zeigt eine Pixelfigur, die einen Wagen anschiebt (braucht Größen in N, kg und s).
* **Eigenes Widget** (`### Widget: HTML`, Baustein 🧩): eigenes HTML mit Skripten, läuft geschützt in einem Rahmen (sandbox, ohne
  Zugriff auf die Seite), passt seine Höhe selbst an und behält seinen Zustand beim Neuzeichnen. Mit `Erledigt: ja` zählt es als
  Aufgabe – das HTML ruft `pfDone()` auf.
* **Experiment in Prüfungen:** Dort erscheint alles auf einmal, ohne Rückmeldung, Sperren und Schlussfolgerung. Bewertet werden
  automatisch die Messreihe (genug verschiedene Werte für die untersuchte Größe, fair: nur diese Größe verändert) und die
  Auswertung je Lücke; die Hypothese wird nur festgehalten. `Untersuche: F` legt die untersuchte Größe fest; Größen ohne „| fest“
  lassen, damit das Planen Teil der Leistung ist. Die Schülerfassung enthält die Rechenvorschrift (zum Messen nötig), aber keine
  Antworten der Auswertung. Hypothese mit Begründung am besten als Freitext davor, eine Vorhersage als Aufgabe mit `Antwort:` danach.
* **Schrittweise aufdecken** (`Aufdecken: schrittweise` im Kopf oder direkt nach einer Stationszeile, ⚙ Station): Der nächste
  Baustein erscheint erst, wenn die Aufgabe davor gelöst ist.
* **Freie Lücken** (`Frei: ja` im Lückentext): jede Wahl zählt, die Wortbank zeigt alle Möglichkeiten aus `[[a|b|c]]` – z. B. für Hypothesen.
* **Indizes und Hochzahlen** im Text: `v_A`, `v_{End}`, `m/s^2`, `10^{-3}`.
* Normaler Text nach einem Quiz, Lückentext usw. ist erlaubt: Er steht nach einer Leerzeile und beendet den Abschnitt.

## Befragung

Vierte Art neben Lernpfad, Challenge und Prüfung (`doc.form = 'befragung'`, 📂 Dokumente → ＋ Neue Befragung): Umfragen,
Fragebögen, Selbstreflexion und Gesprächsbögen – Fragen ohne richtig oder falsch, ohne Punkte. Bausteine: **Skala**,
**Auswahl**, **Mehrfachauswahl**, **Ja/Nein**, **Raster** (mehrere Aussagen auf derselben Skala), **Offene Frage**, **Datum**,
**Einwilligung** (Weitergabe an die nächste Klassleitung) – dazu Text, Infokästen, Bilder, Tabellen; jede Station ist ein
Abschnitt. Je Frage optional „Hinweis“ und „Weitergabe“ (für Gesprächsbögen). Textformat: `### Skala:`, `### Auswahl:`,
`### Mehrfachauswahl:`, `### Ja/Nein:`, `### Raster:` (`Spalten: …`), `### Offene Frage:` (`Zeilen: n`), `### Datum:`,
`### Einwilligung:`; die KI erstellt Befragungen über KI-Tools → **Umfrage erstellen** (eigener Dialog: Titel, Zielgruppe,
was befragt werden soll, Material). Neue Befragungen bekommen den Stil **„Lumi“**
(wie die Lumi-Coaching-App: Nachthimmel mit Pixel-Sternen, Papierblatt, animierte Pixel-Eule als Kopfbild; immer hell;
wählbar unter ⚙ Einstellungen → Farbpalette). Eingebettet (`forms: ['befragung']`, z. B. Probe) gibt es „Abschicken“
(`host.submit`), Vorlagen im Startdialog (`opts.vorlagen`) und in `core/pfsurvey.js` `answersFromSvy`/`surveyStats` für die Auswertung. Ausgefüllt wird in Probe: `core/pfsurvey.js` →
`surveySpec(doc)` macht daraus die Vorlage (Fragen, Statistik-Felder, Einwilligung). Tests: `node tools/test-survey.mjs`.

## Digitale Prüfung

Neben „Lernpfad“ und „Challenge“ gibt es das Format **Digitale Prüfung** (`doc.form = 'pruefung'`, 📂 Dokumente → ＋ Neue digitale Prüfung
oder ⚙ Einstellungen → Art). Es ist die Grundlage für die Prüfungsplattform **Probe**:

* Eine neue Prüfung beginnt mit der Wahl: **aus einem Lernpfad** (Aufgaben übernehmen oder von der KI neue Aufgaben zu seinem Inhalt
  schreiben lassen), **mit KI**, **leer** oder als **fertige Prüfung laden** (Text im PathFinder-Format einfügen oder Datei wählen,
  z. B. von einer externen KI). Der Lernpfad selbst bleibt unverändert. Dort gibt es auch einen allgemeinen **Prompt für externe KI**:
  Die KI fragt zuerst nach Fach, Jahrgangsstufe, Thema, Zeit, Aufgabenarten und Material und liefert dann eine einlesbare Prüfung
  (`promptFor({ art: 'pruefung', ask: true }, env)`).
* `index.html?nur=pruefung` zeigt PathFinder so, wie er in Probe eingebettet ist: nur Prüfungen, Lernpfade werden beim Öffnen zur Prüfung.
* Vorgaben für den KI-Dialog: `?fach=Physik&jg=8&min=45` (statt `jg` auch `klasse=8b`, dazu `kopf=…` für die Kopfzeile) bzw.
  `startPathFinder({ ki: { fach, jg, min, kopf } })` – Fach, Jahrgangsstufe und Umfang sind dann schon ausgefüllt.
* Eingebettet: `startPathFinder({ forms: ['pruefung'], doc, startDialog: true, lernpfadStorage: 'pathfinder', examFromLernpfad: false (ohne Start „Aus einem Lernpfad“), host: { saved(doc), done(doc), doneLabel } })`
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

**Prüfungsformat:** [docs/PRUEFUNGSFORMAT.md](docs/PRUEFUNGSFORMAT.md) beschreibt Textformat, Aufgabenarten und Bewertung.
Dieselbe Spezifikation steckt im Claude-Skill [probe-pruefung](docs/skill/probe-pruefung/SKILL.md). Beides erzeugt
`node tools/doku.mjs` aus `core/pftext.js` – nach jeder Formatänderung ausführen und den Skill in Claude aktualisieren.

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
