---
name: Animação Viva — sistemas de animação para corpos sem esqueleto
description: Animação para corpos SEM rig — máquina de estados com cross-fade, blend spaces 1D/2D, camadas por região do corpo, aditivos, notifies com marcas e janelas, e sincronia de fase que impede o pé de patinar. A lista de animação do Unreal traduzida para quem calcula as poses à mão.
---

# Animação Viva — sistemas de animação para corpos sem esqueleto

## Para que serve

Há um caso que os sistemas de animação normais não servem: um corpo feito de **peças
soltas**, cujas poses são **calculadas por frame**. Sem rig, sem clipes, sem
retargeting — um `update()` que decide ângulos e os escreve nas peças.

É mais comum do que parece. Bonecos de primitivas, naves com flaps e turbinas, torres
com braços, bichos de geometria, guindastes, portões, marionetas de caixas. Todos
acabam no mesmo sítio: dois `if` a escrever no mesmo canal, e o último a escrever
ganha — o corpo inteiro pára para dar uma pancada, ou muda de andamento a piscar.

Este mod dá a esse corpo o que um Animation Blueprint dá a um esqueleto, com uma
diferença de vocabulário que muda tudo: **aqui não há ossos, há canais**. Uma POSE é
um dicionário simples — `{ coxaE: -30, peD: 12, bracoD: 62, orelhaE: -8, inclina: 6,
rolagem: -2 }`, graus ou metros, os nomes são teus. Os quatro ficheiros só mexem em
números: **zero engine, zero `objectApi`, zero `Date`/`Math.random`**. Entra dt, saem
dicionários.

Se o teu corpo TEM esqueleto (`model: '...glb?animations=Idle,Walk,Run'`), não é aqui
— é a lane do motor, com `updateChannel` e o skill `3d-animations`. Este mod é para o
outro caso.

## Arrumação: onde os ficheiros têm de estar

Lei do motor, não gosto: `require()` só resolve `builtin/*`, `lib/*` e
`mods/<mod>/lib/*`. De quem chama de dentro do mod, `require('lib/x.js')` sonda por
esta ordem — `mods/<mod>/lib/x.js` → `<mod>/lib/x.js` → `lib/x.js`
(`` → `resolveLibraryKeyForCaller`).

**Um ficheiro de mod fora de `lib/` não é requerível por nada.** Medido:

```
require('animacao-viva/lib/camadas.js')  -> ok: criaMisturador
require('animacao-viva/lib/maquina.js')  -> ok: criaMaquina
require('animacao-viva/mistura.js')      -> [Tome] require() only supports builtin/*, lib/*, or mods/*/lib/* modules
require('animacao-viva/avisos.js')       -> (o mesmo erro, quando estavam na raiz)
```

Por isso os quatro vivem em **`lib/`** e não noutro sítio. Depois de instalares o mod,
a grafia é a do namespace:

```js
const { criaMisturador } = require('mods/animacao-viva/lib/camadas.js');
const { criaMaquina }    = require('mods/animacao-viva/lib/maquina.js');
const { criaMistura, criaRelogio, velocidadeParaHz } = require('mods/animacao-viva/lib/mistura.js');
const { criaAvisos }     = require('mods/animacao-viva/lib/avisos.js');
```

Se preferires uma cópia tua dentro do jogo — para a editares à vontade — põe os quatro
numa pasta só deles e troca o prefixo. Neste jogo essa pasta é `scripts/lib/anim/`, e o
`coelho-corpo.js` requer `lib/anim/camadas.js`. São módulos puros, sem dependências
entre si: mudar de casa é copiar e ajustar uma linha por `require`. A receita da secção
3 está escrita na grafia `lib/anim/` — troca para `mods/animacao-viva/lib/` se usares o
mod instalado tal e qual.

## A tabela de tradução (Unreal Engine 5 → aqui)

