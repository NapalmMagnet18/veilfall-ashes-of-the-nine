// Cinema Director — player behavior for cinematic camera tools
// POSSESS: CAMERA moves to node — PLAYER stays put.
// Player state gets possessedNodeId so movement guards freeze input.
// Camera behavior positions itself at the node via its own state.
//
// SEQUENCE PLAYBACK:
// cinemaSequence: Array of { nodeId, hold, transition, easing }
// cinemaPlayback: { playing, time, looping } | null
// cinemaPlaying: true while playback is active (freezes player movement)

export function hasEndingShot(seq) {
  if (!seq) return false;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i].ending) return true;
  }
  return false;
}

export function computeSequenceDuration(seq, looping) {
  if (!seq || seq.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < seq.length; i++) {
    // Ending shot — add its hold then stop counting
    if (seq[i].ending) {
      total += (seq[i].hold ?? 2);
      break;
    }
    total += (seq[i].hold ?? 2);
    // Transition to next shot, or return-to-player blend on last shot
    if (i < seq.length - 1) {
      total += (seq[i].transition ?? 1);
    } else {
      // Last shot: include transition as return-to-player blend (or loop wrap)
      total += (seq[i].transition ?? 1);
    }
  }
  return total;
}

// ═══════════════════════════════════════════════════
//  EFFECT TYPE DEFINITIONS
//  Each type: { instant: bool, defaults: {}, fire(api, params), stop?(api) }
// ═══════════════════════════════════════════════════
const FX_TYPES = {
  screenShake:  { instant: true,  label: 'Shake',     color: 'rgba(255,80,80,0.7)',   defaults: { intensity: 0.5, duration: 0.3 } },
  screenFlash:  { instant: true,  label: 'Flash',     color: 'rgba(255,220,80,0.7)',  defaults: { color: 'oklch(0.99 0 0)', duration: 0.2 } },
  playSound:    { instant: true,  label: 'Sound',     color: 'rgba(80,255,180,0.7)',  defaults: { clip: 'cdn/sfx-impact-heavy.mp3', volume: 0.6 } },
  announce:     { instant: true,  label: 'Announce',  color: 'rgba(200,140,255,0.7)', defaults: { text: 'TITLE', duration: 2, style: 'cinematic' } },
  toast:        { instant: true,  label: 'Toast',     color: 'rgba(180,180,255,0.7)', defaults: { message: 'Message', duration: 2 } },
  fade:         { instant: false, label: 'Fade',      color: 'rgba(20,20,40,0.8)',    defaults: { fadeIn: true, fadeOut: false, color: 'rgba(0,0,0,1)' }, custom: true },
  turbulence:   { instant: false, label: 'Turbulence',color: 'rgba(200,160,80,0.6)',  defaults: { intensity: 0.5, speed: 1.0 }, custom: true },
  letterbox:    { instant: false, label: 'Letterbox', color: 'rgba(0,200,255,0.5)',   defaults: { intensity: 0.15 } },
  vignette:     { instant: false, label: 'Vignette',  color: 'rgba(100,0,200,0.5)',   defaults: { intensity: 0.6, color: 'oklch(0.1 0 0)' } },
  slowMo:       { instant: false, label: 'Slow Mo',   color: 'rgba(255,120,0,0.5)',   defaults: { scale: 0.3 } },
  musicShift:   { instant: false, label: 'Music',     color: 'rgba(0,255,200,0.5)',   defaults: { clip: 'cdn/music-instrumental-cinematic-tension.mp3', volume: 0.4, loop: true } },
  effect:       { instant: false, label: 'Filter',    color: 'rgba(255,200,0,0.5)',   defaults: { name: 'blur', intensity: 0.5 } },
  colorWash:    { instant: false, label: 'Color Wash',color: 'rgba(120,80,200,0.7)',  defaults: { fadeIn: true, fadeOut: false, color: 'rgba(40,60,120,0.8)', opacity: 0.5 }, custom: true },
  cinemaText:   { instant: false, label: 'Text',      color: 'rgba(255,200,100,0.7)', defaults: { text: 'TITLE TEXT', font: 'Geist Pixel Square', fontSize: 48, color: 'rgba(255,255,255,1)', posX: 50, posY: 50, fadeIn: true, fadeOut: false, fadeInDuration: 1, fadeOutDuration: 1 }, custom: true },
  event:        { instant: true,  label: 'Event',     color: 'rgba(255,255,255,0.6)', defaults: { note: '' } },
};

export function fireEffect(objectApi, fx) {
  var p = fx.params || {};
  switch (fx.type) {
    case 'screenShake':
      objectApi.screenShake(p.intensity ?? 0.5, p.duration ?? 0.3);
      break;
    case 'screenFlash':
      objectApi.screenFlash(p.color ?? 'oklch(0.99 0 0)', p.duration ?? 0.2);
      break;
    case 'playSound':
      objectApi.playSound(p.clip ?? 'cdn/sfx-impact-heavy.mp3', { volume: p.volume ?? 0.6 });
      break;
    case 'announce':
      objectApi.announce(p.text ?? 'TITLE', { style: p.style ?? 'cinematic', duration: p.duration ?? 2, subtitle: p.subtitle });
      break;
    case 'toast':
      objectApi.toast(p.message ?? 'Message', { duration: p.duration ?? 2 });
      break;
    case 'letterbox':
      objectApi.letterbox(p.intensity ?? 0.15);
      break;
    case 'vignette':
      objectApi.vignette(p.intensity ?? 0.6, p.color ?? 'oklch(0.1 0 0)');
      break;
    case 'slowMo':
      objectApi.slowMo({ scale: p.scale ?? 0.3, duration: (fx.duration || 2) + 0.5, ease: true });
      break;
    case 'musicShift':
      objectApi.musicShift(p.clip ?? null, { fade: 0.5, volume: p.volume ?? 0.4, loop: p.loop !== false, audience: { kind: 'place' } });
      break;
    case 'effect':
      objectApi.effect(p.name ?? 'blur', { intensity: p.intensity ?? 0.5 });
      break;
    case 'fade':
      // Set initial opacity — tickEffects handles per-frame envelope
      objectApi.patchState({
        _cinemaFadeOpacity: p.fadeIn !== false ? 0 : 1,
        _cinemaFadeColor: p.color || 'rgba(0,0,0,1)',
      });
      break;
    case 'turbulence':
      objectApi.patchState({
        _cinemaTurbulence: { intensity: p.intensity ?? 0.5, speed: p.speed ?? 1.0 },
      });
      break;
    case 'colorWash':
      // Set initial opacity — tickEffects handles per-frame envelope
      var cwMax = (p.opacity != null) ? p.opacity : 0.5;
      objectApi.patchState({
        _cinemaWashOpacity: p.fadeIn !== false ? 0 : cwMax,
        _cinemaWashColor: p.color || 'rgba(40,60,120,0.8)',
      });
      break;
    case 'cinemaText':
      // Set initial opacity — tickEffects handles per-frame envelope
      objectApi.patchState({
        _cinemaTextOpacity: p.fadeIn !== false ? 0 : 1,
        _cinemaTextContent: p.text || 'TITLE TEXT',
        _cinemaTextFont: p.font || 'Geist Pixel Square',
        _cinemaTextFontSize: p.fontSize || 48,
        _cinemaTextColor: p.color || 'rgba(255,255,255,1)',
        _cinemaTextPosX: p.posX != null ? p.posX : 50,
        _cinemaTextPosY: p.posY != null ? p.posY : 50,
      });
      break;
    case 'event':
      // Director's cue — write the event note to state so game flow can react
      objectApi.patchState({ _cinemaEvent: p.note || 'event' });
      break;
  }
}

