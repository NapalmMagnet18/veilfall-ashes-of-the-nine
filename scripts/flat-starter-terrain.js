// 3D starter ground: a flat heightmap placeholder for real terrain, only heightmap terrain
// calls heightAt/materialAt.
import WORLD from './lib/data/world.yml'

export function heightAt() {
  return WORLD.terrain.baseHeight
}

export function materialAt(ctx) {
  return { grass: 1 }
}
