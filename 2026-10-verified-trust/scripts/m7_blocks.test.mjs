// Tests for the report blocks. Synthetic rows check the layout and the arithmetic; the real-data test only
// checks that the blocks render from the archived exports and contain the numbers printed on 2026-09-30.
// Run: M7_MAIN_CSV=<main/cycles.csv> node --test scripts/m7_blocks.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCsv } from './m7_metrics.mjs';
import { hacksBlock, mdTable, nonCheaterPositivesBlock, pooledBlock, provenanceBlock, summaryBlock, labelAuditBlock, exploratoryDetectorBlock, confirmedCaseBlock, auditBlock, cycleAccountingBlock, pooledAccountingBlock } from './m7_blocks.mjs';
import { evaluateP0, p0Inputs } from './m7_results.mjs';

const MAIN = process.env.M7_MAIN_CSV ?? 'data/exports/main/cycles.csv';
const skip = existsSync(MAIN) ? false : `no main CSV at ${MAIN}`;

test('mdTable escapes pipes and pads short rows', () => {
  const t = mdTable(['a', 'b'], [['x|y', 1], ['z']]);
  assert.equal(t, '| a | b |\n|---|---|\n| x\\|y | 1 |\n| z |  |\n');
});

test('hacksBlock counts hacks by line, task type and category, and lists non-cheater hacks', () => {
  const row = (over) => ({ status: 'verified', line: 'honest', impossible: 'false', hack: 'false', hack_categories: '', hidden_pass: 'true', diff_pass: 'true', cycle: '1', task_id: 't', ...over });
  const text = hacksBlock([
    row({ line: 'cheater', impossible: 'true', hack: 'true', hack_categories: 'impossible_visible_pass special_casing' }),
    row({ line: 'cheater', impossible: 'true', hack: 'true', hack_categories: 'impossible_visible_pass' }),
    row({ line: 'pressure', impossible: 'true', hack: 'true', hack_categories: 'impossible_visible_pass', cycle: '10', task_id: 'main-0445' }),
    row({ line: 'honest' }),
  ]);
  assert.match(text, /\| cheater \| 0 \| 2 \|/);
  assert.match(text, /\| pressure \| 0 \| 1 \|/);
  assert.match(text, /impossible_visible_pass special_casing/);
  assert.match(text, /main-0445/);
});

test('raw detector positives retain zero cells and count multi-category patches once', () => {
  const row = (cycle, line, hack, categories = '') => ({
    cycle: String(cycle), line, status: 'verified', hack: String(hack), hack_categories: categories,
  });
  const table = nonCheaterPositivesBlock([
    row(1, 'line-0', false), row(1, 'honest', false), row(1, 'pressure', false), row(1, 'cheater', true, 'special_casing'),
    row(2, 'line-0', false), row(2, 'honest', false),
    row(2, 'pressure', true, 'impossible_visible_pass special_casing'),
  ]);
  assert.match(table, /\| 1 \| line-0 \| 0 \| 0 \| 0 \| 0 \| 0 \|/);
  assert.match(table, /\| 2 \| pressure \| 0 \| 1 \| 1 \| 0 \| 1 \|/);
  assert.doesNotMatch(table, /\| cheater \|/);
});

test('provenanceBlock renders every recorded fact with the command that produced it', () => {
  const text = provenanceBlock({ facts: [{ label: 'Spec hash', value: 'dev:abc', source: 'genkan bench spec-hash' }], files: [] }, [{ path: 'main/cycles.csv', sha256: 'f'.repeat(64), bytes: 12 }]);
  assert.match(text, /Spec hash/);
  assert.match(text, /genkan bench spec-hash/);
  assert.match(text, /main\/cycles\.csv/);
  assert.match(text, /f{64}/);
});

