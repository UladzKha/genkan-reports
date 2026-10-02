import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildDocs} from './build_docs.mjs';
import {buildReport} from './m7_build_report.mjs';

test('bundled data regenerates the committed report and public documentation',()=>{
 const report=buildReport('.');
 assert.equal(report,readFileSync('report.md','utf8'));
 const docs=buildDocs('.');
 assert.equal(docs.readme,readFileSync('README.md','utf8'));
 assert.equal(docs.provenance,readFileSync('PROVENANCE.md','utf8'));
 assert.match(report,/\| H2 \| claim \|/);
 assert.match(report,/L0 in all 10 cycles \(k = 1\)/);
 assert.doesNotMatch(report,/\/home\/|\/mnt\/|\.ts\.net|cachyos|apollon/);
});