| No UE5 | Aqui | Ficheiro · função |
| --- | --- | --- |
| Animation Blueprint / State Machine | estados que se **cruzam**; o que sai é um mapa de pesos que soma 1 | `maquina.js` · `criaMaquina` → `avanca(dt, ctx)` + `pesos()` |
| Blend Space 1D | eixo contínuo (velocidade), smoothstep entre os dois vizinhos | `mistura.js` · `criaMistura({ amostras })` → `amostra(vel, t)` |
| Blend Space 2D | `em: [x, y]`, pesos por 1/d² com corte nos 4 vizinhos | `mistura.js` · `criaMistura({ amostras, vizinhos })` |
| Sync Groups / Sync Markers | a fase **puxa-se**, não se corta | `mistura.js` · `criaRelogio().sincronizaCom(outro, ajuste)`, `marcaDePasso(0.5)` |
| Layered Animation / Blend per bone | regiões do corpo + peso por região | `camadas.js` · `criaMisturador({ regioes })`, `camada(n, { regioes, pesos })`, `pesoRegiao` |
| Additive Animation | uma camada que **soma** em vez de substituir | `camadas.js` · `camada(n, { modo: 'soma' })` |
| Animation Notifies | instantes do ciclo que acabaram de passar | `avisos.js` · `criaAvisos({ marcas })` → `avanca(faseAntes, faseAgora)` |
| Notify States (janelas) | intervalos: "estamos DENTRO da parte que conta" | `avisos.js` · `criaAvisos({ janelas })` → `dentro(nome[, fase])` |
| Blend Poses by bool / Slot | ligar/desligar com fade, ou peso à mão | `camadas.js` · `ativa(nome, bool \| 0..1)`, `forca(nome, peso)` |
| Montages | uma camada de alta prioridade com relógio próprio (ver abaixo) | `camadas.js` + o teu contador de segundos |
| Root Motion | **ao contrário**: o chão manda no ciclo (ver abaixo) | `mistura.js` · `velocidadeParaHz(vel, metrosPorCiclo)` |

### Montages, em código

Uma montage é uma camada de prioridade alta, com regiões próprias, ligada por um
contador de tempo em vez de por uma condição de estado. O cross-fade de entrada e
saída é o `entrada`/`saida` da camada; a linha do tempo interna é tua, em segundos:

```js
M.camada('golpe', { modo: 'sobrepoe', prioridade: 10, entrada: 0.06, saida: 0.16,
                    regioes: ['bracoD', 'bracoE', 'tronco'],
                    pesos: { bracoE: 0.7, tronco: 0.45 }, ligada: false });

// disparo:  m.golpeT = 0;
if (m.golpeT !== null) {
  m.golpeT += dt;
  const u = m.golpeT / 0.78;                    // 0.78 s = a duração do gesto
  M.escreve('golpe', posePancada(u < 1 ? u : 1));
  M.ativa('golpe', u < 1);                      // desliga-se sozinha, com saída de 0.16 s
  if (avisos.dentro('impacto', u)) contaPancada();   // janela testada na fase DA MONTAGEM
  if (m.golpeT > 0.78 + 0.16) m.golpeT = null;  // só depois de a saída acabar
}
```

Repara no `dentro('impacto', u)`: as janelas aceitam uma fase explícita, por isso a
janela de acerto da montage não toca no relógio do passo.

### Root Motion, ao contrário

No UE5 o root motion deixa a animação empurrar o corpo. Aqui o corpo já se move (é o
jogo que o move) e o que falta é o inverso honesto: **o chão a mandar no ciclo**.

```js
const hz = velocidadeParaHz(vel, 2.4);   // 2.4 m de chão por ciclo
rel.avanca(dt, hz);                      // 9.6 m/s / 2.4 m = 4 Hz, exactamente
```

É esta linha que mata o *"está a deslizar"*. Nada de `ritmo = 1.55 + vel * 0.30`: se
o ciclo não avança os metros que o corpo avançou, o pé patina, e nenhuma pose bonita
esconde isso. O terceiro argumento é um tecto de Hz — acima dele o pé VOLTA a
deslizar, e é escolha tua (`velocidadeParaHz(vel, 2.4, 4.0)`).

### O que NÃO tem tradução, e porquê

Sem rodeios, e não é "em breve" — **pedem um esqueleto, e este mod é para quem não o
tem**:

- **Skeleton / Skeletal Mesh** — uma hierarquia de ossos com bind pose e pesos de
  skin. Aqui as peças são filhos planos com rotações próprias; não há malha a deformar.
