# VEILFALL — M0 / M1 report (2026-10-08)

Dev document only. Nothing in the game loads this file. Status words: PASS = observed this session; PARTIAL = part observed; NOT TESTED = code exists, nobody has played it.

## M0: repo and capability audit

**What stood before work (seq 8):** a fresh Spawn 3D starter (flat terrain, third-person WASD, empty HUD) plus your uploaded data under `scripts/lib/data/`. No AGENTS.md exists in this world. The engine reference is in `engine-reference/`.
**Regression:** the starter had no gameplay, so nothing could regress. Your data files were not edited.
**Rollback:** every save is a version. `seq 8` is the last version before any Savi edit (`spawn undo` / versions panel). The milestone builds are seqs 9 → 62+.
**Content validator:** `validate_content.py` run against the uploaded JSON → **PASS** (6 classes, 4 origins, 24 routes, 10 zones, 128 quests: 60 main / 30 side / 20 origin / 18 class, no bad refs, no cycles). This checks the data, not gameplay.
**Engine features used (all supported API):** heightmap terrain generator, scripted geometry, behaviors (`update`, `onInput`, `onTriggerEnter`), place `sim.js` as server referee, `findPath` (builtin/nav) for click navigation, `getInputRay` + `raycast` for mouse picking, `player.state` (persists per player per world), fx programs, `ui.js` HUD.
**Files written/changed:**
- config: `world.config.yaml` (inputs), `places/main/config.yaml` (terrain, sky, spawn at the fire)
- terrain: `scripts/terrain.js`, `scripts/lib/data/veilfall-map.js`
- hero: `scripts/player.js`, `templates/player.js`, `scripts/humanoid-locomotion.js` (patched), `scripts/lib/data/player.yml`
- camera: `scripts/camera.js`, `templates/camera.js`, `scripts/lib/data/camera.yml`
- combat data: `scripts/lib/data/combat.yml` (every tuned number)
- enemies: `scripts/wax-pack.js` (pilgrim + deacon AI), `scripts/bailiff.js` (boss), `scripts/gen/wax-figure.js` (meshes)
- quest + referee: `places/main/sim.js`, `scripts/petition.js`
- HUD: `scripts/ui.js`
- level art (crew): `scripts/gen/hub-*.js`, `vf-*.js`, `dripping-gate.js`, `arena-*.js`, `gibbet.js`, `toll-throne.js`, `shapes.js`, `scripts/effects/candles.fx.js`, cells `x0z0`, `x0z-1`
- `design.md`

**M0 gate:** PARTIAL. Audit, file list, rollback and validator done. No performance baseline was taken.

## M1: one-zone combat slice

Hub: Wayside Fire (a safe zone, nothing hunts inside its light, life and tonics refill there). Dungeon: candle road → tollhouse → Dripping Gate → Bailiff arena.
Hero: Bladewraith. Skills: Ashcut (basic, LMB on a foe, builds Edge), Crosswound (core, RMB/E, 30 Edge, arc sweep), Griefstep (defensive, Space, dash with i-frames). Q tonic. I opens the temporary pack.
Enemies: wax pilgrims, tallow deacons (red-ring telegraphed slam), Bailiff boss (3 phases, telegraphed bell slams, burning wax pools, resets if the arena empties, health scales with players in the arena).
Quest counter: Pilgrims in White (talk → kill 8) → Toll of Remembrance (5 petitions) → Dripping Gate (Bailiff) → return. A reward claim is keyed by quest id, so it can only pay once.

| Test | Result | What I saw |
|---|---|---|
| Click ground → hero walks there | PASS | clicked, the hero walked ~19 m and later ~40 m back along a route |
| Click a foe → attack | PASS | pilgrim hp fell 40 → 3 from clicks |
| Kill pays XP/gold, quest counter moves | PASS | xp 12, gold 4, kills 1 after a kill |
| Talk to Maelin → quest advances | PASS | dialogue box shown, tracker became "0/8" |
| Pack (I) | PASS | panel opened with blade + tonics |
| Griefstep dash | PARTIAL | hero moved on Space; i-frames not checked |
| Death → back at the fire | PASS (observed once) | hp went to 0 under a pack, hero came back at the fire at full life |
| Enemies chased into the camp | FOUND + FIXED | pilgrims stood in the firepit. Camp is now a sanctuary. Not retested yet |
| Pack damage too high | FOUND + TUNED | 5 pilgrims killed a fresh hero in ~4 s. Damage now 4 every 1.7 s. Not retested |
| Crosswound, tonic | NOT TESTED | keys were pressed, effect not verified |
| Petitions, Bailiff fight, telegraphs, reset, full 5-minute run | NOT TESTED | |
| "Cannot pass through obstacles" | NOT TESTED | not checked against walls yet |
| Reconnect keeps progress | NOT TESTED | (M2 gate) |

**Known issues:** the tollhouse roof hides the hero when you walk under it (an ARPG camera usually fades roofs). An old client warning says something read an undeclared "jump" input. None of my scripts read it, so I need to look again. The fire's first line of dialogue is skipped when you click Maelin.

**M1 gate:** NOT PASSED. Movement, attack, kill/reward/counter and talk work. The dungeon run, the boss and blocked-path tests are still open.

**Next:** finish the M1 checks (full run, boss, collision, roof fade, i-frames). Then M2 (reconnect + reward-once).
