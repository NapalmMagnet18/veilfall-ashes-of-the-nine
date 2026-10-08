// Broken Lantern Road: a fog-filled ravine. The floor (hub, road, courts) is level at y 0;
// beyond it the ground climbs into crumbling banks and cliffs the body cannot climb.
import { floorDist } from './lib/data/veilfall-map.js'
const clamp01 = (v) => Math.min(1, Math.max(0, v))
export function heightAt(ctx) {
  const { x, z, noise, seedOffset } = ctx
  const d = floorDist(x, z)
  const wobble = noise.fbm2({ x, z, frequency: 1 / 14, octaves: 3, seed: seedOffset(1) }) * 2.5
  const e = d + wobble
  if (e <= 0) return noise.fbm2({ x, z, frequency: 1 / 9, octaves: 2, seed: seedOffset(2) }) * 0.12
  const bank = clamp01(e / 2.5) // a short scree lip, then the wall
  const wall = clamp01((e - 2.5) / 3) * 8
  const crag = noise.ridged({ x, z, frequency: 1 / 22, octaves: 4, seed: seedOffset(3) }) * 4 * clamp01((e - 4) / 6)
  return bank * 1.2 + wall + crag + clamp01((e - 10) / 30) * 10
}
export function materialAt(ctx) {
  const { x, z, worldHeight, slope, noise, seedOffset } = ctx
  const n = noise.fbm2({ x, z, frequency: 1 / 8, octaves: 3, seed: seedOffset(5) })
  const rock = clamp01((slope - 0.18 + n * 0.12) * 5)
  if (worldHeight < 0.4) {
    const g = clamp01(0.5 + n * 1.4)
    return { gravel: (1 - g) * (1 - rock), grass: g * (1 - rock), rock }
  }
  return { rock: Math.max(rock, 0.4), grass: 1 - Math.max(rock, 0.4) }
}
