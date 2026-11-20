#!/usr/bin/env node
// Erzeugt aus core/pftext.js (Textformat, Aufgabenstile, Prompt) die Doku zum Prüfungsformat und den Claude-Skill.
//   node tools/doku.mjs          → schreibt docs/PRUEFUNGSFORMAT.md und docs/skill/probe-pruefung/SKILL.md
//   node tools/doku.mjs --check  → meldet nur, ob die Dateien veraltet sind (Exit-Code 1)
// Nach jeder Änderung am Prüfungsformat ausführen und den Skill in Claude aktualisieren.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = await import(join(root, 'core/pftext.js'));
const build = (readFileSync(join(root, 'core/pathfinder.js'), 'utf8').match(/PF_BUILD = '([^']+)'/) || [])[1] || '?';
const env = { emptyDoc: () => ({ stations: [], design: {} }), palettes: [], figures: [], uid: () => 'x', plugins: [], isCheck: () => true, appName: 'Probe' };

// Spezifikation = der „Prompt für externe KI“ aus Probe, ohne die Rückfrage am Anfang
const full = T.promptFor({ art: 'pruefung', ask: true }, env);
const spec = full.slice(full.indexOf('Du erstellst eine DIGITALE PRÜFUNG')).trim();
const styles = T.EXAM_STYLES.map(s => `| ${s[1]} | ${s[3].replace(/\|/g, '\\|')} |`).join('\n');

const LADEN = `1. In Probe eine **neue Prüfung** anlegen (Klasse, Fach, Art, Zeit) – der Editor (PathFinder) öffnet sich.
2. **Fertige Prüfung laden** wählen und den Text einfügen oder die Datei \`pruefung.txt\` wählen
   (Bilder als zusätzliche Dateien oder im Abschnitt \`## Anhang\`). Probe prüft den Text sofort und zeigt Fehler mit Zeilennummer.
3. **Als neue Prüfung öffnen**, im Editor Aufgaben und Punkte kontrollieren, fertigstellen.

Weitere Wege: Im „…“-Menü des Editors sichert **Diese Prüfung sichern** eine Prüfung als \`.probe.json\` (mit Lösungen).
Diese Datei lädt man ebenfalls über **Fertige Prüfung laden** – sie wird eine neue, eigenständige Prüfung (z. B. Nachschrift).
Unter „Prompt für externe KI anzeigen“ zeigt Probe genau die Spezifikation aus diesem Dokument zum Kopieren.`;

const BEWERTUNG = `Probe bewertet nach der Abgabe; die Schüler bekommen während der Prüfung keine Rückmeldung.

| Aufgabenart | automatisch bewertet nach |
| --- | --- |
| Quiz | je Frage richtig/falsch |
| Lückentext | je Lücke; ohne Wortbank tolerant (Groß/Klein egal, Alternativen mit \`\\|\`); bei \`[[a]] = [[b]]\` zählt auch die vertauschte Reihenfolge |
| Zuordnen | je Paar |
| Aufgabe mit \`Antwort:\` | richtig/falsch (Zahl oder Wort, Alternativen mit \`\\|\`) |
| Markieren | je Zielwort; jedes fälschlich markierte Wort zählt als zusätzlicher Fehler |
| Sortieren | je Begriff |
| Satzpuzzle, Reihenfolge | je Teil an richtiger Stelle (längste richtige Teilfolge), beste der erlaubten Lösungen |
| Freitext | von der Lehrkraft, mit Erwartungshorizont |

**Teilpunkte:** Punkte der Aufgabe × Anteil richtiger Teile, auf halbe Punkte abgerundet.
Die Lehrkraft kann nachträglich weitere Antworten akzeptieren, Punkte überschreiben oder Aufgaben streichen.
**Notenschlüssel** (Standard, anpassbar): ab 20 % Note 5, 40 % Note 4, 55 % Note 3, 70 % Note 2, 85 % Note 1.`;

const PROBE = `- **Was:** Prüfungsplattform für iPads im Klassenzimmer (probe.pandapy.de, Repo alphabrumm/probe), PHP + SQLite auf Webspace.
  Prüfungen entstehen im eingebetteten PathFinder (nur Format „Prüfung“). Schüler brauchen kein Konto (QR-Code + Einlass-PIN).
- **Rollen:** Admin (Konten, Fachschaften, Schuljahresende), Fachleitung (Respizienz), Lehrkraft.
- **Prüfungsarten:** Schulaufgabe, Kurzarbeit, AKL, Übungsprüfung.
- **Durchführung:** Live-Liste, Zeit verlängern, automatische Abgabe, Schließen; nach dem Schließen keine Nachreichung übers Netz,
  bei Netzausfall Notfall-Abgabe per Datei (AirDrop an die Lehrkraft).
- **Datenschutz:** Alles wird im Browser verschlüsselt (WebCrypto, ECDH P-256 je Lehrkraft). Schüler-Geräte bekommen nur eine
  Fassung **ohne Lösungen**; Lösungen, Antworten und Klassenliste liegen nur verschlüsselt auf dem Server.
- **Auswertung:** Notenschlüssel per Regler, Freitext bewerten, Ergebnisseiten mit Ergebniscode, Prüfungsprotokoll (PDF).
- **Respizienz:** Lehrkraft reicht bei der Fachleitung ein (für sie verschlüsselt) → Rückfrage ⇄ erneut eingereicht → abgezeichnet;
  Archiv-Export verschlüsselt für Fachleitung, Admins und optional eine Passphrase.`;

