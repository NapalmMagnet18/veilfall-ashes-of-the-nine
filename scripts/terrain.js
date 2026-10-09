// Broken Lantern Road: a fog-filled ravine. The floor (hub, road, courts) is level at y 0;
// beyond it the ground climbs into crumbling banks and cliffs the body cannot climb.
import { floorDist, deepDist } from './lib/data/veilfall-map.js'
const clamp01 = (v) => Math.min(1, Math.max(0, v))
export function heightAt(ctx) {
  const { x, z, noise, seedOffset } = ctx
  const d = floorDist(x, z)
  // cost: noise only where it can change the answer (deep floor skips the bank noise, low banks skip the crags)
  if (d < -3) return noise.fbm2({ x, z, frequency: 1 / 9, octaves: 1, seed: seedOffset(2) }) * 0.12
  const wobble = noise.fbm2({ x, z, frequency: 1 / 14, octaves: 2, seed: seedOffset(1) }) * 2.5
  const e = d + wobble
  if (e <= 0) return noise.fbm2({ x, z, frequency: 1 / 9, octaves: 1, seed: seedOffset(2) }) * 0.12
  const bank = clamp01(e / 2.5) // a short scree lip, then the wall
  const wall = clamp01((e - 2.5) / 3) * 8
  const crag = e > 4 ? noise.ridged({ x, z, frequency: 1 / 22, octaves: 3, seed: seedOffset(3) }) * 4 * clamp01((e - 4) / 6) : 0
  return bank * 1.2 + wall + crag + clamp01((e - 10) / 30) * 10
}
export function materialAt(ctx) {
  const { x, z, worldHeight, slope, noise, seedOffset } = ctx
  const n = noise.fbm2({ x, z, frequency: 1 / 8, octaves: 2, seed: seedOffset(5) })
  const rock = clamp01((slope - 0.18 + n * 0.12) * 5)
  if (worldHeight < 0.4) {
    const d = floorDist(x, z)
    const camp = clamp01(1 - Math.hypot(x, z) / 14) // the Wayside Fire keeps its trodden earth
    // the pilgrim road: old flagstone, broken toward its edges, ash in the cracks
    const cave = z < -277 && deepDist(x, z) < 1 ? 1 : 0 // the Deep is raw cavern floor, never paved
    const paved = clamp01((-d - 1.2 + n * 2.2) / 1.6) * (1 - camp) * (1 - cave)
    const moss = clamp01(0.35 + n * 1.6) * (1 - paved) * (0.4 + camp * 0.6)
    const rest = Math.max(0, 1 - paved - moss)
    return { stone: paved * (1 - rock), grass: moss * (1 - rock), gravel: rest * (1 - rock), rock }
  }
  // the low banks green over: moss and wildflowers climb until the scree turns to cliff
  const lush = clamp01((3.2 - worldHeight) / 2.8) * clamp01(0.6 + n) * (1 - rock)
  const rk = Math.max(rock, 0.55 * (1 - lush))
  return { rock: rk, grass: lush * (1 - rk), gravel: Math.max(0, 1 - rk - lush * (1 - rk)) }
}
