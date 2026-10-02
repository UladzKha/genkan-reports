// Build the public README and provenance record from bundled data and the generated report.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {listFiles} from './m7_build_report.mjs';

export function buildDocs(root='.') {
 const read=(p)=>readFileSync(join(root,p),'utf8');
 const report=read('report.md');
 const summary=report.match(/## Summary\n\n([\s\S]*?)\n\n## Setup/);
 if(!summary)throw new Error('report Summary missing');
 const oneParagraph=summary[1].replace(/\n\n/g,' ');
 const readme=`# Verified trust experiment\n\n${oneParagraph}\n\n## How to read\n\nStart with [the report](report.md). Its confirmatory table tests the frozen PREREG predictions; the detector audit later separates weighted hand-label bounds from exploratory context. [PREREG](PREREG.md) has the amendments and post-run sampling note. [Provenance](PROVENANCE.md) identifies the private archive and every bundled export.\n\n## Regenerate\n\nRun \`sh scripts/regenerate.sh\` from this folder. It reads only \`data/\`, rebuilds the report and figures, refreshes the label audit and provenance, and runs the included tests. Requires Node.js 22 and Python 3 with matplotlib. No private journal, root certificate, runtime checkout, or network access is needed.\n\n## Public and private\n\n\`data/exports/\` contains main and pilot1 bench exports. \`data/labels/\` contains the blind sheets, initial and final labels, the unblinding key, and the confirmed case. \`data/support/\` contains derived timing, telemetry, audit and provenance inputs needed to regenerate the report and figures. The full signed journals, runtime, private keys, and raw agent transcripts are private. The public exports cannot re-verify the journal signature chain.\n`;
 const prov=JSON.parse(read('data/support/provenance.json'));
 const fact=(label)=>{const x=prov.facts.find((f)=>f.label===label);if(!x)throw new Error(`missing provenance ${label}`);return x.value;};
 const seals=prov.facts.filter((f)=>f.label.startsWith('Seal '));
 const key=JSON.parse(read('data/labels/sample-key.json'));
 const preregHash=createHash('sha256').update(readFileSync(join(root,'PREREG.md'))).digest('hex');
 const exportFiles=listFiles(join(root,'data/exports'));
 const table=exportFiles.map((f)=>`| \`data/exports/${f.path}\` | ${f.bytes} | \`${f.sha256}\` |`).join('\n');
 const sealRows=seals.map((s)=>`| ${s.label} | ${s.value} |`).join('\n');
 const provenance=`# Provenance\n\nThe protocol was sealed before the run in a signed private journal and git history, not publicly preregistered. The public data cannot re-verify the signature chain without the private journal. The provenance facts below were recorded from verified private archive copies; this repo makes them inspectable but cannot independently replay that verification.\n\n- Release: ${fact('Release')}.\n- Dev spec hash: \`${fact('Main run spec hash')}\`.\n- Pi and PC archive verification: ${fact('Verify, Pi (coordinator)')}; ${fact('Verify, PC worker')}.\n- Archive: ${fact('Journal archive')}\n- Freeze point: ${fact('Freeze point')}.\n- Bundled PREREG SHA-256, including the post-run M7 sampling note: \`${preregHash}\`.\n- Pre-draw M7 sampling-note PREREG SHA-256: \`${key.preregSha256}\`; seal commit \`${key.sealCommit}\`.\n\n## PREREG hashes recorded at each seal\n\n| Seal | Record |\n|---|---|\n${sealRows}\n\n## Public export hashes\n\n| File | Bytes | SHA-256 |\n|---|---:|---|\n${table}\n`;
 return {readme,provenance};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const root=process.argv[2]??'.';
 const out=buildDocs(root);
 writeFileSync(join(root,'README.md'),out.readme);
 writeFileSync(join(root,'PROVENANCE.md'),out.provenance);
}
