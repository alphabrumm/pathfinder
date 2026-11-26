// Tests für core/pfsplit.js (Digitale Prüfung: Zerlegen und Bewerten). Aufruf: node tools/test-pfsplit.mjs
import assert from 'node:assert/strict';
import { splitExam, gradeExam, gapSwaps, gradeFor, pointsFor, halfFloor, isAnswer } from '../core/pfsplit.js';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log('✓', name); };

const doc = {
  v: 2, id: 'd1', form: 'pruefung', title: 'Probe <b>Physik</b>', design: { pal: 0 }, pointsOn: true, cert: { on: true },
  stations: [{
    id: 's1', title: 'Teil A', blocks: [
      { id: 't0', type: 'text', html: 'Einleitung' },
      { id: 'q1', type: 'quiz', pts: 2, qs: [
        { q: 'Einheit der Kraft?', opts: [{ t: 'Newton', ok: true, fb: 'richtig' }, { t: 'Joule', ok: false, fb: 'Energie' }, { t: 'Watt', ok: false }] },
        { q: 'Einheit der Energie?', opts: [{ t: 'Newton', ok: false }, { t: 'Joule', ok: true }] }] },
      { id: 'g1', type: 'gap', pts: 4, html: 'F = [[m]] · [[a]], 1 N = 1 [[kg]] · m/s², g ≈ [[9,81|9.81|10]] N/kg', bank: false, extra: [] },
      { id: 'g2', type: 'gap', pts: 2, html: '[[Masse]] und [[Volumen]]', bank: true, extra: ['Dichte'] },
      { id: 'm1', type: 'match', pts: 3, pairs: [{ a: 'v', b: 'Geschwindigkeit' }, { a: 'a', b: 'Beschleunigung' }, { a: 's', b: 'Weg' }] },
      { id: 'k1', type: 'task', pts: 1, title: 'Rechnen', html: '2 kg, 3 m/s²', answer: '6|6 N', tips: ['F = m·a'], solution: '6 N', solHide: true },
      { id: 'e1', type: 'essay', pts: 5, title: 'Erkläre', html: 'Erkläre das Trägheitsprinzip.', rubric: [{ t: 'Ruhe/Bewegung', p: 3 }, { t: 'Beispiel', p: 2 }] },
      { id: 'l1', type: 'lock', after: 'q1' },
      { id: 'x1', type: 'fpFormel', title: 'App' },
    ]
  }]
};

const { student, key, warnings } = splitExam(doc);
const sb = id => student.stations[0].blocks.find(b => b.id === id);
const json = JSON.stringify(student);

test('Schülerfassung enthält keine Lösungen', () => {
  assert.ok(!/"ok"/.test(json), 'keine ok-Markierung');
  assert.ok(!/"fb"/.test(json), 'keine Rückmeldungen');
  assert.ok(!/"answer"/.test(json) && !/"solution"/.test(json) && !/"tips"/.test(json) && !/"rubric"/.test(json));
  assert.ok(!/9,81|\[\[m\]\]|\[\[kg\]\]/.test(json), 'Lückentext ohne Antworten');
  assert.ok(!/"pairs"/.test(json), 'Zuordnen ohne Paare');
  assert.equal(sb('g1').html.match(/\[\[…\]\]/g).length, 4);
  assert.equal(student.cert.on, false);
  assert.equal(sb('l1'), undefined, 'Sperre entfernt');
  assert.equal(sb('x1'), undefined, 'unbekannter Baustein entfernt');
  assert.ok(warnings.some(w => /fpFormel/.test(w)));
});

test('Zuordnen: linke und rechte Schlüssel verraten die Paare nicht', () => {
  const m = sb('m1'), t = key.tasks.find(x => x.id === 'm1');
  assert.equal(m.left.length, 3); assert.equal(m.right.length, 3);
  for (const p of t.pairs) assert.notEqual(p.ka, p.kb);
  const lk = new Set(m.left.map(x => x.k)); assert.ok(m.right.every(r => !lk.has(r.k)));
});

test('Wortbank: richtige Begriffe und Ablenker', () => {
  assert.deepEqual([...sb('g2').words].sort(), ['Dichte', 'Masse', 'Volumen']);
});

test('Kurze Antwort und Freitext', () => {
  assert.equal(sb('k1').short, true);
  assert.equal(sb('e1').type, 'essay');
  assert.equal(key.tasks.find(x => x.id === 'e1').rubric.length, 2);
});

