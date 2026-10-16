# Provenance of numbers in report.md

This file is not part of the PDF. It maps each number in `report.md` to its source. Paths starting `docs/`, `orai/` and `tools/` are in the private genkan-pi repository. They are named for provenance and are not public links. "Public:" means a report in this repository. "Derived" means simple arithmetic on sourced values, with the arithmetic shown.

Abbreviations: **v1rep** = Public `2026-10-charter-identity-probes/report.md`; **v2rep** = Public `2026-10-probe-v2-cross-model/report.md`; **csrep** = Public `2026-10-charter-series/report.md`; **spec2** = `docs/sprints/probe-spec-v2.md`; **base2** = `docs/sprints/probe-v2-baseline.md`; **cross2** = `docs/sprints/probe-v2-cross-model.md`; **spec3** = `docs/sprints/probe-spec-v3.md`; **repro3** = `docs/sprints/probe-v3-v1-reproduction.md`; **d2a** = `docs/sprints/charter-v2a-design.md`; **r2a** = `docs/sprints/probe-v3-v2a-cross-model.md`; **fail** = `docs/sprints/probe-v3-v2a-dev-boundary-failure-analysis.md`; **carry** = `docs/sprints/probe-v3-v2a-summary-carry-analysis.md`; **abl** = `docs/sprints/probe-v3-v2a-call-ablation.md`; **d2b** = `docs/sprints/charter-v2b-design.md`; **r2b** = `docs/sprints/probe-v3-v2b-cross-model.md`; **p2a / p2b** = `orai/probes/v3/charter-v2a-predictions.json` / `charter-v2b-predictions.json`; **WL** = `docs/WORKLOG.md` (entry heading given); **ac** = `docs/sprints/agent-charter.md`; **sc1** = `orai/probes/score.mjs` (v1 scorer); **sc2** = `orai/probes/v2/score.mjs` (v2 scorer).

## 1. Abstract

| Number / claim | Source |
|---|---|
| 16 dev probes, 10 held-out | v2rep "Setup"; cross2 |
| 159/159 files | csrep "Question and protocol"; repro3 "Reproduction gate" (71+10+68+10) |
| verdict false under every charter | repro3; r2a; r2b (first lines) |
| v1: fingerprint pass, behavioral fail; v2a/v2b: both fail | repro3 "Charter-v1 model row"; r2a and r2b "For the v2a/v2b model axis" (fingerprint gate fails and behavioral gate fails) |
| 25 → 12 → 25 of 39 (Qwen); 15 → 18 → 9 (Gemma) | r2b "Three-by-two boundary context"; csrep table |
| agreement 21/39 → 15/39 | same table |
| five of eight outcomes not held | csrep predictions table; r2a and r2b "Preregistered/Pushed predictions" (v2a: 2 not held; v2b: 3 not held) |

## 3. System

| Claim | Source |
|---|---|
| Registry, signed append-only log, replication; coordinator Raspberry Pi; workers keep verified replicas | genkan-pi `AGENTS.md` "What this is"; v1rep "Incident" (Pi, replication barrier) |
| Charter fields, signed `agent.charter.adopted`, charter_hash on turns, model tag/digest/options/code_ref | v1rep "What changed"; d2a "Diff from charter v1" (field names) |
| Bootstrap equivalence and one-character mutation test | v1rep "What changed" |
| Summary map / reduce / reduce_strict prompts, call prompt, `memory.propose` | d2a diff; fail "Classification rule" |
| Level 0 | v1rep "Baseline" (level-0 capability checks); d2a ("capabilities (including level 0)") |
| Isolated journal copy / in-memory store; no adoption of v2a/v2b | base2 bullets; repro3; r2a; r2b; csrep "Decision" |

## 4. Method

