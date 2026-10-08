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
// behind the Abbey door: the roofless Burned Nave runs north to the Bell Crypt, where the Ninth Bell hangs.
// Floor only for a Bearer whose Abbey chapter is done (quest stage 10+).
export const NAVE_DOOR = [[0, -193], [0, -205]];
export const NAVE = [[0, -205], [0, -236]];
export const NAVE_HALF = 7;
export const CRYPT = { x: 0, z: -251, r: 14 };
export const BELL = { x: 0, z: -259 };
// west of the Wayside Fire: the Fen Path drops into the Lanternmere, where the first lantern drowned.
// Floor only for a Bearer whose Ninth Bell chapter is done (quest stage 13+).
export const FEN_PATH = [[-14, 4], [-28, 8], [-42, 4], [-50, -4]];
export const FEN_HALF = 5;
export const FEN = { x: -64, z: -10, r: 20 };
export const WAYSTONES = [{ id: "w1", x: -54, z: -2 }, { id: "w2", x: -72, z: -1 }, { id: "w3", x: -62, z: -24 }];
export const FEN_HEART = { x: -66, z: -12, r: 9 };
// east of the Wayside Fire: the Gallows Path climbs into Saint Corvin's orchard, where the second lantern hangs.
// Floor only for a Bearer whose Drowned Lantern chapter is done (quest stage 17+).
export const ORCH_PATH = [[10, 2], [26, 0], [38, 4], [46, 6]];
export const ORCH_HALF = 4.5;
export const ORCHARD = { x: 62, z: 6, r: 18 };
export const GIBBETS = [{ id: "g1", x: 52, z: 15 }, { id: "g2", x: 72, z: 14 }, { id: "g3", x: 66, z: -6 }];
export const GALLOWS = { x: 62, z: 5, r: 9 };
// under the Bell Crypt, west through a gap in its piers: the Bone Stair drops into the Ossuary of Saint Ysolde,
// where the Abbess keeps the third lantern among her sleeping sisters. Floor only from quest stage 23.
export const OSS_PATH = [[-11, -256], [-20, -260], [-30, -264]];
export const OSS_HALF = 3.6;
export const OSSUARY = { x: -42, z: -266, r: 14 };
export const RELIQUARY = { x: -46, z: -267 }; // her dais, west end
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
export function naveDist(x, z) {
  return Math.min(segDist(x, z, NAVE_DOOR, 2.1), segDist(x, z, NAVE, NAVE_HALF), Math.hypot(x - CRYPT.x, z - CRYPT.z) - CRYPT.r);
}
export function fenDist(x, z) {
  return Math.min(segDist(x, z, FEN_PATH, FEN_HALF), Math.hypot(x - FEN.x, z - FEN.z) - FEN.r);
}
export function orchDist(x, z) {
  return Math.min(segDist(x, z, ORCH_PATH, ORCH_HALF), Math.hypot(x - ORCHARD.x, z - ORCHARD.z) - ORCHARD.r);
}
export function ossDist(x, z) {
  return Math.min(segDist(x, z, OSS_PATH, OSS_HALF), Math.hypot(x - OSSUARY.x, z - OSSUARY.z) - OSSUARY.r);
}
export function floorDist(x, z, abbeyOpen = true, naveOpen = true, fenOpen = true, orchOpen = true, ossOpen = true) {
  let d = Math.hypot(x - HUB.x, z - HUB.z) - HUB.r;
  for (const c of COURTS) d = Math.min(d, Math.hypot(x - c.x, z - c.z) - c.r);
  d = Math.min(d, segDist(x, z, ROAD, ROAD_HALF));
  let a = Math.min(segDist(x, z, ABBEY_ROAD, ABBEY_HALF), Math.hypot(x - ABBEY.x, z - ABBEY.z) - ABBEY.r);
  if (!abbeyOpen) a = Math.max(a, 0.6 - sealSide(x, z) * -1); // sealed: only the court side of the seal is floor
  const n = naveOpen && abbeyOpen ? naveDist(x, z) : Infinity;
  const fd = fenOpen ? fenDist(x, z) : Infinity;
  const od = orchOpen ? orchDist(x, z) : Infinity;
  const os = ossOpen && naveOpen && abbeyOpen ? ossDist(x, z) : Infinity;
  return Math.min(d, a, n, fd, od, os); // < 0 = on the floor
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
  { id: "nave", name: "The Burned Nave", sub: "the roof came down on the faithful mid-hymn" },
  { id: "crypt", name: "The Bell Crypt", sub: "the Ninth Bell has not stopped ringing" },
  { id: "bonestair", name: "The Bone Stair", sub: "every step a sister who would not leave" },
  { id: "ossuary", name: "The Ossuary of Saint Ysolde", sub: "ten thousand skulls, and all of them listening" },
  { id: "fenpath", name: "The Fen Path", sub: "the lanterns went west, once" },
  { id: "fen", name: "The Lanternmere", sub: "the water keeps what it was given" },
  { id: "orchpath", name: "The Gallows Path", sub: "the debtors walked it barefoot" },
  { id: "orchard", name: "Saint Corvin's Orchard", sub: "nothing grows here but rope" },
];
export function areaAt(x, z) {
  const by = (id) => AREAS.find((a) => a.id === id);
  if (Math.hypot(x - HUB.x, z - HUB.z) < HUB.r) return by("fire");
  if (Math.hypot(x - FEN.x, z - FEN.z) < FEN.r) return by("fen");
  if (x < -14 && segDist(x, z, FEN_PATH, FEN_HALF) < 0.5) return by("fenpath");
  if (Math.hypot(x - ORCHARD.x, z - ORCHARD.z) < ORCHARD.r) return by("orchard");
  if (x > 14 && segDist(x, z, ORCH_PATH, ORCH_HALF) < 0.5) return by("orchpath");
  if (Math.hypot(x - COURTS[0].x, z - COURTS[0].z) < COURTS[0].r) return by("toll");
  if (Math.hypot(x - OSSUARY.x, z - OSSUARY.z) < OSSUARY.r) return by("ossuary");
  if (x < -12 && z < -250 && segDist(x, z, OSS_PATH, OSS_HALF) < 0.5) return by("bonestair");
  if (Math.hypot(x - CRYPT.x, z - CRYPT.z) < CRYPT.r) return by("crypt");
  if (z < -197 && segDist(x, z, NAVE, NAVE_HALF) < 0.5) return by("nave");
  if (Math.hypot(x - ABBEY.x, z - ABBEY.z) < ABBEY.r) return by("abbey");
  if (Math.hypot(x - COURTS[1].x, z - COURTS[1].z) >= COURTS[1].r && segDist(x, z, ABBEY_ROAD, ABBEY_HALF) < 0.5 && z < -110) return by("climb");
  if (z < -92 && Math.hypot(x - COURTS[1].x, z - COURTS[1].z) < COURTS[1].r + 2) return by("court");
  if (z < -80) return by("gate");
  return floorDist(x, z) < 0.5 ? by("road") : null;
}
