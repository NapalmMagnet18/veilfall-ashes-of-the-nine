// Cinema Playback — lightweight player behavior for cinematic sequences
// Trigger: patchState({ cinemaPlay: 'sequence-id' }) or sendAction('cinemaPlay', { id: '...' })
const SEQUENCES = require('lib/data/sequences.json');
const { sequenceDuration } = require('lib/cinema-sampler.js');

var SKIP_HOLD_DURATION = 1.0;

export function onSpawn(objectApi) {
  var s = objectApi.getState();
  // Auto-play intro on first spawn
  if (!s._introPlayed) {
    objectApi.patchState({ cinemaPlay: 'cafeteria-intro', _introPlayed: true });
  }
}

export function update(objectApi, dt) {
  var s = objectApi.getState();

  // ── Start trigger ──
  if (s.cinemaPlay && !s.cinemaActive) {
    var seqData = SEQUENCES[s.cinemaPlay];
    if (seqData) {
      objectApi.patchState({
        cinemaActive: true,
        cinemaSeqId: s.cinemaPlay,
        cinemaTime: 0,
        cinemaPlay: null,
        _cinemaFired: {},
        _cinemaSkipHold: 0,
      });
      objectApi.setCamera({ kind: 'custom', pointerLock: false }, { mode: 'replace' });
      objectApi.showCursor();
      objectApi.playSound('cdn/sfx-ui-whoosh-soft.mp3', { volume: 0.3 });
    } else {
      objectApi.patchState({ cinemaPlay: null });
    }
    return;
  }

  // ── Tick playback ──
  if (!s.cinemaActive) return;

  var seqData = SEQUENCES[s.cinemaSeqId];
  if (!seqData) { stopCinema(objectApi); return; }

  var seq = seqData.sequence;
  var total = sequenceDuration(seq);
  var t = (s.cinemaTime ?? 0) + dt;

  // Fire effects
  tickEffects(t, seqData.effects || [], objectApi);

  if (t >= total) {
    stopCinema(objectApi);
    return;
  }

  objectApi.patchState({ cinemaTime: t });
}

export function onInput(objectApi, input) {
  var s = objectApi.getState();

  // UI / slash command trigger
  if (input.actions.cinemaPlay && input.actionData && input.actionData.cinemaPlay) {
    var reqId = input.actionData.cinemaPlay.id;
    if (reqId && reqId !== '__list__') {
      objectApi.patchState({ cinemaPlay: reqId });
    }
  }

  // Freeze movement during cutscene
  if (s.cinemaActive) {
    // Hold-to-skip with jump/space
    var skipHold = s._cinemaSkipHold || 0;
    if (input.actions.jump) {
      skipHold += objectApi.getDeltaTime();
      if (skipHold >= SKIP_HOLD_DURATION) {
        stopCinema(objectApi);
        return;
      }
      objectApi.patchState({ _cinemaSkipHold: skipHold });
    } else {
      if (skipHold > 0) objectApi.patchState({ _cinemaSkipHold: 0 });
    }
  }
}

export function stopCinema(objectApi) {
  var seqId = objectApi.getState().cinemaSeqId;
  objectApi.clearCamera({ transition: { duration: 0.4 } });
  objectApi.letterbox(0);
  objectApi.patchState({
    cinemaActive: false,
    cinemaSeqId: null,
    cinemaTime: 0,
    _cinemaFired: {},
    _cinemaSkipHold: 0,
  });

  // Post-sequence events
  if (seqId === 'cafeteria-exit') {
    // Shift to outdoor atmosphere
    objectApi.patchAtmosphere({
      sky: { kind: 'gradient', horizon: 'oklch(0.82 0.08 220)', zenith: 'oklch(0.5 0.15 255)' },
      sun: { rotation: { pitch: 55, yaw: 160 }, light: { color: 'oklch(0.98 0.02 85)', intensity: 2.2 } },
      ambient: { light: { color: 'oklch(0.82 0.08 220)', intensity: 0.6 } },
      hemisphere: { skyColor: 'oklch(0.75 0.06 220)', groundColor: 'oklch(0.5 0.08 130)', intensity: 0.55 },
      fog: { kind: 'linear', color: 'oklch(0.82 0.08 220)', near: 60, far: 300 },
      clouds: { enabled: true, density: 0.35 },
    });
  }
}

export function tickEffects(t, effects, objectApi) {
  var fired = objectApi.getState()._cinemaFired || {};
  var changed = false;
  for (var i = 0; i < effects.length; i++) {
    var fx = effects[i];
    if (t >= fx.time && !fired[i]) {
      fireFx(objectApi, fx);
      fired[i] = true;
      changed = true;
    }
  }
  if (changed) objectApi.patchState({ _cinemaFired: fired });
}

export function fireFx(objectApi, fx) {
  var p = fx.params || {};
  switch (fx.type) {
    case 'letterbox':   objectApi.letterbox(p.intensity ?? 0.15); break;
    case 'announce':    objectApi.announce(p.text || '', { style: p.style, duration: p.duration ?? 2, subtitle: p.subtitle }); break;
    case 'screenShake': objectApi.screenShake(p.intensity ?? 0.5, p.duration ?? 0.3); break;
    case 'screenFlash': objectApi.screenFlash(p.color ?? 'oklch(0.99 0 0)', p.duration ?? 0.2); break;
    case 'playSound':   objectApi.playSound(p.clip, { volume: p.volume ?? 0.6 }); break;
    case 'musicShift':  objectApi.musicShift(p.clip, { fade: 0.5, volume: p.volume ?? 0.4, audience: { kind: 'place' } }); break;
    case 'vignette':    objectApi.vignette(p.intensity ?? 0.6, p.color); break;
    case 'toast':       objectApi.toast(p.message || '', { duration: p.duration ?? 2 }); break;
    case 'slowMo':      objectApi.slowMo({ scale: p.scale ?? 0.3, duration: p.duration ?? 2, ease: true }); break;
  }
}
