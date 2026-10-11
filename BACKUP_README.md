# VEILFALL: Ashes of the Nine — current game backup

This repository's main branch contains the current authored Spawn game source and its original history. Current captured source: `f70c176c018e99d1e6fae9c8e0fd679002ab7899`; notes: `42def820620cd751bec81e1f4acd7f61bb26c320`. Source captured October 11, 2026, at 8:46 AM America/Denver (14:46 UTC); notes refreshed at 1:46 PM (19:46 UTC).

- **369 current source files**: scenes, scripts, configuration, design, art build scripts, animation data, mods and builder documents. Older source versions in main were updated to the captured Spawn revision. [Source manifest](BACKUP_CURRENT_SOURCE_MANIFEST.json) records each file's Git blob, SHA-256 and size.
- **802 preserved CDN asset paths**: models, textures, icons, audio, fonts and other retrieved assets, including historical/documentation references. The [combined asset manifest](BACKUP_CURRENT_ASSET_MANIFEST.json) maps each file to its archive and SHA-256.
- **97 original design-package files**, plus the original VEILFALL art reference, remain in the downloadable backup release.
- **Complete main and Spawn notes history** is preserved in the current source history bundle and latest [notes bundle and increment](BACKUP_NOTES_REFRESH.md). Actual restoration and Git integrity checks passed.

[Download all backup archives from the release](https://github.com/NapalmMagnet18/veilfall-ashes-of-the-nine/releases/tag/backup-2026-10-09). Large binary assets are stored as release attachments; source and manifests are directly in the repository. Earlier dated snapshots are retained. Use the [current backup index and restore instructions](BACKUP_CURRENT.md), [current verification](BACKUP_CURRENT_VERIFICATION.json) and [current snapshot checksums](BACKUP_CURRENT_CHECKSUMS.json).

## What cannot currently be included

All 231 unavailable candidate URLs were retried at this snapshot and still served no generated file. They include 228 MP3 names, two retired models and one documentation-example PNG; they are not all active gameplay dependencies. [Exact responses and paths](BACKUP_CURRENT_UNAVAILABLE_ASSETS.json) are preserved. A reference alone cannot supply absent file bytes.

Spawn's documented export interfaces do not expose its hosted engine/server implementation or creator-compute filesystem. Engine reference documentation is preserved separately. These source/assets archives do not provide a standalone offline copy of Spawn hosting.

The encrypted private character/world-state snapshot is preserved locally pending the specific public-upload approval previously requested. Private save payloads, credentials and decryption keys are excluded from this public repository and release. The backup did not modify live gameplay or saves.
