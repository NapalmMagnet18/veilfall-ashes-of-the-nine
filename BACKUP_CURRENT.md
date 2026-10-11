# Current VEILFALL source and asset backup

The latest source and complete notes history are captured below. Earlier dated snapshots remain available in the same release.

Snapshot: October 11, 2026, 02:27 UTC. Spawn source commit `187fa10b9fb326b8c632e8d44c0235407423404a`; Spawn notes `096c1b0725c082eb79137b1f6d04360035f21165`. The GitHub tree preserves the original game history and the subsequent backup documentation commits. The backup does not change the live Spawn world.

[Download the backup release](https://github.com/NapalmMagnet18/veilfall-ashes-of-the-nine/releases/tag/backup-2026-10-09).

## Current source

`VEILFALL_Spawn_Source_187fa10b.zip` contains all **369 tracked files** at this revision. Each file was independently compared against its exact Git blob object, with Windows line-ending conversion disabled for the archive. `VEILFALL_Source_File_Manifest_187fa10b.json` contains per-file SHA-256 and Git blob hashes.

`VEILFALL_Spawn_History_187fa10b.bundle` contains complete main history and Spawn notes. `git bundle verify` and restoration into a fresh checkout with `git fsck --full` passed. Restore it with an explicit branch:

```sh
git clone --branch main VEILFALL_Spawn_History_187fa10b.bundle veilfall-restored
cd veilfall-restored
git fetch ../VEILFALL_Spawn_History_187fa10b.bundle refs/notes/spawn:refs/notes/spawn
git checkout 187fa10b9fb326b8c632e8d44c0235407423404a
git fsck --full
```

Four newer main-history commits are preserved, including engine preparation and a compatibility change that retains the authored normal-map appearance in `mods/awakening/rock-look.js`. All 369 source paths match the exact Spawn Git blobs in the archive and GitHub backup tree. This backup makes no live-world edits.

## Preserved asset files

The inventory now contains **802 unique CDN paths** discovered in current source, metadata, main history and documentation. Documentation examples and retired references are included conservatively; this is a count of preserved files, not a claim that every file is currently placed in the game.

| Archive | Files |
| --- | ---: |
| `VEILFALL_All_Referenced_Assets_2026-10-09.zip` | 617 |
| `VEILFALL_Additional_Source_Assets_2026-10-09.zip` | 64 |
| `VEILFALL_Additional_Assets_6ae52da6.zip` | 121 |

The new archive adds 27 models, 80 MP3 audio files, six PNGs, seven JPEGs and one WebP. All archived entries passed size and SHA-256 verification. All downloaded GLBs have embedded buffers/images and no external URIs. Spawn may serve a processed GLB whose hash differs from its uploaded source address; the manifest records the actual served file hash.

`VEILFALL_Combined_Asset_Manifest_6ae52da6.json` maps every file to its CDN path, SHA-256 and archive. Extract each archive's `cdn/` directory into one asset directory, preserving paths. Use the combined manifest rather than assuming the older archive's manifest covers later files. Asset restoration to Spawn still requires the supported upload/import workflow and returned CDN names; extracting these files does not create an offline engine.

The original 97-file design package and original art-reference archive remain in the release. Engine 6.0.0 reference documentation remains available as its separate bundle.

## Explicit export boundaries

The latest broad scan requested 352 uncovered candidate URLs. It recovered 121 files; **231 candidates** still returned unavailable responses: 228 MP3 names, two retired GLB outputs, and one documentation-example PNG. All original 213 missing audio references remain unavailable. The broader scan also covers obsolete and example names; the audit preserves exact per-URL responses rather than treating every candidate as a current gameplay dependency.

`VEILFALL_Refresh_Asset_Audit.json` records the original requests. `VEILFALL_Missing_Asset_Recheck_202610110227.json` records a fresh retry at this snapshot: all 231 candidates remain unavailable with explicit no-generated/no-generating-file responses. The new source/history scan found no additional asset URLs. The unchanged large asset archives were retained without re-uploading. The prior room inspection reported no active room; no fresh live runtime catalog was inspected during this source refresh. Current authored asset metadata and all main history were scanned; the previous live catalog was already covered in the earlier audit.

Spawn's documented export interfaces do not expose its hosted engine/server implementation or creator-compute filesystem. These archives preserve authored source and available assets, not a standalone copy of Spawn hosting.

The prepared encrypted private character/world-state snapshot remains local, pending the specific public-data upload approval already requested. Its decryption key and all authentication/session credentials are excluded from Git and releases. No live saves were reset or changed by the backup.
