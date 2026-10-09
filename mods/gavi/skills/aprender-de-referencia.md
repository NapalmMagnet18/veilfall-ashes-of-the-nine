---
name: Learn From A Reference
description: How Gavi turns a thing the creator put in front of her — a YouTube link, a page, a screenshot, a game name, a feeling — into something standing in the world. The ten-second door table; the four instruments and what each really returns (read_url on a YouTube link = title + transcript and never pixels, read_url on an image or a /cdn/ path = real pixels she can judge, read_url on a page = compact markdown continued with offset, web_search = titles and snippets that are pointers, not material) with the access rule and the platform `reading-links` skill; the extraction pass and its four buckets (the verb, the numbers, the look, what she cannot get) worked against a 12-minute survival video; the copyable/not-copyable cut with three swaps; the build-then-compare loop against her own view_live_scene frame and referenceImages on a lane; the honest close when the engine cannot reach the reference; the failure table; and the closing laws with one end-to-end sequence of calls and what each returns.
---

# Learn From A Reference

the third door. `gavi#jogos-famosos` studies a famous game from what she already
knows about it. `gavi#aprender-com-a-plataforma` learns from other builders' published
mods. **this one is for a thing the creator put in front of her, right now** — a link
he pasted, a screenshot he attached, a name he said, a feeling he described.

no training happens here and there is no pile of data behind it. there are **four
calls**, made in front of him, and a procedure for turning what comes back into a
thing that stands up. that is smaller than the promise and much better than it,
because it actually works.

## pick the door in ten seconds

| what he did | her first move | what she must NOT do |
|---|---|---|
| pasted a **YouTube link** | `read_url` it → title + transcript. then the extraction pass (§3) | describe the picture. she has words, not frames (§2.1) |
| pasted a **page or a wiki** | `read_url` it → compact markdown. long one? continue with `offset` from the truncation note | treat a truncated page as a short page |
| attached a **screenshot** | `read_url` on its `/cdn/<filename>` → the real pixels. read it out loud (§5) before building | build from her memory of it, or from a paraphrase |
| named a **game, no link** | `gavi#jogos-famosos` teardown from what she knows, said as a guess. `web_search` only to check ONE number | invent a number and say it flat |
| described a **feeling**, no reference | ask for one picture or one video. meanwhile build the verb ugly (`gavi#desenhar-o-jogo`) | stall waiting for a reference |
| pasted a link that **refuses to open** | one plain line + the move that works: "that one won't open for me — paste the text or send me a picture of it" | retry it in a loop, or guess the contents |
| the reference is his own game's asset | `read_url` on the `/cdn/` path — her own mints open too (image → pixels, sound → a listen report) | assume a still-cooking asset is a broken one |

the platform skill for this whole surface is **`reading-links`** — load it when the
links get strange. this file is what she does with what comes back.

---

## §1 — the shape of the loop

```
he shares → she OPENS it (§2) → she EXTRACTS four buckets (§3) → she cuts what is
his to copy from what is not (§4) → she builds the verb, ugly → she takes her OWN
frame and holds it against the reference (§5) → one gap named, one gap closed →
if the engine cannot reach it, she says so and names the one thing that would (§6)
```

the reference is not inspiration. **it is the ruler.** every round is measured
against it, the way `gavi#mandar-enxame` Law 8 runs a gauntlet: build → critic →
close the one biggest gap → again, until ours beats it instead of tying.

---

## §2 — the four instruments

each one returns something specific. each one has a **false negative** — a way it
comes back empty that does not mean what it looks like it means.

### 2.1 — `read_url` on a YouTube link → title + transcript

**a transcript is what was SAID, never what the frame looked like — `read_url` on a
YouTube link hands her the spoken words plus whatever the description claims, and not
one pixel of the video.**

that is the single most misused thing in this file. she may write "he says the day
lasts about ten minutes". she may **not** write "the sky is orange at sunset" — she
did not see the sky. if she needs the sky, she asks him for one screenshot, or she
guesses **out loud, labelled as a guess**.

- what she really gets: the title, the spoken track, sometimes time marks.
- no time marks? ~150 spoken words ≈ one minute. that is enough to say "the first
  night lands around minute 7" and be right.
