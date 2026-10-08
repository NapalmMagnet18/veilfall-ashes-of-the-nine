// A cluster of candle flames: one small flickering wisp stream per lit wick (params.tips =
// "x,y,z;x,y,z" metres from the anchor, up to 5), a thin smoke thread off the first wick, and ONE
// light whose brightness rides the live flame count. Used by every milestone, the toll counter, the wagon lantern.
import { fx, pop, attr, range, curve, flicker, firelight, count, hdr, vec3, sprite, light } from "builtin/fx";
export function effect(ctx) {
  const tips = String(ctx.params.tips ?? "0,0.5,0").split(";").map((s) => s.split(",").map(Number)).filter((a) => a.length === 3 && a.every(Number.isFinite)).slice(0, 5);
  if (!tips.length) tips.push([0, 0.5, 0]);
  const power = Number(ctx.params.power ?? 2.4), radius = Number(ctx.params.radius ?? 7);
  const pops = [];
  let total = null;
  tips.forEach(([x, y, z], i) => {
    const f = pop("f" + i, {
      spawn: { rate: flicker(0.55 + i * 0.17, 0.35).mul(16) },
      lifetime: [0.25, 0.45],
      space: "local",
      init: { size: range(0.04, 0.065) },
      pos: vec3(x, y, z).add(vec3(attr("age").mul(9 + i).sin().mul(0.006), attr("age").mul(0.2), 0)),
      color: curve([0, hdr(5, 3.4, 1.4)], [0.45, hdr(3.2, 1.4, 0.3)], [1, hdr(1.2, 0.3, 0.06)]),
      alpha: curve([0, 0], [0.15, 1], [1, 0]),
      size: attr("size").mul(curve([0, 0.75], [0.35, 1], [1, 0.35])),
      render: sprite({ texture: "textures/flame-wisp", blend: "add" }),
    });
    pops.push(f);
    total = total ? total.add(count(f)) : count(f);
  });
  const [sx, sy, sz] = tips[0];
  const smoke = pop("smoke", {
    spawn: { rate: flicker(0.3, 0.4).mul(2.5) },
    lifetime: [1.6, 2.6],
    space: "local",
    init: { size: range(0.05, 0.09) },
    pos: vec3(sx, sy + 0.08, sz).add(vec3(attr("age").mul(2.3).sin().mul(0.05), attr("age").mul(0.35), attr("age").mul(1.7).cos().mul(0.03))),
    color: "oklch(0.55 0.01 80)",
    alpha: curve([0, 0], [0.2, 0.18], [1, 0]),
    size: attr("size").mul(curve([0, 0.6], [1, 2.6])),
    render: sprite({ texture: "textures/smoke-puff", blend: "alpha" }),
  });
  const cx = tips.reduce((s, t) => s + t[0], 0) / tips.length, cz = tips.reduce((s, t) => s + t[2], 0) / tips.length;
  const cy = Math.max(...tips.map((t) => t[1])) + 0.25;
  const glow = pop("glow", {
    count: 1,
    space: "local",
    pos: vec3(cx, cy, cz),
    attrs: { glo: firelight(1.1, 2.2).mul(total.div(5.5 * tips.length).clamp01()) },
    render: light({ color: "oklch(0.8 0.13 70)", intensity: attr("glo").mul(power), radius }),
  });
  return fx(...pops, smoke, glow);
}
