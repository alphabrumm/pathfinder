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

test('Zerlegen ändert das Original nicht', () => {
  assert.equal(doc.stations[0].blocks[1].qs[0].opts[0].k, undefined);
  assert.equal(doc.stations[0].blocks[1].qs[0].opts[0].ok, true);
});

console.log(`\n${n} Tests bestanden.`);
