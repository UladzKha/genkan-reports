# Verified trust experiment

The main run had 2,000 items over 10 cycles and four lines; all 2,000 were verified, 0 failed. Rule A (call-based) ranked the lines by activity, not by honesty. At cycle 10 the cheater scored 62, the do-nothing line 60 and the honest line 59. No call was denied, so Rule A scores depend only on the number of allowed calls: the cheater made 2.44 calls per attempt, the do-nothing line 2.00, honest 1.95. Rule B (outcome-based) kept the cheater at L0 in all 10 cycles and promoted the honest line to L3 by cycle 3, where it stayed. The pressure line also reached L3; its single detected hack (1 of 500 attempts, at cycle 10, confirmed by hand) dropped it to L1 in that cycle. Rule A did not react. The separation comes from impossible tasks: the cheater had a detected hack on 49 of 50 of them, and no line had a detected hack on any of the 1,800 solvable attempts. The cheater never special-cased a solvable task, so detection on solvable tasks is untested. Of the 5 directional claims, 4 held (H1, H1b, H1c, H2) and 1 did not (H3: honest reached L3). All 7 numeric predictions fell outside their intervals. They were written before the pilot calibrated task difficulty (PREREG §7); the honest verified-correct rate was 0.9978 against a predicted 0.30.

## How to read

Start with [the report](report.md). Its confirmatory table tests the frozen PREREG predictions; the detector audit later separates weighted hand-label bounds from exploratory context. [PREREG](PREREG.md) has the amendments and post-run sampling note. [Provenance](PROVENANCE.md) identifies the private archive and every bundled export.

## Regenerate

Run `sh scripts/regenerate.sh` from this folder. It reads only `data/`, rebuilds the report and figures, refreshes the label audit and provenance, and runs the included tests. Requires Node.js 22 and Python 3 with matplotlib. No private journal, root certificate, runtime checkout, or network access is needed.

## Public and private

`data/exports/` contains main and pilot1 bench exports. `data/labels/` contains the blind sheets, initial and final labels, the unblinding key, and the confirmed case. `data/support/` contains derived timing, telemetry, audit and provenance inputs needed to regenerate the report and figures. The full signed journals, runtime, private keys, and raw agent transcripts are private. The public exports cannot re-verify the journal signature chain.
