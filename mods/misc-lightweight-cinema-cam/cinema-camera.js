// Cinema Camera — positions the camera during cinematic playback
// Does nothing when cinemaActive is false, so the normal camera runs untouched
const { degToRad } = require('builtin/math');
const { sampleTimeline } = require('lib/cinema-sampler.js');
const SEQUENCES = require('lib/data/sequences.json');

export function lookTarget(pos, yaw, pitch) {
  var yr = degToRad(yaw);
  var pr = degToRad(pitch);
  var cp = Math.cos(pr);
  return {
    x: pos.x - Math.sin(yr) * cp * 10,
    y: pos.y + Math.sin(pr) * 10,
    z: pos.z - Math.cos(yr) * cp * 10,
  };
}

export function onInput(cameraApi, input) {
  // Block mouse look during cinema
  var target = cameraApi.getControlTarget();
  if (target && target.state && target.state.cinemaActive) return;
}

export function update(cameraApi, dt) {
  var target = cameraApi.getControlTarget();
  if (!target) return;
  var ps = target.state;

  // Only active during cinema playback
  if (!ps.cinemaActive) {
    // Re-seed if we were just in cinema
    var s = cameraApi.getState();
    if (s._cinemaYielding) {
      cameraApi.patchState({ _cinemaYielding: false, initialized: false });
    }
    return;
  }

  // Mark that we're in cinema mode
  var s = cameraApi.getState();
  if (!s._cinemaYielding) {
    cameraApi.patchState({ _cinemaYielding: true });
  }

  var seqData = SEQUENCES[ps.cinemaSeqId];
  if (!seqData) return;

  var sample = sampleTimeline(ps.cinemaTime || 0, seqData.sequence, seqData.nodes);
  if (!sample) return;

  cameraApi.setProperty('feetPosition', sample.position);
  cameraApi.lookAt(lookTarget(sample.position, sample.yaw, sample.pitch));
}
