// VEILFALL's film stock: cold ash-blue mids, true blacks, fire left hot.
// High and ultra march a low ground mist that every brazier and lantern lights from inside;
// lower tiers keep the place's height fog as their air.
import { grade, vignette, grain } from 'builtin/postfx';
import { vec2, vec3, vec4, float, Loop, mx_noise_float, cameraPosition, screenUV } from 'builtin/tsl';
import { ambientRadiance, lightsAt, windTravel } from 'builtin/lighting';

function mist(ctx, scene) {
  const air = ctx.target('air', { width: 640, height: 360 });
  const fog = ctx.pass(air, (uv) => {
    const ray = ctx.worldPosition(uv).sub(cameraPosition), dir = ray.normalize();
    const dt = ray.length().min(48).div(20);
    const start = uv.mul(air.size).dot(vec2(0.0671, 0.0058)).fract().mul(52.98).fract();
    const wind = vec3(windTravel.x, 0, windTravel.y), light = vec3(0).toVar(), clear = float(1).toVar();
    Loop(20, ({ i }) => {
      const p = cameraPosition.add(dir.mul(float(i).add(start).mul(dt)));
      const dens = ctx.param('mist', 0.06).mul(p.y.max(0).div(-1.6).exp()).mul(mx_noise_float(p.sub(wind).mul(0.18)).mul(0.8).add(1));
      const through = dens.mul(dt).negate().exp();
      light.addAssign(ambientRadiance.mul(0.25).add(lightsAt(p, { shadow: false }).mul(0.6)).mul(clear).mul(float(1).sub(through)));
      clear.mulAssign(through);
    });
    return vec4(light, clear);
  });
  // a 3x3 tent upsample over the low-res air: the dithered march steps melt into one smooth veil (no checker)
  const px = vec2(1).div(air.size);
  let f = fog.sample(screenUV).mul(4);
  for (const [x, y, w] of [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2],[1,1,1],[-1,1,1],[1,-1,1],[-1,-1,1]]) f = f.add(fog.sample(screenUV.add(px.mul(vec2(x, y)))).mul(w));
  f = f.div(16);
  return scene.mul(f.w).add(f.rgb);
}

export function look(ctx) {
  const bloomStrength = ctx.param('bloomStrength', 0.45);
  const bloomRadius = ctx.param('bloomRadius', 0.55);
  const bloomThreshold = ctx.param('bloomThreshold', 1);
  let c = ctx.scene;
  if (ctx.quality === 'high' || ctx.quality === 'ultra') c = mist(ctx, c);
  c = grade(c, { exposure: 1.08, saturation: 0.86, contrast: 1.08, gain: 0.96, temperature: -0.06, haze: 0.03 });
  c = vignette(c, ctx.param('vignette', 0.26), { color: [0.01, 0.015, 0.03] });
  c = grain(c, 0.012);
  return c;
}
