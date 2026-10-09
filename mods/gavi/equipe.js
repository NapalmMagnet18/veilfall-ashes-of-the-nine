// CREW — the hands behind the tab (scripts/gavi/painel-equipe.js).
//
// Runs on god mode: in god mode every sendAction from the panel lands in the
// onInput of THIS file. It does two things, and neither one is decoration:
//
//   1) CALL — gathers the state of the world around the creator and fires
//      api.notifyDm. That message genuinely reaches the Gavi who is building the
//      room; when she answers, she already has the place, the position and the
//      neighbours in hand.
//   2) WATCHING — with the watch on, the game turns itself in when something goes
//      wrong: the creator fell out of the world, the creator stood planted in the
//      same spot far too long, an objective stalled. One message at a time, with a
//      cooldown, never machine-gunning.
//
// PERF/NETWORK: light update, scheduled in seconds. One state write only when
// something really changes — every patch is an upload message, and the client
// hosting this room has already blown its upload ceiling once.

export const updateSchedule = { every: { seconds: 5 } };

const CARENCIA = 60;   // s between automatic messages
const PARADO_M = 1.5;  // m of radius to count as "planted in the same spot"
const PARADO_S = 150;  // s planted before it says something
const FUNDO_Y = -80;   // below this, they fell out of the world

const PEDIDOS = {
  construir: 'Build here',
  quebrado: "It's broken",
  bonito: 'Make it beautiful',
  proximo: 'What do I do now',
};

let ancora = null;   // { x, z, desde } — for measuring a planted creator
let ultimoAuto = -999;

// api.seconds() with no argument IS the game clock in seconds. The fallback divides by
// this engine's measured tick rate — 30 Hz (api.seconds(1) returns 30), never 60: at 60
// every cooldown in this file was twice as long as it reads.
const TICK_HZ = 30;

export function agora(api) {
  if (typeof api.seconds === 'function') return api.seconds();
  return (api.getTick ? api.getTick() : 0) / TICK_HZ;
}

export function alvo(api) {
  // in god mode the controlled body is the god; what matters is where the
  // creator's camera is looking at the world, and that is the controller's own
  // position.
  try {
    const p = api.getControlTarget ? api.getControlTarget() : null;
    if (p && p.feetPosition) return p;
  } catch (e) {
    api.log('[gavi/equipe] getControlTarget failed — ' + e);
  }
  return { feetPosition: api.getProperty ? api.getProperty('feetPosition') : { x: 0, y: 0, z: 0 } };
}

export function vizinhos(api, pos) {
  try {
    const r = api.query({ center: pos, radius: 22 }) || [];
    const conta = {};
    for (const o of r) {
      const t = (o.tags && o.tags[0]) || 'no-tag';
      conta[t] = (conta[t] || 0) + 1;
    }
    const partes = [];
    for (const k in conta) partes.push(conta[k] + '× ' + k);
    partes.sort();
    return { total: r.length, resumo: partes.slice(0, 6).join(', ') || 'nothing nearby' };
  } catch (e) {
    api.log('[gavi/equipe] neighbour sweep failed — ' + e);
    return { total: 0, resumo: "couldn't sweep" };
  }
}

// Which place this entity is standing in. api.getEntityPlace(id) is the real verb
// (ObjectAPI, engine 5.2.26); the old api.place read was never part of that surface and
// always fell through to the default. api.getPlaces() is its id-level sibling.
export function lugarAtual(api) {
  try {
    if (typeof api.getEntityPlace === 'function') {
      const p = api.getEntityPlace(api.id);
      if (typeof p === 'string' && p) return p;
    }
  } catch (e) {
    api.log("[gavi/equipe] couldn't read the place — " + e);
  }
  return 'main';
}

export function mandarRecado(api, texto) {
  try {
    api.notifyDm(texto);
  } catch (e) {
    api.log("[gavi/equipe] the message didn't go up — " + e);
  }
}