export function stopSustainedEffect(objectApi, fx) {
  switch (fx.type) {
    case 'letterbox':   objectApi.letterbox(0); break;
    case 'vignette':    objectApi.vignette(0); break;
    case 'musicShift':  objectApi.musicShift(null, { fade: 0.5, audience: { kind: 'place' } }); break;
    case 'effect':      objectApi.clearEffect(fx.params?.name); break;
    case 'fade':        objectApi.patchState({ _cinemaFadeOpacity: 0, _cinemaFadeColor: null }); break;
    case 'turbulence':  objectApi.patchState({ _cinemaTurbulence: null }); break;
    case 'colorWash':   objectApi.patchState({ _cinemaWashOpacity: 0, _cinemaWashColor: null }); break;
    case 'cinemaText':  objectApi.patchState({ _cinemaTextOpacity: 0, _cinemaTextContent: null, _cinemaTextFont: null, _cinemaTextFontSize: null, _cinemaTextColor: null, _cinemaTextPosX: null, _cinemaTextPosY: null }); break;
    // slowMo auto-expires via its own duration
  }
}

export function stopPlayback(objectApi, transitionDur) {
  const dur = transitionDur != null ? transitionDur : 0.4;
  // Clean up any sustained effects
  var effects = objectApi.getState().cinemaEffects || [];
  for (var i = 0; i < effects.length; i++) {
    var def = FX_TYPES[effects[i].type];
    if (def && !def.instant) stopSustainedEffect(objectApi, effects[i]);
  }
  objectApi.patchState({ cinemaPlayback: null, cinemaPlaying: null, _fxFired: null, _fxActive: null, _cinemaSkipCountdown: null });
  objectApi.clearCamera();
  // Hand the view back to the mouse.
  objectApi.setCamera({ kind: 'custom', pointerLock: true, orientation: { source: 'look' } }, { mode: 'merge' });
  objectApi.hideCursor();
  objectApi.letterbox(0);
}

export function onSpawn(objectApi) {
  // Transient panel state must never survive a refresh — a stuck-open ADD menu,
  // a half-open library, or a leftover possession would greet the next session.
  const s = objectApi.getState();
  const ui = Object.assign({}, s.cinemaUi || {}, { fxMenu: false });
  objectApi.patchState({
    cinemaUi: ui,
    cinemaLibOpen: false,
    cinemaLibLoading: false,
    cinemaSettingsOpen: false,
    possessedNodeId: null,
    cinemaPlayback: null,
    cinemaPlaying: null,
    _cinemaSkipCountdown: null,
    _cinemaSkipHold: 0,
    _cinemaSkipHolding: false,
  });
}

export function update(objectApi, dt) {
  const s = objectApi.getState();

  // Auto-release possession when cinema panel is closed
  if (s.possessedNodeId && !(s.cinemaOpen ?? false)) {
    releasePossession(objectApi);
  }

  // ── Skip cleanup countdown ──
  // When the user skips a cutscene, we write stable state (playing: false, time: total)
  // and start a countdown. This gives the CLIENT camera enough frames to render
  // at the final position before we null everything out. Unlike runInTicks(2),
  // this countdown happens in real time and the state is STABLE (not transient),
  // so the client always sees the final position before cleanup.
  if (typeof s._cinemaSkipCountdown === 'number') {
    var remaining = s._cinemaSkipCountdown - dt;
    if (remaining <= 0) {
      objectApi.patchState({ _cinemaSkipCountdown: null });
      stopPlayback(objectApi, 0);
      return;
    }
    objectApi.patchState({ _cinemaSkipCountdown: remaining });
  }

  // ── Hold-to-skip accumulation (smooth dt in update) ──
  var SKIP_HOLD_DURATION = 1.0;
  var skipPb = s.cinemaPlayback;
  if (skipPb && skipPb.playing && s._cinemaSkipHolding && s.cinemaSkippable === true) {
    var skipHold = (s._cinemaSkipHold || 0) + dt;
    if (skipHold >= SKIP_HOLD_DURATION) {
      // Fire the skip
      var seq = s.cinemaSequence || [];
      var total = computeSequenceDuration(seq, skipPb.looping);
      if (total > 0 && (skipPb.time ?? 0) < total) {
        tickEffects(total, objectApi);
        var ending = hasEndingShot(seq);
        objectApi.patchState({
          cinemaPlayback: { playing: false, time: total, looping: false },
          _cinemaSkipHold: 0,
          _cinemaSkipHolding: false,
        });
        if (!ending) {
          objectApi.patchState({ _cinemaSkipCountdown: 0.5 });
        }
      } else {
        objectApi.patchState({ _cinemaSkipHold: 0, _cinemaSkipHolding: false });
      }
    } else {
      objectApi.patchState({ _cinemaSkipHold: skipHold });
    }
  }

  // ── Sequence playback ticking ──
  const pb = s.cinemaPlayback;
  if (pb && pb.playing) {
    const seq = s.cinemaSequence || [];
    if (seq.length === 0) { stopPlayback(objectApi); return; }

    // Camera had one frame at 100% blend — now safe to kill playback
    if (s._playbackFinishing) {
      objectApi.patchState({ _playbackFinishing: null });
      stopPlayback(objectApi, 0);
      return;
    }

    const total = computeSequenceDuration(seq, pb.looping);
    if (total <= 0) { stopPlayback(objectApi); return; }

    let t = (pb.time ?? 0) + dt;

    // If the sequence has an ending shot, never auto-stop — just keep ticking
    const ending = hasEndingShot(seq);

    if (t >= total && !ending) {
      if (pb.looping) {
        t = t % total;
      } else {
        // Clamp to total — camera gets one frame at progress=1.0 to land on the snapshot
        objectApi.patchState({
          cinemaPlayback: { playing: true, time: total, looping: false },
          _playbackFinishing: true,
        });
        return;
      }
    }

    objectApi.patchState({
      cinemaPlayback: { playing: true, time: t, looping: pb.looping },
    });

    // ── Effects playback tick ──
    tickEffects(t, objectApi);
  }
}

