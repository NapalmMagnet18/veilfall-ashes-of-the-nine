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

// the named stretches of Z01: what the banner says when a Bearer walks into one
export const AREAS = [
  { id: "fire", name: "Wayside Fire", sub: "the last warm place on the road" },
  { id: "road", name: "Broken Lantern Road", sub: "every lamp a name nobody speaks" },
  { id: "toll", name: "The Tollhouse", sub: "petitions sealed in wax, never read" },
  { id: "gate", name: "The Dripping Gate", sub: "the wax still runs" },
  { id: "court", name: "The Bailiff's Court", sub: "all debts are called here" },
];
export function areaAt(x, z) {
  const by = (id) => AREAS.find((a) => a.id === id);
  if (Math.hypot(x - HUB.x, z - HUB.z) < HUB.r) return by("fire");
  if (Math.hypot(x - COURTS[0].x, z - COURTS[0].z) < COURTS[0].r) return by("toll");
  if (z < -92) return by("court");
  if (z < -80) return by("gate");
  return floorDist(x, z) < 0.5 ? by("road") : null;
}
