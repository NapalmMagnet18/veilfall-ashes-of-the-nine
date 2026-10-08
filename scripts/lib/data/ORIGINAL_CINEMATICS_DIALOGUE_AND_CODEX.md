# VEILFALL — Cinematic Scenes, NPC Dialogue, Memory Codex
## Original voiced-script draft with gameplay triggers

**Production note:** These scenes are written to be staged or recorded and remain part of the original Veilfall universe. The principal playable character is `{player_name}`; voice lines addressing them use “Bearer” where recording multiple forms would otherwise be required. Region quest JSON defines objectives. These scenes provide authored dramatic dialogue to supplement the quest objective templates; do not use generated quest-offer placeholder text verbatim for a released game.

## CIN-00: The Bell Beneath Marrowgate (prologue, 90-second cinematic)

**Image:** A clerk's gloved hands open a stone ledger in a room with no windows. A brass bell hangs upside down beneath the floor. A younger woman stands in the doorway. No music, only paper turning.

**NERA:** “Every book in this place is a person who no longer knows what they lost. You told me that was a kindness.”

**SERATH:** “I told you a world without grief would be kinder. I still believe it.”

**NERA:** “You don't have to open the Ninth Chamber to prove that.”

**SERATH:** “My proof has been buried in it for twelve years.”

He presses a glowing fragment into the empty socket. A page unfolds into black smoke.

**NERA:** “What was her name?”

Serath does not answer. The bell tolls under the city. Cut hard to the chosen origin's opening shot.

**Implementation:** Fade to ancestry start Place. Set `story_first_bell_seen=true`, idempotently. Allow replay in cinematics library; replay grants nothing.

## ORI-01A: Cinderkin opening — Ashwake

**Image:** A black snow of ash covers an unlit hearth. Els holds a coal tablet and rubs it clean, but the name appears again under her thumb.

**ELS:** “They took my son's memory in winter. The tablet is supposed to be blank now.”

**BEARER:** “What does it say?”

**ELS:** “Teren. Every time I read it, the fire remembers the shape of his hands. Every time I blink, I hear the Curators say there never was such a boy.”

A Remnant appears with a voice identical to Teren's.

**REMNANT:** “Mother. Let me in.”

**ELS:** “That's his voice.”

**BEARER:** “A voice is not a promise that the speaker is who we miss.”

**Gameplay:** Fight first Remnant; speaking the name or triggering the class basic skill makes the enemy vulnerable. Give an explicit objective hint independent of spoken audio.

## ORI-01B: Fenborn opening — Gloamfen

**Image:** Rain begins below the water and rises upward. Reeve Ossa stares into a pond reflecting an impossible drowned town.

**OSSA:** “Our children have learned to read the reeds before they learn the moon. Tonight the reeds say we all died a century ago.”

**BEARER:** “The houses in that reflection don't belong here.”

**OSSA:** “They belong to someone. Don't mistake that for belonging to us. Take the reed-script to the ferry. If the boat has a second shadow, do not board it.”

**Gameplay:** Teach interaction, reflection target selection, safe ferry gate.

## ORI-01C: Stonebound opening — Underhollow

**Image:** An ancestral staircase is missing its forty-seventh step. A hammer strikes metal in a cave beyond the stair.

**ELDER MARR:** “In Karn Hollow we remember by carving, not by asking permission. A name has appeared on a stone we haven't cut.”

**BEARER:** “Who carved it?”

**MARR:** “That's the trouble. Everyone remembers holding the chisel. Nobody remembers making the mark.”

**Gameplay:** Teach physical puzzle, stagger and guard, boss Chisel Wight.

## ORI-01D: Skyforged opening — Gale Spires

**Image:** Wind instruments along a cliff ring without wind. A rope bridge vibrates as if people are crossing, but it is empty.

**CHANTER SENN:** “The bell of the western city reaches us through stone, but this song has come through air. It has a fourth note no living singer taught.”

