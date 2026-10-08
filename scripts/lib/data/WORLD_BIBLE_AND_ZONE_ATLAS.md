# VEILFALL — World bible, atlas and scene construction book

## Original universe rules

**World:** Eredh, a realm in which memories of unrealized possibilities accumulate in a metaphysical Deep Archive.

**The Veil:** a boundary built nine hundred years ago by nine mortal Witnesses during the First Unraveling. It prevents the possible and the living from overwriting one another.

**The Tithe of Names:** an enforced winter ritual that steals finite personal memories to maintain the Veil. It becomes the moral conflict of the series, and is not portrayed as harmless.

**The Nine Ash Oaths:** distributed anchor rites set by the Nine. Their broken ashes call to one another and charge the Quiet Crown. The Oaths are neither soulstones nor divine artifacts.

**The Deep Archive:** a place made of paths not taken, impossible reflections and severed histories. The physical maps of Eredh become unstable when it breaches.

**The Hollow Choir (Mercy):** a mass of denied grief attempting to impose a single painless history on everyone. It is not an infernal god; it is an emergent consequence of an oppressive memory system.

**Political groups:** the charitable but authoritarian Curators; local Memory-Keepers; the neutral Wayfinder Guild; the Remittance Guard; the volunteer Open Lattice network.

**Key cast:** Maelin Sore (mapmaker); Tarven (gravesmith); Veska Rell (repentant Curator); Nera Vale (Curator’s daughter and dissenter); Serath Vale (primary human antagonist); Ilyra Venn (surviving Witness); Els (Ashwake mother); Mother Sile (transformed Witness).

## Ancestries and relationship to classes
All four ancestries may choose all six classes. Their cultures differ but share mortality and full player agency. The racial trait is deliberately minor (<3% sustained combat value). Class identity is mechanical; ancestry identity is narrative and cosmetic.

### Cinderkin — Ashwake Moor
- Settlement: **Ashwake**. Community: Families inscribe the names of their lost into coal-fired clay.
- Crisis: Your family hearth speaks a name outlawed by the Archive.
- Trait: Once each minute, regain a small shield after taking fire or ember damage.
- Origin elder: Els of the North Lane; final tutorial boss: Ashborn Strider.
- Art: materials and iconography must be visually distinctive, not just palette swaps. Build one architecture kit per culture.

### Fenborn — Gloamfen Reach
- Settlement: **Mirelight**. Community: Fenspeople cultivate reed tablets that preserve a memory until rainfall.
- Crisis: The wetland reflects a settlement that drowned before it existed.
- Trait: Brief movement-speed gain after passing through slow terrain.
- Origin elder: Reeve Ossa; final tutorial boss: Mirror Heron.
- Art: materials and iconography must be visually distinctive, not just palette swaps. Build one architecture kit per culture.

### Stonebound — Underhollow Steps
- Settlement: **Karn Hollow**. Community: Mountain communities carve genealogies into staircases, never individual statues.
- Crisis: The ancestral steps are speaking a family name that has not been carved.
- Trait: A short stagger-resistance buff after being hit by an elite enemy.
- Origin elder: Elder Marr; final tutorial boss: Chisel Wight.
- Art: materials and iconography must be visually distinctive, not just palette swaps. Build one architecture kit per culture.

### Skyforged — Gale Spires
- Settlement: **Aerie of Brant**. Community: Cliff dwellers tell histories in wind instruments played only at funerals.
- Crisis: A wind-chime repeats a melody that nobody living has composed.
- Trait: A small resource restoration after a successful dodge.
- Origin elder: Chanter Senn; final tutorial boss: Hushed Roc.
- Art: materials and iconography must be visually distinctive, not just palette swaps. Build one architecture kit per culture.


## Main story geographic progression

