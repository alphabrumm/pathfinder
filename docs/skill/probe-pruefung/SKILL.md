---
name: probe-pruefung
description: Digitale Prüfungen für Probe (probe.pandapy.de) im PathFinder-Textformat erstellen, prüfen oder überarbeiten und Fragen zu Probe beantworten – bei Schulaufgaben, Kurzarbeiten, Stegreifaufgaben oder Tests, die in Probe laufen sollen.
---

# Probe-Prüfungen

Erzeugt aus alphabrumm/pathfinder (`tools/doku.mjs`, PathFinder 2026-11-25a). Die Spezifikation unten ist dieselbe, die Probe
als „Prompt für externe KI“ anzeigt. Weicht etwas vom aktuellen Probe-Verhalten ab, gilt der Code in alphabrumm/pathfinder
(`core/pftext.js`, `core/pfsplit.js`).

## Arbeitsweise

1. **Angaben klären.** Fehlt etwas davon, frage in EINER kurzen Nachricht nach: Fach, Jahrgangsstufe und Schulart; Thema bzw.
   Lernbereich (gern mit Lehrplanbezug) und Inhalte; Bearbeitungszeit; gewünschte Aufgabenarten (Liste unten anbieten);
   Anteil der Anforderungsbereiche (Vorschlag 40/40/20); Arbeitsmaterial (Arbeitsblätter, Hefteinträge, Fotos). Was schon
   genannt wurde, nicht erneut fragen. Liegt Material vor, darauf aufbauen und nichts prüfen, was weder im Material noch im
   Lehrplanbezug vorkommt.
2. **Prüfung schreiben** – exakt nach der Spezifikation unten.
3. **Selbst prüfen**, bevor du sie ausgibst: jede Aufgabe hat `Punkte:`; Freitext-Erwartungen ergeben in Summe die Punkte;
   jede gewählte Aufgabenart kommt vor; keine Lösung steht im Aufgabentext; Umfang passt zur Bearbeitungszeit
   (grob 1 Punkt je Minute bei geschlossenen Aufgaben, mehr Zeit für Freitext); Anhang-Verweise `anhang:name` existieren.
4. **Ausgeben:** Kannst du Dateien erzeugen, liefere `pruefung.txt` als Datei und nenne in einer Zeile Gesamtpunkte und
   Aufgabenzahl. Sonst den kompletten Text in EINEM Codeblock (vier Backticks, `text`), ohne Text davor oder danach.
5. **Überarbeiten:** Bekommst du eine bestehende Prüfung (Text oder `.probe.json`), ändere nur das Gewünschte und gib die
   vollständige Prüfung wieder im Textformat aus. Bei Fehlermeldungen aus Probe („Zeile n: …“) genau diese Stellen korrigieren.

## In Probe laden

1. In Probe eine **neue Prüfung** anlegen (Klasse, Fach, Art, Zeit) – der Editor (PathFinder) öffnet sich.
2. **Fertige Prüfung laden** wählen und den Text einfügen oder die Datei `pruefung.txt` wählen
   (Bilder als zusätzliche Dateien oder im Abschnitt `## Anhang`). Probe prüft den Text sofort und zeigt Fehler mit Zeilennummer.
3. **Als neue Prüfung öffnen**, im Editor Aufgaben und Punkte kontrollieren, fertigstellen.

Weitere Wege: Im „…“-Menü des Editors sichert **Diese Prüfung sichern** eine Prüfung als `.probe.json` (mit Lösungen).
Diese Datei lädt man ebenfalls über **Fertige Prüfung laden** – sie wird eine neue, eigenständige Prüfung (z. B. Nachschrift).
Unter „Prompt für externe KI anzeigen“ zeigt Probe genau die Spezifikation aus diesem Dokument zum Kopieren.

## Spezifikation

Du erstellst eine DIGITALE PRÜFUNG (Leistungsnachweis) für die Plattform PathFinder (App: Probe). Die Schüler bearbeiten sie am iPad ohne Rückmeldung; bewertet wird erst nach der Abgabe – geschlossene Aufgaben automatisch, Freitexte von der Lehrkraft.

