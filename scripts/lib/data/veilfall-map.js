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
// past the Bailiff: the Abbey road leaves his court north-east, climbs a switchback and opens into the
// Ashen Abbey's cloister yard. A wax seal (ABBEY_SEAL) closes it until the Bailiff falls in that room.
export const ABBEY_ROAD = [[10, -115], [18, -128], [14, -142], [4, -152], [0, -160]];
export const ABBEY_HALF = 6;
export const ABBEY = { x: 0, z: -176, r: 20 };
export const ABBEY_SEAL = { x: 12.3, z: -118.7, yaw: 31.6, w: 13 }; // across the road where it leaves the court
const segDist = (x, z, pts, half) => {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const vx = bx - ax, vz = bz - az, wx = x - ax, wz = z - az;
    const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / (vx * vx + vz * vz)));
    d = Math.min(d, Math.hypot(wx - vx * t, wz - vz * t) - half);
  }
  return d;
};
// signed distance past the seal line along the road (> 0 = abbey side)
export function sealSide(x, z) { return (x - ABBEY_SEAL.x) * 0.524 + (z - ABBEY_SEAL.z) * -0.852; }
export function floorDist(x, z, abbeyOpen = true) {
  let d = Math.hypot(x - HUB.x, z - HUB.z) - HUB.r;
  for (const c of COURTS) d = Math.min(d, Math.hypot(x - c.x, z - c.z) - c.r);
  d = Math.min(d, segDist(x, z, ROAD, ROAD_HALF));
  let a = Math.min(segDist(x, z, ABBEY_ROAD, ABBEY_HALF), Math.hypot(x - ABBEY.x, z - ABBEY.z) - ABBEY.r);
  if (!abbeyOpen) a = Math.max(a, 0.6 - sealSide(x, z) * -1); // sealed: only the court side of the seal is floor
  return Math.min(d, a); // < 0 = on the floor
}

// the named stretches of Z01: what the banner says when a Bearer walks into one
export const AREAS = [
  { id: "fire", name: "Wayside Fire", sub: "the last warm place on the road" },
  { id: "road", name: "Broken Lantern Road", sub: "every lamp a name nobody speaks" },
  { id: "toll", name: "The Tollhouse", sub: "petitions sealed in wax, never read" },
  { id: "gate", name: "The Dripping Gate", sub: "the wax still runs" },
  { id: "court", name: "The Bailiff's Court", sub: "all debts are called here" },
  { id: "climb", name: "The Penitent Climb", sub: "they crawled the last mile on their knees" },
  { id: "abbey", name: "The Ashen Abbey", sub: "the choir sings with no mouths" },
];
export function areaAt(x, z) {
  const by = (id) => AREAS.find((a) => a.id === id);
  if (Math.hypot(x - HUB.x, z - HUB.z) < HUB.r) return by("fire");
  if (Math.hypot(x - COURTS[0].x, z - COURTS[0].z) < COURTS[0].r) return by("toll");
  if (Math.hypot(x - ABBEY.x, z - ABBEY.z) < ABBEY.r) return by("abbey");
  if (Math.hypot(x - COURTS[1].x, z - COURTS[1].z) >= COURTS[1].r && segDist(x, z, ABBEY_ROAD, ABBEY_HALF) < 0.5 && z < -110) return by("climb");
  if (z < -92 && Math.hypot(x - COURTS[1].x, z - COURTS[1].z) < COURTS[1].r + 2) return by("court");
  if (z < -80) return by("gate");
  return floorDist(x, z) < 0.5 ? by("road") : null;
}
