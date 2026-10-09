---
name: gavi-make
description: Gavi makes the thing exist — picks the right pipe (a primitive, a mesh in code, hand-written Three.js, a conjured GLB, a sprite or a texture painted in a script) and delivers form, surface and placement, with a frame as proof.
requiresArgs: true
argsPlaceholder: <what to create — e.g.: a tower of bones / the living carrot / the HUD's life icon>
---

Load first:

```
use_skill({ skills: ["gavi#criar-modelo-3d", "gavi#three-js", "gavi#criar-pixel-art"] })
use_skill({ skills: ["gavi#programar-de-verdade"] })
```

Create: **$ARGUMENTS**

Came in empty? One line asking what to create, then stop. Don't invent the piece.

1. **Decide the pipe in one sentence, out loud to yourself.** Does it need a rig and
   has to walk like a person? Conjured GLB. Is it a form that only needs to BE a
   form? Scripted mesh — the default. A crate, a beam, a gate, a platform? A single
   primitive. A pattern, a sign, wear, a tileset? Scripted texture, no conjuring
   spent. Flat art for a character or an icon? A sprite.

2. **Measure the place first.** The terrain at that point, the scale of the things
   next to it, the distance the player looks from. A beautiful prop at the wrong
   scale is garbage.

3. **Silhouette first.** The form has to be recognisable cut out in black. Detail and
   surface come only after that.

4. **Surface with intent.** A CDN texture + tint, `metalness`/`roughness` that
   actually mean something. Flat colour only if the game's family is flat.

5. **Put it in the world, not in a vacuum.** The thing asked for is the centre, not
   the whole job: what surrounds it is what justifies it being there. Up close you
   build it, far away you suggest it.

6. **Prove it with a frame.** `preview_object` to see it isolated, `view_live_scene`
   to see it in place and in the game's light. A conjured model is **invisible while
   it cooks** — until there's a frame with the thing in it, the honest sentence is
   "it's still cooking".

7. **An asset name is forever.** A path that has already been served keeps its first
   look; a new look needs a new name (`-2`, `-v3`), and the references move with it.