// ═══════════════════════════════════════════════════
//  EFFECTS PLAYBACK — fires/stops effects based on playhead
// ═══════════════════════════════════════════════════
export function tickEffects(playhead, objectApi) {
  var s = objectApi.getState();
  var effects = s.cinemaEffects || [];
  if (effects.length === 0) return;

  var fired = s._fxFired || {};   // { effectId: true } — instants that already triggered
  var active = s._fxActive || {}; // { effectId: true } — sustained effects currently on
  var firedChanged = false;
  var activeChanged = false;

  for (var i = 0; i < effects.length; i++) {
    var fx = effects[i];
    var def = FX_TYPES[fx.type];
    if (!def) continue;

    var fxStart = fx.time ?? 0;

    if (def.instant) {
      // Fire once when playhead crosses the trigger time
      if (playhead >= fxStart && !fired[fx.id]) {
        fireEffect(objectApi, fx);
        fired[fx.id] = true;
        firedChanged = true;
      }
      // Reset if playhead loops back before the trigger
      if (playhead < fxStart && fired[fx.id]) {
        delete fired[fx.id];
        firedChanged = true;
      }
    } else {
      // Sustained: active while playhead is within [start, start+totalWindow]
      // For fade/colorWash: total = inTime(duration) + hold + outTime
      // For cinemaText: total = fadeInDuration + hold(duration) + fadeOutDuration
      var fxHold = 0;
      var fxOutTime = 0;
      var fxInExtra = 0;
      if (fx.type === 'fade' || fx.type === 'colorWash') {
        var fxp = fx.params || {};
        fxHold = fxp.hold || 0;
        fxOutTime = fxp.fadeOut ? (fxp.fadeOutDuration || fx.duration || 2) : 0;
      } else if (fx.type === 'cinemaText') {
        var fxp2 = fx.params || {};
        fxInExtra = (fxp2.fadeIn !== false) ? (fxp2.fadeInDuration || 1) : 0;
        fxOutTime = fxp2.fadeOut ? (fxp2.fadeOutDuration || 1) : 0;
      }
      var fxEnd = fxStart + fxInExtra + (fx.duration || 2) + fxHold + fxOutTime;
      // Looping music stays active for entire playback
      var isLoopMusic = fx.type === 'musicShift' && (fx.params && fx.params.loop !== false);
      var isInfinite = (fx.type === 'colorWash' || fx.type === 'turbulence') && (fx.params && fx.params.infinite);
      var shouldBeActive = (isLoopMusic || isInfinite) ? (playhead >= fxStart) : (playhead >= fxStart && playhead < fxEnd);

      if (shouldBeActive && !active[fx.id]) {
        fireEffect(objectApi, fx);
        active[fx.id] = true;
        activeChanged = true;
      } else if (!shouldBeActive && active[fx.id]) {
        stopSustainedEffect(objectApi, fx);
        delete active[fx.id];
        activeChanged = true;
      }
    }
  }

  if (firedChanged || activeChanged) {
    objectApi.patchState({ _fxFired: fired, _fxActive: active });
  }

  // Per-frame updates for custom effects (fade + colorWash with envelope: ramp in → hold → ramp out)
  // duration = ramp-in time, hold = peak time, fadeOutDuration = ramp-out time
  for (var ci = 0; ci < effects.length; ci++) {
    var cfx = effects[ci];
    if (cfx.type === 'fade' && active[cfx.id]) {
      var cfxStart = cfx.time ?? 0;
      var cp = cfx.params || {};
      var hasFadeIn = cp.fadeIn !== false;
      var hasFadeOut = !!cp.fadeOut;
      var inTime = hasFadeIn ? Math.max(0.01, cfx.duration || 2) : 0;
      var holdTime = cp.hold || 0;
      var outTime = hasFadeOut ? Math.max(0.01, cp.fadeOutDuration || cfx.duration || 2) : 0;
      var elapsed = playhead - cfxStart;
      var opacity;
      if (elapsed < inTime) {
        // Phase 1: ramp in
        opacity = elapsed / inTime;
      } else if (elapsed < inTime + holdTime) {
        // Phase 2: hold at peak
        opacity = 1;
      } else if (hasFadeOut && elapsed < inTime + holdTime + outTime) {
        // Phase 3: ramp out
        opacity = 1 - ((elapsed - inTime - holdTime) / outTime);
      } else {
        // Past end — if we had fadeOut, we're at 0; otherwise stay at 1
        opacity = hasFadeOut ? 0 : 1;
      }
      opacity = Math.max(0, Math.min(1, opacity));
      objectApi.patchState({
        _cinemaFadeOpacity: opacity,
        _cinemaFadeColor: cp.color || 'rgba(0,0,0,1)',
      });
    }
    if (cfx.type === 'colorWash' && active[cfx.id]) {
      var cwStart = cfx.time ?? 0;
      var wp = cfx.params || {};
      var cwIsInfinite = !!wp.infinite;
      var cwHasFadeIn = wp.fadeIn !== false;
      var cwHasFadeOut = !cwIsInfinite && !!wp.fadeOut;
      var cwInTime = cwHasFadeIn ? Math.max(0.01, cfx.duration || 2) : 0;
      var cwHoldTime = wp.hold || 0;
      var cwOutTime = cwHasFadeOut ? Math.max(0.01, wp.fadeOutDuration || cfx.duration || 2) : 0;
      var cwElapsed = playhead - cwStart;
      var cwMaxOpacity = (wp.opacity != null) ? wp.opacity : 0.5;
      var cwOpacity;
      if (cwIsInfinite) {
        // Infinite: ramp in then hold at max forever
        if (cwElapsed < cwInTime) {
          cwOpacity = (cwElapsed / cwInTime) * cwMaxOpacity;
        } else {
          cwOpacity = cwMaxOpacity;
        }
      } else if (cwElapsed < cwInTime) {
        cwOpacity = (cwElapsed / cwInTime) * cwMaxOpacity;
      } else if (cwElapsed < cwInTime + cwHoldTime) {
        cwOpacity = cwMaxOpacity;
      } else if (cwHasFadeOut && cwElapsed < cwInTime + cwHoldTime + cwOutTime) {
        cwOpacity = cwMaxOpacity * (1 - ((cwElapsed - cwInTime - cwHoldTime) / cwOutTime));
      } else {
        cwOpacity = cwHasFadeOut ? 0 : cwMaxOpacity;
      }
      cwOpacity = Math.max(0, Math.min(1, cwOpacity));
      objectApi.patchState({
        _cinemaWashOpacity: cwOpacity,
        _cinemaWashColor: wp.color || 'rgba(40,60,120,0.8)',
      });
    }
    if (cfx.type === 'cinemaText' && active[cfx.id]) {
      // cinemaText envelope: [fadeIn] [hold/duration] [fadeOut]
      // duration = hold time (core block), fadeIn/fadeOut are extensions
      var ctStart = cfx.time ?? 0;
      var ctp = cfx.params || {};
      var ctHasFadeIn = ctp.fadeIn !== false;
      var ctHasFadeOut = !!ctp.fadeOut;
      var ctInTime = ctHasFadeIn ? Math.max(0.01, ctp.fadeInDuration || 1) : 0;
      var ctHoldTime = Math.max(0, cfx.duration || 2);
      var ctOutTime = ctHasFadeOut ? Math.max(0.01, ctp.fadeOutDuration || 1) : 0;
      var ctElapsed = playhead - ctStart;
      var ctOpacity;
      if (ctElapsed < ctInTime) {
        // Phase 1: ramp in
        ctOpacity = ctElapsed / ctInTime;
      } else if (ctElapsed < ctInTime + ctHoldTime) {
        // Phase 2: hold at peak
        ctOpacity = 1;
      } else if (ctHasFadeOut && ctElapsed < ctInTime + ctHoldTime + ctOutTime) {
        // Phase 3: ramp out
        ctOpacity = 1 - ((ctElapsed - ctInTime - ctHoldTime) / ctOutTime);
      } else {
        // Past end — if we had fadeOut, we're at 0; otherwise stay at 1
        ctOpacity = ctHasFadeOut ? 0 : 1;
      }
      ctOpacity = Math.max(0, Math.min(1, ctOpacity));
      objectApi.patchState({
        _cinemaTextOpacity: ctOpacity,
        _cinemaTextContent: ctp.text || 'TITLE TEXT',
        _cinemaTextFont: ctp.font || 'Geist Pixel Square',
        _cinemaTextFontSize: ctp.fontSize || 48,
        _cinemaTextColor: ctp.color || 'rgba(255,255,255,1)',
        _cinemaTextPosX: ctp.posX != null ? ctp.posX : 50,
        _cinemaTextPosY: ctp.posY != null ? ctp.posY : 50,
      });
    }
  }
}