| ID | Act | Region / Place | Levels | Hub | Landmark / Dungeon | Boss |
| --- | --- | --- | --- | --- | --- | --- |
| Z01 | 1 | Broken Lantern Road | 6-10 | The Wayside Fire | The Candle Procession | Bailiff of the Dripping Gate |
| Z02 | 1 | Abbey of Ash | 10-14 | Old Ash Cloister | Waxlit Catacombs | Saint of Wax |
| Z03 | 2 | Saltwound Strand | 14-18 | Cliffhaven | Shipwreck Causeway | Mirror Captain |
| Z04 | 2 | Dry Harbor & Salt Crypts | 18-23 | Undertide Refuge | Cistern of Regret | Lord Kareth |
| Z05 | 3 | Thornvein Fringe | 23-27 | Reedwatch Camp | The Letter Grove | Griefwood Hart |
| Z06 | 3 | Root Cathedral | 27-32 | Heartwood Shelter | The Root Heart | The Hundred-Faced Bloom |
| Z07 | 4 | Marrowgate Lower Wards | 32-37 | Sable Square | Counting House | The Remittance Judge |
| Z08 | 4 | The Nine Vaults | 37-41 | Veska’s Refuge | Hall of Remittance | High Curator Serath |
| Z09 | 5 | Ember Observatory | 41-45 | The Last Watch | Lantern Spire | Astral Custodian |
| Z10 | 5 | Deep Archive | 45-50 | The Remaining Bridge | Throne of Unchosen Days | Mercy, the Hollow Choir |


### Z01: Broken Lantern Road — Lv 6-10
**Look:** Ruined pilgrimage route / fog / wax. **Layout:** Road of candles pinned to broken milestones; a tollhouse with drifting wax figures. **Primary enemy family:** wax_pilgrim. **Boss:** Bailiff of the Dripping Gate.

**Map construction:** Spawn Place ID `place_z01`. Make one center hub `The Wayside Fire`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `The Candle Procession` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** Maelin finds an honest road erased from every map. The road was deliberately redirected toward the Abbey.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z02: Abbey of Ash — Lv 10-14
**Look:** Ruined cathedral / spiral descent / warm black smoke. **Layout:** A sanctuary overgrown with candles, bridges over a flooded crypt, reliquary below the nave. **Primary enemy family:** wax_saint. **Boss:** Saint of Wax.

**Map construction:** Spawn Place ID `place_z02`. Make one center hub `Old Ash Cloister`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `Waxlit Catacombs` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** The former Curator admits she carried illegal requests to forget. The Nine were mortal survivors, not divine beings.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z03: Saltwound Strand — Lv 14-18
**Look:** Salt plain / wrecked ships / white wind. **Layout:** Dry seabed of tilted hulks and salt shelves, tide-mirrors embedded in rock. **Primary enemy family:** saltbound. **Boss:** Mirror Captain.

**Map construction:** Spawn Place ID `place_z03`. Make one center hub `Cliffhaven`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `Shipwreck Causeway` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** Rusk denies that the drowned can cross dry land. The harbor master chooses to tell the truth about his past.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z04: Dry Harbor & Salt Crypts — Lv 18-23
**Look:** Subterranean tidal engine / cisterns / echoes. **Layout:** Four tidal valves, alternate high- and low-water paths, central boss cistern. **Primary enemy family:** drowned_memory. **Boss:** Lord Kareth.

**Map construction:** Spawn Place ID `place_z04`. Make one center hub `Undertide Refuge`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `Cistern of Regret` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** Nera questions her father’s attempt to end suffering. Kareth weaponizes remorse to immobilize his enemies.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z05: Thornvein Fringe — Lv 23-27
**Look:** Blood-colored forest / whisper vines / rain. **Layout:** Twisting woodland trails with looped shortcuts and memory-draining brambles. **Primary enemy family:** letter_wight. **Boss:** Griefwood Hart.

**Map construction:** Spawn Place ID `place_z05`. Make one center hub `Reedwatch Camp`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `The Letter Grove` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** The forest has fed on unspoken regret for centuries. A false remembrance is emotionally convincing but destructive.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z06: Root Cathedral — Lv 27-32
**Look:** Colossal roots / living chapel / vertical trunk bridges. **Layout:** Suspended walkways around a hollow trunk, mirrored dream alcoves, lower root chamber. **Primary enemy family:** root_echo. **Boss:** The Hundred-Faced Bloom.

**Map construction:** Spawn Place ID `place_z06`. Make one center hub `Heartwood Shelter`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `The Root Heart` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** The Witness tells a story the Archive suppressed. Personal identity is made by imperfect choices.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z07: Marrowgate Lower Wards — Lv 32-37
**Look:** Gothic industrial city / broken clocks / black canals. **Layout:** Three district loops with watch patrols, relief stations and a hidden archive entrance. **Primary enemy family:** ledger_guard. **Boss:** The Remittance Judge.

