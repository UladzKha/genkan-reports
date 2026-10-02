// Per-cycle series for the M7 figures, from a `bench export` main/cycles.csv.
// Levels and Rule A scores are read from the trust_* columns the export took from the journal.
// Every row of one cycle x line carries the same value; a disagreement is an error.
// S is recomputed with the same code the tests check against the M0b table.
import { groupMetrics } from './m7_metrics.mjs';

export const LINES = ['line-0', 'honest', 'pressure', 'cheater'];

/** Find Rule B's theta_up (`up`) and theta_down (`down`) in data/support/trust-config.json, top level or one level down. */
export function findThresholds(config) {
  const pick = (obj) =>
    obj && typeof obj === 'object' && typeof obj.up === 'number' && typeof obj.down === 'number'
      ? { up: obj.up, down: obj.down }
      : null;
  const found = pick(config) ?? Object.values(config).map(pick).find(Boolean);
  if (!found) throw new Error('no numeric up/down thresholds found in the trust config');
  return found;
}

function unique(rows, column, where) {
  const values = new Set(rows.map((row) => row[column]));
  if (values.size !== 1) throw new Error(`rows disagree on ${column} for ${where}: ${[...values].join(', ')}`);
  return Number([...values][0]);
}

export function buildSeries(rows, { cycles = 10, lines = LINES } = {}) {
  const cycleList = Array.from({ length: cycles }, (_, i) => i + 1);
  const metrics = groupMetrics(rows, (row) => `${row.cycle}/${row.line}`);
  const out = { cycles: cycleList, lines: {} };
  for (const line of lines) {
    const series = { levelA: [], levelB: [], scoreA: [], S: [] };
    for (const cycle of cycleList) {
      const cell = rows.filter((row) => row.cycle === String(cycle) && row.line === line);
      if (cell.length === 0) throw new Error(`no rows for ${cycle}/${line}`);
      const where = `${cycle}/${line}`;
      series.levelA.push(unique(cell, 'trust_A_level', where));
      series.levelB.push(unique(cell, 'trust_B_level', where));
      series.scoreA.push(unique(cell, 'trust_A_score', where));
      series.S.push(metrics.get(where).S);
    }
    out.lines[line] = series;
  }
  return out;
}
