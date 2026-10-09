// Awakening wake shape: what water does round a thing standing in a current, as the photographs show it
// (the reference sheet: boulders in a mountain stream, a wader mid-river). One shape, two hands: river.js's
// shader draws it live round a wader (lib/wake.js obstacle(), the same numbers in TSL) and the rock bake
// draws it into the standing-wake map. Physics sets the sizes: the pillow is the stagnation head U^2/2g,
// the arms open at the Kelvin/Mach angle for that speed and depth, the transverse crests sit at the
// wavelength whose phase speed matches the stream (2 pi U^2 / g).
// In the body's flow frame: a metres downstream of its centre, b across. R radius, U stream speed m/s,
// crown metres of rock above the water (a wader: 1). Returns { h (m), foam 0..1, slick 0..1, seam 0..1 }.
//   collar: a thin bright band of foam hugging the upstream half, pushed up on the pillow
//   arms:   two V crests off the flanks, a short train of wavelets outside each, glassy between
//   slick:  the calm tongue in the lee: no chop, a clean mirror, the hole just behind the body
//   seams:  the eddy lines where the slick meets the stream: torn, broken reflection, streaks of foam
export const G = 9.81;
const sq = (x) => x * x;
const ss = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
export function armAngle(U, depth) { // radians: the Kelvin 19.5 deg below critical, the Mach V above it
  const c = Math.sqrt(G * depth);
  const kel = 19.47 * Math.PI / 180;
  // the V a wader or rock throws in a shallow stream is the Mach cone of the short surface waves (c0 ≈ 0.55 m/s
  // at this scale): nearly flat-out wide at a trickle, a narrow knife in a rush; never past the Kelvin/shallow bounds
  const c0 = 0.55 + depth * 0.1;
  return Math.min(1.05, Math.max(0.2, Math.asin(Math.min(1, c0 / Math.max(U, 0.05)))));
}
export function shape(a, b, R, U, crown = 1, depth = 0.6) {
  const sub = crown < 0.05; // just under: a smooth hump and boil, no collar
  const head = Math.min(U * U / (2 * G), 0.16);
  const r = Math.hypot(a, b);
  let h = 0, foam = 0, slick = 0, seam = 0;
  // pillow on the face, hole in the lee
  const pw = 0.35 * R + 0.15;
  h += head * (sub ? 0.7 : 1) * Math.exp(-(sq((a + R * 0.95) / pw) + sq(b / (0.9 * R + 0.1))));
  h -= head * 0.6 * Math.exp(-(sq((a - R * 1.25) / (R + 0.2)) + sq(b / (0.7 * R + 0.1))));
  if (sub) h += head * 0.8 * Math.exp(-(sq(a / (0.9 * R + 0.2)) + sq(b / (R + 0.2))));
  // the V arms
  const phi = armAngle(U, depth), tp = Math.tan(phi), cp = Math.cos(phi);
  const lam = 0.22 + 0.16 * U; // divergent wavelets, short
  const reach = R * 2.5 + U * 1.2 + 0.6;
  const along = ss(-R * 0.6, R * 0.4, a) * Math.exp(-Math.max(0, a) / reach);
  for (const s of [1, -1]) {
    const n = (s * b - (R * 0.9 + Math.max(0, a) * tp)) * cp; // metres outward from the arm line
    const env = Math.exp(-sq(Math.max(0, n) / (1.8 * lam))) * ss(-0.6 * lam, 0, n);
    h += head * 0.5 * along * env * Math.cos((2 * Math.PI * n) / lam);
    foam = Math.max(foam, 0.3 * along * Math.exp(-sq((n - 0.02) / 0.09)) * ss(0.4, 1.4, U) * (sub ? 0.4 : 1));
  }
  // transverse standing crests down the lee, a few, dying off
  const lt = Math.max(0.5, Math.min(2.4, (2 * Math.PI * U * U) / G));
  const at = a - R * 1.8;
  if (at > -lt * 0.5) {
    const wid = R + Math.max(0, at) * tp * 0.8 + 0.1;
    h += head * 0.22 * Math.exp(-Math.max(0, at) / (R * 2 + U * 0.8 + 0.5)) * Math.exp(-sq(b / wid)) * ss(-lt * 0.5, 0, at) * Math.cos((2 * Math.PI * at) / lt);
  }
  // collar: the band of foam round the upstream half, sitting on the pillow
  if (!sub) {
    const band = 0.07 + 0.07 * R;
    foam = Math.max(foam, Math.exp(-sq((r - R * 1.04) / band)) * ss(R * 0.45, -R * 0.5, a) * ss(0.25, 1.2, U));
    foam = Math.max(foam, 0.55 * Math.exp(-sq((a + R * 1.05) / (band * 1.4)) - sq(b / (R * 0.7))) * ss(0.3, 1.2, U));
  }
  // lee: the slick tongue and its seams
  if (a > 0) {
    const wid = R * 0.8 + a * 0.1;
    const fade = Math.exp(-a / (R * 3 + U + 1));
    slick = Math.exp(-sq(b / wid)) * ss(0, R * 0.8, a) * fade;
    const sd = Math.abs(Math.abs(b) - wid) / (0.1 + a * 0.035);
    seam = Math.exp(-sq(sd)) * ss(0, R, a) * Math.exp(-a / (R * 3 + U * 2 + 1)) * ss(0.25, 1.1, U);
    foam = Math.max(foam, seam * 0.45 * Math.exp(-a / (R * 2 + 1.5)));
  }
  return { h, foam: Math.min(1, foam), slick: Math.min(1, slick), seam: Math.min(1, seam) };
}
