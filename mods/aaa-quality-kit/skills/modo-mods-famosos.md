---
name: Modo Mods Famosos
description: The FAMOUS-MODS brain — research a legendary mod or character (web_search + read_url), distill silhouette, palette and behavior, then rebuild it as an ORIGINAL homage in the game's own style family; plus reusable archetype recipes (shapeshift/morph, the watcher entity, the night-watch loop) and how to ship each as its own Spawn mod.
---

# Modo Mods Famosos — the famous-mods specialist brain

**This is a curriculum, not a model swap.** "Activating the mode" IS loading this skill and
following it. No model changes, no brain changes, and by itself zero change to how the game looks
or which assets exist — what changes is how the next "can you add <famous mod>?" gets answered: as
a system, researched and rebuilt original, instead of a copy nobody can ship.

`aaa-quality-kit#modo-ultra-stronger` owns the systems discipline every recipe here leans on;
`#aaa-anim-3d` and `#aaa-sprites-2d` own the bodies; `#aaa-sound` owns the dread. This one owns
**the translation**: from a mod people love to a mechanic this game owns.

---

## 0. THE LAW — inspired-by, never a pixel-clone

Say it before the research starts, because the research is where it gets broken:

> **We rebuild the FEELING, never the assets.** The homage carries the silhouette grammar, the
> palette mood, and above all the *behavior*. It never copies the sprite, the texture, the model,
> the logo, the name, or the exact art of someone else's work.

What that means in practice:

- Reference images are **read**, never traced, never re-served, never uploaded into the game. They
  inform a description; the description mints original art under this game's style family.
- Names are ours. A famous character's proper name on a spawned entity is the fastest way to make a
  game unpublishable — name the archetype in the game's fiction (the Watcher, the Night Keeper, the
  Shape) and let players recognise it themselves. They always do.
- The recognisable part of any of these characters is **99% behavior**: *when it appears, what it
  does when you look at it, what it does when you look away.* Behavior is not anyone's art. Build
  that, and the homage lands without borrowing a single pixel.
- If a creator asks for a literal clone of copyrighted art, the honest line is one sentence and then
  the better offer: "I can't copy their art — but I can build the thing that makes it scary, in our
  style, and it'll fit this world better anyway."

---

## 1. The research loop

Four steps, in order. Skipping step 3 is how homages end up as costumes with no character.

1. **Search wide, read narrow.** `web_search` for the mod, the character, the wiki, the "how it
   works" writeups and the fan analyses of *why* it works. Then `read_url` the two or three that
   actually describe behavior and appearance — pages come back as markdown, image links come back
   as pictures you can look at. Lore pages are worth more than screenshots here: they tell you the
   rules.
2. **Distill exactly three things.** Write them down before touching the engine:
   - **Silhouette** — the black-shape read. Tall and thin? Wide and squat? What one detail
     identifies it at 40 m (horns, hood, empty eyes, a hat)? Silhouette is the only visual thing
     worth being faithful to, because it's grammar, not art.
   - **Palette** — 3–5 colours and their *relationship* (desaturated body, one saturated accent;
     cold everything with a warm eye). Mood lives in the relationship, not the hex codes.
   - **How it ACTS** — personality as behavior rules, written as literal conditions: *when does it
     appear, what does it do when it's seen, what does it do when approached, what does it never
     do?* This is the deliverable of the research.
3. **Rebuild in this game's style family.** Same board as the world (`/cdn/moodboard-<family>/…`),
   same texel scale, same silhouette-first construction — scripted geometry or coded part bodies for
   shapes, a minted model only when the thing must be rigged. A famous character rendered in a
   different art family than the game reads as an asset flip even when it's perfectly made.
4. **Ship the behavior first.** An original blob that acts exactly right is scarier and more
   recognisable than a beautiful model that just stands there. Get the rules live, look at a frame,
   then dress it.

---

## 2. Archetype recipes — three mechanics, not three characters

Each of these is a **system** with a data table. The famous version is the first row.

### A. Morph — the shapeshift system

The mechanic: the player (or an NPC) *becomes* another body, with that body's stats.