THEMA, FACH, ZIELGRUPPE, UMFANG: laut Antwort der Lehrkraft auf deine Rückfrage

REGELN
- WICHTIG – alles in EINEN kopierbaren Textblock: Der komplette Lernpfad samt Anhang mit allen Grafiken steht in einem einzigen Codeblock, damit die Lehrkraft nur einmal kopieren und einfügen muss. Beginne den Block mit vier Backticks und „text“ (````text) und beende ihn mit vier Backticks (````), damit Code-Beispiele darin den Block nicht vorzeitig schließen. Kein Text davor oder danach, nichts auf mehrere Blöcke oder Nachrichten verteilen.
- Halte dich exakt an das unten beschriebene PathFinder-Textformat, damit der Lernpfad ohne Nacharbeit eingelesen werden kann.
- Wenn du Dateien zum Herunterladen erzeugen kannst, liefere denselben Inhalt zusätzlich als eine Textdatei „pruefung.txt“.
- Sprache: Deutsch, Schüler werden mit „du“ angesprochen, kurze Sätze.
- Schreibe im Kopf die Zeile „Kopfzeile: <Fach> · <Jahrgangsstufe>“ (mit den Angaben der Lehrkraft).
- Schreibe im Kopf die Zeile „Art: Prüfung“.
- KEINE Erklärungen, Merkkästen, Figuren, Tipps, Lösungen zum Aufdecken oder Sperren – nur kurze Arbeitsanweisungen, Material (Texte, Tabellen, Abbildungen) und Aufgaben.
- Gliedere die Prüfung in Stationen als Teilaufgaben oder Themenblöcke (z. B. „## Station: Teil A | Grundwissen“).
- Gib JEDER Aufgabe (Aufgabe, Quiz, Lückentext, Zuordnen, Markieren, Sortieren, Satzpuzzle, Reihenfolge, Freitext, JPad) eine Zeile „Punkte: n“. Die Punkte spiegeln den Aufwand; ein Quiz bekommt etwa 1 Punkt je Frage, ein Lückentext etwa 1 Punkt je Lücke oder je zwei Lücken, Markieren und Sortieren etwa 1 Punkt je zwei Wörter bzw. Begriffe, ein Satzpuzzle 1–2 Punkte.
- Rechenaufgaben mit eindeutigem Ergebnis als „### Aufgabe“ mit „Antwort:“ (Zahl, ohne Einheit, mehrere richtige mit | trennen) – sie werden automatisch bewertet. Schreibe die erwartete Einheit in den Auftrag.
- Offene Aufgaben (erklären, begründen, beschreiben, beurteilen) als „### Freitext“ mit Erwartungshorizont: mehrere Zeilen „Erwartung: … (Punkte)“; die Summe ergibt die Punkte der Aufgabe.
- AUFGABENARTEN – verwende die Arten, die die Lehrkraft gewählt hat, und zwar JEDE mindestens einmal; ohne Vorgabe eine abwechslungsreiche, zum Thema passende Auswahl (Lösungsschritte nur bei Rechenwegen):
  • Multiple Choice: „### Quiz“ – Fragen mit genau einer richtigen Antwort und plausiblen falschen Antworten
  • Lückentext mit Begriffen: „### Lückentext“ mit „Wortbank: ja“ und zwei bis drei Ablenkern unter „Extra:“
  • Lückentext zum Eintippen: „### Lückentext“ ohne Wortbank (Schüler tippen; eindeutige Fachbegriffe, alle richtigen Schreibweisen mit | angeben)
  • Zuordnen: „### Zuordnen“ mit vier bis sechs Paaren
  • Lösungsschritte mit Drag & Drop: „### Lückentext“ mit „Wortbank: ja“: ein Rechenweg (z. B. ein Gleichungssystem mit I und II) Schritt für Schritt, jeder Schritt in einer eigenen Zeile; Terme, Zahlen und Rechenzeichen sind Lücken [[…]], unter „Extra:“ zwei bis drei falsche Bausteine als Ablenker; Malpunkt · statt *, Hochzahlen als ² und ³, negative Zahlen ohne Leerzeichen nach dem Minus; möglichst nur eine Seite einer Gleichung als Lücke (z. B. „3x = [[9]]“) – stehen beide Seiten ganz als Lücken da („[[3x]] = [[9]]“), wird auch die vertauschte Reihenfolge als richtig gewertet
  • Rechnen / kurze Antwort: „### Aufgabe“ mit „Antwort:“ (Zahl ohne Einheit oder ein Wort; mehrere richtige mit | trennen) – die erwartete Einheit steht im Auftrag
  • Im Text markieren: „### Markieren: Arbeitsauftrag“ mit einem kurzen Text; die richtigen Wörter stehen in {{…}} (3–6 Zielwörter; im Text auch ähnliche Wörter, die NICHT markiert werden dürfen)
  • In Gruppen sortieren: „### Sortieren“ mit 2–4 Gruppen und je 2–5 eindeutig zuzuordnenden Begriffen (je Zeile „Gruppe: Begriff, Begriff“)
  • Satzpuzzle: „### Satzpuzzle“ – ein Satz in einer Zeile, Teile mit „ / “ getrennt (feste Wendungen wie „to London“ als ein Teil); jede weitere korrekte Wortstellung als Zeile „Auch richtig: …“ mit denselben Teilen; das erste Wort klein schreiben (außer Namen und „I“), ohne Satzzeichen am Ende – PathFinder schreibt den Satzanfang selbst groß
  • Textpuzzle (Reihenfolge): „### Reihenfolge“ – 4–6 Abschnitte, Sätze oder Dialogzeilen, je Zeile einer, in der richtigen Reihenfolge; die Reihenfolge muss eindeutig sein (Signalwörter, Handlungsablauf)
  • Experiment (Erkenntnisgewinnung): „### Widget: Experiment“ – die Schüler planen und messen selbst: „Frage:“, „Untersuche: <Symbol der untersuchten Größe>“, zwei bis drei „Größe:“-Zeilen mit je 3 Werten OHNE „| fest“ (die faire Messreihe zu planen ist Teil der Leistung), „Ergebnis:“ mit physikalisch richtiger Rechenvorschrift, „Auswertung:“ als Lückentext (Je-desto-Satz, Proportionalität) mit zwei Ablenkern unter „Extra:“; keine „Hypothese:“- und „Schlussfolgerung:“-Zeilen – die Hypothese mit Begründung davor als „### Freitext“, eine Vorhersage danach als „### Aufgabe“ mit „Antwort:“; Punkte: 2 für die Messreihe plus 1 je Auswertungslücke
  • Freitext: „### Freitext“ mit Erwartungshorizont aus mehreren Zeilen „Erwartung: … (Punkte)“
  • Programmieren in JPad: „### JPad: Titel“ – die Schüler programmieren in JPad (Java): kurzer Auftrag, Startcode als ```java start Klassenname … ``` (optional, je Datei ein Block), „Ausgabe:“ mit der erwarteten Programmausgabe (Teil der Ausgabe genügt) und/oder „Muss:“ für Pflicht-Code (z. B. while); Musterlösung als ```java lösung … ``` (sieht nur die Lehrkraft). Ohne „Erwartung:“-Zeilen wird automatisch nach Ausgabe und Pflicht-Code bewertet; mit „Erwartung: … (Punkte)“ bewertet die Lehrkraft. Java wie in JPad üblich: println() und print() ohne System.out, Wrapper-Typen Integer, Double, Boolean, Character statt int, double, boolean, char
- Anforderungsbereiche: wie von der Lehrkraft angegeben, sonst etwa 40 % der Punkte Reproduktion (AFB I), 40 % Anwendung und Transfer (AFB II), 20 % Problemlösen und Beurteilen (AFB III); von leicht nach schwer.
- Quizfragen mit genau einer richtigen Antwort und plausiblen falschen Antworten; Rückmeldungen nach // sind nicht nötig.
- Lückentexte ohne Wortbank werden tolerant bewertet (Groß/Klein egal); mehrdeutige Lücken vermeiden oder alle richtigen Antworten mit | angeben.
- Aufgaben mit eindeutiger Lösung bekommen eine „Antwort:“-Zeile, damit sie automatisch geprüft werden.
- Bilder und Animationen: Zeichne passende Abbildungen selbst als SVG – im Abschnitt ## Anhang am Ende als „name: <svg …> … </svg>“, oben mit anhang:name einbinden. SVG darf animiert sein (<animate>, <animateTransform>, <animateMotion> oder CSS-@keyframes in <style> innerhalb des SVG). Immer viewBox angeben, gut lesbare Schrift (font-family="sans-serif"), keine Skripte, keine externen Links, Schriften oder Bilder. Lieber wenige, aussagekräftige Grafiken (z. B. Schaubild, Ablauf, Beispiel-Tabelle) als Deko.
- Rasterbilder (PNG, GIF, JPG) nur als data:image/…;base64,…, und nur wenn du die Datei wirklich erzeugt hast (z. B. mit einem Code-Werkzeug) – niemals Base64 ausdenken. Sonst ein Bild-Platzhalter: ![Beschreibung]()
- Keine Bilder aus dem Internet.
- Innerhalb eines ###-Abschnitts (Aufgabe, Quiz, Lückentext, Zuordnen …) keine Bild-Zeilen und keine Infokästen: Sie beenden den Abschnitt. Bilder und Kästen gehören davor oder dahinter (bei Aufgaben stattdessen „Bild: anhang:name“). Normaler Text nach einem Abschnitt steht nach einer Leerzeile.
- Im Lückentext ist JEDE [[Lücke]] eine Antwort, die Schüler einsetzen müssen – Arbeitsanweisungen ohne Lücken als normalen Text vor den Abschnitt schreiben.

FORMAT (PathFinder-Text):
# Titel des Lernpfads
Untertitel: kurze Unterzeile
Art: Lernpfad            (oder: Challenge, Prüfung)
Farbe: 
Schrift: Pixel | schlicht | elegant | Handwriting
Ziele:
- Lernziel 1
- Lernziel 2
Kopfbild: anhang:logo          (optional, Bild aus dem Anhang)
Kopfbild-Art: klein | groß | Hintergrund | kein
Titel-Animation: tippen | einblenden | glitch | leuchten   (optional, ebenso Untertitel-Animation)
Seiten: Stationen              (optional: jede Station auf einer eigenen Seite mit „Weiter“ und „Zurück“)

Aufdecken: schrittweise        (optional, nicht in Prüfungen: in allen Stationen erscheint der nächste Baustein erst, wenn die Aufgabe davor gelöst ist)

## Station: Titel der Station | kurze Unterzeile
Animation: einblenden          (optional, direkt nach der Stationszeile: Animation des Stationstitels)
Aufdecken: schrittweise        (optional, direkt nach der Stationszeile: nur in dieser Station Schritt für Schritt aufdecken)
Normaler Text. Leerzeile = neuer Absatz. **fett**, *kursiv*, `Code`, Listen mit „- “.
Sparsam hervorheben: [Text]{rot} (auch orange, grün, blau, lila, grau), [Text]{markiert} (auch markiert-grün, -blau, -rosa), [Text]{groß} (auch klein, sehr-groß), [Text]{unterstrichen} – kombinierbar: [Text]{rot groß}.
Indizes und Hochzahlen: v_A, v_{End}, m/s^2, 10^{-3}   (ein Zeichen ohne Klammern, mehrere in { })
[Überschrift 1] Zwischenüberschrift   (auch [Überschrift 2] und [Überschrift 3]: kleinere Überschriften innerhalb einer Station)

[Merke] Wichtiger Merksatz.          (auch: [Tipp], [Achtung], [Begriff: Wort], [Regel], [Abschluss])
[Figur: Aha] Eine Figur sagt etwas.  (Figuren: Nachdenken, Aha, Achtung – davor optional „Smiley“ oder „Pixel“ für einen anderen Stil – und Ente)
[Figur: anhang:roboter | Robo] Eigene Figur mit Bild aus dem Anhang und Namen.
{ausgeblendet}           (eigene Zeile vor einem Baustein: Schüler sehen ihn nicht, er zählt nicht)
{tippen} Text mit Animation (vor einem Absatz oder Infokasten: {tippen}, {einblenden}, {glitch}, {leuchten})

![Bildunterschrift](anhang:diagramm)        Bild aus dem Anhang (mit „| klein“ nach der Unterschrift kleiner)

### Aufgabe: Titel
Auftrag für die Schüler.
Antwort: 12,60          (optional: genaue Antwort → wird automatisch geprüft; Zahl oder kurzes Wort)
Tipp: erster Tipp       (beliebig viele Tipp-Zeilen, vom kleinen zum großen Tipp)
Lösung: Musterlösung
Bild: anhang:skizze     (optional: Bild zur Aufgabe)
                        („Tipp (verborgen):“ bzw. „Lösung (verborgen):“ = nur für die Lehrkraft, Schüler sehen sie nicht)
XP: 20

### Quiz
? Frage
[x] richtige Antwort // Rückmeldung (optional)
[ ] falsche Antwort // warum falsch
? zweite Frage …

### Lückentext: Titel
Satz mit [[Lücke]] und [[Antwort|andere erlaubte Antwort]].
Wortbank: ja            (optional: Begriffe zum Ziehen)
Extra: Ablenker, Ablenker   (optional: falsche Begriffe in der Wortbank)
Hefteintrag: ja         (optional: gestaltet wie eine Heftseite mit dem Titel als Überschrift – gut für einen Screenshot ins Heft;
                         statt „ja“ auch Hintergrund und Schrift, z. B. „kariert, Handschrift“: liniert | kariert | ohne Linien, Pixel | Standard | Elegant | Handschrift)
Frei: ja                (optional, z. B. für eine Hypothese: jede Wahl zählt; die Wortbank zeigt alle Möglichkeiten aus [[a|b|c]])

### Zuordnen: Ordne zu
Begriff -> Erklärung
Begriff -> Erklärung

### Markieren: Markiere alle Verben im simple past.
Yesterday I {{went}} to the park and {{played}} football. It is sunny today.
                        (die richtigen Wörter in {{…}}; Schüler tippen sie im Text an – mehrere Wörter: {{has been}})

### Sortieren: Sortiere die Wörter.
regular verbs: play, watch, visit
irregular verbs: go, see, buy
                        (je Zeile eine Gruppe „Gruppe: Begriff, Begriff“; Schüler sehen alle Begriffe gemischt)

### Satzpuzzle: Bring die Wörter in die richtige Reihenfolge.
I / have / never / been / to London
Auch richtig: never / have / I / been / to London   (optional: weitere korrekte Reihenfolgen mit denselben Teilen; Satzanfang klein, ohne Schlusspunkt – PathFinder schreibt ihn groß)

### Reihenfolge: Bring die Geschichte in die richtige Reihenfolge.
- Tom woke up early.
- He had breakfast.
- Then he went to school.
                        (je Zeile ein Abschnitt oder eine Dialogzeile, in der richtigen Reihenfolge – Schüler sehen sie gemischt)

### Freitext: Titel       (nur in Prüfungen: offene Antwort, die die Lehrkraft bewertet)
Aufgabenstellung.
Erwartung: erster Teilaspekt der erwarteten Antwort (2)   (Erwartungshorizont, Zahl in Klammern = Punkte)
Erwartung: zweiter Teilaspekt (1)
Zeilen: 6               (optional: Höhe des Antwortfelds)

### JPad: Titel         (nur in Prüfungen: Programmieraufgabe, die Schüler in JPad bearbeiten)
Arbeitsauftrag.
Ausgabe: Start in 3 2 1  (optional: was das Programm ausgeben soll; mehrzeilig als ```text ausgabe … ```)
Vergleich: enthält | gleich   (Standard: enthält – Leerzeichen und Zeilenumbrüche zählen nicht)
Muss: while              (optional, mehrfach: muss im Code vorkommen)
Erwartung: Teilaspekt (2)   (optional: Erwartungshorizont – dann bewertet die Lehrkraft, die Prüfungen oben sind nur Hinweise)
Projekt: Rakete          (optional: JPad-Aufgaben mit demselben Projekt bauen aufeinander auf – jede startet mit einer Kopie des Codes der Aufgabe davor und wird mit ihrem eigenen Stand bewertet; Startcode nur bei der ersten)
```java start Rakete
Startcode (optional, je Datei ein Block; Name nach „start“, sonst Klassenname bzw. Hauptprogramm)
```
```java lösung
Musterlösung (nur für die Lehrkraft)
```
Punkte: 6               (ohne Erwartungshorizont: Punkte × Anteil erfüllter Prüfungen)

Punkte: 2               (in jeder Aufgabe, jedem Quiz, Lückentext, Zuordnen, Markieren, Sortieren, Satzpuzzle, jeder Reihenfolge oder JPad-Aufgabe: Punkte für diese Aufgabe)

### Aufdecken: Mehr erfahren
Text, der erst nach Antippen erscheint.

### Widget: Experiment     (Lernpfad: Schritt für Schritt Hypothese → Experiment → Auswertung → Schlussfolgerung mit Rückmeldung;
                          Prüfung: alles auf einmal ohne Rückmeldung – bewertet werden die Messreihe und die Auswertung, keine Schlussfolgerung)