**BEARER:** “Then somebody was forgotten.”

**SENN:** “Or somebody has not yet lived. Either way, listen before you follow.”

**Gameplay:** Wind gust traversal, timing chimes, Hushed Roc boss.

## CIN-01: The Saint of Wax — confession before battle

**Image:** Hundreds of candles form a woman's outline. Figures kneel in hardened wax around her feet.

**SAINT:** “One child begged to forget hunger. A mother begged to forget the child she buried. A soldier begged to forget the blade he carried. Who among you has the right to deny them an hour of peace?”

**VESKA:** “They asked for a night. You took the rest of their lives.”

**SAINT:** “There is no grief in the life they have left.”

**MAELIN:** “And no one left to decide whether it was worth the price.”

**SAINT:** “You speak so loudly for those who begged me to make them silent.”

**BEARER:** “Then let them speak. Let them tell us if this is what they chose.”

**Gameplay:** Boss activates after spoken line; petitioners' floating names become a mechanical intervention. On victory, each restored name brightens one chapel window.

## CIN-02: A Harbor Master's Confession

**Image:** At the edge of a dry sea, the harbor bell is encrusted with salt. Rusk faces a crowd and a ledger whose pages blow without wind.

**RUSK:** “I thought forgetting would make me innocent. I signed the order. The boats went out after the storm warning. I have made an entire town carry a past I would not carry myself.”

**TOWNSPERSON:** “Are you asking us to forgive you?”

**RUSK:** “No. I'm asking you to help me find the names of those who never came back.”

**NERA:** “My father would say the truth only wounds you again.”

**MAELIN:** “Maybe. But a wound can be tended. What do you do with a wound no one admits is there?”

**Gameplay:** Unlock lighthouse memorial side quests; no automatic redemption or forgiveness animation.

## CIN-03: Mother Sile — history of the Nine

**Image:** Roots peel away to reveal nine ordinary figures sheltering others under a torn sky. No crowns, thrones or halos; they are frightened survivors.

**SILE:** “We found a sky that had forgotten how to end. Every possible war arrived at once. Every mourning family reached into a future where the dead still lived. We built a wall. For one night the wall held.”

**VESKA:** “And the Tithe?”

**SILE:** “It held for only one night. We needed another memory, then another. We told ourselves we were borrowing it. A hundred years later our children called the debt sacred.”

**BEARER:** “Did anyone ask the people who would pay it?”

**SILE:** “No. We were afraid that if they could refuse, some would. We made a prison and named it shelter.”

**Gameplay:** Three short playable first-person-history vignettes. Contradictory codex notes unlock, labeled eyewitness / institutional claim / uncertain.

## CIN-04: Nera and the Music Box

**Image:** A vault door opens. Nera hands Serath's old music box to the Bearer.

**NERA:** “The tune is hers. I know because he looks at the box as if it could apologize. I cannot remember her voice.”

**BEARER:** “Your father thinks he is saving you.”

**NERA:** “He thinks he can save what he lost by making everyone else lose the ability to notice.”

She winds the box; two notes are clear, and the third catches. Nera leaves it unfinished.

**NERA:** “When you see him, don't tell him I hate him. Tell him I remember being loved. That is enough for me to know what he is taking away.”

**Gameplay:** Music box becomes a nonconsumable quest key and codex entry. No tradable copy.

## CIN-05: Serath — the offer of certainty

**SERATH:** “I watched my wife fade. There was not a god to blame, nor a law to punish, only the unbearable fact that she was gone. I wanted one thing: that nobody else should endure the same.”

**TARVEN:** “And so you taught the world to lose its dead twice.”

**SERATH:** “I fed children who had no food. I kept lights burning when the roads closed. Your moral purity cannot cook a meal.”

**VESKA:** “Nor can a meal buy a person's right to remember.”

**SERATH:** “Would you refuse a mother who begged to forget her child?”

