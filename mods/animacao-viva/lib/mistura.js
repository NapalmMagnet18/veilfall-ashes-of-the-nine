// MISTURA — o BLEND SPACE e a SINCRONIA DE FASE.
//
// Duas coisas que andam sempre juntas: quem mistura dois andamentos tem SEMPRE o
// problema seguinte, que é as duas patas não concordarem em que ponto do passo vão.
// Por isso vivem no mesmo ficheiro.
//
// (A) BLEND SPACE — a FORMA sai de um eixo contínuo, não de um `if` por banda.
//     Bandas de velocidade não fazem andamentos; um andamento novo é uma FORMA nova,
//     e o blend space é o sítio onde duas formas se cruzam sem estalar.
//
// (B) RELÓGIO com sincronia — a fase é uma coisa que se PUXA, não que se corta.
//     É o que impede o pé de patinar quando o bound passa a galope a meio do passo.
//
// Uma POSE é o mesmo dicionário simples do camadas.js:  { coxaE: -30, peD: 12 }
// graus ou metros. Este ficheiro não conhece o engine: função pura, entra número,
// sai dicionário. Nada de objectApi, nada de Date, nada de random.
//
// ---------------------------------------------------------------------------
// EXEMPLO COLÁVEL (nomes reais do Mellion)
//
//   const { criaMistura, criaRelogio } = require('lib/mistura.js');
//
//   // NOTA DE INSTALAÇÃO: require() só resolve `builtin/*` e `lib/*`. A pasta do mod
//   // não é requerível: a cópia viva deste ficheiro vive ao lado do misturador, em
//   // `scripts/lib/anim/mistura.js`, e chama-se `require('lib/anim/mistura.js')` —
//   // exactamente como o `lib/anim/camadas.js` que o coelho-corpo.js já usa.
//
//   // as três formas do coelho, cada uma pura: t = fase 0..1 do ciclo
//   function poseParado(t) {
//     const resp = Math.sin(t * Math.PI * 2) * 1.4;
//     return { coxaE: 4, coxaD: 4, peE: 0, peD: 0, bracoE: 6, bracoD: 6,
//              inclina: 2 + resp, rolagem: 0, orelhaE: 3, orelhaD: -3 };
//   }
//   function poseBound(t) {          // 1.4–4.5 m/s, o salto de coelho
//     const s = Math.sin(t * Math.PI * 2);
//     return { coxaE: 52 * s, coxaD: 52 * s, peE: -30 * s, peD: -30 * s,
//              bracoE: -34 * s, bracoD: -34 * s, inclina: 16 * s, rolagem: 0,
//              orelhaE: 16 * s, orelhaD: 16 * s };
//   }
//   function poseGalope(t) {         // acima de 7 m/s: assimétrico, tudo à frente
//     const s = Math.sin(t * Math.PI * 2), c = Math.cos(t * Math.PI * 2);
//     return { coxaE: 60 * s, coxaD: 60 * -s, peE: -38 * c, peD: 38 * c,
//              bracoE: -40 * c, bracoD: 40 * c, inclina: 22 * s, rolagem: 7 * c,
//              orelhaE: 26, orelhaD: 26, orelhaYaw: 14 * c };   // canal só do galope
//   }
//
//   const andamentos = criaMistura({
//     amostras: [
//       { nome: 'parado', em: 0.0,  pose: poseParado },
//       { nome: 'bound',  em: 5.0,  pose: poseBound  },
//       { nome: 'galope', em: 11.0, pose: poseGalope },
//     ],
//   });
//
//   const rel = criaRelogio({ fase: 0 });
//
//   // por frame:
//   const hz = rel.velocidadeParaHz(vel, 2.4);   // 2.4 m de chão por ciclo
//   rel.avanca(dt, hz);
//   const pose = andamentos.amostra(vel, rel.fase());   // dicionário já misturado
//   M.escreve('locomocao', pose);                       // -> camadas.js
//
// ---------------------------------------------------------------------------
// O QUE 'em' PODE SER
//   número          -> blend space 1D. Interpola os DOIS vizinhos com smoothstep.
//   [x, y]          -> blend space 2D. Pesos por 1/distância² com corte nos 3-4
//                      vizinhos mais próximos, normalizados para somar 1.
//   Basta UMA amostra em [x, y] para a mistura toda ser 2D (as escritas com número
//   passam a valer y = 0). Ou força com `dimensao: 2`.
//
// O QUE 'pose' PODE SER
//   dicionário fixo                    -> usado como está.
//   função (t, ...extra) => dicionário -> chamada com TUDO o que passares depois do
//   eixo: `andamentos.amostra(vel, t, intensidade, rnd)` chama `pose(t, intensidade, rnd)`.
//   Só as amostras com peso > 0 são chamadas — em 1D são no máximo DUAS por frame,
//   por isso um blend space de 12 amostras custa o mesmo que um de 2.
//
// EM CIMA DE UMA AMOSTRA sai a pose EXACTA (o mesmo número, sem multiplicar por 1.0
// nem somar 0.0). Isto é lei: a orla do blend space é a que o criador vê ao afinar
// uma amostra sozinha, e um erro de 1e-16 aí lê-se como tremor.
//
// CANAIS QUE SÓ EXISTEM NUMAS AMOSTRAS  (a razão de ser deste ficheiro)
//   `orelhaYaw` existe no galope e não no bound. Como os pesos somam 1, o canal sai
//   a `valor × peso_do_galope` — NASCE A ZERO e cresce. Não é "ausente, ignora-se":
//   se se renormalizasse por canal, o orelhaYaw apareceria a 100% no primeiro frame
//   em que o galope tivesse 1% de peso, e é EXACTAMENTE esse estalo que aqui morre.
//   Medido no varrimento de 0 a 11 m/s com passo 0.01: salto máximo 1.5% da amplitude.
//   (Quando o peso é 1 numa amostra que não tem o canal, o canal não aparece no
//   dicionário — para o camadas.js é o mesmo que zero: quem não escreve, não manda.)
//
// ---------------------------------------------------------------------------
// O RELÓGIO
//   const rel = criaRelogio({ fase: 0 });
//   rel.avanca(dt, hz)              // hz pode mudar todos os frames
//   rel.fase() · rel.faseAntes()    // a de agora e a do frame anterior
//   rel.voltas()                    // ciclos completos desde sempre
//   rel.reinicia(fase)              // corte seco: aterrar, mudar de estado
//   rel.marcaDePasso(0.5)           // a fase deslocada (pata contrária), dobrada 0..1
//   rel.avancoUltimo()              // ciclos andados no último avanca (para os avisos)
//
//   rel.sincronizaCom(outro, 0.15)
//   Puxa a fase para a do outro relógio em vez de a cortar. O erro vai pelo caminho
//   MAIS CURTO (0.95 -> 0.05 sobe 0.10, nunca desce 0.90) e é multiplicado por
//   'ajuste'. POR QUE 0.15: com 0.15 por frame a 30 Hz o erro fica ×0.85 cada frame;
//   meio ciclo de erro (0.5, o pior caso possível) desce abaixo de 0.01 em 25 frames
//   = 0.83 s, e a correcção do primeiro frame é 0.075 de ciclo — a 3 Hz são 25 ms de
//   animação, abaixo do que o olho separa. Acima de ~0.35 vê-se o salto; abaixo de
//   ~0.05 o encontro demora mais de 3 s e as patas patinam todo esse tempo.
//   ATENÇÃO: 'ajuste' é POR FRAME. A 60 Hz o mesmo 0.15 fecha em metade do tempo;
//   para ser igual em qualquer framerate: `rel.sincronizaCom(outro, ajusteEstavel(0.15, dt))`.
//   Chama-se DEPOIS do avanca do frame, e devolve a correcção aplicada (em ciclos).
//
//   rel.velocidadeParaHz(vel, distanciaPorCiclo)
//   O converso honesto que faz o pé não deslizar: se cada ciclo avança 2.4 m de chão
//   e o corpo vai a 9.6 m/s, são 4 Hz. Nada de "ritmo = 1.55 + vel*0.30" — esse é o
//   deslizar de que o bibi se queixa há mais tempo. Terceiro argumento opcional é um
//   tecto de Hz; se o usares, o pé VOLTA a deslizar acima dele, e é escolha tua.
//
// LEI: nada de NaN sai daqui. Um `Math.pow(sin, 0.55)` com sin = -1e-16 já custou uma
// sessão inteira a caçar neste jogo. Todo o valor de pose é conferido antes de entrar
// na soma, e toda a divisão tem chão.

