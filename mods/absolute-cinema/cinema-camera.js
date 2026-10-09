// Cinema Camera — standalone camera behavior for Absolute Cinema mod.
// Handles POSSESS and PLAYBACK modes only.
// When neither mode is active, calls clearCamera() so the host project's
// own camera resumes control. Works alongside any existing camera script.
//
// Reads player state fields written by cinema-director.js:
//   possessedNodeId, cinemaNodes, cinemaSequence, cinemaPlayback,
//   cinemaPlaying, _cinemaTurbulence

const { degToRad, lerp } = require('builtin/math');
const easing = require('builtin/easing');

// Possess fly-in speed — ~75% of gap per second
const FLY_SPEED = 4;

// ── Camera orientation ──
// Uses cameraApi.lookAt() which flips the engine's `_usedLookAt` flag for the
// frame, disabling the renderer-side 120Hz mouse-look override. Without this
// the renderer ignores any rotation we write via setProperty and the player's
// mouse keeps driving the camera during possess/playback (v4.5.x).
export function safeLookAt(cameraApi, target) {
  cameraApi.lookAt(target);
}

// ── Helpers ──
export function lookTarget(pos, yaw, pitch) {
  var yr = degToRad(yaw);
  var pr = degToRad(pitch);
  var cp = Math.cos(pr);
  return { x: pos.x - Math.sin(yr) * cp * 10, y: pos.y + Math.sin(pr) * 10, z: pos.z - Math.cos(yr) * cp * 10 };
}

export function lerpYaw(a, b, t) {
  a = ((a % 360) + 360) % 360;
  b = ((b % 360) + 360) % 360;
  var diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return a + diff * t;
}

export function resolveNode(entry, nodes) {
  if (!entry || !nodes) return null;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === entry.nodeId) return nodes[i];
  }
  return null;
}

export function timelineDuration(sequence, looping) {
  var total = 0;
  for (var i = 0; i < sequence.length; i++) {
    if (sequence[i].ending) { total += (sequence[i].hold ?? 2); break; }
    total += (sequence[i].hold ?? 2);
    if (i < sequence.length - 1) {
      total += (sequence[i].transition ?? 1);
    } else {
      total += (sequence[i].transition ?? 1);
    }
  }
  return total;
}

export function sampleTimeline(t, sequence, nodes, looping) {
  var totalDur = timelineDuration(sequence, looping);
  if (totalDur <= 0) {
    var firstNode = resolveNode(sequence[0], nodes);
    return firstNode ? { position: firstNode.position, yaw: firstNode.yaw, pitch: firstNode.pitch } : null;
  }
  if (looping && totalDur > 0) {
    t = ((t % totalDur) + totalDur) % totalDur;
  } else {
    if (t < 0) t = 0;
    if (t > totalDur) t = totalDur;
  }
  var cursor = 0;
  for (var i = 0; i < sequence.length; i++) {
    var entry = sequence[i];
    var holdDur = entry.hold ?? 2;
    var node = resolveNode(entry, nodes);
    if (!node) { cursor += holdDur + (entry.transition ?? 1); continue; }
    if (entry.ending) {
      return { position: { x: node.position.x, y: node.position.y, z: node.position.z }, yaw: node.yaw, pitch: node.pitch };
    }
    if (t <= cursor + holdDur) {
      return { position: { x: node.position.x, y: node.position.y, z: node.position.z }, yaw: node.yaw, pitch: node.pitch };
    }
    cursor += holdDur;
    var hasTransition = (i < sequence.length - 1) || looping;
    var isLastNonLooping = (i === sequence.length - 1) && !looping;
    if (hasTransition || isLastNonLooping) {
      var transDur = entry.transition ?? 1;
      if (transDur > 0 && t <= cursor + transDur) {
        var progress = (t - cursor) / transDur;
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;
        var easingName = entry.easing || 'linear';
        var easeFn = easing[easingName] || easing.linear;
        var easedT = easeFn(progress);
        if (isLastNonLooping) {
          return { returning: true, progress: easedT, position: { x: node.position.x, y: node.position.y, z: node.position.z }, yaw: node.yaw, pitch: node.pitch };
        }
        var nextIdx = (i + 1) % sequence.length;
        var nextNode = resolveNode(sequence[nextIdx], nodes);
        if (!nextNode) {
          return { position: { x: node.position.x, y: node.position.y, z: node.position.z }, yaw: node.yaw, pitch: node.pitch };
        }
        var px = lerp(node.position.x, nextNode.position.x, easedT);
        var py = lerp(node.position.y, nextNode.position.y, easedT);
        var pz = lerp(node.position.z, nextNode.position.z, easedT);
        var yaw2 = lerpYaw(node.yaw, nextNode.yaw, easedT);
        var pitch2 = lerp(node.pitch, nextNode.pitch, easedT);
        return { position: { x: px, y: py, z: pz }, yaw: yaw2, pitch: pitch2 };
      }
      cursor += transDur;
    }
  }
  var lastNode = resolveNode(sequence[sequence.length - 1], nodes);
  if (lastNode) {
    return { position: { x: lastNode.position.x, y: lastNode.position.y, z: lastNode.position.z }, yaw: lastNode.yaw, pitch: lastNode.pitch };
  }
  return null;
}

