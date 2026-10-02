#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
node scripts/m7_label_analysis.mjs .
node scripts/m7_figures.mjs data/exports/main/cycles.csv figures data/support/trust-config.json --journal data/support/journal-size.csv --driver-log data/support/driver-stalls.log
node scripts/m7_build_report.mjs .
node scripts/build_docs.mjs .
node --test scripts/*.test.mjs