// ------------------------------------------------------------------ utilitários

export function finito(v) {
  return typeof v === 'number' && v === v && v !== Infinity && v !== -Infinity;
}

export function num(v, alternativa) {
  return finito(v) ? v : alternativa;
}

export function clamp01(v) {
  if (!(v > 0)) return 0;
  return v > 1 ? 1 : v;
}

// smoothstep. Derivada zero nas pontas: entrar e sair de uma amostra não dá pontapé
// de velocidade — é a diferença entre cruzar andamentos e ligá-los com um interruptor.
export function suave(u) {
  if (!(u > 0)) return 0;
  if (u >= 1) return 1;
  return u * u * (3 - 2 * u);
}

// Fase para [0,1). Nunca `f % 1` sozinho: (-0.2 % 1) = -0.2 em JS, e uma fase
// negativa faz o ciclo andar ao contrário durante um frame.
export function dobraFase(f) {
  if (!finito(f)) return 0;
  const n = Math.floor(f);
  let r = f - n;
  if (!(r >= 0)) r = 0;
  // f = -1e-17 dá r = 1 exacto por arredondamento; sem esta linha, fase() = 1.
  if (r >= 1) r = 0;
  return r;
}

export function ehLista(v) {
  return !!v && typeof v === 'object' && typeof v.length === 'number';
}

