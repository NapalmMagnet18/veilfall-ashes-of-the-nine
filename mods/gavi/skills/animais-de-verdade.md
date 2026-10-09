---
name: Animals That Read As Real
description: The species sheet — real metres, kilograms, head-to-body ratios, leg fractions and the one 30-metre silhouette tell for 22 animals a game actually needs; the 128 px silhouette law and the three mistakes that kill an animal shape; the gait section with pasteable phase offsets for walk, trot, pace, canter, gallop, bound, bird head-bob and fish body-wave, cadence per size class and the distance-driven cycle with its 30 Hz arithmetic; the secondary life (tail, ears, chewing, head-turn, never-frozen idle) in degrees and seconds; the whole VOICE half — sfx conjuring paths, twenty real example names, the mixing numbers, the cadence law with per-animal cooldowns, per-species caps and per-instance pitch so ten cows are ten cows, and the ambient bed that is not the animals; a worked cow end to end with its box list, gait offsets, sounds and manager state; and a failure table with the tell for each. Load this the moment a creator says cow, chicken, wolf, horse, fish or bird.
---

# Gavi — bichos de verdade

`gavi#criar-modelo-3d` teaches form. `gavi#animar-doutrina` teaches timing. Neither
of them knows how tall a cow is. This file is the species layer both of them hand off
to, and it is three halves that only work together: **the BODY**, **the WALK**,
**the VOICE**. An animal missing any one of the three is a prop.

## route in 10 seconds

| the situation | do this |
| --- | --- |
| creator said "cow" / "chicken" / "wolf" and you're about to type a dimension | §1's table. real metres exist. do not invent them |
| the model is built and it reads as "some animal" | §2, the 128 px test. species before paint, always |
| about to write the leg swing | §3.1 offsets. `LH 0.00, LF 0.25, RH 0.50, RF 0.75`. paste them, don't derive them |
| the feet slide | §3.5. the cycle is on a timer. it must be on DISTANCE TRAVELLED |
| the chicken looks like a wind-up toy | §3.4. no head-bob. the bob is the BODY moving under a parked head |
| it stands there and reads as crashed | §4.6. nothing in a living body holds past 8 ticks (0.27 s) |
| an ear twitch nobody can see | §4.2. a 0.10 m ear needs 33° at 6 m (`gavi#animar-doutrina` §1.1) |
| about to mint a sound | §5.2's naming law. `sfx-cow.mp3` gets you a stock loop. the filename IS the prompt |
| the herd sounds like a soundboard | §5.4, THE CADENCE LAW. randomised interval + per-animal cooldown + per-species cap |
| twelve cows sound like one cow twelve times | §5.5. per-instance pitch from the id hash, 0.92-1.08 |
| the pasture is dead quiet between moos | §5.6. the bed is not the animals |
| you want one animal, complete, to copy | §6. the cow, end to end |
| something reads wrong and you can't name it | §7's tells. six of them are on that list |

---

## 1 — THE PROPORTION TABLE

The spine of the file. Twenty-two rows, real units, and the last column is the one
that decides whether the animal exists at playing distance.

**How to read the columns.**

- **L** — nose to tail BASE, in metres. Tail extra, listed in §4.1.
- **h** — height at the shoulder/withers, in metres. Not the top of the head.
  Everything else in a box list measures off this one number.
- **kg** — adult body mass. Drives `physics.mass` and, more importantly, drives how
  the thing must MOVE: a 700 kg animal does not change direction in 0.2 s.
- **head:torso** — the head box's longest dimension ÷ the torso box's longest
  dimension. Straight into a box list, no conversion.
- **leg** — ground-to-elbow leg length as a fraction of **h**. This single number is
  what separates a deer (0.61) from a bear (0.42) from a duck (0.21), and getting it
  wrong is failure #8 in §7.
- **the 30 m tell** — the one thing the eye uses to name the species from across a
  field. If your model does not have this, nothing else you do matters.

| # | species | L (m) | h (m) | kg | head:torso | leg | the 30 m tell | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | cow (Holstein) | 2.40 | **1.45** | 700 | 0.42 | 0.50 | a horizontal SLAB on short legs, and the heavy head hung LOW — muzzle below the knee line | ✓ |
| 2 | bull | 2.70 | 1.60 | 1050 | 0.46 | 0.48 | the cow's slab plus a shoulder mass wider than the hips, and the head carried level, not low | – |
| 3 | pig (sow) | 1.50 | **0.75** | 150 | 0.47 | 0.45 | no neck at all: one tapered wedge from snout to rump, on legs too short for it | ✓ |
| 4 | wild boar | 1.40 | **0.80** | 85 | 0.50 | 0.45 | the pig re-hung front-heavy — tall withers, sloping back down to small hips | ✓ |
| 5 | sheep | 1.30 | **0.75** | 70 | 0.40 | 0.52 | a fat oval whose legs are half-eaten by the fleece, head small and level | ✓ |
| 6 | goat | 1.15 | **0.78** | 60 | 0.40 | 0.56 | the sheep's oval, but LEGGY and square, head carried HIGH with horns raked back | ✓ |
| 7 | chicken (hen) | 0.45 | **0.32** | 2.2 | 0.35 | 0.34 | a fist with no neck and a HIGH tail — the whole silhouette leans back off the legs | ✓ |
| 8 | rooster | 0.52 | 0.42 | 3.4 | 0.35 | 0.38 | the hen, taller, plus a comb spike and a tail arc rising ABOVE the head | – |
| 9 | duck (mallard) | 0.58 | **0.28** | 1.2 | 0.29 | 0.21 | a boat with a neck. legs barely exist — the body nearly touches the ground | ✓ |
| 10 | goose | 0.85 | 0.45 | 4.0 | 0.28 | 0.27 | the duck stretched vertically: the NECK is a third of the whole silhouette | – |
| 11 | rabbit | 0.42 | **0.21** | 2.2 | 0.45 | 0.32 | crouched egg, hind mass twice the front, ears longer than the head | ✓ |
| 12 | rat | 0.25 | 0.08 | 0.35 | 0.42 | 0.44 | a low tube with a tail as long as the body, dragging behind on the ground | – |
| 13 | horse (riding) | 2.40 | **1.55** | 500 | 0.50 | 0.55 | a LONG head on a long arched neck, and legs that are half the animal's height | ✓ |
| 14 | donkey | 1.90 | **1.20** | 180 | 0.53 | 0.54 | the horse's mass on a shorter frame with an oversized head and 0.25 m ears | ✓ |
| 15 | llama | 1.90 | **1.15** | 140 | 0.30 | 0.61 | tiny head, vertical neck, stilt legs — a triangle standing on four sticks | ✓ |
| 16 | wolf (grey) | 1.40 | **0.75** | 40 | 0.42 | 0.56 | LEGGY for a canid, chest narrow, head carried level with the spine, tail straight out | ✓ |
| 17 | dog (labrador) | 1.00 | **0.58** | 30 | 0.44 | 0.52 | the wolf shortened and thickened: deeper chest, blunter head, tail up and curling | ✓ |
| 18 | cat | 0.46 | **0.25** | 4.2 | 0.37 | 0.52 | a shoulder-blade ripple over a flexible tube, head ROUND, tail as long as the body | ✓ |
| 19 | fox (red) | 0.68 | **0.40** | 6.0 | 0.38 | 0.55 | a small dog carrying a tail nearly as big as itself, muzzle sharp, ears triangular | ✓ |
| 20 | deer (white-tailed) | 1.80 | **0.95** | 90 | 0.38 | 0.61 | the leggiest thing in the table — legs are 61% of height, body a shallow wedge, neck up | ✓ |
| 21 | bear (brown) | 1.80 | **0.95** | 150 | 0.40 | 0.42 | low-slung mass with a SHOULDER HUMP higher than the rump, and no visible neck | ✓ |
| 22 | fish (trout) | 0.40 | 0.09 dp | 1.2 | 0.40 | – | a spindle whose deepest point is a third back from the nose, tail a forked V | – |
| 23 | crow | 0.48 | 0.30 | 0.50 | 0.30 | 0.30 | the only row here with a wingbeat: 3.5-4 Hz, and see §3.6 before you write it | – |

### 1.1 — provenance: what was verified and what is craft

