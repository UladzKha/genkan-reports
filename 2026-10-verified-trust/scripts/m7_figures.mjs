// Figure generator from bundled public data; scripts/regenerate.sh supplies the inputs.
// With --journal and --driver-log it also draws figure 4 (completion stall against journal size).
// Writes figure-data.json (the exact series drawn) and calls m7_plot.py (python3 + matplotlib).
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './m7_metrics.mjs';
import { buildSeries, findThresholds } from './m7_series.mjs';
import { parseDriverStalls, stallTable } from './m7_stall.mjs';

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; ) {
  if (args[i].startsWith('--')) { flags[args[i].slice(2)] = args[i + 1]; args.splice(i, 2); } else i += 1;
}
const [csvPath, outDir = 'figures', configPath = 'data/support/trust-config.json'] = args;
if (!csvPath) {
  console.error('usage: node scripts/m7_figures.mjs <main/cycles.csv> [out-dir] [trust-config]');
  process.exit(2);
}
const series = buildSeries(parseCsv(readFileSync(csvPath, 'utf8')));
const thresholds = findThresholds(JSON.parse(readFileSync(configPath, 'utf8')));
mkdirSync(outDir, { recursive: true });
const dataPath = join(outDir, 'figure-data.json');
let stall;
if (flags.journal || flags['driver-log']) {
  if (!(flags.journal && flags['driver-log'])) throw new Error('--journal and --driver-log go together');
  const driver = parseDriverStalls(readFileSync(flags['driver-log'], 'utf8'), 'main');
  // JSON has no NaN: a cycle the driver did not measure is null.
  stall = stallTable(parseCsv(readFileSync(flags.journal, 'utf8')), driver).map((r) => ({ ...r, driverStallSec: Number.isNaN(r.driverStallSec) ? null : r.driverStallSec }));
}
writeFileSync(dataPath, `${JSON.stringify({ ...series, thresholds, ...(stall ? { stall } : {}) }, null, 2)}\n`);
const plot = join(dirname(fileURLToPath(import.meta.url)), 'm7_plot.py');
const run = spawnSync(process.env.M7_PYTHON ?? 'python3', [plot, dataPath, outDir], { stdio: 'inherit' });
if (run.status !== 0) {
  console.error('m7_plot.py failed (needs python3 and matplotlib)');
  process.exit(run.status ?? 1);
}
for (const name of readdirSync(outDir).filter((x) => x.endsWith('.svg'))) {
  const file = join(outDir, name);
  writeFileSync(file, readFileSync(file, 'utf8').replace(/[ \t]+$/gm, ''));
}
console.log(`figures written to ${outDir}`);
