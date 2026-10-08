# Connected builders: direct development workflow

This world can be developed by every account whose own GET /api/agent/v1/me lists @whispers/veilfall-ashes-of-the-nine as editor. Savi messaging is not required. Each builder uses their own private Spawn credential and their own checkout. Do not share tokens or create extra identities to bypass platform limits.

## Establish access

1. Read AGENTS.md and design.md. Verify your identity and role with GET /api/agent/v1/me or GET /api/agent/v1/access?slug=%40whispers%2Fveilfall-ashes-of-the-nine.
2. Use the clone instructions from your own account response. Export your existing private token as SPAWN_TOKEN without displaying it. Use a Git credential helper that reads that environment variable; keep credentials out of URLs and commits.
3. If this world is missing, POST /api/games/efafbdeb-6080-4131-b668-7a33bb7e05a3/crew/ask with the documented body. The creator approves the request from their bell. Recheck your own world list. Being linked to whispers alone does not grant access to every world.
4. Never retry an expired signup invite. An existing account should reconnect through its own creator-issued reconnect prompt if necessary.

## Build without the Savi messaging lane

- Author the world's text files and push to main; Spawn applies accepted changes live. Read the exact named Tome API sections before creating shapes. Read relevant world skills for geometry, uploaded models, FX, UI, terrain, platform systems and room routing.
- Local 3D modeling and supported model generation can supply art. Inspect the documented capabilities and current jobs before submission. Generation and compute were reported open for @@veilforge_scribe on October 8, 2026; availability and budget are account-specific and must be rechecked. Do not assume every connected account has the same lanes.
- Upload actual GLB/image/audio bytes through documented world asset doors and record CDN references and provenance. Large files use upload-target. Do not put binary assets in Git. D: paths on the creator's machine are not accessible from other builders' machines.
- Join a temporary client for live tests, use supported read-only inspection where possible, and leave after testing. Keep authored test modifications and real player saves separate. Do not reset player data.
- Leave progress, decisions and next steps in design.md and commit bodies. Savi reads those on the creator's next turn. No agent-to-Savi messaging endpoint is available.

## Coordinate changes

The task board is `.spawn/build-tasks.json`. It records work and dependencies; it is an advisory coordination board, not a runtime scheduler or enforced lock.

1. Pull/rebase before selection. Inspect recent commits and active jobs. Pick an open task whose dependencies pass and which does not overlap an active task's files. Check for unrecorded Savi work as well.
2. Claim a task by changing status to claimed, owner to your own handle, claimedAt to a UTC timestamp, and listing the intended files. Commit and push the claim before editing implementation files. If the push is rejected, fetch/rebase, re-read the board, and only proceed if your claim still holds; pick another task when a claim conflicts. Do not automatically resolve competing claims in your own favor.
3. Claim only the work you can finish in the current session. If you stop, document the checkpoint and release or mark blocked. Expired-looking claims are not permission to overwrite another builder's work; investigate and coordinate first.
4. Core shared files such as scripts/player.js, scripts/lib/loot.js, ui.js, places/main/sim.js and design.md need particular care. Scope work to a small module or asset group where possible. Re-read remote changes before modifying a shared file.
5. Implement one coherent change. Run appropriate syntax/content checks and real runtime/play tests. Record absent multiplayer, reconnect or visual verification as unverified. Read logs and generation results rather than treating job submission as completion.
6. Pull/rebase again before pushing. Resolve conflicts by preserving both intended changes and re-test. Never force-push. Update the board with commit/job IDs and evidence and update design.md with the creator-relevant result. Follow AGENTS.md's plain-language commit-subject rule.
7. Read the push verdict and live logs. Repair refused or broken changes before starting more work. A successful Git push alone does not prove gameplay correctness.

## Current handoff

October 8, 2026: the Wayside Forge already supports Temper, Reforge and Ascend. Read its latest design.md entry and code before proposing crafting work. Loot tiers remain Ashen, Hallowed, Gilded, Relic and Vowbound. First validate inventory/save/reward correctness and forge behavior, then extend professions and eventually auctions behind tested authoritative transfers and escrow. Art tasks can progress alongside this work with distinct files and placements.

All edits remain within the creator's authorized VEILFALL scope. Do not buy services, wipe saves, replace the engine/world or publish publicly without authorization.
