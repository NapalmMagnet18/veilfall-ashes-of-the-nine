// river wake slot counts, shared by river.js (the shader) and river-surface.js (the writer)
export const TRAIL_BODIES = 2; // wave trail (lib/trail.js): the first TRAIL_BODIES waders each keep TRAIL sources
export const BODIES = 4; // live wake slots: b<i>x, b<i>z, b<i>t (clock at that fix), b<i>v / b<i>n (body m/s x, z), b<i>u / b<i>w (water past it, m/s), b<i>r (radius; 0 = empty)
