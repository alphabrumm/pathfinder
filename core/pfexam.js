// PathFinder – Prüfung aus dem geladenen Lernpfad: Prompt für eine fremde KI und Prüfung ihrer Antwort (Moodle-XML)

export const TYPES = [
  ['gapselect', 'Lückentext mit Dropdown', 'Moodle: „Lückentext (Auswahl)“'],
  ['ddwtos', 'Drag & Drop mit Begriffen', 'Moodle: „Drag & Drop auf Text“'],
  ['multichoice', 'Multiple Choice', 'eine richtige Antwort'],
  ['essay', 'Freitext', 'mit Erwartungshorizont für die Bewertung'],
  ['equation', 'Gleichungssysteme mit Drag & Drop', 'Lösungsschritte per Drag & Drop ergänzen'],
];

/** Anzahl je Niveau aus Prozentanteilen (größter Rest), Summe = n */
export function split(n, pcts) {
  const raw = pcts.map(p => n * p / 100), base = raw.map(Math.floor);
  let rest = n - base.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { base[i]++; rest--; } });
  return base;
}

const slug = s => String(s || 'Lernpfad').replace(/[^\wäöüÄÖÜß -]/g, '').trim().replace(/\s+/g, ' ') || 'Lernpfad';

export function examPrompt(o, docText) {
  const [b, m, a] = split(o.count, [o.p1, o.p2 - o.p1, 100 - o.p2]);
  const types = TYPES.filter(([k]) => o.types.includes(k));
  const cat = `$course$/top/Prüfung ${slug(o.title)}`;
  const tpl = {
    gapselect: `<question type="gapselect">
  <name><text>B01 Kurzer Titel</text></name>
  <questiontext format="html"><text><![CDATA[<p>Ein Satz mit Lücke [[1]] und noch einer Lücke [[2]].</p>]]></text></questiontext>
  <generalfeedback format="html"><text><![CDATA[<p>Kurze Erklärung der Lösung.</p>]]></text></generalfeedback>
  <defaultgrade>1</defaultgrade><penalty>0.3333333</penalty><hidden>0</hidden>
  <shuffleanswers>1</shuffleanswers>
  <selectoption><text>richtig für Lücke 1</text><group>1</group></selectoption>
  <selectoption><text>richtig für Lücke 2</text><group>1</group></selectoption>
  <selectoption><text>Ablenker</text><group>1</group></selectoption>
</question>`,
    ddwtos: `<question type="ddwtos">
  <name><text>M01 Kurzer Titel</text></name>
  <questiontext format="html"><text><![CDATA[<p>Ziehe die Begriffe an die richtige Stelle: [[1]] … [[2]].</p>]]></text></questiontext>
  <generalfeedback format="html"><text><![CDATA[<p>Kurze Erklärung.</p>]]></text></generalfeedback>
  <defaultgrade>2</defaultgrade><penalty>0.3333333</penalty><hidden>0</hidden>
  <shuffleanswers>1</shuffleanswers>
  <dragbox><text>Begriff für [[1]]</text><group>1</group></dragbox>
  <dragbox><text>Begriff für [[2]]</text><group>1</group></dragbox>
  <dragbox><text>Ablenker</text><group>1</group></dragbox>
</question>`,
    multichoice: `<question type="multichoice">
  <name><text>B02 Kurzer Titel</text></name>
  <questiontext format="html"><text><![CDATA[<p>Frage?</p>]]></text></questiontext>
  <generalfeedback format="html"><text><![CDATA[<p>Kurze Erklärung.</p>]]></text></generalfeedback>
  <defaultgrade>1</defaultgrade><penalty>0.3333333</penalty><hidden>0</hidden>
  <single>true</single><shuffleanswers>true</shuffleanswers><answernumbering>abc</answernumbering>
  <answer fraction="100" format="html"><text><![CDATA[richtige Antwort]]></text><feedback format="html"><text><![CDATA[Richtig, weil …]]></text></feedback></answer>
  <answer fraction="0" format="html"><text><![CDATA[falsche Antwort]]></text><feedback format="html"><text><![CDATA[Nein, denn …]]></text></feedback></answer>
</question>`,
    essay: `<question type="essay">
  <name><text>A01 Kurzer Titel</text></name>
  <questiontext format="html"><text><![CDATA[<p>Offene Aufgabe …</p>]]></text></questiontext>
  <defaultgrade>3</defaultgrade><penalty>0</penalty><hidden>0</hidden>
  <responseformat>editor</responseformat><responserequired>1</responserequired><responsefieldlines>10</responsefieldlines><attachments>0</attachments>
  <graderinfo format="html"><text><![CDATA[<p>Erwartungshorizont: … (Punkte je Teilaspekt)</p>]]></text></graderinfo>
  <responsetemplate format="html"><text></text></responsetemplate>
</question>`,
  };
  return `Du bist eine erfahrene Lehrkraft${o.fach ? ` für ${o.fach}` : ''} und erstellst Prüfungsfragen für Moodle.

GRUNDLAGE: ausschließlich der Lernpfad „${o.title}“ unten – frage nur ab, was dort erklärt oder geübt wird, und übernimm seine Begriffe und Schreibweisen (auch in Code-Beispielen).
${o.klasse ? `ZIELGRUPPE: ${o.klasse}\n` : ''}ANZAHL: genau ${o.count} Fragen
NIVEAU:
- ${b} × Basis (Wissen wiedergeben, Begriffe zuordnen) – Name beginnt mit B, 1 Punkt
- ${m} × Mittel (Gelerntes anwenden und übertragen) – Name beginnt mit M, 2 Punkte
- ${a} × Anspruchsvoll (analysieren, begründen, Fehler finden, neue Situationen) – Name beginnt mit A, 3 Punkte
FRAGETYPEN (nur diese, möglichst gleichmäßig verteilt): ${types.map(t => t[1]).join(', ')}
${o.extra ? `WEITERE WÜNSCHE: ${o.extra}\n` : ''}
REGELN
- Antworte NUR mit einer vollständigen Moodle-XML-Datei in EINEM Codeblock (Beginn \`\`\`xml). Wenn du Dateien erzeugen kannst, liefere sie zusätzlich als „pruefung.xml“.
- Aufbau: <?xml version="1.0" encoding="UTF-8"?> <quiz> … </quiz>. Ordne die Fragen in drei Kategorien, jeweils mit einer Kategorie-Frage davor:
  <question type="category"><category><text>${cat}/1 Basis</text></category></question>   (ebenso „2 Mittel“ und „3 Anspruchsvoll“)
- Alle Texte mit format="html" in <![CDATA[ … ]]>. Code in <pre><code> … </code></pre>. Keine Bilder, keine Links.
- Jede Frage hat eine kurze allgemeine Rückmeldung (<generalfeedback>), Multiple-Choice-Antworten zusätzlich je eine Rückmeldung.
- Ablenker müssen plausibel sein und dürfen nicht durch Form oder Länge auffallen. Keine Fragen, deren Antwort in einer anderen Frage steht.
- Prüfe am Ende: richtige Anzahl je Niveau, jede Lücke [[n]] hat eine passende Auswahl, die XML-Datei ist wohlgeformt.

VORLAGEN (genau dieses Format verwenden)
${types.map(([k, n]) => {
    if (k === 'equation') return `${n}: wie „Drag & Drop mit Begriffen“ (type="ddwtos"). Ein Gleichungssystem wird Schritt für Schritt gelöst; Terme, Zahlen und Rechenzeichen werden in die Lücken [[n]] gezogen, dazu 2–3 falsche Bausteine als Ablenker. Gleichungen in <p>, Exponenten mit <sup>. Diesen Typ nur verwenden, wenn der Lernpfad Gleichungen oder Formeln enthält.`;
    if (k === 'gapselect') return `${n} – [[n]] verweist auf die n-te <selectoption>; Optionen derselben <group> erscheinen gemeinsam im Auswahlmenü (Ablenker in dieselbe Gruppe):\n${tpl[k]}`;
    if (k === 'ddwtos') return `${n} – [[n]] verweist auf die n-te <dragbox>:\n${tpl[k]}`;
    return `${n}:\n${tpl[k]}`;
  }).join('\n\n')}

LERNPFAD
${docText}`;
}

