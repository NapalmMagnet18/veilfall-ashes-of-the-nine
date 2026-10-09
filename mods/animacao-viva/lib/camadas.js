// CAMADAS — mistura de poses por região do corpo.
//
// O problema que isto resolve: num corpo sem esqueleto, cada função de animação
// escreve ângulos directamente nas peças. Quando aparece a segunda função (atacar
// por cima de correr) a última a escrever GANHA — o corpo inteiro pára para dar
// uma pancada. É o `if` a mandar na animação.
//
// Aqui uma pose é só um dicionário de canais:  { coxaE: -30, bracoD: 62, ... }
// graus ou metros, o nome é teu. Cada CAMADA escreve a sua pose, diz que REGIÕES
// do corpo lhe pertencem, e o misturador junta tudo por prioridade e por peso.
// As pernas continuam o ciclo enquanto o tronco e os braços dão a pancada.
//
//   const { criaMisturador } = require('lib/camadas.js');
//
//   const M = criaMisturador({
//     regioes: {
//       pernas:  ['coxaE', 'coxaD', 'peE', 'peD'],
//       tronco:  ['inclina', 'rolagem', 'alturaY', 'esticaY'],
//       bracos:  ['bracoE', 'bracoD'],
//       cabeca:  ['cabeca', 'cabecaRoll', 'olhar'],
//       orelhas: ['orelhaE', 'orelhaD'],
//       cauda:   ['cauda'],
//     },
//   });
//
//   M.camada('locomocao', { modo: 'sobrepoe', prioridade: 0 });
//   M.camada('ocio',      { modo: 'soma',     prioridade: 5, entrada: 0.25, saida: 0.15 });
//   M.camada('acao',      { modo: 'sobrepoe', prioridade: 10, entrada: 0.06, saida: 0.16,
//                           regioes: ['bracos', 'tronco'],
//                           pesos:   { tronco: 0.45 } });   // o tronco só acompanha a meio
//
//   // por frame:
//   M.escreve('locomocao', poseDoCiclo);
//   M.escreve('acao', poseDaPancada);
//   M.ativa('acao', aIndaEstaAAtacar);
//   M.avanca(dt);
//   const pose = M.resolve();     // { coxaE: ..., bracoD: ..., ... }
//
// MODOS
//   'sobrepoe' — substitui o que estava por baixo, cruzando com o peso (lerp).
//   'soma'     — soma por cima (aditivo: respiração, ócio, recuo, tremor).
//
// PESOS
//   Cada camada tem um peso global 0..1 que sobe em `entrada` segundos e desce em
//   `saida` segundos quando se liga/desliga (`ativa`). Por cima disso, `pesos` dá
//   um multiplicador por região — é isto que faz o "layered blend per bone" do UE:
//   a pancada a 100% nos braços e a 45% no tronco, com as pernas intocadas.

