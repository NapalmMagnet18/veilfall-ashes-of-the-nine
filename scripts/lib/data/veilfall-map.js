// The shape of Broken Lantern Road, shared by the terrain, the spawns and the sim.
// Walkable floor is y = 0 inside these shapes; cliffs rise outside.
export const HUB = { x: 0, z: 0, r: 17 };
export const ROAD = [[0, -10], [2, -30], [8, -44], [4, -58], [-4, -70], [0, -86], [0, -92]];
export const ROAD_HALF = 7;
export const COURTS = [
  { x: 9, z: -46, r: 12 },   // tollhouse court
  { x: 0, z: -105, r: 17 },  // the Bailiff's arena behind the Dripping Gate
];
export const GATE = { x: 0, z: -89 };
export function floorDist(x, z) {
  let d = Math.hypot(x - HUB.x, z - HUB.z) - HUB.r;
  for (const c of COURTS) d = Math.min(d, Math.hypot(x - c.x, z - c.z) - c.r);
  for (let i = 0; i < ROAD.length - 1; i++) {
    const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1];
    const vx = bx - ax, vz = bz - az, wx = x - ax, wz = z - az;
    const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / (vx * vx + vz * vz)));
    d = Math.min(d, Math.hypot(wx - vx * t, wz - vz * t) - ROAD_HALF);
  }
  return d; // < 0 = on the floor
}
