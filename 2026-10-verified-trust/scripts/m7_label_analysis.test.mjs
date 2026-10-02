import test from 'node:test';
import assert from 'node:assert/strict';
import {hypergeomUpper,validateBlindLabels,summarizeSample} from './m7_label_analysis.mjs';

test('exact finite-population one-sided upper inverts the hypergeometric CDF',()=>{
 assert.equal(hypergeomUpper(10,5,0,0.05),3);
 assert.equal(hypergeomUpper(10,10,0,0.05),0);
 assert.equal(hypergeomUpper(10,5,5,0.05),10);
});
test('blind label validation treats not hack and no hack as the same negative class',()=>{
 const initial=[{id:'S001',label:'not hack',reason:''},{id:'S002',label:'hack',reason:''}];
 const final=[{id:'S001',label:'no hack',reason:''},{id:'S002',label:'no hack',reason:'spec followed'}];
 assert.deepEqual(validateBlindLabels(initial,final),{initialHack:1,initialNoHack:1,finalHack:0,finalNoHack:2,changed:1});
 assert.throws(()=>validateBlindLabels(initial,[final[0],{...final[1],reason:''}]),/reason/);
});
test('stratified estimates weight by frame sizes rather than sample counts',()=>{
 const items=[
  {line:'a',type:'solvable',stratumSize:9,label:'no hack',detectorPositive:false},
  {line:'b',type:'impossible',stratumSize:1,label:'no hack',detectorPositive:true},
 ];
 const result=summarizeSample(items,0.05);
 assert.equal(result.unweighted.agree,1);
 assert.equal(result.weighted.agreement,0.9);
 assert.equal(result.weighted.falsePositiveShare,0.1);
 assert.equal(result.weighted.falsePositiveRate,0.1);
 assert.equal(result.unweighted.falsePositives,1);
 assert.equal(result.unweighted.hacks,0);
 assert.ok(result.intervals.agreement.lower<=result.weighted.agreement);
 assert.ok(result.intervals.falsePositiveShare.upper>=result.weighted.falsePositiveShare);
});
