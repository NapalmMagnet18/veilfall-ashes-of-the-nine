# Current backup coverage and verification

Current source `7792b0d553b6f06c6112a3edacfb190da5bc91fb`, notes `a305d5e0d04d4f83ac72b09ae1c9c42bb4b355f1`, source source captured October 12, 2026, 06:06 UTC; notes refreshed at 08:11 UTC.

| Component | Preserved | Verification |
| --- | --- | --- |
| Authored game source | 369 files | Every archive entry and backup-tree source path matches the exact Spawn Git blob; per-file SHA-256 recorded |
| Main and notes history | Complete at the captured refs | Full source bundle plus notes increment restored; exact refs and git fsck passed |
| Retrieved CDN assets | 802 unique paths | Per-file size/SHA-256 manifests and verified retained archives; no new URLs this refresh |
| Original design package | 97 files | Original package archive retained and verified |
| Original art reference | Preserved archive | Existing release digest verified |
| Current release uploads | Verified against manifests | Size, GitHub SHA-256 digest and uploaded state checked before final receipt |
| Unavailable candidate assets | 231 references, no bytes | Fresh per-URL response audit: no generated or generating file exists at these URLs |
| Private character/world-state | Encrypted local snapshot | Public upload pending specific approval; key and plaintext stay private |
| Hosted Spawn implementation | Not exportable through documented interfaces | Reference docs preserved; hosted runtime/server and creator-compute files unavailable |

See [README](README.md) and [current restore index](BACKUP_CURRENT.md). Older backup documents and archives remain as historical evidence; their counts describe their dated snapshots. Use current source/asset manifests for the latest coverage. No live saves or game behavior were changed by this backup.
