// AVISOS — os instantes e as janelas de um ciclo (os "notifies" do UE5, sem esqueleto).
//
// O problema que isto resolve: hoje o baque do passo é UMA linha solta em
// coelho-corpo.js — `if (Math.floor(mem.fase) !== Math.floor(faseAntes)) playSound(...)`.
// Serve para um som, numa fase, à passagem do zero. Não sabe dizer "as patas da FRENTE
// tocaram a 0.62", não sabe "estamos DENTRO da janela em que a pancada do osso conta",
// e à primeira volta ao zero num frame gordo engole ou repete o baque.
//
// Aqui a fase é um relógio 0..1 e tu marcas nele:
//   MARCAS  — instantes. `avanca()` devolve o que acabou de passar, pela ORDEM da fase.
//   JANELAS — intervalos. `dentro()` diz se a fase está lá dentro AGORA (podem atravessar o zero).
//
// Uma pose é um dicionário de canais (ver camadas.js): { coxaE: -30, peD: 12, bracoD: 62,
// orelhaE: -8, inclina: 6, rolagem: -2 }. Os avisos não escrevem canais — DIZEM O QUE
// ACONTECEU, e quem ouve decide se é som, se é golpe, se é um empurrão na pose.
//
//   const { criaAvisos } = require('lib/avisos.js');
//
//   // NOTA DE ARRUMAÇÃO (lei do engine, não minha): o require() do Tome só resolve
//   // `builtin/*`, `lib/*` e `mods/<mod>/lib/*`. De um script dentro de scripts/animacao-viva/,
//   // `require('lib/avisos.js')` procura por esta ordem: mods/animacao-viva/lib/avisos.js →
//   // animacao-viva/lib/avisos.js → lib/avisos.js. Este módulo é PURO e não tem dependências,
//   // logo vive onde o mod o arrumar: ao lado do camadas.js (animacao-viva/lib/) para o mod,
//   // ou em lib/ para o jogo base. Sem lib/ no caminho, nenhum script o consegue requerer.
//
//   // uma vez, por corpo (dois coelhos = dois criaAvisos; não há estado partilhado):
//   mem.avisos = criaAvisos({
//     marcas: [
//       { nome: 'patasTras',   em: 0.00 },   // as traseiras aterram — o motor do bound
//       { nome: 'topo',        em: 0.35 },   // ápice do arco: é aqui que as orelhas esticam
//       { nome: 'patasFrente', em: 0.62 },   // as da frente tocam
//     ],
//     janelas: [
//       { nome: 'impacto', de: 0.42, ate: 0.58 },   // a haste a passar: aqui a pancada conta
//       { nome: 'recolha', de: 0.90, ate: 0.08 },   // atravessa o zero: a coluna a dobrar
//     ],
//   });
//
//   // por frame, logo depois de mexer a fase:
//   const faseAntes = mem.fase;
//   mem.fase += dt * ritmo;                       // ritmo = 2.4..4.0 Hz (K_RITMO)
//   const avisos = mem.avisos.avanca(faseAntes, mem.fase);
//   for (let i = 0; i < avisos.length; i++) {
//     if (avisos[i] === 'patasTras')   objectApi.playSound(SFX_PATA, { gain: 0.16 + passo * 0.22 });
//     if (avisos[i] === 'patasFrente') objectApi.playSound(SFX_PATA, { gain: 0.10, pitch: 1.14 });
//     if (avisos[i] === 'topo')        pose.orelhaE -= 6;   // um empurrão no canal, no instante certo
//   }
//   if (mem.avisos.dentro('impacto') && encostouNoBativel) contaPancada();
//
//   // quando a fase é assentada à força (aterragem, mudança de andamento, teleporte):
//   mem.avisos.reinicia(0.0);     // assenta e não dispara nada
//
// O QUE ELE ACEITA COMO FASE
//   Tanto a fase CUMULATIVA (a de coelho-corpo.js: 0 → 0.13 → ... → 12.47, a somar sempre)
//   como a fase ENVOLVIDA (0..1, a voltar ao zero). Com a cumulativa ele conta as voltas
//   inteiras de um frame gordo com exactidão; com a envolvida lê o caminho mais curto para
//   a frente, que é o único que se pode ler de 0.95 → 0.05.

