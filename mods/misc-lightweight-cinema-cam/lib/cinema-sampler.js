// Cinema Timeline Sampler — interpolates camera position/orientation over time
const { lerp } = require('builtin/math');
const easing = require('builtin/easing');

export function resolveNode(entry, nodes) {
  if (!entry || !nodes) return null;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === entry.nodeId) return nodes[i];
  }
  return null;
}

export function sequenceDuration(seq) {
  var total = 0;
  for (var i = 0; i < seq.length; i++) {
    total += (seq[i].hold ?? 2);
    if (i < seq.length - 1) total += (seq[i].transition ?? 1);
  }
  return total;
}

export function lerpYaw(a, b, t) {
  a = ((a % 360) + 360) % 360;
  b = ((b % 360) + 360) % 360;
  var diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return a + diff * t;
}

export function sampleTimeline(t, sequence, nodes) {
  var totalDur = sequenceDuration(sequence);
  if (totalDur <= 0) {
    var first = resolveNode(sequence[0], nodes);
    return first ? { position: first.position, yaw: first.yaw, pitch: first.pitch } : null;
  }
  if (t < 0) t = 0;
  if (t > totalDur) t = totalDur;

  var cursor = 0;
  for (var i = 0; i < sequence.length; i++) {
    var entry = sequence[i];
    var holdDur = entry.hold ?? 2;
    var node = resolveNode(entry, nodes);
    if (!node) { cursor += holdDur + (entry.transition ?? 1); continue; }

    // Still in hold phase
    if (t <= cursor + holdDur) {
      return { position: node.position, yaw: node.yaw, pitch: node.pitch };
    }
    cursor += holdDur;

    // Transition to next node
    if (i < sequence.length - 1) {
      var transDur = entry.transition ?? 1;
      if (transDur > 0 && t <= cursor + transDur) {
        var progress = (t - cursor) / transDur;
        var easeFn = easing[entry.easing || 'linear'] || easing.linear;
        var et = easeFn(progress);
        var next = resolveNode(sequence[i + 1], nodes);
        if (!next) return { position: node.position, yaw: node.yaw, pitch: node.pitch };
        return {
          position: {
            x: lerp(node.position.x, next.position.x, et),
            y: lerp(node.position.y, next.position.y, et),
            z: lerp(node.position.z, next.position.z, et),
          },
          yaw: lerpYaw(node.yaw, next.yaw, et),
          pitch: lerp(node.pitch, next.pitch, et),
        };
      }
      cursor += transDur;
    }
  }
  // Past end — hold on last node
  var last = resolveNode(sequence[sequence.length - 1], nodes);
  return last ? { position: last.position, yaw: last.yaw, pitch: last.pitch } : null;
}

module.exports = { sampleTimeline, sequenceDuration, lerpYaw, resolveNode };
