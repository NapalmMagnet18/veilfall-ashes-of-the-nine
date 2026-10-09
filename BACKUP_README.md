Current snapshot and complete combined inventory: [BACKUP_CURRENT.md](BACKUP_CURRENT.md).

# VEILFALL: Ashes of the Nine — source and asset backup

Snapshot of `@whispers/veilfall-ashes-of-the-nine`, world `068f1cea-d218-4e01-ae9e-f230532c4885`, captured October 9, 2026.

Source commit: `6d86bb7ad04bd9862742d017c91ab96fad72198d`. Engine pin: Spawn 6.0.0.

The GitHub `main` branch contains the world source and its original commit history. The `refs/notes/spawn` ref preserves Spawn's commit notes. This backup does not modify the live Spawn world.

## Downloadable backup files

- `VEILFALL_Spawn_Source_2026-10-09.zip`: all 354 tracked source files at the snapshot commit, including scenes, scripts, configuration, design, art build scripts, animation data and mods.
- `VEILFALL_Spawn_History_2026-10-09.bundle`: complete local main history and Spawn notes. Verified with `git bundle verify`.
- `VEILFALL_All_Referenced_Assets_2026-10-09.zip`: 617 downloadable CDN files, with original CDN path mapping and SHA-256 hashes in `manifest.json`. Contains models, textures, icons, UI frames, music, ambience, voices, sound effects, fonts and documents. URLs were collected from literals, helper calls, asset metadata, UI tables and sound dictionaries.
- `VEILFALL_Asset_Manifest.json`: 830 candidate asset references and their download results. 213 references did not serve an existing generated file; the CDN refused these with HTTP 401. These are preserved as references, not fabricated or silently omitted.
- `VEILFALL_Engine_6.0.0_Reference.bundle`: the pinned engine reference repository (API and skills documentation). This is not the hosted engine executable or its proprietary runtime implementation.
- `VEILFALL_Backup_Checksums.json`: SHA-256 checksums of the archives and bundles.

## Restore source

Clone this GitHub repository to browse the source. To restore the original snapshot independently from GitHub:

```sh
git clone --branch main VEILFALL_Updated_Spawn_History_2026-10-09.bundle veilfall-restored
cd veilfall-restored
git fetch ../VEILFALL_Updated_Spawn_History_2026-10-09.bundle refs/notes/spawn:refs/notes/spawn
git checkout 6d86bb7ad04bd9862742d017c91ab96fad72198d
```

Alternatively, extract the source ZIP. Extract the asset ZIP into a separate directory; `cdn/` retains the exact path under each source reference. Verify each file against the manifest before any restore.

Restoring to Spawn requires editor access and the documented asset upload/import workflow. Retain name-to-file mappings. Converted model/audio bytes may differ from their original source content address; do not assume re-uploading converted bytes recreates the original name. Update references to the URLs returned by a supported upload where necessary. All downloaded GLB files were inspected for external image/buffer URIs; none required separate external dependencies.

## Scope and limitations

This is a source/history and available-asset snapshot, not a standalone offline game executable. Spawn hosting, runtime services, room state and authentication are not supplied by these archives. The source retains procedural geometry, particle and shader programs. Unbaked asset names remain in source and the manifest; the backup cannot contain files that do not yet exist.

Gameplay database records are backed up separately on the owner's local machine and are excluded from this public repository. The development snapshot contains two characters; empty gameplay tables are captured too. Database reads are a read-only logical capture, not a guaranteed transactionally consistent server image. Platform-internal identity/session tables and credentials are excluded. The source's existing save schema remains intact.

The backup includes assets referenced by this game, not the owner's unrelated D: asset library. It preserves existing content and provenance references; it does not grant new rights to redistribute third-party assets. Future creator changes require a new snapshot.

## Completion audit and supplemental files
See BACKUP_COMPLETENESS.md for the continuation audit. The release now also preserves 64 additional unique assets (59 original input images and five retired models), the original 97-file design package, original art reference, and an independently tested restore utility for a locally prepared encrypted gameplay/world-persistence snapshot. The encrypted private snapshot is held locally pending specific public-upload approval. Total unique asset files: 681. The private decryption key is retained outside GitHub. The 213 audio files and two retired model outputs unavailable on Spawn are documented with export evidence. This supplements the immutable initial source/asset archives; do not discard either asset archive.


## Refreshed history and restore verification

The updated history bundle preserves main plus Spawn notes at 665e8ac800264fbe137f0ec5b9db35865acc62ae. Use an explicit --branch main when cloning a bundle. A real clone and checkout restored all 354 tracked source files at 6d86bb7ad04bd9862742d017c91ab96fad72198d; git fsck passed. See VEILFALL_Source_Restore_Verification.json.