**BEARER:** “I would ask her again tomorrow. And the day after. I would let her change her mind.”

**SERATH:** “Then you've never learned how crushing tomorrow can be.”

**Gameplay:** Intro combat after final dialogue. Stage focuses on resisting coercive authority; end at a survival threshold, not Serath's death.

## CIN-06: The Bridge of Remaining — four companions

**MERCY:** “Tarven: one brother returned. Maelin: a map without mistakes. Veska: an innocence untouched by a signature. Nera: a mother's face to keep forever. I can give all four, if you allow me to choose the world they will inhabit.”

**TARVEN:** “I knew him. I don't know what this copy would lose to make him mine.”

**MAELIN:** “A map that cannot be wrong is a border around every road we haven't chosen.”

**VESKA:** “I won't make my guilt a reason to stop repairing what I helped destroy.”

**NERA:** “I want to remember her. I do not want everyone else made less for that wish.”

**MERCY:** “You choose hurt.”

**BEARER:** “We choose to be able to choose again.”

**Gameplay:** Four optional short interact prompts; players can inspect each offer and resume with a skip. Do not force four players to see different incompatible geometry at the same time.

## CIN-07: The Open Lattice — canonical finale

**ILYRA:** “The Veil can stand without a Tithe. But the world must be allowed to say no. If one person refuses their memory, we cannot take it anyway. We must accept a weaker wall built freely.”

**BEARER:** “A wall made of people who can walk away.”

**ILYRA:** “Yes. That is what makes it worth building.”

The Bearer reaches toward nine empty sockets. Maelin, Veska, Nera and Tarven do the same. Across Eredh, individuals choose whether to answer the bell.

**MERCY:** “They will suffer.”

**BEARER:** “Yes. They will also love. Neither belongs to you.”

**Gameplay:** All players receive a private ending cosmetic/codex entry. Persistent world phase advances to Open Lattice, opening Echo Breaches.

## The Remembrance Codex — eight sample entries

**CO-01 / The First Unraveling (Eyewitness):** “Where one road ended, twelve others rose. A man who never went to war came home with a wound from a battle that had not begun. The Nine found no door to close. So they made one.” — Ilyra Venn.

**CO-02 / The Tithe (Institutional):** “A small withholding from remembrance is the price of universal safety. The obligation is impartial because it falls upon all.” — Archive pamphlet, disputed.

**CO-03 / The Tithe (Counterrecord):** “The burden was not impartial. The hungry sold more memory; the wealthy purchased the right to keep theirs.” — Anonymous Counting House note.

**CO-04 / The Saltwound Ledger:** “Fifty-four embarked. Forty-nine names were remitted. The absence of five signatures indicates no fault in accounting; the fault is in the sea.” — Harbor office, prior to Rusk's confession.

**CO-05 / Ilyra's Lantern:** “I made myself a prisoner so I could someday be asked whether my invention was just. The centuries have been patient with me. I was not patient enough with them.” — Ilyra.

**CO-06 / Nera's Music Box:** A mechanism whose third note catches. Nera recalls the fact of love without an intact memory. The archive catalog calls this an error; she calls it a beginning.

**CO-07 / Mercy:** The Choir is neither a god nor an invader. It is the emergent will of all feeling denied a home. Its answers sound reasonable because people made it from their most reasonable requests.

**CO-08 / The Open Lattice:** “An open door is not proof of safety. It is proof that leaving and returning remain possible.” — New public remembrance charter, first winter after the Veilfall.

## Narrative implementation and localization notes
- All voiced scenes have an unvoiced subtitle path and a fast-forward route.
- The Bearer's pronouns and any ancestry/class reference are injected from localized tokens, never concatenated hardcoded English.
- Characters may disagree; codex sources visibly differentiate disputed and verified accounts.
- No dialogue scene that creates a reward may be replayed to duplicate items.
- Avoid claiming that the game's imaginary institutions or grief mechanics represent scientific mental-health facts.
