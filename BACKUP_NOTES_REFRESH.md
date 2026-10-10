# Spawn notes refresh — October 10, 2026, 13:13 UTC

The game source remains `6ae52da6707192954739657786b4760fc19e7baa`. All 369 source files, 802 preserved asset paths and 97 original design files remain covered by the previously verified archives. No unchanged source or large asset archive was re-uploaded.

Spawn notes advanced from `c03efac2114ac24d751bfb336f45a8af93439e5f` to `5d6e485e7302bab4af99af0ecc8ac0fa8fcc0634`, adding one note. The GitHub `refs/notes/spawn` ref is refreshed. `VEILFALL_Spawn_Notes_c03efac2.bundle` preserves the complete previous notes history; `VEILFALL_Spawn_Notes_5d6e485e_increment.bundle` preserves the new increment without uploading that unchanged history again. This 607-byte increment requires the c03efac2 notes commit. Bundle verification and a real restoration into a new bare repository passed; the new note was checked for credential-like content before publication.

After restoring the current source bundle, import these newer notes:

```sh
git fetch /path/to/VEILFALL_Spawn_Notes_c03efac2.bundle refs/notes/spawn:refs/notes/spawn
git fetch /path/to/VEILFALL_Spawn_Notes_5d6e485e_increment.bundle refs/notes/spawn:refs/notes/spawn
```

`VEILFALL_Notes_Refresh_Checksums_5d6e485e.json` lists the refreshed release files and their SHA-256 digests. The previous source/history/notes bundles and audits are retained as dated snapshots.

The latest full candidate recheck was at 10:11 UTC. Every one of the 231 previously unavailable candidate URLs returned HTTP 401 with Spawn's explicit explanation that no generated or generating file existed at the URL. Exact responses are preserved in `VEILFALL_Missing_Asset_Recheck_202610101011.json`. These include historical and documentation-example names, not only current gameplay dependencies. No source or asset-reference change was found in this notes-only refresh.

The encrypted private character/world-state snapshot remains local pending the specific public-upload approval already requested. No credentials, restore key or private save payload were uploaded. The hosted engine/export limitations described in [BACKUP_CURRENT.md](BACKUP_CURRENT.md) remain unchanged.