- **IK Rig / IK Retargeter** — retargeting é mapear ossos de um esqueleto para os de
  outro. Sem ossos não há nada para mapear (e sem clipes não há de onde retargetar).
- **Control Rig** — um grafo que resolve cadeias de ossos com controladores. O
  equivalente honesto aqui é a tua função de pose: já é código, já tens o controlo.
- **Motion Matching** — escolhe o frame mais parecido numa base de dados de poses
  capturadas. Um corpo sem clipes não tem base de dados; o que tem é o blend space.
- **Full Body IK** — resolve a cadeia toda para pousar mão e pé no sítio. Precisa de
  comprimentos de osso e de um solver; se precisares de pés colados ao terreno, isso
  é a lane com rig do motor (`ik` / auto foot grounding, skill `3d-animations`).
- **Captura facial / ARKit curves** — pede morph targets ou ossos de cara. Um focinho
  de primitivas anima-se por canais (`focinho`, `orelhaE`), à mão.

O que fica de fora não é pouco. O que fica dentro é o que faz o corpo LER bem: pesos
que somam 1, transições que cruzam, regiões que não se atropelam, e um ciclo com a
fase certa.

## Os contratos, assinatura a assinatura

### `camadas.js` — `module.exports = { criaMisturador }`

`criaMisturador({ regioes })` → `M`. `regioes` é `{ nomeRegiao: [canais...] }`. Um
canal que nenhuma região reclamou vive na região `'outros'`.

- `M.camada(nome, opts)` → `M`. Declara/reconfigura. `opts`: `modo` (`'sobrepoe'`
  omissão, `'soma'`) · `prioridade` (0) · `regioes` (`undefined` ou `'*'` = corpo
  todo; string ou array de **nomes de região**) · `pesos` (`{ regiao: 0..1 }`) ·
  `entrada` (**0.12 s**) · `saida` (**0.18 s**) · `ligada: false` (nasce a 0) ·
  `peso` (assenta peso e alvo já). Voltar a chamar com o mesmo nome **mantém o peso e
  a pose** — mas volta a pôr o alvo a 1 se não passares `ligada: false`. Declara as
  camadas **uma vez**, não por frame (ver Armadilha 5).
- `M.escreve(nome, pose)` → `M`. A pose deste frame. `null` limpa. **A pose fica
  guardada** até a substituíres — e é lida por referência: mexer no dicionário depois
  do `escreve` e antes do `resolve()` ainda conta.
- `M.ativa(nome, ligada)` → `M`. `true`/`false`, ou um número 0..1 como alvo directo.
- `M.forca(nome, peso)` → `M`. Salta o fade (morte, teleporte, câmara nova).
- `M.pesoRegiao(nome, regiao, valor)` → `M`. Multiplicador da região, 0..1.
- `M.pesoDe(nome)` → 0..1 (0 se a camada não existe).
- `M.avanca(dt)` → `M`. Avança os fades. `dt` ≤ 0 ou NaN = frame parado.
  `entrada`/`saida` de 0 assentam no mesmo frame.
- `M.resolve()` → **dicionário novo**. Ordem: prioridade crescente, empate pela ordem
  de declaração. Salta camadas sem pose ou com peso ≤ 0; ignora valores não-numéricos
  e NaN; salta canais fora das regiões da camada. Peso efectivo `w = peso ×
  pesos[regiao]`. `'soma'`: `out += v·w`. `'sobrepoe'`: `out = base + (v − base)·w`,
  com `base = 0` quando ninguém escreveu o canal por baixo.
- `M.estado()` → `{ camada: peso }`, para HUD de criador e logs.

### `maquina.js` — `module.exports = { criaMaquina }`

`criaMaquina({ inicial, estados, qualquer, quandoEntra, quandoSai })` → `E`.
`estados: { nome: { minimo, transicoes: [{ para, quando, em, urgente }] } }`.

- `para` obrigatório (string não vazia); um destino não declarado passa a existir com
  `minimo 0` e sem saídas. `quando` em falta = sempre verdade. `em` em falta =
  **0.15 s**; `em: 0` = corte seco legítimo (e sem `anterior()`); negativo = 0.
  `urgente: true` passa por cima do `minimo` — é para o salto, que não espera.