/** Antwort der KI prüfen: Code-Zaun entfernen, XML lesen, Fragen zählen, typische Fehler finden */
export function checkXml(src) {
  let t = String(src || '').trim();
  const fence = t.match(/```(?:xml)?\s*\n([\s\S]*?)```/i); if (fence) t = fence[1].trim();
  const i = t.search(/<\?xml|<quiz[\s>]/); if (i > 0) t = t.slice(i);
  const r = { xml: t, errors: [], warnings: [], count: 0, byType: {}, byLevel: { B: 0, M: 0, A: 0 }, cats: [] };
  if (!t) return r;
  const x = new DOMParser().parseFromString(t, 'application/xml');
  const pe = x.querySelector('parsererror');
  if (pe) { r.errors.push('Die Datei ist kein gültiges XML: ' + pe.textContent.replace(/\s+/g, ' ').slice(0, 160)); return r; }
  if (x.documentElement.nodeName !== 'quiz') { r.errors.push('Es fehlt das äußere <quiz> … </quiz>.'); return r; }
  for (const q of x.documentElement.children) {
    if (q.nodeName !== 'question') continue;
    const type = q.getAttribute('type'), name = q.querySelector(':scope > name > text')?.textContent.trim() || '(ohne Namen)';
    if (type === 'category') { r.cats.push(q.querySelector('category > text')?.textContent.trim()); continue; }
    r.count++; r.byType[type] = (r.byType[type] || 0) + 1;
    const lv = name.trim()[0]?.toUpperCase(); if (lv in r.byLevel) r.byLevel[lv]++;
    const qt = q.querySelector(':scope > questiontext > text')?.textContent || '';
    if (!qt.trim()) r.errors.push(`„${name}“: Fragetext fehlt.`);
    if (type === 'gapselect' || type === 'ddwtos') {
      const gaps = [...qt.matchAll(/\[\[(\d+)\]\]/g)].map(m => +m[1]), n = q.querySelectorAll(type === 'gapselect' ? ':scope > selectoption' : ':scope > dragbox').length;
      if (!gaps.length) r.errors.push(`„${name}“: keine Lücke [[1]] im Fragetext.`);
      else if (Math.max(...gaps) > n) r.errors.push(`„${name}“: Lücke [[${Math.max(...gaps)}]], aber nur ${n} Auswahl${n === 1 ? '' : 'en'}.`);
    }
    if (type === 'multichoice' && ![...q.querySelectorAll(':scope > answer')].some(a => parseFloat(a.getAttribute('fraction')) > 0)) r.errors.push(`„${name}“: keine Antwort ist als richtig markiert.`);
    if (!['gapselect', 'ddwtos', 'multichoice', 'essay', 'truefalse', 'shortanswer', 'matching', 'numerical'].includes(type)) r.warnings.push(`„${name}“: Fragetyp „${type}“ ist ungewöhnlich – prüfe ihn nach dem Import.`);
  }
  if (!r.count) r.errors.push('Keine Fragen gefunden.');
  return r;
}

export const fileName = title => `Pruefung-${slug(title).replace(/\s+/g, '-')}.xml`;