export function onInput(objectApi, input) {
  const s = objectApi.getState();

  // ── Toggle panel (F2) ──
  if (input.actions['cinema:toggle']) {
    const opening = !s.cinemaOpen;
    if (!opening && s.possessedNodeId) releasePossession(objectApi);
    objectApi.patchState({ cinemaOpen: opening });
    return;
  }

  // ── Close panel ──
  if (input.actions['cinema:close']) {
    if (s.possessedNodeId) releasePossession(objectApi);
    objectApi.patchState({ cinemaOpen: false });
    return;
  }

  // ── UI state (selections, menus) — routed through state because the v4.5
  // UI worker can't share `window._cinemaXxx` globals with the inline onclick
  // handlers that run in the browser. Render reads localPlayer.state.cinemaUi.
  if (input.actions['cinema:uiSet'] && input.actionData?.['cinema:uiSet']) {
    var uiUpd = input.actionData['cinema:uiSet'];
    var uiKey = uiUpd.key;
    if (typeof uiKey === 'string') {
      var prevUi = s.cinemaUi || {};
      var nextUi = Object.assign({}, prevUi);
      nextUi[uiKey] = uiUpd.value;
      // Mutually-exclusive pickers: opening one closes the other
      if (uiKey === 'audioPicker' && uiUpd.value) nextUi.colorPicker = false;
      if (uiKey === 'colorPicker' && uiUpd.value) nextUi.audioPicker = false;
      objectApi.patchState({ cinemaUi: nextUi });
    }
  }

  // ── Panel drag: throttled position updates from inline browser-side handler ──
  if (input.actions['cinema:panelMove'] && input.actionData?.['cinema:panelMove']) {
    var pm = input.actionData['cinema:panelMove'];
    if (typeof pm.x === 'number' && typeof pm.y === 'number') {
      var prevUiP = s.cinemaUi || {};
      objectApi.patchState({ cinemaUi: Object.assign({}, prevUiP, { panelX: pm.x, panelY: pm.y }) });
    }
  }

  // ── Settings ──
  if (input.actions['cinema:toggleSettings']) {
    objectApi.patchState({ cinemaSettingsOpen: !s.cinemaSettingsOpen });
  }
  if (input.actions['cinema:setSkippable'] && input.actionData?.['cinema:setSkippable']) {
    var skipVal = input.actionData['cinema:setSkippable'].value;
    objectApi.patchState({ cinemaSkippable: !!skipVal });
  }
  if (input.actions['cinema:setShowGizmos'] && input.actionData?.['cinema:setShowGizmos']) {
    var gizVal = input.actionData['cinema:setShowGizmos'].value;
    objectApi.patchState({ cinemaShowGizmos: !!gizVal });
  }

  // ── Node editing actions (work during possession AND outside) ──
  if (input.actions['cinema:setStep'] && input.actionData?.['cinema:setStep']) {
    const { step } = input.actionData['cinema:setStep'];
    objectApi.patchState({ cinemaStepSize: step });
  }

  if (input.actions['cinema:nudgePos'] && input.actionData?.['cinema:nudgePos']) {
    const { nodeId, axis, delta } = input.actionData['cinema:nudgePos'];
    const nodes = (s.cinemaNodes || []).map(n => {
      if (n.id !== nodeId) return n;
      const pos = { ...n.position };
      pos[axis] = Math.round((pos[axis] + delta) * 100) / 100;
      return { ...n, position: pos };
    });
    objectApi.patchState({ cinemaNodes: nodes });
  }

  if (input.actions['cinema:setPosAxis'] && input.actionData?.['cinema:setPosAxis']) {
    const { nodeId, axis, value } = input.actionData['cinema:setPosAxis'];
    const nodes = (s.cinemaNodes || []).map(n => {
      if (n.id !== nodeId) return n;
      const pos = { ...n.position };
      pos[axis] = Math.round(value * 100) / 100;
      return { ...n, position: pos };
    });
    objectApi.patchState({ cinemaNodes: nodes });
  }

  if (input.actions['cinema:nudgeYaw'] && input.actionData?.['cinema:nudgeYaw']) {
    const { nodeId, delta } = input.actionData['cinema:nudgeYaw'];
    const nodes = (s.cinemaNodes || []).map(n => {
      if (n.id !== nodeId) return n;
      let yaw = n.yaw + delta;
      yaw = ((yaw % 360) + 360) % 360;
      return { ...n, yaw: Math.round(yaw * 100) / 100 };
    });
    objectApi.patchState({ cinemaNodes: nodes });
  }

  if (input.actions['cinema:nudgePitch'] && input.actionData?.['cinema:nudgePitch']) {
    const { nodeId, delta } = input.actionData['cinema:nudgePitch'];
    const nodes = (s.cinemaNodes || []).map(n => {
      if (n.id !== nodeId) return n;
      let pitch = n.pitch + delta;
      pitch = Math.max(-89, Math.min(89, pitch));
      return { ...n, pitch: Math.round(pitch * 100) / 100 };
    });
    objectApi.patchState({ cinemaNodes: nodes });
  }

  if (input.actions['cinema:setYaw'] && input.actionData?.['cinema:setYaw']) {
    const { nodeId, value } = input.actionData['cinema:setYaw'];
    let yaw = ((value % 360) + 360) % 360;
    const nodes = (s.cinemaNodes || []).map(n =>
      n.id !== nodeId ? n : { ...n, yaw: Math.round(yaw * 100) / 100 }
    );
    objectApi.patchState({ cinemaNodes: nodes });
  }

  if (input.actions['cinema:setPitch'] && input.actionData?.['cinema:setPitch']) {
    const { nodeId, value } = input.actionData['cinema:setPitch'];
    let pitch = Math.max(-89, Math.min(89, value));
    const nodes = (s.cinemaNodes || []).map(n =>
      n.id !== nodeId ? n : { ...n, pitch: Math.round(pitch * 100) / 100 }
    );
    objectApi.patchState({ cinemaNodes: nodes });
  }

  if (input.actions['cinema:rename'] && input.actionData?.['cinema:rename']) {
    const { nodeId, name } = input.actionData['cinema:rename'];
    if (!name || !name.trim()) return;
    objectApi.patchState({ cinemaNodes: (s.cinemaNodes || []).map(n => n.id === nodeId ? { ...n, name: name.trim() } : n) });
  }

  // ── Effects actions ──
  if (input.actions['cinema:fxAdd'] && input.actionData?.['cinema:fxAdd']) {
    var fxData = input.actionData['cinema:fxAdd'];
    var fxType = fxData.type;
    var def = FX_TYPES[fxType];
    if (def) {
      var effects = [...(s.cinemaEffects || [])];
      var newFx = {
        id: objectApi.uniqueId('fx-'),
        type: fxType,
        time: fxData.time ?? 0,
        duration: def.instant ? 0 : (fxData.duration ?? 2),
        params: { ...def.defaults, ...(fxData.params || {}) },
      };
      effects.push(newFx);
      // Close the add-fx menu and select the new effect
      var uiAfterAdd = Object.assign({}, s.cinemaUi || {}, { fxMenu: false, selFx: newFx.id });
      objectApi.patchState({ cinemaEffects: effects, cinemaUi: uiAfterAdd });
    }
  }

  if (input.actions['cinema:fxRemove'] && input.actionData?.['cinema:fxRemove']) {
    var fxId = input.actionData['cinema:fxRemove'].id;
    var effects = (s.cinemaEffects || []).filter(function(f) { return f.id !== fxId; });
    var uiAfterRm = Object.assign({}, s.cinemaUi || {});
    if (uiAfterRm.selFx === fxId) uiAfterRm.selFx = null;
    objectApi.patchState({ cinemaEffects: effects, cinemaUi: uiAfterRm });
  }

  if (input.actions['cinema:fxUpdate'] && input.actionData?.['cinema:fxUpdate']) {
    var upd = input.actionData['cinema:fxUpdate'];
    var fxId = upd.id;
    var effects = (s.cinemaEffects || []).map(function(f) {
      if (f.id !== fxId) return f;
      var updated = { ...f };
      if (upd.time != null) updated.time = upd.time;
      if (upd.duration != null) updated.duration = upd.duration;
      if (upd.params) updated.params = { ...f.params, ...upd.params };
      return updated;
    });
    objectApi.patchState({ cinemaEffects: effects });
  }

  if (input.actions['cinema:fxClear']) {
    objectApi.patchState({ cinemaEffects: [], _fxFired: null, _fxActive: null });
  }

  // ── Sequence timeline actions (work during possession AND outside) ──
  if (input.actions['cinema:seqAdd'] && input.actionData?.['cinema:seqAdd']) {
    const { nodeId } = input.actionData['cinema:seqAdd'];
    const node = (s.cinemaNodes || []).find(n => n.id === nodeId);
    if (node) {
      const seq = [...(s.cinemaSequence || [])];
      seq.push({ nodeId, hold: 2, transition: 1, easing: 'easeInOutCubic' });
      objectApi.patchState({ cinemaSequence: seq });
    }
  }

  if (input.actions['cinema:seqRemove'] && input.actionData?.['cinema:seqRemove']) {
    const { index } = input.actionData['cinema:seqRemove'];
    const seq = [...(s.cinemaSequence || [])];
    if (index >= 0 && index < seq.length) {
      seq.splice(index, 1);
      objectApi.patchState({ cinemaSequence: seq });
    }
  }

  if (input.actions['cinema:seqMove'] && input.actionData?.['cinema:seqMove']) {
    const { from, to } = input.actionData['cinema:seqMove'];
    const seq = [...(s.cinemaSequence || [])];
    if (from >= 0 && from < seq.length && to >= 0 && to < seq.length && from !== to) {
      const [item] = seq.splice(from, 1);
      seq.splice(to, 0, item);
      objectApi.patchState({ cinemaSequence: seq });
    }
  }

  if (input.actions['cinema:seqHold'] && input.actionData?.['cinema:seqHold']) {
    const { index, value } = input.actionData['cinema:seqHold'];
    const seq = [...(s.cinemaSequence || [])];
    if (index >= 0 && index < seq.length) {
      seq[index] = { ...seq[index], hold: Math.max(0, value) };
      objectApi.patchState({ cinemaSequence: seq });
    }
  }

  if (input.actions['cinema:seqTransition'] && input.actionData?.['cinema:seqTransition']) {
    const { index, value } = input.actionData['cinema:seqTransition'];
    const seq = [...(s.cinemaSequence || [])];
    if (index >= 0 && index < seq.length) {
      seq[index] = { ...seq[index], transition: Math.max(0, value) };
      objectApi.patchState({ cinemaSequence: seq });
    }
  }

  if (input.actions['cinema:seqEasing'] && input.actionData?.['cinema:seqEasing']) {
    const { index, value } = input.actionData['cinema:seqEasing'];
    const seq = [...(s.cinemaSequence || [])];
    if (index >= 0 && index < seq.length) {
      seq[index] = { ...seq[index], easing: value };
      objectApi.patchState({ cinemaSequence: seq });
    }
  }

  if (input.actions['cinema:seqEnding'] && input.actionData?.['cinema:seqEnding']) {
    const { index } = input.actionData['cinema:seqEnding'];
    const seq = [...(s.cinemaSequence || [])];
    if (index >= 0 && index < seq.length) {
      const wasEnding = !!seq[index].ending;
      seq[index] = { ...seq[index], ending: !wasEnding, transition: wasEnding ? 1 : 0 };
      objectApi.patchState({ cinemaSequence: seq });
    }
  }

  if (input.actions['cinema:play']) {
    const seq = s.cinemaSequence || [];
    if (seq.length < 2) {
      objectApi.toast('Need at least 2 shots in the sequence', { duration: 2 });
    } else {
      const pb = s.cinemaPlayback;
      const wasPlaying = pb && pb.playing;
      const wasPaused = pb && !pb.playing && pb.time > 0;
      // If paused, resume from same time. Otherwise start fresh.
      const startTime = wasPaused ? (pb.time ?? 0) : 0;
      const looping = pb ? (pb.looping ?? false) : false;

      // Detect pre-roll black: a fade effect at t=0 with fadeIn:false (starts fully opaque).
      // When present, we need the black overlay to render for a full frame BEFORE the
      // camera moves to shot 1 — otherwise the player sees a 1-frame flash of the new
      // camera position before the black covers it.
      // Strategy: set only the fade overlay this tick, then start playback next tick.
      var needsPreRollBlack = false;
      if (!wasPlaying && !wasPaused) {
        var efx = s.cinemaEffects || [];
        for (var ei = 0; ei < efx.length; ei++) {
          var e = efx[ei];
          if (e.type === 'fade' && (e.time ?? 0) <= 0) {
            var ep = e.params || {};
            if (ep.fadeIn === false) {
              needsPreRollBlack = true;
              break;
            }
          }
        }
      }

      if (needsPreRollBlack) {
        // Phase 1: Establish the black overlay NOW, but do NOT start playback yet.
        // This ensures the overlay renders for one full frame before the camera moves.
        var preRollPatch = { _cinemaFadeOpacity: 1 };
        // Also pick up color from the fade effect
        var efx2 = s.cinemaEffects || [];
        for (var ei2 = 0; ei2 < efx2.length; ei2++) {
          var e2 = efx2[ei2];
          if (e2.type === 'fade' && (e2.time ?? 0) <= 0) {
            var ep2 = e2.params || {};
            if (ep2.fadeIn === false) {
              preRollPatch._cinemaFadeColor = ep2.color || 'rgba(0,0,0,1)';
              break;
            }
          }
        }
        // Also check for instant colorWash at t=0
        for (var ei3 = 0; ei3 < efx2.length; ei3++) {
          var e3 = efx2[ei3];
          if (e3.type === 'colorWash' && (e3.time ?? 0) <= 0) {
            var ewp3 = e3.params || {};
            if (ewp3.fadeIn === false) {
              preRollPatch._cinemaWashOpacity = (ewp3.opacity != null) ? ewp3.opacity : 0.5;
              preRollPatch._cinemaWashColor = ewp3.color || 'rgba(40,60,120,0.8)';
            }
          }
        }
        // Snapshot the return camera before we switch to custom
        var camSnapPre = objectApi.getCamera();
        var returnCamPre = camSnapPre ? { x: camSnapPre.position.x, y: camSnapPre.position.y, z: camSnapPre.position.z, yaw: camSnapPre.yaw, pitch: camSnapPre.pitch } : null;
        preRollPatch._returnCamera = returnCamPre;
        objectApi.patchState(preRollPatch);
        // Take over camera — pointerLock: false so the skip button is clickable
        objectApi.setCamera({ kind: 'custom', pointerLock: false, orientation: { source: 'script' } }, { mode: 'merge' });
        objectApi.showCursor();
        objectApi.playSound('cdn/sfx-ui-futuristic-confirm.mp3', { volume: 0.3 });

        // Phase 2: Next tick — black overlay is rendered, safe to start playback.
        objectApi.runInTicks(1, function() {
          objectApi.patchState({
            cinemaPlayback: { playing: true, time: startTime, looping: looping },
            cinemaPlaying: true,
            _fxActive: null,
            _fxFired: null,
          });
        });
      } else {
        // No pre-roll black — start immediately (resume from pause, or no fade at t=0)
        var playPatch = {
          cinemaPlayback: { playing: true, time: startTime, looping: looping },
          cinemaPlaying: true,
        };
        // Pre-apply any instant effects at t=0 that DO have fadeIn (they start at 0 opacity, no flash risk)
        if (!wasPlaying && !wasPaused) {
          var efx4 = s.cinemaEffects || [];
          for (var ei4 = 0; ei4 < efx4.length; ei4++) {
            var e4 = efx4[ei4];
            if (e4.type === 'colorWash' && (e4.time ?? 0) <= 0) {
              var ewp4 = e4.params || {};
              if (ewp4.fadeIn === false) {
                playPatch._cinemaWashOpacity = (ewp4.opacity != null) ? ewp4.opacity : 0.5;
                playPatch._cinemaWashColor = ewp4.color || 'rgba(40,60,120,0.8)';
              }
            }
          }
        }
        objectApi.patchState(playPatch);
        if (!wasPlaying && !wasPaused) {
          // Fresh start — snapshot where the camera IS right now so we can return here
          var camSnap = objectApi.getCamera();
          var returnCam = camSnap ? { x: camSnap.position.x, y: camSnap.position.y, z: camSnap.position.z, yaw: camSnap.yaw, pitch: camSnap.pitch } : null;
          objectApi.patchState({ _returnCamera: returnCam });
          // Take over camera — pointerLock: false so the skip button is clickable
          objectApi.setCamera({ kind: 'custom', pointerLock: false, orientation: { source: 'script' } }, { mode: 'merge' });
          objectApi.showCursor();
          objectApi.playSound('cdn/sfx-ui-futuristic-confirm.mp3', { volume: 0.3 });
        }
      }
    }
  }

  if (input.actions['cinema:pause']) {
    const pb = s.cinemaPlayback;
    if (pb && pb.playing) {
      objectApi.patchState({
        cinemaPlayback: { playing: false, time: pb.time ?? 0, looping: pb.looping ?? false },
      });
    }
  }

  if (input.actions['cinema:stop']) {
    stopPlayback(objectApi);
  }

  // Hold-to-skip: onInput just records whether space is held.
  // Actual accumulation happens in update() for smooth, reliable dt.
  var pb = s.cinemaPlayback;
  // Skippable is OFF unless the director turns it on.
  var skippable = s.cinemaSkippable === true;
  if (pb && pb.playing && skippable) {
    if (input.actions.cinemaSkip) {
      if (!s._cinemaSkipHolding) objectApi.patchState({ _cinemaSkipHolding: true });
    } else {
      if (s._cinemaSkipHolding || (s._cinemaSkipHold || 0) > 0) {
        objectApi.patchState({ _cinemaSkipHolding: false, _cinemaSkipHold: 0 });
      }
    }
  }

  if (input.actions['cinema:scrub'] && input.actionData?.['cinema:scrub']) {
    const { time } = input.actionData['cinema:scrub'];
    const pb = s.cinemaPlayback;
    const seq = s.cinemaSequence || [];
    const looping = pb ? (pb.looping ?? false) : false;
    const total = computeSequenceDuration(seq, looping);
    const clampedTime = Math.max(0, Math.min(time, total));
    if (!pb) {
      // Start scrubbing — activate camera but paused
      objectApi.patchState({
        cinemaPlayback: { playing: false, time: clampedTime, looping },
        cinemaPlaying: true,
      });
      objectApi.setCamera({ kind: 'custom', pointerLock: false, orientation: { source: 'script' } }, { mode: 'merge' });
      objectApi.showCursor();
    } else {
      objectApi.patchState({
        cinemaPlayback: { playing: pb.playing, time: clampedTime, looping: pb.looping ?? false },
      });
    }
  }

  if (input.actions['cinema:loop']) {
    const pb = s.cinemaPlayback;
    const looping = pb ? !(pb.looping ?? false) : true;
    if (pb) {
      objectApi.patchState({
        cinemaPlayback: { ...pb, looping },
      });
    } else {
      objectApi.patchState({
        cinemaPlayback: { playing: false, time: 0, looping },
      });
    }
  }

  // ── Possession-specific: release + delete during possess ──
  if (s.possessedNodeId) {
    if (input.actions['cinema:release']) releasePossession(objectApi);
    if (input.actions['cinema:delete'] && input.actionData?.['cinema:delete']) {
      const { nodeId } = input.actionData['cinema:delete'];
      const nodes = (s.cinemaNodes || []).filter(n => n.id !== nodeId);
      if (s.possessedNodeId === nodeId) releasePossession(objectApi);
      objectApi.patchState({ cinemaNodes: nodes });
    }
    // Allow switching directly to another node while already possessing
    if (input.actions['cinema:possess'] && input.actionData?.['cinema:possess']) {
      const { nodeId } = input.actionData['cinema:possess'];
      const node = (s.cinemaNodes || []).find(n => n.id === nodeId);
      if (node) {
        objectApi.patchState({ possessedNodeId: nodeId });
        // Script owns the framing while possessing — mouse look must not orbit it,
        // and the cursor stays free so the panel's RLS button is clickable.
        objectApi.setCamera({
          kind: 'custom',
          pointerLock: false,
          orientation: { source: 'script' },
        }, { mode: 'merge' });
        objectApi.showCursor();
        objectApi.playSound('cdn/sfx-ui-futuristic-confirm.mp3', { volume: 0.3 });
      }
    }
    // The library stays reachable while possessing — otherwise an open library
    // panel is stuck open (and its buttons dead) until you release the shot.
    const libAction = input.actions['cinema:libOpen'] || input.actions['cinema:libSave']
      || input.actions['cinema:libLoad'] || input.actions['cinema:libDelete']
      || input.actions['cinema:libImport'];
    if (!libAction) return;
  }

  if (input.actions['cinema:stamp']) {
    const cam = objectApi.getCamera();
    if (!cam) { objectApi.toast('No camera data yet', { duration: 2 }); return; }
    const nodes = s.cinemaNodes || [];
    let yaw = cam.yaw % 360;
    if (yaw < 0) yaw += 360;
    const newNode = {
      id: objectApi.uniqueId('cn-'),
      name: 'Shot ' + (nodes.length + 1),
      position: {
        x: Math.round(cam.position.x * 100) / 100,
        y: Math.round(cam.position.y * 100) / 100,
        z: Math.round(cam.position.z * 100) / 100,
      },
      yaw: Math.round(yaw * 100) / 100,
      pitch: Math.round(cam.pitch * 100) / 100,
    };
    objectApi.patchState({ cinemaNodes: [...nodes, newNode] });
    objectApi.toast('Snapshot: ' + newNode.name, { duration: 1.5 });
  }

  if (input.actions['cinema:delete'] && input.actionData?.['cinema:delete']) {
    const { nodeId } = input.actionData['cinema:delete'];
    objectApi.patchState({ cinemaNodes: (s.cinemaNodes || []).filter(n => n.id !== nodeId) });
  }

  if (input.actions['cinema:possess'] && input.actionData?.['cinema:possess']) {
    const { nodeId } = input.actionData['cinema:possess'];
    const node = (s.cinemaNodes || []).find(n => n.id === nodeId);
    if (!node) return;
    // Camera behavior reads possessedNodeId + cinemaNodes from player state directly.
    // No patchCamera needed — runtime camera state is a different channel from spec state.
    objectApi.patchState({ possessedNodeId: nodeId });
    // Script owns the framing while possessing — mouse look must not orbit it,
    // and the cursor stays free so the panel's RLS button is clickable.
    objectApi.setCamera({
      kind: 'custom',
      pointerLock: false,
      orientation: { source: 'script' },
    }, { mode: 'merge' });
    objectApi.showCursor();
    objectApi.playSound('cdn/sfx-ui-futuristic-confirm.mp3', { volume: 0.3 });
  }

  // ═══════════════════════════════════════════════════
  //  CLIP LIBRARY — vault save/load/delete
  // ═══════════════════════════════════════════════════

  if (input.actions['cinema:libOpen']) toggleLibrary(objectApi, s);

  if (input.actions['cinema:libSave'] && input.actionData?.['cinema:libSave']) {
    const clipName = (input.actionData['cinema:libSave'].name || '').trim() || 'Untitled Clip';
    const newClip = {
      id: objectApi.uniqueId('clip-'),
      name: clipName,
      savedAt: objectApi.getTick(),
      nodes: JSON.parse(JSON.stringify(s.cinemaNodes || [])),
      sequence: JSON.parse(JSON.stringify(s.cinemaSequence || [])),
      effects: JSON.parse(JSON.stringify(s.cinemaEffects || [])),
      skippable: s.cinemaSkippable === true,
    };
    objectApi.patchState({ cinemaLibLoading: true });
    persistClip(objectApi, newClip, 'Saved: ' + clipName);
  }

  if (input.actions['cinema:libLoad'] && input.actionData?.['cinema:libLoad']) {
    const clipId = input.actionData['cinema:libLoad'].id;
    const library = s.cinemaLibrary || [];
    const clip = library.find(function(c) { return c.id === clipId; });
    if (clip) {
      // Release possession if active
      if (s.possessedNodeId) releasePossession(objectApi);
      // Stop playback if active
      if (s.cinemaPlayback && s.cinemaPlayback.playing) stopPlayback(objectApi);
      objectApi.patchState({
        cinemaNodes: JSON.parse(JSON.stringify(clip.nodes || [])),
        cinemaSequence: JSON.parse(JSON.stringify(clip.sequence || [])),
        cinemaEffects: JSON.parse(JSON.stringify(clip.effects || [])),
        cinemaSkippable: clip.skippable === true,
        _fxFired: null,
        _fxActive: null,
      });
      objectApi.toast('Loaded: ' + clip.name, { duration: 2 });
      objectApi.playSound('cdn/sfx-ui-futuristic-confirm.mp3', { volume: 0.3 });
    }
  }

  if (input.actions['cinema:libDelete']) {
    var deleteData = input.actionData ? input.actionData['cinema:libDelete'] : null;
    if (!deleteData || !deleteData.id) { objectApi.toast('Delete: no clip ID received', { duration: 2 }); return; }
    const clipId = deleteData.id;
    objectApi.patchState({ cinemaLibLoading: true });
    removeClip(objectApi, clipId);
  }

  if (input.actions['cinema:libImport'] && input.actionData?.['cinema:libImport']) {
    const raw = (input.actionData['cinema:libImport'].data || '').trim();
    if (!raw) { objectApi.toast('Nothing to import', { duration: 1.5 }); return; }
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      objectApi.toast('Invalid clip data', { duration: 2 }); return;
    }
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      objectApi.toast('Missing node data', { duration: 2 }); return;
    }
    const importedClip = {
      id: objectApi.uniqueId('clip-'),
      name: parsed.name || 'Imported Clip',
      savedAt: objectApi.getTick(),
      nodes: parsed.nodes,
      sequence: parsed.sequence || [],
      effects: parsed.effects || [],
    };
    objectApi.patchState({ cinemaLibLoading: true });
    persistClip(objectApi, importedClip, 'Imported: ' + importedClip.name);
  }
}

