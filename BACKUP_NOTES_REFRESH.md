# Spawn notes refresh — October 12, 2026, 03:03 UTC

Game source remains `f70c176c018e99d1e6fae9c8e0fd679002ab7899`. All 369 source files, 802 preserved asset paths and 97 original design files remain covered by the existing archives. No unchanged source or large asset archive was uploaded again.

Spawn notes advanced from `42def820620cd751bec81e1f4acd7f61bb26c320` to `868c3dba957750335faa929656b0cc3e04c1d239` (1 changed note paths). `VEILFALL_Spawn_Notes_868c3dba_increment.bundle` preserves the increment and requires the previous notes commit. New note content passed credential-pattern checks, bundle verification passed, and a fresh bare repository restored the specified base bundle and prerequisite increments followed by this increment to the exact notes ref with `git fsck --full` passing.

Restore game source from the full source/history bundle listed in BACKUP_CURRENT.md. Import base notes from `VEILFALL_Spawn_Notes_3fa88cba_full.bundle`, then apply the latest notes increment:

```sh
git fetch /path/to/VEILFALL_Spawn_Notes_3fa88cba_full.bundle refs/notes/spawn:refs/notes/spawn
git fetch /path/to/VEILFALL_Spawn_Notes_42def820_increment.bundle refs/notes/spawn:refs/notes/spawn
git fetch /path/to/VEILFALL_Spawn_Notes_868c3dba_increment.bundle refs/notes/spawn:refs/notes/spawn
```

`VEILFALL_Notes_Refresh_Checksums_868c3dba.json` lists the new files and hashes. Previous snapshots remain retained. Latest complete unavailable-asset audit is October 12, 2026, 03:03 UTC: all 231 candidates remained absent, zero recovered. No source/reference change requires immediate retry.

The encrypted private character/world-state snapshot remains local pending specific public-upload approval previously requested. Credentials, keys and private save payloads are excluded. Hosted runtime/export limits remain unchanged; no live gameplay or saves were changed.

