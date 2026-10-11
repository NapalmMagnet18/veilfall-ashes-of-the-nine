# Current VEILFALL source and asset backup

Latest Spawn notes are preserved in the [notes refresh](BACKUP_NOTES_REFRESH.md). The source and full history snapshot below remains the October 10, 23:29 UTC snapshot; the newer notes increment is separate.

Snapshot: October 10, 2026, 23:29 UTC. Spawn source commit `03c820be122f0c49ffcefc5f0a52cd14cbd341f9`; Spawn notes `6fd18826fb54cfe6b04987365cae35fa5be79a7e`. The GitHub tree preserves the original game history and the subsequent backup documentation commits. The backup does not change the live Spawn world.

[Download the backup release](https://github.com/NapalmMagnet18/veilfall-ashes-of-the-nine/releases/tag/backup-2026-10-09).

## Current source

`VEILFALL_Spawn_Source_03c820be.zip` contains all **369 tracked files** at this revision. Each file was independently compared against its exact Git blob object, with Windows line-ending conversion disabled for the archive. `VEILFALL_Source_File_Manifest_03c820be.json` contains per-file SHA-256 and Git blob hashes.

`VEILFALL_Spawn_History_03c820be.bundle` contains complete main history and Spawn notes. `git bundle verify` and restoration into a fresh checkout with `git fsck --full` passed. Restore it with an explicit branch:

```sh
git clone --branch main VEILFALL_Spawn_History_03c820be.bundle veilfall-restored
cd veilfall-restored
git fetch ../VEILFALL_Spawn_History_03c820be.bundle refs/notes/spawn:refs/notes/spawn
git checkout 03c820be122f0c49ffcefc5f0a52cd14cbd341f9
git fsck --full
```

Seven new main-history commits are preserved, including engine preparation, map measurement, placement filing and refreshed agent guidance. The final source tree differs from the previous snapshot only in `.spawn/skills.md`; all 369 game-source paths in the GitHub backup were compared against the exact Spawn Git blobs. No live-world edits were made by this backup.

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

`VEILFALL_Refresh_Asset_Audit.json` records the original requests. `VEILFALL_Missing_Asset_Recheck_202610102329.json` records a fresh retry at this snapshot: all 231 candidates remain unavailable with explicit no-generated/no-generating-file responses. The new source/history scan found no additional asset URLs. The unchanged large asset archives were retained without re-uploading. Spawn had no active room at the current read, so a fresh live runtime catalog could not be inspected. Current authored asset metadata and all main history were scanned; the previous live catalog was already covered in the earlier audit.

Spawn's documented export interfaces do not expose its hosted engine/server implementation or creator-compute filesystem. These archives preserve authored source and available assets, not a standalone copy of Spawn hosting.

The prepared encrypted private character/world-state snapshot remains local, pending the specific public-data upload approval already requested. Its decryption key and all authentication/session credentials are excluded from Git and releases. No live saves were reset or changed by the backup.
