// M7 cost and timing tables from two read-only journal exports:
//   attempt-cost.csv (m7_cost_export.sh)  and  task-stages.csv (m7_stage_export.sh).
// Definitions (seconds unless stated; timestamps are journal ms):
//   wait       = claimed - submitted          run = completed - claimed
//   run includes receipt and runner work on the PC, not only model or verifier compute (M6 report).
//   wallMs     = agent loop including tools, not pure model compute (M6 report).
//   overhead   = attempt run - wallMs, for attempts of model lines (line-0 never calls the model).
//   cycle time = last completed - first submitted in the cycle; phases use first claim -> last completed.
// Pi and PC clocks differ by -39..+135 ms (M6 report); negligible against the times below.

export const mean = (values) => (values.length === 0 ? Number.NaN : values.reduce((a, b) => a + b, 0) / values.length);
export function median(values) {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
const num = (value) => (value === '' || value === undefined ? Number.NaN : Number(value));
const finite = (values) => values.filter((v) => Number.isFinite(v));
const key = (row) => `${row.cycle}/${row.run}/${row.line}/${row.task_id}`;

function checkStages(stages) {
  for (const row of stages) {
    if (num(row.assignments) > 1) throw new Error(`retry found (assignments > 1) for ${key(row)}: model-run counters differ, handle it explicitly`);
    for (const col of ['submitted_ts_ms', 'claimed_ts_ms', 'completed_ts_ms']) {
      if (!Number.isFinite(num(row[col]))) throw new Error(`missing ${col} for ${row.type} ${key(row)}`);
    }
  }
}

/** One row per cycle. `stages` are task-stages.csv rows, `costs` are attempt-cost.csv rows, both of one split. */
export function cycleTable(stages, costs) {
  checkStages(stages);
  const wallByKey = new Map(costs.map((row) => [key(row), num(row.wall_ms)]));
  const cycles = [...new Set(stages.map((row) => Number(row.cycle)))].sort((a, b) => a - b);
  return cycles.map((cycle) => {
    const group = stages.filter((row) => Number(row.cycle) === cycle);
    const attempts = group.filter((row) => row.type === 'bench_attempt');
    const verifies = group.filter((row) => row.type === 'bench_verify');
    const runSec = (row) => (num(row.completed_ts_ms) - num(row.claimed_ts_ms)) / 1000;
    const waitSec = (row) => (num(row.claimed_ts_ms) - num(row.submitted_ts_ms)) / 1000;
    const minOf = (rows, col) => Math.min(...rows.map((row) => num(row[col])));
    const maxOf = (rows, col) => Math.max(...rows.map((row) => num(row[col])));
    const modelAttempts = attempts.filter((row) => Number.isFinite(wallByKey.get(key(row))));
    const costRows = costs.filter((row) => Number(row.cycle) === cycle && Number.isFinite(num(row.wall_ms)));
    return {
      cycle,
      cycleMin: (maxOf(group, 'completed_ts_ms') - minOf(group, 'submitted_ts_ms')) / 60000,
      attemptPhaseMin: (maxOf(attempts, 'completed_ts_ms') - minOf(attempts, 'claimed_ts_ms')) / 60000,
      verifyPhaseMin: (maxOf(verifies, 'completed_ts_ms') - minOf(verifies, 'claimed_ts_ms')) / 60000,
      attemptRunMean: mean(attempts.map(runSec)),
      attemptRunMedian: median(attempts.map(runSec)),
      verifyRunMean: mean(verifies.map(runSec)),
      verifyRunMedian: median(verifies.map(runSec)),
      verifyWaitMean: mean(verifies.map(waitSec)),
      nModelAttempts: modelAttempts.length,
      wallMeanSec: mean(costRows.map((row) => num(row.wall_ms) / 1000)),
      wallMedianSec: median(costRows.map((row) => num(row.wall_ms) / 1000)),
      overheadMeanSec: mean(modelAttempts.map((row) => runSec(row) - wallByKey.get(key(row)) / 1000)),
      overheadMedianSec: median(modelAttempts.map((row) => runSec(row) - wallByKey.get(key(row)) / 1000)),
      promptTokensMean: mean(costRows.map((row) => num(row.prompt_tokens))),
      outputTokensMean: mean(costRows.map((row) => num(row.output_tokens))),
      turnsMean: mean(costRows.map((row) => num(row.turns))),
    };
  });
}

/** Per-line means over attempts that called the model; line-0 has n = 0 (no model data exists). */
export function lineCostTable(costs) {
  const lines = [...new Set(costs.map((row) => row.line))];
  return lines.map((line) => {
    const rows = costs.filter((row) => row.line === line && Number.isFinite(num(row.wall_ms)));
    const col = (name, scale = 1) => rows.map((row) => num(row[name]) / scale);
    return {
      line,
      n: rows.length,
      wallMeanSec: mean(col('wall_ms', 1000)),
      wallMedianSec: median(col('wall_ms', 1000)),
      wallMaxSec: rows.length ? Math.max(...col('wall_ms', 1000)) : Number.NaN,
      loadMeanSec: mean(col('load_ms', 1000)),
      promptTokensMean: mean(col('prompt_tokens')),
      outputTokensMean: mean(col('output_tokens')),
      turnsMean: mean(col('turns')),
      truncated: rows.filter((row) => num(row.truncated) > 0).length,
    };
  });
}

/** Whole-split numbers: sum of cycle times, first-submit to last-complete span, model time, time per item. */
export function totals(stages, costs) {
  const table = cycleTable(stages, costs);
  const items = new Set(stages.map(key)).size;
  const sumCycleMin = table.reduce((a, row) => a + row.cycleMin, 0);
  const submitted = Math.min(...stages.map((row) => num(row.submitted_ts_ms)));
  const completed = Math.max(...stages.map((row) => num(row.completed_ts_ms)));
  const modelMs = costs.reduce((a, row) => a + (Number.isFinite(num(row.wall_ms)) ? num(row.wall_ms) : 0), 0);
  return {
    sumCycleMin,
    spanMin: (completed - submitted) / 60000,
    modelHours: modelMs / 3.6e6,
    items,
    meanItemSec: items ? (sumCycleMin * 60) / items : Number.NaN,
  };
}