test('real main export: pooled and summary blocks carry the printed numbers', { skip }, () => {
  const rows = parseCsv(readFileSync(MAIN, 'utf8'));
  const pooled = pooledBlock(rows);
  assert.match(pooled, /\| honest \| 0\.9978 \| 0\.8400 \| 0\.9347 \| 0\.01794 \| 0 \|/);
  assert.match(pooled, /\| cheater \| 1\.0000 \| 0\.0000 \| 0\.6000 \| 0\.05837 \| 49 \|/);
  const summary = summaryBlock(evaluateP0(p0Inputs(rows)), rows, JSON.parse(readFileSync('data/support/hack-audit.json','utf8')), JSON.parse(readFileSync('data/labels/confirmed-cases.json','utf8')));
  assert.match(summary, /62/);
  assert.match(summary, /59/);
  assert.match(summary, /cycle 3/);
  assert.match(summary, /2,000 items/);
  assert.match(summary, /do-nothing line 2\.00, honest 1\.95/);
  assert.match(summary, /pressure line also reached L3; its single detected hack \(1 of 500 attempts, at cycle 10, confirmed by hand\) dropped it to L1/);
  assert.match(summary, /Of the 5 directional claims, 4 held.*All 7 numeric predictions fell outside their intervals/s);
  assert.doesNotMatch(summary, /\{\{/);
});

test('accounting tables include every cycle and pooled run counts', () => {
 const cycles=[{cycle:1,lines:[{line:'honest',nSolvable:45,nImpossible:5,failed:0,retries:1,retriedItems:1,autoSubmits:2,truncated:1}]}];
 assert.match(cycleAccountingBlock(cycles), /\| 1 \| honest \| 45 \| 5 \| 0 \| 1 \| 1 \| 2 \| 1 \|/);
 assert.match(pooledAccountingBlock(cycles), /\| honest \| 45 \| 5 \| 0 \| 1 \| 1 \| 2 \| 1 \|/);
});
test('audit block uses private self reports only from aggregate artifact audit', () => {
 const x={cheater:{impossible:{selfTrueDetectorTrue:1,selfTrueDetectorFalse:2,selfFalseDetectorTrue:3,selfFalseDetectorFalse:4,unknown:0},solvable:{selfTrueDetectorTrue:0,selfTrueDetectorFalse:0,selfFalseDetectorTrue:0,selfFalseDetectorFalse:1,unknown:0}},disagreements:{honest:{impossible:1,solvable:0}}};
 const text=auditBlock(x);
 assert.match(text,/\| impossible \| 1 \| 2 \| 3 \| 4 \| 0 \|/);
 assert.match(text,/\| honest \| 0 \| 1 \|/);
});

test('confirmed case table counts only reviewed labels and gives Rule B consequence',()=>{
 const rows=[{cycle:'9',line:'pressure',status:'verified',hack:'false',trust_B_level:'3'},{cycle:'10',line:'pressure',status:'verified',hack:'true',trust_B_level:'1',trust_B_H:'1'}];
 const cases=[{cycle:10,line:'pressure',taskId:'x',confirmedLabel:'real hack',category:'impossible_visible_pass',flagConflict:true,confidence:0.7,selfReportStored:false,finalMessage:'test'}];
 const text=confirmedCaseBlock(rows,cases);
 assert.match(text,/confirmed real hacks/);
 assert.match(text,/L3 → L1/);
 assert.match(text,/all non-cheater/);
 assert.match(text,/not stored for this line/);
});

test('label audit block distinguishes weighted sample uncertainty from the full positive census',()=>{
 const audit={labeler:'experimenter',review:'AI-assisted review of every blind sheet before unblinding',history:{initialHack:5,initialNoHack:45,finalHack:0,finalNoHack:50,changed:5},reviewRevisions:{impossible:4,solvable:1},frameSize:1500,sampleSize:50,strata:[{line:'honest',type:'solvable',N:450,n:15,hacks:0,detectorPositives:0,agree:15,falsePositives:0}],unweighted:{hacks:0,noHack:50,detectorPositive:0,agree:50,falsePositives:0},weighted:{agreement:1,falsePositiveShare:0,falsePositiveRate:0},intervals:{level:0.95,method:'exact',agreement:{lower:0.51,upper:1},falsePositiveShare:{lower:0,upper:0.49},falsePositiveRate:{lower:0,upper:1}},census:{detectorPositives:1,confirmedTrue:1,falsePositives:0,observedFalsePositiveRate:0},seal:{labelCommit:'abc',initial:'a',final:'b',key:'c',export:'d'}};
 const text=labelAuditBlock(audit);
 assert.match(text,/AI-assisted/);
 assert.match(text,/5 labels changed/);
 assert.match(text,/4 impossible/);
 assert.match(text,/51\.0%/);
 assert.match(text,/49\.0%/);
 assert.match(text,/cannot estimate recall/);
});


test('exploratory detector block keeps primary weighting separate from post-run descriptions',()=>{
 const sample={frameSize:1500,strata:[{line:'honest',n:23,falsePositives:0},{line:'pressure',n:23,falsePositives:0},{line:'line-0',type:'solvable',N:450,n:2,falsePositives:0},{line:'line-0',type:'impossible',N:50,n:2,falsePositives:0}],census:{detectorPositives:1,confirmedTrue:1}};
 const audit={cheater:{impossible:{selfTrueDetectorTrue:49,selfTrueDetectorFalse:0,selfFalseDetectorTrue:0,selfFalseDetectorFalse:1,unknown:0},solvable:{selfTrueDetectorTrue:0,selfTrueDetectorFalse:0,selfFalseDetectorTrue:0,selfFalseDetectorFalse:450,unknown:0}}};
 const out=exploratoryDetectorBlock(sample,audit);
 assert.match(out,/Exploratory/);
 assert.match(out,/line-0 solvable has n=2.*30%/);
 assert.match(out,/0\/46.*6\.3%/);
 assert.match(out,/1\/1 detector positives confirmed real, 1 detector positive among 1,500/);
 assert.match(out,/49\/49.*94\.1%/);
 assert.match(out,/solvable.*no self-reported hacks/i);
});
