# Current backup coverage and verification

Current source `f70c176c018e99d1e6fae9c8e0fd679002ab7899`, notes `ca3245cdd160c47983cca2c7d91888635e41f6d0`, captured October 11, 2026, 14:46 UTC.

| Component | Preserved | Verification |
| --- | --- | --- |
| Authored game source | 369 files | Every archive entry and backup-tree source path matches the exact Spawn Git blob; per-file SHA-256 recorded |
| Main and notes history | Complete at the captured refs | Full bundle plus latest notes increment restored; exact notes ref and git fsck passed |
| Retrieved CDN assets | 802 unique paths | Per-file size/SHA-256 manifests and verified retained archives; no new URLs this refresh |
| Original design package | 97 files | Original package archive retained and verified |
| Original art reference | Preserved archive | Existing release digest verified |
| Current release uploads | Verified against manifests | Size, GitHub SHA-256 digest and uploaded state checked before final receipt |
| Unavailable candidate assets | 231 references, no bytes | Fresh per-URL response audit: no generated or generating file exists at these URLs |
| Private character/world-state | Encrypted local snapshot | Public upload pending specific approval; key and plaintext stay private |
| Hosted Spawn implementation | Not exportable through documented interfaces | Reference docs preserved; hosted runtime/server and creator-compute files unavailable |

See [README](README.md) and [current restore index](BACKUP_CURRENT.md). Older backup documents and archives remain as historical evidence; their counts describe their dated snapshots. Use current source/asset manifests for the latest coverage. No live saves or game behavior were changed by this backup.