| Number / claim | Source |
|---|---|
| 15 synthetic anchors + 1 private real original; 68 dev first variants | v2rep "Setup"; base2 |
| K ≤ 3 paraphrases, optional `reordered-1`; 7 reorders | spec2 "Input variants and noise model"; spec2 "Clean regeneration" ("seven mechanical sentence reorders") |
| 39 boundary variants = 7×5 + 4 | Derived from spec2 reorder table (dev_multilingual has no reorder) and v2rep variant table |
| `muse-glimmer:30b`, digest, flag rules, first three passing attempts | spec2 "Clean regeneration" |
| `assisted` = Claude `claude-opus-5-5`, separate chat, no repo access, reviewed by Ulad | spec2 "Variant sources" |
| 52 accepted (8 model, 37 assisted, 7 reorders), 20 rejected | WL "2026-10-14 — review import committed, assisted provenance, pre-freeze check" |
| 37 assisted first imported as `human`, corrected, re-attested | spec2 "Provenance correction"; re-attestation commit `e8427be` (2026-10-15 10:07 +02:00, `git log`), before seal `fd3e285` |
| Literal-term policy, no synonym sets | spec2 "Literal-term policy" |
| 10 held-out: 6 new + 4 from v1; sentinel `inject_hidden` | spec2 "Held-out isolation"; v2rep "Setup" |
| Deny rules are an agent boundary, not OS isolation | spec2 "Exact private registration layout" |
| Scorer categories and definitions | spec2 "Deterministic scoring keys", "Behavioral gate", "`no_fabricated_date`"; v1rep (adherence subchecks) |
| Fingerprint set contents: `skip`, `p:<token>`, `link:<type>:<memory_id>`, three `feature:` regex flags; empty unless schema passes | sc1 `score()` lines 39–50 (`const fingerprint = new Set()` … `feature:` flags), `fingerprint: [...fingerprint].sort()` line 54; sc2 line 2 imports v1 `score`/`distance`, line 163 `fingerprint: base.fingerprint` |
| Tokenization: `/[\p{L}\p{N}]+/gu` after `String#toLowerCase`, no NFC; 17-word stop list | sc1 lines 2, 7, 8 (`WORD`, `STOP`, `words`) |
| Jaccard distance `1 − common/union`, 0 for two empty sets | sc1 `distance()` lines 58–65; ac "Phase 4 baseline" |
| Fingerprint gate formula, 0.05 floor, equal probe weight | spec2 "Decided comparison rule"; sc2 comparator (lines ~285–313: per-probe `mean_dw`, `mean_dx`, `threshold = Math.max(floor, pooled_dw)`) |
| Behavioral gate ≤ 1 loss, gains do not cancel | spec2 "Behavioral gate"; v2rep |
| Charter-axis gate, model-dependence metrics, reproduction gate | spec3 "Comparison rules to seal" |
| oathgate 0.1.0, check before/after each run | v2rep; base2; cross2; repro3; r2a; r2b |
| Predictions committed and pushed; `ls-remote` check | csrep; r2a and r2b "Seal, preflight" / "Run checks" |
| Leak check: zero 3-content-word sequences, zero uncommon key-term matches | d2a "Development-only wording check"; d2b "Dev-only leak check" |
| Options: temperature 0, think:false, summary format:null ctx 8192 predict 512; call JSON ctx 8192 predict 1024 | v2rep "Setup"; cross2 "Preflight" |
| 110 pairs, mean Jaccard 0 | v1rep "Variance and interpretation"; ac "Phase 4 baseline" |
| Spot checks and selection | spec2 "Selection rule"; base2 (last paragraph) |
| Gemma exploratory determinism 3/3 identical | cross2 "Exploratory, not frozen" |

## 5. Experiments

| Number / claim | Source |
|---|---|
| Step dates | WL headings: v1 baseline in charter sprint Phase 4 (2026-10-14; baseline commit `a48cac7` dated 2026-10-14); v2 baseline and Gemma 2026-10-15; v3 runs 2026-10-16 (repro3, r2a, r2b) |
| Candidate constraint | spec2 "Run sequence" item 3 |
| Model digests | v2rep "Setup"; repro3 |
| Only one model loaded per run | cross2 "Preflight"; repro3; r2a; r2b |
| Spec v1: 14 inputs (12 synthetic, 2 real), 4 held out; 60/60, 10/15, 10/15 | v1rep "Frozen probe spec", "Baseline"; ac "Phase 4 baseline (frozen spec)" |
| `inject_hidden` and `continuation` failures; continuation key correction after v1 outputs | v1rep "Two baseline failures"; ac "Phase 4 baseline"; spec2 "Continuity" |
| Spec v2 seal 19:40:11 UTC, sealed commit `fd3e285` | v2rep "Question and frozen rule"; `orai/probes/v2/oathgate.lock` `frozen_at` |
| Package 0.15.1 | base2; cross2 |
| v3 seal commit `18fbbcc`, 2026-10-16 | repro3 "Pins and preflight"; `git log` |
| 71/71, 10/10, 68/68, 10/10 | repro3 "Reproduction gate" |
| Same modules hash `0828793c…` across v2 and v3 | base2; repro3; r2a; r2b |
| v2a content | d2a "Diff from charter v1"; option a in d2a |
| v2b content | d2b "Diff: v2a → v2b" |
| Dev used twice for design | p2b `reporting.disclosure`; WL "2026-10-16 — draft charter v2a" ("using only development evidence") |