const doc = `# Prüfungsformat für Probe

> Automatisch erzeugt mit \`node tools/doku.mjs\` aus \`core/pftext.js\` (PathFinder ${build}). Nicht von Hand ändern.

Prüfungen für [Probe](https://github.com/alphabrumm/probe) sind Texte im **PathFinder-Textformat** mit \`Art: Prüfung\`.
Jede KI kann sie schreiben; Probe liest sie ohne Nacharbeit ein. Der Claude-Skill „probe-pruefung“
([docs/skill/probe-pruefung/SKILL.md](skill/probe-pruefung/SKILL.md)) enthält dieselbe Spezifikation.

## In Probe laden

${LADEN}

## Aufgabenarten

| Aufgabenart | so im Text |
| --- | --- |
${styles}

## Spezifikation

Identisch mit dem „Prompt für externe KI“ in Probe (dort zusätzlich mit Rückfrage nach Fach, Klasse, Thema, Zeit, Aufgabenarten, Material).

\`\`\`\`text
${spec}
\`\`\`\`

## Bewertung in Probe

${BEWERTUNG}

## Probe kurz erklärt

${PROBE}

## Pflege

Wer am Prüfungsformat etwas ändert (neue Aufgabenart, Regeln im Prompt, Bewertung), führt danach \`node tools/doku.mjs\` aus,
committet die erzeugten Dateien und aktualisiert den Skill „probe-pruefung“ in Claude.
`;

const skill = `---
name: probe-pruefung
description: Digitale Prüfungen für Probe (probe.pandapy.de) im PathFinder-Textformat erstellen, prüfen oder überarbeiten und Fragen zu Probe beantworten – bei Schulaufgaben, Kurzarbeiten, Stegreifaufgaben oder Tests, die in Probe laufen sollen.
---

# Probe-Prüfungen

Erzeugt aus alphabrumm/pathfinder (\`tools/doku.mjs\`, PathFinder ${build}). Die Spezifikation unten ist dieselbe, die Probe
als „Prompt für externe KI“ anzeigt. Weicht etwas vom aktuellen Probe-Verhalten ab, gilt der Code in alphabrumm/pathfinder
(\`core/pftext.js\`, \`core/pfsplit.js\`).

## Arbeitsweise

1. **Angaben klären.** Fehlt etwas davon, frage in EINER kurzen Nachricht nach: Fach, Jahrgangsstufe und Schulart; Thema bzw.
   Lernbereich (gern mit Lehrplanbezug) und Inhalte; Bearbeitungszeit; gewünschte Aufgabenarten (Liste unten anbieten);
   Anteil der Anforderungsbereiche (Vorschlag 40/40/20); Arbeitsmaterial (Arbeitsblätter, Hefteinträge, Fotos). Was schon
   genannt wurde, nicht erneut fragen. Liegt Material vor, darauf aufbauen und nichts prüfen, was weder im Material noch im
   Lehrplanbezug vorkommt.
2. **Prüfung schreiben** – exakt nach der Spezifikation unten.
3. **Selbst prüfen**, bevor du sie ausgibst: jede Aufgabe hat \`Punkte:\`; Freitext-Erwartungen ergeben in Summe die Punkte;
   jede gewählte Aufgabenart kommt vor; keine Lösung steht im Aufgabentext; Umfang passt zur Bearbeitungszeit
   (grob 1 Punkt je Minute bei geschlossenen Aufgaben, mehr Zeit für Freitext); Anhang-Verweise \`anhang:name\` existieren.
4. **Ausgeben:** Kannst du Dateien erzeugen, liefere \`pruefung.txt\` als Datei und nenne in einer Zeile Gesamtpunkte und
   Aufgabenzahl. Sonst den kompletten Text in EINEM Codeblock (vier Backticks, \`text\`), ohne Text davor oder danach.
5. **Überarbeiten:** Bekommst du eine bestehende Prüfung (Text oder \`.probe.json\`), ändere nur das Gewünschte und gib die
   vollständige Prüfung wieder im Textformat aus. Bei Fehlermeldungen aus Probe („Zeile n: …“) genau diese Stellen korrigieren.

## In Probe laden

${LADEN}

## Spezifikation

${spec}

## Bewertung in Probe

${BEWERTUNG}

## Probe kurz erklärt

${PROBE}
`;

const out = [['docs/PRUEFUNGSFORMAT.md', doc], ['docs/skill/probe-pruefung/SKILL.md', skill]];
if (process.argv.includes('--check')) {
  const old = out.filter(([p, c]) => !existsSync(join(root, p)) || readFileSync(join(root, p), 'utf8') !== c).map(([p]) => p);
  if (old.length) { console.log('Veraltet: ' + old.join(', ') + ' → node tools/doku.mjs'); process.exit(1); }
  console.log('Doku und Skill sind aktuell.');
} else {
  for (const [p, c] of out) { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c); console.log('geschrieben: ' + p + ' (' + c.length + ' Zeichen)'); }
}
