// VEILFALL's frame: the Raytraced Lighting mod's screen-space traced reflections (its trace + temporal denoise),
// added onto the scene, then handed to the Awakening film look (sharpen, AO, ground mist, grade, bloom) as its scene.
// Reflections run on high/ultra only; low/medium/mobile get Awakening alone, exactly as before.
import { screenUV, vec2, vec3, vec4, float, mix, smoothstep, normalize, cross, dot, reflect, length, hash, min, max, sin, cos, convertToTexture, texture, cameraPosition, cameraViewMatrix, cameraProjectionMatrix, Loop, If } from "builtin/tsl";
import { look as awakening } from "../mods/awakening/look.js";

function reflections(ctx) {
  const mobile = ctx.device.class === "mobile";
  const STEPS = mobile ? 14 : 40;
  const GROWTH = 1.06;

  const rt = ctx.target("rt", { scale: 0.5 });
  const acc = ctx.target("acc", { scale: 0.5 });

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
  return denoised;
}

export function look(ctx) {
  const q = ctx.quality;
  if (ctx.device.class === "mobile" || !(q === "high" || q === "ultra")) return awakening(ctx);
  const denoised = reflections(ctx);
  // Awakening reads ctx.scene directly, so it grades the real scene; the traced reflections land on top of its frame
  return awakening(ctx).add(denoised.sample(screenUV).rgb.mul(ctx.param("reflection", 0.6)));
}
