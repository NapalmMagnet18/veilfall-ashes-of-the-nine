// ╔══════════════════════════════════════════════════════════════╗
// ║  VFX Clip Playback — player behavior for VFX timeline      ║
// ║  Handles all vfx:* actions and playback ticking.           ║
// ║  Mirrors cinema-director.js pattern for effects playback.  ║
// ╚══════════════════════════════════════════════════════════════╝

export function getClip(objectApi) {
  var s = objectApi.getState();
  return s.vfxClip || {
    duration: 5,
    events: [],
    playhead: 0,
    playing: false,
    selectedEventId: null,
  };
}

export function setClip(objectApi, patch) {
  var clip = getClip(objectApi);
  var next = {};
  for (var k in clip) next[k] = clip[k];
  for (var k2 in patch) next[k2] = patch[k2];
  objectApi.patchState({ vfxClip: next });
}

export function cleanupSpawned(objectApi) {
  var spawned = objectApi.query({ tags: ['vfx-spawned'] });
  for (var i = 0; i < spawned.length; i++) {
    objectApi.destroy(spawned[i].id);
  }
}

export function fireEvent(objectApi, evt) {
  var clip = getClip(objectApi);
  var previewOrigin = clip.previewOrigin || { x: 0, y: 5, z: 0 };
  var pos = previewOrigin;
  var off = evt.offset || { x: 0, y: 2, z: -3 };
  var spawnPos = { x: pos.x + (off.x || 0), y: pos.y + (off.y != null ? off.y : 2), z: pos.z + (off.z != null ? off.z : -3) };
  var evtScale = evt.scale != null ? evt.scale : 1;

  if (evt.type === 'mesh') {
    var meshProps = {
      feetPosition: spawnPos,
      physics: 'static',
      scale: evtScale,
    };

    // Use custom model if provided, otherwise fallback to glowing cube
    if (evt.model && evt.model.length > 0) {
      meshProps.model = evt.model;
    } else {
      meshProps.primitive = { kind: 'box', width: 0.6, height: 0.6, depth: 0.6 };
      meshProps.material = {
        color: 'oklch(0.7 0.2 200)',
        emissive: 'oklch(0.7 0.25 200)',
        emissiveIntensity: 1.5,
        opacity: 0.85,
        transparent: true,
      };
      meshProps.light = {
        kind: 'point',
        color: 'oklch(0.7 0.2 200)',
        intensity: 2,
        distance: 6,
        decay: 2,
      };
    }

    objectApi.spawn({
      id: objectApi.uniqueId('vfx-spawn-'),
      tags: ['vfx-spawned'],
      ...meshProps,
    });
  } else if (evt.type === 'particle') {
    var preset = (evt.model && evt.model.length > 0) ? evt.model : 'magic';
    // Spawn a particle burst emitter
    objectApi.particleBurst(spawnPos, preset, {
      scale: evtScale * 1.2,
      color: 'oklch(0.8 0.2 80)',
    });
    // Also spawn a visible marker so we have something tagged
    objectApi.spawn({
      id: objectApi.uniqueId('vfx-spawn-'),
      tags: ['vfx-spawned'],
      lifetime: 3,
      feetPosition: spawnPos,
        primitive: { kind: 'sphere', radius: 0.15 * evtScale },
        material: {
          color: 'oklch(0.85 0.2 80)',
          emissive: 'oklch(0.85 0.25 80)',
          emissiveIntensity: 2,
          opacity: 0.7,
          transparent: true,
        },
        particles: {
          textures: preset,
          rate: 20,
          lifetimeMin: 0.5,
          lifetimeMax: 1.5,
          startSpeedMin: 0.5,
          startSpeedMax: 2,
          startSizeMin: 0.1 * evtScale,
          startSizeMax: 0.3 * evtScale,
          gravity: { x: 0, y: 1, z: 0 },
          shape: { kind: 'sphere', radius: 0.3 * evtScale },
          blend: 'add',
        },
        physics: 'static',
    });
  }
}

