// GPU telemetry summary from the nvidia-smi log (~/gpu-pilot.csv) for one GPU index, per cycle window.
// The log is local time (CEST, UTC+2 on 28-30 Sep 2026). Its format: a header line, then one line per GPU
// per sample: `2026/09/28 15:04:44.174, 0, 56, 110.62 W, 1785 MHz, 18484 MiB, 0 %`.
// The file can hold `nohup:` lines, repeated headers, torn lines, and samples out of time order (two loggers
// wrote to it). Samples are sorted by time; energy and means are integrated over time, so overlapping
// loggers add density but are not counted twice. Intervals longer than maxGapSec are not integrated, and
// coverage reports how much of each window has data. Nothing is extrapolated.

const UTC_OFFSET_MS = 2 * 3600 * 1000; // CEST

function parseLocalTime(text) {
  const m = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})$/.exec(text);
  if (!m) return Number.NaN;
  const [, y, mo, d, h, mi, s, ms] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s, ms) - UTC_OFFSET_MS;
}

export function parseGpuLog(text, gpuIndex) {
  const skipped = { nohup: 0, header: 0, malformed: 0, outOfOrder: 0 };
  const samples = [];
  let previous = -Infinity;
  for (const line of text.split('\n')) {
    if (line === '') continue;
    if (line.startsWith('nohup:')) { skipped.nohup += 1; continue; }
    if (line.startsWith('timestamp,')) { skipped.header += 1; continue; }
    const f = line.split(',').map((x) => x.trim());
    const t = parseLocalTime(f[0]);
    if (f.length !== 7 || !Number.isFinite(t)) { skipped.malformed += 1; continue; }
    if (Number(f[1]) !== gpuIndex) continue;
    if (t < previous) skipped.outOfOrder += 1;
    previous = Math.max(previous, t);
    samples.push({ t, temp: Number(f[2]), power: parseFloat(f[3]), util: parseFloat(f[6]), memMiB: parseFloat(f[5]) });
  }
  samples.sort((a, b) => a.t - b.t);
  return { samples, skipped };
}

/** window = {start, end} in epoch ms. Returns coverage, time-weighted means, energy and max temperature. */
export function summarizeWindow(samples, window, { maxGapSec = 30 } = {}) {
  let coveredMs = 0;
  let powerMs = 0; // integral of power over time, in W*ms
  let utilMs = 0;
  for (let i = 0; i + 1 < samples.length; i += 1) {
    const a = samples[i];
    const b = samples[i + 1];
    const span = b.t - a.t;
    if (span <= 0 || span > maxGapSec * 1000 || b.t <= window.start || a.t >= window.end) continue;
    const lo = Math.max(a.t, window.start);
    const hi = Math.min(b.t, window.end);
    const at = (key, t) => a[key] + ((b[key] - a[key]) * (t - a.t)) / span;
    coveredMs += hi - lo;
    powerMs += ((at('power', lo) + at('power', hi)) / 2) * (hi - lo);
    utilMs += ((at('util', lo) + at('util', hi)) / 2) * (hi - lo);
  }
  const inside = samples.filter((s) => s.t >= window.start && s.t <= window.end);
  return {
    coveredSec: coveredMs / 1000,
    coverage: coveredMs / (window.end - window.start),
    meanPowerW: coveredMs ? powerMs / coveredMs : Number.NaN,
    meanUtil: coveredMs ? utilMs / coveredMs : Number.NaN,
    energyKWh: powerMs / 1000 / 3.6e6, // W*ms -> J -> kWh
    maxTempC: inside.length ? Math.max(...inside.map((s) => s.temp)) : Number.NaN,
    nSamples: inside.length,
  };
}

/** Cycle windows from task-stages.csv rows: first submit to last completion per cycle. */
export function cycleWindows(stageRows) {
  const by = new Map();
  for (const row of stageRows) {
    const cycle = Number(row.cycle);
    const w = by.get(cycle) ?? { cycle, start: Infinity, end: -Infinity };
    w.start = Math.min(w.start, Number(row.submitted_ts_ms));
    w.end = Math.max(w.end, Number(row.completed_ts_ms));
    by.set(cycle, w);
  }
  return [...by.values()].sort((x, y) => x.cycle - y.cycle);
}
