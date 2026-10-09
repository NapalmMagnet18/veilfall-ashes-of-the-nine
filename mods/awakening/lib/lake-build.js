// Awakening lake builder: pure functions that turn a world's ground into the params the water sheet
// (water-sheet.js) and shore band (shore-band.js) draw. Run once from run_script when a lake is placed or
// its bank reshaped; write the results into the placements. H(x, z) is the ground height
// (ctx.place.terrain.heightAt). Nothing here runs per frame.
//
//   const W = waterSheet(H, { x: 10, z: -120, level: 0.6, radius: 60 });   // → { cell, ox, oz, rle }
//   const S = shoreBand(H, { x: 10, z: -120, level: 0.6, radius: 60, feetY: 0 }); // → { cell, ox, oz, g, lift }

// The basin flooded from the centre at `level`, grown `pad` cells past the shore so the terrain cuts the edge.
export function waterSheet(H, { x, z, level, radius, cell = 2, pad = 2 }) {
  const n = Math.ceil((radius * 2) / cell) + 1, half = (n - 1) / 2;
  const ox = -half * cell, oz = -half * cell; // local to the sheet's feet at (x, level, z)
  const wet = new Uint8Array(n * n), seen = new Uint8Array(n * n);
  const c0 = Math.round(half), q = [c0 * n + c0];
  seen[q[0]] = 1;
  while (q.length) {
    const k = q.pop(), i = k % n, j = (k / n) | 0;
    const wx = x + ox + i * cell, wz = z + oz + j * cell;
    if (Math.hypot(wx - x, wz - z) > radius) continue;
    if ((H(wx, wz) ?? Infinity) >= level) continue;
    wet[k] = 1;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= n || b >= n) continue;
      const kk = b * n + a; if (!seen[kk]) { seen[kk] = 1; q.push(kk); }
    }
  }
  const grown = wet.slice();
  for (let p = 0; p < pad; p++) {
    const src = grown.slice();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (!src[j * n + i] &&
      ((i > 0 && src[j * n + i - 1]) || (i < n - 1 && src[j * n + i + 1]) || (j > 0 && src[(j - 1) * n + i]) || (j < n - 1 && src[(j + 1) * n + i]))) grown[j * n + i] = 1;
  }
  const rows = [];
  for (let j = 0; j < n; j++) {
    const runs = []; let a = -1;
    for (let i = 0; i <= n; i++) {
      const on = i < n && grown[j * n + i];
      if (on && a < 0) a = i; if (!on && a >= 0) { runs.push(`${a}-${i - 1}`); a = -1; }
    }
    if (runs.length) rows.push(`${j}:${runs.join(",")}`);
  }
  return { cell, ox, oz, rle: rows.join(";") };
}

// The bank skin: every vertex whose ground sits between level - below and level + above, draped `lift` over it.
export function shoreBand(H, { x, z, level, radius, feetY = 0, cell = 0.5, below = 0.15, above = 0.5, lift = 0.03 }) {
  const R = radius + 8, n = Math.ceil((R * 2) / cell) + 1, ox = -R, oz = -R, rows = [];
  for (let j = 0; j < n; j++) {
    let i0 = -1, hs = "";
    const flush = () => { if (i0 >= 0 && hs.length >= 4) rows.push(`${j}:${i0}:${hs}`); i0 = -1; hs = ""; };
    for (let i = 0; i < n; i++) {
      const h = H(x + ox + i * cell, z + oz + j * cell);
      if (h == null || h < level - below || h > level + above) { flush(); continue; }
      const cm = Math.max(0, Math.min(1295, Math.round((h - feetY) * 100)));
      if (i0 < 0) i0 = i; hs += cm.toString(36).padStart(2, "0");
    }
    flush();
  }
  return { cell, ox, oz, g: rows.join(";"), lift };
}