## 6. Results

| Table / number | Source |
|---|---|
| 6.1 split table | v2rep "Results"; cross2 "Original-variant scores by split" |
| d_w 0.304456, d_x 0.279842, threshold, 1/7 probes (`contradiction`), Gemma d_w 0.307862 | cross2 "Frozen comparison", "Reported noise and dates" |
| Behavioral 24/24/0, 8/7/4, 4/4/0, 1/0/1 | cross2 behavioral table |
| 4 losses / 3 gains; 0/26 fabricated dates | v2rep "Findings"; cross2; repro3 |
| 25/39 and 15/39; 5/8 and 3/8 | cross2 "Variant-level boundary" |
| 6.2 dev boundary per charter | r2b "Three-by-two boundary context" |
| Boundary originals 8/12 → 4/12 (Qwen v2a), 7/12 → 7/12 (Gemma v2a) | r2a charter-axis boundary table |
| Boundary originals 8/12 → 9/12, 7/12 → 5/12 (v2b) | r2b charter-axis boundary table |
| Boundary originals = 8 dev + 3 blind + 1 sentinel | Derived: cross2 split table (8 + 3 + 1 = 12) |
| v2a fingerprint 0.316182 > 0.258668 | r2a "For the v2a model axis" |
| v2b fingerprint 0.310100 > 0.262967 | r2b "For the v2b model axis" |
| v1 fingerprint pass | repro3 "Charter-v1 model row" |
| losses/gains 4/3, 2/5, 6/2; agreement 21, 15, 15 | r2b three-by-two table |
| Other-category model-axis losses | repro3 (v1: adherence 0, continuity 0, proper noun 1); r2a and r2b (adherence 0, continuity 1, proper noun 0) |
| Charter-axis table | r2a and r2b charter-axis tables |
| 26/40 → 13/40 and 26/40 → 26/40 comparator discrepancy | r2a; r2b |
| Per-probe v1 / v2a table | r2a "Dev probe" transition table (v1 columns also match cross2) |
| 6.3 failure-mode table | r2b "Dev boundary failure modes" (v1/v2a rows identical to fail "Scope and counts") |
| Rule hash `8334aa83…` and F3 → F4 refinement | fail "Classification rule" |
| No scored forbidden text in v2b | r2b "Dev boundary failure modes" |
| Excerpts | fail "Short dev output excerpts" (synthetic dev only) |
| 6.4 predictions | p2a, p2b (rules); r2a, r2b (observed, outcome); csrep table |
| 6.5 held-out table | csrep "Held-out outcomes, by ID only"; sentinel row from csrep paragraph after table, cross2 and r2a / r2b |

## 7. Exploratory analyses

| Number / claim | Source |
|---|---|
| S × P table; rule hash `f7160ae0…` | carry "S × P"; carry "Detection rule" |
| 14 of 14 S=true, 11 still state the decision, 24 S without P, Gemma 22 / 0 | carry "Interpretation"; carry Qwen v2a F3 table |
| 6 of 14 were PASS under v1 | carry "Qwen v2a: every F3 case" |
| Ablation prereg commit `a42d2fc` | abl "Results" |
| A/B/C 24, 12, 18 of 39; A 39/39 output matches | abl results table |
| B 2/14, C 1/14, "neither", thresholds | abl "Predictions, fixed before calls"; "Recovery" |
| 27/39 content-free, 12/14 targets | abl "Recovery" and "Removal audit" |

## 8. Discussion

| Number / claim | Source |
|---|---|
| 0.280 vs 0.304 vs 0.308 | cross2 |
| Margins 0.058 and 0.047 | Derived: 0.316182 − 0.258668 = 0.057514; 0.310100 − 0.262967 = 0.047133 |
| Qwen F2 8 → 0, F1 0 → 12, F3 5 → 14; Gemma F3 8 → 0; Gemma v2b F3 29 | fail / r2b failure-mode table |
| Losses 4 → 2 → 6 | r2b three-by-two table |
| F4 = 7 of Qwen's 14 v2b failures; 7 of Gemma's 24 v1 failures | Derived from the failure-mode table (39 − 25 = 14; 39 − 15 = 24) |
| F1 counts 12 and 14 under v2a | failure-mode table |
| 3 of 14 decisions lost or weakened in the summary | carry "Qwen v2a: every F3 case" |
| Production stays on v1; iteration stops | csrep "Decision and provenance" |

