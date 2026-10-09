// ╔══════════════════════════════════════════════════════════════╗
// ║  LOADING TRANSITION — Player behavior that manages the    ║
// ║  fade → loading screen → enterPlace → fade-in cycle.     ║
// ║                                                            ║
// ║  Added as an ADDITIONAL behavior on the player entity.    ║
// ║  Does NOT modify player.js or any other existing script.  ║
// ║                                                            ║
// ║  To trigger a transition from any other script:           ║
// ║    objectApi.patchState({                                  ║
// ║      _loadingScreen: true,                                ║
// ║      _loadingPhase: 'fadeOut',                            ║
// ║      _loadingTimer: 0,                                    ║
// ║      _loadingOpacity: 0,                                  ║
// ║      _loadingTarget: {                                    ║
// ║        placeId: 'charselect',                             ║
// ║        spawnPoint: 'default',                             ║
// ║        createIfMissing: { ... },                          ║
// ║      },                                                   ║
// ║      _loadingPreEnter: function-name or inline setup,     ║
// ║    });                                                    ║
// ║                                                            ║
// ║  CRITICAL: enterPlace() can wipe state. The self-timer    ║
// ║  pattern ensures the loading screen always clears itself  ║
// ║  even if _loadingPhase is wiped by the place transition.  ║
// ╚══════════════════════════════════════════════════════════════╝

var FADE_OUT_DURATION = 0.6;   // seconds to go from transparent → black
var FADE_IN_DURATION  = 0.6;   // seconds to go from black → transparent
var LOADING_HOLD     = 2.5;    // minimum seconds to hold loading screen

