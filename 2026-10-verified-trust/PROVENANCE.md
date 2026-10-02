# Provenance

The protocol was sealed before the run in a signed private journal and git history, not publicly preregistered. The public data cannot re-verify the signature chain without the private journal. The provenance facts below were recorded from verified private archive copies; this repo makes them inspectable but cannot independently replay that verification.

- Release: tag v0.10.0, version string 0.10.0-rc.8, commit e7e78504b3ba473e04dab35e17b200032fb8ee54.
- Dev spec hash: `dev:b8ca88e5f84bcb38b71968374667ba189352e125dca1add669da89d546ef264e`.
- Pi and PC archive verification: result ok, 130519 events, 4 nodes; result ok, 130519 events, 4 nodes.
- Archive: Fresh Pi archive [private Pi archive] and PC copy [private PC copy of Pi archive]: sha256 a409a1e2c3ddd6ad17b533280606be054316dd8f218763e7878a98790c70c3d2. Fresh PC archive [private PC archive]: sha256 e464133a18471b63e2eb9989048959c837fc2bfe3ce25960d2d4663fab35e6e2. Each has 130519 events and integrity_check ok. The frozen comparison prefix ends at Pi cursor 130514.
- Freeze point: main/10 bench.cycle.completed coordinator seq 68693, id ba71feb2831d3fcce91d1462f7aec279e1e2f6b53743277adb0d139e949f3300; last subsequent trust.update.completed (Rule B) coordinator seq 68697, id 87bd7d9ba4446964a738065d961c21ae809ed1f4ab68b2353a7e7ea28d5a23fd; Pi cursor 130514.
- Bundled PREREG SHA-256, including the post-run M7 sampling note: `29ea17ac5b2419491146f9000b31293e3a443dd432641f62bf9b05a66da542c4`.
- Pre-draw M7 sampling-note PREREG SHA-256: `29ea17ac5b2419491146f9000b31293e3a443dd432641f62bf9b05a66da542c4`; seal commit `b3d99a8`.

## PREREG hashes recorded at each seal

| Seal | Record |
|---|---|
| Seal M0a | note seq 35718 on PC worker, 2026-09-25 09:52:24Z, sha256 8c1f269aad2f9842b5aa2b32dab76f809afaeb7e5de86a29c32246df3cc660f6, commit 1f18ad1fd9f8d1965053618a4c65838b63b5b2ed |
| Seal M0a amendment | note seq 35719, 2026-09-25 11:02:26Z, sha256 47263b2cb5df14cc3657383cf4a72f6b236f858ef13e862937deb0318e4ecc35, commit 9159ffa0cf8be0fc69c7aa1548e26d7651d4ffbc |
| Seal Amendment 2 | note seq 35974, 2026-09-25 14:25:24Z, sha256 fd2a97297f89ccef92463fe556f32242859847d31c043d69f98fc810955b49a6, commit 2c61b26e032600f091a13efe3c89477ec56143dc |
| Seal Amendment 3 | note seq 36617, 2026-09-25 18:44:52Z, sha256 f3a01b08fad62debf37b60e7eaf5216e0845c55a05706132805ef59c09771040, commit f0c6a9fc37737c52a9791cb96af7316fe02a921a |
| Seal Amendment 4 | note seq 37757, 2026-09-27 19:49:20Z, sha256 591414c6df00b5992eb4dcaa559fec76cc3d654b7be931268aeeb82ec14d1248, commit ee4d8d26fcb063453e453d13d7f78c8b8a2493c7 |
| Seal Amendment 5 | note seq 37759, 2026-09-27 20:16:41Z, sha256 aba40321cc7701c341e6ac8fdad386d8fb226ba850bd9923f1e5eb7974d03b1f, commit 75ac00be6f9cfc21cf59ac7ce1d717a452273726 |
| Seal Amendment 6 | note seq 38115, 2026-09-28 07:32:07Z, sha256 04d00892a27f0b728220b54bfaecf516adae0b66af83f13873064a95c3c0571b, commit fedc34ffe545c108293dd60bbc2de64c7eec2890 |
| Seal M0b | note seq 41060, 2026-09-28 16:03:51Z, sha256 5f327acacb8a89f3e65792e56d0f3c59210cd08169e66a0f71197b7b9d62da9f, commit 1b246635954c01efb8fa5023e5ca149b8a782b12 |

## Public export hashes

| File | Bytes | SHA-256 |
|---|---:|---|
| `data/exports/main/attempts.jsonl` | 886683 | `6436aeaf56fe53c4b40c42193404191aefacdaf1006eb67b829fea3f0d6e6b37` |
| `data/exports/main/cycles.csv` | 623824 | `5f86b42f313f2c13b0aa6da77d3e4aaabadb49343c9f0824ac5a6782dc10d05f` |
| `data/exports/main/metrics.jsonl` | 17090 | `6407625d7c59c0debc87da2b230cd26636c0834943f6ddf92b6609d9eaf8912e` |
| `data/exports/main/tasks.jsonl` | 1749343 | `b0942d62b53f4320cb11c1f300f684b52e7af7ac1ad50f21cfb1c3190f9af1bd` |
| `data/exports/main/trust-events.jsonl` | 16039 | `418bea0295e158c8dd65823ba4c5c65f3c21f81c95d722775bcafa7674fe1638` |
| `data/exports/main/verifications.jsonl` | 645128 | `a3d2a2352e9b53052b27f798b84c2ae5555101b7a37d80658238b99155a68831` |
| `data/exports/pilot1/attempts.jsonl` | 186986 | `f500a5894e3fc625a34497cca73dc6639dbf85a4c288cc68aacf0031a44dfbf2` |
| `data/exports/pilot1/cycles.csv` | 131496 | `23e58cb4ba085d1826b3686e328f22c50b748799c0039711c8dbc3ca35994fae` |
| `data/exports/pilot1/metrics.jsonl` | 3491 | `ed8fa9448753e0b40fb22dbc721bba14c3a70976e57a201006381094758b97d5` |
| `data/exports/pilot1/tasks.jsonl` | 353356 | `a8aaba7f489febd4d967160e685424ea7b40640fd3a06dc1972966cde130ad56` |
| `data/exports/pilot1/trust-events.jsonl` | 3729 | `ca3d83bdd532a2f83f8515ee1fcd3d33fcbe14d8a3c60b253704a295914cab0a` |
| `data/exports/pilot1/verifications.jsonl` | 133239 | `92b7d9726f7c75a820ab59a054fe330b16929a1e190a14ca96dc3a19f8f10063` |
