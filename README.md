# Genkan public evaluation reports

This repository holds public reports from Genkan, a personal-agent runtime project, and its evaluation work. The private runtime code, signed journals, and private input data are not released. The reports give aggregate results and hashes for private material. The repository also includes public derived exports and synthetic development probes where a report says so.

## How these reports are made

Evaluation specs and scorers are frozen with [oathgate on GitHub](https://github.com/UladzKha/oathgate) ([PyPI](https://pypi.org/project/oathgate/0.1.0/)) before runs. Predictions are committed and pushed before the runs they cover. Held-out probes are kept blind. Negative results are published as they are.

## Reports

| Date | Directory | Summary | DOI |
| --- | --- | --- | --- |
| 2026-10-16 | [Technical report](2026-10-technical-report/) | Brings together the identity and charter evaluations; the frozen test found model-dependent behavior under every charter. | [10.5281/zenodo.23422670](https://doi.org/10.5281/zenodo.23422670) |
| 2026-10-16 | [Charter series](2026-10-charter-series/) | Tests three charter texts on two models; none passed the same-agent test. | — |
| 2026-10-16 | [Cross-model probes](2026-10-probe-v2-cross-model/) | Compares two models under one charter; the behavior gate failed. | — |
| 2026-10-14 | [Charter identity probes](2026-10-charter-identity-probes/) | Records the first charter's frozen identity-probe baseline and live adoption. | — |
| 2026-10-02 | [Verified trust](2026-10-verified-trust/) | Compares call-count and verified-outcome trust rules over 2,000 benchmark attempts. | — |

## Citing

For the technical report: Khadakouski, U. (2026). *Pre-registered evaluation of agent identity under model and charter change: a negative result* (Version 1.0). Zenodo. [https://doi.org/10.5281/zenodo.23422670](https://doi.org/10.5281/zenodo.23422670).

The repository's archived releases have a separate DOI through the Zenodo GitHub integration: [10.5281/zenodo.23105309](https://doi.org/10.5281/zenodo.23105309).

## AI assistance

Claude Code and Claude helped with implementation, runs, analysis drafts, and report drafting under the author's direction; the author made the design, review, freeze, prediction, and adoption decisions.

Author: Uladzimir Khadakouski ([ORCID 0009-0000-9625-9938](https://orcid.org/0009-0000-9625-9938)).

Code is MIT licensed under [LICENSE](LICENSE). Report text, figures, and data are CC BY 4.0 licensed under [LICENSE-data](LICENSE-data).
