// Tests for the M7 cost and timing tables. Synthetic rows check the definitions; the real-data test
// checks numbers recomputed independently in pandas on 2026-09-30 from the same two exports.
// Run: M7_COST_CSV=<attempt-cost.csv> M7_STAGES_CSV=<task-stages.csv> node --test scripts/m7_cost.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCsv } from './m7_metrics.mjs';
import { cycleTable, lineCostTable, median, totals } from './m7_cost.mjs';

const COST = process.env.M7_COST_CSV ?? 'data/support/attempt-cost.csv';
const STAGES = process.env.M7_STAGES_CSV ?? 'data/support/task-stages.csv';
const skip = existsSync(COST) && existsSync(STAGES) ? false : 'no cost/stage CSVs';
const near = (a, b, tol, label) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} vs ${b}`);

const stage = (over) => ({
  type: 'bench_attempt', split: 'main', cycle: '1', run: '1', line: 'honest', task_id: 't1',
  submitted_ts_ms: '0', assigned_ts_ms: '100', claimed_ts_ms: '1000', completed_ts_ms: '6000', assignments: '1', ...over,
});
const cost = (over) => ({
  split: 'main', cycle: '1', run: '1', line: 'honest', task_id: 't1', model: 'm', turns: '2', end_reason: 'submit',
  truncated: '0', wall_ms: '3000', load_ms: '500', prompt_tokens: '1000', output_tokens: '200', ...over,
});

test('median', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.ok(Number.isNaN(median([])));
});

test('cycleTable: phases, run, wait and overhead definitions', () => {
  const stages = [
    stage({}),
    stage({ type: 'bench_verify', submitted_ts_ms: '6100', assigned_ts_ms: '6200', claimed_ts_ms: '7000', completed_ts_ms: '9000' }),
    stage({ line: 'line-0', task_id: 't2', claimed_ts_ms: '1500', completed_ts_ms: '4500' }), // no model call
  ];
  const [row] = cycleTable(stages, [cost({}), cost({ line: 'line-0', task_id: 't2', wall_ms: '', load_ms: '', turns: '', prompt_tokens: '', output_tokens: '' })]);
  near(row.cycleMin, 9000 / 60000, 1e-12, 'cycleMin'); // last completed - first submitted
  near(row.attemptPhaseMin, (6000 - 1000) / 60000, 1e-12, 'attempt phase'); // last attempt done - first claim
  near(row.verifyPhaseMin, (9000 - 7000) / 60000, 1e-12, 'verify phase');
  near(row.attemptRunMean, (5 + 3) / 2, 1e-12, 'attempt run mean, seconds (claimed -> completed)');
  near(row.verifyRunMean, 2, 1e-12, 'verify run mean');
  near(row.verifyWaitMean, 0.9, 1e-12, 'verify wait mean (claimed - submitted)');
  near(row.wallMeanSec, 3, 1e-12, 'wall mean ignores line-0');
  near(row.overheadMeanSec, 2, 1e-12, 'overhead = attempt run - wallMs, model lines only');
  assert.equal(row.nModelAttempts, 1);
});

test('cycleTable rejects a retried task instead of averaging over it silently', () => {
  assert.throws(() => cycleTable([stage({ assignments: '2' })], [cost({})]), /retry/);
});

test('lineCostTable: per-line means over model attempts, line-0 reported as no model data', () => {
  const rows = lineCostTable([
    cost({}),
    cost({ task_id: 't2', wall_ms: '5000', prompt_tokens: '3000', output_tokens: '400', turns: '4' }),
    cost({ line: 'line-0', wall_ms: '', load_ms: '', turns: '', prompt_tokens: '', output_tokens: '' }),
  ]);
  const honest = rows.find((r) => r.line === 'honest');
  assert.equal(honest.n, 2);
  near(honest.wallMeanSec, 4, 1e-12, 'wall');
  near(honest.promptTokensMean, 2000, 1e-9, 'prompt tokens');
  assert.equal(rows.find((r) => r.line === 'line-0').n, 0);
});

test('totals: sum of cycle times, first-submit to last-complete span, model time', () => {
  const stages = [
    stage({}),
    stage({ cycle: '2', task_id: 't3', submitted_ts_ms: '100000', claimed_ts_ms: '101000', completed_ts_ms: '160000' }),
  ];
  const t = totals(stages, [cost({}), cost({ cycle: '2', task_id: 't3', wall_ms: '7000' })]);
  near(t.sumCycleMin, (6000 + 60000) / 60000, 1e-12, 'sum of cycle minutes');
  near(t.spanMin, 160000 / 60000, 1e-12, 'span');
  near(t.modelHours, (3000 + 7000) / 3.6e6, 1e-12, 'model hours');
  near(t.meanItemSec, (6 + 60) / 2, 1e-12, 'mean time per item');
});

test('real main exports reproduce the independent pandas numbers', { skip }, () => {
  const table = cycleTable(parseCsv(readFileSync(STAGES, 'utf8')).filter((r) => r.split === 'main'),
    parseCsv(readFileSync(COST, 'utf8')).filter((r) => r.split === 'main'));
  assert.equal(table.length, 10);
  near(table[0].cycleMin, 155.54, 0.005, 'cycle 1 minutes');
  near(table[9].cycleMin, 265.75, 0.005, 'cycle 10 minutes');
  near(table[0].attemptPhaseMin, 89.87, 0.005, 'cycle 1 attempt phase');
  near(table[9].verifyPhaseMin, 119.94, 0.005, 'cycle 10 verify phase');
  near(table[0].verifyRunMean, 12.48, 0.005, 'cycle 1 verify run');
  near(table[9].verifyRunMean, 21.12, 0.005, 'cycle 10 verify run');
  near(table[0].overheadMeanSec, 7.03, 0.005, 'cycle 1 overhead');
  near(table[9].overheadMeanSec, 13.94, 0.005, 'cycle 10 overhead');
  near(table[4].wallMeanSec, 21.13, 0.005, 'cycle 5 wall mean');
});