**Verified by search this session** (rows marked ✓): cow 145-165 cm withers / 680-770 kg
(Wikipedia *Holstein Friesian*, corroborated by dimensions.com at 137-152 cm);
pig 51-97 cm shoulder / 0.9-1.8 m head-body / 140-300 kg (dimensions.com, iNaturalist);
wild boar 55-110 cm shoulder, Europe 75-80 cm / 75-100 kg (Thai National Parks,
All Species); sheep 72-76 cm withers / 68-82 kg (Wikipedia *Altay sheep*);
goat 76-81 cm withers / 61-77 kg (Wikipedia *Alpine goat*); chicken 25-37 cm standing /
40-60 cm overall / 2.6-4.5 kg (dimensions.com); duck (mallard) 50-65 cm / 1.0-1.6 kg
(two sources); rabbit 19-23 cm shoulder / 28-36 cm body / 1.8-2.5 kg (dimensions.com
*Dutch Rabbit*); horse 152-163 cm withers = 15-16 hands / 400-545 kg (Willowbrook,
size-charts.com); donkey ~120 cm = 12 hands (Willowbrook); llama 120 cm shoulder /
104-181 kg (Britannica); wolf 66-84 cm shoulder / 1.0-1.8 m body / 30-65 kg (NWF,
dimensions.com, Britannica); labrador 55-62 cm withers / 91-107 cm body / 25-36 kg
(four sources agreeing); fox 35-46 cm shoulder / 45-90 cm body / 5-8 kg
(dimensions.com, Wildlife Online); cat 3.6-4.5 kg (Biology Insights);
deer 90-105 cm shoulder / 134-206 cm / 67-135 kg (Virginia DWR); brown bear 90-100 cm
shoulder / 1.6-2.0 m / 85-115 kg Cantabrian, 130-350 kg elsewhere (Wikipedia).

**Stated from craft, not verified** (rows marked –): bull, rooster, goose, rat, crow,
fish. Their neighbours in the table are verified and these are scaled off them; if a
creator's game leans on one of these, verify it before you build.

**Verified gait facts** are cited inline in §3. Everything in §4 and §5 is craft plus
this game's own shipped numbers (`scripts/mobs.js`, `scripts/mob-voices.js`), which is
a stronger source than a search — it is a measurement.

### 1.2 — the number that is not in the table

Nothing here says how the animal is COLOURED. That is on purpose: colour is the last
5% and it is decided by the art family, not by the species. `gavi#criar-modelo-3d`
owns it. What this game learned the hard way and you inherit:

1. **a face is GEOMETRY, never a texture.** Eyes, sockets, snouts, muzzles, combs and
   hooves are small boxes. Three conjured face bakes came back tiled and mottled.
2. **a mob material always carries a flat base `color`**, even when it also carries a
   `texture`. A coat slug that fails to serve falls through to the palette base, and a
   dark palette base in a cave is a solid black animal on screen. That happened.
3. **never a body-sized colour darker than ~#4a4a4a.** Mood is colour, never darkness.
4. **paint in 2x2 blocks with a hard three-value step.** Fine per-pixel detail mips to
   flat plastic at a low `renderScale`, which is what weak clients render at.

### 1.3 — a dimension you do not have

Four instruments, and only these four:

| you need | the call |
| --- | --- |
| a number nobody linked you to | `web_search` → titles + snippets → pick one → `read_url` it |
| a page's real content | `read_url` on the link → compact markdown |
| to SEE a reference image | `read_url` on the image link → the actual pixels, in front of you |
| a video's content | `read_url` on the YouTube link → title + full TRANSCRIPT |

That is the whole honest basis of research here. Two searches and one `read_url` gets a
verified withers height in under a minute, which is faster than shipping a wrong cow and
being told. When you cannot verify, **say the number and say it is unverified** — that
is `gavi#ser-a-gavi` Law 3, and a hedged number a creator can check beats a confident
number he can't.

---

## 2 — THE SILHOUETTE LAW

> **Render the animal at 128 px tall, black on white, no colour. If you cannot name
> the species from the black shape alone, no paint will save it.**

This is `gavi#animar-doutrina` §1.1's 128 px test aimed at a species instead of a pose.
Run it before the first material line. `preview_object` gives you the frame; lean back
or shrink it. Then say the species out loud. If you hesitate, the model is not done and
no amount of coat texture, eye detail or normal map will close the gap — the eye reads
outline first and surface second, at every distance, always.

### 2.1 — the three mistakes that kill an animal silhouette

**1. Legs too short and too thick.** The single most common failure, and it comes from
box-thinking: a leg is a box, boxes look wrong when thin, so the leg gets fat. Real legs
are startlingly thin — a cow's cannon bone reads at about **0.13 × 0.13 m** on a 1.45 m
animal, which is 9% of the shoulder height. A wolf's is 0.06 m on 0.75 m. Then check the
**leg** column in §1: 0.21 (duck) to 0.61 (deer) is a threefold spread, and it is the
column that carries species identity. Two animals with the same leg fraction read as the
same animal at two sizes.

**2. The neck is missing entirely.** Head welded to torso. This reads as a toy on every
species — including the ones whose tell is "no neck" (pig, chicken, bear), because even
those have a **gap in the outline**: the head sits proud of the torso's front wall by
0.04-0.10 m, with daylight above and below it. A head whose box shares a face with the
torso box has no gap, and the outline becomes one lump. Even the pig gets 0.05 m.

**3. The head is level with the spine when it should be above or below it.** The head's
HEIGHT relative to the back line is species identity, not decoration:

| head carried | species | what the outline does |
| --- | --- | --- |
| well BELOW the back line | cow, sheep, pig, bear | grazing/rooting shape — heavy front, downhill silhouette |
| level with the back line | wolf, cat, chicken, boar | the predator/prey level read — a straight line nose to tail |
| ABOVE the back line | horse, deer, llama, goose, goat | alert shape — the neck is a visible vertical stroke |

A cow with its head level is not a cow. A deer with its head level is a goat. This one
mistake changes the species while every dimension in the table stays correct.

### 2.2 — the readability floor, from the doctrine

`gavi#animar-doutrina` §1: **one rendered pixel ≈ d / 514 metres** at `renderScale` 0.55.
At 30 m that is **5.8 cm per pixel**. So on a cow at 30 m:

| the feature | size | pixels at 30 m | reads? |
| --- | --- | --- | --- |
| the whole body | 2.40 m | 41 px | yes — this is the silhouette |
| the head | 0.55 m | 9 px | yes, as a blob with a position |
| a leg's width | 0.13 m | 2 px | as a stroke, not a shape |
| an ear | 0.12 m | 2 px | no |
| an eye box | 0.06 m | 1 px | no |

Which is the whole argument for §1's last column. At 30 m the player has the outline, a
9 px head-blob and four 2 px strokes. **The tell has to live in those.**

---

## 3 — THE GAIT

What actually moves, per class. Every offset below is a fraction of ONE cycle, ready to
paste. Phase 0.00 is the moment that foot plants.

### 3.1 — quadruped WALK: four beats, lateral sequence

The walk is a **four-beat** gait and the footfall order is **left hind, left fore, right
hind, right fore** — evenly spaced at 25% of the cycle. (Verified: *Work minimization
accounts for footfall phasing in slow quadrupedal gaits*, eLife 2017 — "a typical horse
at 25% phase timing follows the sequence left hind, left fore, right hind, right fore";
and the footfall-sequence reference at bowlingsite.xmsi.net lists the same order as the
normal walk.)

```js
// scripts/lib/gaits.js — every number is a fraction of one full cycle
const WALK = { LH: 0.00, LF: 0.25, RH: 0.50, RF: 0.75 }; // 4-beat, lateral sequence
const TROT = { LH: 0.00, RF: 0.00, RH: 0.50, LF: 0.50 }; // 2-beat, DIAGONAL pairs
const PACE = { LH: 0.00, LF: 0.00, RH: 0.50, RF: 0.50 }; // 2-beat, LATERAL pairs — camel, llama
const CANTER = { RH: 0.00, LH: 0.33, RF: 0.33, LF: 0.66 }; // 3-beat, right lead; suspension 0.66-1.00
const BOUND = { LH: 0.00, RH: 0.05, LF: 0.30, RF: 0.35 }; // 2-beat pairs + suspension 0.60-1.00
module.exports = { WALK, TROT, PACE, CANTER, BOUND };
```