// A pose de uma amostra neste frame. Dicionário fixo ou função (t, ...extra).
export function avaliaPose(pose, extra) {
  let d = pose;
  if (typeof pose === 'function') d = pose.apply(null, extra);
  return (d && typeof d === 'object') ? d : {};
}

// hz honesto: ciclos por segundo para que o pé não deslize.
// 9.6 m/s com 2.4 m por ciclo = 4 Hz. Sinal preservado: velocidade negativa faz o
// ciclo andar ao contrário, que é o que um corpo a recuar precisa.
export function velocidadeParaHz(vel, distanciaPorCiclo, hzMax) {
  const v = num(vel, 0);
  const d = num(distanciaPorCiclo, 0);
  // 0 m por ciclo seria divisão por zero -> Infinity -> NaN dois frames depois.
  if (!(d > 1e-6)) return 0;
  let hz = v / d;
  const tecto = num(hzMax, 0);
  if (tecto > 0) {
    if (hz > tecto) hz = tecto;
    if (hz < -tecto) hz = -tecto;
  }
  return finito(hz) ? hz : 0;
}

// Converte um ajuste pensado para 30 Hz no equivalente para este dt.
// ajusteEstavel(0.15, 1/60) = 0.0783 — meio passo, porque há dois frames.
export function ajusteEstavel(ajuste30, dt) {
  const k = clamp01(num(ajuste30, 0.15));
  const passos = num(dt, 0) * 30;
  if (!(passos > 0)) return 0;
  if (k >= 1) return 1;
  const resto = Math.pow(1 - k, passos);
  return finito(resto) ? 1 - resto : k;
}

// Erro de fase pelo caminho mais curto, em (-0.5, 0.5].
// Math.round leva o empate exacto (0.5) para trás; a meio ciclo os dois caminhos
// têm o mesmo comprimento, por isso a escolha é arbitrária e nunca aumenta o erro.
export function erroCurto(alvo, atual) {
  const e = alvo - atual;
  return e - Math.round(e);
}

export function faseDoOutro(outro) {
  if (outro === null || outro === undefined) return null;
  if (typeof outro === 'number') return finito(outro) ? dobraFase(outro) : null;
  if (typeof outro.fase === 'function') {
    const f = outro.fase();
    return finito(f) ? dobraFase(f) : null;
  }
  if (finito(outro.fase)) return dobraFase(outro.fase);
  return null;
}

