// Cinema Panel — Director's toolkit for cinematic camera tools
// Toggled via "cinema" admin command → localPlayer.state.cinemaOpen
// Sized for future timeline/sequence editor below the node list

// ═══════════════════════════════════════════════════
//  EFFECT TYPE UI METADATA
// ═══════════════════════════════════════════════════
var FX_UI = {
  screenShake:  { label: 'Shake',     color: 'rgba(255,80,80,0.7)',   bg: 'rgba(255,80,80,0.15)',   instant: true },
  screenFlash:  { label: 'Flash',     color: 'rgba(255,220,80,0.7)',  bg: 'rgba(255,220,80,0.15)',  instant: true },
  playSound:    { label: 'Sound',     color: 'rgba(80,255,180,0.7)',  bg: 'rgba(80,255,180,0.15)',  instant: true },
  announce:     { label: 'Announce',  color: 'rgba(200,140,255,0.7)', bg: 'rgba(200,140,255,0.15)', instant: true },
  toast:        { label: 'Toast',     color: 'rgba(180,180,255,0.7)', bg: 'rgba(180,180,255,0.15)', instant: true },
  fade:         { label: 'Fade',      color: 'rgba(20,20,40,0.8)',   bg: 'rgba(20,20,40,0.15)',   instant: false },
  turbulence:   { label: 'Turbulence',color: 'rgba(200,160,80,0.6)', bg: 'rgba(200,160,80,0.1)',  instant: false },
  colorWash:    { label: 'Color Wash',color: 'rgba(120,80,200,0.7)', bg: 'rgba(120,80,200,0.12)', instant: false },
  letterbox:    { label: 'Letterbox', color: 'rgba(0,200,255,0.5)',   bg: 'rgba(0,200,255,0.08)',   instant: false },
  vignette:     { label: 'Vignette',  color: 'rgba(100,0,200,0.5)',   bg: 'rgba(100,0,200,0.08)',   instant: false },
  slowMo:       { label: 'Slow Mo',   color: 'rgba(255,120,0,0.5)',   bg: 'rgba(255,120,0,0.08)',   instant: false },
  musicShift:   { label: 'Music',     color: 'rgba(0,255,200,0.5)',   bg: 'rgba(0,255,200,0.08)',   instant: false },
  effect:       { label: 'Filter',    color: 'rgba(255,200,0,0.5)',   bg: 'rgba(255,200,0,0.08)',   instant: false },
  cinemaText:   { label: 'Text',      color: 'rgba(255,200,100,0.7)', bg: 'rgba(255,200,100,0.12)', instant: false },
  event:        { label: 'Event',     color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.08)', instant: true },
};
var FX_TYPE_KEYS = Object.keys(FX_UI);

