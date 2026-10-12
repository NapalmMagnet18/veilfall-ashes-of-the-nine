# Spawn notes refresh — October 12, 2026, 08:11 UTC

Game source remains `7792b0d553b6f06c6112a3edacfb190da5bc91fb`. All 369 source files, 802 preserved asset paths and 97 original design files remain covered by the existing archives. No unchanged source or large asset archive was uploaded again.

Spawn notes advanced from `aea1ab94247b91a5799bf4dccad400fce1dbd71c` to `a305d5e0d04d4f83ac72b09ae1c9c42bb4b355f1` (7 changed note paths). `VEILFALL_Spawn_Notes_a305d5e0_increment.bundle` preserves the increment and requires the previous notes commit. New note content passed credential-pattern checks, bundle verification passed, and a fresh bare repository restored the specified base bundle and prerequisite increments followed by this increment to the exact notes ref with `git fsck --full` passing.

Restore game source from the full source/history bundle listed in BACKUP_CURRENT.md. Import base notes from `VEILFALL_Spawn_History_7792b0d5.bundle`, then apply the latest notes increment:

```sh
git fetch /path/to/VEILFALL_Spawn_History_7792b0d5.bundle refs/notes/spawn:refs/notes/spawn
git fetch /path/to/VEILFALL_Spawn_Notes_a305d5e0_increment.bundle refs/notes/spawn:refs/notes/spawn
```

`VEILFALL_Notes_Refresh_Checksums_a305d5e0.json` lists the new files and hashes. Previous snapshots remain retained. Latest complete unavailable-asset audit is October 12, 2026, 06:06 UTC: all 231 candidates remained absent, zero recovered. No source/reference change requires immediate retry.

The encrypted private character/world-state snapshot remains local pending specific public-upload approval previously requested. Credentials, keys and private save payloads are excluded. Hosted runtime/export limits remain unchanged; no live gameplay or saves were changed.
