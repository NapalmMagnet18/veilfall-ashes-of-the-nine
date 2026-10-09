// Cinema node gizmos — client-side floating cameras that show where each node sits and aims.
// Attached to the player. Every gizmo is spawned realm:'client' / audience:'local', so only
// the author sees their own nodes; nobody else's screen is touched.
//
// Visible while the cinema panel is open. Hidden during playback, and the possessed node
// hides too (you're inside that camera — you shouldn't see its own body).
// Toggle: state.cinemaShowGizmos (settings panel, on by default).

// The mesh generator lives beside this file — under mods/ in a host game,
// under scripts/ in the workshop project. Resolve once, at first use.
const MESH_CANDIDATES = [
  'mods/absolute-cinema/gizmo-camera.js',
  'scripts/absolute-cinema/gizmo-camera.js',
  'scripts/gizmo-camera.js',
];
let GIZMO_MESH = null;
const PREFIX = 'cgz-';


export function meshPath(objectApi) {
  if (GIZMO_MESH) return GIZMO_MESH;
  for (let i = 0; i < MESH_CANDIDATES.length; i++) {
    let src = null;
    try { src = objectApi.getScript(MESH_CANDIDATES[i]); } catch (e) { src = null; }
    if (src) { GIZMO_MESH = MESH_CANDIDATES[i]; return GIZMO_MESH; }
  }
  GIZMO_MESH = MESH_CANDIDATES[1];
  return GIZMO_MESH;
}

export const updateSchedule = { every: 3 };

export function sweep(objectApi, keepIds) {
  let found = [];
  try { found = objectApi.query({ tags: ['cinema-gizmo'], radius: 100000 }) || []; } catch (e) { found = []; }
  for (let i = 0; i < found.length; i++) {
    const o = found[i];
    if (!o || !o.id) continue;
    if (keepIds && keepIds[o.id]) continue;
    try { objectApi.destroy(o.id); } catch (e) {}
  }
}

export function onSpawn(objectApi) {
  // Script reloads and rejoins can leave orphans behind — start clean.
  sweep(objectApi, null);
}

export function onDestroy(objectApi) {
  sweep(objectApi, null);
}

export function update(objectApi, dt) {
  const s = objectApi.getState() || {};

  const playback = s.cinemaPlayback;
  const playing = !!(s.cinemaPlaying || (playback && playback.playing) || s._cinemaSkipCountdown);
  const show = !!s.cinemaOpen && !playing && s.cinemaShowGizmos !== false;

  const nodes = show && Array.isArray(s.cinemaNodes) ? s.cinemaNodes : [];
  const possessed = s.possessedNodeId || null;
  const keep = {};

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n || !n.id || !n.position) continue;

    const gid = PREFIX + n.id;
    const pos = { x: n.position.x, y: n.position.y, z: n.position.z };
    const rot = { yaw: n.yaw || 0, pitch: n.pitch || 0 };

    if (!objectApi.getObject(gid)) {
      objectApi.spawn(gid, {
        tags: ['cinema-gizmo'],
        realm: 'client',
        audience: 'local',
        feetPosition: pos,
          rotation: rot,
          primitive: { kind: 'scripted', script: meshPath(objectApi), params: { reach: 2.4, hot: 0 } },
          physics: 'none',
          castShadow: false,
          receiveShadow: false,
      });
    }
    keep[gid] = true;

    // Name plates are world-anchored HTML (see lib/ui-cinema-overlays.js) — nothing 3D here.

    const hidden = possessed === n.id;
    objectApi.setObjectProperty(gid, 'visible', !hidden);
    if (hidden) continue;

    objectApi.setObjectProperty(gid, 'feetPosition', pos);
    objectApi.setObjectProperty(gid, 'rotation', rot);
  }

  sweep(objectApi, keep);
}
