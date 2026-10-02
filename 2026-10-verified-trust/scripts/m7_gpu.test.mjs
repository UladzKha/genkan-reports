// Tests for the GPU telemetry summary. Synthetic data checks the definitions; the real-data test checks
// numbers recomputed independently in pandas on 2026-09-30 from the same log and stage export.
// Run: M7_GPU_CSV=<gpu-pilot.csv> M7_STAGES_CSV=<task-stages.csv> node --test scripts/m7_gpu.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCsv } from './m7_metrics.mjs';
import { cycleWindows, parseGpuLog, summarizeWindow } from './m7_gpu.mjs';

const GPU = process.env.M7_GPU_CSV ?? 'data/support/gpu-pilot.csv';
const STAGES = process.env.M7_STAGES_CSV ?? 'data/support/task-stages.csv';
const skip = existsSync(GPU) && existsSync(STAGES) ? false : 'no GPU log or stage CSV';
const near = (a, b, tol, label) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} vs ${b}`);

const LOG = [
  'nohup: ignoring input',
  'timestamp, index, temperature.gpu, power.draw [W], clocks.current.graphics [MHz], memory.used [MiB], utilization.gpu [%]',
  '2026/09/28 12:00:00.000, 0, 50, 100.00 W, 1800 MHz, 18000 MiB, 50 %',
  '2026/09/28 12:00:00.000, 1, 30, 8.00 W, 210 MHz, 16 MiB, 0 %',
  '2026/09/28 12:00:10.000, 0, 60, 300.00 W, 1800 MHz, 18000 MiB, 100 %',
  '9, 12.60 W, 210 MHz, 18518 MiB, 0 %', // torn line
  'nohup: ignoring input',
  'timestamp, index, temperature.gpu, power.draw [W], clocks.current.graphics [MHz], memory.used [MiB], utilization.gpu [%]',
  '2026/09/28 12:05:00.000, 0, 55, 200.00 W, 1800 MHz, 18000 MiB, 10 %',
  '2026/09/28 12:05:10.000, 0, 56, 200.00 W, 1800 MHz, 18000 MiB, 10 %',
].join('\n');
const T = (clock) => Date.parse(`2026-09-28T${clock}+02:00`); // the log is in CEST

test('parseGpuLog skips nohup lines, repeated headers and torn lines, and reports them', () => {
  const { samples, skipped } = parseGpuLog(LOG, 0);
  assert.equal(samples.length, 4);
  assert.deepEqual(samples.map((s) => s.power), [100, 300, 200, 200]);
  assert.equal(samples[0].t, T('12:00:00.000'));
  assert.equal(skipped.nohup, 2);
  assert.equal(skipped.header, 2);
  assert.equal(skipped.malformed, 1);
});

test('parseGpuLog sorts by time; two loggers sampling the same interval do not double the energy', () => {
  const line = (clock, w) => `2026/09/28 ${clock}, 0, 50, ${w} W, 1800 MHz, 18000 MiB, 10 %`;
  const log = [line('12:00:00.000', '100.00'), line('12:00:10.000', '100.00'), // logger A
    line('12:00:03.000', '100.00'), line('12:00:08.000', '100.00')].join('\n'); // logger B, written later
  const { samples, skipped } = parseGpuLog(log, 0);
  assert.deepEqual(samples.map((x) => x.t), [0, 3000, 8000, 10000].map((ms) => T('12:00:00.000') + ms));
  assert.equal(skipped.outOfOrder, 2);
  const summary = summarizeWindow(samples, { start: T('12:00:00.000'), end: T('12:00:10.000') }, { maxGapSec: 30 });
  near(summary.energyKWh, (100 * 10) / 3.6e6, 1e-12, 'energy counted once');
});

test('summarizeWindow: trapezoid energy, time-weighted means, coverage, gaps are not integrated', () => {
  const { samples } = parseGpuLog(LOG, 0);
  const s = summarizeWindow(samples, { start: T('12:00:00.000'), end: T('12:10:00.000') }, { maxGapSec: 30 });
  assert.equal(s.coveredSec, 20); // two 10 s intervals; the 290 s gap between segments is skipped
  near(s.energyKWh, (200 * 10 + 200 * 10) / 3.6e6, 1e-12, 'energy'); // (100+300)/2 * 10 + 200 * 10 J
  near(s.meanPowerW, 200, 1e-9, 'mean power');
  near(s.meanUtil, (75 * 10 + 10 * 10) / 20, 1e-9, 'time-weighted utilisation');
  assert.equal(s.maxTempC, 60);
  near(s.coverage, 20 / 600, 1e-12, 'coverage');
});

test('summarizeWindow clips intervals to the window edges with linear interpolation', () => {
  const { samples } = parseGpuLog(LOG, 0);
  const s = summarizeWindow(samples, { start: T('12:00:05.000'), end: T('12:00:10.000') }, { maxGapSec: 30 });
  assert.equal(s.coveredSec, 5);
  near(s.meanPowerW, 250, 1e-9, 'power over the second half of a 100->300 W ramp');
  assert.equal(s.nSamples, 1); // only the 12:00:10 sample lies inside the window
});

test('summarizeWindow with no samples reports zero coverage, not numbers', () => {
  const s = summarizeWindow([], { start: 0, end: 1000 }, { maxGapSec: 30 });
  assert.equal(s.coveredSec, 0);
  assert.ok(Number.isNaN(s.meanPowerW));
  assert.equal(s.energyKWh, 0);
});

test('cycleWindows takes first submit and last completion per cycle', () => {
  const w = cycleWindows([
    { cycle: '1', submitted_ts_ms: '1000', completed_ts_ms: '5000' },
    { cycle: '1', submitted_ts_ms: '2000', completed_ts_ms: '9000' },
    { cycle: '2', submitted_ts_ms: '20000', completed_ts_ms: '30000' },
  ]);
  assert.deepEqual(w, [{ cycle: 1, start: 1000, end: 9000 }, { cycle: 2, start: 20000, end: 30000 }]);
});

test('real log: coverage by cycle matches the independent pandas numbers', { skip }, () => {
  const { samples } = parseGpuLog(readFileSync(GPU, 'utf8'), 0);
  const windows = cycleWindows(parseCsv(readFileSync(STAGES, 'utf8')).filter((r) => r.split === 'main'));
  const by = new Map(windows.map((w) => [w.cycle, summarizeWindow(samples, w, { maxGapSec: 30 })]));
  assert.equal(windows.length, 10);
  for (const c of [3, 7, 8, 9, 10]) assert.equal(by.get(c).coveredSec, 0, `cycle ${c} has no GPU samples`);
  for (const [cycle, ref] of Object.entries(PANDAS)) {
    const got = by.get(Number(cycle));
    near(got.coverage, ref.coverage, 0.002, `cycle ${cycle} coverage`);
    near(got.meanPowerW, ref.meanPowerW, 0.05, `cycle ${cycle} mean power`);
    near(got.energyKWh, ref.energyKWh, 0.0002, `cycle ${cycle} energy`);
    near(got.meanUtil, ref.meanUtil, 0.05, `cycle ${cycle} utilisation`);
    assert.equal(got.maxTempC, ref.maxTempC, `cycle ${cycle} max temperature`);
  }
});

// Independent pandas/numpy run on 2026-09-30 (GPU 0, samples sorted by time, gaps > 30 s not integrated).
const PANDAS = {
  1: { coverage: 1.0, meanPowerW: 117.11, energyKWh: 0.3036, meanUtil: 19.43, maxTempC: 74 },
  4: { coverage: 0.6969, meanPowerW: 61.77, energyKWh: 0.1338, meanUtil: 9.27, maxTempC: 69 },
  5: { coverage: 1.0, meanPowerW: 108.23, energyKWh: 0.3911, meanUtil: 19.0, maxTempC: 77 },
  6: { coverage: 0.2566, meanPowerW: 114.64, energyKWh: 0.0998, meanUtil: 13.64, maxTempC: 67 },
};