- **One body group per entity.** The entity owns its body — it spawns its parts as a group and
  keeps the group's id in its own state. Morphing = destroy the group, build the next one from its
  data row. Never a spec-stamped `parent: "player"` row: it doesn't stamp onto already-joined
  sessions (`#aaa-training`'s dataset has this exact bug).
- **Forms are rows, not scripts.** `forms.json`: `{ id, parts, gait, speed, jump, size, health,
  canFly, sfx }`. Movement reads its numbers from the active row every tick — the player behavior
  never learns any form's name.
- **The morph is a beat, not a swap.** Anticipation (squash, 0.15 s), the swap on the compressed
  frame, follow-through (stretch + dust + one sound) — `#aaa-impact` grammar. A body that pops
  instantly reads as a glitch.
- Camera and collider follow the form: capsule height and camera distance come from the row, eased
  over ~0.3 s, never snapped.
- Reversibility is a rule in the table (`revertSeconds`, `revertOn`), so "temporary form" costs a
  column.

### B. The watcher entity (Herobrine / Verity class)

The mechanic: something is *there*, and the game never confirms it.

- **Appearance rules, in a table:** minimum distance (glimpsed at **25–60 m**, never near),
  required conditions (player alone / low light / a specific biome / after N minutes), a cooldown
  (**90–300 s**), and a max sightings-per-session so it stays rare.
- **Gone when approached.** The core loop: it spawns at distance, in the player's view frustum but
  never in front of them; if the player closes to within ~15 m, or looks away and back, it despawns
  — with no sound, no particles, no death. The absence is the payload.
- **Escalating ambient dread**, not jumpscares: the bed thins (`#aaa-sound`), one distant unplaced
  sound, the sighting cooldown shortens with each sighting, footprints or a moved prop after it's
  gone. Dread is cumulative bookkeeping — a `dreadLevel` counter that only ever rises within a
  session, driving bed gain, sighting frequency and light colour.
- **Never a chase until the design says so.** A watcher that attacks becomes a monster and loses the
  entire effect. If a chase is wanted, it's a *different row* with `mode: "hunt"` and its own
  telegraph — never the same entity silently escalating.
- Cheap by construction: one manager entity, `updateSchedule` at 2–4 Hz, spawns one body only while
  a sighting is live. Zero cost in the 99% of the session where it isn't there.

### C. The night-watch loop (FNAF class)

The mechanic: survive a fixed window with a resource you spend to see.

Four parts, all data-driven:

| part | shape | the row |
| --- | --- | --- |
| **limited resource** | one number that only falls; every look, light and door costs it | `drainPerSecond`, `costPerCamera`, `costPerDoor` |
| **fixed sentry views** | a camera rig per room: locked position + `lookAt`, `pointerLock: false`; switching is a 0.15 s cut with a static sting | `rooms[]` with position/target/fov |
| **patrol AI with audible tells** | each stalker walks a node graph on its own clock; every move plays a positional sound from the node it moved to | `speed`, `aggression`, `path`, `stepClip` |
| **the window** | a night is a timer with phases; each phase raises aggression | `nightSeconds`, `phases[]` |

- **The tell is the game.** The player must be able to hear where a patroller went without seeing
  it. No tell = unfair; a tell you can't localise = noise. One clip per stalker identity, pitched
  per step (`#aaa-sound`).
- **The jumpscare is an earned beat, and it's rationed.** It fires only when the player's own
  mistake completed (resource at zero, door left open, camera on the wrong room) — never randomly,
  never twice from the same cause. When it fires: hitstop, one flash, one scream, immediate end of
  night. And it respects the player's eyes — the flash is one beat at default strength, never a
  strobe; a deliberately flash-heavy build ships with reduce-flashing protection on.
- **State ownership:** a place manager owns the night, the phase, the resource and the patrol
  timers. The player owns only its camera selection and its inputs. Two writers on the resource is
  the bug that makes a night unwinnable at random.

---

## 3. Packaging — any archetype can ship as its own Spawn mod

Each recipe above is exactly the shape of a publishable mod. The kit's own folder is the worked
example (`scripts/aaa-quality-kit/`), and the platform's `mods` skill owns the full contract. The
short version:

- A mod is a **folder** with a `mod.json` in it: `scripts/<mod-name>/mod.json`. Every file in the
  folder ships — scripts as-is, `skills/*.md` and `commands/*.md` as registered skills and commands
  (a skill file **must** have a frontmatter `description:` or it fails registration).
- `mod.json` declares only what can't be a file: `objects` (captured as `{place}.{objectId}` —
  their behavior must be a file in the folder), `inputs`, `attach` (targets `object` / `player` /
  `camera` / `god`), and an optional creator `tab`.
- In-folder requires are always written bare: `require("lib/watcher-table.js")` — absolute
  `{folder}/lib/…` paths are a publish error.
- Build and taste it **inside a real game first**; publishing just snapshots the folder. Scaffold
  with `develop`, keep it `unlisted` until it's good, flip with `configure`.
- **Publishing is the creator's call.** `mod publish` / `mod update` / `mod install` belong to the
  creator's own session — a helper writes the folder, the creator ships the version. Write the files,
  say what changed, and stop there.
- Version discipline: first publish is 1.0.0; after that the catalog accepts only the exact next
  patch/minor/major. Filenames and skill ids are **permanent consumer contracts** — a renamed skill
  file breaks every game that referenced it.

---

## The homage pass (before calling one done)

1. Is the **behavior table** written — appear-when, do-what, never-what?
2. Is every asset **original**, under this game's style family and texel scale?
3. Is the **silhouette** readable as a black shape at 40 m?
4. Does the second variant cost a **data row** (form, watcher, stalker) rather than a script?
5. Who owns the state, and is there exactly one writer?
6. Does it cost nothing while it isn't happening (`updateSchedule`, spawn-on-demand)?
7. One live frame (and a `burst` if it moves) — the recognisability test is a screenshot, not a
   description.
8. Could this fold into its own mod folder tomorrow without editing anything outside it?