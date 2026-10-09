// Awakening shore band: a thin skin draped a few cm over the ground where a lake meets its bank, built from
// sampled heights. Worn with mods/awakening/wet-sand.js it darkens the sand the water just left.
// params: g ("row:i0:hh…;" vertex runs, heights base36 cm above the feet, two chars each), cell (m), ox, oz,
// lift (m above the sampled ground)
export function geometry(ctx) {
  const p = ctx.params ?? {}, C = Number(p.cell ?? 0.5), ox = Number(p.ox ?? 0), oz = Number(p.oz ?? 0), lift = Number(p.lift ?? 0.03);
  if ((ctx.lod ?? 1) >= 4) return; // a few cm of damp sand is nothing from afar
  const rows = new Map();
  for (const r of String(p.g ?? "").split(";")) {
    if (!r) continue;
    const [j, i0, hs] = r.split(":"); const m = rows.get(+j) ?? new Map();
    for (let k = 0; k * 2 < hs.length; k++) m.set(+i0 + k, parseInt(hs.substr(k * 2, 2), 36) / 100 + lift);
    rows.set(+j, m);
  }
  for (const [j, a] of rows) {
    const b = rows.get(j + 1); if (!b) continue;
    for (const [i, h00] of a) {
      const h10 = a.get(i + 1), h01 = b.get(i), h11 = b.get(i + 1);
      if (h10 === undefined || h01 === undefined || h11 === undefined) continue;
      const x0 = ox + i * C, x1 = x0 + C, z0 = oz + j * C, z1 = z0 + C;
      ctx.quad(x0, h00, z0, x0, h01, z1, x1, h11, z1, x1, h10, z0);
    }
  }
}
