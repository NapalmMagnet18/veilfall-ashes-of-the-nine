// Cinema VFX Overlays — standalone UI module for Absolute Cinema mod.
// Renders fade, color wash, cinema text, and hold-to-skip overlays.
// Call renderCinemaOverlays(localPlayer) from ui.js and drop the result into the DOM.

export function renderCinemaOverlays(localPlayer) {
  var s = localPlayer.state || {};
  var html = '';

  // ── Fade overlay ──
  // Always in DOM so CSS transition can interpolate from 0 without flicker.
  var fadeOpacity = s._cinemaFadeOpacity || 0;
  var fadeColor = s._cinemaFadeColor || 'rgba(0,0,0,1)';
  var fadeActive = fadeOpacity > 0.001;
  html += '<div class="fixed inset-0" style="z-index: 9999; background: ' + fadeColor + '; opacity: ' + fadeOpacity.toFixed(3) + '; transition: opacity 80ms linear; pointer-events: ' + (fadeActive ? 'auto' : 'none') + ';"></div>';

  // ── Color wash overlay ──
  var washOpacity = s._cinemaWashOpacity || 0;
  var washColor = s._cinemaWashColor || 'rgba(40,60,120,0.8)';
  if (washOpacity > 0.001) {
    html += '<div class="fixed inset-0 pointer-events-none" style="z-index: 9998; background: ' + washColor + '; opacity: ' + washOpacity.toFixed(3) + ';"></div>';
  }

  // ── Cinema text overlay ──
  var textOpacity = s._cinemaTextOpacity || 0;
  var textContent = s._cinemaTextContent || '';
  var textFont = s._cinemaTextFont || 'Geist Pixel Square';
  var textFontSize = s._cinemaTextFontSize || 48;
  var textColor = s._cinemaTextColor || 'rgba(255,255,255,1)';
  var textPosX = s._cinemaTextPosX != null ? s._cinemaTextPosX : 50;
  var textPosY = s._cinemaTextPosY != null ? s._cinemaTextPosY : 50;
  if (textOpacity > 0.001 && textContent) {
    html += '<div class="fixed inset-0 pointer-events-none" style="z-index: 9997;">' +
      '<div style="position: absolute; left: ' + textPosX + '%; top: ' + textPosY + '%; transform: translate(-50%, -50%); ' +
        "font-family: '" + textFont + "' !important; font-size: " + textFontSize + "px !important; color: " + textColor + '; opacity: ' + textOpacity.toFixed(3) + '; ' +
        'text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.4); white-space: nowrap;">' +
        String(textContent).replace(/</g, '&lt;').replace(/>/g, '&gt;') +
      '</div></div>';
  }

  // ── Hold-to-skip indicator ──
  if (s.cinemaPlaying && s.cinemaPlayback && s.cinemaPlayback.playing && s.cinemaSkippable === true) {
    var skipHold = s._cinemaSkipHold || 0;
    var skipPct = Math.min(skipHold / 1.0, 1.0);
    var isHolding = skipHold > 0.01;
    var barWidth = 120;
    var barHeight = 4;
    var fillWidth = Math.round(skipPct * barWidth);
    var labelOpacity = isHolding ? 1.0 : 0.55;
    html += '<div class="fixed" style="z-index: 9996; bottom: 24px; right: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; opacity: ' + labelOpacity.toFixed(2) + '; transition: opacity 0.2s;">'
      + '<div style="font-family: \'Geist Pixel Square\'; font-size: 11px; color: rgba(255,255,255,0.7); text-shadow: 0 1px 4px rgba(0,0,0,0.8);">Hold Space to Skip</div>'
      + '<div style="width: ' + barWidth + 'px; height: ' + barHeight + 'px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden;">'
      + '<div style="width: ' + fillWidth + 'px; height: 100%; background: rgba(255,255,255,0.7); border-radius: 2px; transition: width 60ms linear;"></div>'
      + '</div></div>';
  }

  // ── Node name plates (world-anchored, above each gizmo) ──
  var playing = !!(s.cinemaPlaying || (s.cinemaPlayback && s.cinemaPlayback.playing) || s._cinemaSkipCountdown);
  if (s.cinemaOpen && !playing && s.cinemaShowGizmos !== false && Array.isArray(s.cinemaNodes)) {
    var nodes = s.cinemaNodes;
    var plates = '';
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || !n.position || n.id === s.possessedNodeId) continue;
      var nm = String((n.name && n.name.trim()) || 'CAM').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var anchor = n.position.x + ' ' + (n.position.y + 0.42) + ' ' + n.position.z;
      plates +=
        '<div data-world-anchor="' + anchor + '" data-anchor-offset="0 0 0" ' +
          'style="position:absolute; left:0; top:0; transform: translate(-50%, -100%); ' +
          'opacity: calc(1.15 - var(--anchor-depth, 10) / 60);">' +
          '<div style="display:flex; align-items:center; gap:6px; padding:3px 9px; border-radius:5px; ' +
            'background: rgba(4,8,12,0.85); border: 1px solid rgba(0,200,255,0.28); ' +
            'box-shadow: 0 2px 10px rgba(0,0,0,0.55), 0 0 12px rgba(0,200,255,0.10); white-space:nowrap;">' +
            '<span style="width:5px; height:5px; border-radius:50%; background: rgba(0,200,255,0.9); ' +
              'box-shadow: 0 0 6px rgba(0,200,255,0.8);"></span>' +
            '<span style="font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 0.08em; ' +
              'color: rgba(198,240,255,0.95); text-transform: uppercase;">' + nm + '</span>' +
          '</div>' +
        '</div>';
    }
    if (plates) {
      html += '<div class="fixed inset-0 pointer-events-none" style="z-index: 9990;">' + plates + '</div>';
    }
  }

  return html;
}

module.exports = { renderCinemaOverlays };