export function update(objectApi, dt) {
  var clip = getClip(objectApi);
  if (!clip.playing) return;

  var t = (clip.playhead || 0) + dt;
  var events = clip.events || [];
  var fired = objectApi.getState()._vfxFired || {};
  var firedChanged = false;

  // Fire events as playhead crosses their time
  for (var i = 0; i < events.length; i++) {
    var evt = events[i];
    if (t >= evt.time && !fired[evt.id]) {
      fireEvent(objectApi, evt);
      fired[evt.id] = true;
      firedChanged = true;
    }
  }

  if (firedChanged) {
    objectApi.patchState({ _vfxFired: fired });
  }

  // Check if playback reached the end
  if (t >= clip.duration) {
    // Stop playback
    cleanupSpawned(objectApi);
    setClip(objectApi, { playing: false, playhead: 0 });
    objectApi.patchState({ _vfxFired: {} });
    return;
  }

  setClip(objectApi, { playhead: t });
}

export function onInput(objectApi, input) {
  // ── Play ──
  if (input.actions['vfx:play']) {
    var clip = getClip(objectApi);
    if (clip.playing) return;
    cleanupSpawned(objectApi);
    objectApi.patchState({ _vfxFired: {} });
    setClip(objectApi, { playing: true, playhead: 0 });
  }

  // ── Stop ──
  if (input.actions['vfx:stop']) {
    cleanupSpawned(objectApi);
    objectApi.patchState({ _vfxFired: {} });
    setClip(objectApi, { playing: false, playhead: 0 });
  }

  // ── Scrub ──
  if (input.actions['vfx:scrub'] && input.actionData?.['vfx:scrub']) {
    var data = input.actionData['vfx:scrub'];
    var clip2 = getClip(objectApi);
    var newTime = Math.max(0, Math.min(data.time ?? 0, clip2.duration));
    // If scrubbing while playing, just update playhead; otherwise set directly
    if (!clip2.playing) {
      setClip(objectApi, { playhead: newTime });
    } else {
      // Reset fired tracking if scrubbing backward
      var fired = objectApi.getState()._vfxFired || {};
      var needsReset = false;
      var events = clip2.events || [];
      for (var i = 0; i < events.length; i++) {
        if (events[i].time > newTime && fired[events[i].id]) {
          needsReset = true;
          break;
        }
      }
      if (needsReset) {
        var newFired = {};
        for (var j = 0; j < events.length; j++) {
          if (events[j].time <= newTime && fired[events[j].id]) {
            newFired[events[j].id] = true;
          }
        }
        objectApi.patchState({ _vfxFired: newFired });
      }
      setClip(objectApi, { playhead: newTime });
    }
  }

  // ── Add Event ──
  if (input.actions['vfx:addEvent'] && input.actionData?.['vfx:addEvent']) {
    var addData = input.actionData['vfx:addEvent'];
    var clip3 = getClip(objectApi);
    var evtType = addData.type || 'mesh';
    var evtTime = addData.time != null ? addData.time : (clip3.playhead || 0);
    evtTime = Math.max(0, Math.min(evtTime, clip3.duration));
    var newId = objectApi.uniqueId('vfx-evt-');
    var newEvent = {
      id: newId,
      time: evtTime,
      type: evtType,
      label: evtType === 'mesh' ? 'Mesh' : 'Particles',
      config: {},
    };
    var newEvents = (clip3.events || []).slice();
    newEvents.push(newEvent);
    setClip(objectApi, { events: newEvents, selectedEventId: newId });
  }

  // ── Remove Event ──
  if (input.actions['vfx:removeEvent'] && input.actionData?.['vfx:removeEvent']) {
    var rmData = input.actionData['vfx:removeEvent'];
    var clip4 = getClip(objectApi);
    var rmId = rmData.id;
    var filteredEvents = (clip4.events || []).filter(function(e) { return e.id !== rmId; });
    var selId = clip4.selectedEventId === rmId ? null : clip4.selectedEventId;
    setClip(objectApi, { events: filteredEvents, selectedEventId: selId });
  }

  // ── Update Event ──
  if (input.actions['vfx:updateEvent'] && input.actionData?.['vfx:updateEvent']) {
    var upData = input.actionData['vfx:updateEvent'];
    var clip5 = getClip(objectApi);
    var updatedEvents = (clip5.events || []).map(function(e) {
      if (e.id !== upData.id) return e;
      var updated = {};
      for (var k in e) updated[k] = e[k];
      if (upData.time != null) updated.time = Math.max(0, Math.min(upData.time, clip5.duration));
      if (upData.label != null) updated.label = upData.label;
      if (upData.type != null) updated.type = upData.type;
      if (upData.model != null) updated.model = upData.model;
      if (upData.scale != null) updated.scale = Math.max(0.1, upData.scale);
      if (upData.offset != null) {
        updated.offset = {
          x: upData.offset.x != null ? upData.offset.x : (e.offset ? e.offset.x : 0),
          y: upData.offset.y != null ? upData.offset.y : (e.offset ? e.offset.y : 2),
          z: upData.offset.z != null ? upData.offset.z : (e.offset ? e.offset.z : -3),
        };
      }
      if (upData.config != null) {
        updated.config = {};
        for (var ck in e.config) updated.config[ck] = e.config[ck];
        for (var ck2 in upData.config) updated.config[ck2] = upData.config[ck2];
      }
      return updated;
    });
    setClip(objectApi, { events: updatedEvents });
  }

  // ── Set Duration ──
  if (input.actions['vfx:setDuration'] && input.actionData?.['vfx:setDuration']) {
    var durData = input.actionData['vfx:setDuration'];
    var newDur = Math.max(0.5, durData.duration ?? 5);
    setClip(objectApi, { duration: newDur });
  }

  // ── Select Event ──
  if (input.actions['vfx:selectEvent'] && input.actionData?.['vfx:selectEvent']) {
    var selData = input.actionData['vfx:selectEvent'];
    var clip6 = getClip(objectApi);
    var newSel = selData.id;
    // Toggle off if same event selected
    if (clip6.selectedEventId === newSel) newSel = null;
    setClip(objectApi, { selectedEventId: newSel });
  }

  // ── Set Preview Origin (from player position) ──
  if (input.actions['vfx:setPreviewOrigin']) {
    var playerPos = objectApi.getProperty('feetPosition');
    var rounded = {
      x: Math.round(playerPos.x * 10) / 10,
      y: Math.round(playerPos.y * 10) / 10,
      z: Math.round(playerPos.z * 10) / 10,
    };
    setClip(objectApi, { previewOrigin: rounded });
  }

  // ── Update Preview Origin (single axis) ──
  if (input.actions['vfx:updatePreviewOrigin'] && input.actionData?.['vfx:updatePreviewOrigin']) {
    var poData = input.actionData['vfx:updatePreviewOrigin'];
    var clipPO = getClip(objectApi);
    var curOrigin = clipPO.previewOrigin || { x: 0, y: 5, z: 0 };
    var newOrigin = { x: curOrigin.x, y: curOrigin.y, z: curOrigin.z };
    if (poData.axis === 'x') newOrigin.x = poData.value ?? 0;
    if (poData.axis === 'y') newOrigin.y = poData.value ?? 0;
    if (poData.axis === 'z') newOrigin.z = poData.value ?? 0;
    setClip(objectApi, { previewOrigin: newOrigin });
  }

  // ── Clear All ──
  if (input.actions['vfx:clearAll']) {
    cleanupSpawned(objectApi);
    objectApi.patchState({ _vfxFired: {} });
    setClip(objectApi, { events: [], selectedEventId: null, playing: false, playhead: 0 });
  }
}