// --- as três leis, e o número de cada uma ------------------------------------------------
//
// 1) SENTIDO ÚNICO. Só se dispara para a frente. Uma fase a andar para trás (0.60 → 0.50)
//    lê-se como um avanço de 0.90 — mais do que o limiar — e não dispara nada.
//
// 2) VOLTA AO ZERO. 0.95 → 0.05 é meio... não: é um avanço de 0.10, não um recuo de 0.90.
//    Varre (0.95, 1.0] e [0.0, 0.05] pela ordem em que passaram.
//
// 3) CORTE, com limiar em 0.5 do ciclo. Um avanço maior do que meio ciclo que as voltas
//    inteiras não expliquem não é um varrimento — é um corte (reinicia, mudança de
//    andamento, aterragem, salto de rede) — e não dispara NADA.
//    PORQUE 0.5: o ritmo mais rápido deste jogo é 4.0 Hz (K_RITMO a 11 m/s). A 30 Hz isso
//    dá 4.0/30 = 0.133 do ciclo por frame; a 60 Hz, 0.067. Meio ciclo são portanto ~3.7
//    frames perdidos de seguida a 30 Hz (~125 ms de engasgo) ou 7.5 a 60 Hz. Abaixo disso
//    é engasgo e varre-se; acima é indistinguível de um corte, e um baque no sítio errado
//    ouve-se muito mais do que um baque que falta. Trocar 0.5 por 0.75 dá mais folga ao
//    engasgo e mais baques falsos aos cortes; é o único parafuso desta decisão.
const LIMIAR_CORTE = 0.5;

// Tolerância do próprio ciclo: 1e-9 do ciclo = 0.25 ns a 4 Hz. Serve para que uma marca
// EM CIMA da fase actual não volte a disparar no frame seguinte (é a defesa do disparo duplo).
const EPS = 1e-9;

// Tolerância de continuidade entre frames: se o `faseAntes` que me dás não é a fase onde eu
// ficei, alguém mexeu na fase por fora e este frame é um corte. 1e-6 do ciclo = 0.25 µs a
// 4 Hz — folga para arredondamentos, apertado o suficiente para apanhar um salto a sério.
const EPS_LIGACAO = 1e-6;

