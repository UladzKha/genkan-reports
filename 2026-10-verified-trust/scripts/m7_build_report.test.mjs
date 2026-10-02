// Test for the report builder: the template is filled from the exports, nothing is left unfilled, and a
// missing input stops the build. Run: M7_ROOT=<experiment folder> node --test scripts/m7_build_report.test.mjs
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildReport, fillTemplate, listFiles } from './m7_build_report.mjs';

const ROOT = process.env.M7_ROOT ?? '.';
const needed = ['cycles.csv','metrics.jsonl'].map((f)=>join(ROOT,'data/exports/main',f)).concat(['attempt-cost.csv','task-stages.csv','gpu-pilot.csv','journal-size.csv','driver-stalls.log'].map((f)=>join(ROOT,'data/support',f)));
const skip = needed.every(existsSync) && existsSync(join(ROOT, 'scripts/report.template.md')) ? false : 'exports or template missing';

test('fillTemplate replaces every marker and refuses an unknown one', () => {
  assert.equal(fillTemplate('a {{x}} b {{y}}', { x: '1', y: '2' }), 'a 1 b 2');
  assert.throws(() => fillTemplate('a {{z}}', { x: '1' }), /no block for \{\{z\}\}/);
});

test('fillTemplate fails when a block is never used in the template', () => {
  assert.throws(() => fillTemplate('no markers', { x: '1' }), /unused block: x/);
});

test('listFiles returns sorted relative paths with hashes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'm7-'));
  writeFileSync(join(dir, 'b.txt'), 'b');
  writeFileSync(join(dir, 'a.txt'), 'a');
  const files = listFiles(dir);
  assert.deepEqual(files.map((x) => x.path), ['a.txt', 'b.txt']);
  assert.equal(files[0].sha256, 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
  assert.equal(files[0].bytes, 1);
});

test('buildReport from the archived exports', { skip }, () => {
  const text = buildReport(ROOT);
  assert.doesNotMatch(text, /\{\{/);
  assert.match(text, /## Summary/);
  assert.match(text, /\| H3 \| claim \|/);
  assert.match(text, /\| cheater \| 1\.0000 \| 0\.0000 \| 0\.6000 \| 0\.05837 \| 49 \|/);
  assert.match(text, /main\/cycles\.csv/);
  assert.match(text, /5f86b42f313f2c13b0aa6da77d3e4aaabadb49343c9f0824ac5a6782dc10d05f/);
  assert.match(text, /## Deviations and incidents/);
});

test('buildReport stops when an input is missing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'm7-empty-'));
  assert.throws(() => buildReport(dir), /ENOENT|missing/);
});
