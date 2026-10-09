// Cinema node gizmo — a little floating camera that projects its view cone.
// Local frame: -Z forward (the way the node looks), +Y up, origin at the body center.
// params: reach (cone length, m), tint 0..1 warmth of the cyan, hot (1 = highlighted)

export function box(ctx, mx, my, mz, Mx, My, Mz) {
  // +X
  ctx.quad(Mx, my, Mz, Mx, my, mz, Mx, My, mz, Mx, My, Mz);
  // -X
  ctx.quad(mx, my, mz, mx, my, Mz, mx, My, Mz, mx, My, mz);
  // +Y
  ctx.quad(mx, My, Mz, Mx, My, Mz, Mx, My, mz, mx, My, mz);
  // -Y
  ctx.quad(mx, my, mz, Mx, my, mz, Mx, my, Mz, mx, my, Mz);
  // +Z
  ctx.quad(mx, my, Mz, Mx, my, Mz, Mx, My, Mz, mx, My, Mz);
  // -Z
  ctx.quad(Mx, my, mz, mx, my, mz, mx, My, mz, Mx, My, mz);
}

export function geometry(ctx) {
  const p = ctx.params || {};
  const reach = p.reach ?? 2.4;
  const hot = p.hot ? 1 : 0;

  const gr = 0.0 + hot * 0.35;   // cyan -> warmer white when highlighted
  const gg = 0.78;
  const gb = 1.0;

  // ── body ──
  ctx.emissive(0, 0, 0);
  ctx.metalness(0.35);
  ctx.roughness(0.5);
  ctx.color(0.085, 0.095, 0.115, 1);
  box(ctx, -0.13, -0.10, -0.17, 0.13, 0.10, 0.17);

  // ── lens barrel ──
  ctx.color(0.045, 0.05, 0.06, 1);
  box(ctx, -0.055, -0.055, -0.29, 0.055, 0.055, -0.17);

  // ── film reels on top ──
  ctx.color(0.14, 0.155, 0.185, 1);
  box(ctx, -0.055, 0.10, -0.115, 0.055, 0.185, -0.005);
  box(ctx, -0.055, 0.10, 0.01, 0.055, 0.185, 0.12);

  // ── glowing trim band ──
  ctx.emissive(gr * 0.9, gg * 0.9, gb * 0.9);
  ctx.color(gr, gg, gb, 1);
  box(ctx, -0.135, -0.02, -0.175, 0.135, 0.015, -0.155);

  // ── lens glass ──
  ctx.emissive(gr, gg, gb);
  ctx.color(gr, gg, gb, 1);
  ctx.quad(-0.048, -0.048, -0.292, 0.048, -0.048, -0.292, 0.048, 0.048, -0.292, -0.048, 0.048, -0.292);

  // ── projected view cone ──
  const zn = 0.29;
  const zf = zn + reach;
  const hw0 = 0.05, hh0 = 0.05;
  const hw1 = reach * 0.30, hh1 = reach * 0.17;

  // The beam is stacked in rings, each ring painted a step fainter, so the
  // projection dissolves into the air instead of ending on a hard pane.
  const SEG = 18;
  const ring = (t) => {
    const hw = hw0 + (hw1 - hw0) * t;
    const hh = hh0 + (hh1 - hh0) * t;
    const z = -(zn + reach * t);
    return [
      [-hw, -hh, z], [hw, -hh, z], [hw, hh, z], [-hw, hh, z],
    ];
  };
  // 1 at the lens, 0 at the tip — falls off fast, then trails away
  const falloff = (t) => {
    const u = 1 - t;
    return u * u * (0.35 + 0.65 * u);
  };

  ctx.metalness(0);
  ctx.roughness(1);

  let a = ring(0);
  for (let s = 0; s < SEG; s++) {
    const t1 = (s + 1) / SEG;
    const b2 = ring(t1);
    const k = falloff((s + 0.5) / SEG);

    // volume slab
    ctx.emissive(gr * 0.6 * k, gg * 0.6 * k, gb * 0.6 * k);
    ctx.color(gr, gg, gb, 0.15 * k);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      ctx.quad(
        a[i][0], a[i][1], a[i][2],
        b2[i][0], b2[i][1], b2[i][2],
        b2[j][0], b2[j][1], b2[j][2],
        a[j][0], a[j][1], a[j][2],
      );
    }

    // corner rails, fading with the same curve
    ctx.emissive(gr * k, gg * k, gb * k);
    ctx.color(gr, gg, gb, 0.9 * k);
    const w0 = 0.012 * (1 + s / SEG);
    const w1 = 0.012 * (1 + (s + 1) / SEG);
    for (let i = 0; i < 4; i++) {
      const sx = a[i][0] < 0 ? -1 : 1;
      const sy = a[i][1] < 0 ? -1 : 1;
      ctx.quad(
        a[i][0], a[i][1], a[i][2],
        b2[i][0], b2[i][1], b2[i][2],
        b2[i][0] - sx * w1, b2[i][1] - sy * w1, b2[i][2],
        a[i][0] - sx * w0, a[i][1] - sy * w0, a[i][2],
      );
    }

    a = b2;
  }

  // a whisper of a framing pane just past the lens, gone by the tip
  ctx.emissive(gr * 0.35, gg * 0.35, gb * 0.35);
  ctx.color(gr, gg, gb, 0.05);
  const q = ring(0.22);
  ctx.quad(q[0][0], q[0][1], q[0][2], q[1][0], q[1][1], q[1][2], q[2][0], q[2][1], q[2][2], q[3][0], q[3][1], q[3][2]);
}

export function collider() {
  return null;
}