// -------------------------------------------------------------- (A) BLEND SPACE

export function criaMistura(cfg) {
  cfg = cfg || {};
  const brutas = cfg.amostras || [];
  const amostras = [];
  let dim = 1;

  for (let i = 0; i < brutas.length; i++) {
    const a = brutas[i];
    if (!a) continue;
    let x = 0, y = 0;
    if (ehLista(a.em)) {
      x = num(a.em[0], 0);
      y = num(a.em[1], 0);
      dim = 2;
    } else {
      x = num(a.em, 0);
    }
    amostras.push({
      indice: amostras.length,
      nome: a.nome === undefined ? null : a.nome,
      x: x,
      y: y,
      pose: a.pose,
    });
  }
  if (cfg.dimensao === 2) dim = 2;   // grelha 2D com todas as amostras numa linha

  // 1D fica ordenada pelo eixo (a busca de vizinhos assume-o). 'indice' guarda a
  // ordem de declaração, para o diagnóstico continuar a fazer sentido.
  if (dim === 1) amostras.sort(function (p, q) { return p.x - q.x; });

  const n = amostras.length;
  // Corte de vizinhos em 2D: 3 dá um triângulo, 4 arredonda os cantos da grelha.
  let vizinhos = Math.round(num(cfg.vizinhos, 4));
  if (!(vizinhos >= 1)) vizinhos = 1;
  if (vizinhos > n) vizinhos = n;

  function pesos1D(x) {
    if (n === 0) return [];
    if (n === 1) return [{ a: amostras[0], peso: 1 }];
    if (!finito(x)) x = amostras[0].x;
    if (x <= amostras[0].x) return [{ a: amostras[0], peso: 1 }];
    if (x >= amostras[n - 1].x) return [{ a: amostras[n - 1], peso: 1 }];
    let i = 0;
    while (i < n - 1 && amostras[i + 1].x <= x) i++;
    const A = amostras[i], B = amostras[i + 1];
    if (x === A.x) return [{ a: A, peso: 1 }];   // em cima: exacta, sem aritmética
    const vao = B.x - A.x;
    if (!(vao > 0)) return [{ a: A, peso: 1 }];  // duas amostras no mesmo ponto
    const s = suave((x - A.x) / vao);
    if (s <= 0) return [{ a: A, peso: 1 }];
    if (s >= 1) return [{ a: B, peso: 1 }];
    return [{ a: A, peso: 1 - s }, { a: B, peso: s }];
  }

  function pesos2D(x, y) {
    if (n === 0) return [];
    if (n === 1) return [{ a: amostras[0], peso: 1 }];
    if (!finito(x)) x = amostras[0].x;
    if (!finito(y)) y = amostras[0].y;

    const lista = [];
    for (let i = 0; i < n; i++) {
      const dx = x - amostras[i].x, dy = y - amostras[i].y;
      let d2 = dx * dx + dy * dy;
      // 1e-12 de distância conta como em cima: 1/d2 com d2 = 1e-320 é Infinity.
      if (d2 <= 1e-24) return [{ a: amostras[i], peso: 1 }];
      if (!finito(d2)) d2 = 1e30;
      lista.push({ a: amostras[i], d2: d2 });
    }
    lista.sort(function (p, q) { return p.d2 - q.d2; });

    const k = vizinhos;
    // Corte SUAVE (Shepard modificado): subtrai-se o peso que o (k+1)-ésimo teria,
    // por isso o k-ésimo cai a zero exactamente no raio do corte. Um corte seco
    // estala quando duas amostras trocam de lugar no ranking — a que entra entrava
    // com peso cheio. Assim entra a zero, que é a mesma lei do canal em falta.
    const corte = (k < n) ? lista[k].d2 : 0;
    const inv = corte > 0 ? 1 / corte : 0;

    let sel = [], soma = 0;
    for (let j = 0; j < k; j++) {
      const w = 1 / lista[j].d2 - inv;
      if (!(w > 0)) continue;
      sel.push({ a: lista[j].a, peso: w });
      soma += w;
    }
    // Todas à mesma distância (ponto no centro exacto de uma grelha simétrica):
    // o corte comeu tudo. Divide-se igual em vez de devolver zeros.
    if (!(soma > 0)) {
      sel = []; soma = 0;
      for (let m = 0; m < k; m++) { sel.push({ a: lista[m].a, peso: 1 }); soma += 1; }
    }
    for (let q = 0; q < sel.length; q++) sel[q].peso = sel[q].peso / soma;
    return sel;
  }

  function pesosEm(onde) {
    if (dim === 2) {
      if (ehLista(onde)) return pesos2D(num(onde[0], 0), num(onde[1], 0));
      if (onde && typeof onde === 'object') return pesos2D(num(onde.x, 0), num(onde.y, 0));
      return pesos2D(num(onde, 0), 0);
    }
    if (ehLista(onde)) return pesos1D(num(onde[0], 0));
    return pesos1D(num(onde, 0));
  }

  const B = {
    dimensao: function () { return dim; },
    total: function () { return n; },

    // Os extremos de cada eixo — para saber onde vale a pena pedir amostras.
    limites: function () {
      if (n === 0) return { x: [0, 0], y: [0, 0] };
      let x0 = amostras[0].x, x1 = amostras[0].x, y0 = amostras[0].y, y1 = amostras[0].y;
      for (let i = 1; i < n; i++) {
        if (amostras[i].x < x0) x0 = amostras[i].x;
        if (amostras[i].x > x1) x1 = amostras[i].x;
        if (amostras[i].y < y0) y0 = amostras[i].y;
        if (amostras[i].y > y1) y1 = amostras[i].y;
      }
      return { x: [x0, x1], y: [y0, y1] };
    },

    // A pose misturada. amostra(eixo, t, ...extra) — t e os extras passam através
    // para cada função de pose chamada.
    amostra: function (onde) {
      const extra = [];
      for (let i = 1; i < arguments.length; i++) extra.push(arguments[i]);

      const contribs = pesosEm(onde);
      const out = {};
      if (contribs.length === 0) return out;

      // Peso inteiro numa só amostra: copia-se o valor TAL E QUAL. Multiplicar por
      // 1.0 daria o mesmo bit, mas somar a 0.0 troca o sinal do zero negativo e,
      // acima de tudo, esta porta garante a exactidão sem depender de IEEE.
      if (contribs.length === 1) {
        const d = avaliaPose(contribs[0].a.pose, extra);
        const ks = Object.keys(d);
        for (let j = 0; j < ks.length; j++) {
          const v = d[ks[j]];
          if (finito(v)) out[ks[j]] = v;
        }
        return out;
      }

      for (let c = 0; c < contribs.length; c++) {
        const w = contribs[c].peso;
        if (!(w > 0)) continue;
        const d = avaliaPose(contribs[c].a.pose, extra);
        const ks = Object.keys(d);
        for (let j = 0; j < ks.length; j++) {
          const canal = ks[j];
          const v = d[canal];
          // NaN/Infinity de um Math.pow(sin, 0.55) morre aqui, não no corpo.
          if (!finito(v)) continue;
          // Canal em falta nas outras amostras = 0, não "ignora": os pesos já somam
          // 1, por isso não se renormaliza nada. É isto que o faz nascer a zero.
          out[canal] = (out[canal] === undefined ? 0 : out[canal]) + v * w;
        }
      }
      return out;
    },

    // Diagnóstico: quem está a contribuir e com quanto. Só os pesos > 0, do maior
    // para o menor. Bom para um HUD de criador ao afinar as amostras.
    amostrasEm: function (onde) {
      const contribs = pesosEm(onde);
      const out = [];
      for (let i = 0; i < contribs.length; i++) {
        const a = contribs[i].a;
        out.push({
          nome: a.nome,
          indice: a.indice,
          em: dim === 2 ? [a.x, a.y] : a.x,
          peso: contribs[i].peso,
        });
      }
      out.sort(function (p, q) { return q.peso - p.peso; });
      return out;
    },
  };

  return B;
}