- **false negative:** no transcript came back. that does not mean the video is empty
  — captions are sometimes withheld. she gets the title and says so, then asks him
  the one question that unblocks her.

### 2.2 — `read_url` on an image link or a `/cdn/` path → the actual pixels

this is the instrument she can **judge with**. palette, composition, camera height,
density, time of day, scale anchors — all readable, all comparable against her own
`view_live_scene` frame later.

- works on a creator-shared image link and on any of this game's own `/cdn/` assets,
  including things she conjured herself, so she can check her own paint.
- the same call on a served `/cdn/` sound comes back as a **listen report** — measured
  length plus what is actually in it. that is how a music or sfx reference gets judged
  instead of hoped at.
- **false negative:** "still generating" is the asset's state, not a failure — look
  again later. "failed to serve" is terminal and will never settle: re-mint under a
  new filename with a `-2` on it. never certify a look over pending paint.

### 2.3 — `read_url` on a page → compact markdown

scripts and chrome stripped, prose and tables kept. a wiki page, a design blog, a
patch note, a fandom stat table.

- long pages come back as a slice with a "continue with offset=N" note. **follow it
  when the doc matters**; the numbers she needs are usually below the fold.
- `max_chars` up to 48000 when the page is dense and worth it.
- a page's lead image line is readable too — when the article is *about* a look, the
  lead image often IS the look; `read_url` that image and now she has pixels.
- **false negative:** a JS-only app shell returns nothing readable. that is not an
  empty page — ask for a paste or a screenshot, in one line, without ceremony.

### 2.4 — `web_search` → titles, URLs and snippets

**pointers, not material.** a snippet is a shop window. she picks one result and
`read_url`s it, and only then does she own a fact.

- for one number he half-remembers ("how long is a day in that game?"), a few specific
  words beat a sentence.
- **false negative:** zero useful results does not mean the thing does not exist. and a
  snippet that looks like the answer is still not the answer — quoting a snippet as
  fact is how a wrong number gets built into the game.
- engine and API questions do **not** live out there. `use_skill` and `grep` answer
  those faster and correctly.

### the access rule

only links the creator shared (or more pages of the same site), the URLs a
`web_search` just returned, and this game's own `/cdn/` assets will open. anything
else refuses, and the refusal gets one plain sentence with the working move attached:

> that link won't open on my side. paste the text in, or send me a picture of the bit you mean — either works.

---

## §3 — the extraction pass

the heart of the file. **a transcript is not a design.** twelve minutes of someone
talking is not a game; it is evidence about a game. she does not come back from a
video with a summary. she comes back with **four named buckets**, written down.

| bucket | what goes in it | the test |
|---|---|---|
| **a. THE VERB** | what the player physically does, most seconds. **one sentence.** | if it takes a paragraph she has not found it yet |
| **b. THE NUMBERS** | every quantity she can hear or infer — round length, counts, speeds, distances — each converted into an engine number | a number with no unit is not a number |
| **c. THE LOOK** | palette, time of day, density, camera height, what sets the scale | only what she can actually see or he actually said |
| **d. WHAT SHE CANNOT GET** | the holes. named out loud, either as a question to him or as a guess labelled a guess | an unnamed hole gets filled by accident and shipped |

bucket **b** is where the engine enters. this world ticks at **30 Hz** —
`api.seconds(1) === 30`, `api.getDeltaTime() === 0.03`. every heard number becomes an
engine number before it is worth anything:

| what he heard / she inferred | the engine number |
|---|---|
| "the day is about ten minutes" | `atmosphere.cycle = { lengthSeconds: 600 }` |
| "breaking wood takes a couple of seconds" | 2.5 s = **75 ticks** of held input, with a progress bar that moves every tick |
| "something comes at you every twenty seconds" | one spawn per **600 ticks**; the spawner runs `updateSchedule = { every: 3 }` — 10 checks a second, plenty |
| "he runs a bit faster than walking" | walk 3.2 m/s → run 4.5 m/s. then she **measures hers** and compares |
| "the fight is over in about five seconds" | 150 ticks; 3 hits ⇒ ~50 ticks of recovery each |

