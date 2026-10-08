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
    const dt = ray.length().min(48).div(14);
    const start = uv.mul(air.size).dot(vec2(0.0671, 0.0058)).fract().mul(52.98).fract();
    const wind = vec3(windTravel.x, 0, windTravel.y), light = vec3(0).toVar(), clear = float(1).toVar();
    Loop(14, ({ i }) => {
      const p = cameraPosition.add(dir.mul(float(i).add(start).mul(dt)));
      const dens = ctx.param('mist', 0.06).mul(p.y.max(0).div(-1.6).exp()).mul(mx_noise_float(p.sub(wind).mul(0.18)).mul(0.8).add(1));
      const through = dens.mul(dt).negate().exp();
      light.addAssign(ambientRadiance.mul(0.25).add(lightsAt(p, { shadow: false }).mul(0.6)).mul(clear).mul(float(1).sub(through)));
      clear.mulAssign(through);
    });
    return vec4(light, clear);
  });
  const half = vec2(0.5).div(air.size);
  const f = fog.sample(screenUV.add(half)).add(fog.sample(screenUV.sub(half))).mul(0.5);
  return scene.mul(f.w).add(f.rgb);
}

export function look(ctx) {
  const bloomStrength = ctx.param('bloomStrength', 0.7);
  const bloomRadius = ctx.param('bloomRadius', 0.55);
  const bloomThreshold = ctx.param('bloomThreshold', 1);
  let c = ctx.scene;
  if (ctx.quality === 'high' || ctx.quality === 'ultra') c = mist(ctx, c);
  c = grade(c, { exposure: 1.3, saturation: 0.88, contrast: 1.1, temperature: -0.06, haze: 0.03 });
  c = vignette(c, ctx.param('vignette', 0.26), { color: [0.01, 0.015, 0.03] });
  c = grain(c, 0.03);
  return c;
}
