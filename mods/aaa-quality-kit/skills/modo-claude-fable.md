---
name: Modo Claude Fable
description: The DIRECTOR brain — directing games that read like shipped cinematic titles: shot grammar for gameplay and cutscene beats, light as cinematography, staging that reads real, pacing beats, and sound as score.
---

# Modo Claude Fable — the director brain

**This is a curriculum, not a model swap.** "Activating the mode" IS loading this skill and
following it. No model changes, no brain changes, and by itself zero change to how the game looks
or which assets exist — what changes is the decisions you make next.

The other kit skills own craft: `aaa-quality-kit#aaa-look` owns the grade and the atmosphere
numbers, `#aaa-sound` owns the mix, `#aaa-impact` owns contact. This one owns **direction** —
where the camera stands, when it cuts, what the frame is about, and what the player feels in the
ten seconds before something happens. Nothing here re-specifies a value those skills already fix.

---

## 1. Shot grammar

A camera is a script (`camera-*` skills own the rigs). Directing is choosing which rig, and what
it does with the frame.

- **Frame for the subject, not the avatar.** Third-person gameplay: the character sits off-centre
  with the travel direction open — roughly a third of the frame as **lead room** ahead of motion.
  Centring the character means the player reads the world last.
- **FOV is a statement.** 55–65° for third-person gameplay (readable, minimal distortion);
  70–80° first person; **35–45° for a cutscene close read** — the compression pulls the subject
  out of the background and is most of why a shot feels "cinematic". Never change FOV inside a
  held shot unless the change IS the move.
- **Height and pitch carry status.** Eye level = equal. Below, looking up = the thing is bigger
  than you (bosses, gates, statues). Above, looking down = the player is small or safe (map
  reveals, defeat). Pick one per beat and hold it.
- **Camera moves, and their real durations.** A **push-in** (dolly toward the subject) over
  1.2–2.0 s with an ease-in-out is the workhorse reveal. A **slow drift** (0.3–0.8 m over 4–6 s)
  keeps a dialogue shot alive without commenting. A **crane down** over 2–3 s lands a scale
  reveal. Two rules: ease every move (`builtin/easing`, `easeInOutCubic` for camera —
  linear reads mechanical), and **never combine two moves** — a push that also orbits and zooms
  reads as a bug.
- **Transitions.** Hard **cut** for surprise and for anything the player caused. A 0.25–0.4 s
  **fade** for time passing or place change. **Hold every shot ≥ 2 s** — anything shorter is a
  flinch, not a cut. Cut on action (mid-swing, mid-step), never on stillness.
- **When a fixed shot beats a follow cam.** A follow cam *frames*; a fixed shot *composes*. Go
  fixed for: small interiors and puzzle rooms, boss-arena reveals, dialogue and shops, any beat
  where the geometry itself is the read (a bridge, a drop, a doorway). The rig is a locked
  position + `lookAt(subject)`, `pointerLock: false`, no player yaw. Go back to the follow cam
  the moment the player has to *fight* in that space. Blend, don't teleport: hand the follow rig a
  0.4–0.8 s ease into and out of the fixed position, and flip
  `setCamera({ orientation: { source: "script" } })` while the direction is yours, back to
  `"look"` when control returns.
- **Cutscene beats are the same rig, scripted.** A beat = one shot, one duration, one target.
  Store them as a data table (position, target, fov, seconds, easing) and step it — the second
  cutscene is then rows, not a second script. Every cutscene needs a skip that returns control
  cleanly (restore orientation source, restore FOV, release control).

## 2. Light as cinematography

`aaa-quality-kit#aaa-look` carries the grade script and the measured atmosphere numbers — wire it
first, then direct with it. Direction is *which* light does what:

- **Key / fill / rim thinking.** The sun (or the hour's key) is the key; ambient + hemisphere are
  the fill; a rim comes from placing the subject so the key is *behind* it. A scene with only fill
  has no shape; a scene with only key has no depth.
- **Hour of day is the mood dial, not a setting.** Golden hour for arrival and hope, blue hour for
  unease, high noon for exposure and heat, deep night for threat. Pick the hour per beat and let
  the physical sky derive its own sun and ambient — authoring those by hand is an override, not a
  starting move.
- **Silhouette against sky.** The single strongest composition in games: put the subject where the
  horizon or a bright sky sits behind it. Boss on a ridge, gate against dusk, a figure in a lit
  doorway. Build the level *so the shot exists* — a silhouette you have to invent in post was a
  staging miss.
- **Light the path.** Players walk toward brightness. A warm point light at the door you want them
  to find works better than any marker, and it never breaks fiction.
- **Mood is colour, never darkness.** Even the threatening scene is cold blue and readable; the
  darkest beat still has to be worth a screenshot.

## 3. Staging — making a world read real

- **Every prop answers who / what / why.** Who put it there, what it's for, why *here*. A crate
  by a door is storage; the same crate mid-field is set dressing that reads fake. This one
  question kills more "asset flip" feel than any texture upgrade.
- **Near things built, far things suggested.** Detail budget follows the eye: the near ring
  (0–20 m) gets real geometry, chamfers, wear and collision; the mid ring gets simplified
  repeats; the far ring gets silhouette masses, fog and sky. Fog is a *composition* tool — it
  ends the world without a visible edge.
- **Compose in triangles, not grids.** Three uneven groups read natural; evenly spaced anything
  reads authored. Rotate and scale-jitter repeated props (±10%, a few degrees of lean).
- **Leave the frame somewhere to go.** A path exiting the shot, a light around a corner, a peak
  behind the ridge. A closed frame stops the player; an open one pulls them.
- **Scale anchors.** One object of known size per vista (a door, a cart, a fence) — without it, a
  mountain and a rock look identical.

## 4. Pacing beats

Games are edited in *player time*, not shot time. Direct the rhythm:

- **Quiet before the boss.** 3–6 s of nothing: beds thinned to wind only, no enemies, a wide
  fixed shot of the arena. The silence is what makes the first hit land.
- **Payoff after the climb.** Any long traversal ends on a view — crest the ridge and the frame
  opens. The reward for effort is a shot.
- **Alternate pressure and air.** Fight → walk → fight. A player who never gets air stops feeling
  the fights; the walk is not filler, it's the setup.
- **Earn every cutscene.** A beat that tells the player something they'd learn by playing costs
  goodwill. Two seconds of a door opening beats twenty of exposition.
- **First ten seconds are a promise.** Whatever the game opens on is what the player thinks it is:
  open on the thing the game is actually about, framed properly, with the score in.

## 5. Sound as score

`aaa-quality-kit#aaa-sound` owns the gains, the beds and the footstep system — direct with it:

- **Beds go under, score goes over.** Ambience stays felt-not-heard; music sits above it and ducks
  under one-shots. If the player can name the loop, the mix is directing against you.
- **Stingers land on beats, not near them.** The hit, the reveal, the door — one short cue on the
  frame the event happens (drive it off the animation event or the collision, never a timer).
- **Silence is a cue.** Dropping the bed for 2–3 s before a reveal is the cheapest tension in
  games, and it costs no asset.
- **Music tells the player what kind of scene this is** before any UI does: enter the arena, the
  bed thins and a low pulse arrives. Crossfade over 2–3 s — snapped music breaks the spell as
  hard as a snapped bed.

## Director's pass — the checklist before shipping a beat

1. Where does the camera stand, and why *there*? (If the answer is "behind the player", is that
   the best shot available?)
2. What is the subject of the frame, and is it the brightest / clearest thing in it?
3. What hour is this beat, and does the key light shape the subject or only reveal it?
4. Does every prop in frame answer who/what/why?
5. What happens in the 5 s before, and the 5 s after? Air or pressure?
6. What does it sound like — bed, score, and the one stinger on the beat?
7. One captured frame. If it isn't worth a screenshot, the beat isn't directed yet.