## 9. Limitations

| Number / claim | Source |
|---|---|
| 8 boundary probes / 39 variants; 3 blind + 1 sentinel | cross2 tables |
| Anchors 9–27 words | spec2 utterance/word table (min `routine` 9, max `dev_user_spoof` 27) |
| Single reviewer (the author) for variants and keys | spec2 "Variant provenance", "Remaining decisions" item 1; WL "review import committed" (reviewer `Ulad`); `reviewed_by: "Ulad"` on every assisted row of `orai/probes/v2/SPEC.json` |
| Environment stops and manifest `9b12445f…` | v2rep "Process and limits"; WL entries for 2026-10-15 baseline attempts; base2 "Reproducibility gate" |
| 78/78 Gemma reproduction | Derived from repro3 (68 + 10) |

## 10–12 and Appendix

| Item | Source |
|---|---|
| Assistance split | Task instruction from Ulad; spec2 "Variant sources"; spec2 "Held-out isolation" (held-out written outside the session) |
| genkan-reports URL | genkan-reports `git remote` (`git@github.com:UladzKha/genkan-reports.git`) |
| oathgate URL and PyPI 0.1.0 | `oathgate/pyproject.toml` (`Homepage`, `version = "0.1.0"`); WL 2026-09-25 entry ("installed from PyPI"); spec3 (`uvx oathgate==0.1.0`) |
| Next steps | csrep "Decision and provenance" |
| Spec v1 ruler `0f11d02b…` | v1rep "Frozen probe spec" |
| Spec v2 hash, ruler, time | v2rep; `orai/probes/v2/oathgate.lock` |
| Held-out registry `cabd81b4…` | spec2 "Freeze handoff"; WL "2026-10-15" seal note |
| v3 spec, ruler | repro3; ruler time from `orai/probes/v3/oathgate.lock` `frozen_at` |
| Charter and prediction hashes | d2a; d2b; r2a; r2b; recomputed with `sha256sum` on 2026-10-16, matching |
| Model digests | v2rep; repro3; spec2 (muse-glimmer) |
| Commits | v1rep (a48cac7); v2rep / base2 (fd3e285); repro3 (18fbbcc); r2a (2441c0b); abl (a42d2fc, 2441c0b); r2b (d2b0d43); full hashes from `git log` |
| Modules hash | base2; repro3; r2a; r2b |
| Result-set manifests | base2; cross2 (incl. exploratory); repro3, r2a, r2b "Private result locations"; abl "Removal audit" |

## Appendix B and the dev set

| Item | Source |
|---|---|
| Appendix B diff blocks | Copied programmatically from the single `diff` block in d2a "Diff from charter v1" and the two `diff` blocks in d2b "Diff: v2a → v2b" and "Diff: v1 → v2b" |
| Dev-set contents | Exported from `orai/probes/v2/SPEC.json` dev entries with `source: "synthetic"` (15 of 16; `real_meeting` filtered out before any blob path was built). The input and key blobs were read from the private dev blob store by hash. Each blob's SHA-256 was checked against the spec, and its bytes were checked to equal the canonical JSON re-serialization. |
| 52 accepted variants / 82 hashes | Derived: 67 variant inputs (68 dev first variants − 1 `real_meeting`) = 15 anchors + 52 variants; 67 + 15 keys = 82 |
| Source labels and counts | `source`, `drafted_by`, `reviewed_by`, `generator_model`, `generator_digest` fields in `orai/probes/v2/SPEC.json`. Counts 8 / 37 / 7 match WL "review import committed". |
| Six `dev_*` anchors created by the coding agent on 2026-10-14 | WL "2026-10-14 — implement probe spec v2 draft without freeze" ("Created six synthetic development boundary anchors and keys") |
| Nine anchors from spec v1 | Derived: v1 had 12 synthetic inputs (WL "Charter sprint Phase 3"), of which 3 are held out (`spanish`, `inject_hidden`, `followup_hidden`) |
| Canonical JSON rule | genkan-pi `src/canonical/json.ts` header comment |
| Appendix C hashes | `sha256sum` of the exported files, 2026-10-16 |
| Privacy check | Scan of `dev-set/probes/`: banned set = ids and input/key hashes of every non-synthetic or non-dev entry in `orai/probes/v2/SPEC.json` plus the held-out registry hash (34 terms), together with path, key, e-mail, IP and host patterns. Result: 0 hits. |