Frage: Wie hängt Δv von der Kraft ab?
Hypothese: Wenn stärker geschoben wird, dann [[wird Δv größer|wird Δv kleiner|bleibt Δv gleich]].
                        (jede Wahl zählt; die erste Möglichkeit ist das, was die Messung zeigt – sie wird nach dem Messen verglichen)
Größe: Kraft F in N = Isaac 30, Anne 60, Vater 90      (Name, Symbol, Einheit = Werte zum Auswählen, gern mit Namen)
Größe: Masse m in kg = 30 (leer), 60 (1 Sack) | fest   („| fest“: bleibt in dieser Messreihe gleich – faire Messreihe)
Größe: Einwirkungsdauer Δt in s = 1, 2, 3 | fest
Untersuche: F            (optional: Symbol der untersuchten Größe; sonst die erste Größe ohne „| fest“)
Ergebnis: Zusatzgeschwindigkeit Δv in m/s = F · Δt / m   (Rechenvorschrift mit den Symbolen, + − · / und Klammern)
Animation: Wagen        (optional: Wagen wird angeschoben – braucht Größen in N, kg und s; ohne: Messanzeige)
Auswertung: Je größer die Kraft, desto [[größer]] ist Δv.   (Lückentext nach dem Messen, mehrere Zeilen möglich)
Extra: kleiner, halb    (Ablenker für die Auswertung)
Schlussfolgerung: Δv ist proportional zur Kraft.   (erscheint am Ende als Merksatz)
XP: 30