- `qualquer: [...]` é testado **antes** das transições do estado. Dentro de cada
  lista, a **primeira** condição verdadeira ganha: a ordem é a prioridade.
- `quandoEntra(nome, ctx)` / `quandoSai(nome, ctx)`, opcionais. Um `quando` ou um
  callback que atire erro conta como **falso** e não parte o frame do corpo.
- `E.avanca(dt, ctx)` → `E`. `dt` ≤ 0/NaN = 0; `dt` > 1 s é aparado a 1. O fade em
  curso avança **primeiro**, e só depois se procura transição nova.
- `E.pesos()` → `{ bound: 0.31, galope: 0.69 }`, **soma sempre 1**. Assente devolve
  sempre o **mesmo objecto** (zero lixo por frame): copia antes de guardar.
- `E.atual()` (para onde se vai) · `E.anterior()` (o mais pesado do que se deixa, ou
  `null`) · `E.mistura()` (0..1 do fade) · `E.tempoNoEstado()` · `E.emTransicao()`.
- `E.forca(nome, ctx)` → `E`. Assenta já. Forçar o estado onde já se está só assenta
  o fade — não reinicia o relógio nem repete `quandoEntra`.

Interromper um fade a meio **não dá salto**: a mistura desse instante congela como
base e o fade novo parte dela. É por isso que `pesos()` é um mapa e não dois nomes —
a meio de dois cortes há **três** estados vivos ao mesmo tempo.

### `mistura.js` — `module.exports = { criaMistura, criaRelogio, velocidadeParaHz, ajusteEstavel, dobraFase, suave }`

`criaMistura({ amostras, vizinhos, dimensao })` → `B`.
`amostras: [{ nome, em, pose }]`. `em` número = **1D**; `em: [x, y]` = **2D** (basta
uma amostra em lista para tudo ser 2D; ou força com `dimensao: 2`). `pose` =
dicionário fixo ou função `(t, ...extra)`.

- `B.amostra(onde, ...extra)` → dicionário misturado. `onde`: número, `[x, y]` ou
  `{ x, y }`. Os extras passam para cada função de pose: `amostra(vel, t,
  intensidade)` chama `pose(t, intensidade)`. Só as amostras com peso > 0 são
  chamadas — em 1D no máximo **duas** por frame, logo 12 amostras custam o mesmo que 2.
- **Em cima de uma amostra sai a pose exacta** (porta de peso-inteiro: copia o valor,
  não multiplica por 1.0). Fora do domínio em 1D: cola-se à ponta.
- `B.amostrasEm(onde)` → `[{ nome, indice, em, peso }]`, do maior peso para o menor.
- `B.dimensao()` · `B.total()` · `B.limites()` → `{ x: [min, max], y: [min, max] }`.
- 2D: pesos `1/d²` com **corte suave** nos `vizinhos` (omissão **4**) mais próximos,
  normalizados. Shepard modificado — subtrai-se o peso que o (k+1)-ésimo teria, para
  a amostra que entra no ranking entrar a **zero** em vez de estalar.

`criaRelogio({ fase })` → `R`.

- `R.avanca(dt, hz)` → `R`. `hz` pode mudar todos os frames (é o normal). Tecto de
  1000 ciclos num frame; velocidade negativa faz o ciclo andar para trás.
- `R.fase()` · `R.faseAntes()` (a do frame anterior — é o par que os avisos comem) ·
  `R.voltas()` (acumula, pode ser negativo) · `R.avancoUltimo()` (ciclos andados no
  último `avanca`, pode ser > 1).
- `R.reinicia(novaFase, zeraVoltas)` → `R`. Corte seco. As voltas **não** se zeram
  sozinhas.
- `R.marcaDePasso(offset)` → fase deslocada e dobrada 0..1 (0.5 = a pata contrária).
- `R.erroPara(outro)` → erro pelo caminho mais curto, em (−0.5, 0.5]; positivo = o
  outro vai à frente. Aceita um relógio, um número, ou um objecto com `.fase`.
