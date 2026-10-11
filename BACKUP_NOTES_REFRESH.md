# Current VEILFALL source/history backup — October 11, 2026, 02:27 UTC

Captured source `187fa10b9fb326b8c632e8d44c0235407423404a` and complete notes history `096c1b0725c082eb79137b1f6d04360035f21165`. Four newer main-history commits preserve engine preparation and the normal-map compatibility change in `mods/awakening/rock-look.js`. All 369 source archive entries match exact Git blobs, as do all source paths in the separate GitHub backup tree. A fresh checkout restored the full bundle with exact main/notes refs and `git fsck --full` passing. Credential-pattern checks passed for current files, new history patches and changed note blobs.

Restore the current source and complete notes together; no previous incremental notes chain is required:

```sh
git clone --branch main VEILFALL_Spawn_History_187fa10b.bundle veilfall-restored
cd veilfall-restored
git fetch ../VEILFALL_Spawn_History_187fa10b.bundle refs/notes/spawn:refs/notes/spawn
git fsck --full
```

The new source/history scan found no new asset URLs. Existing archives preserve 802 unique paths including historical/documentation references, and the original 97-file design package remains available. Unchanged large asset archives were retained. All 231 unavailable candidates were retried: zero recovered, with explicit no-generated/no-generating-file responses in `VEILFALL_Missing_Asset_Recheck_202610110227.json`.

Extract the retained three asset archives together and verify per-file hashes using `VEILFALL_Combined_Asset_Manifest_6ae52da6.json`. Authored source/assets do not supply Spawn's hosted engine/server implementation or creator-compute filesystem. The encrypted private character/world-state snapshot remains local pending specific public-upload approval. Credentials, keys and private save payloads are excluded. No live gameplay or saves were changed; no gameplay playtest is claimed for this backup.
