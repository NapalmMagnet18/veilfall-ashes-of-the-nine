// Awakening: the creator's guide, a god-mode tab (320 px column; ctx may be null on the first render).
// Plain words only: what each piece does, whether THIS world has it, and the sentence to say to Savi.
// It reads the world and writes nothing, so it is right in any game the mod is installed in.
// Each row: [icon, name, what it does, ask Savi, status(ctx info) → true | false | null (unknown: no pill)]
const GROUPS = [
  ['Sky & light', [
    ['☀️', 'Light', 'Realistic sun and shadow on every surface. Metal shines, rock stays matte, corners darken naturally.', 'turn on Awakening lighting', (i) => i.lighting],
    ['🎞️', 'Film look', 'Sharpening, soft contact shadows, sun-lit mist in low ground and a gentle colour grade.', 'more mist in the valley · less vignette', (i) => i.look],
    ['☁️', 'Clouds', 'Real 3D clouds with silver edges and dark bellies. Their shadows drift across the land.', 'make it overcast · fewer clouds', (i) => i.look],
  ]],
  ['Land', [
    ['🟫', 'Ground textures', 'Sharp 2K ground: grass, dry grass, forest floor, gravel, granite, snow. No visible tiling.', 'add a mud texture', null],
    ['⛰️', 'Mountains', 'Ranges carved by simulated rivers: gullies, ridges, snow in the couloirs. Your mountains stay yours; nothing shrinks them without asking.', 'carve mountains around my valley', null],
    ['🪨', 'Rock', 'Close-up granite detail layered onto rock models.', 'use Awakening rock on my cliffs', null],
  ]],
  ['Plants', [
    ['🌾', 'Grass', 'Wind-blown blades that thin with distance and on slower devices.', 'drier grass · denser meadow', null],
    ['🌲', 'Forest', 'Whole forests from rules: species in clumps, glades, understory, trails worn through.', 'replant the forest thicker', null],
    ['🍂', 'Forest floor', 'Moss, twigs, cones and tufts scattered in clusters under the trees.', 'more moss under the pines', null],
  ]],
  ['Water', [
    ['💧', 'Lakes', 'Real depth colour, reflections, refraction, sun glints and caustics. Far water goes calm and glassy, never grainy.', 'add a lake here · make the water clearer', (i) => i.lake],
    ['🏞️', 'Rivers & creeks', 'Moving water on the same surface as the lake: current, whitewater at drops, boulders that split the flow.', 'run a creek from that hill into the lake', (i) => i.river],
    ['🔀', 'Where waters meet', 'A river hands over to a lake (or a creek to a river) with no seam: its current spreads out into the calmer water.', 'blend the creek into the lake', (i) => (i.river && i.lake) || null],
    ['🌊', 'Waterfalls', 'A layered 3D curtain that tears white as it falls, ropes of water peeling off, and a heap of froth churning into the pool at its foot.', 'add a waterfall off that cliff', (i) => i.waterfall ?? null],
    ['〰️', 'Ripples & wakes', 'Wading and swimming leave trails, rocks leave wakes in the current, things that fall in splash, boats leave wakes.', 'make splashes quieter', (i) => i.lake || i.river || null],
    ['🏖️', 'Shoreline', 'Soft foam where water laps, damp dark sand the waves just left.', 'less foam on the edge', (i) => i.lake],
    ['🛶', 'Boats', 'Boats ride the same waves you see. No water shows inside the hull.', 'add a rowboat', null],
  ]],
  ['Weather', [
    ['🌬️', 'Squalls', 'Optional. A squall crosses the water every few minutes: waves build, whitecaps break. A separate switch decides if it may push boats and players.', 'turn squalls on · don’t let weather push players', null],
    ['⛈️', 'Storms', 'Optional. Squalls arrive as thunderstorms: dark clouds, rain, wet ground, lightning on the ridges, thunder after.', 'turn storms on · storms less often', (i) => i.storm],
  ]],
]
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
function info(ctx) {
  const w = ctx?.world
  if (!w) return {}
  const places = Object.values(w.places ?? {})
  const has = (s) => String(s ?? '').includes('awakening')
  const marks = places.flatMap((p) => Object.values(p?.terrain?.marks ?? {}))
  const looks = places.map((p) => p?.atmosphere?.look).filter((l) => has(l?.script))
  const weather = places.map((p) => p?.state?.weather).find(Boolean)
  return {
    lighting: has(w.lighting),
    look: looks.length > 0,
    storm: looks.some((l) => Number(l?.params?.storm) > 0),
    lake: marks.some((m) => m?.kind === 'lake' && has(JSON.stringify(m.liquid ?? ''))) || null,
    river: marks.some((m) => m?.kind === 'river') || null,
    weather,
  }
}
const pill = (v) => v === true
  ? '<span class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">In use</span>'
  : v === false ? '<span class="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/45 ring-1 ring-white/10">Off</span>' : ''