- `R.sincronizaCom(outro, ajuste)` → a correcção aplicada, em ciclos. Puxa em vez de
  cortar, e desloca o `faseAntes` a par (senão a janela do frame invertia-se e os
  avisos disparavam a dobrar). `ajuste` é **por frame**: 0.15 a 30 Hz fecha meio ciclo
  de erro em 25 frames = **0.83 s**; para ser igual em qualquer framerate,
  `sincronizaCom(outro, ajusteEstavel(0.15, dt))`.
- `R.velocidadeParaHz(vel, metrosPorCiclo, hzMax)` · `R.estado()`.

Soltos: `velocidadeParaHz(...)` (0 m por ciclo → 0, nunca `Infinity`) ·
`ajusteEstavel(ajuste30, dt)` · `dobraFase(f)` (nunca `f % 1` sozinho: −0.2 % 1 =
−0.2) · `suave(u)` (smoothstep).

### `avisos.js` — `module.exports = { criaAvisos }`

`criaAvisos({ marcas, janelas })` → `N`. `marcas: [{ nome, em }]` (instantes 0..1;
nomes repetidos são legítimos — duas patas por ciclo em 0.00 e 0.50).
`janelas: [{ nome, de, ate }]`; `de > ate` atravessa o zero (0.90..0.08),
`de === ate` é janela nula.

- `N.avanca(faseAntes, faseAgora)` → **array de nomes pela ordem da fase**. Forma
  curta `N.avanca(faseAgora)` usa a fase assentada como "antes". Nunca devolve o mesmo
  nome duas vezes no mesmo frame, seja o avanço de 0.1 ou de 7 ciclos. Aceita fase
  cumulativa (conta as voltas inteiras de um frame gordo) ou envolvida 0..1 (onde as
  voltas inteiras são invisíveis, por física).
- Só dispara **para a frente**. Uma marca em cima da fase de partida só volta na
  volta seguinte. Avanço > **0.5** do ciclo que as voltas não expliquem = corte, zero
  disparos. Um `faseAntes` que não seja onde o módulo ficou (tolerância 1e-6) também
  é corte: alguém mexeu na fase por fora.
- `N.dentro(nome[, fase])` → bool. Nome desconhecido = `false` (um golpe nunca conta
  por um nome mal escrito).
- `N.reinicia(novaFase)` → `N`. Assenta sem disparar nada.
- `N.fase()` · `N.estado()` → `{ fase, avanco, corte, janelas }`.

## Receita completa (colável)

Um corpo a andar, a correr, a saltar e a dar uma pancada **sem parar as pernas**. Os
quatro ficheiros juntos. Estados para os regimes (chão / ar / aterragem), blend space
para o contínuo (parado → bound → galope), camadas para quem manda em que região.

