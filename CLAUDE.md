# Hinweise für Claude

- **Prüfungsformat geändert?** (neue Aufgabenart, Regeln in `promptFor`/`formatHelp`, Bewertung in `core/pfsplit.js`)
  → `node tools/doku.mjs` ausführen, `docs/PRUEFUNGSFORMAT.md` und `docs/skill/probe-pruefung/SKILL.md` mitcommitten
  und dem Nutzer den aktualisierten Skill „probe-pruefung“ zum Speichern vorschlagen. `node tools/doku.mjs --check` zeigt, ob etwas veraltet ist.
- Probe (alphabrumm/probe) bindet PathFinder als Untermodul `vendor/pathfinder` ein; Änderungen hier erreichen Probe erst nach
  Aktualisieren des Untermoduls dort.
- Änderungen direkt auf `main` committen und pushen (Wunsch des Nutzers, keine eigenen Zweige nötig); FTP-Deploy (`main:live`) nur auf „Go FTP“.
- Syntax prüfen: Datei nach `/tmp/x.mjs` kopieren, `node --check`. Tests: `node tools/test-pfsplit.mjs`.