// ═══════════════════════════════════════════════════
//  CLIP VAULT — durable rows in cinema_clips
//  Every vault call carries its own CREATE TABLE IF NOT EXISTS so the mod
//  works in a host game that has no scripts/db.js migration of its own.
// ═══════════════════════════════════════════════════

export function clipFromRow(r) {
  var d = {};
  try { d = JSON.parse(r.data || '{}'); } catch (e) { d = {}; }
  return {
    id: r.id,
    name: r.name,
    savedAt: r.saved_at,
    nodes: d.nodes || [],
    sequence: d.sequence || [],
    effects: d.effects || [],
    skippable: d.skippable === true,
  };
}

export function toggleLibrary(objectApi, s) {
  const wasOpen = !!s.cinemaLibOpen;
  objectApi.patchState({ cinemaLibOpen: !wasOpen });
  if (!wasOpen) {
    // Opening — pull the clip list from the vault
    objectApi.patchState({ cinemaLibLoading: true });
    refreshLibrary(objectApi);
  }
}

export async function refreshLibrary(objectApi, toastText) {
  try {
    const res = await objectApi.sql`
      CREATE TABLE IF NOT EXISTS cinema_clips (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Untitled Clip',
        saved_at INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL DEFAULT '{}'
      );
      SELECT id, name, saved_at, data FROM cinema_clips ORDER BY saved_at DESC, name ASC`;
    const rows = (res && res.rows) || [];
    objectApi.patchState({ cinemaLibrary: rows.map(clipFromRow), cinemaLibLoading: false });
    if (toastText) {
      objectApi.toast(toastText, { duration: 2 });
      objectApi.playSound('cdn/sfx-ui-futuristic-confirm.mp3', { volume: 0.3 });
    }
  } catch (e) {
    objectApi.patchState({ cinemaLibLoading: false });
    objectApi.toast('Vault unreachable', { duration: 2 });
    objectApi.log('cinema vault read failed: ' + (e && e.message ? e.message : e));
  }
}