// ═══════════════════════════════════════════════════
//  EFFECTS TRACK BUILDER
// ═══════════════════════════════════════════════════
export function buildEffectsTrack(localPlayer, totalDuration, pbTime) {
  var effects = localPlayer.state.cinemaEffects || [];
  var ui = localPlayer.state.cinemaUi || {};
  var tq = '\u0027';

  // UI selection state lives on player state — the v4.5 UI worker can't share
  // window globals with inline onclick handlers in the browser. Inline onclicks
  // dispatch `cinema:uiSet` which the director merges into state.cinemaUi.
  var selFxId = ui.selFx || null;
  var fxMenuOpen = !!ui.fxMenu;
  // Validate selection
  var selFx = null;
  for (var vi = 0; vi < effects.length; vi++) {
    if (effects[vi].id === selFxId) { selFx = effects[vi]; break; }
  }
  if (!selFx) { selFxId = null; }

  // Helper to build a sendAction call string for cinema:uiSet (boolean or string value)
  function uiSetBool(key, val) {
    return 'sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + key + tq + ', value: ' + (val ? 'true' : 'false') + ' })';
  }
  function uiSetStr(key, valExpr) {
    return 'sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + key + tq + ', value: ' + valExpr + ' })';
  }
  function uiSetNull(key) {
    return 'sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + key + tq + ', value: null })';
  }

  // ── Add Effect Menu ──
  var addMenuHtml = '';
  if (fxMenuOpen) {
    var menuItems = [];
    // Instants first, then sustained, with a separator
    var instantKeys = FX_TYPE_KEYS.filter(function(k) { return FX_UI[k].instant; });
    var sustainedKeys = FX_TYPE_KEYS.filter(function(k) { return !FX_UI[k].instant; });

    for (var ik = 0; ik < instantKeys.length; ik++) {
      var k = instantKeys[ik];
      var fxMeta = FX_UI[k];
      menuItems.push(
        '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxAdd' + tq + ', { type: ' + tq + k + tq + ', time: ' + Math.min(pbTime || 0, totalDuration || 0) + ' })" ' +
          'class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors rounded">' +
          '<div class="w-2 h-2 rounded-full flex-shrink-0" style="background: ' + fxMeta.color + ';"></div>' +
          '<span class="text-xs font-mono text-cyan-300">' + fxMeta.label + '</span>' +
          '<span class="text-[9px] font-mono text-cyan-700 ml-auto">INSTANT</span>' +
        '</button>'
      );
    }
    menuItems.push('<div class="border-t border-cyan-800/20 my-1"></div>');
    for (var sk = 0; sk < sustainedKeys.length; sk++) {
      var k2 = sustainedKeys[sk];
      var fxMeta2 = FX_UI[k2];
      menuItems.push(
        '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxAdd' + tq + ', { type: ' + tq + k2 + tq + ', time: ' + Math.min(pbTime || 0, totalDuration || 0) + ', duration: 2 })" ' +
          'class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors rounded">' +
          '<div class="w-3 h-1.5 rounded-sm flex-shrink-0" style="background: ' + fxMeta2.color + ';"></div>' +
          '<span class="text-xs font-mono text-cyan-300">' + fxMeta2.label + '</span>' +
          '<span class="text-[9px] font-mono text-cyan-700 ml-auto">SUSTAINED</span>' +
        '</button>'
      );
    }

    addMenuHtml =
      '<div class="absolute left-0 bottom-full mb-1 w-48 rounded-md overflow-hidden z-20" ' +
           'style="background: rgba(0,5,15,0.95); border: 1px solid rgba(0,200,255,0.2); box-shadow: 0 4px 20px rgba(0,0,0,0.6);">' +
        '<div class="py-1">' + menuItems.join('') + '</div>' +
      '</div>';
  }

  // ── FX Track Visual ──
  var trackItems = '';
  if (effects.length === 0 && totalDuration <= 0) {
    trackItems =
      '<div class="py-3 flex items-center justify-center">' +
        '<span class="text-cyan-900/40 text-[10px] font-mono tracking-wider">NO EFFECTS</span>' +
      '</div>';
  } else if (totalDuration > 0) {
    // Lane stacking algorithm
    var lanes = []; // each lane is an array of { endTime }
    var fxLanes = []; // parallel array: which lane each fx got

    for (var fi = 0; fi < effects.length; fi++) {
      var fx = effects[fi];
      var fxDef = FX_UI[fx.type] || { label: '?', color: 'rgba(128,128,128,0.5)', bg: 'rgba(128,128,128,0.1)', instant: true };
      var fxStart = fx.time || 0;
      var fxHoldExtra = 0;
      var fxOutExtra = 0;
      if (!fxDef.instant && (fx.type === 'fade' || fx.type === 'colorWash')) {
        var fxp = fx.params || {};
        fxHoldExtra = fxp.hold || 0;
        fxOutExtra = fxp.fadeOut ? (fxp.fadeOutDuration || fx.duration || 2) : 0;
      }
      var fxInExtra = 0;
      if (!fxDef.instant && fx.type === 'cinemaText') {
        var fxpc = fx.params || {};
        fxInExtra = (fxpc.fadeIn !== false) ? (fxpc.fadeInDuration || 1) : 0;
        fxOutExtra = fxpc.fadeOut ? (fxpc.fadeOutDuration || 1) : 0;
      }
      var fxEnd = fxDef.instant ? (fxStart + totalDuration * 0.02) : (fxStart + fxInExtra + (fx.duration || 2) + fxHoldExtra + fxOutExtra);

      // Find first lane that doesn't overlap
      var placed = false;
      for (var li = 0; li < lanes.length; li++) {
        var fits = true;
        for (var ci = 0; ci < lanes[li].length; ci++) {
          if (!(fxEnd <= lanes[li][ci].start || fxStart >= lanes[li][ci].end)) {
            fits = false; break;
          }
        }
        if (fits) {
          lanes[li].push({ start: fxStart, end: fxEnd });
          fxLanes.push(li);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lanes.push([{ start: fxStart, end: fxEnd }]);
        fxLanes.push(lanes.length - 1);
      }
    }

    var laneCount = Math.max(lanes.length, 1);
    var laneH = 20; // px per lane
    var trackH = laneCount * laneH;

    var items = [];
    for (var fi2 = 0; fi2 < effects.length; fi2++) {
      var fx2 = effects[fi2];
      var def2 = FX_UI[fx2.type] || { label: '?', color: 'rgba(128,128,128,0.5)', bg: 'rgba(128,128,128,0.1)', instant: true };
      var lane = fxLanes[fi2];
      var leftPct = totalDuration > 0 ? ((fx2.time || 0) / totalDuration * 100) : 0;
      var topPx = lane * laneH;
      var isSel = fx2.id === selFxId;
      var selBorder = isSel ? 'border: 1px solid ' + def2.color + '; box-shadow: 0 0 8px ' + def2.bg + ';' : 'border: 1px solid transparent;';

      if (def2.instant) {
        // Instant: small marker
        var markerTitle = def2.label + ' @ ' + (fx2.time || 0).toFixed(1) + 's';
        if (fx2.type === 'event' && fx2.params && fx2.params.note) {
          markerTitle = (fx2.params.note.length > 40 ? fx2.params.note.substring(0, 40) + '...' : fx2.params.note) + ' @ ' + (fx2.time || 0).toFixed(1) + 's';
        }
        var markerShape = fx2.type === 'event'
          ? 'width: 8px; height: ' + (laneH - 2) + 'px; transform: translateX(-4px); background: ' + def2.color + '; clip-path: polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%);'
          : 'width: 6px; height: ' + (laneH - 2) + 'px; transform: translateX(-3px); background: ' + def2.color + ';';
        items.push(
          '<div data-interactive onclick="sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + 'selFx' + tq + ', value: ' + (selFxId === fx2.id ? 'null' : tq + fx2.id + tq) + ' })" ' +
               'class="absolute cursor-pointer transition-all rounded-sm flex items-center justify-center" ' +
               'style="left: ' + leftPct + '%; top: ' + topPx + 'px; ' + markerShape + ' ' + selBorder + '" ' +
               'title="' + markerTitle.replace(/"/g, '&quot;') + '">' +
          '</div>'
        );
      } else {
        // Sustained: colored block — visual sections differ by type
        // fade/colorWash: [ramp in (duration)] [hold] [ramp out]
        // cinemaText: [fade in] [hold (duration)] [fade out]
        var rampInDur, holdDur, rampOutDur;
        var fx2p = fx2.params || {};
        if (fx2.type === 'cinemaText') {
          rampInDur = (fx2p.fadeIn !== false) ? (fx2p.fadeInDuration || 1) : 0;
          holdDur = fx2.duration || 2;
          rampOutDur = fx2p.fadeOut ? (fx2p.fadeOutDuration || 1) : 0;
        } else {
          rampInDur = fx2.duration || 2;
          holdDur = (fx2.type === 'fade' || fx2.type === 'colorWash') ? (fx2p.hold || 0) : 0;
          rampOutDur = (fx2.type === 'fade' || fx2.type === 'colorWash') && fx2p.fadeOut ? (fx2p.fadeOutDuration || rampInDur) : 0;
        }
        var totalFxTime = rampInDur + holdDur + rampOutDur;
        var widthPct = totalDuration > 0 ? (totalFxTime / totalDuration * 100) : 5;
        var blockH = laneH - 4;

        // Calculate section percentages
        var inPct = totalFxTime > 0 ? (rampInDur / totalFxTime * 100) : 0;
        var holdPctVal = totalFxTime > 0 ? (holdDur / totalFxTime * 100) : 100;
        var outPct = totalFxTime > 0 ? (rampOutDur / totalFxTime * 100) : 0;

        // Build inner sections
        var innerHtml = '';
        if (fx2.type === 'cinemaText') {
          // cinemaText: [fade-in stripe] [hold body with label] [fade-out stripe]
          if (rampInDur > 0) {
            innerHtml +=
              '<div class="h-full" style="width: ' + inPct + '%; min-width: 0; ' +
                  'background: repeating-linear-gradient(135deg, transparent, transparent 2px, ' + def2.color + ' 2px, ' + def2.color + ' 3px); opacity: 0.35; border-right: 1px dashed ' + def2.color + ';">' +
              '</div>';
          }
          innerHtml +=
            '<div class="flex items-center h-full" style="width: ' + holdPctVal + '%; min-width: 0;">' +
              '<span class="text-[8px] font-mono px-1 truncate" style="color: ' + def2.color + ';">' + def2.label + '</span>' +
            '</div>';
          if (rampOutDur > 0) {
            innerHtml +=
              '<div class="h-full" style="width: ' + outPct + '%; min-width: 0; ' +
                  'background: repeating-linear-gradient(45deg, transparent, transparent 2px, ' + def2.color + ' 2px, ' + def2.color + ' 3px); opacity: 0.25; border-left: 1px dashed ' + def2.color + ';">' +
              '</div>';
          }
        } else {
          // fade/colorWash/others: [ramp-in body with label] [hold stripe] [ramp-out stripe]
          innerHtml =
            '<div class="flex items-center h-full" style="width: ' + (holdDur > 0 || rampOutDur > 0 ? inPct : 100) + '%; min-width: 0;">' +
              '<span class="text-[8px] font-mono px-1 truncate" style="color: ' + def2.color + ';">' + def2.label + '</span>' +
            '</div>';
          if (holdDur > 0) {
            innerHtml +=
              '<div class="h-full" style="width: ' + holdPctVal + '%; min-width: 0; ' +
                  'background: repeating-linear-gradient(135deg, transparent, transparent 2px, ' + def2.color + ' 2px, ' + def2.color + ' 3px); opacity: 0.35; border-left: 1px dashed ' + def2.color + ';">' +
              '</div>';
          }
          if (rampOutDur > 0) {
            innerHtml +=
              '<div class="h-full" style="width: ' + outPct + '%; min-width: 0; ' +
                  'background: repeating-linear-gradient(45deg, transparent, transparent 2px, ' + def2.color + ' 2px, ' + def2.color + ' 3px); opacity: 0.25; border-left: 1px dashed ' + def2.color + ';">' +
              '</div>';
          }
        }

        // Tooltip
        var tipParts = [def2.label + ' @ ' + (fx2.time || 0).toFixed(1) + 's'];
        if (fx2.type === 'cinemaText') {
          if (rampInDur > 0) tipParts.push('In: ' + rampInDur.toFixed(1) + 's');
          tipParts.push('Hold: ' + holdDur.toFixed(1) + 's');
          if (rampOutDur > 0) tipParts.push('Out: ' + rampOutDur.toFixed(1) + 's');
        } else {
          tipParts.push('In: ' + rampInDur.toFixed(1) + 's');
          if (holdDur > 0) tipParts.push('Hold: ' + holdDur.toFixed(1) + 's');
          if (rampOutDur > 0) tipParts.push('Out: ' + rampOutDur.toFixed(1) + 's');
        }
        tipParts.push('Total: ' + totalFxTime.toFixed(1) + 's');

        items.push(
          '<div data-interactive onclick="sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + 'selFx' + tq + ', value: ' + (selFxId === fx2.id ? 'null' : tq + fx2.id + tq) + ' })" ' +
               'class="absolute cursor-pointer transition-all rounded-sm flex overflow-hidden" ' +
               'style="left: ' + leftPct + '%; top: ' + (topPx + 1) + 'px; width: ' + widthPct + '%; height: ' + blockH + 'px; min-width: 14px; background: ' + def2.bg + '; ' + selBorder + '" ' +
               'title="' + tipParts.join(' \u2014 ') + '">' +
            innerHtml +
          '</div>'
        );
      }
    }

    // Playhead
    var phPct = totalDuration > 0 ? (pbTime / totalDuration * 100) : 0;
    items.push(
      '<div class="absolute top-0 pointer-events-none" style="left: ' + phPct + '%; width: 1px; height: 100%; background: rgba(0,200,255,0.5); z-index: 10;"></div>'
    );

    trackItems =
      '<div class="relative" style="height: ' + trackH + 'px;">' +
        items.join('') +
      '</div>';
  }

  // ── Selected Effect Controls ──
  var fxControlsHtml = '';
  if (selFx) {
    var sDef = FX_UI[selFx.type] || { label: '?', color: 'rgba(128,128,128,0.5)', instant: true };
    var sParams = selFx.params || {};
    var ctrlInputSt = 'background: rgba(0,0,0,0.5); border: 1px solid rgba(0,200,255,0.15); color: rgba(0,200,255,0.9); text-align: center; width: 64px;';

    // Time control (all effects)
    var timeCtrl =
      '<div class="flex items-center gap-1.5">' +
        '<span class="text-[11px] font-mono font-bold tracking-wider w-10" style="color: ' + sDef.color + ';">TIME</span>' +
        '<input data-interactive type="number" step="0.1" min="0" value="' + (selFx.time || 0).toFixed(1) + '" ' +
          'class="h-7 rounded text-xs font-mono px-1" style="' + ctrlInputSt + '" ' +
          'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', time: Math.max(0, parseFloat(this.value) || 0) })" />' +
        '<span class="text-[11px] font-mono text-cyan-800">s</span>' +
      '</div>';

    // Duration control (sustained only)
    var durCtrl = '';
    if (!sDef.instant) {
      durCtrl =
        '<div class="flex items-center gap-1.5">' +
          '<span class="text-[11px] font-mono font-bold tracking-wider w-10" style="color: ' + sDef.color + ';">DUR</span>' +
          '<input data-interactive type="number" step="0.1" min="0.1" value="' + (selFx.duration || 2).toFixed(1) + '" ' +
            'class="h-7 rounded text-xs font-mono px-1" style="' + ctrlInputSt + '" ' +
            'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', duration: Math.max(0.1, parseFloat(this.value) || 0.1) })" />' +
          '<span class="text-[11px] font-mono text-cyan-800">s</span>' +
        '</div>';
    }

    // Type-specific param controls
    var paramCtrls = '';
    switch (selFx.type) {
      case 'screenShake':
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">INTENSITY</span>' +
            '<input data-interactive type="number" step="0.1" min="0.1" max="2" value="' + (sParams.intensity ?? 0.5).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { intensity: parseFloat(this.value) || 0.5 } })" />' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">LENGTH</span>' +
            '<input data-interactive type="number" step="0.1" min="0.1" value="' + (sParams.duration ?? 0.3).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { duration: parseFloat(this.value) || 0.3 } })" />' +
          '</div>';
        break;
      case 'screenFlash':
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">LENGTH</span>' +
            '<input data-interactive type="number" step="0.1" min="0.1" value="' + (sParams.duration ?? 0.2).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { duration: parseFloat(this.value) || 0.2 } })" />' +
          '</div>';
        break;
      case 'playSound':
        var sfxClipName = (sParams.clip || '');
        var sfxShort = sfxClipName.replace('cdn/', '').replace('.mp3', '').replace(/^sfx-/, '').replace(/-/g, ' ');
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">CLIP</span>' +
            '<div class="flex-1 h-6 rounded text-[11px] font-mono px-1.5 truncate flex items-center" style="' + ctrlInputSt + 'text-align:left;cursor:default;">' +
              (sfxShort || '<span class="opacity-40">none</span>') +
            '</div>' +
            '<button data-interactive onclick="sendAction(\u0027cinema:uiSet\u0027, { key: \u0027audioPicker\u0027, value: ' + (!ui.audioPicker) + ' })" ' +
              'class="px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider" ' +
              'style="background: rgba(80,255,180,0.12); color: rgba(80,255,180,0.9); border: 1px solid rgba(80,255,180,0.25);">' +
              (ui.audioPicker ? 'CLOSE' : 'BROWSE') + '</button>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">VOLUME</span>' +
            '<input data-interactive type="number" step="0.1" min="0" max="1" value="' + (sParams.volume ?? 0.6).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { volume: parseFloat(this.value) || 0.6 } })" />' +
          '</div>';
        break;
      case 'announce':
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">TEXT</span>' +
            '<input data-interactive type="text" value="' + (sParams.text || 'TITLE').replace(/"/g, '&quot;') + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1.5 flex-1" style="' + ctrlInputSt + 'width:auto;text-align:left;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { text: this.value } })" />' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">SUBTITLE</span>' +
            '<input data-interactive type="text" value="' + (sParams.subtitle || '').replace(/"/g, '&quot;') + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1.5 flex-1" style="' + ctrlInputSt + 'width:auto;text-align:left;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { subtitle: this.value } })" />' +
          '</div>';
        break;
      case 'toast':
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">MESSAGE</span>' +
            '<input data-interactive type="text" value="' + (sParams.message || 'Message').replace(/"/g, '&quot;') + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1.5 flex-1" style="' + ctrlInputSt + 'width:auto;text-align:left;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { message: this.value } })" />' +
          '</div>';
        break;
      case 'fade':
        var hasFadeIn = (sParams.fadeIn !== false);
        var hasFadeOut = !!sParams.fadeOut;
        var fadeOutDur = sParams.fadeOutDuration || (selFx.duration || 2);
        var onStyle = 'background: rgba(0,200,255,0.15); color: rgba(0,200,255,0.9); border: 1px solid rgba(0,200,255,0.3);';
        var offStyle = 'background: rgba(0,0,0,0.3); color: rgba(0,200,255,0.4); border: 1px solid rgba(0,200,255,0.1);';
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">PHASES</span>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeIn: ' + (!hasFadeIn) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (hasFadeIn ? onStyle : offStyle) + '">FADE IN</button>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeOut: ' + (!hasFadeOut) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (hasFadeOut ? onStyle : offStyle) + '">FADE OUT</button>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">HOLD</span>' +
            '<input data-interactive type="number" step="0.5" min="0" max="30" value="' + (sParams.hold ?? 0).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { hold: parseFloat(this.value) || 0 } })" />' +
            '<span class="text-[9px] font-mono text-cyan-800/50">sec at peak</span>' +
          '</div>' +
          (hasFadeOut ?
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-[10px] font-mono text-cyan-600/60 w-14">OUT DUR</span>' +
              '<input data-interactive type="number" step="0.5" min="0.1" max="30" value="' + fadeOutDur.toFixed(1) + '" ' +
                'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
                'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeOutDuration: parseFloat(this.value) || 2 } })" />' +
              '<span class="text-[9px] font-mono text-cyan-800/50">sec ramp out</span>' +
            '</div>'
          : '');
        break;
      case 'turbulence':
        var turbIsInf = !!sParams.infinite;
        var turbInfOn = 'background: rgba(200,160,80,0.2); color: rgba(255,200,100,0.9); border: 1px solid rgba(200,160,80,0.4);';
        var turbInfOff = 'background: rgba(0,0,0,0.3); color: rgba(200,160,80,0.4); border: 1px solid rgba(200,160,80,0.15);';
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">INTENSITY</span>' +
            '<input data-interactive type="number" step="0.1" min="0.1" max="2" value="' + (sParams.intensity ?? 0.5).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { intensity: parseFloat(this.value) || 0.5 } })" />' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">SPEED</span>' +
            '<input data-interactive type="number" step="0.1" min="0.1" max="3" value="' + (sParams.speed ?? 1.0).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { speed: parseFloat(this.value) || 1.0 } })" />' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { infinite: ' + (!turbIsInf) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (turbIsInf ? turbInfOn : turbInfOff) + '">\u221E INFINITE</button>' +
            '<span class="text-[9px] font-mono text-cyan-800/50">' + (turbIsInf ? 'active for full playback' : 'ends at block') + '</span>' +
          '</div>';
        break;
      case 'colorWash':
        var cwHasFadeIn = (sParams.fadeIn !== false);
        var cwHasFadeOut = !!sParams.fadeOut;
        var cwIsInfinite = !!sParams.infinite;
        var cwFadeOutDur = sParams.fadeOutDuration || (selFx.duration || 2);
        var cwOnStyle = 'background: rgba(120,80,200,0.2); color: rgba(180,140,255,0.9); border: 1px solid rgba(120,80,200,0.4);';
        var cwOffStyle = 'background: rgba(0,0,0,0.3); color: rgba(120,80,200,0.4); border: 1px solid rgba(120,80,200,0.15);';
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">PHASES</span>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeIn: ' + (!cwHasFadeIn) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (cwHasFadeIn ? cwOnStyle : cwOffStyle) + '">WASH IN</button>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeOut: ' + (!cwHasFadeOut) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (!cwIsInfinite && cwHasFadeOut ? cwOnStyle : cwOffStyle) + '"' + (cwIsInfinite ? ' title="Disabled while infinite"' : '') + '>WASH OUT</button>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { infinite: ' + (!cwIsInfinite) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (cwIsInfinite ? cwOnStyle : cwOffStyle) + '">\u221E</button>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">COLOR</span>' +
            '<div class="w-6 h-6 rounded-sm border border-white/20" style="background: ' + (sParams.color || 'rgba(40,60,120,0.8)') + ';"></div>' +
            '<button data-interactive onclick="sendAction(\u0027cinema:uiSet\u0027, { key: \u0027colorPicker\u0027, value: ' + (!ui.colorPicker) + ' })" ' +
              'class="px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider" ' +
              'style="background: rgba(120,80,200,0.15); color: rgba(180,140,255,0.9); border: 1px solid rgba(120,80,200,0.3);">' +
              (ui.colorPicker ? 'CLOSE' : 'PICK') + '</button>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">OPACITY</span>' +
            '<input data-interactive type="number" step="0.05" min="0.05" max="1" value="' + (sParams.opacity ?? 0.5).toFixed(2) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { opacity: parseFloat(this.value) || 0.5 } })" />' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">HOLD</span>' +
            '<input data-interactive type="number" step="0.5" min="0" max="30" value="' + (sParams.hold ?? 0).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { hold: parseFloat(this.value) || 0 } })" />' +
            '<span class="text-[9px] font-mono text-cyan-800/50">sec at peak</span>' +
          '</div>' +
          (!cwIsInfinite && cwHasFadeOut ?
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-[10px] font-mono text-cyan-600/60 w-14">OUT DUR</span>' +
              '<input data-interactive type="number" step="0.5" min="0.1" max="30" value="' + cwFadeOutDur.toFixed(1) + '" ' +
                'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
                'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeOutDuration: parseFloat(this.value) || 2 } })" />' +
              '<span class="text-[9px] font-mono text-cyan-800/50">sec ramp out</span>' +
            '</div>'
          : '') +
          (cwIsInfinite ?
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-[9px] font-mono" style="color: rgba(180,140,255,0.4);">\u221E holds at peak for entire playback</span>' +
            '</div>'
          : '');
        break;
      case 'letterbox':
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">INTENSITY</span>' +
            '<input data-interactive type="number" step="0.05" min="0" max="0.5" value="' + (sParams.intensity ?? 0.15).toFixed(2) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { intensity: parseFloat(this.value) || 0.15 } })" />' +
          '</div>';
        break;
      case 'vignette':
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">INTENSITY</span>' +
            '<input data-interactive type="number" step="0.1" min="0" max="1" value="' + (sParams.intensity ?? 0.6).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { intensity: parseFloat(this.value) || 0.6 } })" />' +
          '</div>';
        break;
      case 'slowMo':
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">SCALE</span>' +
            '<input data-interactive type="number" step="0.1" min="0.05" max="1" value="' + (sParams.scale ?? 0.3).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { scale: parseFloat(this.value) || 0.3 } })" />' +
          '</div>';
        break;
      case 'musicShift':
        var musicLoop = sParams.loop !== false;
        var mClipName = (sParams.clip || '');
        var mShort = mClipName.replace('cdn/', '').replace('.mp3', '').replace(/^music-instrumental-/, '').replace(/^music-vocals-/, '').replace(/^music-/, '').replace(/-/g, ' ');
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">CLIP</span>' +
            '<div class="flex-1 h-6 rounded text-[11px] font-mono px-1.5 truncate flex items-center" style="' + ctrlInputSt + 'text-align:left;cursor:default;">' +
              (mShort || '<span class="opacity-40">none</span>') +
            '</div>' +
            '<button data-interactive onclick="sendAction(\u0027cinema:uiSet\u0027, { key: \u0027audioPicker\u0027, value: ' + (!ui.audioPicker) + ' })" ' +
              'class="px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider" ' +
              'style="background: rgba(0,255,200,0.12); color: rgba(0,255,200,0.9); border: 1px solid rgba(0,255,200,0.25);">' +
              (ui.audioPicker ? 'CLOSE' : 'BROWSE') + '</button>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">VOLUME</span>' +
            '<input data-interactive type="number" step="0.1" min="0" max="1" value="' + (sParams.volume ?? 0.4).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { volume: parseFloat(this.value) || 0.4 } })" />' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">LOOP</span>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { loop: ' + (!musicLoop) + ' } })" ' +
              'class="px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider" ' +
              'style="' + (musicLoop ? 'background: rgba(0,200,120,0.15); color: rgba(0,200,120,0.9); border: 1px solid rgba(0,200,120,0.3);' : 'background: rgba(0,0,0,0.3); color: rgba(200,60,60,0.7); border: 1px solid rgba(200,60,60,0.15);') + '">' +
              (musicLoop ? '∞ ON' : '∞ OFF') + '</button>' +
          '</div>';
        break;
      case 'effect':
        var filterOpts = ['blur', 'pixelate', 'chromatic', 'vhs', 'sepia', 'invert', 'grayscale'];
        var filterSelect = [];
        for (var fo = 0; fo < filterOpts.length; fo++) {
          filterSelect.push('<option value="' + filterOpts[fo] + '"' + (filterOpts[fo] === (sParams.name || 'blur') ? ' selected' : '') + '>' + filterOpts[fo] + '</option>');
        }
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">FILTER</span>' +
            '<select data-interactive class="h-6 rounded text-[11px] font-mono px-1" ' +
              'style="' + ctrlInputSt + 'width:auto;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { name: this.value } })">' +
              filterSelect.join('') +
            '</select>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">INTENSITY</span>' +
            '<input data-interactive type="number" step="0.1" min="0" max="2" value="' + (sParams.intensity ?? 0.5).toFixed(1) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { intensity: parseFloat(this.value) || 0.5 } })" />' +
          '</div>';
        break;
      case 'cinemaText':
        var ctHasFadeIn = (sParams.fadeIn !== false);
        var ctHasFadeOut = !!sParams.fadeOut;
        var ctFadeInDur = sParams.fadeInDuration || 1;
        var ctFadeOutDur = sParams.fadeOutDuration || 1;
        var ctOnStyle = 'background: rgba(255,200,100,0.2); color: rgba(255,220,140,0.9); border: 1px solid rgba(255,200,100,0.4);';
        var ctOffStyle = 'background: rgba(0,0,0,0.3); color: rgba(255,200,100,0.4); border: 1px solid rgba(255,200,100,0.15);';
        var ctFontGroups = [
          { label: 'Bundled', fonts: ['Geist Pixel Square', 'Geist Pixel Grid', 'Geist Pixel Circle', 'Geist Pixel Triangle', 'Geist Pixel Line', 'Jersey 10'] },
          { label: 'Serif', fonts: ['Georgia', 'Times New Roman', 'Palatino Linotype', 'Book Antiqua', 'Garamond', 'Baskerville'] },
          { label: 'Sans-Serif', fonts: ['Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Century Gothic', 'Gill Sans', 'Franklin Gothic Medium', 'Segoe UI', 'Lucida Grande', 'Futura', 'Optima', 'Candara', 'Calibri'] },
          { label: 'Monospace', fonts: ['Courier New', 'Consolas', 'Lucida Console', 'Monaco', 'Andale Mono', 'SF Mono', 'Menlo'] },
          { label: 'Display', fonts: ['Impact', 'Copperplate', 'Rockwell', 'Didot', 'Bodoni MT', 'Big Caslon', 'Perpetua'] },
          { label: 'Handwritten / Cursive', fonts: ['Brush Script MT', 'Lucida Handwriting', 'Segoe Script', 'Bradley Hand', 'Snell Roundhand', 'Apple Chancery', 'Marker Felt', 'Comic Sans MS', 'Zapfino', 'Satisfy', 'Dancing Script', 'Pacifico'] },
          { label: 'Fantasy / Decorative', fonts: ['Papyrus', 'Luminari', 'Herculanum', 'Jazz LET', 'Trattatello', 'Party LET', 'Chalkduster'] }
        ];
        var ctSelectedFont = sParams.font || 'Geist Pixel Square';
        var ctFontSelect = [];
        for (var cgi = 0; cgi < ctFontGroups.length; cgi++) {
          var grp = ctFontGroups[cgi];
          ctFontSelect.push('<optgroup label="' + grp.label + '">');
          for (var cfi = 0; cfi < grp.fonts.length; cfi++) {
            ctFontSelect.push('<option value="' + grp.fonts[cfi] + '"' + (grp.fonts[cfi] === ctSelectedFont ? ' selected' : '') + ' style="font-family:\'' + grp.fonts[cfi] + '\'">' + grp.fonts[cfi] + '</option>');
          }
          ctFontSelect.push('</optgroup>');
        }
        paramCtrls =
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">TEXT</span>' +
            '<input data-interactive type="text" value="' + (sParams.text || 'TITLE TEXT').replace(/"/g, '&quot;') + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1.5 flex-1" style="' + ctrlInputSt + 'width:auto;text-align:left;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { text: this.value } })" />' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">FONT</span>' +
            '<select data-interactive class="h-6 rounded text-[11px] font-mono px-1" ' +
              'style="' + ctrlInputSt + 'width:auto;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { font: this.value } })">' +
              ctFontSelect.join('') +
            '</select>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">SIZE</span>' +
            '<input data-interactive type="number" step="1" min="8" max="200" value="' + (sParams.fontSize ?? 48) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fontSize: parseInt(this.value) || 48 } })" />' +
            '<span class="text-[9px] font-mono text-cyan-800/50">px</span>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">COLOR</span>' +
            '<div class="w-6 h-6 rounded-sm border border-white/20" style="background: ' + (sParams.color || 'rgba(255,255,255,1)') + ';"></div>' +
            '<button data-interactive onclick="sendAction(\u0027cinema:uiSet\u0027, { key: \u0027colorPicker\u0027, value: ' + (!ui.colorPicker) + ' })" ' +
              'class="px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider" ' +
              'style="background: rgba(255,200,100,0.15); color: rgba(255,220,140,0.9); border: 1px solid rgba(255,200,100,0.3);">' +
              (ui.colorPicker ? 'CLOSE' : 'PICK') + '</button>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">POS X</span>' +
            '<input data-interactive type="number" step="1" min="0" max="100" value="' + (sParams.posX ?? 50) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { posX: parseInt(this.value) || 50 } })" />' +
            '<span class="text-[9px] font-mono text-cyan-800/50">%</span>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">POS Y</span>' +
            '<input data-interactive type="number" step="1" min="0" max="100" value="' + (sParams.posY ?? 50) + '" ' +
              'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { posY: parseInt(this.value) || 50 } })" />' +
            '<span class="text-[9px] font-mono text-cyan-800/50">%</span>' +
          '</div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-mono text-cyan-600/60 w-14">PHASES</span>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeIn: ' + (!ctHasFadeIn) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (ctHasFadeIn ? ctOnStyle : ctOffStyle) + '">FADE IN</button>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeOut: ' + (!ctHasFadeOut) + ' } })" ' +
              'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
              'style="' + (ctHasFadeOut ? ctOnStyle : ctOffStyle) + '">FADE OUT</button>' +
          '</div>' +
          (ctHasFadeIn ?
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-[10px] font-mono text-cyan-600/60 w-14">IN DUR</span>' +
              '<input data-interactive type="number" step="0.5" min="0.1" max="30" value="' + ctFadeInDur.toFixed(1) + '" ' +
                'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
                'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeInDuration: parseFloat(this.value) || 1 } })" />' +
              '<span class="text-[9px] font-mono text-cyan-800/50">sec ramp in</span>' +
            '</div>'
          : '') +
          (ctHasFadeOut ?
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-[10px] font-mono text-cyan-600/60 w-14">OUT DUR</span>' +
              '<input data-interactive type="number" step="0.5" min="0.1" max="30" value="' + ctFadeOutDur.toFixed(1) + '" ' +
                'class="h-6 rounded text-[11px] font-mono px-1" style="' + ctrlInputSt + 'width:52px;" ' +
                'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { fadeOutDuration: parseFloat(this.value) || 1 } })" />' +
              '<span class="text-[9px] font-mono text-cyan-800/50">sec ramp out</span>' +
            '</div>'
          : '');
        break;
      case 'event':
        paramCtrls =
          '<div class="flex flex-col gap-1.5">' +
            '<span class="text-[10px] font-mono text-white/50 tracking-wider">DIRECTOR NOTE</span>' +
            '<textarea data-interactive rows="3" class="w-full rounded text-[11px] font-mono px-2 py-1.5 resize-y" ' +
              'style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.85); line-height: 1.4;" ' +
              'placeholder="Describe what should happen here..." ' +
              'onchange="sendAction(' + tq + 'cinema:fxUpdate' + tq + ', { id: ' + tq + selFx.id + tq + ', params: { note: this.value } })">' + (sParams.note || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
          '</div>';
        break;
    }

    fxControlsHtml =
      '<div class="px-4 pb-3">' +
        '<div class="rounded-md overflow-hidden" style="border: 1px solid ' + sDef.color.replace('0.7', '0.25').replace('0.5', '0.25') + '; background: rgba(0,10,20,0.5);">' +
          // Header
          '<div class="flex items-center gap-2 px-3 py-1.5" style="border-bottom: 1px solid rgba(0,200,255,0.06);">' +
            '<div class="w-2.5 h-2.5 rounded-full" style="background: ' + sDef.color + ';"></div>' +
            '<span class="text-xs font-mono font-bold flex-1" style="color: ' + sDef.color + ';">' + sDef.label.toUpperCase() + '</span>' +
            '<span class="text-[9px] font-mono text-cyan-700">' + (sDef.instant ? 'INSTANT' : 'SUSTAINED') + '</span>' +
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:fxRemove' + tq + ', { id: ' + tq + selFx.id + tq + ' })" ' +
                    'class="w-6 h-6 rounded flex items-center justify-center text-red-900/60 hover:text-red-400 hover:bg-red-900/15 transition-colors" title="Remove effect">' +
              '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
          // Controls
          '<div class="flex flex-wrap items-center gap-3 px-3 py-2">' +
            timeCtrl + durCtrl +
          '</div>' +
          (paramCtrls ? '<div class="flex flex-wrap items-center gap-3 px-3 pb-2">' + paramCtrls + '</div>' : '') +
        '</div>' +
      '</div>';
  }

  // ── Full FX Section ──
  return (
    '<div style="border-top: 1px solid rgba(0,200,255,0.06);">' +
      // FX Header bar
      '<div class="flex items-center gap-2 px-4 py-2">' +
        '<span class="text-[11px] font-mono font-bold tracking-[0.2em] text-cyan-600/50">FX</span>' +
        '<span class="text-[10px] font-mono text-cyan-800">' + effects.length + '</span>' +
        // Add button (relative container for dropdown)
        '<div class="relative ml-auto">' +
          addMenuHtml +
          '<button data-interactive onclick="sendAction(\u0027cinema:uiSet\u0027, { key: \u0027fxMenu\u0027, value: ' + (!ui.fxMenu) + ' })" ' +
                  'class="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-all" ' +
                  'style="color: rgba(0,200,255,0.6); background: rgba(0,200,255,0.06); border: 1px solid rgba(0,200,255,0.15);">+ ADD</button>' +
        '</div>' +
        // Clear all
        (effects.length > 0
          ? '<button data-interactive onclick="sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + 'selFx' + tq + ', value: null }); sendAction(' + tq + 'cinema:fxClear' + tq + ')" ' +
                    'class="px-2 py-1 rounded text-[10px] font-mono tracking-wider text-red-900/50 hover:text-red-400 hover:bg-red-900/10 transition-colors" ' +
                    'style="border: 1px solid rgba(255,60,60,0.1);">CLEAR</button>'
          : '') +
      '</div>' +
      // FX Track
      '<div class="px-4 pb-2">' +
        '<div class="rounded-md overflow-hidden" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,200,255,0.06); padding: 4px; min-height: 28px;">' +
          trackItems +
        '</div>' +
      '</div>' +
      // Selected effect controls
      fxControlsHtml +
    '</div>'
  );
}

