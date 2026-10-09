// scripts/look-raytrace.js
// Screen-space ray-traced reflections, marched per pixel on the GPU, then denoised
// temporally against the previous frame. Not RT-core work (the browser exposes none) —
// this is real ray marching in the shader, reconstructing the camera's actual lens.
const {
  screenUV,
  vec2,
  vec3,
  vec4,
  float,
  mix,
  smoothstep,
  normalize,
  cross,
  dot,
  reflect,
  length,
  hash,
  min,
  max,
  sin,
  cos,
  convertToTexture,
  texture,
  cameraPosition,
  cameraViewMatrix,
  cameraProjectionMatrix,
  Loop,
  If,
} = require("builtin/tsl");

export function look(ctx) {
  const mobile = ctx.device.class === "mobile";
  const STEPS = mobile ? 14 : 64;
  const GROWTH = 1.06;

  const rt = ctx.target("rt", { scale: mobile ? 0.4 : 1 });
  const acc = ctx.target("acc", { scale: mobile ? 0.4 : 1 });

  // ---- pass 1: march a reflection ray per pixel against the depth buffer ----
  const traced = ctx.pass(rt, (uv) => {
    const texel = float(1).div(rt.size);

    const P = ctx.worldPosition(uv).toVar();
    const Px = ctx.worldPosition(uv.add(vec2(texel.x, 0)));
    const Py = ctx.worldPosition(uv.add(vec2(0, texel.y)));

    const N = normalize(cross(Px.sub(P), Py.sub(P))).toVar();
    const V = normalize(P.sub(cameraPosition)).toVar();
    // normals reconstructed from depth can point either way — turn them toward the eye
    N.assign(N.mul(dot(N, V).greaterThan(0).select(float(-1), float(1))));

    const R = reflect(V, N).toVar();

    const step0 = ctx.param("stepSize", 0.12);
    // start each ray at a different point inside its first step — trades the marching
    // staircase for noise, which the temporal pass eats
    const jitter = hash(uv.x.mul(3711.7).add(uv.y.mul(1287.3)).add(0.5));

    const stepVec = R.mul(step0).toVar();
    const Q = P.add(N.mul(0.04)).add(R.mul(jitter.mul(step0))).toVar();
    const dist = float(0).toVar();

    const hitColor = vec3(0).toVar();
    const hitUv = vec2(0.5).toVar();
    const hitDist = float(0).toVar();
    const hitW = float(0).toVar();

    Loop(STEPS, () => {
      Q.assign(Q.add(stepVec));
      dist.assign(dist.add(length(stepVec)));
      const view4 = cameraViewMatrix.mul(vec4(Q, 1)).toVar();
      const clip = cameraProjectionMatrix.mul(view4).toVar();
      const ndc = clip.xyz.div(clip.w.max(0.0001));
      const suv = vec2(ndc.x.mul(0.5).add(0.5), ndc.y.mul(-0.5).add(0.5)).toVar();

      const surfaceZ = cameraViewMatrix.mul(vec4(ctx.worldPosition(suv), 1)).z;
      const diff = surfaceZ.sub(view4.z); // > 0 => the ray is behind the visible surface
      const thickness = length(stepVec).mul(1.15).add(0.1);

      const onScreen = suv.x
        .greaterThan(0.001)
        .and(suv.x.lessThan(0.999))
        .and(suv.y.greaterThan(0.001))
        .and(suv.y.lessThan(0.999))
        .and(clip.w.greaterThan(0));

      const isHit = diff.greaterThan(0.015).and(diff.lessThan(thickness)).and(onScreen).and(hitW.lessThan(0.5));

      If(isHit, () => {
        hitColor.assign(texture(ctx.scene, suv).rgb);
        hitUv.assign(suv);
        hitDist.assign(dist);
        hitW.assign(float(1));
      });

      stepVec.assign(stepVec.mul(GROWTH));
    });

    // rays that walk off the frame have nothing to reflect — fade them out at the border
    const edge = smoothstep(0, 0.14, hitUv.x)
      .mul(smoothstep(0, 0.14, float(1).sub(hitUv.x)))
      .mul(smoothstep(0, 0.18, hitUv.y))
      .mul(smoothstep(0, 0.1, float(1).sub(hitUv.y)));

    // grazing angles reflect hardest
    const fresnel = float(1).sub(dot(N, V.mul(-1)).clamp(0, 1)).pow(4).mul(0.92).add(ctx.param("baseReflect", 0.05));

    // far hits are the least trustworthy — the march is coarsest out there
    const distFade = float(1).sub(hitDist.div(ctx.param("maxDistance", 26)).clamp(0, 1)).pow(0.8);

    const w = hitW.mul(edge).mul(fresnel).mul(distFade);

    // one lone ray landing on a light source is a firefly — squash the brightest hits
    // so a single pixel can't out-shout its neighbours
    const luma = hitColor.r.mul(0.3).add(hitColor.g.mul(0.6)).add(hitColor.b.mul(0.1));
    const tamed = hitColor.div(float(1).add(luma.mul(ctx.param("fireflyClamp", 2.2))));

    return vec4(tamed.mul(w), w);
  });

  // ---- pass 2: denoise — 5-tap spatial average blended into last frame's result ----
  const denoised = ctx.pass(acc, (uv) => {
    const texel = float(1).div(acc.size).mul(ctx.param("blurRadius", 0.9));
    // 3x3 tent — a cross leaves plus-shaped specks where single pixels are bright
    const offsets = [
      [0, 0, 4],
      [1, 0, 2],
      [-1, 0, 2],
      [0, 1, 2],
      [0, -1, 2],
      [1, 1, 1],
      [1, -1, 1],
      [-1, 1, 1],
      [-1, -1, 1],
    ];
    let s = null;
    let mn = null;
    let mx = null;
    for (const [ox, oy, weight] of offsets) {
      const tap = traced.sample(uv.add(vec2(texel.x.mul(ox), texel.y.mul(oy))));
      s = s === null ? tap.mul(weight) : s.add(tap.mul(weight));
      mn = mn === null ? tap : min(mn, tap);
      mx = mx === null ? tap : max(mx, tap);
    }
    s = s.div(16);

    // no previous-frame camera matrix exists to reproject with, so history gets pinned to
    // this frame's local colour range instead — the standard cure for the smear when the
    // camera swings and last frame's pixels no longer belong where they sit
    const history = max(mn, min(mx, acc.previous.sample(uv)));
    return mix(history, s, ctx.param("denoise", 0.4));
  });

  // ---- contact shadows: short rays around each point, counting what blocks the sky ----
  const aoT = ctx.target("ao", { scale: mobile ? 0.35 : 0.5 });
  const aoAcc = ctx.target("aoAcc", { scale: mobile ? 0.35 : 0.5 });
  const AO_TAPS = mobile ? 5 : 14;

  const aoPass = ctx.pass(aoT, (uv) => {
    const texel = float(1).div(aoT.size);
    const P = ctx.worldPosition(uv).toVar();
    const Px = ctx.worldPosition(uv.add(vec2(texel.x, 0)));
    const Py = ctx.worldPosition(uv.add(vec2(0, texel.y)));
    const N = normalize(cross(Px.sub(P), Py.sub(P))).toVar();
    const V = normalize(P.sub(cameraPosition)).toVar();
    N.assign(N.mul(dot(N, V).greaterThan(0).select(float(-1), float(1))));

    // any frame on the tangent plane will do — this one never degenerates
    const T = normalize(cross(N, vec3(0.577, 0.577, -0.577))).toVar();
    const B = cross(N, T).toVar();

    const radius = ctx.param("aoRadius", 1.5);
    const spin = hash(uv.x.mul(4177.1).add(uv.y.mul(2741.7))).mul(6.2831);
    const occ = float(0).toVar();

    for (let i = 0; i < AO_TAPS; i++) {
      const angle = spin.add((i / AO_TAPS) * 6.2831 * 2.4);
      const reach = 0.25 + 0.75 * ((i + 1) / AO_TAPS);
      const dir = T.mul(cos(angle))
        .add(B.mul(sin(angle)))
        .add(N.mul(0.75));
      const S = P.add(N.mul(0.02)).add(normalize(dir).mul(radius * reach));

      const view4 = cameraViewMatrix.mul(vec4(S, 1));
      const clip = cameraProjectionMatrix.mul(view4);
      const suv = vec2(clip.x.div(clip.w.max(0.0001)).mul(0.5).add(0.5), clip.y.div(clip.w.max(0.0001)).mul(-0.5).add(0.5));
      const surfaceZ = cameraViewMatrix.mul(vec4(ctx.worldPosition(suv), 1)).z;
      const gap = surfaceZ.sub(view4.z);

      // the sample sits behind real geometry, and close enough that it's a neighbour
      // rather than a distant wall — that's an occluder
      const blocked = gap.greaterThan(0.03).and(gap.lessThan(radius * 2.2)).and(clip.w.greaterThan(0));
      occ.assign(occ.add(blocked.select(float(1 / AO_TAPS), float(0))));
    }

    const ao = float(1).sub(occ.mul(ctx.param("aoStrength", 0.4))).clamp(0, 1);
    return vec4(ao, ao, ao, 1);
  });

  const aoSmooth = ctx.pass(aoAcc, (uv) => {
    const texel = float(1).div(aoAcc.size).mul(1.4);
    let s = aoPass.sample(uv).mul(4);
    s = s.add(aoPass.sample(uv.add(vec2(texel.x, 0))).mul(2));
    s = s.add(aoPass.sample(uv.sub(vec2(texel.x, 0))).mul(2));
    s = s.add(aoPass.sample(uv.add(vec2(0, texel.y))).mul(2));
    s = s.add(aoPass.sample(uv.sub(vec2(0, texel.y))).mul(2));
    s = s.add(aoPass.sample(uv.add(vec2(texel.x, texel.y))));
    s = s.add(aoPass.sample(uv.sub(vec2(texel.x, texel.y))));
    s = s.add(aoPass.sample(uv.add(vec2(texel.x, texel.y.negate()))));
    s = s.add(aoPass.sample(uv.add(vec2(texel.x.negate(), texel.y))));
    s = s.div(16);
    return mix(aoAcc.previous.sample(uv), s, 0.35);
  });

  // ---- the lit frame: scene, darkened where things touch, plus everything the rays found ----
  const shade = aoSmooth.sample(screenUV).r;
  const lit = convertToTexture(
    ctx.scene.mul(shade).add(denoised.sample(screenUV).rgb.mul(ctx.param("reflection", 1.15))),
  );

  // ---- bloom: pull the bright bars out and let them breathe into the air ----
  const bright = ctx.target("bright", { scale: 0.4 });
  const glowH = ctx.target("glowH", { scale: 0.4 });
  const glowV = ctx.target("glowV", { scale: 0.4 });

  const brightPass = ctx.pass(bright, (uv) => {
    const c = lit.sample(uv).rgb;
    const l = c.r.mul(0.3).add(c.g.mul(0.6)).add(c.b.mul(0.1));
    const keep = l.sub(ctx.param("bloomThreshold", 0.48)).max(0).div(l.max(0.0001)).clamp(0, 1);
    return vec4(c.mul(keep), 1);
  });

  // separable gaussian — a single sparse 2D kernel stamps a lattice into the glow
  // (the screen-door look); two overlapping 1D sweeps leave a smooth halo instead
  const WEIGHTS = [0.227, 0.194, 0.121, 0.054, 0.017];

  const sweep = (source, target, axis) =>
    ctx.pass(target, (uv) => {
      const texel = float(1).div(target.size).mul(ctx.param("bloomSpread", 1.15));
      const stepUv = axis === "x" ? vec2(texel.x, 0) : vec2(0, texel.y);
      let sum = source.sample(uv).mul(WEIGHTS[0]);
      for (let i = 1; i < WEIGHTS.length; i++) {
        sum = sum.add(source.sample(uv.add(stepUv.mul(i))).mul(WEIGHTS[i]));
        sum = sum.add(source.sample(uv.sub(stepUv.mul(i))).mul(WEIGHTS[i]));
      }
      return sum;
    });

  const blurredH = sweep(brightPass, glowH, "x");
  const blurredV = sweep(blurredH, glowV, "y");

  const b = blurredV.sample(screenUV).rgb.mul(ctx.param("bloom", 1.2));

  // a breath of vignette so the middle of the hall is where the eye sits
  const d = screenUV.sub(vec2(0.5)).mul(vec2(1.05, 0.72));
  const vignette = smoothstep(0.62, 0.16, length(d)).mul(0.28).add(0.72);

  return lit.sample(screenUV).rgb.add(b).mul(vignette);
}
