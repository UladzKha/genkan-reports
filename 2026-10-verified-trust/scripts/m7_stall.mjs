// Completion stall per main cycle (figure 4), from two sources:
//  - journal: the trust.update.completed events (rule A and rule B) carry the cycle's completion time as `ts`,
//    but `received_at` is when the coordinator appended them, after the full-journal refold. The latest
//    received_at minus the completion time is the stall as the journal records it. Exists for every cycle.
//  - driver log: `<ts> main/N run R coordinator stall Ss`, the driver's own measure (first /health answer after
//    the completion event), logged from main/4 on only.
// They measure the same pause at two places; both are reported, neither is converted into the other.

/** Map cycle -> stall seconds from the driver log, for one split. A cycle/run that appears twice is an error. */
export function parseDriverStalls(text, split) {
  const out = new Map();
  const seen = new Set();
  for (const line of text.split('\n')) {
    const m = /^\S+ (\w+)\/(\d+) run (\d+) coordinator stall (\d+)s$/.exec(line.trim());
    if (!m || m[1] !== split) continue;
    const cycle = Number(m[2]);
    const id = `${cycle}/${m[3]}`;
    if (seen.has(id)) throw new Error(`stall for ${split}/${id} appears twice in the driver log`);
    seen.add(id);
    out.set(cycle, Number(m[4]));
  }
  return out;
}

/** journalRows are journal-size.csv rows; driverStalls comes from parseDriverStalls. */
export function stallTable(journalRows, driverStalls) {
  return journalRows
    .map((row) => {
      const cycle = Number(row.cycle);
      const completed = Number(row.completed_ts_ms);
      const recorded = Number(row.trust_received_at_ms);
      if (row.trust_received_at_ms === '' || !Number.isFinite(recorded)) throw new Error(`no trust.update.completed recorded for cycle ${cycle}`);
      if (Number(row.trust_update_events) !== 2) throw new Error(`cycle ${cycle} has ${row.trust_update_events} trust.update.completed events, expected 2 (rule A and B)`);
      return {
        cycle,
        events: Number(row.events_at_completion),
        journalStallSec: (recorded - completed) / 1000,
        driverStallSec: driverStalls.has(cycle) ? driverStalls.get(cycle) : Number.NaN,
      };
    })
    .sort((a, b) => a.cycle - b.cycle);
}