module.exports = function cinemaPanel(localPlayer) {
  const open = localPlayer.state.cinemaOpen ?? false;
  if (!open) return '';

  const nodes = localPlayer.state.cinemaNodes || [];
  const possessedId = localPlayer.state.possessedNodeId ?? null;
  const isPossessing = possessedId !== null;
  // UI state shared with onclick handlers via sendAction('cinema:uiSet', ...)
  var ui = localPlayer.state.cinemaUi || {};
  // Panel position lives in state — drag handler is inline browser-side JS
  // because the worker-side window/document can't see real DOM events.
  var panelX = (ui.panelX != null) ? ui.panelX : 60;
  var panelY = (ui.panelY != null) ? ui.panelY : 80;

  // ── Node list ──
  var nodeListHtml = '';
  if (nodes.length === 0) {
    nodeListHtml = '<div class="flex flex-col items-center justify-center py-12 gap-3 opacity-50">' +
      '<svg width="36" height="36" viewBox="0 0 32 32" fill="none">' +
        '<circle cx="16" cy="16" r="10" stroke="rgba(0,200,255,0.2)" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<circle cx="16" cy="16" r="3" stroke="rgba(0,200,255,0.25)" stroke-width="1"/>' +
        '<line x1="16" y1="4" x2="16" y2="8" stroke="rgba(0,200,255,0.15)" stroke-width="0.7"/>' +
        '<line x1="16" y1="24" x2="16" y2="28" stroke="rgba(0,200,255,0.15)" stroke-width="0.7"/>' +
        '<line x1="4" y1="16" x2="8" y2="16" stroke="rgba(0,200,255,0.15)" stroke-width="0.7"/>' +
        '<line x1="24" y1="16" x2="28" y2="16" stroke="rgba(0,200,255,0.15)" stroke-width="0.7"/>' +
      '</svg>' +
      '<span class="text-cyan-800 text-xs font-mono tracking-wide">NO CAMERA NODES</span>' +
      '<span class="text-cyan-900 text-[11px] font-mono">POSITION YOUR SHOT, THEN STAMP</span>' +
    '</div>';
  } else {
    var pieces = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var isActive = node.id === possessedId;
      var border = isActive ? 'border-cyan-400/50' : 'border-cyan-800/25';
      var bg = isActive ? 'bg-cyan-500/[0.08]' : 'bg-white/[0.015] hover:bg-white/[0.03]';
      var dotCls = isActive ? 'bg-cyan-300' : 'bg-cyan-700';
      var dotGlow = isActive ? 'box-shadow: 0 0 8px rgba(0,200,255,0.7);' : '';
      var nameCls = isActive ? 'text-cyan-200' : 'text-cyan-400';
      var coordCls = isActive ? 'text-cyan-500/80' : 'text-cyan-800/60';
      var activeGlow = isActive ? 'box-shadow: 0 0 16px rgba(0,200,255,0.06);' : '';
      var yawLabel = node.yaw.toFixed(0) + '\u00b0';
      var pitchLabel = node.pitch.toFixed(0) + '\u00b0';

      var possessBtn = isActive
        ? '<button data-interactive onclick="sendAction(\u0027cinema:release\u0027)" class="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/30 border border-cyan-400/30 transition-colors tracking-wider" title="Release">RLS</button>'
        : '<button data-interactive onclick="sendAction(\u0027cinema:possess\u0027, { nodeId: \u0027' + node.id + '\u0027 })" class="group px-2 py-1 rounded text-cyan-700 hover:text-cyan-300 hover:bg-cyan-900/30 transition-colors" title="Look through this shot"><svg width="16" height="16" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="0.8"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg></button>';

      pieces.push(
        '<div class="border ' + border + ' ' + bg + ' rounded-md px-4 py-2.5 transition-all duration-200" style="' + activeGlow + '">' +
          '<div class="flex items-center gap-2.5">' +
            '<div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style="background: rgba(0,200,255,0.06);">' +
              '<span class="text-cyan-600/80 text-xs font-mono font-bold">' + String(i + 1).padStart(2, '0') + '</span>' +
            '</div>' +
            '<div class="w-2 h-2 rounded-full ' + dotCls + ' flex-shrink-0 ' + (isActive ? 'animate-pulse' : '') + '" style="' + dotGlow + '"></div>' +
            '<span class="' + nameCls + ' text-sm font-mono flex-1 truncate">' +
              '<input data-interactive type="text" value="' + node.name.replace(/"/g, '&quot;') + '" ' +
                'class="bg-transparent border-none outline-none text-sm font-mono w-full ' + nameCls + '" ' +
                'style="padding: 0; margin: 0; min-width: 0;" ' +
                'onchange="sendAction(\u0027cinema:rename\u0027, { nodeId: \u0027' + node.id + '\u0027, name: this.value })" ' +
                'onclick="event.stopPropagation()" />' +
            '</span>' +
            possessBtn +
            '<button data-interactive onclick="sendAction(\u0027cinema:seqAdd\u0027, { nodeId: \u0027' + node.id + '\u0027 })" class="px-1.5 py-1 rounded text-cyan-800 hover:text-cyan-300 hover:bg-cyan-900/30 transition-colors text-sm font-mono font-bold" title="Add to sequence">+</button>' +
            '<button data-interactive onclick="sendAction(\u0027cinema:delete\u0027, { nodeId: \u0027' + node.id + '\u0027 })" class="px-1.5 py-1 rounded text-red-900/60 hover:text-red-400 hover:bg-red-900/15 transition-colors text-sm" title="Delete">\u2715</button>' +
          '</div>' +
          '<div class="flex gap-3 mt-2 ml-8">' +
            '<span class="' + coordCls + ' text-xs font-mono">X <span class="text-cyan-600/70">' + node.position.x.toFixed(1) + '</span></span>' +
            '<span class="' + coordCls + ' text-xs font-mono">Y <span class="text-cyan-600/70">' + node.position.y.toFixed(1) + '</span></span>' +
            '<span class="' + coordCls + ' text-xs font-mono">Z <span class="text-cyan-600/70">' + node.position.z.toFixed(1) + '</span></span>' +
            '<span class="' + coordCls + ' text-xs font-mono ml-auto">YAW <span class="text-cyan-600/70">' + yawLabel + '</span></span>' +
            '<span class="' + coordCls + ' text-xs font-mono">PIT <span class="text-cyan-600/70">' + pitchLabel + '</span></span>' +
          '</div>' +
        '</div>'
      );
    }
    nodeListHtml = pieces.join('');
  }

  // ── Possess banner (slim — in main panel) ──
  var possessBanner = '';
  var possessSidePanel = '';
  if (isPossessing) {
    var activeNode = null;
    for (var j = 0; j < nodes.length; j++) { if (nodes[j].id === possessedId) { activeNode = nodes[j]; break; } }
    var nodeName = activeNode ? activeNode.name : '???';
    var step = localPlayer.state.cinemaStepSize ?? 1;

    possessBanner =
      '<div class="mx-4 mt-2 px-4 py-2.5 rounded-md flex items-center justify-between" ' +
           'style="background: linear-gradient(90deg, rgba(0,200,255,0.08) 0%, rgba(0,200,255,0.03) 100%); border: 1px solid rgba(0,200,255,0.2);">' +
        '<div class="flex items-center gap-2">' +
          '<div class="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse" style="box-shadow: 0 0 10px rgba(0,200,255,0.8);"></div>' +
          '<span class="text-cyan-300 text-xs font-mono tracking-wider">VIEWING: <span class="text-cyan-100 font-bold">' + nodeName + '</span></span>' +
        '</div>' +
        '<button data-interactive onclick="sendAction(\u0027cinema:release\u0027)" ' +
                'class="px-3 py-1.5 rounded text-xs font-mono font-bold text-cyan-200 transition-colors tracking-wider" ' +
                'style="background: rgba(0,200,255,0.12); border: 1px solid rgba(0,200,255,0.3);">RELEASE</button>' +
      '</div>';

    // ── Shot Inspector (side panel) ──
    if (activeNode) {
      var nid = activeNode.id;
      var q = '\u0027'; // single quote helper

      // Shared button style
      var nudgeBtnCls = 'w-8 h-8 rounded flex items-center justify-center text-sm font-mono font-bold transition-colors';
      var nudgeBtnStyle = 'background: rgba(0,200,255,0.06); border: 1px solid rgba(0,200,255,0.15);';
      var nudgeBtnHover = ' hover:bg-cyan-800/30';

      // Input field style
      var inputStyle = 'background: rgba(0,0,0,0.5); border: 1px solid rgba(0,200,255,0.15); color: rgba(0,200,255,0.9); text-align: center; width: 80px;';

      // Press-and-hold repeater: one shot on press, then it starts rolling after
      // a short beat and picks up speed the longer the button is held.
      // Stop is wired at window level so a mid-hold re-render can't strand it.
      function holdAttr(action, payloadJs) {
        var fire = 'function(){ sendAction(' + q + action + q + ', ' + payloadJs + '); }';
        return 'onpointerdown="(function(f){' +
            'if(window.__cinHoldStop)window.__cinHoldStop();' +
            'f();var n=0;var iv=null;' +
            'var tick=function(){n++;var r=n>26?3:(n>12?2:1);for(var i=0;i<r;i++)f();};' +
            'var to=setTimeout(function(){iv=setInterval(tick,70);},300);' +
            'window.__cinHoldStop=function(){clearTimeout(to);if(iv)clearInterval(iv);window.__cinHoldStop=null;};' +
            'if(!window.__cinHoldWired){window.__cinHoldWired=1;' +
              'var s=function(){if(window.__cinHoldStop)window.__cinHoldStop();};' +
              'window.addEventListener(' + q + 'pointerup' + q + ',s,true);' +
              'window.addEventListener(' + q + 'pointercancel' + q + ',s,true);' +
              'window.addEventListener(' + q + 'blur' + q + ',s,true);' +
            '}' +
          '})(' + fire + ')"';
      }

      // Helper: axis row
      function axisRow(label, color, axis, val) {
        return '<div class="flex items-center gap-2">' +
          '<span class="w-5 text-center text-xs font-mono font-bold" style="color: ' + color + ';">' + label + '</span>' +
          '<button data-interactive ' + holdAttr('cinema:nudgePos', '{ nodeId: ' + q + nid + q + ', axis: ' + q + axis + q + ', delta: -' + step + ' }') + ' ' +
            'class="' + nudgeBtnCls + nudgeBtnHover + ' text-cyan-400" style="' + nudgeBtnStyle + '">\u2212</button>' +
          '<input data-interactive type="number" step="0.1" value="' + val.toFixed(1) + '" ' +
            'class="h-8 rounded text-xs font-mono px-1" ' +
            'style="' + inputStyle + '" ' +
            'onchange="sendAction(' + q + 'cinema:setPosAxis' + q + ', { nodeId: ' + q + nid + q + ', axis: ' + q + axis + q + ', value: parseFloat(this.value) || 0 })" />' +
          '<button data-interactive ' + holdAttr('cinema:nudgePos', '{ nodeId: ' + q + nid + q + ', axis: ' + q + axis + q + ', delta: ' + step + ' }') + ' ' +
            'class="' + nudgeBtnCls + nudgeBtnHover + ' text-cyan-400" style="' + nudgeBtnStyle + '">+</button>' +
        '</div>';
      }

      // Helper: angle row
      function angleRow(label, actionNudge, actionSet, val) {
        return '<div class="flex items-center gap-2">' +
          '<span class="w-12 text-xs font-mono font-bold text-cyan-600 tracking-wider">' + label + '</span>' +
          '<button data-interactive ' + holdAttr(actionNudge, '{ nodeId: ' + q + nid + q + ', delta: -' + step + ' }') + ' ' +
            'class="' + nudgeBtnCls + nudgeBtnHover + ' text-cyan-400" style="' + nudgeBtnStyle + '">\u2212</button>' +
          '<input data-interactive type="number" step="0.5" value="' + val.toFixed(1) + '" ' +
            'class="h-8 rounded text-xs font-mono px-1" ' +
            'style="' + inputStyle + '" ' +
            'onchange="sendAction(' + q + actionSet + q + ', { nodeId: ' + q + nid + q + ', value: parseFloat(this.value) || 0 })" />' +
          '<button data-interactive ' + holdAttr(actionNudge, '{ nodeId: ' + q + nid + q + ', delta: ' + step + ' }') + ' ' +
            'class="' + nudgeBtnCls + nudgeBtnHover + ' text-cyan-400" style="' + nudgeBtnStyle + '">+</button>' +
          '<span class="text-xs font-mono text-cyan-800">\u00b0</span>' +
        '</div>';
      }

      possessSidePanel =
        '<div data-interactive style="position: fixed; left: ' + (panelX + 656) + 'px; top: ' + panelY + 'px; z-index: 101; width: 280px;" class="select-none">' +
          '<div class="flex flex-col bg-black/[0.94] border border-cyan-600/30 rounded-lg" ' +
               'style="backdrop-filter: blur(18px); box-shadow: 0 0 40px rgba(0,200,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03);">' +

            // Header
            '<div class="flex items-center gap-2 px-4 py-2.5" style="border-bottom: 1px solid rgba(0,200,255,0.10); background: linear-gradient(180deg, rgba(0,180,255,0.08) 0%, transparent 100%);">' +
              '<div class="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" style="box-shadow: 0 0 8px rgba(0,200,255,0.6);"></div>' +
              '<span class="text-cyan-400 text-xs font-mono tracking-[0.15em] uppercase font-bold">SHOT INSPECTOR</span>' +
            '</div>' +

            // Rename field
            '<div class="px-4 py-2.5 flex items-center gap-2" style="border-bottom: 1px solid rgba(0,200,255,0.08);">' +
              '<svg width="14" height="14" viewBox="0 0 12 12" fill="none">' +
                '<path d="M8.5 1.5l2 2M1 11l.5-2L9 1.5l2 2L3.5 11 1 11z" stroke="rgba(0,200,255,0.4)" stroke-width="0.8"/>' +
              '</svg>' +
              '<input data-interactive type="text" value="' + activeNode.name.replace(/"/g, '&quot;') + '" ' +
                'class="flex-1 h-7 rounded text-sm font-mono px-2 text-cyan-200" ' +
                'style="background: rgba(0,0,0,0.4); border: 1px solid rgba(0,200,255,0.1);" ' +
                'onchange="sendAction(' + q + 'cinema:rename' + q + ', { nodeId: ' + q + nid + q + ', name: this.value })" />' +
            '</div>' +

            // Position section
            '<div class="px-4 pt-3 pb-1">' +
              '<span class="text-[11px] font-mono font-bold tracking-[0.2em] text-cyan-600/60">POSITION</span>' +
            '</div>' +
            '<div class="px-4 pb-3 flex flex-col gap-1.5">' +
              axisRow('X', 'rgba(255,100,100,0.8)', 'x', activeNode.position.x) +
              axisRow('Y', 'rgba(100,255,100,0.8)', 'y', activeNode.position.y) +
              axisRow('Z', 'rgba(100,150,255,0.8)', 'z', activeNode.position.z) +
            '</div>' +

            // Angle section
            '<div class="px-4 pt-2 pb-1" style="border-top: 1px solid rgba(0,200,255,0.06);">' +
              '<span class="text-[11px] font-mono font-bold tracking-[0.2em] text-cyan-600/60">ANGLE</span>' +
            '</div>' +
            '<div class="px-4 pb-3 flex flex-col gap-1.5">' +
              angleRow('YAW', 'cinema:nudgeYaw', 'cinema:setYaw', activeNode.yaw) +
              angleRow('PITCH', 'cinema:nudgePitch', 'cinema:setPitch', activeNode.pitch) +
            '</div>' +

            // Step slider
            '<div class="px-4 py-2.5 flex items-center gap-2.5" style="border-top: 1px solid rgba(0,200,255,0.06);">' +
              '<span class="text-[11px] font-mono font-bold tracking-[0.2em] text-cyan-600/60 w-10">STEP</span>' +
              '<input data-interactive type="range" min="0.5" max="10" step="0.5" value="' + step + '" ' +
                'class="flex-1 h-1 appearance-none rounded cursor-pointer" ' +
                'style="background: linear-gradient(to right, rgba(0,200,255,0.3), rgba(0,200,255,0.1)); accent-color: rgba(0,200,255,0.7);" ' +
                'oninput="sendAction(' + q + 'cinema:setStep' + q + ', { step: parseFloat(this.value) })" />' +
              '<span class="text-xs font-mono text-cyan-500 w-10 text-right">' + step.toFixed(1) + '</span>' +
            '</div>' +

          '</div>' +
        '</div>';
    }
  }

  // ── Sequence Timeline ──
  var sequence = localPlayer.state.cinemaSequence || [];
  var playback = localPlayer.state.cinemaPlayback || null;
  var isPlaying = localPlayer.state.cinemaPlaying ?? false;

  // Selected sequence index lives on player state (cinemaUi.selIdx).
  // The v4.5 UI worker can't share `window._cinemaXxx` with browser inline onclick.
  var uiSeq = localPlayer.state.cinemaUi || {};

  // Resolve node name by id
  function resolveNodeName(nodeId) {
    for (var ri = 0; ri < nodes.length; ri++) {
      if (nodes[ri].id === nodeId) return nodes[ri].name;
    }
    return '???';
  }

  // Compute total duration
  var totalDuration = 0;
  for (var si = 0; si < sequence.length; si++) {
    totalDuration += (sequence[si].hold != null ? sequence[si].hold : 2) + (sequence[si].transition != null ? sequence[si].transition : 1);
  }

  // Format time as M:SS.s
  function fmtTime(sec) {
    if (sec < 0) sec = 0;
    var mins = Math.floor(sec / 60);
    var secs = sec - mins * 60;
    var whole = Math.floor(secs);
    var tenths = Math.floor((secs - whole) * 10);
    return mins + ':' + (whole < 10 ? '0' : '') + whole + '.' + tenths;
  }

  var tq = '\u0027'; // single quote

  // ── Transport Controls ──
  var canPlay = sequence.length >= 2;
  var pbPlaying = playback ? playback.playing : false;
  var pbLooping = playback ? playback.looping : false;
  var pbTime = playback ? (playback.time || 0) : 0;

  // SVG icons for transport
  var stopIcon = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor"/></svg>';
  var playIcon = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M4 2.5l8 4.5-8 4.5V2.5z" fill="currentColor"/></svg>';
  var pauseIcon = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="3" y="2.5" width="3" height="9" rx="0.7" fill="currentColor"/><rect x="8" y="2.5" width="3" height="9" rx="0.7" fill="currentColor"/></svg>';
  var loopIcon = '<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M10.5 4H5a2.5 2.5 0 000 5h1" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M3.5 10H9a2.5 2.5 0 000-5H8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M9 3l1.5 1L9 5" fill="currentColor"/><path d="M5 11l-1.5-1L5 9" fill="currentColor"/></svg>';

  var stopBtnStyle = isPlaying
    ? 'color: rgba(0,200,255,0.9); background: rgba(0,200,255,0.08); border: 1px solid rgba(0,200,255,0.25); cursor: pointer;'
    : 'color: rgba(0,200,255,0.2); background: rgba(0,200,255,0.02); border: 1px solid rgba(0,200,255,0.06); cursor: not-allowed; pointer-events: none;';

  var playBtnStyle = canPlay
    ? 'color: rgba(0,200,255,0.9); background: rgba(0,200,255,0.08); border: 1px solid rgba(0,200,255,0.25); cursor: pointer;'
    : 'color: rgba(0,200,255,0.2); background: rgba(0,200,255,0.02); border: 1px solid rgba(0,200,255,0.06); cursor: not-allowed; pointer-events: none;';

  var loopBtnStyle = pbLooping
    ? 'color: rgba(0,200,255,1); background: rgba(0,200,255,0.15); border: 1px solid rgba(0,200,255,0.4); box-shadow: 0 0 10px rgba(0,200,255,0.3); cursor: pointer;'
    : 'color: rgba(0,200,255,0.5); background: rgba(0,200,255,0.04); border: 1px solid rgba(0,200,255,0.12); cursor: pointer;';

  var transportBtnCls = 'w-9 h-9 rounded-md flex items-center justify-center transition-all';

  var transportBar =
    '<div class="flex items-center gap-2 px-4 py-2.5" style="border-top: 1px solid rgba(0,200,255,0.08);">' +
      // Label
      '<span class="text-[11px] font-mono font-bold tracking-[0.2em] text-cyan-600/50 mr-1">SEQ</span>' +
      // Stop
      '<button data-interactive onclick="sendAction(' + tq + 'cinema:stop' + tq + ')" class="' + transportBtnCls + '" style="' + stopBtnStyle + '" title="Stop">' + stopIcon + '</button>' +
      // Play/Pause
      '<button data-interactive onclick="sendAction(' + tq + (pbPlaying ? 'cinema:pause' : 'cinema:play') + tq + ')" class="' + transportBtnCls + '" style="' + playBtnStyle + '" title="' + (pbPlaying ? 'Pause' : 'Play') + '">' + (pbPlaying ? pauseIcon : playIcon) + '</button>' +
      // Loop
      '<button data-interactive onclick="sendAction(' + tq + 'cinema:loop' + tq + ')" class="' + transportBtnCls + '" style="' + loopBtnStyle + '" title="Loop">' + loopIcon + '</button>' +
      // Separator + Settings gear
      '<div style="width: 1px; height: 20px; background: rgba(0,200,255,0.10); margin: 0 4px;"></div>' +
      (function() {
        var settingsOpen = localPlayer.state.cinemaSettingsOpen ?? false;
        var gearStyle = settingsOpen
          ? 'color: rgba(0,200,255,1); background: rgba(0,200,255,0.15); border: 1px solid rgba(0,200,255,0.4); box-shadow: 0 0 10px rgba(0,200,255,0.3); cursor: pointer;'
          : 'color: rgba(0,200,255,0.5); background: rgba(0,200,255,0.04); border: 1px solid rgba(0,200,255,0.12); cursor: pointer;';
        var gearIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
          '<path d="M8 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" stroke-width="1.1"/>' +
          '<path d="M6.8 1.5h2.4l.35 1.7a5 5 0 011.4.8l1.6-.7 1.2 2.1-1.25 1a5.1 5.1 0 010 1.6l1.25 1-1.2 2.1-1.6-.7a5 5 0 01-1.4.8l-.35 1.7H6.8l-.35-1.7a5 5 0 01-1.4-.8l-1.6.7-1.2-2.1 1.25-1a5.1 5.1 0 010-1.6l-1.25-1 1.2-2.1 1.6.7a5 5 0 011.4-.8l.35-1.7z" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round"/>' +
          '</svg>';
        return '<button data-interactive onclick="sendAction(' + tq + 'cinema:toggleSettings' + tq + ')" class="' + transportBtnCls + '" style="' + gearStyle + '" title="Settings">' + gearIcon + '</button>';
      })() +
      // Time display
      '<div class="ml-auto flex items-center">' +
        '<span class="text-xs font-mono text-cyan-300" style="text-shadow: 0 0 6px rgba(0,200,255,0.3);">' + fmtTime(pbTime) + '</span>' +
        '<span class="text-xs font-mono text-cyan-700 mx-1">/</span>' +
        '<span class="text-xs font-mono text-cyan-500">' + fmtTime(totalDuration) + '</span>' +
      '</div>' +
    '</div>';

  // ── Settings Panel ──
  var settingsPanel = '';
  if (localPlayer.state.cinemaSettingsOpen) {
    var isSkippable = localPlayer.state.cinemaSkippable === true;
    var toggleBg = isSkippable ? 'rgba(0,200,255,0.25)' : 'rgba(0,200,255,0.06)';
    var toggleDot = isSkippable ? 'translateX(14px)' : 'translateX(0px)';
    var toggleDotColor = isSkippable ? 'rgba(0,200,255,1)' : 'rgba(0,200,255,0.3)';
    var showGizmos = localPlayer.state.cinemaShowGizmos !== false;
    var gizBg = showGizmos ? 'rgba(0,200,255,0.25)' : 'rgba(0,200,255,0.06)';
    var gizDot = showGizmos ? 'translateX(14px)' : 'translateX(0px)';
    var gizDotColor = showGizmos ? 'rgba(0,200,255,1)' : 'rgba(0,200,255,0.3)';
    var settingRow = function(label, hint, action, nextValue, bg, dot, dotColor) {
      return '<div class="flex items-center justify-between">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-[11px] font-mono font-bold tracking-[0.15em]" style="color: rgba(0,200,255,0.5);">' + label + '</span>' +
            '<span class="text-[10px] font-mono" style="color: rgba(0,200,255,0.25);">' + hint + '</span>' +
          '</div>' +
          '<button data-interactive onclick="sendAction(' + tq + action + tq + ', { value: ' + nextValue + ' })" ' +
            'style="width: 32px; height: 18px; border-radius: 9px; background: ' + bg + '; border: 1px solid rgba(0,200,255,0.15); cursor: pointer; position: relative; transition: background 0.2s;">' +
            '<div style="width: 12px; height: 12px; border-radius: 50%; background: ' + dotColor + '; position: absolute; top: 2px; left: 2px; transform: ' + dot + '; transition: transform 0.2s, background 0.2s;"></div>' +
          '</button>' +
        '</div>';
    };
    settingsPanel =
      '<div class="px-4 py-3 flex flex-col gap-2.5" style="border-top: 1px solid rgba(0,200,255,0.08);">' +
        settingRow('SKIPPABLE', 'Allow hold-to-skip during playback', 'cinema:setSkippable', !isSkippable, toggleBg, toggleDot, toggleDotColor) +
        settingRow('NODE GIZMOS', 'Show floating cameras in the world', 'cinema:setShowGizmos', !showGizmos, gizBg, gizDot, gizDotColor) +
      '</div>';
  }

  // ── Timeline Track ──
  var trackHtml = '';
  if (sequence.length === 0) {
    trackHtml =
      '<div class="px-4 pb-2">' +
        '<div class="py-6 rounded-md flex flex-col items-center justify-center gap-1.5" ' +
             'style="border: 1px dashed rgba(0,200,255,0.10);">' +
          '<svg width="20" height="20" viewBox="0 0 18 18" fill="none" opacity="0.25">' +
            '<rect x="1" y="7" width="16" height="4" rx="1" stroke="rgba(0,200,255,0.5)" stroke-width="0.7"/>' +
            '<rect x="3" y="8" width="3" height="2" rx="0.5" fill="rgba(0,200,255,0.3)"/>' +
            '<rect x="7.5" y="8" width="4" height="2" rx="0.5" fill="rgba(0,200,255,0.2)"/>' +
            '<rect x="13" y="8" width="2.5" height="2" rx="0.5" fill="rgba(0,200,255,0.15)"/>' +
          '</svg>' +
          '<span class="text-cyan-900/40 text-xs font-mono tracking-[0.15em]">Add shots from the node list above \u2191</span>' +
        '</div>' +
      '</div>';
  } else {
    // Determine which shot is currently playing (for glow highlight)
    var activeSeqIdx = -1;
    if (playback && isPlaying) {
      var tAccum = 0;
      for (var ai = 0; ai < sequence.length; ai++) {
        var shotDur = (sequence[ai].hold || 2) + (sequence[ai].transition || 1);
        if (pbTime >= tAccum && pbTime < tAccum + shotDur) { activeSeqIdx = ai; break; }
        tAccum += shotDur;
      }
      if (activeSeqIdx === -1 && sequence.length > 0) activeSeqIdx = sequence.length - 1;
    }

    var selIdx = (uiSeq.selIdx != null) ? uiSeq.selIdx : null;
    // Validate selIdx (out of range -> treat as unselected; director will re-sync next click)
    if (selIdx !== null && (selIdx < 0 || selIdx >= sequence.length)) {
      selIdx = null;
    }

    // Build shot blocks
    var shotBlocks = [];
    for (var bi = 0; bi < sequence.length; bi++) {
      var entry = sequence[bi];
      var shotName = resolveNodeName(entry.nodeId);
      var holdTime = entry.hold != null ? entry.hold : 2;
      var transTime = entry.transition != null ? entry.transition : 1;
      var entryDur = holdTime + transTime;
      var widthPct = totalDuration > 0 ? (entryDur / totalDuration * 100) : (100 / sequence.length);

      var isActiveShot = bi === activeSeqIdx;
      var isSelected = bi === selIdx;
      var isEndingShot = !!entry.ending;
      var shotBg = isEndingShot
        ? 'background: rgba(255,180,60,0.06);'
        : bi % 2 === 0
          ? 'background: rgba(0,200,255,0.04);'
          : 'background: rgba(0,180,255,0.07);';
      var shotBorder = isSelected
        ? 'border: 1px solid rgba(0,200,255,0.5); box-shadow: 0 0 8px rgba(0,200,255,0.15);'
        : isActiveShot
          ? 'border: 1px solid rgba(0,200,255,0.4); box-shadow: 0 0 12px rgba(0,200,255,0.2);'
          : isEndingShot
            ? 'border: 1px solid rgba(255,180,60,0.25);'
            : 'border: 1px solid rgba(0,200,255,0.08);';

      // Hold portion vs transition portion visual
      var holdPct = entryDur > 0 ? (holdTime / entryDur * 100) : 100;

      // Toggle: click selected shot to deselect; otherwise select it. Bake decision into the inline.
      var shotClickVal = (selIdx === bi) ? 'null' : String(bi);
      shotBlocks.push(
        '<div data-interactive onclick="event.stopPropagation(); sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + 'selIdx' + tq + ', value: ' + shotClickVal + ' })" ' +
             'class="relative flex-shrink-0 rounded-sm overflow-hidden cursor-pointer transition-all" ' +
             'style="width: ' + widthPct + '%; min-width: 44px; height: 42px; ' + shotBg + shotBorder + '">' +
          // Hold region
          '<div class="absolute top-0 left-0 h-full" style="width: ' + holdPct + '%; background: rgba(0,200,255,0.05);"></div>' +
          // Transition diagonal indicator
          (transTime > 0 ? '<div class="absolute top-0 right-0 h-full" style="width: ' + (100 - holdPct) + '%; background: linear-gradient(135deg, rgba(0,200,255,0.03) 0%, rgba(200,100,255,0.06) 100%);"></div>' : '') +
          // Shot label
          '<div class="absolute inset-0 flex items-center justify-center px-1">' +
            '<span class="text-[11px] font-mono text-cyan-400/80 truncate">' + shotName + '</span>' +
          '</div>' +
          // Index badge
          '<div class="absolute top-0.5 left-0.5 px-1 rounded-sm" style="background: rgba(0,0,0,0.5);">' +
            '<span class="text-[9px] font-mono text-cyan-600">' + String(bi + 1).padStart(2, '0') + '</span>' +
          '</div>' +
          // Ending badge
          (isEndingShot ? '<div class="absolute top-0.5 right-0.5 px-1 rounded-sm" style="background: rgba(0,0,0,0.6);"><span class="text-[8px] font-mono font-bold text-amber-400/80 tracking-wider">END</span></div>' : '') +
          // Active glow
          (isActiveShot ? '<div class="absolute inset-0 animate-pulse" style="background: rgba(0,200,255,0.06);"></div>' : '') +
        '</div>'
      );
    }

    // Playhead position
    var playheadPct = totalDuration > 0 ? (pbTime / totalDuration * 100) : 0;
    var playheadHtml = playback
      ? '<div class="absolute top-0 h-full pointer-events-none" style="left: ' + playheadPct + '%; width: 2px; background: rgba(0,200,255,0.9); box-shadow: 0 0 8px rgba(0,200,255,0.6), 0 0 2px rgba(0,200,255,1); z-index: 10; transition: left 0.1s linear;"></div>'
      : '';

    // Inline scrub: compute fraction from click, scale by totalDuration, dispatch.
    var scrubAction =
      'var r=this.getBoundingClientRect();' +
      'var f=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));' +
      'sendAction(' + tq + 'cinema:scrub' + tq + ',{time:f*' + totalDuration + '});';
    trackHtml =
      '<div class="px-4 pb-2">' +
        '<div data-interactive class="cinema-hscroll relative flex gap-0.5 rounded-md overflow-x-auto overflow-y-hidden cursor-pointer" ' +
             'style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,200,255,0.06); padding: 4px; min-height: 50px;" ' +
             'onclick="' + scrubAction + '">' +
          shotBlocks.join('') +
          playheadHtml +
        '</div>' +
      '</div>';
  }

  // ── Per-Shot Controls (selected shot) ──
  var shotControlsHtml = '';
  var selIdx2 = (uiSeq.selIdx != null) ? uiSeq.selIdx : null;
  if (selIdx2 !== null && selIdx2 >= 0 && selIdx2 < sequence.length) {
    var selEntry = sequence[selIdx2];
    var selName = resolveNodeName(selEntry.nodeId);
    var selHold = selEntry.hold != null ? selEntry.hold : 2;
    var selTrans = selEntry.transition != null ? selEntry.transition : 1;
    var selEasing = selEntry.easing || 'easeInOutCubic';
    var selEnding = !!selEntry.ending;

    var easingOptions = ['linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeInOutSine'];
    var easingSelectParts = [];
    for (var ei = 0; ei < easingOptions.length; ei++) {
      var eOpt = easingOptions[ei];
      easingSelectParts.push('<option value="' + eOpt + '"' + (eOpt === selEasing ? ' selected' : '') + '>' + eOpt + '</option>');
    }

    var ctrlInputStyle = 'background: rgba(0,0,0,0.5); border: 1px solid rgba(0,200,255,0.15); color: rgba(0,200,255,0.9); text-align: center; width: 64px;';
    var ctrlNudgeCls = 'w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold transition-colors hover:bg-cyan-800/30 text-cyan-400';
    var ctrlNudgeStyle = 'background: rgba(0,200,255,0.06); border: 1px solid rgba(0,200,255,0.15);';
    var dimStyle = selEnding ? ' opacity: 0.25; pointer-events: none;' : '';

    // Boundary checks for reorder
    var canMoveUp = selIdx2 > 0;
    var canMoveDown = selIdx2 < sequence.length - 1;
    var moveUpStyle = canMoveUp
      ? 'color: rgba(0,200,255,0.7); cursor: pointer;'
      : 'color: rgba(0,200,255,0.15); cursor: not-allowed; pointer-events: none;';
    var moveDownStyle = canMoveDown
      ? 'color: rgba(0,200,255,0.7); cursor: pointer;'
      : 'color: rgba(0,200,255,0.15); cursor: not-allowed; pointer-events: none;';

    shotControlsHtml =
      '<div class="px-4 pb-3">' +
        '<div class="rounded-md overflow-hidden" style="border: 1px solid rgba(0,200,255,0.10); background: rgba(0,10,20,0.5);">' +

          // Header: shot name + ending toggle + reorder + delete
          '<div class="flex items-center gap-2 px-4 py-2" style="border-bottom: 1px solid rgba(0,200,255,0.06);">' +
            '<span class="text-[11px] font-mono font-bold tracking-[0.15em] text-cyan-600/50">SHOT</span>' +
            '<span class="text-xs font-mono text-cyan-300 flex-1 truncate">' + selName + '</span>' +
            // Ending toggle
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:seqEnding' + tq + ', { index: ' + selIdx2 + ' })" ' +
                    'class="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider transition-all" ' +
                    'style="' + (selEnding
                      ? 'color: rgba(255,180,60,1); background: rgba(255,180,60,0.15); border: 1px solid rgba(255,180,60,0.4); box-shadow: 0 0 8px rgba(255,180,60,0.2);'
                      : 'color: rgba(0,200,255,0.35); background: rgba(0,200,255,0.03); border: 1px solid rgba(0,200,255,0.10);') + '" ' +
                    'title="' + (selEnding ? 'Unmark as ending shot' : 'Mark as ending shot — camera holds here forever') + '">END</button>' +
            // Reorder up
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:seqMove' + tq + ', { from: ' + selIdx2 + ', to: ' + (selIdx2 - 1) + ' }); sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + 'selIdx' + tq + ', value: ' + (selIdx2 - 1) + ' });" ' +
                    'class="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-cyan-900/30" style="' + moveUpStyle + '" title="Move up">' +
              '<svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M2 6.5L5 3.5L8 6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            // Reorder down
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:seqMove' + tq + ', { from: ' + selIdx2 + ', to: ' + (selIdx2 + 1) + ' }); sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + 'selIdx' + tq + ', value: ' + (selIdx2 + 1) + ' });" ' +
                    'class="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-cyan-900/30" style="' + moveDownStyle + '" title="Move down">' +
              '<svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            // Remove
            '<button data-interactive onclick="sendAction(' + tq + 'cinema:uiSet' + tq + ', { key: ' + tq + 'selIdx' + tq + ', value: null }); sendAction(' + tq + 'cinema:seqRemove' + tq + ', { index: ' + selIdx2 + ' });" ' +
                    'class="w-7 h-7 rounded flex items-center justify-center text-red-900/60 hover:text-red-400 hover:bg-red-900/15 transition-colors" title="Remove from sequence">' +
              '<svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +

          // Controls row: Hold, Transition, Easing — compact horizontal
          '<div class="flex items-center gap-3 px-4 py-2.5" style="' + dimStyle + '">' +

            // Hold
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-[11px] font-mono font-bold text-cyan-600/50 tracking-wider w-10">HOLD</span>' +
              '<button data-interactive onclick="sendAction(' + tq + 'cinema:seqHold' + tq + ', { index: ' + selIdx2 + ', value: Math.max(0.1, ' + selHold + ' - 0.5) })" ' +
                      'class="' + ctrlNudgeCls + '" style="' + ctrlNudgeStyle + '">\u2212</button>' +
              '<input data-interactive type="number" step="0.1" min="0.1" value="' + selHold.toFixed(1) + '" ' +
                'class="h-7 rounded text-xs font-mono px-1" style="' + ctrlInputStyle + '" ' +
                'onchange="sendAction(' + tq + 'cinema:seqHold' + tq + ', { index: ' + selIdx2 + ', value: Math.max(0.1, parseFloat(this.value) || 0.1) })" />' +
              '<button data-interactive onclick="sendAction(' + tq + 'cinema:seqHold' + tq + ', { index: ' + selIdx2 + ', value: ' + selHold + ' + 0.5 })" ' +
                      'class="' + ctrlNudgeCls + '" style="' + ctrlNudgeStyle + '">+</button>' +
              '<span class="text-[11px] font-mono text-cyan-800">s</span>' +
            '</div>' +

            // Transition
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-[11px] font-mono font-bold text-cyan-600/50 tracking-wider w-10">TRANS</span>' +
              '<button data-interactive onclick="sendAction(' + tq + 'cinema:seqTransition' + tq + ', { index: ' + selIdx2 + ', value: Math.max(0, ' + selTrans + ' - 0.5) })" ' +
                      'class="' + ctrlNudgeCls + '" style="' + ctrlNudgeStyle + '">\u2212</button>' +
              '<input data-interactive type="number" step="0.1" min="0" value="' + selTrans.toFixed(1) + '" ' +
                'class="h-7 rounded text-xs font-mono px-1" style="' + ctrlInputStyle + '" ' +
                'onchange="sendAction(' + tq + 'cinema:seqTransition' + tq + ', { index: ' + selIdx2 + ', value: Math.max(0, parseFloat(this.value) || 0) })" />' +
              '<button data-interactive onclick="sendAction(' + tq + 'cinema:seqTransition' + tq + ', { index: ' + selIdx2 + ', value: ' + selTrans + ' + 0.5 })" ' +
                      'class="' + ctrlNudgeCls + '" style="' + ctrlNudgeStyle + '">+</button>' +
              '<span class="text-[11px] font-mono text-cyan-800">s</span>' +
            '</div>' +

            // Easing
            '<div class="flex items-center gap-1.5 ml-auto">' +
              '<span class="text-[11px] font-mono font-bold text-cyan-600/50 tracking-wider">EASE</span>' +
              '<select data-interactive onchange="sendAction(' + tq + 'cinema:seqEasing' + tq + ', { index: ' + selIdx2 + ', value: this.value })" ' +
                'class="h-7 rounded text-xs font-mono px-1.5 text-cyan-300" ' +
                'style="background: rgba(0,0,0,0.5); border: 1px solid rgba(0,200,255,0.15); color: rgba(0,200,255,0.9);">' +
                easingSelectParts.join('') +
              '</select>' +
            '</div>' +

          '</div>' +
        '</div>' +
      '</div>';
  }

  var timelineHtml =
    transportBar +
    settingsPanel +
    trackHtml +
    shotControlsHtml +
    buildEffectsTrack(localPlayer, totalDuration, pbTime);

  // ── Color Picker Panel (side panel) ──
  
  var colorPickerPanel = '';
  if (ui.colorPicker && ui.selFx) {
    // Find current selected fx for the color
    var cpFx = null;
    var cpEffects = localPlayer.state.cinemaEffects || [];
    for (var cpI = 0; cpI < cpEffects.length; cpI++) {
      if (cpEffects[cpI].id === ui.selFx) { cpFx = cpEffects[cpI]; break; }
    }
    if (cpFx && (cpFx.type === 'colorWash' || cpFx.type === 'fade')) {
      var cpColor = (cpFx.params && cpFx.params.color) || (cpFx.type === 'colorWash' ? 'rgba(40,60,120,0.8)' : 'rgba(0,0,0,1)');
      var cpQ = '\u0027';

      // Cinematic preset palettes organized by mood
      var cpPresets = [
        { label: 'WARM', colors: [
          { name: 'Golden Hour', c: 'rgba(180,120,40,0.6)' },
          { name: 'Amber',      c: 'rgba(200,140,20,0.5)' },
          { name: 'Sunset',     c: 'rgba(200,80,40,0.5)' },
          { name: 'Firelight',  c: 'rgba(180,60,20,0.5)' },
          { name: 'Sepia',      c: 'rgba(140,100,50,0.45)' },
          { name: 'Candlelit',  c: 'rgba(160,110,30,0.4)' },
        ]},
        { label: 'COOL', colors: [
          { name: 'Moonlight',  c: 'rgba(40,60,140,0.5)' },
          { name: 'Deep Ocean', c: 'rgba(20,40,120,0.6)' },
          { name: 'Frost',      c: 'rgba(100,160,200,0.4)' },
          { name: 'Twilight',   c: 'rgba(60,40,120,0.5)' },
          { name: 'Ice',        c: 'rgba(140,200,220,0.35)' },
          { name: 'Arctic',     c: 'rgba(80,120,180,0.45)' },
        ]},
        { label: 'DRAMATIC', colors: [
          { name: 'Blood',      c: 'rgba(160,20,20,0.5)' },
          { name: 'Crimson',    c: 'rgba(180,30,50,0.45)' },
          { name: 'Toxic',      c: 'rgba(40,180,40,0.4)' },
          { name: 'Void',       c: 'rgba(20,0,40,0.7)' },
          { name: 'Neon',       c: 'rgba(180,40,200,0.4)' },
          { name: 'Bleach',     c: 'rgba(220,220,240,0.35)' },
        ]},
        { label: 'FADE', colors: [
          { name: 'Black',      c: 'rgba(0,0,0,1)' },
          { name: 'White',      c: 'rgba(255,255,255,1)' },
          { name: 'Warm Black', c: 'rgba(30,15,5,1)' },
          { name: 'Cold Black', c: 'rgba(5,10,25,1)' },
        ]},
      ];

      var presetRows = '';
      for (var prG = 0; prG < cpPresets.length; prG++) {
        var group = cpPresets[prG];
        var swatches = '';
        for (var prS = 0; prS < group.colors.length; prS++) {
          var preset = group.colors[prS];
          var isActive = cpColor === preset.c;
          swatches +=
            '<button data-interactive title="' + preset.name + '" ' +
              'onclick="sendAction(' + cpQ + 'cinema:fxUpdate' + cpQ + ', { id: ' + cpQ + cpFx.id + cpQ + ', params: { color: ' + cpQ + preset.c + cpQ + ' } })" ' +
              'class="relative group" style="width: 28px; height: 28px; border-radius: 4px; border: ' + (isActive ? '2px solid rgba(0,200,255,0.8)' : '1px solid rgba(255,255,255,0.12)') + '; background: ' + preset.c + '; box-shadow: ' + (isActive ? '0 0 8px rgba(0,200,255,0.4)' : 'inset 0 1px 0 rgba(255,255,255,0.1)') + ';">' +
            '</button>';
        }
        presetRows +=
          '<div class="flex flex-col gap-1.5">' +
            '<span class="text-[9px] font-mono tracking-[0.2em] uppercase" style="color: rgba(0,200,255,0.35);">' + group.label + '</span>' +
            '<div class="flex flex-wrap gap-1.5">' + swatches + '</div>' +
          '</div>';
      }

      colorPickerPanel =
        '<div data-interactive style="position: fixed; left: ' + (panelX + 656) + 'px; top: ' + (panelY + (isPossessing ? 340 : 0)) + 'px; z-index: 102; width: 240px;" class="select-none">' +
          '<div class="flex flex-col bg-black/[0.94] border border-purple-500/30 rounded-lg" ' +
               'style="backdrop-filter: blur(18px); box-shadow: 0 0 40px rgba(120,80,200,0.08), inset 0 1px 0 rgba(255,255,255,0.03);">' +

            // Header
            '<div class="flex items-center justify-between px-4 py-2.5" style="border-bottom: 1px solid rgba(120,80,200,0.15); background: linear-gradient(180deg, rgba(120,80,200,0.08) 0%, transparent 100%);">' +
              '<div class="flex items-center gap-2">' +
                '<div class="w-2 h-2 rounded-full" style="background: rgba(180,140,255,0.8); box-shadow: 0 0 8px rgba(120,80,200,0.6);"></div>' +
                '<span class="text-purple-300 text-xs font-mono tracking-[0.15em] uppercase font-bold">COLOR</span>' +
              '</div>' +
              '<button data-interactive onclick="sendAction(\u0027cinema:uiSet\u0027, { key: \u0027colorPicker\u0027, value: false })" ' +
                'class="text-purple-600 hover:text-purple-300 text-sm font-mono leading-none transition-colors">\u2715</button>' +
            '</div>' +

            // Preview swatch
            '<div class="px-4 pt-3 pb-2">' +
              '<div style="width: 100%; height: 36px; border-radius: 6px; background: ' + cpColor + '; border: 1px solid rgba(255,255,255,0.1); box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);"></div>' +
            '</div>' +

            // Custom input
            '<div class="px-4 pb-2 flex items-center gap-1.5">' +
              '<span class="text-[9px] font-mono uppercase tracking-wider" style="color: rgba(120,80,200,0.5);">RGBA</span>' +
              '<input data-interactive type="text" value="' + cpColor.replace(/"/g, '&quot;') + '" ' +
                'class="h-6 rounded text-[10px] font-mono px-1.5 flex-1" ' +
                'style="background: rgba(0,0,0,0.5); border: 1px solid rgba(120,80,200,0.2); color: rgba(180,140,255,0.8); outline: none; width: auto; text-align: left;" ' +
                'onchange="sendAction(' + cpQ + 'cinema:fxUpdate' + cpQ + ', { id: ' + cpQ + cpFx.id + cpQ + ', params: { color: this.value } })" />' +
            '</div>' +

            // Preset palette grid
            '<div class="px-4 pb-4 pt-1 flex flex-col gap-3">' +
              presetRows +
            '</div>' +

          '</div>' +
        '</div>';
    }
  }

  // ── Audio Picker Panel (side panel) ──
  
  var audioPickerPanel = '';
  if (ui.audioPicker && ui.selFx) {
    var apFx = null;
    var apEffects = localPlayer.state.cinemaEffects || [];
    for (var apI = 0; apI < apEffects.length; apI++) {
      if (apEffects[apI].id === ui.selFx) { apFx = apEffects[apI]; break; }
    }
    if (apFx && (apFx.type === 'playSound' || apFx.type === 'musicShift')) {
      var apQ = '\u0027';
      var apClip = (apFx.params && apFx.params.clip) || '';
      var isMusic = apFx.type === 'musicShift';
      var accentColor = isMusic ? '0,255,200' : '80,255,180';

      var audioLib = [
        { label: 'MUSIC', clips: [
          { name: 'Mecha Combat', clip: 'cdn/music-instrumental-industrial-mecha-combat-electronic-intense.mp3' },
          { name: 'Cinematic Tension', clip: 'cdn/music-instrumental-cinematic-tension.mp3' },
          { name: 'Lunar Dream', clip: 'cdn/music-lunar-dream-vocal-lullaby-3cicf-be.mp3' },
        ]},
        { label: 'WEAPONS', clips: [
          { name: 'Laser Cannon', clip: 'cdn/sfx-laser-cannon-fire-sci-fi.mp3' },
          { name: 'Gatling Burst', clip: 'cdn/sfx-gatling-gun-burst-rapid-fire.mp3' },
          { name: 'Beam Rifle', clip: 'cdn/sfx-beam-rifle-shot-energy.mp3' },
          { name: 'Laser Beam', clip: 'cdn/sfx-laser-beam-sustained-sci-fi.mp3' },
          { name: 'Plasma Slash', clip: 'cdn/sfx-plasma-slash-energy-wave.mp3' },
          { name: 'Missile Launch', clip: 'cdn/sfx-missile-launch-whoosh.mp3' },
        ]},
        { label: 'IMPACTS', clips: [
          { name: 'Heavy Impact', clip: 'cdn/sfx-impact-heavy.mp3' },
          { name: 'Laser Impact', clip: 'cdn/sfx-laser-impact-explosion.mp3' },
          { name: 'Robot Explosion', clip: 'cdn/sfx-robot-explosion-metallic.mp3' },
          { name: 'Metal Scrape', clip: 'cdn/sfx-metal-scrape-spark.mp3' },
          { name: 'Mech Landing', clip: 'cdn/sfx-heavy-mech-landing-impact-metal.mp3' },
        ]},
        { label: 'MECHANICAL', clips: [
          { name: 'Reload Chamber', clip: 'cdn/sfx-weapon-reload-chamber-click.mp3' },
          { name: 'Dry Fire Click', clip: 'cdn/sfx-gun-empty-click-dry-fire.mp3' },
          { name: 'Boost Thruster', clip: 'cdn/sfx-mecha-boost-dash-burst-thruster.mp3' },
        ]},
        { label: 'UI / SYSTEM', clips: [
          { name: 'UI Confirm', clip: 'cdn/sfx-ui-futuristic-confirm.mp3' },
          { name: 'Camera Shutter', clip: 'cdn/sfx-camera-shutter-click.mp3' },
        ]},
        { label: 'AMBIENT', clips: [
          { name: 'Factory Hum', clip: 'cdn/sfx-ambient-industrial-factory-hum-distant.mp3' },
        ]},
      ];

      var audioRows = '';
      for (var aG = 0; aG < audioLib.length; aG++) {
        var aGroup = audioLib[aG];
        var clipItems = '';
        for (var aC = 0; aC < aGroup.clips.length; aC++) {
          var aEntry = aGroup.clips[aC];
          var isActiveClip = apClip === aEntry.clip;
          clipItems +=
            '<button data-interactive ' +
              'onclick="sendAction(' + apQ + 'cinema:fxUpdate' + apQ + ', { id: ' + apQ + apFx.id + apQ + ', params: { clip: ' + apQ + aEntry.clip + apQ + ' } })" ' +
              'class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors" ' +
              'style="background: ' + (isActiveClip ? 'rgba(' + accentColor + ',0.12)' : 'transparent') + '; border: 1px solid ' + (isActiveClip ? 'rgba(' + accentColor + ',0.3)' : 'rgba(255,255,255,0.04)') + ';">' +
              '<div class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background: ' + (isActiveClip ? 'rgba(' + accentColor + ',0.9)' : 'rgba(255,255,255,0.15)') + ';"></div>' +
              '<span class="text-[11px] font-mono truncate" style="color: ' + (isActiveClip ? 'rgba(' + accentColor + ',0.95)' : 'rgba(255,255,255,0.55)') + ';">' + aEntry.name + '</span>' +
            '</button>';
        }
        audioRows +=
          '<div class="flex flex-col gap-1">' +
            '<span class="text-[9px] font-mono tracking-[0.2em] uppercase px-1" style="color: rgba(' + accentColor + ',0.35);">' + aGroup.label + '</span>' +
            '<div class="flex flex-col gap-0.5">' + clipItems + '</div>' +
          '</div>';
      }

      audioPickerPanel =
        '<div data-interactive style="position: fixed; left: ' + (panelX + 656) + 'px; top: ' + (panelY + (isPossessing ? 340 : 0)) + 'px; z-index: 102; width: 260px;" class="select-none">' +
          '<div class="flex flex-col bg-black/[0.94] border rounded-lg" ' +
               'style="border-color: rgba(' + accentColor + ',0.25); backdrop-filter: blur(18px); box-shadow: 0 0 40px rgba(' + accentColor + ',0.06), inset 0 1px 0 rgba(255,255,255,0.03);">' +

            '<div class="flex items-center justify-between px-4 py-2.5" style="border-bottom: 1px solid rgba(' + accentColor + ',0.12); background: linear-gradient(180deg, rgba(' + accentColor + ',0.06) 0%, transparent 100%);">' +
              '<div class="flex items-center gap-2">' +
                '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2v8l7-4-7-4z" fill="rgba(' + accentColor + ',0.8)"/></svg>' +
                '<span class="text-xs font-mono tracking-[0.15em] uppercase font-bold" style="color: rgba(' + accentColor + ',0.8);">AUDIO</span>' +
              '</div>' +
              '<button data-interactive onclick="sendAction(\u0027cinema:uiSet\u0027, { key: \u0027audioPicker\u0027, value: false })" ' +
                'class="text-sm font-mono leading-none transition-colors" style="color: rgba(' + accentColor + ',0.4);">\u2715</button>' +
            '</div>' +

            '<div class="px-4 pt-3 pb-2">' +
              '<div class="flex items-center gap-2 px-2.5 py-2 rounded" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(' + accentColor + ',0.1);">' +
                '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="0" y="2" width="2" height="6" rx="0.5" fill="rgba(' + accentColor + ',0.6)"/><rect x="4" y="0" width="2" height="10" rx="0.5" fill="rgba(' + accentColor + ',0.6)"/><rect x="8" y="3" width="2" height="4" rx="0.5" fill="rgba(' + accentColor + ',0.6)"/></svg>' +
                '<span class="text-[10px] font-mono truncate" style="color: rgba(' + accentColor + ',0.6);">' + (apClip ? apClip.replace('cdn/', '').replace('.mp3', '').replace(/^(sfx-|music-instrumental-|music-vocals-|music-)/, '').replace(/-/g, ' ') : 'No clip selected') + '</span>' +
              '</div>' +
            '</div>' +

            '<div class="px-4 pb-2 flex items-center gap-1.5">' +
              '<span class="text-[9px] font-mono uppercase tracking-wider" style="color: rgba(' + accentColor + ',0.35);">URL</span>' +
              '<input data-interactive type="text" value="' + apClip.replace(/"/g, '&quot;') + '" ' +
                'placeholder="cdn/sfx-..." ' +
                'class="h-6 rounded text-[10px] font-mono px-1.5 flex-1" ' +
                'style="background: rgba(0,0,0,0.5); border: 1px solid rgba(' + accentColor + ',0.15); color: rgba(' + accentColor + ',0.7); outline: none; width: auto; text-align: left;" ' +
                'onchange="sendAction(' + apQ + 'cinema:fxUpdate' + apQ + ', { id: ' + apQ + apFx.id + apQ + ', params: { clip: this.value } })" />' +
            '</div>' +

            '<div class="cinema-scroll px-4 pb-4 pt-1 flex flex-col gap-3 overflow-y-auto" style="max-height: 340px;">' +
              audioRows +
            '</div>' +

          '</div>' +
        '</div>';
    }
  }

  // ── Clip Library Panel (side panel) ──
  if (typeof window._cinemaLibSaveName === 'undefined') window._cinemaLibSaveName = '';
  if (typeof window._cinemaImportText === 'undefined') window._cinemaImportText = '';
  var libPanel = '';
  if (localPlayer.state.cinemaLibOpen) {
    var libQ = '\u0027';
    var libClips = localPlayer.state.cinemaLibrary || [];
    var libLoading = !!localPlayer.state.cinemaLibLoading;
    var libAccent = '255,180,0';

    // Count current session data for save preview
    var libNodeCount = (localPlayer.state.cinemaNodes || []).length;
    var libSeqCount = (localPlayer.state.cinemaSequence || []).length;
    var libFxCount = (localPlayer.state.cinemaEffects || []).length;

    // Save section
    var saveSection =
      '<div class="px-4 pt-3 pb-3" style="border-bottom: 1px solid rgba(' + libAccent + ',0.08);">' +
        '<span class="text-[9px] font-mono tracking-[0.2em] uppercase" style="color: rgba(' + libAccent + ',0.35);">SAVE CURRENT</span>' +
        '<div class="flex items-center gap-1.5 mt-2">' +
          '<input data-interactive type="text" placeholder="Clip name..." ' +
            'value="' + (window._cinemaLibSaveName || '').replace(/"/g, '&quot;') + '" ' +
            'oninput="window._cinemaLibSaveName = this.value;" ' +
            'class="h-7 rounded text-[11px] font-mono px-2 flex-1" ' +
            'style="background: rgba(0,0,0,0.5); border: 1px solid rgba(' + libAccent + ',0.2); color: rgba(' + libAccent + ',0.8); outline: none;" />' +
          '<button data-interactive onclick="sendAction(' + libQ + 'cinema:libSave' + libQ + ', { name: window._cinemaLibSaveName || ' + libQ + 'Untitled' + libQ + ' }); window._cinemaLibSaveName = ' + libQ + libQ + ';" ' +
            'class="h-7 px-3 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
            'style="background: rgba(' + libAccent + ',0.15); color: rgba(' + libAccent + ',0.9); border: 1px solid rgba(' + libAccent + ',0.3);">' +
            'SAVE</button>' +
        '</div>' +
        '<div class="flex items-center gap-3 mt-1.5">' +
          '<span class="text-[9px] font-mono" style="color: rgba(255,255,255,0.25);">' + libNodeCount + ' node' + (libNodeCount !== 1 ? 's' : '') + '</span>' +
          '<span class="text-[9px] font-mono" style="color: rgba(255,255,255,0.25);">' + libSeqCount + ' shot' + (libSeqCount !== 1 ? 's' : '') + '</span>' +
          '<span class="text-[9px] font-mono" style="color: rgba(255,255,255,0.25);">' + libFxCount + ' effect' + (libFxCount !== 1 ? 's' : '') + '</span>' +
        '</div>' +
      '</div>';

    // Import section
    var importSection =
      '<div class="px-4 pt-3 pb-3" style="border-bottom: 1px solid rgba(' + libAccent + ',0.08);">' +
        '<span class="text-[9px] font-mono tracking-[0.2em] uppercase" style="color: rgba(' + libAccent + ',0.35);">IMPORT CLIP</span>' +
        '<textarea data-interactive placeholder="Paste clip data here..." ' +
          'oninput="window._cinemaImportText = this.value;" ' +
          'class="w-full h-14 mt-2 rounded text-[10px] font-mono px-2 py-1.5 resize-none" ' +
          'style="background: rgba(0,0,0,0.5); border: 1px solid rgba(' + libAccent + ',0.15); color: rgba(' + libAccent + ',0.6); outline: none;">' + (window._cinemaImportText || '') + '</textarea>' +
        '<button data-interactive onclick="sendAction(\u0027cinema:libImport\u0027, { data: window._cinemaImportText }); window._cinemaImportText = \u0027\u0027;" ' +
          'class="w-full h-6 mt-1.5 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
          'style="background: rgba(0,200,255,0.08); color: rgba(0,200,255,0.7); border: 1px solid rgba(0,200,255,0.2);">IMPORT</button>' +
      '</div>';

    // Clip list
    var clipListHtml = '';
    if (libLoading) {
      clipListHtml =
        '<div class="flex items-center justify-center py-6">' +
          '<span class="text-[11px] font-mono animate-pulse" style="color: rgba(' + libAccent + ',0.4);">Loading...</span>' +
        '</div>';
    } else if (libClips.length === 0) {
      clipListHtml =
        '<div class="flex flex-col items-center justify-center py-6 gap-1">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 3h7l2 2h9v15H3V3z" stroke="rgba(' + libAccent + ',0.2)" stroke-width="1.2" fill="none"/><path d="M9 13h6M12 10v6" stroke="rgba(' + libAccent + ',0.15)" stroke-width="1" stroke-linecap="round"/></svg>' +
          '<span class="text-[10px] font-mono" style="color: rgba(255,255,255,0.2);">No saved clips yet</span>' +
        '</div>';
    } else {
      window._cinemaExportData = [];
      for (var lci = 0; lci < libClips.length; lci++) {
        var lc = libClips[lci];
        var lcNodes = (lc.nodes || []).length;
        var lcShots = (lc.sequence || []).length;
        var lcFx = (lc.effects || []).length;
        // Store export payload for clipboard copy
        window._cinemaExportData.push(JSON.stringify({ name: lc.name, nodes: lc.nodes, sequence: lc.sequence, effects: lc.effects }));
        clipListHtml +=
          '<div class="flex flex-col gap-1.5 p-2.5 rounded" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(' + libAccent + ',0.08);">' +
            '<div class="flex items-center gap-2">' +
              '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1" stroke="rgba(' + libAccent + ',0.5)" stroke-width="0.8"/><circle cx="6" cy="6" r="2" stroke="rgba(' + libAccent + ',0.5)" stroke-width="0.6"/><circle cx="6" cy="6" r="0.7" fill="rgba(' + libAccent + ',0.5)"/></svg>' +
              '<span class="text-[11px] font-mono font-bold flex-1 truncate" style="color: rgba(' + libAccent + ',0.85);">' + (lc.name || 'Untitled').replace(/</g, '&lt;') + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-3">' +
              '<span class="text-[9px] font-mono" style="color: rgba(255,255,255,0.2);">' + lcNodes + ' node' + (lcNodes !== 1 ? 's' : '') + '</span>' +
              '<span class="text-[9px] font-mono" style="color: rgba(255,255,255,0.2);">' + lcShots + ' shot' + (lcShots !== 1 ? 's' : '') + '</span>' +
              '<span class="text-[9px] font-mono" style="color: rgba(255,255,255,0.2);">' + lcFx + ' fx</span>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 mt-0.5">' +
              '<button data-interactive onclick="sendAction(' + libQ + 'cinema:libLoad' + libQ + ', { id: ' + libQ + lc.id + libQ + ' })" ' +
                'class="flex-1 h-6 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
                'style="background: rgba(0,200,255,0.1); color: rgba(0,200,255,0.8); border: 1px solid rgba(0,200,255,0.2);">LOAD</button>' +
              '<button data-interactive onclick="navigator.clipboard.writeText(window._cinemaExportData[' + lci + ']); this.textContent=\u0027COPIED\u0027; var _b=this; setTimeout(function(){_b.textContent=\u0027EXPORT\u0027},1200);" ' +
                'class="flex-1 h-6 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
                'style="background: rgba(' + libAccent + ',0.08); color: rgba(' + libAccent + ',0.7); border: 1px solid rgba(' + libAccent + ',0.2);">EXPORT</button>' +
              (window._cinemaConfirmDelete === lc.id
                ? '<button data-interactive onclick="sendAction(' + libQ + 'cinema:libDelete' + libQ + ', { id: ' + libQ + lc.id + libQ + ' }); window._cinemaConfirmDelete = null;" ' +
                    'class="h-6 px-2 rounded flex items-center justify-center text-[9px] font-mono font-bold tracking-wider" ' +
                    'style="background: rgba(200,40,40,0.25); color: rgba(255,100,100,0.95); border: 1px solid rgba(200,40,40,0.5);">' +
                    'DELETE</button>'
                : '<button data-interactive onclick="window._cinemaConfirmDelete = ' + libQ + lc.id + libQ + ';" ' +
                    'class="h-6 w-6 rounded flex items-center justify-center transition-colors" ' +
                    'style="background: rgba(200,40,40,0.08); border: 1px solid rgba(200,40,40,0.15);">' +
                    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="rgba(200,80,80,0.6)" stroke-width="1.2" stroke-linecap="round"/></svg>' +
                  '</button>') +
            '</div>' +
          '</div>';
      }
    }

    libPanel =
      '<div data-interactive style="position: fixed; left: ' + (panelX + 656) + 'px; top: ' + (panelY + (isPossessing ? 340 : 0)) + 'px; z-index: 101; width: 280px;" class="select-none">' +
        '<div class="flex flex-col bg-black/[0.94] border rounded-lg" ' +
             'style="border-color: rgba(' + libAccent + ',0.25); backdrop-filter: blur(18px); box-shadow: 0 0 40px rgba(' + libAccent + ',0.06), inset 0 1px 0 rgba(255,255,255,0.03);">' +

          // Header
          '<div class="flex items-center justify-between px-4 py-2.5" style="border-bottom: 1px solid rgba(' + libAccent + ',0.12); background: linear-gradient(180deg, rgba(' + libAccent + ',0.06) 0%, transparent 100%);">' +
            '<div class="flex items-center gap-2">' +
              '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5h3.5l1 1h4.5v8h-9v-9z" stroke="rgba(' + libAccent + ',0.8)" stroke-width="0.9" fill="none"/></svg>' +
              '<span class="text-xs font-mono tracking-[0.15em] uppercase font-bold" style="color: rgba(' + libAccent + ',0.8);">LIBRARY</span>' +
              '<span class="text-[9px] font-mono" style="color: rgba(' + libAccent + ',0.35);">' + libClips.length + ' clip' + (libClips.length !== 1 ? 's' : '') + '</span>' +
            '</div>' +
            '<button data-interactive onclick="sendAction(' + libQ + 'cinema:libOpen' + libQ + ')" ' +
              'class="text-sm font-mono leading-none transition-colors" style="color: rgba(' + libAccent + ',0.4);">\u2715</button>' +
          '</div>' +

          saveSection +
          importSection +

          // Clip list
          '<div class="cinema-scroll px-4 pb-4 pt-3 flex flex-col gap-2 overflow-y-auto" style="max-height: 360px;">' +
            clipListHtml +
          '</div>' +

        '</div>' +
      '</div>';
  }

  // ── Custom scrollbar styles ──
  var scrollStyle = '<style>' +
    '#cinema-panel .cinema-scroll::-webkit-scrollbar { width: 6px; }' +
    '#cinema-panel .cinema-scroll::-webkit-scrollbar-track { background: rgba(0,200,255,0.03); border-radius: 3px; }' +
    '#cinema-panel .cinema-scroll::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.18); border-radius: 3px; }' +
    '#cinema-panel .cinema-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,200,255,0.35); }' +
    '#cinema-panel .cinema-hscroll::-webkit-scrollbar { height: 5px; }' +
    '#cinema-panel .cinema-hscroll::-webkit-scrollbar-track { background: rgba(0,200,255,0.03); border-radius: 3px; }' +
    '#cinema-panel .cinema-hscroll::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.18); border-radius: 3px; }' +
    '#cinema-panel .cinema-hscroll::-webkit-scrollbar-thumb:hover { background: rgba(0,200,255,0.35); }' +
    '</style>';

  // ── Main panel ──
  return scrollStyle +
  '<div id="cinema-panel" data-interactive ' +
         'style="position:fixed; left:' + panelX + 'px; top:' + panelY + 'px; z-index:100; width:640px;" ' +
         'class="select-none">' +

    '<div class="flex flex-col bg-black/[0.94] border border-cyan-600/30 rounded-lg" ' +
         'style="backdrop-filter: blur(18px); box-shadow: 0 0 40px rgba(0,200,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03); max-height: 88vh; overflow: visible;">' +

      // Title bar
      '<div onmousedown="(function(e){var p=document.getElementById(\u0027cinema-panel\u0027);if(!p)return;var r=p.getBoundingClientRect();var ox=e.clientX-r.left,oy=e.clientY-r.top;var lT=0;function mm(ev){var nx=ev.clientX-ox,ny=ev.clientY-oy;p.style.left=nx+\u0027px\u0027;p.style.top=ny+\u0027px\u0027;var n=performance.now();if(n-lT>33){lT=n;sendAction(\u0027cinema:panelMove\u0027,{x:nx,y:ny});}}function mu(ev){document.removeEventListener(\u0027mousemove\u0027,mm);document.removeEventListener(\u0027mouseup\u0027,mu);var nx=ev.clientX-ox,ny=ev.clientY-oy;sendAction(\u0027cinema:panelMove\u0027,{x:nx,y:ny});}document.addEventListener(\u0027mousemove\u0027,mm);document.addEventListener(\u0027mouseup\u0027,mu);e.preventDefault();})(event)" ' +
           'class="flex items-center justify-between px-5 py-3 cursor-move flex-shrink-0" ' +
           'style="background: linear-gradient(180deg, rgba(0,180,255,0.10) 0%, transparent 100%); border-bottom: 1px solid rgba(0,200,255,0.10);">' +
        '<div class="flex items-center gap-2.5">' +
          '<div class="w-2.5 h-2.5 rounded-full bg-cyan-400" style="box-shadow: 0 0 8px rgba(0,200,255,0.5);"></div>' +
          '<span class="text-cyan-300 text-sm font-mono tracking-[0.2em] uppercase font-bold">CINEMA</span>' +
          '<span class="text-cyan-700/60 text-xs font-mono ml-1">' + nodes.length + ' NODE' + (nodes.length !== 1 ? 'S' : '') + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<button data-interactive onclick="sendAction(\u0027cinema:libOpen\u0027)" ' +
                  'class="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-colors" ' +
                  'style="background: ' + (localPlayer.state.cinemaLibOpen ? 'rgba(255,180,0,0.15)' : 'rgba(0,200,255,0.06)') + '; color: ' + (localPlayer.state.cinemaLibOpen ? 'rgba(255,200,80,0.9)' : 'rgba(0,200,255,0.5)') + '; border: 1px solid ' + (localPlayer.state.cinemaLibOpen ? 'rgba(255,180,0,0.3)' : 'rgba(0,200,255,0.12)') + ';">' +
            '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1h3l1 1h4v7H1V1z" stroke="currentColor" stroke-width="0.8" fill="none"/></svg>' +
            'LIBRARY' +
          '</button>' +
          '<button data-interactive onclick="sendAction(\u0027cinema:close\u0027)" ' +
                  'class="text-cyan-700 hover:text-cyan-300 text-base font-mono leading-none transition-colors">\u2715</button>' +
        '</div>' +
      '</div>' +

      // Stamp button
      '<div class="px-4 pt-3 pb-1 flex-shrink-0">' +
        '<button data-interactive onclick="sendAction(\u0027cinema:stamp\u0027)" ' +
                'class="w-full py-3 rounded-md text-cyan-300 text-sm font-mono tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2.5" ' +
                'style="background: linear-gradient(180deg, rgba(0,200,255,0.08) 0%, rgba(0,200,255,0.03) 100%); border: 1px solid rgba(0,200,255,0.20); box-shadow: 0 0 12px rgba(0,200,255,0.03);">' +
          '<svg width="17" height="17" viewBox="0 0 15 15" fill="none">' +
            '<rect x="1.5" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="0.9"/>' +
            '<circle cx="7.5" cy="8.5" r="2.8" stroke="currentColor" stroke-width="0.9"/>' +
            '<circle cx="7.5" cy="8.5" r="1" fill="currentColor"/>' +
            '<path d="M5 4V2.5C5 2.2 5.2 2 5.5 2h4c.3 0 .5.2.5.5V4" stroke="currentColor" stroke-width="0.7"/>' +
          '</svg>' +
          'STAMP SHOT' +
        '</button>' +
      '</div>' +

      possessBanner +

      // Node list header
      '<div class="px-5 pt-3 pb-1 flex items-center justify-between flex-shrink-0">' +
        '<span class="text-cyan-700/50 text-xs font-mono tracking-[0.2em] uppercase">CAMERA NODES</span>' +
      '</div>' +

      // Node list (custom scrollbar)
      '<div class="cinema-scroll px-4 pb-3 flex flex-col gap-2 overflow-y-auto flex-1" style="min-height: 100px; max-height: 420px;">' +
        nodeListHtml +
      '</div>' +

      // ── Sequence Timeline ──
      timelineHtml +

    '</div>' +
  '</div>' +
  possessSidePanel +
  colorPickerPanel +
  audioPickerPanel +
  libPanel;
};
