// Tests für die Befragung: Textformat (hin und zurück) und surveySpec
import * as T from '../core/pftext.js';
import { surveySpec } from '../core/pfsurvey.js';
let n = 0, ok = 0; const t = (name, c) => { n++; if (c) ok++; else console.log('✗ ' + name); };
let k = 0; const env = { emptyDoc: f => ({ form: f, stations: [], design: {}, cert: { on: true }, kicker: '', goals: [] }), palettes: [{ n: 'Pastell' }], figures: [], uid: () => 'b' + (++k), plugins: [], isCheck: () => false, appName: 'Probe' };
const src = `# Selbstreflexion kompakt
Art: Befragung

## Station: Wie geht es mir gerade?
### Skala: Wohlbefinden in der Schule
Von: 1 = gar nicht wohl
Bis: 10 = sehr wohl

### Auswahl: Ich fühle mich in meiner Klasse:
- wohl / zugehörig
- teils / teils
- eher allein

### Offene Frage: Was tut mir gut? Was belastet mich?
Hinweis: Du musst nichts aufschreiben, was du lieber erzählst.

## Station: Mein Lernen
### Mehrfachauswahl: Im Moment fällt mir schwer:
- Motivation / Anfangen
- Konzentration
- Lernplanung

### Raster: Wie gut kannst du das?
Spalten: +3, +2, +1, −1, −2, −3
- Vor einer Gruppe vorlesen
- Texte fehlerfrei schreiben

### Ja/Nein: Hast du einen festen Lernplatz?

### Offene Frage: Problemfächer
Zeilen: 1

## Station: Vereinbarung
### Offene Frage: Ich werde / Wir werden:
Weitergabe: ja

### Datum: Wir schauen wieder drauf am

### Einwilligung: Weitergabe an die nächste Klassenleitung
Darf deine Klassenleitung deine Ziele weitergeben?
- Ja, das ist okay.
- Nein, das möchte ich nicht.
`;
const r = T.parseText(src, env);
t('keine Fehler: ' + JSON.stringify(r.errors), !r.errors.length);
t('Art Befragung', r.doc.form === 'befragung');
const B = r.doc.stations.flatMap(s => s.blocks);
t('Bausteine', B.map(b => b.type).join(',') === 'scale,choice,open,choice,matrix,choice,open,open,datefield,choice');
t('Skala', B[0].min === 1 && B[0].max === 10 && B[0].lo === 'gar nicht wohl' && B[0].hi === 'sehr wohl');
t('Auswahl', B[1].opts.length === 3 && !B[1].multi);
t('Hinweis', B[2].hint.startsWith('Du musst nichts'));
t('Mehrfach', B[3].multi && B[3].opts.length === 3);
t('Raster', B[4].items.length === 2 && B[4].cols.length === 6);
t('Ja/Nein', B[5].opts.join('|') === 'Ja|Nein');
t('kurz', B[6].rows === 1);
t('Weitergabe', B[7].share === true);
t('Einwilligung', B[9].consent && B[9].opts.length === 2 && B[9].text.startsWith('Darf'));
// hin und zurück
if (typeof document !== 'undefined') { // docToText braucht das DOM – im Browser-Test
  const txt = T.docToText(r.doc, env); const r2 = T.parseText(txt, env);
  t('Text ohne Fehler: ' + JSON.stringify(r2.errors), !r2.errors.length);
  const strip = d => JSON.stringify(d.stations.map(s => [s.title, s.blocks.map(({ id, ...b }) => b)]));
  t('hin und zurück gleich', strip(r.doc) === strip(r2.doc));
}
// surveySpec
const S = surveySpec(r.doc);
t('Abschnitte', S.sections.length === 3);
t('Typen', S.sections.flatMap(s => s.qs.map(q => q.t)).join(',') === 'scale,single,text,multi,matrix,single,line,text,date');
t('Einwilligung getrennt', S.consent?.t === 'consent' && S.consent.id === 'weitergabe');
t('Raster-Werte', JSON.stringify(S.sections[1].qs[1].vals) === '[3,2,1,-1,-2,-3]');
t('Weitergabe-Flag', S.share && S.sections[2].qs[0].w);
t('Statistik ohne Freitext', S.sections.flatMap(s => s.qs).filter(q => q.stat).every(q => !['text', 'line', 'date'].includes(q.t)));
// Prompt
const p = T.promptFor({ art: 'befragung', thema: 'Lerncoaching' }, env);
t('Prompt Befragung', p.includes('Art: Befragung') && p.includes('befragung.txt') && !p.includes('Punkte: n'));
console.log(`${ok}/${n} Tests bestanden`); if (ok !== n) process.exit(1);