export function onSpawn(api) {
  const s = api.getState() || {};
  api.patchState({
    gaviVigia: s.gaviVigia === true,
    gaviUltimo: s.gaviUltimo || null,
    gaviTotal: s.gaviTotal || 0,
  });
}

// Once the mod is installed, the actions arrive with the mod's name in front
// ('gavi:gaviChamar'); in the development folder they arrive bare ('gaviChamar').
// Reading both is what makes the panel work in either copy.
export function disparou(input, nome) {
  const a = (input && input.actions) || {};
  return !!(a['gavi:' + nome] || a[nome]);
}

export function carga(input, nome) {
  const d = (input && input.actionData) || {};
  return d['gavi:' + nome] || d[nome] || d || {};
}

export function onInput(api, input) {
  if (disparou(input, 'gaviVigia')) {
    const s = api.getState() || {};
    const liga = !s.gaviVigia;
    api.patchState({ gaviVigia: liga });
    ancora = null;
    mandarRecado(api, liga
      ? '[crew] the creator turned the watch on — the game will speak up on its own when it hitches, when someone falls out of the world, or when the creator stands planted.'
      : '[crew] the creator turned the watch off.');
    return;
  }

  if (disparou(input, 'gaviChamar')) {
    const dados = carga(input, 'gaviChamar');
    const pedido = (dados.gaviChamar && dados.gaviChamar.pedido) || dados.pedido || 'proximo';
    const nome = PEDIDOS[pedido] || pedido;
    const alvoAtual = alvo(api);
    const f = alvoAtual.feetPosition || {};
    const pos = { x: Math.round(Number(f.x) || 0), y: Math.round(Number(f.y) || 0), z: Math.round(Number(f.z) || 0) };
    const viz = vizinhos(api, { x: pos.x, y: pos.y, z: pos.z });
    const s = api.getState() || {};

    mandarRecado(api,
      '[crew] request from the creator via the panel: "' + nome + '"' +
      ' · place ' + lugarAtual(api) +
      ' · position ' + pos.x + ', ' + pos.y + ', ' + pos.z +
      ' · around them (22 m): ' + viz.total + ' things — ' + viz.resumo +
      ' · handle THAT first, in the exact spot, and answer short, in English.');

    api.patchState({
      gaviUltimo: nome,
      gaviTotal: (s.gaviTotal || 0) + 1,
    });
  }
}

export function update(api, dt) {
  const s = api.getState() || {};
  if (!s.gaviVigia) return;

  const t = agora(api);
  const a = alvo(api);
  const f = (a && a.feetPosition) || {};
  const x = Number(f.x) || 0;
  const y = Number(f.y) || 0;
  const z = Number(f.z) || 0;

  if (y < FUNDO_Y) {
    if (t - ultimoAuto < CARENCIA) return;
    ultimoAuto = t;
    mandarRecado(api, '[watch] the creator fell out of the world (y ' + Math.round(y) +
      ') at ' + Math.round(x) + ', ' + Math.round(z) + ' — there is a hole in the ground or a missing collider around there.');
    return;
  }

  if (!ancora) {
    ancora = { x: x, z: z, desde: t };
    return;
  }
  const d = Math.sqrt((x - ancora.x) * (x - ancora.x) + (z - ancora.z) * (z - ancora.z));
  if (d > PARADO_M) {
    ancora = { x: x, z: z, desde: t };
    return;
  }
  if (t - ancora.desde > PARADO_S && t - ultimoAuto > CARENCIA) {
    ultimoAuto = t;
    ancora.desde = t;
    const viz = vizinhos(api, { x: x, y: y, z: z });
    mandarRecado(api, '[watch] the creator has been standing still for ' + Math.round(PARADO_S) + ' s at ' +
      Math.round(x) + ', ' + Math.round(z) + ' — around them: ' + viz.resumo +
      '. Either they are stuck, or they are looking at something that is no good. Ask, briefly.');
  }
}