// ── Possess mode ──
export function updatePossess(dt, cameraApi, node) {
  var t = 1 - Math.exp(-FLY_SPEED * dt);
  var cam = cameraApi.getProperty('feetPosition') || node.position;
  cameraApi.setProperty('feetPosition', {
    x: cam.x + (node.position.x - cam.x) * t,
    y: cam.y + (node.position.y - cam.y) * t,
    z: cam.z + (node.position.z - cam.z) * t,
  });
  safeLookAt(cameraApi, lookTarget(node.position, node.yaw, node.pitch));
}

// ── Playback mode ──
export function updatePlayback(dt, cameraApi, s, playerState) {
  var sequence = playerState.cinemaSequence;
  var playback = playerState.cinemaPlayback;
  var nodes = playerState.cinemaNodes || [];
  if (!sequence || sequence.length === 0 || !playback) return;

  var t = playback.time || 0;
  var looping = !!playback.looping;
  var sample = sampleTimeline(t, sequence, nodes, looping);
  if (!sample) return;

  // Return-to-player blend (last shot exit)
  if (sample.returning) {
    // Just hold position — the host camera will take over once clearCamera fires
    cameraApi.setProperty('feetPosition', sample.position);
    safeLookAt(cameraApi, lookTarget(sample.position, sample.yaw, sample.pitch));
    return;
  }

  cameraApi.setProperty('feetPosition', sample.position);
  safeLookAt(cameraApi, lookTarget(sample.position, sample.yaw, sample.pitch));

  // Save orientation for turbulence
  cameraApi.patchState({ lastPlaybackYaw: sample.yaw, lastPlaybackPitch: sample.pitch });

  // Turbulence wobble
  var turb = playerState._cinemaTurbulence;
  if (turb && turb.intensity > 0) {
    var tTime = (s.turbTime || 0) + dt;
    cameraApi.patchState({ turbTime: tTime });
    var ti = turb.intensity;
    var spd = turb.speed || 1.0;
    var tt = tTime * spd;
    var rotYaw = (Math.sin(tt * 2.1 + 0.7) * 0.35 + Math.sin(tt * 5.9) * 0.12 + Math.sin(tt * 11.3 + 2.0) * 0.05) * ti;
    var rotPitch = (Math.sin(tt * 1.9 + 1.3) * 0.28 + Math.sin(tt * 6.3 + 0.3) * 0.09 + Math.sin(tt * 9.7 + 1.5) * 0.04) * ti;
    var offX = (Math.sin(tt * 1.3) * 0.4 + Math.sin(tt * 3.7) * 0.15) * ti * 0.08;
    var offY = (Math.sin(tt * 1.7 + 1.0) * 0.3 + Math.sin(tt * 4.3 + 2.0) * 0.12) * ti * 0.06;
    var offZ = (Math.sin(tt * 1.1 + 2.0) * 0.35 + Math.sin(tt * 3.1 + 1.5) * 0.1) * ti * 0.08;
    var pos = sample.position;
    var turbPos = { x: pos.x + offX, y: pos.y + offY, z: pos.z + offZ };
    cameraApi.setProperty('feetPosition', turbPos);
    safeLookAt(cameraApi, lookTarget(turbPos, sample.yaw + rotYaw, sample.pitch + rotPitch));
  }
}

// ── Main hooks ──
export function onSpawn(cameraApi) {
  cameraApi.patchState({ _cinemaActive: false, wasPossessing: false, wasPlaying: false, turbTime: 0 });
}

export function onInput(cameraApi, input) {
  // Block mouse look during cinema modes
  var target = cameraApi.getControlTarget();
  if (!target) return;
  var ps = target.state;
  if (ps.possessedNodeId) return;
  if (ps.cinemaPlaying || (ps.cinemaPlayback && ps.cinemaPlayback.playing)) return;
}

export function update(cameraApi, dt) {
  var target = cameraApi.getControlTarget();
  if (!target) return;
  var ps = target.state;
  var s = cameraApi.getState();

  var possessedNodeId = ps.possessedNodeId || null;
  var isPlaying = !!(ps.cinemaPlaying || (ps.cinemaPlayback && ps.cinemaPlayback.playing));
  var isPossessing = !!possessedNodeId;

  // ── Playback mode ──
  if (isPlaying) {
    if (!s._cinemaActive) {
      cameraApi.patchState({ _cinemaActive: true, wasPlaying: true });
    }
    updatePlayback(dt, cameraApi, s, ps);
    return;
  }

  // Transition: was playing, now stopped — just clear our flag.
  // cinema-director.js already called clearCamera() from the player side.
  if (s.wasPlaying) {
    cameraApi.patchState({ wasPlaying: false, _cinemaActive: false });
    return;
  }

  // ── Possess mode ──
  if (isPossessing) {
    if (!s._cinemaActive) {
      cameraApi.patchState({ _cinemaActive: true, wasPossessing: true });
    }
    var nodes = ps.cinemaNodes || [];
    var node = null;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === possessedNodeId) { node = nodes[i]; break; }
    }
    if (node) updatePossess(dt, cameraApi, node);
    return;
  }

  // Transition: was possessing, now released — just clear our flag.
  // cinema-director.js already called clearCamera() from the player side.
  if (s.wasPossessing) {
    cameraApi.patchState({ wasPossessing: false, _cinemaActive: false });
    return;
  }
}
