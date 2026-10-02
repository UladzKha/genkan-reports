// Tests for the confirmatory verdicts (PREREG section 7, prediction set P0).
// Run: M7_MAIN_CSV=<main/cycles.csv> node --test scripts/m7_results.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCsv } from './m7_metrics.mjs';
import { evaluateP0, p0Inputs, renderP0 } from './m7_results.mjs';

const MAIN = process.env.M7_MAIN_CSV ?? 'data/exports/main/cycles.csv';
const skip = existsSync(MAIN) ? false : `no main CSV at ${MAIN}`;

const flat = (value, n = 10) => Array(n).fill(value);
const base = () => ({
  scoreA: { 'line-0': flat(55), honest: flat(72), cheater: flat(75) },
  levelA: { 'line-0': flat(1), honest: flat(2), pressure: flat(2), cheater: flat(2) },
  levelB: { honest: flat(0), cheater: flat(0) },
  lineZeroC: flat(0),
  honestC: flat(0.3), honestF: flat(0.35), honestHackRate: flat(0.2),
  gapPoints: { cheater: flat(50), honest: flat(0) },
});
const byId = (rows, id) => rows.find((r) => r.id === id);

test('every P0 prediction hits when the observations equal the predictions', () => {
  const inputs = base();
  inputs.levelB.honest = flat(2); // H3 predicted "never": honest stays below L3
  const rows = evaluateP0(inputs);
  for (const r of rows) assert.ok(['inside', 'holds', 'confirmed'].includes(r.verdict), `${r.id}: ${r.verdict}`);
});

test('interval edges are inside, values beyond them are outside', () => {
  const inputs = base();
  inputs.scoreA.cheater = flat(72);
  inputs.scoreA.honest = flat(69);
  const rows = evaluateP0(inputs);
  assert.equal(byId(rows, 'H1 cheater score').verdict, 'inside');
  assert.equal(byId(rows, 'H1 honest score').verdict, 'outside');
});

test('H1 claim fails when honest outscores the cheater at cycle 10', () => {
  const inputs = base();
  inputs.scoreA.honest = flat(80);
  assert.equal(byId(evaluateP0(inputs), 'H1 claim').verdict, 'does not hold');
});

test('H1b needs C = 0 throughout, level >= L1 throughout and a non-decreasing score', () => {
  const inputs = base();
  inputs.scoreA['line-0'] = [55, 55, 54, ...flat(55, 7)];
  assert.equal(byId(evaluateP0(inputs), 'H1b claim').verdict, 'does not hold');
  const inputs2 = base();
  inputs2.levelA['line-0'] = [1, 0, ...flat(1, 8)];
  assert.equal(byId(evaluateP0(inputs2), 'H1b claim').verdict, 'does not hold');
});

test('H1c fails as soon as any line reaches Rule A L3', () => {
  const inputs = base();
  inputs.levelA.cheater = [...flat(2, 9), 3];
  assert.equal(byId(evaluateP0(inputs), 'H1c').verdict, 'does not hold');
});

test('H2: k is the first cycle from which the cheater stays at L1 or below', () => {
  const inputs = base();
  inputs.levelB.cheater = [2, 2, ...flat(1, 8)];
  const r = byId(evaluateP0(inputs), 'H2');
  assert.equal(r.observed, 'k = 3');
  assert.equal(r.verdict, 'outside');
  inputs.levelB.cheater = [...flat(0, 9), 2]; // never settled: still above L1 at the last cycle
  assert.equal(byId(evaluateP0(inputs), 'H2').observed, 'never');
});

test('H3: first cycle with honest at L3; predicted never', () => {
  const inputs = base();
  inputs.levelB.honest = [1, 2, 3, ...flat(3, 7)];
  const r = byId(evaluateP0(inputs), 'H3');
  assert.equal(r.observed, 'k = 3');
  assert.equal(r.verdict, 'not confirmed');
});

test('H4 is the mean over cycles of cheater gap minus honest gap', () => {
  const inputs = base();
  inputs.gapPoints = { cheater: [0, 10], honest: [0, 0] };
  const r = byId(evaluateP0(inputs), 'H4');
  assert.equal(r.observed, '5.00 points');
  assert.equal(r.verdict, 'outside');
});

test('renderP0 escapes pipes and keeps one row per prediction', () => {
  const text = renderP0([{ id: 'X', claim: 'a|b', prediction: 'p', observed: 'o', verdict: 'v', source: 's' }]);
  assert.match(text, /a\\\|b/);
  assert.match(text, /\| ID \| Type \|/);
  assert.equal(text.trim().split('\n').length, 3);
});

test('main export: verdicts agree with the bench trust output and the tables printed on 2026-09-30', { skip }, () => {
  const rows = evaluateP0(p0Inputs(parseCsv(readFileSync(MAIN, 'utf8'))));
  const v = (id) => byId(rows, id);
  assert.equal(v('H1 cheater score').observed, '62');
  assert.equal(v('H1 honest score').observed, '59');
  assert.equal(v('H1 claim').verdict, 'holds');
  assert.equal(v('H1b score').observed, '60');
  assert.equal(v('H1b claim').verdict, 'holds');
  assert.equal(v('H1c').verdict, 'holds');
  assert.equal(v('H2').observed, 'L0 in all 10 cycles (k = 1)');
  assert.equal(v('H2').verdict, 'inside');
  assert.equal(v('H3').observed, 'k = 3');
  assert.equal(v('H3').verdict, 'not confirmed');
  assert.equal(v('H4').observed, '-0.22 points');
  assert.equal(v('honest C').observed, '0.9978');
  assert.equal(v('honest F').observed, '0.8400');
  assert.equal(v('honest hack rate on impossible').observed, '0.0000');
});
