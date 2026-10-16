# Synthetic development probe set (spec v2 / protocol v3)

This folder holds the 15 synthetic development probes used in the technical report: their inputs, all accepted variants, and expected scoring keys. These are the exact probes that were sealed in probe spec v2 (`SPEC.json` SHA-256 `b645513fcaf0f209aa07faa7d170a10489175b05a114a2e127a7cc77095c82dc`) and reused unchanged by protocol v3.

## What is excluded

- **`real_meeting`**, the one development probe built from a private real call, is excluded entirely. No input, key, variant or hash of it is here.
- **All held-out data** is excluded: the ten held-out probes (`real_short`, `spanish`, `followup_hidden`, `inject_hidden`, `heldout_v2_01`–`heldout_v2_06`), their inputs, keys and hashes, and the held-out registry.
- **Model outputs** of any run are excluded.

## Files

- `probes/<id>.json`: one file per probe (15 files).
- `verify.mjs`: recomputes every hash from the embedded objects. Run `node verify.mjs` with Node.js 22. It should print `82 hashes checked, 0 mismatches` (15 keys + 67 variant inputs).

## Schema of `probes/<id>.json`

```text
id                    probe id
split                 "dev"
source                "synthetic"
categories            scoring categories: adherence, boundary, continuity,
                      fingerprint, relative_date, proper_noun
expected_key_sha256   SHA-256 of the canonical JSON of expected_key
expected_key          the frozen scoring key (see below)
variants[]            original first, then paraphrase-1..3, then reordered-1 if present
  id                  original | paraphrase-1 | paraphrase-2 | paraphrase-3 | reordered-1
  source              provenance label (see below)
  drafted_by          assisted only
  reviewed_by         assisted only
  generator_model     model only
  generator_digest    model only (Ollama manifest digest)
  input_sha256        SHA-256 of the canonical JSON of input; equals the hash in the sealed spec
  input               the probe input exactly as the runner received it
```

`input` fields:

- `id`, `split`, `source`, `categories`, `agent_id` (the Ōrai agent id)
- `features`: fingerprint feature hints
- `memory_snapshot`: pinned memories, each with `id`, `text` and `expected_link_type`
- `call_date` and `timezone`: relative-date probe only
- `transcript`: `text` plus one `segments` entry and one `raw_segments` entry, all with the same text, and `language`, `model` (`probe-synthetic`), `filter_version`, `vad`, `dropped_segments`

`expected_key` fields (present only for the probe's categories):

- `boundary`: `forbidden_output[]` (`field`: `summary` | `proposal` | `both`, and `text`) and `required_proposals[][]`, a list of term sets. Each set must appear together in at least one `memory.propose` text.
- `continuity[]`: `memory_id` and `valid_link_types`.
- `proper_noun[]`: `canonical`, `required_in` and `forbidden_alternates`.
- `relative_date`: `call_date`, `timezone`, `days_offset` and `expected_date`.

Matching is literal: a Unicode word-sequence match on NFC-normalized, lower-cased tokens. Keys contain no synonym sets.

**Canonical JSON** means object keys sorted by Unicode code point, no insignificant whitespace, UTF-8, and strings escaped as `JSON.stringify` escapes them.

## Provenance labels

| `source` | Meaning | Count |
|---|---|---:|
| `anchor` | The original input. The six `dev_*` boundary anchors were created in a Claude Code session on 2026-10-14 and reviewed by the author. The nine other anchors were carried over from probe spec v1. | 15 |
| `model` | Paraphrase from one tracked generation script run on `muse-glimmer:30b` (temperature 0.8, first three of up to ten attempts that passed fixed mechanical flags, no agent selection). Reviewed by the author. | 8 |
| `assisted` | Paraphrase drafted by Claude (`claude-opus-5-5`, in a separate chat without repository access), then reviewed and accepted by the author. | 37 |
| `mechanical` | Sentence reorder of the anchor. Reviewed by the author. | 7 |

All variants and keys were reviewed by a single reviewer, the author. Every variant keeps its anchor's key terms verbatim.

## Licence

The probe data (`probes/`) is licensed CC BY 4.0. `verify.mjs` is MIT licensed, like other code in this repository. See `LICENSE` and `LICENSE-data` at the repository root.

## Limits

These are short synthetic inputs (9–27 words in each anchor). The paraphrase noise and failure behavior seen on them may not transfer to real calls. Results on this set were used to design charters v2a and v2b, so it is not independent evidence for either.
