// MÁQUINA — a máquina de estados de animação. Estados que se CRUZAM, nunca que cortam.
//
// O problema que isto resolve: um corpo sem esqueleto não tem clipes, tem ESTADOS —
// parado, arrasto, bound, galope, ar, aterragem. Quem decide qual é são `if`s espalhados
// pelo update, e um `if` muda de opinião dentro de um frame: passa de bound para galope
// e a pose SALTA, porque a pose nova entra a 100% no frame seguinte. A queixa que sai
// daqui é sempre a mesma — "está a piscar", "muda de repente".
//
// Duas coisas curam isso, e são as duas que este ficheiro faz:
//   1. TRANSIÇÃO = CROSS-FADE com duração própria ('em', segundos). O que sai não é um
//      nome, é um MAPA DE PESOS que soma sempre 1 — { bound: 0.31, galope: 0.69 } —
//      pronto a entregar às camadas do misturador (lib/camadas.js).
//   2. 'minimo' = segundos mínimos num estado antes de poder sair. Sem isto, uma
//      velocidade a tremer em torno de 7.0 m/s troca de andamento 30 vezes por segundo.
//
// ONDE VIVE, e porquê: dentro da pasta do mod, em `lib/`. O motor só resolve
// `require()` para `builtin/*`, `lib/*` e `<mod>/lib/*` — um ficheiro de mod fora de
// `lib/` não é requerível por ninguém. Daqui de dentro do mod, `require('lib/maquina.js')`
// acerta primeiro na cópia do mod; instalado noutra pasta (neste jogo, `scripts/lib/anim/`)
// o caminho é o dessa pasta: `require('lib/anim/maquina.js')`.
//
// EXEMPLO COLÁVEL (canais e andamentos reais deste jogo):
//
//   const { criaMisturador } = require('lib/camadas.js');
//   const { criaMaquina }    = require('lib/maquina.js');
//
//   const E = criaMaquina({
//     inicial: 'parado',
//     estados: {
//       parado:    { minimo: 0.10, transicoes: [ { para: 'arrasto', quando: c => c.vel > 0.35, em: 0.18 } ] },
//       arrasto:   { minimo: 0.12, transicoes: [
//                      { para: 'bound',  quando: c => c.vel > 1.5,  em: 0.20 },
//                      { para: 'parado', quando: c => c.vel < 0.28, em: 0.22 } ] },  // 0.35 entra, 0.28 sai
//       bound:     { minimo: 0.15, transicoes: [
//                      { para: 'galope',  quando: c => c.vel > 7.0, em: 0.30 },
//                      { para: 'arrasto', quando: c => c.vel < 1.3, em: 0.22 } ] },
//       galope:    { minimo: 0.20, transicoes: [ { para: 'bound', quando: c => c.vel < 6.4, em: 0.30 } ] },
//       ar:        { transicoes: [] },                                        // sai pela regra de 'qualquer'
//       aterragem: { minimo: 0.14, transicoes: [ { para: 'parado', em: 0.12 } ] },  // sem 'quando' = segue ao fim do mínimo
//     },
//     qualquer: [                                    // valem de QUALQUER estado; o salto interrompe tudo
//       { para: 'ar',        quando: c => !c.noChao,                  em: 0.08, urgente: true },
//       { para: 'aterragem', quando: c => c.noChao && c.acabouDeCair, em: 0.05, urgente: true },
//     ],
//     quandoEntra: (nome, c) => { if (nome === 'aterragem') baque(); },   // opcional
//     quandoSai:   (nome, c) => {},                                       // opcional
//   });
//
//   // uma POSE por estado — dicionário de canais, graus ou metros:
//   const POSES = {
//     parado: (t, c) => ({ coxaE: -8, coxaD: -8, peD: 4, bracoD: 6, orelhaE: -3, inclina: 2, rolagem: 0 }),
//     galope: (t, c) => galope(t, c.intensidade),          // lib/corrida.js
//     // ...
//   };
//
//   // por frame, dentro do update do corpo:
//   E.avanca(dt, { vel: velHorizontal, noChao: noChao, acabouDeCair: quedaForte });
//
//   const w = E.pesos();                                  // { bound: 0.31, galope: 0.69 }
//   const pose = {};
//   for (const nome in w) {
//     const p = POSES[nome](t, ctx);
//     for (const canal in p) pose[canal] = (pose[canal] === undefined ? 0 : pose[canal]) + p[canal] * w[nome];
//   }
//   M.escreve('locomocao', pose);                         // uma só camada, já cruzada
//   M.avanca(dt);
//   const final = M.resolve();
//
// PORQUE É QUE A SOMA SER 1 IMPORTA: a média pesada acima só é uma pose legítima se os
// pesos somarem exactamente 1. A 0.9 o corpo ENCOLHE (todos os ângulos a 90%, o coelho
// afunda-se); a 1.1 ESTICA e as patas passam pelo chão. Aqui a soma está garantida nas
// contas (peso do destino + resto do que se deixa) e normalizada no fim, por segurança.
// MEDIDO: 1800 frames de varrimento, erro de soma exactamente 0.
//
// HISTERESE É DO AUTOR, NÃO DESTE FICHEIRO. Repara no exemplo: entra no galope a 7.0 e
// só sai a 6.4. Essa folga de 0.6 m/s escreve-se à mão, nos limiares, por quem conhece o
// andamento — inventá-la aqui era mexer nos números do autor sem lhe dizer. O 'minimo' é
// a rede de segurança no TEMPO; a folga dos limiares é a rede no VALOR. São as duas.
// (Medido: vel a saltar 6.9/7.1 a cada frame durante 10 s dá 1 mudança de estado com a
// folga do autor, e 59 sem folga nenhuma — só com o 'minimo' de 0.15 a segurar.)
//
// AS REGRAS, curtas:
//   • 'qualquer' é testado ANTES das transições do estado actual.
//   • A primeira transição da lista cuja condição dá verdade GANHA (a ordem é prioridade).
//   • 'em' em falta = 0.15 s. 'em: 0' = corte seco, legítimo (morte, teleporte, câmara nova).
//   • Transição sem 'quando' = sempre verdade; só o 'minimo' do estado a segura.
//   • 'urgente: true' passa por cima do 'minimo' — é para o salto, que não espera por nada.
//   • Uma condição que atira erro conta como FALSA: um `c.vel` de um contexto que veio a
//     null não parte o frame do corpo. O mesmo para os callbacks quandoEntra/quandoSai.
//   • Interromper A MEIO de um fade não dá salto: a mistura desse instante fica CONGELADA
//     como base e o novo fade parte dela. É por isso que pesos() devolve um MAPA e não dois
//     nomes — a meio de dois cortes há três estados vivos ao mesmo tempo.
//   • Um destino nunca declarado em `estados` (o 'aterragem' do exemplo, se faltasse)
//     passa a existir com minimo 0 e sem saídas — beco de onde só se sai por 'qualquer'
//     ou por forca(). É tolerância, não convite.
//
// CUSTO POR FRAME: assente, zero contas e zero lixo — pesos() devolve sempre o mesmo
// objecto. Só durante um fade se reconstrói o mapa (<= um objecto com 2-3 chaves).
// Por isso: não guardes o objecto de pesos() entre frames sem o copiares.
//
// PURO: zero engine, zero objectApi, zero Date/Math.random/setTimeout. Só números e dt.

