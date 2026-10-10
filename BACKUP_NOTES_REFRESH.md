# Spawn notes refresh — October 10, 2026, 10:11 UTC

The game source remains `6ae52da6707192954739657786b4760fc19e7baa`. All 369 source files, 802 preserved asset paths and 97 original design files remain covered by the previously verified archives. No unchanged source or large asset archive was re-uploaded.

Spawn notes advanced from `d1895d9235d5b08fb229c6cf6a415599bcdae5c8` to `c03efac2114ac24d751bfb336f45a8af93439e5f`, adding one note. The GitHub `refs/notes/spawn` ref is refreshed, and `VEILFALL_Spawn_Notes_c03efac2.bundle` independently preserves the complete notes history. `git bundle verify` passed; the newly added text was checked for credential-like content before publication.

After restoring the current source bundle, import these newer notes:

```sh
git fetch /path/to/VEILFALL_Spawn_Notes_c03efac2.bundle refs/notes/spawn:refs/notes/spawn
```

`VEILFALL_Notes_Refresh_Checksums_c03efac2.json` lists the refreshed release files and their SHA-256 digests. The previous source/history/notes bundles and audits are retained as dated snapshots.

Every one of the 231 previously unavailable candidate URLs was requested again. All still returned HTTP 401 with Spawn's explicit explanation that no generated or generating file existed at the URL. No new asset file became available. Exact responses are preserved in `VEILFALL_Missing_Asset_Recheck_202610101011.json`. These include historical and documentation-example names, not only current gameplay dependencies.

The encrypted private character/world-state snapshot remains local pending the specific public-upload approval already requested. No credentials, restore key or private save payload were uploaded. The hosted engine/export limitations described in [BACKUP_CURRENT.md](BACKUP_CURRENT.md) remain unchanged.