```js
// scripts/coelho-anima.js
const { criaMisturador } = require('lib/anim/camadas.js');
const { criaMaquina }    = require('lib/anim/maquina.js');
const { criaMistura, criaRelogio, velocidadeParaHz } = require('lib/anim/mistura.js');
const { criaAvisos }     = require('lib/anim/avisos.js');

const TAU = Math.PI * 2;
const REGIOES = { pernas: ['coxaE', 'coxaD', 'peE', 'peD'], bracoD: ['bracoD'], bracoE: ['bracoE'],
  tronco: ['inclina', 'rolagem', 'alturaY'], orelhas: ['orelhaE', 'orelhaD'], cauda: ['cauda'] };

// AS FORMAS — t = fase 0..1 do ciclo. Graus (alturaY em metros).
const parado = () => ({ coxaE: 4, coxaD: 4, peE: 0, peD: 0, bracoE: 6, bracoD: 6, inclina: 2, rolagem: 0, orelhaE: 3, orelhaD: -3, cauda: 0 });
const bound  = (t) => { const s = Math.sin(t * TAU); return { coxaE: 52 * s, coxaD: 52 * s, peE: -30 * s, peD: -30 * s,
  bracoE: -34 * s, bracoD: -34 * s, inclina: 16 * s, rolagem: 0, orelhaE: 16 * s, orelhaD: 16 * s, cauda: 8 * s }; };
const galope = (t) => { const s = Math.sin(t * TAU), c = Math.cos(t * TAU); return { coxaE: 60 * s, coxaD: -60 * s,
  peE: -38 * c, peD: 38 * c, bracoE: -40 * c, bracoD: 40 * c, inclina: 22, rolagem: 7 * c, orelhaE: 26, orelhaD: 26, cauda: 12 * c }; };
const noAr   = () => ({ coxaE: -26, coxaD: -26, peE: 18, peD: 18, bracoE: -18, bracoD: -18, inclina: -8, rolagem: 0, orelhaE: 22, orelhaD: 22, cauda: -14 });
const aterra = () => ({ coxaE: 30, coxaD: 30, peE: -12, peD: -12, bracoE: 10, bracoD: 10, inclina: 12, rolagem: 0, orelhaE: -6, orelhaD: -6, cauda: 4 });
// A pancada: u = 0..1 do GESTO, não do ciclo. Arma até 0.46, descarrega até ao fim.
const pancada = (u) => { const k = u < 0.46 ? u / 0.46 : 1 - (u - 0.46) / 0.54;
  return { bracoD: -40 + 150 * k, bracoE: -10 + 30 * k, inclina: 6 * k, rolagem: -8 * k }; };

const memoria = {};   // um estado por corpo — dois coelhos não partilham nada

function arranca() {
  const M = criaMisturador({ regioes: REGIOES });
  M.camada('locomocao', { prioridade: 0 });                                    // o chão de tudo
  M.camada('respira', { modo: 'soma', prioridade: 5 });                        // ADITIVO: soma, não apaga
  M.camada('golpe', { modo: 'sobrepoe', prioridade: 10, entrada: 0.06, saida: 0.16,   // a MONTAGEM
    regioes: ['bracoD', 'bracoE', 'tronco'], pesos: { bracoE: 0.7, tronco: 0.45 }, ligada: false });
  const E = criaMaquina({ inicial: 'chao', estados: {
    chao: { minimo: 0.08, transicoes: [] },
    ar: { transicoes: [{ para: 'chao', quando: (c) => c.noChao, em: 0.10 }] },
    aterragem: { minimo: 0.14, transicoes: [{ para: 'chao', em: 0.12 }] },     // sem 'quando' = ao fim do mínimo
  }, qualquer: [
    { para: 'ar', quando: (c) => !c.noChao, em: 0.08, urgente: true },         // o salto não espera por ninguém
    { para: 'aterragem', quando: (c) => c.noChao && c.caiuForte, em: 0.05, urgente: true },
  ] });
  const andamentos = criaMistura({ amostras: [                                  // BLEND SPACE 1D em m/s
    { nome: 'parado', em: 0.0, pose: parado }, { nome: 'bound', em: 5.0, pose: bound },
    { nome: 'galope', em: 11.0, pose: galope } ] });
  const rel = criaRelogio({ fase: 0 });
  const avisos = criaAvisos({
    marcas: [{ nome: 'patasTras', em: 0.00 }, { nome: 'topo', em: 0.35 }, { nome: 'patasFrente', em: 0.62 }],
    janelas: [{ nome: 'impacto', de: 0.42, ate: 0.58 }] });
  return { M: M, E: E, andamentos: andamentos, rel: rel, avisos: avisos, golpeT: null, resp: 0 };
}

export function update(dt, objectApi) {
  const s = objectApi.getState();
  let m = memoria[objectApi.id];
  if (!m) { m = arranca(); memoria[objectApi.id] = m; }

  const vel = s.vel || 0, noChao = s.noChao !== false, caiuForte = s.caiuForte === true;

  m.E.avanca(dt, { vel: vel, noChao: noChao, caiuForte: caiuForte });   // 1) o REGIME
  const hz = velocidadeParaHz(vel, 2.4, 4.0);                          // 2) o CHÃO manda no ciclo
  const faseAntes = m.rel.fase();
  m.rel.avanca(dt, hz);
  const t = m.rel.fase();

  const FORMAS = { chao: function () { return m.andamentos.amostra(vel, t); }, ar: noAr, aterragem: aterra };
  const w = m.E.pesos();                                               // 3) a FORMA, já cruzada
  const pose = {};
  for (const nome in w) { const p = FORMAS[nome](t);
    for (const canal in p) pose[canal] = (pose[canal] === undefined ? 0 : pose[canal]) + p[canal] * w[nome]; }
  m.M.escreve('locomocao', pose);

  m.resp += dt * 1.7;                                                  // 4) o ADITIVO
  m.M.escreve('respira', { inclina: Math.sin(m.resp) * 1.4, alturaY: Math.sin(m.resp) * 0.01 });

  if (s.acao && m.golpeT === null) m.golpeT = 0;                       // 5) a MONTAGEM
  if (m.golpeT !== null) {
    m.golpeT += dt;
    const u = m.golpeT / 0.78;
    m.M.escreve('golpe', pancada(u < 1 ? u : 1));
    m.M.ativa('golpe', u < 1);                                         // as PERNAS nunca souberam disto
    if (m.avisos.dentro('impacto', u) && s.encostou) objectApi.emit('pancada', { id: objectApi.id });
    if (m.golpeT > 0.78 + 0.16) m.golpeT = null;                       // deixa a saída de 0.16 s acabar
  }

  const marcas = m.avisos.avanca(faseAntes, t);                        // 6) os AVISOS do ciclo
  for (let i = 0; i < marcas.length; i++) {
    if (marcas[i] === 'patasTras') objectApi.playSound('/cdn/moodboard-lowpoly-cozy/sfx-paw-thud-grass.mp3', { gain: 0.16 + 0.22 * Math.min(1, vel / 11) });
    if (marcas[i] === 'patasFrente') objectApi.playSound('/cdn/moodboard-lowpoly-cozy/sfx-paw-thud-grass.mp3', { gain: 0.10, pitch: 1.14 });
    if (marcas[i] === 'topo') pose.orelhaE -= 6;                       // a pose é lida no resolve(): isto ainda conta
  }

  if (m.E.atual() === 'aterragem' && m.E.tempoNoEstado() <= dt) {      // 7) as duas fases assentam JUNTAS
    m.rel.reinicia(0); m.avisos.reinicia(0);
  }

  m.M.avanca(dt);
  escreveNasPecas(objectApi, m.M.resolve());                           // 8) o teu escritor de peças
}
```