const qk = key.tasks.find(x => x.id === 'q1'), mk = key.tasks.find(x => x.id === 'm1');
const okOpt = qi => qk.qs[qi].opts.find(o => o.ok).k, badOpt = qi => qk.qs[qi].opts.find(o => !o.ok).k;

test('Alles richtig: volle Punkte, Freitext offen', () => {
  const ans = {
    q1: { 0: okOpt(0), 1: okOpt(1) }, g1: { 0: 'm', 1: ' A ', 2: 'kg', 3: '9.81' }, g2: { 0: 'Masse', 1: 'Volumen' },
    m1: Object.fromEntries(mk.pairs.map(p => [p.kb, p.ka])), k1: '6,0', e1: 'Ein Körper bleibt in Ruhe …'
  };
  const r = gradeExam(key, ans);
  assert.equal(r.total, 12); assert.equal(r.max, 17); assert.equal(r.pending, 1);
  const e = r.items.find(x => x.id === 'e1'); assert.equal(e.open, true); assert.equal(e.pts, null); assert.match(e.text, /Ruhe/);
  const r2 = gradeExam(key, ans, { manual: { e1: 4 } });
  assert.equal(r2.total, 16); assert.equal(r2.pending, 0);
});

test('Teilpunkte werden auf halbe Punkte abgerundet', () => {
  const ans = { q1: { 0: okOpt(0), 1: badOpt(1) }, g1: { 0: 'm', 1: 'a', 2: 'g' }, m1: { [mk.pairs[0].kb]: mk.pairs[0].ka, [mk.pairs[1].kb]: mk.pairs[2].ka } };
  const r = gradeExam(key, ans), p = id => r.items.find(x => x.id === id).pts;
  assert.equal(p('q1'), 1);   // 1 von 2 Fragen · 2 P.
  assert.equal(p('g1'), 2);   // 2 von 4 Lücken · 4 P.
  assert.equal(p('m1'), 1);   // 1 von 3 Paaren · 3 P. = 1
  assert.equal(p('g2'), 0); assert.equal(p('k1'), 0);
  assert.equal(halfFloor(0.75), 0.5); assert.equal(halfFloor(2.9999999), 2.5); assert.equal(halfFloor(1.5), 1.5);
});

test('Lehrkraft: auch akzeptieren, überschreiben, streichen', () => {
  const ans = { g1: { 0: 'Masse m', 1: 'a', 2: 'kg', 3: '10' }, k1: 'sechs' };
  let r = gradeExam(key, ans);
  assert.equal(r.items.find(x => x.id === 'g1').pts, 3);
  r = gradeExam(key, ans, { accept: { g1: { 0: ['Masse m'] }, k1: { 0: ['sechs'] } } });
  assert.equal(r.items.find(x => x.id === 'g1').pts, 4);
  assert.equal(r.items.find(x => x.id === 'k1').pts, 1);
  r = gradeExam(key, ans, { override: { g1: 3.5 }, drop: ['e1'] });
  assert.equal(r.items.find(x => x.id === 'g1').pts, 3.5);
  assert.equal(r.max, 12); assert.equal(r.pending, 0);
});

test('Leere Abgabe ergibt 0 Punkte', () => {
  const r = gradeExam(key, {}); assert.equal(r.total, 0); assert.equal(r.pending, 1);
});

