// Tests for the completion-stall table (figure 4). Run: node --test scripts/m7_stall.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDriverStalls, stallTable } from './m7_stall.mjs';

const LOG = [
  '2026-09-29T13:57:24.847Z main/4 completed line-0 50/50 failed 0; honest 50/50 failed 0; pressure 50/50 failed 0; cheater 50/50 failed 0',
  '2026-09-29T13:57:24.980Z main/4 run 1 coordinator stall 26s',
  '2026-09-29T13:57:26.368Z main/4 run 1 failed 0/200 rerunRequired false protocol ok decision advance ',
  '2026-09-30T08:40:18.075Z main/9 run 1 coordinator stall 66s',
  '2026-09-30T08:40:18.076Z warning: main/9 run 1 coordinator stall 66s exceeds 5 minutes',
  '2026-09-29T11:29:30.834Z coordinator unresponsive for 60s',
  '2026-09-28T19:57:34.750Z main/1 run 1 failed 0/200 rerunRequired false protocol ok decision advance ',
  '2026-09-28T19:00:00.000Z pilot1/2 run 1 coordinator stall 12s',
].join('\n');

test('parseDriverStalls reads main stall lines only, ignores warnings and other splits', () => {
  const stalls = parseDriverStalls(LOG, 'main');
  assert.deepEqual([...stalls], [[4, 26], [9, 66]]);
});

test('parseDriverStalls refuses a cycle and run that appears twice', () => {
  assert.throws(() => parseDriverStalls(`${LOG}\n2026-09-30T09:00:00.000Z main/4 run 1 coordinator stall 30s`, 'main'), /twice/);
});

test('stallTable joins journal size, journal stall and the driver stall by cycle', () => {
  const row = (over) => ({
    cycle: '1', completed_ts_ms: '1000000', completed_received_at_ms: '1000001', events_at_completion: '100',
    trust_received_at_ms: '1006500', trust_update_events: '2', ...over,
  });
  const table = stallTable([row({}), row({ cycle: '4', completed_ts_ms: '2000000', events_at_completion: '200', trust_received_at_ms: '2025000' })], new Map([[4, 26]]));
  assert.deepEqual(table, [
    { cycle: 1, events: 100, journalStallSec: 6.5, driverStallSec: Number.NaN },
    { cycle: 4, events: 200, journalStallSec: 25, driverStallSec: 26 },
  ]); // node:assert/strict compares NaN with Object.is
});

test('stallTable fails on a missing trust update or one rule only', () => {
  const base = { cycle: '1', completed_ts_ms: '1', events_at_completion: '1', trust_received_at_ms: '5', trust_update_events: '2' };
  assert.throws(() => stallTable([{ ...base, trust_received_at_ms: '' }], new Map()), /no trust.update/);
  assert.throws(() => stallTable([{ ...base, trust_update_events: '1' }], new Map()), /expected 2/);
});
