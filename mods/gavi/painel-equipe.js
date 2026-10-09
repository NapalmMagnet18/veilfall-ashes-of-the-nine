// CREW — Gavi sitting right next to you, inside the game.
//
// Creator tab (shows up in god mode only). Every button sends a REAL message to
// the Gavi who builds this room: the scripts/gavi/equipe.js behavior takes the
// action and fires api.notifyDm with the state of the world attached — where you
// are, what is around you, how the client is doing on frames. This is not a fake
// chat: it is the button that wakes up whoever builds.
//
// Nothing is written here: the panel only draws. Every mutation goes through
// sendAction -> godMode.behavior (equipe.js).

const PEDIDOS = [
  { id: 'construir', emoji: '🔨', titulo: 'Build here', dica: "sends the spot I'm standing in and what's around it" },
  { id: 'quebrado', emoji: '🐛', titulo: "It's broken", dica: 'sends the error, the log and what the frame costs' },
  { id: 'bonito', emoji: '🎨', titulo: 'Make it beautiful', dica: 'light, sky, texture and sound for this patch' },
  { id: 'proximo', emoji: '🧭', titulo: 'What do I do now', dica: 'she looks at the game and picks the next step' },
];

export function n2(v) {
  return Math.round(Number(v) || 0);
}

export default function (world, localPlayer) {
  const st = (localPlayer && localPlayer.state) || {};
  const pos = (localPlayer && (localPlayer.feetPosition || localPlayer.position)) || {};
  const lugar = (localPlayer && localPlayer.place) || 'main';

  let g = {};
  try {
    g = (world && world.getObjectState && world.getObjectState('godMode')) || {};
  } catch (e) {
    g = {};
  }
  const vigia = !!(g && g.gaviVigia);
  const ultimo = (g && g.gaviUltimo) || null;
  const total = (g && g.gaviTotal) || 0;

  const linhas = PEDIDOS.map(function (p) {
    return (
      '<button data-interactive class="w-full text-left rounded-[2px] bg-white/5 hover:bg-amber-400/25 ' +
      'border border-white/10 px-2 py-1.5 mb-1.5 transition-colors" ' +
      "onclick=\"sendAction('gaviChamar', { pedido: '" + p.id + "' })\">" +
      '<div class="text-[13px] leading-tight text-white">' + p.emoji + ' ' + p.titulo + '</div>' +
      '<div class="text-[10px] leading-tight text-white/45">' + p.dica + '</div>' +
      '</button>'
    );
  }).join('');

  const selo = vigia
    ? '<span class="text-emerald-300">watching</span>'
    : '<span class="text-white/40">dozing</span>';

  const recado = ultimo
    ? '<div class="mt-2 text-[10px] text-white/50 leading-tight">last message: <span class="text-amber-200">' +
      String(ultimo).slice(0, 46) + '</span></div>'
    : '<div class="mt-2 text-[10px] text-white/35 leading-tight">no messages yet — hit a button up there</div>';

  return (
    '<div class="w-72 rounded-[2px] bg-black/75 border border-white/10 p-3 text-white">' +
      '<div class="flex items-center gap-2">' +
        '<div class="text-lg leading-none">🔥</div>' +
        '<div class="flex-1">' +
          '<div class="text-[13px] font-semibold leading-tight">Gavi</div>' +
          '<div class="text-[10px] text-white/45 leading-tight">on your crew · ' + selo + '</div>' +
        '</div>' +
        '<div class="text-[10px] text-white/35">' + total + ' messages</div>' +
      '</div>' +

      '<div class="mt-3 text-[10px] uppercase tracking-wide text-white/40">call</div>' +
      '<div class="mt-1.5">' + linhas + '</div>' +

      '<button data-interactive class="w-full rounded-[2px] px-2 py-1.5 text-[12px] border transition-colors ' +
        (vigia
          ? 'bg-emerald-500/25 border-emerald-300/40 hover:bg-emerald-500/35'
          : 'bg-white/5 border-white/10 hover:bg-white/10') +
        '" onclick="sendAction(\'gaviVigia\')">' +
        (vigia ? '👁️ Gavi is watching — turn off' : '👁️ Put Gavi on watch') +
      '</button>' +
      '<div class="mt-1 text-[10px] text-white/40 leading-tight">' +
        'on watch, the game tells her by itself when it hitches, drops frames or someone gets lost.' +
      '</div>' +

      recado +

      '<div class="mt-3 border-t border-white/10 pt-2 text-[10px] text-white/35 leading-tight">' +
        lugar + ' · ' + n2(pos.x) + ', ' + n2(pos.y) + ', ' + n2(pos.z) +
        (st && st.ossos != null ? ' · ' + st.ossos + ' bones' : '') +
      '</div>' +
    '</div>'
  );
}