// ------------------------------------------------------- (B) SINCRONIA DE FASE

export function criaRelogio(cfg) {
  cfg = cfg || {};
  let fase = dobraFase(num(cfg.fase, 0));
  let antes = fase;
  let voltas = 0;
  let ultimo = 0;

  const R = {
    // dt em segundos, hz em ciclos por segundo. hz pode mudar todos os frames —
    // é o normal: vem de velocidadeParaHz e a velocidade nunca está quieta.
    avanca: function (dt, hz) {
      antes = fase;
      ultimo = 0;
      let passo = num(dt, 0) * num(hz, 0);
      if (!finito(passo) || passo === 0) return R;
      // Um frame perdido (dt de 4 s) ou um teleporte com velocidade absurda não
      // valem mais de 1000 ciclos: acima disso a soma perde precisão de fase e não
      // há nada a ganhar — ninguém vê o 1001.º ciclo de um frame.
      if (passo > 1000) passo = 1000;
      if (passo < -1000) passo = -1000;

      const bruta = fase + passo;
      let n = Math.floor(bruta);
      let r = bruta - n;
      if (!(r >= 0)) r = 0;
      if (r >= 1) { n += 1; r = 0; }
      voltas += n;         // negativo se o ciclo andou para trás, e está certo
      fase = r;
      ultimo = passo;
      return R;
    },

    fase: function () { return fase; },

    // A fase do frame anterior. É o par (faseAntes, fase] que os avisos comem para
    // saber que marcas passaram neste frame.
    faseAntes: function () { return antes; },

    voltas: function () { return voltas; },

    // Ciclos andados no último avanca (pode ser > 1: um aviso tem de saber que a
    // janela deu a volta inteira e não disparar só uma vez).
    avancoUltimo: function () { return ultimo; },

    // Corte seco. Aterrar, mudar de estado sem sincronia, renascer.
    // As voltas contam a vida do relógio e NÃO se zeram sozinhas — passa true se
    // quiseres o contador limpo (um aviso "só na primeira volta" depende disso).
    reinicia: function (novaFase, zeraVoltas) {
      fase = dobraFase(num(novaFase, 0));
      antes = fase;
      if (zeraVoltas) voltas = 0;
      return R;
    },

    // A fase deslocada, dobrada para 0..1. marcaDePasso(0.5) é a pata contrária;
    // 0.25 e 0.75 são as diagonais de um quadrúpede a trotar.
    marcaDePasso: function (offset) {
      return dobraFase(fase + num(offset, 0));
    },

    // O erro de fase até outro relógio, pelo caminho mais curto, em (-0.5, 0.5].
    // Positivo = o outro vai à frente. Aceita um relógio ou um número.
    erroPara: function (outro) {
      const alvo = faseDoOutro(outro);
      if (alvo === null) return 0;
      return erroCurto(alvo, fase);
    },

    // Puxa esta fase para a do outro relógio em vez de a cortar. Ver o cabeçalho
    // para o porquê do 0.15. Devolve a correcção aplicada, em ciclos.
    sincronizaCom: function (outro, ajuste) {
      const alvo = faseDoOutro(outro);
      if (alvo === null) return 0;
      const k = clamp01(num(ajuste, 0.15));
      const correcao = erroCurto(alvo, fase) * k;
      if (!finito(correcao) || correcao === 0) return 0;
      fase = dobraFase(fase + correcao);
      // A janela anda com a correcção. Se 'antes' ficasse quieto, um puxão para trás
      // invertia o par (antes, fase] e os avisos disparavam duas vezes ou nenhuma.
      // A janela mede o TEMPO andado neste frame, não a correcção.
      antes = dobraFase(antes + correcao);
      return correcao;
    },

    // Método por conveniência — o mesmo converso do módulo.
    velocidadeParaHz: function (vel, distanciaPorCiclo, hzMax) {
      return velocidadeParaHz(vel, distanciaPorCiclo, hzMax);
    },

    // Tudo de uma vez, para logs.
    estado: function () {
      return { fase: fase, antes: antes, voltas: voltas, ultimo: ultimo };
    },
  };

  return R;
}

module.exports = {
  criaMistura,
  criaRelogio,
  velocidadeParaHz,
  ajusteEstavel,
  dobraFase,
  suave,
};