export function criaAvisos(cfg) {
  cfg = cfg || {};

  // --- marcas: nome + instante em 0..1 ---------------------------------------------------
  // Marcas repetidas com o mesmo nome são LEGÍTIMAS (duas patas por ciclo: 0.00 e 0.50).
  // Uma marca com `em` inválido (undefined, NaN, Infinity) não entra — não há marca fantasma
  // a disparar num sítio inventado.
  const marcas = [];
  const entradaMarcas = cfg.marcas || [];
  for (let i = 0; i < entradaMarcas.length; i++) {
    const m = entradaMarcas[i];
    if (!m || typeof m.nome !== 'string') continue;
    const em = fracSegura(numero(m.em));
    if (em === null) continue;
    marcas.push({ nome: m.nome, em: em, seq: marcas.length });
  }

  // --- janelas: de..ate em 0..1, podendo atravessar o zero -------------------------------
  // de > ate  => a janela atravessa o zero (0.90..0.08 = 0.90→1.0 mais 0.0→0.08).
  // de == ate => janela nula (largura zero). Para um instante usa uma MARCA, não uma janela.
  const janelas = {};
  const nomesJanela = [];
  const entradaJanelas = cfg.janelas || [];
  for (let i = 0; i < entradaJanelas.length; i++) {
    const j = entradaJanelas[i];
    if (!j || typeof j.nome !== 'string') continue;
    const de = fracSegura(numero(j.de));
    const ate = fracSegura(numero(j.ate));
    if (de === null || ate === null) continue;
    if (!janelas[j.nome]) nomesJanela.push(j.nome);
    janelas[j.nome] = { de: de, ate: ate, atravessa: de > ate };
  }

  // --- estado, todo aqui dentro (fechadura do "sem estado global") -----------------------
  let fase = 0;            // a fase envolvida onde ficámos no último avanca/reinicia
  let assentada = false;   // ainda não vimos frame nenhum: o primeiro só assenta
  let ultimoAvanco = 0;    // diagnóstico
  let ultimoCorte = false; // diagnóstico

  const N = {
    // Diz o que passou entre dois frames. Devolve um array de nomes, pela ordem da fase.
    //   avanca(faseAntes, faseAgora) — a forma normal, os dois números do frame.
    //   avanca(faseAgora)            — forma curta: usa a fase assentada como "antes".
    // Nunca devolve o mesmo nome duas vezes no mesmo frame, seja o avanço de 0.1 ou de 7 ciclos.
    avanca: function (faseAntes, faseAgora) {
      const saida = [];
      const formaCurta = (faseAgora === undefined || faseAgora === null);
      let a = numero(faseAntes);
      let b = numero(faseAgora);
      if (formaCurta) { b = a; a = null; }   // avanca(faseAgora): o "antes" é a fase assentada
      if (b === null) { return saida; }      // nada utilizável: a fase fica exactamente onde estava

      const fb = fracSegura(b);
      const fa = (a === null) ? fase : fracSegura(a);

      let corte = false;
      // Primeiro frame da vida deste objecto: não há "antes", logo não há varrimento.
      if (!assentada) corte = true;
      // Deram-me um `faseAntes` que não é número (NaN de uma conta que estourou): a fase nova
      // assenta, mas não se inventa um varrimento a partir de lixo — silêncio é melhor que
      // um baque no sítio errado.
      if (!formaCurta && a === null) corte = true;
      // O `faseAntes` que me deram não é onde eu fiquei => a fase foi mexida por fora.
      if (a !== null && assentada && distanciaCiclo(fa, fase) > EPS_LIGACAO) corte = true;

      // Avanço em ciclos: voltas inteiras (só a fase cumulativa as sabe) + o resto para a frente.
      const passoFrente = paraFrente(fb - fa);
      let voltas = 0;
      if (a !== null) {
        const cru = b - a;
        if (cru > 0) {
          const v = Math.round(cru - passoFrente);
          if (v > 0) voltas = v;    // (v pode vir 0 ou negativo por arredondamento: fica 0)
        }
        // cru <= 0 => ou é fase envolvida a passar o zero, ou é recuo. Em ambos os casos
        // não há voltas a declarar e a leitura é o caminho curto para a frente, `passoFrente`.
      }
      const avanco = voltas + passoFrente;

      // Lei 3: meio ciclo sem voltas que o expliquem é corte, não varrimento.
      if (voltas === 0 && passoFrente > LIMIAR_CORTE) corte = true;

      if (!corte && avanco > 0) {
        // Distância de cada marca à fase de partida, para a frente. Ordenar por essa
        // distância é ordenar pela ordem em que passaram — e resolve o zero de graça.
        const candidatos = [];
        for (let i = 0; i < marcas.length; i++) {
          const m = marcas[i];
          let d = paraFrente(m.em - fa);
          // Marca em cima da fase de partida: já soou quando chegámos aqui. Só na volta seguinte.
          if (d <= EPS) d += 1;
          if (d <= avanco + EPS) candidatos.push({ d: d, nome: m.nome, seq: m.seq });
        }
        candidatos.sort(function (x, y) {
          return x.d === y.d ? (x.seq - y.seq) : (x.d - y.d);
        });
        // Cada marca entrou no máximo UMA vez no array de candidatos (uma passagem pela lista),
        // logo um frame de 3 voltas dá 3 marcas, não 9 baques.
        for (let i = 0; i < candidatos.length; i++) saida.push(candidatos[i].nome);
      }

      fase = fb;
      assentada = true;
      ultimoAvanco = corte ? 0 : avanco;
      ultimoCorte = corte;
      return saida;
    },

    // A fase está dentro desta janela? Por omissão usa a fase do último avanca/reinicia.
    // Nome desconhecido devolve false — um golpe nunca conta por causa de um nome mal escrito.
    dentro: function (nome, faseTeste) {
      const j = janelas[nome];
      if (!j) return false;
      const f = faseTeste === undefined ? fase : fracSegura(numero(faseTeste));
      if (f === null) return false;
      if (j.de === j.ate) return false;                  // janela nula
      if (j.atravessa) return f >= j.de || f <= j.ate;   // 0.90..1.0 + 0.0..0.08
      return f >= j.de && f <= j.ate;
    },

    // Assenta a fase sem disparar nada. É isto que se chama na aterragem, na mudança de
    // andamento e no teleporte: a fase nova não foi "percorrida", logo não soa.
    reinicia: function (novaFase) {
      const f = fracSegura(numero(novaFase));
      fase = f === null ? 0 : f;
      assentada = true;
      ultimoAvanco = 0;
      ultimoCorte = true;
      return N;
    },

    // A fase envolvida onde estamos (0..1). Para HUD de criador e para quem precisa dela.
    fase: function () { return fase; },

    // Diagnóstico, no mesmo espírito de M.estado() em camadas.js.
    estado: function () {
      const j = {};
      for (let i = 0; i < nomesJanela.length; i++) j[nomesJanela[i]] = N.dentro(nomesJanela[i]);
      return { fase: fase, avanco: ultimoAvanco, corte: ultimoCorte, janelas: j };
    },
  };

  return N;
}

// --- defesas contra NaN (o bicho que já custou uma sessão a este jogo) ---------------------

// Só números reais passam. undefined, null, NaN, ±Infinity e strings ficam de fora.
export function numero(v) {
  if (typeof v !== 'number') return null;
  if (v !== v) return null;                        // NaN
  if (v === Infinity || v === -Infinity) return null;
  return v;
}

// Parte fraccionária, com rede: para |v| enorme o floor perde a fracção e devolve algo fora
// de [0,1) — nesse caso 0, que é o mesmo ponto do ciclo que 1. Nunca devolve NaN.
export function fracSegura(v) {
  if (v === null) return null;
  const f = v - Math.floor(v);
  return (f >= 0 && f < 1) ? f : 0;
}

// Distância para a frente no ciclo, sempre em [0, 1).
export function paraFrente(d) {
  if (!(d === d)) return 0;
  let x = d % 1;
  if (x < 0) x += 1;
  return (x >= 0 && x < 1) ? x : 0;
}

// Distância entre duas fases pelo caminho mais curto (0..0.5) — para comparar continuidade.
export function distanciaCiclo(a, b) {
  const d = paraFrente(a - b);
  return d > 0.5 ? 1 - d : d;
}

module.exports = { criaAvisos };