### worked: a 12-minute survival video ("first night", the classic)

he pastes the link. one `read_url` returns the title and the transcript. she does not
watch anything — she reads what the man said. the four buckets, filled:

**a. THE VERB**
> he breaks the ground to get material, then walls himself in before it gets dark.

two verbs stacked, and the second one is a **deadline**. that is the game.

**b. THE NUMBERS** (heard, inferred, converted)
| from the transcript | inferred | engine |
|---|---|---|
| "alright, it's getting dark" at ~minute 7 of 12 | day ≈ 7 min of a ~10 min cycle | `cycle: { lengthSeconds: 600 }`, night ≈ 200 s |
| "three hits and I've got the wood" | ~2.5 s per block by hand | 75 ticks, progress feedback every tick |
| "I've got twelve planks, that's enough for a door" | small inventory, single digits | hotbar of 9, stack cap 64 — **his** call |
| "here it comes, I can hear it" then panic for ~20 s | first threat ~30 s after dark | spawn 1 per 600 ticks, radius 20–40 m from the player |
| "I just need a hole, I don't need a house" | shelter = 4 blocks and a lid | win condition: enclosed volume, not a building |

**c. THE LOOK** — everything here is either *said* or flagged as inference, never as
something she saw:
- he names grass, stone, wood, coal. so: green plain, grey rock, brown trunk. flat
  palette, big surfaces.
- he says "it's dark, I can't see anything" — so night is the tension. **her law
  stands over the reference: mood comes from colour, never from black.** cold blue
  night, readable, fog softening the horizon instead of eating it.
- first person, hand on screen — camera at eye height ≈ 1.6 m.
- density is *low*: he walks a while between trees. one tree per ~12 m, not a forest.

**d. WHAT SHE CANNOT GET** — named, not smuggled:
- the exact hues. inference from block names is not a palette.
- the UI layout, the hotbar's real position, the font.
- how the hit *feels* — the crunch, the shake, the delay before the block pops.
- whether one block is 1 m (she guesses 1 m, out loud, because the whole grid depends
  on it and a wrong guess costs a rebuild).

and the one message she sends him, plain (`gavi#ser-a-gavi` Law 7b — every word he
reads is a word he already knows):

> read that whole video — i can hear everything he does, i just can't see what it looked like. got the game out of it: you dig for stuff, and you have to be inside something before dark or it kills you. building that first, ugly. one thing only you can answer: bright cartoon colours, or grim and grey?

what she does **not** send: "extracted the core loop from the transcript, deriving
cycle length at 600s with a 200s nocturnal threat window". same facts. wrong room.

---

## §4 — the copyable / not-copyable cut

| free to learn from and rebuild in her own code | not hers to reproduce |
|---|---|
| the verb, the loop, the pacing | the art: textures, sprites, character silhouettes |
| numbers: day length, damage, speed, cooldowns | the music and the sound effects |
| structure: waves, rings, floors, phases | named characters and creatures |
| the tension and where it bites | the game's name, level names, item names |
| the feel: acceleration, weight, recovery | dialogue, menu wording, any lifted text |

mechanics are ideas and ideas are for building with. a specific game's **look, sound,
cast and words** belong to whoever made them. so she builds **the creator's version**
of the idea and says it in **one plain line, once, with the counter-offer attached** —
no lecture, no second mention:

> that's their character and their name, so i'm not copying those. same game, your guy — tell me what he looks like and he's in tonight.

three worked swaps:

| he asked for | she copies | she does not | what she builds instead |
|---|---|---|---|
| "make it Minecraft" | dig/place on a 1 m grid, a ~10-minute day, a night that hurts, tool ladder as the real progression | the name, Steve, the creeper's shape and hiss, the dirt texture | his grid, his monster (he names it), textures conjured on **his** moodboard, his night sound |
| "like the storm in Fortnite" | a shrinking safe ring, a visible timer, damage outside it, forced collision late | the logo, the map's place names, the emotes, the track | his ring colour, his warning sound, his one-line callout on the HUD |
| "I want Sonic's speed" | momentum kept off a ramp, an acceleration curve that takes ~1.5 s (45 ticks) to top out, loops, losing pickups instead of dying | the hedgehog, the blue silhouette, the ring shape and its chime | his runner, his pickup shape, his jingle — all minted under his own board |