export default function panel(ctx) {
  const i = info(ctx)
  const all = GROUPS.flatMap(([, rows]) => rows)
  const inUse = all.filter((r) => r[4]?.(i) === true).length
  const section = ([title, rows]) => `
    <div class="mt-4 mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/60">${title}</div>
    <div class="rounded-xl bg-white/[0.04] ring-1 ring-white/10 divide-y divide-white/[0.06] overflow-hidden">
      ${rows.map(([icon, name, what, ask, st]) => `
      <details class="group">
        <summary class="list-none cursor-pointer select-none flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.05] transition-colors">
          <span class="w-7 h-7 shrink-0 grid place-items-center rounded-lg bg-amber-300/10 text-[15px]">${icon}</span>
          <span class="flex-1 text-[13px] font-medium text-white/90">${name}</span>
          ${pill(st ? st(i) : null)}
          <span class="text-white/30 text-[11px] transition-transform group-open:rotate-90">›</span>
        </summary>
        <div class="px-3 pb-3 pl-[52px] text-[12px] leading-relaxed text-white/65">
          ${what}
          <div class="mt-2 rounded-lg bg-black/25 ring-1 ring-white/5 px-2.5 py-1.5">
            <div class="text-[9.5px] uppercase tracking-wider text-white/35">Say to Savi</div>
            <div class="text-[12px] text-amber-100/90">“${esc(ask)}”</div>
          </div>
        </div>
      </details>`).join('')}
    </div>`
  return `<div class="w-full px-3 pt-3 pb-4 text-white" style="font-family:ui-sans-serif,system-ui,sans-serif">
    <div class="rounded-2xl p-3.5 ring-1 ring-amber-300/20" style="background:linear-gradient(135deg,rgba(217,130,43,.28),rgba(61,34,20,.35))">
      <div class="flex items-center gap-2">
        <span class="text-xl">🌅</span>
        <div class="flex-1">
          <div class="text-[15px] font-bold text-amber-100 leading-tight">Awakening</div>
          <div class="text-[11px] text-white/60">High-fidelity look for 3D worlds</div>
        </div>
        ${ctx ? `<div class="text-right"><div class="text-[18px] font-bold text-amber-200 leading-none">${inUse}</div><div class="text-[9.5px] text-white/50">in use here</div></div>` : ''}
      </div>
      <div class="mt-2.5 text-[11.5px] leading-snug text-white/75">Every piece is optional. Open one to see what it does, then say the line to Savi in chat. She wires it and tunes it to your world.</div>
      ${i.weather ? `<div class="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] text-white/80">🌦️ Weather now: <b class="text-white">${esc(i.weather)}</b></div>` : ''}
    </div>
    ${GROUPS.map(section).join('')}
    <div class="mt-4 rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-3 text-[11px] leading-relaxed text-white/55">
      <div class="font-semibold text-white/75 mb-0.5">🖥️ Slower machines</div>
      Grass thins, clouds become a painted layer, water drops caustics and reflections. Resolution is never lowered to keep up.
    </div>
    <div class="mt-2 px-1 text-[10.5px] text-white/35">Anything Savi changes is one version: “undo that” puts it back.</div>
  </div>`
}
