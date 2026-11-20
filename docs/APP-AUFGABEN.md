# App-Aufgaben in Prüfungen (JPad, QPad, FlowPad)

Eine App-Aufgabe lässt Schüler in einer eigenen Web-App arbeiten (z. B. Java in JPad), während sie eine Prüfung in Probe
schreiben. Die App öffnet sich als Vollbild-Fenster über der Prüfung (iframe). Die **Prüfung hält den Stand**: Dateien und
letzter Programmlauf sind die Antwort der Aufgabe und werden wie alle Antworten verschlüsselt gespeichert und abgegeben.
Die App ist nur das Werkzeug und speichert nichts, was die Prüfung braucht.

## Bausteine

| Teil | Datei | Aufgabe |
| --- | --- | --- |
| Textformat | `core/pftext.js` (`appSection`) | `### JPad: Titel` mit `Ausgabe:`, `Vergleich:`, `Muss:`, `Erwartung:`, `Projekt:`, ```` ```java start Name ```` , ```` ```java lösung ```` |
| Baustein `app` | `core/pathfinder.js` | Editor (⚙-Formular, „In JPad ausprobieren“), Schüleransicht, Antwort speichern, Protokoll; `appBase`: Aufgaben mit gleichem `Projekt:` starten mit einer Kopie des Stands der Aufgabe davor und haben danach ihren eigenen Stand (Hinweis + „Code von dort übernehmen“, wenn die Aufgabe davor später geändert wurde). Erst eine echte Änderung oder ein Programmlauf macht eine Aufgabe „beantwortet“ (`codeSig`). |
| Fenster + Protokoll | `core/pfapp.js` | `APPS` (Name, Symbol, Standardadresse), `openApp`, `flushApp`, `closeApp` |
| Bewertung | `core/pfsplit.js` | Schülerfassung ohne erwartete Ausgabe/Pflicht-Code/Musterlösung; `appParts`, `appText`, `appMode` |
| Plattform | Probe | Adressen (`config.local.php` → `apps`), Abgabe holt den letzten Stand, Auswertung zeigt Code und öffnet ihn in der App |

## Protokoll „pf-app“ (Version 1)

Die App wird mit `?pfapp=1` geöffnet und spricht per `postMessage` mit der Prüfung:

| Richtung | Meldung | Bedeutung |
| --- | --- | --- |
| App → Prüfung | `{ type:'pf-app', action:'ready', app, v:1 }` | App bereit (wiederholen, bis `load` kommt) |
| Prüfung → App | `{ action:'load', task, title, files:[{name,text}], readonly, info? }` | Aufgabe laden; Dateien ersetzen den Inhalt. `info.html` = Aufgabenstellung als HTML-Seite (`taskPage` in pfapp.js; beim gemeinsamen Projekt alle Aufgaben, die geöffnete hervorgehoben) – die App zeigt sie neben dem Code (JPad: Reiter „Aufgabe“) |
| App → Prüfung | `{ action:'state', task, files, run? }` | nach Änderungen (gebündelt) und nach jedem Lauf: `run = { output, error }` |
| Prüfung → App | `{ action:'flush', req }` | sofort `state` mit demselben `req` schicken (vor Abgabe/Schließen) |
| Prüfung → App | `{ action:'stop' }` | laufendes Programm anhalten (Fenster geschlossen) |

Regeln für die App im Prüfungsmodus:
- `state` nur an die Herkunft (`origin`) der `load`-Meldung schicken, nie an `*`.
- Keine Projektliste, kein Öffnen/Sichern von Dateien, keine Lernpfade, keine Links zu Lösungen.
- Eigenes, verstecktes Arbeitsprojekt; das „aktuelle Projekt“ der App außerhalb der Prüfung bleibt unverändert.
- `readonly`: Anzeigen und Ausführen erlaubt, aber keine `state`-Meldungen (Lehrkraft bei der Korrektur).

## Neue App anbinden (z. B. QPad, FlowPad)

1. **pfapp.js**: Eintrag in `APPS` mit Standardadresse (`url`), Sprache und Name der Startdatei (`main`).
2. **pftext.js**: Abschnitt gibt es schon (`### QPad:`, `### FlowPad:`); falls die App andere Startdateien hat, `appFileName` anpassen.
3. **pfsplit.js**: Bewertung über Ausgabe und Pflicht-Code passt für textbasierte Apps; für SQL ggf. eine eigene Prüfung
   (z. B. Ergebnistabelle statt Textausgabe) als weiteren Teil in `appParts` – die App schickt dann `run.output` als Text der Tabelle.
4. **pathfinder.js**: Auswahl im ⚙-Formular „App“ freischalten (Hinweis „noch nicht verfügbar“ entfernen), ggf. `EXAM_STYLES` in
   `pftext.js` um die App ergänzen und `node tools/doku.mjs` ausführen (Skill „probe-pruefung“ aktualisieren).
5. **App**: Prüfungsmodus `?pfapp` wie in JPad (`src/jpad/App.ts`, Abschnitt „Prüfungsmodus“): `ready` senden, `load` übernehmen,
   `state` nach Änderungen und Läufen, `flush`/`stop` beantworten.
6. **Prüfungsfassung in Probe**: In Prüfungen läuft jede App **innerhalb der Probe-Domain** in einem eigenen Unterordner
   (JPad: `probe.pandapy.de/jpad/`, ebenso FlowPad, QPad, wEOS). Dann muss während der Prüfung nur die Probe-Domain frei sein,
   und was Schüler in der normalen App gespeichert haben, ist dort nicht erreichbar (Browser-Speicher je Domain). Dafür:
   - eigener Build der App als Prüfungsfassung: ohne Lernpfade, Hilfen und Beispielprojekte; startet nur mit `?pfapp`, in einem
     Rahmen und nur, wenn die Seite drumherum von derselben Domain stammt (JPad: `src/jpad/JPadStarter.ts`, `npm run build-jpad-pruefung`);
   - der Webspace-Workflow der App überträgt sie zusätzlich nach `PROBE_FTP_DIR` (= Probe-Ordner + `/<app>/`), aus demselben
     getesteten Build (JPad: `jpad-pages.yml` + `jpad-webspace.yml`);
   - in Probe `APPS_DEFAULT` in `api.php` um `'<app>' => '<app>/'` ergänzen. Probe löscht beim Ausspielen keine fremden Ordner.
7. **Testen**: zuerst auf der Testinstanz von Probe (`git push origin <zweig>:test`), die die Test-Fassung der App öffnet
   (Adresse über die Repository-Variable bzw. `config.deploy.php`); erst danach live.

Ein Ersatz-App-Skelett zum Testen ohne echte App: eine HTML-Seite, die `ready` schickt, bei `load` die Dateien in ein Textfeld
schreibt und bei Eingabe bzw. „Run“ `state` (mit `run`) zurückschickt – so lässt sich die ganze Kette in Probe prüfen.