O que a receita prova, medido com o `camadas.js` e o `maquina.js` reais em 1800 frames
(60 s a 30 Hz, velocidade 0 → 11 → 0, um salto e uma pancada pelo meio):
**a pancada a peso 1 nos braços e as pernas a andar ao mesmo tempo** — `coxaE` a
varrer **119.7°** (de −59.8 a +59.9) nos 22 frames em que a montagem esteve acima de
0.9, `bracoD` levado pelo golpe de −35.3 a **+107.2**, e `inclina` no primeiro frame
forte a dar **12.78** (locomoção 22, montagem 1.11, tronco a acompanhar a 45%).
`|soma(pesos) − 1|` = **0** exacto nos 1800 frames; **0** NaN no dicionário final.

## Armadilhas, com o número

**1 · O tremeliques sem `minimo` (e sem folga nos limiares).**
Velocidade a saltar 6.9 / 7.1 a cada frame durante 10 s, um só limiar a 7.0. Medido
com o `maquina.js` real: **299 mudanças de estado** sem `minimo` (uma por frame) ·
**59** com `minimo: 0.15` (tecto teórico 10 / 0.15 = 66) · **1** com a folga do autor
(entra no galope a 7.0, sai a 6.4). São duas redes diferentes e precisas das duas: o
`minimo` é a rede no **tempo**, a folga dos limiares é a rede no **valor** — e a folga
escreve-se à mão, o ficheiro não a inventa por ti.