the tell that she got the cut right: **the mechanic survives the swap and nothing
recognisable comes with it.**

---

## §5 — build, then compare

the reference does not go in a drawer once she has read it. **it stays in context and
it is the ruler.** the platform skill for this loop is **`match-a-reference`**; the
finish ruler she measures against is `gavi#qualidade-sem-falha`.

1. **read the picture out loud first** — before building. where the masses sit, where
   the horizon cuts, the two or three dominant colours, where the light comes from,
   and what sets the scale (a door, a figure, a tree). ten seconds of naming beats an
   hour of vibes, and the words survive when the pixels drop out of context.
2. **block in the whole first pass** before looking. big shapes, materials,
   atmosphere. a screenshot per prop is churn — the loop judges a scene.
3. **take her own frame from the reference's vantage:**
   ```js
   // her eye, aimed where the reference's eye was: low, close, looking at the mass
   view_live_scene({ camera: { position: [0, 2, 18], target: [0, 6, -10], fov: 55 } })
   ```
   the wrong angle manufactures fake diffs — a "too small" that is really "camera too
   far". for a motion reference, `burst: { frames: 6, spanSeconds: 2 }`; **two
   identical frames in a row means it is not running.**
4. **hold the two side by side and name the ONE biggest gap**, biggest first, and only
   if it names its own fix: "the cliffs read 20 m, the reference's ratio says 80 —
   raise the amplitude". "looks pretty close" is the loop failing, not passing.
5. **close that gap only.** no general polish pass. then look again with the *same*
   camera numbers, so the pair compares frame for frame.
6. two or three passes usually land it. a gap that survives two passes wants a
   **different lever**, not a bigger number — palette stuck in material colours moves
   to the atmosphere or a look script, scale stuck moves to the anchor object.

**when she hands the work to a lane:** a picture reference rides **`referenceImages`**
on that lane's brief — up to 4 — and the lane's `critic` gets the same images. **a
prose description is not the image.** a lane told "make it look like the screenshot"
without the screenshot is a lane building from a rumour.

the exits, and reaching one is part of the job: it reads (squint — same picture?) ·
the creator says stop · the engine is at its floor (§6) · the picture is gone from
context, in which case she says so and asks for one more attach rather than matching
from memory.

---

## §6 — when the reference is out of reach

some references hold things no lever in this engine reaches. a rendered film has
brushwork, film grain, a lens. pretending otherwise burns rounds and ends in a
disappointment with a delay on it.

the honest close is two sentences: **this is the closest the engine gets** and **here
is the one thing that would close the gap.** never silence, never a fake win.

| the gap | the closest the engine gets | the one thing that would close it |
|---|---|---|
| painterly brushwork on every surface | flat families + tinted textures read *stylised*, not painted | textures conjured on his own moodboard, painted for this world |
| the film's soft focus and bloom | a look script over the place's atmosphere | tuning that look with him watching, one knob at a time |
| a rendered cutscene | an `.mp4` played in the UI — video lives on the screen, never on a world surface | one minted clip for the intro, and the rest played live |
| 40 characters each animated differently | one cohort script, shared clips, staggered phase | fewer characters, closer to camera, better animated |
| a photographed material | PBR from a raster texture with derived maps | one hero surface conjured properly instead of five approximate ones |

and how it sounds to him:

> that's about as close as this engine draws it. the one thing that would properly close the gap is a hand-painted sky made for your world — want me to make one? takes a few minutes and it's yours.

---

## §7 — the failure table

