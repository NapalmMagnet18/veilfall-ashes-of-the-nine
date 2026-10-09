// Awakening water sheet: the flat surface of one body of water, built from its footprint.
// params: rle ("row:a-b,c-d;row:…" cell runs), cell (m), ox, oz (the grid's first cell, local to the feet).
// The footprint is the basin flooded from the lake's centre at its level, a couple of cells past the shore
// so the terrain itself cuts the edge. y = 0 is the water level; the swell lifts it by a few cm.
export function geometry(ctx) {
  const p = ctx.params ?? {}, C = Number(p.cell ?? 2), ox = Number(p.ox ?? 0), oz = Number(p.oz ?? 0);
  for (const row of String(p.rle ?? "").split(";")) {
    if (!row) continue;
    const [j, runs] = row.split(":");
    const z0 = oz + Number(j) * C - C / 2, z1 = z0 + C;
    for (const r of runs.split(",")) {
      const [a, b] = r.split("-").map(Number);
      // near: one quad per cell, so the swell (mods/awakening/swell.js) can move the vertices; far: one per run
      const step = (ctx.lod ?? 1) <= 2 ? 1 : b - a + 1;
      for (let c = a; c <= b; c += step) {
        const x0 = ox + c * C - C / 2, x1 = ox + Math.min(b, c + step - 1) * C + C / 2;
        ctx.quad(x0, 0, z0, x0, 0, z1, x1, 0, z1, x1, 0, z0);
      }
    }
  }
}