**2 · O canal que só existe numa amostra.**
`orelhaYaw: 14 * c` existe no galope e não no bound. Como os pesos somam 1, o canal
sai a `valor × peso_do_galope`: **nasce a zero e cresce**. Medido no varrimento de 0 a
11 m/s: salto máximo **1.5%** da amplitude por passo de 0.01 do eixo normalizado, e a
1% de peso do galope o canal vale **0.25°**, não 26°. Não renormalizes por canal — era
isso que punha o `orelhaYaw` a 100% no primeiro frame em que o galope tinha 1% de peso,
e é exactamente esse estalo que o ficheiro existe para matar. Se queres controlar a
subida, declara o canal em **todas** as amostras (a 0 onde não é usado). E cuidado:
quando o peso é 1 numa amostra que não tem o canal, o canal **não aparece** no
dicionário — para o `camadas.js` é o mesmo que zero, quem não escreve não manda.

**3 · A fase que salta na aterragem.**
Cortas a fase a zero ao aterrar e ouves um baque no ar. Porque: de 0.62 para 0.00 a
distância **para a frente** é 0.38, abaixo do limiar de corte de **0.5** — o
`avisos.js` não tem como distinguir isso de movimento real e dispara a marca
`patasTras` no meio do salto. A 4 Hz (o ritmo mais rápido deste jogo) e 30 Hz um frame
normal são 0.133 do ciclo, por isso 0.5 são ~3.7 frames perdidos: acima disso é corte,
abaixo é engasgo e varre-se. **A cura é uma linha:** ao assentar a fase, chama
`rel.reinicia(0)` **e** `avisos.reinicia(0)` no mesmo frame — o `reinicia` assenta sem
disparar. Cortes maiores que meio ciclo são apanhados de graça; os pequenos, só assim.

**4 · Misturar ângulos absolutos com aditivos.**
As formas do ciclo escrevem **absolutos** (`inclina: 16`); a respiração e o ócio
escrevem **deltas** (`+6`). Trocar o `modo` estraga silenciosamente. Medido, com
locomoção `inclina: 16` e uma segunda camada a escrever `6`:

| segunda camada | resultado |
| --- | --- |
| `modo: 'soma'` (correcto para um delta) | **22** |
| `modo: 'sobrepoe'`, peso 1 | **6** — os 16° desapareceram |
| `modo: 'sobrepoe'`, peso 0.5 | **11** — nem uma coisa nem outra |

E ao contrário: um absoluto declarado `'soma'` soma-se ao ciclo e o corpo dobra-se a
dobrar. Regra: **quem escreve o valor final é `'sobrepoe'`, quem escreve um empurrão é
`'soma'`.** Lembra-te também que `'sobrepoe'` usa `base = 0` quando ninguém escreveu o
canal por baixo — uma camada sozinha a 0.5 num canal vazio dá **metade** do valor, não
o valor.

**5 · Declarar a camada dentro do `update`.**
`M.camada()` volta a pôr o alvo a 1 se não passares `ligada: false`. Redeclarada por
frame, uma camada desligada liga-se sozinha: medido, o peso vai **0 → 0.278 → 0.556 →
0.833 → 1 em 4 frames** (a `entrada` de 0.12 s a 30 Hz). Declara no arranque
(`if (!m.mix) ...`), como a receita faz.

## O que foi medido, e onde

Números deste documento vindos de arneses puros (`run_script`, `persist:false`) contra
os ficheiros reais: as resoluções do `require`, a soma dos pesos, as pernas durante a
pancada, o 119.7° / 12.78, os 299/59/1 do tremeliques, os 22/6/11 do aditivo e os 4
frames da redeclaração. Os números do `mistura.js` (pose exacta em cima da amostra,
1.5% do canal em falta, 25 frames da sincronia, `velocidadeParaHz(9.6, 2.4) === 4`) e
do `avisos.js` (240 disparos por 240 ciclos, máximo 1 por frame) vêm dos arneses dos
próprios ficheiros, registados em `memory/game/animacao.md`.

Ressalva honesta desta casa: a matemática do sandbox de behaviors já provou não bater
bit-a-bit com a do `run_script` (o `Math.pow(sin, 0.55)` com `sin = −1e-16` que deu NaN
dentro de um módulo compilado e 4.11e−9 no `run_script`). Por isso os quatro ficheiros
conferem cada valor antes de o somar — mas se vires um NaN, a primeira pergunta é
sempre a mesma: **que expoente fraccionário caiu sobre um número que o arredondamento
levou abaixo de zero?**