export async function persistClip(objectApi, clip, toastText) {
  try {
    await objectApi.sql`
      CREATE TABLE IF NOT EXISTS cinema_clips (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Untitled Clip',
        saved_at INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL DEFAULT '{}'
      );
      INSERT INTO cinema_clips (id, name, saved_at, data)
      VALUES (${clip.id}, ${clip.name}, ${clip.savedAt}, ${JSON.stringify(clip)})
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, saved_at = excluded.saved_at, data = excluded.data`;
    await refreshLibrary(objectApi, toastText);
  } catch (e) {
    objectApi.patchState({ cinemaLibLoading: false });
    objectApi.toast('Save failed', { duration: 2 });
    objectApi.log('cinema vault write failed: ' + (e && e.message ? e.message : e));
  }
}

export async function removeClip(objectApi, clipId) {
  try {
    await objectApi.sql`
      CREATE TABLE IF NOT EXISTS cinema_clips (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Untitled Clip',
        saved_at INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL DEFAULT '{}'
      );
      DELETE FROM cinema_clips WHERE id = ${clipId}`;
    await refreshLibrary(objectApi);
    objectApi.toast('Clip deleted', { duration: 1.5 });
  } catch (e) {
    objectApi.patchState({ cinemaLibLoading: false });
    objectApi.toast('Delete failed', { duration: 2 });
    objectApi.log('cinema vault delete failed: ' + (e && e.message ? e.message : e));
  }
}

export function releasePossession(objectApi) {
  // Camera behavior detects release via possessedNodeId becoming null.
  // It handles its own snap-back via the wasPossessing → initialized: false pattern.
  objectApi.clearCamera();
  // Hand the view back to the mouse.
  objectApi.setCamera({ kind: 'custom', pointerLock: true, orientation: { source: 'look' } }, { mode: 'merge' });
  objectApi.hideCursor();
  objectApi.patchState({ possessedNodeId: null });
}