export function criaMisturador(cfg) {
  cfg = cfg || {};
  const regioes = cfg.regioes || {};

  // canal -> região. Um canal que ninguém reclamou vive na região 'outros'.
  const casa = {};
  const nomesRegiao = Object.keys(regioes);
  for (let i = 0; i < nomesRegiao.length; i++) {
    const r = nomesRegiao[i];
    const canais = regioes[r] || [];
    for (let j = 0; j < canais.length; j++) casa[canais[j]] = r;
  }

  const camadas = {};
  const ordem = [];

  function regiaoDe(canal) {
    return casa[canal] || 'outros';
  }

  function ordena() {
    ordem.sort(function (a, b) {
      const pa = camadas[a].prioridade, pb = camadas[b].prioridade;
      return pa === pb ? (camadas[a].seq - camadas[b].seq) : pa - pb;
    });
  }

  let seq = 0;

  const M = {
    // Declara uma camada. Chamar outra vez com o mesmo nome reconfigura sem perder o peso.
    camada: function (nome, opts) {
      opts = opts || {};
      const antiga = camadas[nome];
      camadas[nome] = {
        nome: nome,
        seq: antiga ? antiga.seq : seq++,
        modo: opts.modo || 'sobrepoe',
        prioridade: opts.prioridade === undefined ? 0 : opts.prioridade,
        // regioes: undefined ou '*' = o corpo todo
        regioes: (!opts.regioes || opts.regioes === '*') ? null : listaParaMapa(opts.regioes),
        pesos: opts.pesos || null,
        entrada: opts.entrada === undefined ? 0.12 : Math.max(0, opts.entrada),
        saida: opts.saida === undefined ? 0.18 : Math.max(0, opts.saida),
        peso: antiga ? antiga.peso : (opts.peso === undefined ? (opts.ligada === false ? 0 : 1) : opts.peso),
        alvo: opts.ligada === false ? 0 : 1,
        pose: antiga ? antiga.pose : null,
      };
      if (opts.peso !== undefined) {
        camadas[nome].peso = opts.peso;
        camadas[nome].alvo = opts.peso;
      }
      if (!antiga) ordem.push(nome);
      ordena();
      return M;
    },

    // A pose desta camada NESTE frame. Passar null limpa-a (a camada deixa de contribuir).
    escreve: function (nome, pose) {
      const c = camadas[nome];
      if (c) c.pose = pose || null;
      return M;
    },

    // Liga/desliga com fade. Aceita também um número (alvo directo 0..1).
    ativa: function (nome, ligada) {
      const c = camadas[nome];
      if (!c) return M;
      c.alvo = typeof ligada === 'number' ? clamp01(ligada) : (ligada === false ? 0 : 1);
      return M;
    },

    // Salta o fade — para cortes secos (morte, teleporte, mudança de câmara).
    forca: function (nome, peso) {
      const c = camadas[nome];
      if (!c) return M;
      c.peso = clamp01(peso);
      c.alvo = c.peso;
      return M;
    },

    // Multiplicador de uma região dentro de uma camada (0..1).
    pesoRegiao: function (nome, regiao, valor) {
      const c = camadas[nome];
      if (!c) return M;
      if (!c.pesos) c.pesos = {};
      c.pesos[regiao] = clamp01(valor);
      return M;
    },

    pesoDe: function (nome) {
      const c = camadas[nome];
      return c ? c.peso : 0;
    },

    // Avança os fades. dt em segundos.
    avanca: function (dt) {
      if (!(dt > 0)) dt = 0;
      for (let i = 0; i < ordem.length; i++) {
        const c = camadas[ordem[i]];
        if (c.peso === c.alvo) continue;
        const sobe = c.alvo > c.peso;
        const tempo = sobe ? c.entrada : c.saida;
        if (tempo <= 0) { c.peso = c.alvo; continue; }
        const passo = dt / tempo;
        c.peso = sobe ? Math.min(c.alvo, c.peso + passo) : Math.max(c.alvo, c.peso - passo);
      }
      return M;
    },

    // Junta tudo. Devolve um dicionário novo de canais.
    resolve: function () {
      const out = {};
      for (let i = 0; i < ordem.length; i++) {
        const c = camadas[ordem[i]];
        if (!c.pose || c.peso <= 0) continue;
        const canais = Object.keys(c.pose);
        for (let j = 0; j < canais.length; j++) {
          const canal = canais[j];
          const v = c.pose[canal];
          if (typeof v !== 'number' || v !== v) continue;   // ignora NaN e não-números
          const r = regiaoDe(canal);
          if (c.regioes && !c.regioes[r]) continue;
          let w = c.peso;
          if (c.pesos && c.pesos[r] !== undefined) w *= c.pesos[r];
          if (w <= 0) continue;
          if (c.modo === 'soma') {
            out[canal] = (out[canal] === undefined ? 0 : out[canal]) + v * w;
          } else {
            const base = out[canal] === undefined ? 0 : out[canal];
            out[canal] = base + (v - base) * (w > 1 ? 1 : w);
          }
        }
      }
      return out;
    },

    // Diagnóstico: o peso de cada camada agora. Para HUD de criador ou logs.
    estado: function () {
      const o = {};
      for (let i = 0; i < ordem.length; i++) o[ordem[i]] = camadas[ordem[i]].peso;
      return o;
    },
  };

  return M;
}

export function listaParaMapa(lista) {
  const m = {};
  if (typeof lista === 'string') { m[lista] = true; return m; }
  for (let i = 0; i < lista.length; i++) m[lista[i]] = true;
  return m;
}

export function clamp01(v) {
  if (!(v > 0)) return 0;
  return v > 1 ? 1 : v;
}

module.exports = { criaMisturador };