export function update(objectApi, dt) {
  var s = objectApi.getState();

  // ── SELF-TIMER: independent of _loadingPhase ──
  // This is the critical safety net. If enterPlace() wipes _loadingPhase
  // but _loadingScreen survives, we still count down and dismiss.
  if (!s._loadingScreen) return;

  // Always tick the global loading timer
  var globalTimer = (s._loadingScreenTimer ?? 0) + dt;
  objectApi.patchState({ _loadingScreenTimer: globalTimer });

  var phase = s._loadingPhase;
  var timer = (s._loadingTimer ?? 0) + dt;

  // ── Phase: fadeOut — ramp opacity 0 → 1 ──
  if (phase === 'fadeOut') {
    var t = Math.min(timer / FADE_OUT_DURATION, 1);
    // Ease-out curve — visible darkening from frame 1, smooth arrival at black
    var opacity = t * (2 - t);

    // Once loading overlay is substantially opaque, clear the cinema fade overlay
    // so it doesn't linger underneath. This bridges the visual gap from title screen.
    if (opacity > 0.5 && s._cinemaFadeOpacity) {
      objectApi.patchState({ _cinemaFadeOpacity: 0, _cinemaFadeColor: null });
    }

    if (t >= 1) {
      // Fully black — trigger the place transition
      var target = s._loadingTarget;

      // Deferred camera release: title-flow.js kept the cinema camera alive
      // during the fade so the cutscene held on screen. Now that we're fully
      // black, it's safe to release without any visible flash.
      if (s._deferredClearCamera) {
        objectApi.clearCamera({ transition: { duration: 0 } });
        objectApi.patchState({ _deferredClearCamera: false });
      }

      if (target && target.placeId) {
        var enterOpts = { placeId: target.placeId };
        if (target.spawnPoint) enterOpts.spawnPoint = target.spawnPoint;
        if (target.createIfMissing) enterOpts.createIfMissing = target.createIfMissing;

        // Apply any pre-enter state patches the caller wants
        // (e.g., _charSelectOpen, arsenal wipes, etc.)
        if (target.preEnterState) {
          objectApi.patchState(target.preEnterState);
        }

        // ── Instance recovery ──────────────────────────────────
        // If the target placeId looks like an expired instance
        // (e.g. "ciellesdimension-8bdd3865-841e-4691-ade8-eeaf806a0529"),
        // enterPlace() will throw because the instance was cleaned up.
        // Detect this and retry with the base place + createIfMissing
        // so a fresh instance is created transparently.
        var UUID_SUFFIX_RE = /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        try {
          objectApi.enterPlace(enterOpts);
        } catch (err) {
          var placeId = enterOpts.placeId;
          var match = placeId.match(UUID_SUFFIX_RE);
          if (match) {
            // Extract base place id (everything before the UUID suffix)
            var basePlaceId = placeId.slice(0, match.index);
            objectApi.log('Instance expired, creating fresh instance', {
              expired: placeId,
              base: basePlaceId,
            });
            var fallbackOpts = {
              placeId: basePlaceId,
              spawnPoint: 'default',
              createIfMissing: enterOpts.createIfMissing || {
                instanceMode: 'instanced',
                persistence: 'ephemeral',
              },
            };
            objectApi.enterPlace(fallbackOpts);
          } else {
            // Not an instance ID — rethrow the original error
            throw err;
          }
        }

        // After enterPlace, state may be partially wiped.
        // Re-assert loading state to survive the transition.
        var reassert = {
          _loadingScreen: true,
          _loadingPhase: 'loading',
          _loadingTimer: 0,
          _loadingOpacity: 1,
          _loadingScreenTimer: globalTimer,
        };

        // Apply any post-enter state patches the caller needs to survive
        // the enterPlace wipe (e.g., _replayIntroRequested, initialized).
        if (target.postEnterState) {
          var postKeys = Object.keys(target.postEnterState);
          for (var pk = 0; pk < postKeys.length; pk++) {
            reassert[postKeys[pk]] = target.postEnterState[postKeys[pk]];
          }
        }

        objectApi.patchState(reassert);
      } else {
        // No target — just go to loading hold phase
        objectApi.patchState({
          _loadingPhase: 'loading',
          _loadingTimer: 0,
          _loadingOpacity: 1,
        });
      }
    } else {
      objectApi.patchState({
        _loadingTimer: timer,
        _loadingOpacity: opacity,
      });
    }
    return;
  }

  // ── Phase: loading — hold black screen with loading content ──
  if (phase === 'loading') {
    if (timer >= LOADING_HOLD) {
      // Held long enough — start fading in
      objectApi.patchState({
        _loadingPhase: 'fadeIn',
        _loadingTimer: 0,
        _loadingOpacity: 1,
      });
    } else {
      objectApi.patchState({
        _loadingTimer: timer,
        _loadingOpacity: 1,
      });
    }
    return;
  }

  // ── Phase: fadeIn — ramp opacity 1 → 0 ──
  if (phase === 'fadeIn') {
    var tf = Math.min(timer / FADE_IN_DURATION, 1);
    // Ease-in curve for smooth decel out of black
    var opacityFade = 1 - (tf * (2 - tf));

    if (tf >= 1) {
      // Fully transparent — clear all loading state and any lingering cinema fade
      objectApi.patchState({
        _loadingScreen: false,
        _loadingPhase: null,
        _loadingTimer: 0,
        _loadingOpacity: 0,
        _loadingTarget: null,
        _loadingScreenTimer: 0,
        _cinemaFadeOpacity: 0,
        _cinemaFadeColor: null,
      });
    } else {
      objectApi.patchState({
        _loadingTimer: timer,
        _loadingOpacity: opacityFade,
      });
    }
    return;
  }

  // ── FALLBACK: _loadingScreen is true but phase is null/undefined ──
  // This happens when enterPlace() wiped _loadingPhase.
  // Use the global self-timer to decide when to fade in.
  if (!phase) {
    // Keep fully black until the hold time has elapsed
    var totalTime = globalTimer;
    // The fadeOut took ~FADE_OUT_DURATION, so loading hold starts after that.
    // Total minimum time = FADE_OUT_DURATION + LOADING_HOLD
    var minTotalTime = FADE_OUT_DURATION + LOADING_HOLD;

    if (totalTime >= minTotalTime) {
      // Ready to fade in
      objectApi.patchState({
        _loadingPhase: 'fadeIn',
        _loadingTimer: 0,
        _loadingOpacity: 1,
      });
    } else {
      // Still holding — ramp opacity up gracefully instead of snapping to 1.
      // If fadeOut was in progress, the opacity may be mid-ramp. Don't override
      // it downward, only ensure it reaches 1 smoothly.
      var currentOpacity = s._loadingOpacity ?? 0;
      var rampedOpacity = Math.min(1, currentOpacity + dt / FADE_OUT_DURATION);
      objectApi.patchState({
        _loadingOpacity: rampedOpacity,
      });
    }
  }
}