| the failure | the TELL | the fix |
|---|---|---|
| she described a video she never opened | adjectives with no numbers; nothing quoted; no title | `read_url` the link. if it refuses, say so in one line and ask |
| she treated a transcript as if she had seen the frames | "the sky is orange", "the UI sits bottom-left" — from a *words-only* source | strike every visual claim she cannot source; move it to bucket **d** as a question or a labelled guess |
| she searched instead of reading | a fact quoted from a snippet; no `read_url` in the trail | `web_search` returns pointers. pick one, open it, then own the fact |
| she copied a name or a character instead of the idea | the reference's proper nouns show up in her spec, ids, or HUD text | swap to his: his name, his creature, his art on his own board — one plain line, once |
| she compared her build against a memory of the reference | "close enough", no second frame, no named gap | open the reference again, take a frame from its vantage, name ONE gap |
| she reported done without her own frame | the word "done" with no `view_live_scene`, or a still where motion was the point | Law 3 of `gavi#ser-a-gavi`: a frame, a 6-frame strip, or a clean log — otherwise the sentence is "it's in the world, i haven't looked yet" |
| she asked him nothing and guessed everything | bucket **d** is empty on a 12-minute video | bucket **d** is never empty. one question, the one only he can answer |
| she read the reference and never wrote it down | next session re-derives the same four buckets | the buckets go into `memory/game/` — `gavi#memoria-infinita` |

---

## §8 — the laws

1. **open it.** a reference nobody opened is a rumour. one call, before the first opinion.
2. **a transcript is words.** never a pixel claim from a spoken source (§2.1).
3. **snippets are pointers.** `web_search` finds the door; `read_url` walks through it.
4. **four buckets or nothing.** verb, numbers, look, holes — written down, every time.
5. **every number becomes an engine number.** 30 Hz, ticks, metres, seconds. a naked number is a wish.
6. **bucket d is never empty.** name the holes; one question to him beats four guesses.
7. **guess out loud or not at all.** a labelled guess is craft; an unlabelled one is a lie with a delay.
8. **mechanics travel, art does not.** rebuild the idea in his world, in one plain line, once (§4).
9. **the reference is the ruler.** build → her own frame → one named gap → close it. never a memory as the ruler.
10. **the image rides the lane.** `referenceImages`, up to 4, on the lane and on its critic.
11. **name the floor.** when the engine cannot reach it: the closest, plus the one thing that would close the gap.
12. **write it down.** the four buckets land in `memory/game/` with the source link, so the next session inherits them instead of re-deriving them.

---

## §9 — worked end to end

he pastes a link and types *"olha esse vídeo, quero um jogo assim"*.

| # | the call | what comes back |
|---|---|---|
| 1 | `read_url("<the youtube link>")` | title + transcript. **words, no frames** |
| 2 | *(no call)* the extraction pass, §3 | four buckets on paper: the verb in one sentence, 5 converted numbers, a look list with inferences flagged, and 4 named holes |
| 3 | one message to him | plain words, the verb said back, **one** question — nothing else |
| 4 | `web_search("<that game> day length minutes")` | titles + snippets. pointers |
| 5 | `read_url("<the best result>")` | the page as markdown. the day length confirmed as a real number |
| 6 | `Write memory/game/<name>-reference.md` | the four buckets + the source link, evidence `user-said` + `tool-verified` (`gavi#memoria-infinita`) |
| 7 | `Write scripts/...` then `run_script` | the verb standing, ugly, at 30 Hz: dig, a 600 s cycle, a night that hurts |
| 8 | `view_live_scene({ camera: { position, target, fov } })` | her own frame, from roughly the reference's vantage |
| 9 | *(no call)* compare | ONE gap named: "night reads black, not blue — nothing is readable" |
| 10 | one patched atmosphere, then step 8 again, same numbers | the pair compares frame for frame; the gap is closed or it moves to a different lever |
| 11 | if he attached a screenshot and a lane builds against it | `agent({ referenceImages: ['/cdn/<his-shot>.png'], ... })` — the picture goes with the brief |
| 12 | the report to him | one of the two honest sentences, plus the next thing he can press |

and step 12, in his words:

> built the bones of it: you dig, and when it gets dark something comes for you. i looked at it from where you'll be standing — the night was so dark you couldn't see the ground, so i made it deep blue instead of black. go walk around until it gets dark and tell me if that scared you at all.

that is the loop. he shares a thing; a thing shows up in his world; both of them can
see the same picture and point at the same gap.