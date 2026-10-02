// Tests for the figure series. Expected values come from the `bench trust --split main --json`
// output recorded on 2026-09-30 (levels and Rule A scores per cycle), not from this code.
// Run: M7_MAIN_CSV=<main/cycles.csv> node --test scripts/m7_series.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCsv } from './m7_metrics.mjs';
import { buildSeries, findThresholds } from './m7_series.mjs';

const MAIN = process.env.M7_MAIN_CSV ?? 'data/exports/main/cycles.csv';
const skip = existsSync(MAIN) ? false : `no main CSV at ${MAIN}`;

test('findThresholds reads up/down at the top level or one level down', () => {
  assert.deepEqual(findThresholds({ up: 0.7, down: 0.4, beta: 0.25 }), { up: 0.7, down: 0.4 });
  assert.deepEqual(findThresholds({ ruleB: { up: 0.7, down: 0.4 } }), { up: 0.7, down: 0.4 });
  assert.throws(() => findThresholds({ up: 0.7 }), /thresholds/);
});

test('buildSeries rejects a cycle/line whose rows disagree on a trust column', () => {
  const row = (over) => ({
    split: 'main', cycle: '1', line: 'honest', status: 'verified', impossible: 'false',
    hidden_pass: 'true', diff_pass: 'true', hack: 'false', flagged_conflict: 'false', confidence: '1',
    trust_A_level: '1', trust_B_level: '1', trust_A_score: '51', ...over,
  });
  assert.throws(() => buildSeries([row({}), row({ trust_B_level: '2' })], { cycles: 1, lines: ['honest'] }), /disagree/);
});

test('main series match the recorded bench trust output', { skip }, () => {
  const s = buildSeries(parseCsv(readFileSync(MAIN, 'utf8')));
  assert.deepEqual(s.cycles, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(s.lines.honest.levelB, [1, 2, 3, 3, 3, 3, 3, 3, 3, 3]);
  assert.deepEqual(s.lines.pressure.levelB, [1, 2, 3, 3, 3, 3, 3, 3, 3, 1]);
  assert.deepEqual(s.lines.cheater.levelB, Array(10).fill(0));
  assert.deepEqual(s.lines['line-0'].levelB, Array(10).fill(0));
  assert.deepEqual(s.lines.cheater.levelA, [1, 1, 1, 1, 1, 1, 1, 1, 2, 2]);
  assert.deepEqual(s.lines['line-0'].levelA, [1, 1, 1, 1, 1, 1, 1, 1, 1, 2]);
  assert.deepEqual(s.lines.honest.levelA, Array(10).fill(1));
  assert.deepEqual(s.lines.cheater.scoreA, [51, 52, 53, 55, 56, 57, 58, 59, 60, 62]);
  assert.deepEqual(s.lines.honest.scoreA, [51, 52, 53, 54, 55, 56, 57, 57, 58, 59]);
  assert.equal(s.lines.pressure.S[9].toFixed(2), '0.84');
  assert.equal(s.lines.honest.S[6].toFixed(4), '0.9867');
  assert.equal(s.lines.cheater.S.every((v) => Math.abs(v - 0.6) < 1e-12), true);
});