**Map construction:** Spawn Place ID `place_z07`. Make one center hub `Sable Square`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `Counting House` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** Charity can be made into an instrument of control. The party protects ordinary people who believe in the Archive.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z08: The Nine Vaults — Lv 37-41
**Look:** Archive labyrinth / numbered seals / black libraries. **Layout:** Hexagonal archive wing, mirrored book stacks, stairwell escape route. **Primary enemy family:** blank_warden. **Boss:** High Curator Serath.

**Map construction:** Spawn Place ID `place_z08`. Make one center hub `Veska’s Refuge`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `Hall of Remittance` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** The archive’s architecture enforces selective memory. His argument is compelling enough to attract followers.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z09: Ember Observatory — Lv 41-45
**Look:** Cliff observatory / fallen instruments / starlight. **Layout:** Terraced platforms at different heights, star-dial bridges, gateway to the Archive. **Primary enemy family:** starless. **Boss:** Astral Custodian.

**Map construction:** Spawn Place ID `place_z09`. Make one center hub `The Last Watch`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `Lantern Spire` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** The youngest Witness survives within a closed time-loop. Civilian evacuation has a visible effect on the finale.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

### Z10: Deep Archive — Lv 45-50
**Look:** Impossible library / floating pages / fragmented skies. **Layout:** Three branching galleries reconnect at a final arena; optional choice chambers. **Primary enemy family:** echo_form. **Boss:** Mercy, the Hollow Choir.

**Map construction:** Spawn Place ID `place_z10`. Make one center hub `The Remaining Bridge`, two small safe altars, six quest POIs, three shortcuts, one named dungeon `Throne of Unchosen Days` and a controlled boss arena. Use blockouts before detail; color-code exits, place readable terrain and collision.

**Travel entrances:** Previous story region connects by marked gate/bridge/portal; avoid dead-end portals, ensure town return always works.

**Environmental narrative:** The player sees other possible versions of their own journey. The protagonist earns identity through choices, not destiny.

**Encounter ladder:** weak patrol → terrain/interaction challenge → elite with new telegraph → optional event → dungeon checkpoint → signature boss. **Boss phases:** 100–70% teaches attack; 70–35% adds zone hazard; 35–0% combines patterns but leaves recovery windows.

## Map design rules and tile library
- Base blockout units: 1 meter = 1 world unit until Spawn engine reference confirms scene scaling. Walkable lane width 4–6 units for party dodges; boss arenas ~35×35 units; safe hubs ~70×70; connectors keep 2 exits and at least one line-of-sight break. These are starting design targets, not engine limitations.
- Navigation: 8-way mouse pathfinding; click must stop at target or closest reachable node; movement cannot cut through closed doors or cliff meshes; stairs and elevators use transition ramps or validated links.
- Scene packaging: each Place has `hub`, `field`, `dungeon`, `boss` layers; dungeon instance uses a stable seed; persist only approved world flags.
- Shortcuts: unlock only after initial route, then persist the flag; tests must assert no broken quest prerequisites.
- Dynamic layout: stage one uses authored tile chains; stage three adds seeded optional wings with fixed objective sockets.
- Lighting: embers for safety, cyan for spirit anomalies, violet for optional relic clues, red for direct danger; accessible non-color cues accompany all effects.
- Readability: attacks use shapes and anticipation, never gore density; terrain contrast must separate clickable loot from decoration.
- Audio: rustle and footsteps narrow toward secrets, avoid constant loud jump sounds; boss motifs share a three-note memory leitmotif.

## Region to act and boss lore map
- Act I: identify the Tithe’s harm; a false saint monetizes memory loss.
- Act II: forgotten guilt produces a literal false sea; accountability is the first cure.
- Act III: surviving Witness reveals the bargain’s origin; refusing a desirable false world costs the player emotionally.
- Act IV: expose Serath’s paternalistic logic, his wife’s fate and the trap beneath the broken Oaths.
- Act V: enter the Deep Archive, reject a world with compulsory certainty, choose an ending.

## Expansion seeds without altering the completed ending
1. **The Shardlands:** distant regions become accessible as voluntary memory networks link them; distinct civic disputes form the expansion antagonists.
2. **The Bone Rain:** an old Witness’s experimental protocol falls as crystalline weather, affecting map geometry.
3. **Children of the Silent Hour:** reformist Curators and revanchists contest the new public archive.
4. **Drowned Cartography:** the Saltwound sea begins to refill, revealing seafloor ruins, underwater passages and navigation.