### Widget: HTML | Titel    (nicht in Prüfungen; eigene kleine Web-App, läuft geschützt in einem Rahmen und passt ihre Höhe selbst an)
Erledigt: ja            (optional: zählt als Aufgabe – das HTML ruft pfDone() auf, wenn die Schüler fertig sind)
```html
<button onclick="pfDone()">Fertig</button>
```

### UML: Klassenname
- attribut: Typ
+ methode()

```java
Programmcode (Sprache nach den drei Backticks)
```
(```java ohne-knopf: Code nur zum Anschauen, ohne Knopf zum Übernehmen – z. B. wenn er schon im Projekt steht oder eine Aufgabe verraten würde)

| Kopf | Kopf |
| --- | --- |
| Zelle | Zelle |

--- Sperre ---          (alles danach in der Station erst frei, wenn die Aufgabe davor gelöst ist)
--- Seite ---           (Seitenumbruch: ab hier eine neue Seite mit „Weiter“ und „Zurück“; Kopf und Stationstitel stehen auf jeder Seite)

## Anhang               (immer ganz am Ende, im selben Textblock: Bilder, auf die oben mit anhang:name verwiesen wird)
diagramm: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160">
  …  (SVG darf über mehrere Zeilen gehen, endet mit </svg>)
</svg>
foto: data:image/png;base64,iVBORw0KGgo…

## Bewertung in Probe

Probe bewertet nach der Abgabe; die Schüler bekommen während der Prüfung keine Rückmeldung.

| Aufgabenart | automatisch bewertet nach |
| --- | --- |
| Quiz | je Frage richtig/falsch |
| Lückentext | je Lücke; ohne Wortbank tolerant (Groß/Klein egal, Alternativen mit `\|`); bei `[[a]] = [[b]]` zählt auch die vertauschte Reihenfolge |
| Zuordnen | je Paar |
| Aufgabe mit `Antwort:` | richtig/falsch (Zahl oder Wort, Alternativen mit `\|`) |
| Markieren | je Zielwort; jedes fälschlich markierte Wort zählt als zusätzlicher Fehler |
| Sortieren | je Begriff |
| Satzpuzzle, Reihenfolge | je Teil an richtiger Stelle (längste richtige Teilfolge), beste der erlaubten Lösungen |
| Freitext | von der Lehrkraft, mit Erwartungshorizont |
| JPad | ohne `Erwartung:` automatisch je Prüfung (Ausgabe des letzten Programmlaufs, jeder `Muss:`-Code); mit `Erwartung:` von der Lehrkraft – die Prüfungen sind dann nur Hinweise |
| Experiment | je Teil: verschiedene Werte für die untersuchte Größe, faire Messreihe (nur diese Größe verändert), jede Auswertungslücke; die Hypothese wird nur festgehalten |

**Teilpunkte:** Punkte der Aufgabe × Anteil richtiger Teile, auf halbe Punkte abgerundet.
Die Lehrkraft kann nachträglich weitere Antworten akzeptieren, Punkte überschreiben oder Aufgaben streichen.
**Notenschlüssel** (Standard, anpassbar): ab 20 % Note 5, 40 % Note 4, 55 % Note 3, 70 % Note 2, 85 % Note 1.

## Probe kurz erklärt

- **Was:** Prüfungsplattform für iPads im Klassenzimmer (probe.pandapy.de, Repo alphabrumm/probe), PHP + SQLite auf Webspace.
  Prüfungen entstehen im eingebetteten PathFinder (nur Format „Prüfung“). Schüler brauchen kein Konto (QR-Code + Einlass-PIN).
- **Rollen:** Admin (Konten, Fachschaften, Schuljahresende), Fachleitung (Respizienz), Lehrkraft.
- **Prüfungsarten:** Schulaufgabe, Kurzarbeit, AKL, Übungsprüfung.
- **Durchführung:** Live-Liste, Zeit verlängern, automatische Abgabe, Schließen; nach dem Schließen keine Nachreichung übers Netz,
  bei Netzausfall Notfall-Abgabe per Datei (AirDrop an die Lehrkraft).
- **Datenschutz:** Alles wird im Browser verschlüsselt (WebCrypto, ECDH P-256 je Lehrkraft). Schüler-Geräte bekommen nur eine
  Fassung **ohne Lösungen**; Lösungen, Antworten und Klassenliste liegen nur verschlüsselt auf dem Server.
- **Auswertung:** Notenschlüssel per Regler, Freitext bewerten, Ergebnisseiten mit Ergebniscode, Prüfungsprotokoll (PDF).
- **Respizienz:** Lehrkraft reicht bei der Fachleitung ein (für sie verschlüsselt) → Rückfrage ⇄ erneut eingereicht → abgezeichnet;
  Archiv-Export verschlüsselt für Fachleitung, Admins und optional eine Passphrase.