test('Sprachaufgaben: Markieren, Sortieren, Satzpuzzle, Reihenfolge', () => {
  const doc = { id: 'd', stations: [{ id: 's', blocks: [
    { id: 'm', type: 'mark', pts: 3, title: 'M', html: '<p>Yesterday I {{went}} home &amp; {{has been}} there. It was fun.</p>' },
    { id: 'so', type: 'sort', pts: 4, title: 'S', groups: [{ name: 'der', items: ['Tisch', 'Baum'] }, { name: 'die', items: ['Tür', 'Lampe'] }] },
    { id: 'p', type: 'order', words: true, pts: 2, title: 'P', items: ['I', 'have', 'never', 'been', 'there'], alts: [['Never', 'have', 'I', 'been', 'there']] },
    { id: 'r', type: 'order', words: false, pts: 3, title: 'R', items: ['<b>A</b> first', 'B second', 'C third'] },
  ] }] };
  const { student, key } = splitExam(doc), S = Object.fromEntries(student.stations[0].blocks.map(b => [b.id, b]));
  // Schülerfassung verrät nichts
  assert.ok(!/\{\{/.test(S.m.html)); assert.ok(!S.so.groups && !S.so.sitems.some(x => 'g' in x)); assert.ok(!S.p.items && !S.p.alts && S.p.opool.length === 5);
  const W = key.tasks.find(t => t.id === 'm'); assert.deepEqual(W.targets.map(i => W.words[i]), ['went', 'has', 'been']); assert.ok(!W.words.includes('amp'));
  // Markieren: 3 Ziele; went+has+been = voll; dazu „fun“ = 3 von 4
  const mi = (sel) => gradeExam(key, { m: Object.fromEntries(sel.map(w => [W.words.indexOf(w), 1])) }).items[0];
  assert.equal(mi(['went', 'has', 'been']).pts, 3); assert.equal(mi(['went', 'has', 'been', 'fun']).pts, 2); assert.equal(mi(['went']).pts, 1);
  // Sortieren
  const SO = key.tasks.find(t => t.id === 'so'), ans = Object.fromEntries(SO.items.map(x => [x.k, x.g]));
  assert.equal(gradeExam(key, { so: ans }).items[1].pts, 4);
  ans[SO.items[0].k] = 1 - SO.items[0].g; assert.equal(gradeExam(key, { so: ans }).items[1].pts, 3);
  // Satzpuzzle: Lösung, Alternative (Groß/Klein egal), Teilpunkte nach längster richtiger Teilfolge
  const P = key.tasks.find(t => t.id === 'p'), k = w => P.pool.find(x => x.t.toLowerCase() === w.toLowerCase()).k;
  assert.equal(gradeExam(key, { p: ['I', 'have', 'never', 'been', 'there'].map(k) }).items[2].pts, 2);
  assert.equal(gradeExam(key, { p: ['never', 'have', 'I', 'been', 'there'].map(k) }).items[2].pts, 2);
  assert.equal(gradeExam(key, { p: ['have', 'I', 'never', 'been', 'there'].map(k) }).items[2].pts, 1.5); // 4 von 5 in Folge
  // Reihenfolge
  const R = key.tasks.find(t => t.id === 'r'), rk = i => R.pool[i].k;
  assert.equal(gradeExam(key, { r: [rk(0), rk(1), rk(2)] }).items[3].pts, 3);
  assert.equal(gradeExam(key, { r: [rk(2), rk(0), rk(1)] }).items[3].pts, 2);
  assert.equal(gradeExam(key, {}).items[3].pts, 0);
});

test('Notenschlüssel wie im Abitur', () => {
  assert.equal(gradeFor(19.9), 6); assert.equal(gradeFor(20), 5); assert.equal(gradeFor(39.99), 5); assert.equal(gradeFor(40), 4);
  assert.equal(gradeFor(55), 3); assert.equal(gradeFor(70), 2); assert.equal(gradeFor(84.9), 2); assert.equal(gradeFor(85), 1); assert.equal(gradeFor(100), 1);
  assert.equal(gradeFor(50, [10, 30, 50, 70, 90]), 3);
  assert.equal(pointsFor(19), 0); assert.equal(pointsFor(20), 1); assert.equal(pointsFor(33), 3); assert.equal(pointsFor(95), 15); assert.equal(pointsFor(85), 13);
});

test('Zahlen mit Komma und Einheiten-Text', () => {
  assert.ok(isAnswer('9,81', '9.81')); assert.ok(isAnswer('1000', '1.000')); assert.ok(!isAnswer('5', '')); assert.ok(isAnswer('Newton', ' newton '));
});

test('Gleichung mit Lücken auf beiden Seiten: vertauscht ist auch richtig', () => {
  assert.deepEqual(gapSwaps('I + II: [[3x]] = [[9]]<br>x = [[3]], y = [[1]]'), [[0, 1]]);
  assert.deepEqual(gapSwaps('<p>[[3x]] = [[9]]</p><p>[[2]]x = [[6]]</p>'), [[0, 1]]); // 2x = 6 ↔ 6x = 2 wäre falsch
  assert.deepEqual(gapSwaps('[[x]] = [[3]] − y'), []); assert.deepEqual(gapSwaps('[[x]]<sup>2</sup> = [[9]]'), []);
  assert.deepEqual(gapSwaps('[[a]] = [[b]] = [[c]]'), []); assert.deepEqual(gapSwaps('[[a]]&nbsp;=&nbsp;[[b]]'), [[0, 1]]);
  const k = { tasks: [{ id: 'e', type: 'gap', pts: 4, title: 'GS', bank: true, html: 'I + II: [[3x]] = [[9]]<br>x = [[3]], y = [[1]]', gaps: [['3x'], ['9'], ['3'], ['1']] }] };
  assert.equal(gradeExam(k, { e: { 0: '9', 1: '3x', 2: '3', 3: '1' } }).total, 4);
  assert.equal(gradeExam(k, { e: { 0: '9', 1: '3', 2: '3x', 3: '1' } }).total, 1);
  assert.equal(gradeExam(k, { e: { 0: '3x', 1: '9', 2: '1', 3: '3' } }).total, 2); // x und y vertauscht bleibt falsch
});

test('JPad-Aufgabe: Schülerfassung ohne Lösung, automatische und manuelle Bewertung', () => {
  const d = { v: 2, id: 'dj', form: 'pruefung', title: 'Info', design: {}, stations: [{ id: 's', title: 'A', blocks: [
    { id: 'j1', type: 'app', app: 'jpad', pts: 4, title: 'Countdown', html: 'Zähle', files: [{ name: 'Rakete', text: 'class Rakete {}' }], expect: '3 2 1 Start', compare: 'enthaelt', needs: ['while'], rubric: [], solution: 'while (n > 0) {}' },
    { id: 'j2', type: 'app', app: 'jpad', pts: 5, title: 'Klasse', html: 'Baue', files: [], expect: 'Hallo', needs: [], rubric: [{ t: 'Attribute', p: 2 }, { t: 'Konstruktor', p: 3 }], solution: 'x' }] }] };
  const { student: st, key: ky } = splitExam(d), js = JSON.stringify(st);
  assert.ok(!js.includes('3 2 1 Start') && !js.includes('while (n') && !js.includes('Konstruktor'));
  assert.equal(st.stations[0].blocks[0].files[0].name, 'Rakete');
  const run = (out, extra = {}) => ({ files: [{ name: 'Rakete', text: 'class Rakete { // while kommt noch\n }' }], sig: 'a', run: { output: out, error: false, sig: 'a' }, ...extra });
  let R = gradeExam(ky, { j1: run('3\n2\n1\nStart\n') });
  assert.equal(R.items[0].pts, 2); // Ausgabe stimmt, „while“ nur im Kommentar
  R = gradeExam(ky, { j1: { files: [{ name: 'Rakete', text: 'while (n > 0) n--;' }], run: { output: '3 2 1 Start', error: false } } });
  assert.equal(R.items[0].pts, 4); assert.ok(R.items[0].text.includes('Letzter Programmlauf'));
  R = gradeExam(ky, { j1: { files: [{ name: 'Rakete', text: 'while' }], run: { output: '3 2 1 Start', error: true } } });
  assert.equal(R.items[0].pts, 2); // abgebrochen: Ausgabe zählt nicht
  assert.equal(R.items[1].auto, false); assert.equal(R.items[1].open, true); assert.equal(R.items[1].pts, null);
  R = gradeExam(ky, { j2: run('Hallo') }, { manual: { j2: 4 } });
  assert.equal(R.items[1].pts, 4); assert.equal(R.items[1].suggest, 5);
});

test('Experiment: Schülerfassung ohne Lösung, Messreihe und Auswertung bewertet', () => {
  const V = [{ name: 'Kraft', sym: 'F', unit: 'N', opts: [{ l: 'Isaac', v: 30 }, { l: 'Anne', v: 60 }, { l: 'Vater', v: 90 }], fixed: false },
    { name: 'Masse', sym: 'm', unit: 'kg', opts: [{ l: '', v: 30 }, { l: '', v: 60 }], fixed: false }];
  const d = { v: 2, id: 'x', form: 'pruefung', title: 'E', design: {}, cert: {}, stations: [{ id: 's', title: 'A', blocks: [
    { id: 'w1', type: 'widget', kind: 'experiment', pts: 4, title: 'Wie hängt Δv von F ab?', hyp: 'dann [[wird Δv größer|wird Δv kleiner]]', vars: V, main: 0,
      res: { name: 'Zusatzgeschwindigkeit', sym: 'Δv', unit: 'm/s', f: 'F / m' }, evalHtml: 'Je größer F, desto [[größer]] Δv, doppelt: [[doppelt]].', extra: ['kleiner'], concl: 'proportional' }] }] };
  const { student: st, key: ky } = splitExam(d), w = st.stations[0].blocks[0];
  assert.equal(w.type, 'widget'); assert.ok(!JSON.stringify(w).includes('[[größer]]')); assert.equal(w.concl, undefined);
  assert.deepEqual([...w.ewords].sort(), ['doppelt', 'größer', 'kleiner']);
  // fair: nur F verändert, drei Werte; Auswertung richtig
  let R = gradeExam(ky, { w1: { rows: [{ s: [0, 0], y: 1 }, { s: [1, 0], y: 2 }, { s: [2, 0], y: 3 }], e: { e0: 'größer', e1: 'doppelt' } } });
  assert.equal(R.items[0].pts, 4); assert.ok(R.items[0].text.includes('Messungen'));
  // unfair: Masse mitverändert → Teilpunkte; eine Lücke falsch
  R = gradeExam(ky, { w1: { rows: [{ s: [0, 0], y: 1 }, { s: [1, 1], y: 1 }, { s: [2, 0], y: 3 }], e: { e0: 'kleiner', e1: 'doppelt' } } });
  assert.deepEqual(R.items[0].parts.map(p => p.ok), [true, false, false, true]); assert.equal(R.items[0].pts, 2);
  R = gradeExam(ky, {}); assert.equal(R.items[0].pts, 0);
});

test('Ausgeblendete Bausteine: nicht für Schüler, nicht in der Bewertung', () => {
  const d = { v: 2, id: 'h', form: 'pruefung', title: 'H', design: {}, cert: {}, stations: [{ id: 's', title: 'A', blocks: [
    { id: 't1', type: 'text', html: 'sichtbar' }, { id: 't2', type: 'text', html: 'GEHEIM', hide: true },
    { id: 'a1', type: 'task', title: 'Sichtbar', html: '1+1', answer: '2', pts: 2 }, { id: 'a2', type: 'task', title: 'Versteckt', html: '2+2', answer: '4', pts: 3, hide: true }] }] };
  const { student: st, key: ky } = splitExam(d), j = JSON.stringify(st);
  assert.ok(!j.includes('GEHEIM') && !j.includes('Versteckt'));
  assert.deepEqual(st.stations[0].blocks.map(b => b.id), ['t1', 'a1']);
  const R = gradeExam(ky, { a1: '2', a2: '4' }); assert.equal(R.items.length, 1); assert.equal(R.max, 2);
});

test('Zerlegen ändert das Original nicht', () => {
  assert.equal(doc.stations[0].blocks[1].qs[0].opts[0].k, undefined);
  assert.equal(doc.stations[0].blocks[1].qs[0].opts[0].ok, true);
});

test('Handschriftliche Aufgabe: Flag bleibt, Foto wird Antwort, nur data:image', () => {
  const d = { v: 2, id: 'h', form: 'pruefung', title: 'H', design: { pal: 0 }, pointsOn: true, stations: [{ id: 's', title: 'A', blocks: [{ id: 'h1', type: 'essay', hand: true, pts: 4, title: 'Skizze', html: 'Zeichne', rubric: [{ t: 'Kräfte', p: 4 }] }] }] };
  const { student: st, key: k } = splitExam(d);
  assert.equal(st.stations[0].blocks[0].hand, true); assert.equal(k.tasks[0].hand, true); assert.ok(!JSON.stringify(st).includes('Kräfte'));
  const img = 'data:image/png;base64,iVBORw0KGgo=';
  let r = gradeExam(k, { h1: { img, w: 10, h: 10 } }, {}).items[0];
  assert.equal(r.img, img); assert.equal(r.open, true); assert.ok(r.text.includes('Foto'));
  r = gradeExam(k, { h1: { img: 'javascript:alert(1)' } }, { manual: { h1: 3 } }).items[0];
  assert.equal(r.img, ''); assert.equal(r.text, ''); assert.equal(r.pts, 3);
});

console.log(`\n${n} Tests bestanden.`);