export function criaMaquina(cfg) {
  cfg = cfg || {};

  const DUR_PADRAO = 0.15;  // 'em' em falta — o valor do contrato
  const EPS = 1e-9;         // abaixo disto o peso é pó: sai do mapa (salto de 1e-9, invisível)
  const DT_MAX = 1;         // um frame de >1 s é hiccup ou aba escondida: os fades acabam,
                            // e o relógio do estado não vai a infinito atrás dele

  // ---------- a configuração limpa-se UMA vez; o frame não paga validação ----------

  const estados = {};

  function garanteEstado(nome) {
    let e = estados[nome];
    if (!e) {
      e = { nome: nome, minimo: 0, transicoes: [] };
      estados[nome] = e;
    }
    return e;
  }

  function limpaLista(lista) {
    const out = [];
    if (!lista || typeof lista.length !== 'number') return out;
    for (let i = 0; i < lista.length; i++) {
      const t = lista[i];
      if (!t || typeof t.para !== 'string' || t.para === '') continue;  // sem destino não é transição
      garanteEstado(t.para);
      out.push({
        para: t.para,
        quando: typeof t.quando === 'function' ? t.quando : null,   // null = sempre verdade
        em: tempoOu(t.em, DUR_PADRAO),
        urgente: t.urgente === true,
      });
    }
    return out;
  }

  const declarados = (cfg.estados && typeof cfg.estados === 'object') ? cfg.estados : {};
  const nomesDecl = Object.keys(declarados);
  for (let i = 0; i < nomesDecl.length; i++) {
    const d = declarados[nomesDecl[i]] || {};
    const e = garanteEstado(nomesDecl[i]);
    e.minimo = tempoOu(d.minimo, 0);
    e.transicoes = limpaLista(d.transicoes);
  }
  const qualquer = limpaLista(cfg.qualquer);

  const quandoEntra = typeof cfg.quandoEntra === 'function' ? cfg.quandoEntra : null;
  const quandoSai = typeof cfg.quandoSai === 'function' ? cfg.quandoSai : null;

  // ---------- estado vivo ----------

  let nomeAtual = (typeof cfg.inicial === 'string' && cfg.inicial !== '')
    ? cfg.inicial
    : (nomesDecl.length > 0 ? nomesDecl[0] : 'parado');
  garanteEstado(nomeAtual);

  let mapaBase = null;   // a MISTURA congelada de onde o fade actual parte (null = assente)
  let nomeSaida = null;  // o estado de onde se saiu — só para desempatar anterior()
  let progresso = 1;     // 0..1 do fade actual; 1 = assente
  let duracao = 0;       // segundos do fade actual
  let tempo = 0;         // segundos no estado actual
  let ctxUltimo = null;  // último contexto visto, para o forca() sem argumento
  let mapa = {};         // o mapa de pesos deste frame

  // O mapa de pesos: o que resta da base a desvanecer + o destino a entrar.
  // soma = (1 - progresso) * 1 + progresso = 1, por construção. A normalização no fim
  // só apara o erro de vírgula flutuante e o pó que se cortou — nunca corrige lógica.
  function recalcula() {
    let out = {};
    if (mapaBase === null || progresso >= 1) {
      out[nomeAtual] = 1;
      mapa = out;
      return;
    }
    const resto = 1 - progresso;
    let soma = 0;
    const ks = Object.keys(mapaBase);
    for (let i = 0; i < ks.length; i++) {
      const w = mapaBase[ks[i]] * resto;
      if (!(w > EPS)) continue;              // NaN, zero e pó caem todos aqui
      out[ks[i]] = w;
      soma += w;
    }
    if (progresso > EPS) {
      const jaLa = out[nomeAtual] === undefined ? 0 : out[nomeAtual];
      out[nomeAtual] = jaLa + progresso;     // o destino pode já estar na base (fade interrompido)
      soma += progresso;
    }
    if (!(soma > 0)) {                       // defesa: mapa vazio ou envenenado
      out = {};
      out[nomeAtual] = 1;
      mapa = out;
      return;
    }
    if (soma !== 1) {
      const k2 = Object.keys(out);
      for (let i = 0; i < k2.length; i++) out[k2[i]] = out[k2[i]] / soma;
    }
    mapa = out;
  }

  // Congela a mistura deste instante para servir de base ao próximo fade.
  // É ESTA função que impede o salto: o fade novo parte dos pesos que existem agora,
  // não de um nome sozinho a 100%.
  function congela() {
    const b = {};
    let soma = 0;
    const ks = Object.keys(mapa);
    for (let i = 0; i < ks.length; i++) {
      const w = mapa[ks[i]];
      if (!(w > EPS)) continue;
      b[ks[i]] = w;
      soma += w;
    }
    if (!(soma > 0)) {
      b[nomeAtual] = 1;
      return b;
    }
    if (soma !== 1) {
      const k2 = Object.keys(b);
      for (let i = 0; i < k2.length; i++) b[k2[i]] = b[k2[i]] / soma;
    }
    return b;
  }

  function transita(t, ctx) {
    const antigo = nomeAtual;
    const base = congela();
    nomeAtual = t.para;
    duracao = t.em;
    tempo = 0;
    if (duracao > 0) {
      mapaBase = base;
      nomeSaida = antigo;
      progresso = 0;
    } else {
      mapaBase = null;      // corte seco: não há fade, logo não há 'anterior'
      nomeSaida = null;
      progresso = 1;
    }
    recalcula();
    if (quandoSai) chamaSeguro(quandoSai, antigo, ctx);
    if (quandoEntra) chamaSeguro(quandoEntra, nomeAtual, ctx);
  }

  // A primeira que dá verdade ganha. O mínimo segura tudo menos o que se diz 'urgente'.
  function varre(lista, ctx, podeSair) {
    for (let i = 0; i < lista.length; i++) {
      const t = lista[i];
      if (t.para === nomeAtual) continue;      // já se vai para lá; recomeçar o fade ERA o salto
      if (!podeSair && !t.urgente) continue;
      if (t.quando !== null) {
        let ok = false;
        try {
          ok = !!t.quando(ctx);
        } catch (erro) {
          ok = false;                          // condição que rebenta = condição falsa
        }
        if (!ok) continue;
      }
      return t;
    }
    return null;
  }

  const M = {
    // dt em segundos; contexto é um objecto qualquer — é ele que as condições recebem.
    avanca: function (dt, contexto) {
      if (!(dt > 0)) dt = 0;                   // undefined, negativo e NaN caem aqui: frame parado
      else if (dt > DT_MAX) dt = DT_MAX;
      const ctx = (contexto === undefined || contexto === null) ? {} : contexto;
      ctxUltimo = ctx;

      tempo += dt;

      // 1) o fade em curso avança PRIMEIRO, e só depois se procura transição nova. Assim a
      //    mistura que a transição vai congelar já é a deste frame: o peso nunca anda para
      //    trás nem repete um frame — que é a outra maneira de se ver um salto.
      if (progresso < 1) {
        if (duracao > 0) {
          progresso += dt / duracao;
          if (!(progresso < 1)) progresso = 1;   // >= 1 e NaN assentam
        } else {
          progresso = 1;
        }
        if (progresso >= 1) { mapaBase = null; nomeSaida = null; }
        recalcula();
      }

      // 2) 'qualquer' antes das transições do estado — o salto interrompe tudo.
      const est = estados[nomeAtual] || garanteEstado(nomeAtual);
      const podeSair = tempo >= est.minimo;
      let escolhida = varre(qualquer, ctx, podeSair);
      if (escolhida === null) escolhida = varre(est.transicoes, ctx, podeSair);
      if (escolhida !== null) transita(escolhida, ctx);

      return M;
    },

    // Para onde se vai (ou onde se está, se estiver assente).
    atual: function () {
      return nomeAtual;
    },

    // De onde se vem, enquanto o fade dura: o mais pesado do que se está a deixar.
    // Empate → o estado de onde se saiu. Assente ou corte seco → null.
    // Diagnóstico e conveniência: a verdade completa está em pesos(), que pode ter três chaves.
    anterior: function () {
      if (mapaBase === null || progresso >= 1) return null;
      let melhor = null;
      let peso = -1;
      if (nomeSaida !== null && nomeSaida !== nomeAtual && mapaBase[nomeSaida] !== undefined) {
        melhor = nomeSaida;
        peso = mapaBase[nomeSaida];
      }
      const ks = Object.keys(mapaBase);
      for (let i = 0; i < ks.length; i++) {
        const k = ks[i];
        if (k === nomeAtual) continue;
        if (mapaBase[k] > peso) { peso = mapaBase[k]; melhor = k; }
      }
      return melhor;
    },

    // O mapa vivo deste frame: { bound: 0.31, galope: 0.69 }. SOMA SEMPRE 1.
    // Não o guardes entre frames sem copiar — enquanto está assente é o mesmo objecto.
    pesos: function () {
      return mapa;
    },

    // Progresso do fade actual, 0..1. 1 = assente.
    mistura: function () {
      return progresso >= 1 ? 1 : progresso;
    },

    tempoNoEstado: function () {
      return tempo;
    },

    emTransicao: function () {
      return mapaBase !== null && progresso < 1;
    },

    // Corta o fade e assenta já nesse estado. Forçar o estado onde já se está só assenta
    // o fade (não reinicia o relógio nem repete quandoEntra) — é o que se quer ao renascer.
    forca: function (nome, contexto) {
      if (typeof nome !== 'string' || nome === '') return M;
      garanteEstado(nome);
      const ctx = (contexto === undefined || contexto === null)
        ? (ctxUltimo === null ? {} : ctxUltimo)
        : contexto;
      const antigo = nomeAtual;
      const mudou = nome !== antigo;
      nomeAtual = nome;
      mapaBase = null;
      nomeSaida = null;
      progresso = 1;
      duracao = 0;
      if (mudou) tempo = 0;
      recalcula();
      if (mudou) {
        if (quandoSai) chamaSeguro(quandoSai, antigo, ctx);
        if (quandoEntra) chamaSeguro(quandoEntra, nome, ctx);
      }
      return M;
    },
  };

  recalcula();
  return M;
}

// Segundos válidos. Não-número, NaN e infinito → o padrão; negativo → 0 (corte seco).
// Nunca devolve NaN: um NaN aqui multiplicava-se por todos os pesos do corpo.
export function tempoOu(v, padrao) {
  if (typeof v !== 'number' || v !== v || v === Infinity || v === -Infinity) return padrao;
  return v > 0 ? v : 0;
}

// Um callback do autor que rebente não pode partir o frame do corpo.
export function chamaSeguro(fn, nome, ctx) {
  try {
    fn(nome, ctx);
  } catch (erro) {
    // engolido de propósito: a animação continua, o erro do autor é dele
  }
}

module.exports = { criaMaquina };
