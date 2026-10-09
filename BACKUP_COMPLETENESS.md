# VEILFALL backup completeness audit — October 9, 2026

Repository: https://github.com/NapalmMagnet18/veilfall-ashes-of-the-nine

Backup release: https://github.com/NapalmMagnet18/veilfall-ashes-of-the-nine/releases/tag/backup-2026-10-09

## Added after the initial backup

- `VEILFALL_Additional_Source_Assets_2026-10-09.zip`: 64 additional, unique downloadable files: 59 original PNG images behind converted models and five retired GLB model versions found in Git history. Each has a path mapping and SHA-256 digest. All 59 PNG digests match their source content addresses; all retrieved GLBs have embedded dependencies.
- `VEILFALL_Original_Design_Package_2026-10-09.zip`: the original 97-file VEILFALL development package, preserving its directory structure and original Word, Markdown, JSON, CSV and other source files. A per-file manifest verifies them independently from the flattened design document carried in the game.
- `VEILFALL_Original_Art_Reference_2026-10-09.zip`: the original VEILFALL art reference image supplied in the creator's ARPG reference folder.
- Prepared locally, pending explicit private-data publication approval: `VEILFALL_Encrypted_Gameplay_Snapshot_2026-10-09.json`, authenticated AES-256-GCM encryption of a read-only logical gameplay export. It captures two character saves and all rows of 11 gameplay/world-persistence tables, including 144 durable state leaves, 21 leaf-carrier entries, the sequence and fold/floor metadata, and empty economy tables. The live database's empty legacy table is captured too. Authentication/session/account-link tables are excluded.
- `Restore-VEILFALL-Gameplay.cjs`: standalone decryption utility for Node.js or Bun. It authenticates the encrypted snapshot and creates a new local JSON output; it does not write to a live database.

The encrypted snapshot has not been uploaded. Automatic approval review requires specific approval before private character/world-state records may be transmitted to the public GitHub destination, even encrypted. The source/assets upload proceeds independently.

The decryption key remains only on the owner's local machine, at `work/private-game-backup/VEILFALL_Backup_Restore_Key.bin`, readable by the current Windows account. It is not in Git or the release. Preserve it separately: the encrypted snapshot cannot be recovered without this key. Never commit it.

```sh
node Restore-VEILFALL-Gameplay.cjs VEILFALL_Encrypted_Gameplay_Snapshot_2026-10-09.json /private/location/VEILFALL_Backup_Restore_Key.bin new-restored-gameplay.json
```

## Verified coverage

- Source: all 354 tracked game files at `6d86bb7ad04bd9862742d017c91ab96fad72198d`, complete main history and Spawn notes. Inspection of the source remote found only HEAD, main and notes; no other branch/tag was omitted.
- Files: 617 initial CDN files plus 64 additional source/history assets, totaling **681 unique game asset files**. Every archived file is checked against its manifest. The original 97-file design package and separate art reference are also retained.
- Live catalog: every normalized entry in the running world's 60-entry asset catalog is covered by the existing inventory. The read was performed through Spawn's documented read-only room execution door.
- Dependencies: all retrieved GLBs were checked for nonembedded buffers or images; none require separate external files. Source geometry, shaders, terrain, particles, animations, rules, quests and economy scripts remain in the Git tree.
- Confidential data: save records are encrypted locally; their public upload is pending specific approval. Encryption/decryption byte-for-byte roundtrip and incorrect-key rejection passed; the independent restore utility produced the exact original logical snapshot.

## Remaining platform boundaries — actual files were requested

`VEILFALL_Audio_Export_Audit.json` records a fresh GET for every one of the 213 unresolved audio references. Each returned HTTP 401 with Spawn's explicit explanation that there is no generated or generating asset at that URL. These are not omitted downloadable files. No new sounds were generated or substituted to make a backup appear complete.

`VEILFALL_Historical_Unavailable_Assets.json` records two retired model output references that also have no generated or generating file available. Their original input PNGs are backed up. These references remain in Git history and the audit; an exact original output cannot be recovered from an absent server file.

Spawn's published agent documentation exposes source Git, asset upload, gameplay read-only database/room reads and pinned engine reference documentation. It does not expose a full hosted engine implementation, a server binary export, original creator-compute workspace file export, or a generation door for the agent to materialize these audio URLs. The art scripts export GLB directly from creator-side `/workspace` directories; they do not save native Blender projects in this game tree. No matching native VEILFALL model workspace was found in the supplied local asset folder.

The pinned engine reference bundle is API/skill documentation, not the hosted implementation. Engine hosting, provider services and platform credentials are not part of a portable offline executable. A server-wide transactional database image is also not supplied by the read-only logical export.

**Result:** the exported source, all found downloadable assets, original design materials and accessible gameplay/world state are preserved and verified locally; source, asset and design files are uploaded, while the encrypted private snapshot is held locally pending approval. A literal standalone copy of Spawn's entire hosted environment, or bytes for the 215 unavailable output references, cannot be produced through the exposed export doors. Those require a creator/platform-supported generation or export operation, followed by another asset snapshot. The audit distinguishes this boundary from missing work.