**Duty factor** — the fraction of the cycle a foot is on the ground — is what decides
whether the body may leave the ground at all:

| gait | duty factor | feet down at once | body airborne? |
| --- | --- | --- | --- |
| walk | 0.60-0.75 | never fewer than 2 | never |
| trot | 0.40-0.50 | 2 (a diagonal pair) | briefly, at high speed |
| pace | 0.40-0.50 | 2 (a lateral pair) | briefly — and it ROLLS side to side, 4-6° |
| canter | 0.30-0.40 | 1 to 3 | yes, one suspension |
| gallop / bound | 0.20-0.35 | 1 to 2 | yes — this is the whole point |

If your duty factor is under 0.25 and the body never leaves the ground, the animal is
skating. If duty is 0.7 and the body leaves the ground, it is floating.

### 3.2 — TROT: diagonal pairs

Two beats. Left hind fires WITH right fore; right hind with left fore. Offsets 0.00 and
0.50, nothing between. (Verified: Wikipedia *Trot* — "a two-beat diagonal gait", ~13 km/h;
IFCE *the horse's gaits* gives the trot stride at about one second, 60 strides/minute.)

The trot is the gait most games actually need, because it is the one that reads as
PURPOSEFUL at mid distance: two crisp beats instead of four soft ones. A wolf closing on
a player trots. So does a spooked cow. Use the walk for grazing and the trot for going
somewhere.

### 3.3 — GALLOP: the honest version and the game version

**The truth first, because it matters when a creator asks.** A horse's gallop is a
**four-beat** gait with one suspension phase, and a canter is **three-beat** (TwinSpires,
*The Science of Horse Racing: The Stride*; IFCE). The clean two-beat gallop belongs to
the **bound** — rabbits, cats, cheetahs, deer — where the hind pair and fore pair each
land nearly together and the body flies twice per cycle.

**The game version** is the bound, for every species, and it is the right call:

```js
// the two-beat gallop, with the frame that sells it
const GALLOP = {
  hinds: 0.00,       // LH 0.00, RH 0.05 — a 5% stagger, never simultaneous
  fores: 0.30,       // LF 0.30, RF 0.35
  suspension: [0.60, 1.00], // all four feet clear; the ROOT rises here
  rootLift: 0.055,   // metres, for a 0.75 m-shoulder animal — see the arithmetic below
  spineFlex: 9,      // degrees of torso pitch, peaking at the gather (0.55) and the extend (0.85)
};
```

**The suspension frame is not optional and it is not the leg animation.** It is a lift on
the ROOT plus a spine flex. Without it a gallop is fast walking, and every player can
tell. At 6 m, `gavi#animar-doutrina` §1's floor is 5 px = 5.85 cm, so a root lift under
**0.055 m** does not exist. Scale it: `rootLift = 0.075 × shoulderHeight`.

**The 5% stagger** on the pairs is the whole difference between a bound and a
pogo stick. Never land two feet on the identical frame.

### 3.4 — BIPEDS AND BIRDS: the head-bob, and what it actually is

A chicken without a head-bob reads as a wind-up toy. This is the single highest-value
paragraph in the section, so here is the mechanism, correctly:

> **The head does not bob. The head is PARKED IN WORLD SPACE while the body walks out
> from under it, then thrusts forward ballistically to a new park.**

(Verified: *Bird head stabilization*, Current Biology 2009 — the head remains still
during the hold phase while the body moves forward, then is rapidly moved forward during
the thrust phase to a new position where it stabilizes again; the phases are named **hold**
and **thrust**.)

So it is not a sine wave on the neck. It is a sawtooth on the head's LOCAL forward offset,
because the body's forward motion is what generates it:

```js
// one STEP, phase u in [0,1). S = step length in metres. HOLD = 0.60 of the step.
// f is the head's local FORWARD offset in metres (this engine faces -Z, so f goes into -z).
const HOLD = 0.60;
const f = u < HOLD
  ? 0.36 * S - S * u                                    // parked: the body slides under it
  : -0.24 * S + 0.6 * S * ((u - HOLD) / (1 - HOLD));    // thrust: ballistic catch-up
// plus a small dip on the thrust, which is what makes it read as a peck-walk
const headPitch = u < HOLD ? 0 : 5 * Math.sin(Math.PI * (u - HOLD) / (1 - HOLD)); // degrees
```

Total head excursion is **0.60 × S**. On a hen with S = 0.18 m that is 0.108 m — **9 px at
6 m**. It reads. A head-bob written as a 3° neck rotation is 0.5 px and does not exist.

The rest of the biped kit: the body **rolls 3-5°** onto the standing leg each step (a
chicken's waddle is roll, not yaw); the tail counter-rotates **6-10°** against the roll;
and for a walking bird the WINGS are still — a bird flapping while it walks reads as
panicked, which is a state, not an idle.

### 3.5 — THE LAW: the cycle rides distance travelled, never a timer

> **phase = (metresTravelled / metresPerCycle) × 2π**

A cycle driven by elapsed time slides the feet the instant the animal's speed differs
from the one number the timer was tuned for — which is every frame it accelerates,
decelerates, walks uphill, gets pushed, or has its speed scaled. A cycle driven by
distance cannot slide, at any speed, ever. This game ships it that way
(`scripts/mobs.js`: *"The phase rides DISTANCE TRAVELLED, never raw time, so a hoof
cannot slide; the amplitude rides ACTUAL ground speed, so a stopped animal's legs
actually stop."*)

Two separate quantities, and mixing them up is the bug:

| quantity | driven by | what it does |
| --- | --- | --- |
| **phase** | distance travelled | WHERE in the cycle each foot is. no slide |
| **amplitude** | current ground speed | HOW FAR the legs swing. a stopped animal's legs stop |

```js
// per animal, module-local (re-derivable, so it never goes in state):
rec.travel += groundSpeed * dt;                 // metres, monotonic
const phase = (rec.travel / rec.cycleMetres) * Math.PI * 2;

// amplitude eases toward a target set by ACTUAL speed, so start/stop is not a snap
const want = moving ? PEAK_DEG * Math.min(1.3, groundSpeed / def.walkSpeed) : 0;
rec.amp += (want - rec.amp) * (1 - Math.exp(-9 * dt));  // ~0.11 s to settle at dt 0.03
```

**metresPerCycle**, the number that decides slide-or-no-slide, is `shoulderHeight × K`:

| size class | K | check |
| --- | --- | --- |
| large quadruped (cow, horse, deer, bear, llama) | **1.0-1.2** | horse: 1.25 m/s ÷ 0.73 strides/s = 1.71 m per stride ÷ 1.55 m withers = **1.10** ✓ |
| mid (pig, sheep, goat, wolf, dog, boar) | 1.2-1.6 | cow: 1.1 m/s ÷ 0.75 = 1.47 m ÷ 1.45 = **1.01** ✓ |
| small (cat, fox, rabbit, chicken, duck) | 1.0-2.6 | this game's shipped values: chicken 1.05, rabbit 1.20, cavy 2.40 |

Tune K by eye ONCE per species and never again: put the animal on flat ground, walk it,
and watch one foot. If the planted foot creeps forward, K is too small; if it creeps
backward, too big. It is a two-minute job and it is permanent.

### 3.6 — cadence, and the 30 Hz arithmetic

Stride frequency falls as body mass rises — roughly as mass^(-1/6) across mammals
(*Scaling Stride Frequency and Gait to Animal Size: Mice to Horses*, Science 1974).
Anchor everything to the one measured value: **a horse's walk stride lasts about 1.37 s**
(IFCE), which is **0.73 strides/second**, and its trot stride about 1.00 s (60/min).

| size class | walk strides/s | one stride in seconds | ticks at 30 Hz |
| --- | --- | --- | --- |
| horse, cow, bull, llama, bear, deer | 0.70-0.85 | 1.18-1.43 | **35-43** |
| donkey, pig, sheep, goat, boar, wolf | 0.85-1.15 | 0.87-1.18 | 26-35 |
| dog, fox, duck, goose | 1.2-1.7 | 0.59-0.83 | 18-25 |
| cat, rabbit, chicken, rat | 1.8-2.5 | 0.40-0.56 | 12-17 |

**This engine ticks at 30 Hz.** Measured live in this room: `api.seconds(1)` returns 30
and `api.getDeltaTime()` returns 0.03. So one tick is **0.03 s**, and:

- `updateSchedule = { every: 1 }` → **30 writes/s**
- `updateSchedule = { every: 2 }` → **15 writes/s**
- `updateSchedule = { every: 3 }` → **10 writes/s**

> **writes per stride = writeRate ÷ stridesPerSecond, and it must be ≥ 6.**

A gait has four footfall events per cycle. Fewer than six samples and the plant frames
land wherever the phase happens to sit, which reads as stair-stepping — never as speed.
This is the stricter cousin of `gavi#animar-doutrina` §1's "frequency ceiling ≈ ¼ of the
write rate" (that rule needs 4 samples for a peak-and-trough sine; a gait needs 6).

| schedule | writes/s | max stride rate it can carry | species it covers |
| --- | --- | --- | --- |
| `every: 3` | 10 | **1.66 /s** | horse, cow, bull, deer, bear, llama, pig, sheep, goat, boar, wolf, donkey, dog |
| `every: 2` | 15 | **2.50 /s** | cat, fox, duck, goose, chicken, rabbit |
| `every: 1` | 30 | 5.00 /s | rat — and the crow's 3.5-4 Hz wingbeat |

**The chicken trap.** A real hen takes 3-5 steps/second. At 10 writes/s that is 2-3
writes per step and it stair-steps visibly. Two honest fixes: run it at `every: 2` **and**
ship the step rate at 2.0-2.5/s. Nobody reads a slightly slow chicken as wrong, because
what the eye tracks is the head-bob, not the step count. Do not try to write 4 Hz at 10
writes/s — that is failure #10 in §7.

**The crow.** 4 Hz of wingbeat needs `every: 1` (7.5 writes/beat) or a baked GLB clip —
which is what a flying bird should have anyway, because the mixer samples it natively
with no per-tick cost. `model: 'cdn/....glb?animations=Idle,Walk,Fly,Glide'` and
`api.updateChannel('fly', { clip: 'Fly', loop: 'loop' })`. See §3.8.

### 3.7 — FISH: no legs, a travelling wave

A trout is **carangiform**: the body wave's amplitude grows toward the tail and the tail
does most of the work. Three or four yaw segments and one travelling sine:

```js
// 4 segments, head -> tail. amplitude in DEGREES, growing back.
const AMP = [2, 6, 12, 20];
const LAG = 0.25;              // each segment trails the one ahead by a quarter cycle
const beat = 2.2;              // tail beats/second cruising — see the write-rate rule
for (let i = 0; i < 4; i++) {
  const yaw = AMP[i] * Math.sin(2 * Math.PI * (rec.travel / rec.cycleMetres) - i * LAG * 2 * Math.PI);
  // write yaw on segment i
}
```

Note the wave rides `rec.travel` too — §3.5 applies to swimming exactly as it does to
walking, and a fish whose tail beats on a timer while it drifts reads as a screensaver.
2.2 Hz at `every: 2` is 6.8 writes/cycle. Clears the rule.

Two things separate a fish from a sprite: **it banks into turns** (roll 10-15° toward the
inside of the turn, eased over 0.4 s) and **it never fully stops** — a hovering fish still
holds 1.5-2° of tail yaw at 0.8 Hz and a pectoral flicker. A fish sitting perfectly still
is failure #6 in §7 wearing scales.

### 3.8 — when NOT to write any of this

All of §3 is for code-driven skeletons and box rigs — the lane
`gavi#animar-esqueleto-codigo` owns. If the animal is a rigged CDN model, the engine does
the gait for you and hand-rolling a second one FIGHTS it:

```js
properties: {
  model: 'cdn/moodboard-lowpoly-cozy/model-quadruped-cow.glb?animations=Idle,Walk,Run,Eat',
  npc: { speed: 1.1, run: 3.2, turn: 140, clips: { idle: 'Idle', walk: 'Walk', run: 'Run' } },
}
```

`properties.npc` drives idle/walk/run blending, anti-slide playback scaling and facing
from the mover's own velocity, with zero animation code. Every clip name must appear in
`?animations=` or it is stripped at bake and T-poses. Your one-shots layer on top freely:
`api.updateChannel('eat', { clip: 'Eat', loop: 'once', duration: 2.4, weight: 1.4 })`.
Full contract in `gavi#animar-glb`.

**Use §3's offsets when the animal is boxes** (this game's whole herd is) **and the
engine's when it is a rig.** Never both on one animal.

---

## 4 — THE SECONDARY LIFE

The body and the walk make a working animal. This section is what makes it a *living*
one, and it is cheap: every number below is a sine or a randomised one-shot.

The gate on all of it is `gavi#animar-doutrina` §1.1: **θ_min ≈ 0.56 · d / L degrees** for
5 px of tip travel. At 6 m that is **33° for a 0.10 m ear** and **6.1° for a 0.55 m tail**.
So read every amplitude below against the part's LENGTH before you trust it.

### 4.1 — the tail

| species | tail L | idle sway | period | the flick |
| --- | --- | --- | --- | --- |
| cow, horse, donkey | 0.55-0.90 m | 10-16° p-p | 2.0-2.8 s | **50-60° in 0.25 s**, every 6-14 s randomised |
| dog | 0.35 m | 20-30° p-p | 0.9-1.4 s | a full wag burst: 60° at 2.5 Hz for 1.5-3 s, on sight of a player |
| cat, fox | 0.30-0.45 m | 14-20° p-p | 1.6-2.4 s | tip-only curl 25° over 0.6 s, every 4-10 s |
| wolf, deer | 0.30-0.45 m | 6-10° p-p | 2.4-3.2 s | deer: tail UP 70° in 0.15 s on alert, and held. that is the species' signature |
| sheep, goat, pig | 0.20-0.30 m | 25-40° p-p | 0.8-1.2 s | pig: a continuous 2 Hz curl-flick. it is never still |
| chicken, duck | 0.12-0.20 m | 12-18° p-p | 1.2-1.8 s | a 25° twitch on any state change, 0.12 s |

**The flick is the animation; the sway is texture.** A 12° sway on a 0.55 m tail is 10 px
at 6 m and reads as life. The same 12° at 30 m is 2 px and reads as nothing — which is
why the flick exists: 55° on a 0.55 m tail is **45 px at 6 m and 9 px at 30 m**. Across a
field, the flick is the only part of the tail that is animated at all.

### 4.2 — the ears

A 0.10 m ear needs **33°** at 6 m. So:

| species | ear L | the twitch | interval |
| --- | --- | --- | --- |
| cow, sheep, goat, pig | 0.10-0.14 m | **35-45° in 0.15 s**, one ear at a time | 3-9 s, randomised, per-ear independent |
| horse | 0.15 m | 30-40°, and they SWIVEL to point at what they heard | 2-7 s |
| donkey, rabbit | 0.25-0.30 m | 12-18° is plenty — long ears are cheap to read | 2-6 s |
| dog, wolf, fox, cat | 0.09-0.13 m | 35-50°, both ears rotating back on alert and held | 2-8 s idle; instant on alert |

Ear-back-and-held is a STATE, not an idle: hold it while the animal is alert or afraid,
release over 0.5 s when it calms. That single held pose reads at 6 m and tells the player
more than any sound.

### 4.3 — chewing, and why the jaw is the wrong bone

A cow's jaw is a 0.10 m box. θ_min at 6 m is 33°, and a jaw does not open 33°. **So do not
animate the jaw.** Animate the head:

```js
// chewing = the whole HEAD nodding, 3-5°, at 1.4 Hz, in bouts
const chewing = rec.chewUntil > now;
const chewPitch = chewing ? 4.0 * Math.sin(2 * Math.PI * 1.4 * rec.chewT) : 0;
// bouts: 8-20 s of chewing, then 15-40 s off. all randomised per animal.
if (now > rec.chewNext) {
  rec.chewUntil = now + 8 + api.random() * 12;
  rec.chewNext  = rec.chewUntil + 15 + api.random() * 25;
}
```

A 0.55 m head nodding 4° sweeps 3.8 cm — 3 px at 6 m, marginal alone, but it is a delta
on a head that is ALSO carried low and slightly swaying, and that composition reads.
This is the doctrine's rule made literal: **a small bone reads as a delta against a moving
parent, never on its own.** Pair it with the eat sound in §5.1 and it lands.

Grazers (cow, sheep, goat, horse, deer) also get the **graze pose**: head down 25-35°
until the muzzle is 0.05-0.10 m off the ground, held 6-20 s, and the head swings 15-20°
of yaw across the grass while it is down. That pose is 60% of what makes a pasture read
as a pasture.

### 4.4 — the head turning toward what it heard

The single cheapest thing that makes an animal feel like it has a mind.

```js
// on a noise, or when a player crosses inside 12 m
const turn = { yaw: 25 + api.random() * 25, riseSec: 0.40, holdSec: 1.5 + api.random() * 1.5, fallSec: 0.8 };
```

Rise 0.40 s eased out, hold 1.5-3.0 s, return 0.8 s. Ears back on the same frame the turn
starts (§4.2). On an npc agent, `api.face(target)` does the body turn for you and
`onNoise(noise, api)` hands you the position — players auto-emit `"footsteps"` while
moving, so an animal hears an approach for free (`npc` skill). On a box rig, write the head
yaw yourself and stagger it **0.08 s** behind the ear — that stagger is the difference
between a puppet and a creature (`gavi#animar-doutrina` §3).

### 4.5 — the breath, sized so it exists

`gavi#animar-doutrina`'s classic failure is a 0.006 m breath. On animals:

| species | torso rise | period | plus |
| --- | --- | --- | --- |
| cow, horse, bull, bear | 0.020-0.028 m | 2.5 s (0.4 Hz) | torso roll 1.5-2.5° |
| pig, sheep, goat, wolf, dog, deer | 0.012-0.018 m | 2.0 s (0.5 Hz) | roll 2-3° |
| cat, fox, rabbit, chicken, duck | 0.006-0.010 m | 1.4 s (0.7 Hz) | roll 3-4° — small animals breathe visibly fast |

0.024 m at 6 m is 2 px. Marginal on purpose: breath is meant to be felt at 2-4 m and
invisible at 15, and that is correct — a cow whose chest heaves visibly from across a
field is a cow in distress. `scripts/mobs.js` ships `BREATH_HZ = 0.4`.

### 4.6 — THE IDLE IS NEVER A FROZEN POSE

> **At 30 Hz, 8 frames is 0.27 s. Nothing in a living body may hold a numerically
> identical value for longer than that. A longer hold reads as a crash.**

`gavi#animar-doutrina` §3.2 states the law; here is what it means for a standing animal.
The trap is that every sine you write has a stationary point at its peak, and if all your
sines share one frequency, they ALL sit still at the same moment and the animal freezes
for a quarter second, repeatedly. The fix is incommensurate frequencies:

```js
// three channels, three frequencies with no common period, phase-offset per animal
const t = rec.idleT;                       // seconds, seeded per animal so no two sync
const breath = 0.024 * Math.sin(2 * Math.PI * 0.41 * t);          // torso rise, metres
const shift  = 0.015 * Math.sin(2 * Math.PI * 0.29 * t + 1.7);    // hip lateral, metres
const tail   = 6.0   * Math.sin(2 * Math.PI * 0.37 * t + 3.1);    // degrees
// 0.41 / 0.29 / 0.37 Hz: the composite never repeats and never flatlines
```

Then the one-shots on top, each on its own randomised countdown: ear twitch (3-9 s),
tail flick (6-14 s), head turn (8-25 s), chew bout (§4.3), blink (4-9 s), and a weight
shift onto the other diagonal every 12-30 s. **Seed every countdown and every phase
offset per animal** — `rec.idleT = api.random() * 9` at spawn — or twelve cows twitch in
unison, which is the visual form of failure #3 in §7.

Blink honestly: an eye box is 0.06 m, 1 px at 30 m. Scale the eye's y to 0.15 for 3 ticks
(0.1 s). It reads at 2-4 m, is invisible past 8, and that is fine — say so instead of
paying for it twice.

---

## 5 — THE VOICE

The second half of the file, and the reason it exists. A visually perfect herd in silence
is failure #4. A herd where every animal talks is failure #3. The gap between them is
about forty lines of code and the numbers below.

### 5.1 — the paths: a name written into being

```
/cdn/moodboard-<family>/sfx-<animal>-<action>.mp3
```

The filename **is** the prompt. There is no catalogue to look up — the path generates on
first fetch. Twenty real names, spanning six actions:

| # | path (under `/cdn/moodboard-<family>/`) | action | note |
| --- | --- | --- | --- |
| 1 | `sfx-cow-low-mooing-deep-single-call.mp3` | idle | **shipped in this game** |
| 2 | `sfx-pig-oink-single-grunt.mp3` | idle | **shipped** |
| 3 | `sfx-sheep-baa-single-bleat.mp3` | idle | **shipped** |
| 4 | `sfx-chicken-clucking-short-single-cluck.mp3` | idle | **shipped** |
| 5 | `sfx-rabbit-squeak-tiny-single.mp3` | idle | **shipped** |
| 6 | `sfx-donkey-bray-single.mp3` | idle | **shipped** |
| 7 | `sfx-horse-whinny-short-single-call.mp3` | idle | a whinny came back 1.61 s — see §5.3 |
| 8 | `sfx-wolf-howl-long-rising-single.mp3` | idle (night) | the one place a 2 s clip is right |
| 9 | `sfx-wolf-growl-low-warning-short-single.mp3` | **alert** | the pre-attack tell |
| 10 | `sfx-dog-bark-sharp-double-single-take.mp3` | alert | |
| 11 | `sfx-goose-honk-aggressive-short-single.mp3` | alert | |
| 12 | `sfx-deer-snort-alarm-sharp-single.mp3` | alert | pairs with the tail-up in §4.1 |
| 13 | `sfx-small-animal-hurt-short-yelp.mp3` | hurt | **shipped**, shared by family |
| 14 | `sfx-large-animal-hurt-short-grunt.mp3` | hurt | **shipped**, shared by family |
| 15 | `sfx-small-animal-death-final-squeal.mp3` | death | **shipped** |
| 16 | `sfx-large-animal-death-final-groan.mp3` | death | **shipped** |
| 17 | `sfx-cow-hoof-step-soft-dirt-single.mp3` | footstep | |
| 18 | `sfx-horse-hoof-clop-hard-stone-single.mp3` | footstep | surface in the name, always |
| 19 | `sfx-chicken-foot-scratch-dirt-light-single.mp3` | footstep | |
| 20 | `sfx-cow-chewing-grass-wet-single-short.mp3` | **eat** | fires with §4.3's chew bout |
| 21 | `sfx-pig-snuffling-rooting-dirt-short-single.mp3` | eat | |
| 22 | `sfx-wolf-tearing-meat-wet-short-single.mp3` | eat | |

### 5.2 — THE NAMING LAW

**1. Every name carries the SHAPE of the sound, not just the animal.** `sfx-cow.mp3` gets
you a thirty-second stock pasture loop. The words that do the work:

- **`single`** — one event, not a series. Non-negotiable for one-shots.
- **`short`** — pushes the mint under ~1.2 s.
- **`dry`** — no reverb baked in; the engine's spatialisation supplies the space.
- the actual verb: `mooing`, `bleat`, `oink`, `cluck`, `bray`, `whinny`, `honk`, `snort`.
- the surface, for footsteps: `soft-dirt`, `hard-stone`, `wet-grass`, `gravel`.

**2. A name, once served, keeps its first sound forever.** The CDN keys derived copies by
filename alone, and similar wordings collide onto one file. So a re-mint needs a **new
token**: `...-v2`, `...-take2`. Rewording the description into the same shape gets you the
old sound back. Move the refs to the new name and leave the old one serving whatever
still uses it.

**3. One canary before a cast.** Changing the voice of a species that already exists in
the world: mint ONE new name, listen to it (`read_url` on the `/cdn/<filename>` returns a
listen report — measured duration plus what it actually sounds like, judged against the
name), and only then roll the rest. Six re-mints on one unheard guess is six times the
queue spent on the same mistake.

**4. Share hurt and death by FAMILY, not by species.** This game ships two hurt clips and
three death clips for twelve creatures, deliberately. Two good takes beat twelve thin
ones, and nobody has ever noticed. Where the species' voice is genuinely its own —
`scripts/mob-voices.js` gives the guinea pig its own wheek, purr, shriek and last squeak
because *a cavy is not a pig* — spend the mint. Everywhere else, share.

### 5.3 — the mixing numbers

Two different field names, and they are not interchangeable. Get this right:

| plane | the call | the loudness field | verified |
| --- | --- | --- | --- |
| a standing spatial LOOP on a body | `properties.audio` component | **`gain`** (0-2) | `AudioSpec = { kind?: "clip", clip, gain?: 0-2, pitch?, loop?, spatial?, maxDistance?, refDistance?, rolloffFactor?, bus?, priority? }` |
| a one-shot from a manager | `api.playSound(clip, opts)` | **`volume`** (default 1) | `playSound(clip, { position?, volume?, pitch?, loop?, mode?, bus?, priority?, maxDistance?, audience? })` |
| music | `api.music.play(ref, opts)` | `volume` 0-1 | not an animal's lane. §5.6 |

```js
// an ambient loop that lives on a body — a beehive, a chicken coop, a wasp nest
properties: {
  audio: { clip: CDN + 'sfx-beehive-buzz-steady-loop.mp3', loop: true, spatial: true,
           gain: 0.30, maxDistance: 14, bus: 'Ambience' },
}

// a one-shot from the herd manager, at the animal's own head
api.playSound(IDLE[sp], { position: { x: rec.x, y: rec.y + headH, z: rec.z },
                          volume: 0.45, pitch: pitchOf(id), maxDistance: 34, bus: 'SFX' });
```

The numbers, from this game's shipped `scripts/mob-voices.js`:

| what | volume | maxDistance | why |
| --- | --- | --- | --- |
| ambient loop (`gain`) | **0.30** | 14-20 m | the audio skill's law: ambient beds SUM. budget the total, not each one |
| idle voice | **0.45** | 34 m | punctuation, not presence |
| eat / footstep | 0.25-0.35 | 12-16 m | close-range texture. never audible across a field |
| alert / growl | 0.70 | 40 m | it has to reach the player it is about |
| hurt | **0.80** | 42 m | |
| death | **0.90** | 42 m | the loudest an animal ever gets. never above 1.0 |

`spatial: true` for **anything with a body** — an unspatialised animal voice arrives from
inside the player's head and is instantly wrong. On `playSound`, passing a `position`
positions it; `maxDistance` is the metre reach where gain hits exactly 0, and it should sit
**a little past** the gate radius that decided to play the sound (28 m gate → 34 m reach)
so 28 m is faint rather than cut.

**Long clips.** Two mints in this game came back longer than a one-shot may be — a whinny
at 1.61 s, a groan at 1.44 s that ended on a click. Both were trimmed to ~1.15 s with a
short fade-out in the workshop and re-uploaded; the conjured originals still serve under
their own names. Check length with `api.audio.duration(ref)` (seconds, or `null` until the
fact has mirrored — read it at preload and cache it, never poll). **An idle one-shot over
1.3 s reads as a cutscene.** `api.preloadAsset(ref)` at world start so the first moo is
not late.

### 5.4 — THE CADENCE LAW

> **An idle voice fires on a RANDOMISED interval, with a per-animal cooldown and a cap on
> how many of a species may speak in the same few seconds.**

Break any one of the three and the herd is a soundboard. The real numbers, shipped:

| constant | value | what it buys |
| --- | --- | --- |
| pulse | `updateSchedule = { every: { seconds: 0.3 } }` | fast enough for a fuse or a charge tell |
| census | every 2nd pulse = **0.6 s** | one `api.query` per 0.6 s for the whole world |
| idle interval | **8-20 s**, uniform random, re-rolled per animal after each voice | never a fixed period |
| night / hostile interval | 5-12 s | predators are chattier in the dark |
| gate radius | **28 m** | no voice for an animal nobody can hear |
| reach | 34 m idle, 42 m loud | the faint-not-cut margin |
| **global cap** | **1 idle voice per census** = ≤1.7 /s across the entire world | the world punctuates; it does not chirp |
| **per-species cap** | 1 in any **2 s** window | twelve cows read as a herd, not a chorus |
| hush after hurt | **1.5 s** | a yelped animal does not cluck a beat later |

```js
// scripts/animal-voices.js — one manager for the whole cohort. Never one behavior per animal.
export const updateSchedule = { every: { seconds: 0.3 } };

const CDN = '/cdn/moodboard-lowpoly-cozy/';
const IDLE_MIN = 8, IDLE_MAX = 20;
const GATE = 28, REACH = 34, IDLE_VOL = 0.45;
const MAX_PER_CENSUS = 1;      // global cap
const SPECIES_WINDOW = 2.0;    // seconds a species stays quiet after one of it speaks
const HUSH_AFTER_HURT = 1.5;

// module-local: nothing here is written to any object's state, so nothing replicates
let recs = {};          // id -> { sp, next, hurtAt, h }
let lastSpoke = {};     // species -> seconds
let pulse = 0;

export function update(dt, api) {
  const now = api.getTick() / 30;              // 30 Hz: api.seconds(1) === 30
  if (++pulse % 2) return;                     // census on every other pulse: 0.6 s

  const players = api.getPlayers();
  const mobs = api.query({ tags: ['animal'], radius: 5000 });
  let spoken = 0;

  for (let i = 0; i < mobs.length; i++) {
    const m = mobs[i];
    let r = recs[m.id];
    if (!r) {
      // seed the countdown from a RANDOM point in the window, or the whole herd
      // that spawned together speaks together on its first cycle
      r = recs[m.id] = { sp: m.state.species, next: now + IDLE_MIN + api.random() * (IDLE_MAX - IDLE_MIN), hurtAt: 0, h: m.state.headH || 1.0 };
    }
    if (now < r.next) continue;
    if (now - r.hurtAt < HUSH_AFTER_HURT) { r.next = now + 2; continue; }
    if (spoken >= MAX_PER_CENSUS) continue;                          // global cap
    if (now - (lastSpoke[r.sp] || -99) < SPECIES_WINDOW) continue;   // per-species cap

    // the gate: nobody in earshot, no sound, and re-roll so it does not queue up
    let near = false;
    for (let j = 0; j < players.length; j++) {
      const p = players[j].feetPosition;
      if (p && Math.hypot(p.x - m.feetPosition.x, p.z - m.feetPosition.z) < GATE) { near = true; break; }
    }
    r.next = now + IDLE_MIN + api.random() * (IDLE_MAX - IDLE_MIN);  // ALWAYS re-roll
    if (!near) continue;

    const clip = IDLE[r.sp];
    if (!clip) continue;
    api.playSound(pick(api, clip), {
      position: { x: m.feetPosition.x, y: m.feetPosition.y + r.h, z: m.feetPosition.z },
      volume: IDLE_VOL, pitch: pitchOf(m.id), maxDistance: REACH, bus: 'SFX', mode: 'restart',
    });
    lastSpoke[r.sp] = now;
    spoken++;
  }
}

// a value may be one clip or a list — a list never sounds like one repeated sample
function pick(api, v) { return Array.isArray(v) ? v[Math.floor(api.random() * v.length)] : v; }
```

Three details in there that are load-bearing:

1. **the countdown is seeded at a random point in the window, not at the full window.**
   A herd that spawns on one tick otherwise all reaches zero on the same tick.
2. **`r.next` is re-rolled even when the gate refuses.** Otherwise every animal in the
   pasture is sitting at zero, and the moment a player walks in, all of them fire.
3. **`mode: 'restart'`** — a new play of the same clip from the same source replaces the
   still-playing copy instead of stacking louder. Right for cries and voices; the default
   `'overlap'` is right for gunshots, where stacking IS the texture.

### 5.5 — per-instance pitch: ten cows, not one cow ten times

```js
// deterministic from the id, so it is identical on every client and stable for that
// animal's whole life — an individual keeps its voice
function pitchOf(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return 0.92 + (h % 1000) / 1000 * 0.16;   // 0.92 - 1.08
}
```

**0.92-1.08 is the window** (shipped). Wider than ±8% and a cow starts sounding like a
different species; narrower and you cannot hear the difference. Do NOT roll the pitch
fresh on each play — that makes one animal sound like a crowd of itself. Hash the id.

Two extras that cost nothing: pitch a **calf or lamb** up to 1.25-1.40 off the adult clip
instead of minting a second one, and give a species with two takes a LIST (§5.4's `pick`)
so it never reads as one sample on repeat.

### 5.6 — the bed underneath, which is not the animals

The animals punctuate. Something else has to be continuously there, or the 8-20 s gaps
are dead air and the player hears the silence instead of the moo.

```js
// one invisible anchor per region. NOT on an animal — the bed must not walk away.
api.spawn({ id: 'bed-pasture', place: 'main', tags: ['ambience'], properties: {
  feetPosition: { x: 40, z: -12, y: { terrain: 2 } }, visible: false, physics: 'none',
  audio: { clip: CDN + 'sfx-ambience-pasture-wind-in-grass-crickets-loop.mp3',
           loop: true, spatial: true, gain: 0.28, maxDistance: 55, bus: 'Ambience' },
}});
```

| bed | name | gain | maxDistance |
| --- | --- | --- | --- |
| pasture / field | `sfx-ambience-pasture-wind-in-grass-crickets-loop.mp3` | 0.28 | 55 m |
| forest, day | `sfx-ambience-forest-birdsong-distant-leaves-loop.mp3` | 0.30 | 60 m |
| forest, night | `sfx-ambience-forest-night-crickets-owl-distant-loop.mp3` | 0.26 | 60 m |
| barn / coop interior | `sfx-ambience-barn-interior-straw-rustle-hollow-loop.mp3` | 0.22 | 16 m |
| shore / pond | `sfx-ambience-pond-water-lapping-reeds-loop.mp3` | 0.25 | 30 m |

**Ambient beds SUM** (the audio skill's own law). Budget the TOTAL soundscape, not each
loop: **no more than two beds audible at one point, total gain ≤ 0.45.** Overlap two 0.30
beds at a treeline and the player is standing in 0.60 of mush that eats every animal voice
you spent mints on.

Enumerate before you theorise about a rogue sound — one read lists every world-sound in
the place:

```js
return api.query({ select: 'ids', excludeSelf: false })
  .map((id) => ({ id, audio: api.getObjectProperty(id, 'audio') }))
  .filter((s) => s.audio);
```

`api.audio.playing()` is the same census for the loops and emitters the authority is
telling clients to play. `api.music.now()` for the music plane.

### 5.7 — when Gavi tells the creator about the voices

`gavi#ser-a-gavi` Law 7b: every word he reads is a word he already knows. Not "randomised
interval with a per-species cap" — that is the workbench. What he reads:

> the whole field was mooing at once. now only one animal speaks every few seconds, and
> each cow got its own voice, so twelve of them sound like twelve of them instead of one
> on repeat. there's wind and crickets underneath the whole time so the quiet bits aren't
> dead air.

> the horse's call came back a bit long — it sounded like a cutscene instead of a horse.
> i trimmed it. the old one's still there if you liked it better.

Plain is not soft. He still gets the corpse of a dead theory and "i haven't looked yet".

---

## 6 — WORKED BUILD: the cow, end to end

Paste this and you get a cow. Numbers straight off §1 row 1: **L 2.40 m, shoulder 1.45 m,
700 kg, head:torso 0.42, leg 0.50.**

### 6.1 — the box list

Legs 0.72 m (0.50 × 1.45). Torso 0.78 m tall, bottom at 0.72, top at 1.50 — withers read
at 1.45. **The tell: the head hangs LOW**, centre at y ≈ 1.05, muzzle at 0.90 — below the
back line, which is the whole species (§2.1 mistake 3). Child offsets are **local to the
parent's bottom-centre**; the root `feetPosition` is world.

Two shorthands in the note column are this game's own part-record flags from
`scripts/lib/mob-shapes.js`, **not engine property names**: `rot:` is the record's static
tilt and lands on the engine's `properties.rotation: { pitch, yaw, roll }` (degrees), and
`dk: true` marks a part that is MEANT to be near-black — a socket, a hoof, a mouth slit —
so it opts out of §1.2's no-black floor. Three centimetres, not a body.

| part | parent | local offset (x, y, z) | box (w, h, d) m | note |
| --- | --- | --- | --- | --- |
| `torso` | root | 0, 0.72, 0 | 0.62 × 0.78 × **1.30** | the horizontal slab |
| `legFL` pivot | torso | −0.22, 0, −0.45 | – (invisible) | the leg SWINGS from here, never from its middle |
| `legFL` | legFL pivot | 0, −0.72, 0 | 0.13 × 0.72 × 0.13 | 9% of shoulder height. thin (§2.1 mistake 1) |
| `hoofFL` | legFL | 0, 0, 0 | 0.17 × 0.10 × 0.19 | `dk: true` — a hoof is meant to be near-black |
| `legFR` / `legBL` / `legBR` | torso | ±0.22, 0, −0.45 / +0.48 | same as FL | four pivots, four legs, four hooves |
| `neck` | torso | 0, 0.62, −0.60 | 0.34 × 0.34 × 0.42 | `rot: { pitch: −38 }` — angles down and forward |
| `head` pivot | neck | 0, 0.10, −0.34 | – | the head-turn and the chew both write HERE |
| `head` | head pivot | 0, −0.19, −0.20 | 0.36 × 0.38 × **0.55** | 0.55 / 1.30 = 0.42 ✓ |
| `muzzle` | head | 0, 0.08, −0.30 | 0.24 × 0.17 × 0.15 | proud of the head's front wall — the outline gap |
| `eyeL` / `eyeR` | head | ±0.15, 0.26, −0.14 | 0.06 × 0.06 × 0.03 | `dk: true`. geometry, never a texture |
| `earL` / `earR` pivot | head | ±0.19, 0.30, 0.06 | – | independent countdowns (§4.2) |
| `earL` / `earR` | ear pivot | 0, 0, 0 | 0.05 × 0.13 × 0.09 | 0.13 m → needs 35-45° to read |
| `hornL` / `hornR` | head | ±0.15, 0.36, 0.00 | 0.06 × 0.06 × 0.18 | `rot: { roll: ±22 }`. optional |
| `udder` | torso | 0, −0.06, 0.32 | 0.30 × 0.22 × 0.26 | |
| `tail` pivot | torso | 0, 0.66, 0.64 | – | |
| `tail` | tail pivot | 0, −0.55, 0.04 | 0.06 × 0.55 × 0.06 | `rot: { pitch: 8 }` |
| `tuft` | tail | 0, −0.04, 0 | 0.10 × 0.16 × 0.10 | |

```js
// one root, children parented — the whole cow is one entity the manager drives
api.spawn({
  id: 'cow_' + api.uniqueId('c'), place: 'main', tags: ['animal', 'cow'],
  state: { species: 'cow', health: 30, headH: 1.05 },
  properties: {
    feetPosition: { x, z, y: { terrain: 0 } },
    physics: { body: 'static', collider: 'box' },   // §7 row 8: no physics field = a ghost
  },
  children: [
    { properties: { feetPosition: { x: 0, y: 0.72, z: 0 },
                    primitive: { kind: 'box', width: 0.62, height: 0.78, depth: 1.30 },
                    material: { color: '#e8e4dc', roughness: 0.96, metalness: 0 } } },
    // ...the rest of the table, same shape. every material carries a flat `color` (§1.2).
  ],
});
```

For a one-mesh cow instead of a box stack — cheaper draw, no z-fighting between touching
panels — the same table goes through `primitive: { kind: 'scripted' }` and
`require('builtin/geom')`. `gavi#criar-modelo-3d` owns that call; the dimensions do not
change.

### 6.2 — the gait

```js
const COW = {
  cycleMetres: 1.48,        // 1.45 m shoulder x K 1.02 — verified in §3.5
  walkSpeed: 1.10,          // m/s
  strideRate: 0.75,         // /s -> 40 ticks at 30 Hz -> 13 writes at every:3. clears the >=6 rule
  schedule: 3,              // updateSchedule = { every: 3 } = 10 writes/s
  offsets: { LH: 0.00, LF: 0.25, RH: 0.50, RF: 0.75 },  // 4-beat lateral sequence
  legPeakDeg: 13,           // +/-13 = 26 p-p. a 0.72 m leg at 6 m: theta_min 4.7deg, so 26deg is ~28px
  rootBobM: 0.055,          // twice per cycle. 0.030 is the real number and it is 2px at 6m
  headSwayDeg: 5,           // head yaw, 2x cycle, counter to the root bob
  breath: { riseM: 0.024, hz: 0.41 },
};
```

```js
// in the warden's per-animal update — phase on DISTANCE, amplitude on SPEED (§3.5)
rec.travel += gspeed * dt;
const ph = (rec.travel / COW.cycleMetres) * Math.PI * 2;
const want = moving ? COW.legPeakDeg * Math.min(1.3, gspeed / COW.walkSpeed) : 0;
rec.amp += (want - rec.amp) * (1 - Math.exp(-9 * dt));

const legPitch = (o) => rec.amp * Math.sin(ph - o * Math.PI * 2);
// legFL uses offsets.LF, legBL uses LH, legFR uses RF, legBR uses RH
const rootY = moving ? COW.rootBobM * Math.abs(Math.sin(ph)) : 0;
```

### 6.3 — the three sounds

```js
const CDN = '/cdn/moodboard-lowpoly-cozy/';
const COW_IDLE = CDN + 'sfx-cow-low-mooing-deep-single-call.mp3';       // vol 0.45, reach 34
const COW_HURT = CDN + 'sfx-large-animal-hurt-short-grunt.mp3';         // vol 0.80, reach 42 — shared by family
const COW_STEP = CDN + 'sfx-cow-hoof-step-soft-dirt-single.mp3';        // vol 0.28, reach 14
// and the fourth, for §4.3's chew bout:
const COW_EAT  = CDN + 'sfx-cow-chewing-grass-wet-single-short.mp3';    // vol 0.30, reach 12
```

Footsteps fire on the **phase crossing**, not on a timer — that is the same law as §3.5,
and it is why a hoof sound lands exactly when the hoof lands:

```js
const beat = Math.floor(rec.travel / (COW.cycleMetres / 4));   // 4 footfalls per cycle
if (beat !== rec.lastBeat) {
  rec.lastBeat = beat;
  if (nearPlayer) api.playSound(COW_STEP, { position: foot, volume: 0.28, pitch: pitchOf(id), maxDistance: 14 });
}
```

### 6.4 — what the manager holds

One server warden for the whole herd, following `scripts/mobs.js`. **Never one behavior
script per animal** — one system driving a cohort is the pattern, and 33 tracked animals
in this game cost one query per 0.6 s.

| where | field | why there |
| --- | --- | --- |
| **`state`** (durable, replicates, survives rollback) | `species`, `health`, `home`, `headH`, `dead` | the game needs them, other scripts read them, they must survive a reload |
| **module-local `recs[id]`** (never replicates) | `travel`, `amp`, `w` (last value written per group), `cycleMetres`, `idleT`, `chewUntil`, `chewNext`, `earNext[2]`, `tailNext`, `next` (voice), `hurtAt`, `lastBeat`, `parts` (the resolved child ids) | all re-derivable. writing a per-tick float into `state` replicates it to every client 10 times a second for nothing |

The `w` map is the one non-obvious entry and it pays for itself: **before writing a
rotation, compare against the last value written and skip if the delta is under the
readable floor.** A cow standing still costs zero writes instead of ten a second, and a
herd of thirty costs what a herd of three costs.

---

## 7 — THE FAILURE TABLE

Each row has its **TELL** — the observation that names the failure without a theory.

| # | the failure | THE TELL | the cause | the fix |
| --- | --- | --- | --- | --- |
| 1 | **the animal is a box with legs** | you can count the boxes before you can name the species | no silhouette pass; boxes sized for convenience | §2. run the 128 px test. then §1's tell column, and fix the leg fraction and the head height first |
| 2 | **the feet slide** | a hoof plants, then keeps travelling backward across the ground | the cycle is on a timer | §3.5. `phase = travel / cycleMetres`. and tune K by watching one foot |
| 3 | **every cow moos at once** | one moo, then eleven inside two seconds | fixed interval, no per-species cap, countdowns seeded at the full window | §5.4. randomised 8-20 s, 1 per census globally, 1 per species per 2 s, and seed each countdown at a RANDOM point |
| 4 | **the herd is silent** | you can see twelve animals and hear nothing | the 28 m gate refused and never re-rolled; or the mint never served | re-roll `next` even when the gate refuses (§5.4). then `api.query` the `audio` census (§5.6) and `read_url` the `/cdn/` path — a listen report tells you whether the file exists |
| 5 | **the head is a texture instead of geometry** | the face is fine at 2 m and tiled, mottled or smeared at 6 m | a conjured face bake on a flat panel | §1.2 law 1. eyes, muzzle, comb, sockets are small BOXES. this game learned it on three failed bakes |
| 6 | **the body renders black** | a solid dark mass, worst in shade or a cave | a `texture` that failed to serve falling through to a dark palette base | §1.2 laws 2-3. every material carries a flat `color`; floor any body-sized colour above ~#4a4a4a |
| 7 | **it reads at 2 m and vanishes at 30** | you approved it in the preview booth | judged at 1 m. at 30 m one pixel is 5.8 cm | §2.2. the tell must live in the outline, the 9 px head-blob and the four 2 px leg strokes |
| 8 | **every animal is the same animal at a different size** | the leg fraction is identical across four species | one rig scaled per species | §1's **leg** column: 0.21 to 0.61. deer 0.61, bear 0.42, duck 0.21. and the head-height row in §2.1 |
| 9 | **it stands there and reads as crashed** | a value holds identical for more than 8 ticks (0.27 s) | one idle frequency, so every channel flatlines together | §4.6. incommensurate frequencies (0.41 / 0.29 / 0.37 Hz) plus per-animal phase seeds |
| 10 | **the small animal's legs stutter** | the plant frames land in different places each cycle | 4 Hz written at 10 writes/s | §3.6. **writes per stride ≥ 6**. move to `every: 2`, or slow the step rate, or bake a clip |
| 11 | **the chicken is a wind-up toy** | the whole bird translates rigidly, head glued forward | no head-bob | §3.4. the head PARKS in world space and the body walks out from under it. 0.60 × step length of local excursion |
| 12 | **the gallop is just fast walking** | the legs blur but the body never leaves the ground | no suspension frame | §3.3. root lift `0.075 × shoulderHeight` over phase 0.60-1.00, plus 9° of spine flex |
| 13 | **an ear twitch nobody has ever seen** | it looks great in the debug view and is invisible in play | a 9° rotation on a 0.10 m ear | §4.2 / `gavi#animar-doutrina` §1.1. 35-45°, or move the motion up the chain to the head |
| 14 | **the herd is a wall of mush** | you can hear ambience but no individual animal | two 0.30 beds overlapping at a treeline | §5.6. ambient beds SUM. ≤2 audible, total gain ≤ 0.45 |
| 15 | **the animal is a ghost** | the player walks straight through it | no `physics` field, so no collider at all | `physics: { body: 'static', collider: 'box' }`. verify with `view_live_scene` + `colliders: true` |

---

## 8 — hand-offs

| for | go to |
| --- | --- |
| how the box list becomes one clean mesh, materials, paint, the CDN surfaces | `gavi#criar-modelo-3d` |
| the amplitude floor, the 128 px test in general, contact + weight, overshoot, the 8-frame law | `gavi#animar-doutrina` |
| writing the gait as code on a box rig or a skeleton — the lane §3's offsets are for | `gavi#animar-esqueleto-codigo` |
| a rigged CDN model instead: `?animations=`, `properties.npc`, `updateChannel`, IK | `gavi#animar-glb` |
| the warden pattern, one system per cohort, `updateSchedule`, the write-skip map, budgets | `gavi#programar-de-verdade` |
| proving the motion actually reads — two looks a beat apart, the burst filmstrip | `gavi#animar-verificar` |
| where the herd lives: pasture, treeline, water, scatter | `gavi#fazer-cenario` |
| the words she sends the creator about any of this | `gavi#ser-a-gavi` Law 7b |

**The one sentence.** An animal is real when its outline names the species at 128 px, its
feet ride the ground it covers, and its voice arrives on an interval nobody can predict.
Miss the body and it is a toy. Miss the walk and it is a puppet. Miss the voice and it is
a photograph.