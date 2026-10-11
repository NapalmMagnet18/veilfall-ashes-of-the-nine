# Spawn notes refresh — October 11, 2026, 18:45 UTC

Game source remains `f70c176c018e99d1e6fae9c8e0fd679002ab7899`. Existing archives preserve all 369 source files, 802 retrieved asset paths and 97 original design files.

Notes advanced from `ca3245cdd160c47983cca2c7d91888635e41f6d0` to `3fa88cba82cbf6c1140af4d6b58d21311fcb4c32` (one changed note path). New content passed credential-pattern checks. `VEILFALL_Spawn_Notes_3fa88cba_full.bundle` preserves the complete notes history without prerequisites. Its standalone restoration into a fresh bare repository, exact notes ref and `git fsck --full` passed.

Restore the game source from `VEILFALL_Spawn_History_f70c176c.bundle`, then fetch the current notes directly:

```sh
git fetch /path/to/VEILFALL_Spawn_Notes_3fa88cba_full.bundle refs/notes/spawn:refs/notes/spawn
git fsck --full
```

Older notes increments are retained as historical evidence but are not required for this restore. `VEILFALL_Notes_Refresh_Checksums_3fa88cba.json` lists new files and hashes. No unchanged source or large asset archive was uploaded again.

A fresh approximately four-hour asset retry at 18:45 UTC found all 231 candidates still absent, zero recovered; explicit no-generated/no-generating-file responses are in `VEILFALL_Missing_Asset_Recheck_202610111845.json`. There are no new source references.

The encrypted private character/world-state snapshot remains local pending the specific public-upload approval already requested. Credentials, keys and private save payloads are excluded. Spawn hosted runtime/export limits remain unchanged. No live gameplay or saves were changed.
