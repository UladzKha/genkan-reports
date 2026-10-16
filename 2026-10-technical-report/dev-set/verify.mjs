// Recompute every input_sha256 and expected_key_sha256 in probes/*.json.
// Each hash is SHA-256 of the canonical JSON of the embedded object: keys sorted by Unicode
// code point, no insignificant whitespace, UTF-8, strings escaped as JSON.stringify does.
// Usage (Node.js 22): node verify.mjs
import fs from 'node:fs';
import { createHash } from 'node:crypto';

function canonical(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('non-finite number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const keys = Object.keys(value).sort((a, b) => {
    const x = [...a], y = [...b];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      const d = x[i].codePointAt(0) - y[i].codePointAt(0);
      if (d) return d;
    }
    return x.length - y.length;
  });
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}
const sha = (value) => createHash('sha256').update(canonical(value), 'utf8').digest('hex');

const dir = new URL('./probes/', import.meta.url);
let checked = 0, failed = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const probe = JSON.parse(fs.readFileSync(new URL(file, dir)));
  const pairs = [[probe.expected_key, probe.expected_key_sha256, 'key']];
  for (const v of probe.variants) pairs.push([v.input, v.input_sha256, v.id]);
  for (const [value, expected, label] of pairs) {
    checked++;
    if (sha(value) !== expected) {
      failed++;
      console.log(`MISMATCH ${probe.id}/${label}`);
    }
  }
}
console.log(`${checked} hashes checked, ${failed} mismatches`);
process.exitCode = failed === 0 ? 0 : 1;
