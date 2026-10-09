// The storm's weather beside Awakening's shaders: rain, the wet ground, lightning and thunder. Called from
// sim.js each second; everything follows storm(t) in mods/awakening/swell.js, gated by the look param storm.
import { storm, swellTime, SQUALL } from "./lib/swell.js";

const RAIN_SND = "cdn/moodboard-realistic-gritty/sfx-steady-rain-falling-on-lake-water-and-pine-forest-soft-hiss-loop.mp3";
const THUNDER = ["cdn/moodboard-realistic-gritty/sfx-distant-thunder-rolling-across-mountain-valley.mp3",
  "cdn/moodboard-realistic-gritty/sfx-close-thunder-crack-then-long-rumble-echoing-off-peaks.mp3"];
// rain: a slab over each viewer's eye, its rate shaped over the storm's life; splashes off the drops that die
const rainFx = (life) => {
  const a = life * 0.25, b = life * 0.5, c = life * 0.75;
  return `fx follow=camera
pop drops rate=?ultra:9000|low:1500|4500*env(0>${a.toFixed(1)}:.55>${b.toFixed(1)}:1>${c.toFixed(1)}:.55>${life.toFixed(1)}:0) on=box(30,1,30).c(16) wrap=30;0;30 life=1.3..1.7 v=<0,-10,0>+wind()*.9+sdir()*.25 size=.01..0.018
  col=oklch(.82 .015 250) a=0>.15:.45>.85:.45>0 sz=$size floor=die r=sprite(droplet,alpha,velocity,.035)
pop splash on=@drops?0.25 burst=1 life=.12..0.22 v=<0,1,0>*(.5..1.1)+sdir()*(.3..0.6) size=.01..0.02 acc=grav()*.6+drag(2)
  col=oklch(.9 .02 250) a=.45>0 sz=$size*(1>1.8) r=sprite(soft-disc,alpha)`;
};
const strikeFx = (h) => `fx
pop bolt burst=90 life=.18 on=path(js{(()=>{const p=[[0,${h},0]];let x=0,z=0;for(let i=1;i<=14;i++){x+=(Math.random()-.5)*${(h / 9).toFixed(0)};z+=(Math.random()-.5)*${(h / 9).toFixed(0)};p.push([x,${h}-i*${(h / 14).toFixed(1)},z]);}return p;})()}) size=5..8 col=hdr(6,6.5,9) a=1>.6:.9>0 sz=$size r=sprite(soft-disc,add)
pop flash burst=1 life=.25 glo=1>.3:.4>0 r=light(<.75,.8,1>,$glo*9000,900)`;

let rainId = null, pendingThunder = null;
export function tickStorm(ctx) {
  const main = ctx.world.places.main; if (!main) return;
  const on = Number(main.atmosphere?.look?.params?.storm ?? 0) > 0;
  const t = swellTime(ctx), S = on ? storm(t) : 0;
  // the ground and the lake's own rain rings read rain and wet (builtin/lighting)
  const rain = Math.round(Math.max(0, S * 1.3 - 0.3) * 20) / 20;
  const wetNow = main.atmosphere.wet ?? 0, wet = Math.round(Math.max(rain, wetNow - (on ? 0.01 : 0.05)) * 100) / 100;
  if (main.atmosphere.rain !== rain) main.atmosphere.rain = rain;
  if (wet !== wetNow) main.atmosphere.wet = wet;
  // the HUD's weather chip: one word, written only when it changes
  const lead0 = ((t % SQUALL.period) / SQUALL.length + 0.12) / 1.24;
  const word = S > 0.6 ? "thunderstorm" : rain > 0 ? "rain" : S > 0.02 ? (lead0 < 0.5 ? "clouding over" : "clearing") : "clear";
  if (main.state.weather !== word) main.state.weather = word;
  // rain starts once per storm, with the storm's whole remaining life in its envelope
  const lead = ((t % SQUALL.period) / SQUALL.length + 0.12) / 1.24;
  if (on && S > 0.02 && !rainId && lead < 0.2) {
    const life = (1 - lead) * SQUALL.length * 1.24;
    rainId = ctx.spawn({ id: "storm-rain", tags: ["weather"], place: "main", feetPosition: { x: 0, y: 0, z: 0 }, lifetime: life, fx: { script: rainFx(life) },
      audio: { clip: RAIN_SND, gain: 0.18, loop: true, spatial: false, bus: "Ambience" } });
  }
  if (S === 0 && (rainId || "storm-rain" in main.objects)) { if (main.objects["storm-rain"]) delete main.objects["storm-rain"]; rainId = null; }
  // thunder follows the flash a second or three later, as far as the strike was
  if (pendingThunder && ctx.now() >= pendingThunder.at) {
    ctx.emit("playSound", { clip: pendingThunder.clip, position: pendingThunder.pos, volume: pendingThunder.vol, maxDistance: 2000, pitch: 0.9 + ctx.random() * 0.2 }, { place: "main" });
    pendingThunder = null;
  }
  // lightning: only in the storm's heart, a strike every ~8 s on average, on the ridges around a player
  const pl = main.players?.[0];
  if (on && S > 0.6 && pl && !pendingThunder && ctx.random() < 0.13) {
    const a = ctx.random() * Math.PI * 2, d = 250 + ctx.random() * 250;
    const pos = { x: pl.feetPosition.x + Math.cos(a) * d, y: 0, z: pl.feetPosition.z + Math.sin(a) * d };
    pos.y = (main.terrain.heightAt(pos.x, pos.z) ?? 0);
    ctx.emit("fx", { position: pos, script: strikeFx(420) }, { place: "main" });
    ctx.emit("screenFlash", { color: "#dfe6ff", duration: 0.12, intensity: 0.12 }, { place: "main" });
    pendingThunder = { at: ctx.now() + (d / 343) * 1000, clip: THUNDER[d < 350 ? 1 : 0], pos: { ...pos, y: pos.y + 50 }, vol: d < 350 ? 0.7 : 0.5 };
  }
}
