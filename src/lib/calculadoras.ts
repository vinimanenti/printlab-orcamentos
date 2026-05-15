/**
 * Calculadoras de preço da PrintLab.
 *
 * Implementa as três modalidades de cálculo descritas em
 * docs/04-calculadoras.md (referência canônica):
 *
 *   1. calcularPorM2          — adesivos por dimensão (largura × altura × qtd)
 *   2. melhorAproveitamento   — aproveitamento de mídia/bobina (orientação ótima)
 *   3. calcularPorCartela     — folhas/cartelas com N adesivos cada
 *
 * Os exemplos numéricos no fim do arquivo (em comentários) batem com os
 * exemplos da spec. Mantenha-os sincronizados se a fórmula mudar.
 *
 * Convenção de unidades:
 *   - dimensões de adesivo, cartela e bobina em CENTÍMETROS
 *   - áreas em METROS QUADRADOS (m²)
 *   - preços em REAIS por m² (ou fixo, quando aplicável)
 *
 * Toda a aritmética é feita com `number` (float). Em pontos onde o resultado
 * vai para o banco, converter para Prisma.Decimal com `new Decimal(valor)`.
 */

export type CalculoMaterial = {
  id: string;
  precoM2: number;
  /** Largura útil da bobina em cm (ex.: 127 cm = 50") */
  larguraBobinaCm: number;
};

export type CalculoImpressao = {
  id: string;
  precoM2: number;
};

export type CalculoAcabamento = {
  id: string;
  /** Cobrado por m² (laminação, resina) */
  precoM2?: number | null;
  /** Cobrado por unidade (refile, acabamento fixo) */
  precoFixo?: number | null;
};

export type ResultadoCalculo = {
  areaUnitariaM2: number;
  /** Área de bobina consumida (já considera aproveitamento real) */
  areaTotalM2: number;
  /** % do material que vai virar produto útil. 100% = sem perda. */
  aproveitamentoPct: number;
  custoMaterial: number;
  custoImpressao: number;
  custoAcabamento: number;
  custoTotal: number;
  /** Margem efetivamente aplicada (após proteção de mínima) */
  margemPct: number;
  /** Margem solicitada estava abaixo da mínima? */
  margemAbaixoDaMinima: boolean;
  precoUnitario: number;
  precoTotal: number;
};

export type Aproveitamento = {
  /** Quantos itens cabem por fileira na largura da bobina */
  porFileira: number;
  /** Número de fileiras necessárias para atender a quantidade */
  fileirasNecessarias: number;
  /** Comprimento total usado da bobina em cm */
  comprimentoUsadoCm: number;
  /** Área da bobina consumida em m² */
  areaBobinaM2: number;
  /** Área dos itens (sem aproveitamento) em m² */
  areaUtilM2: number;
  /** % de aproveitamento (areaUtil / areaBobina × 100) */
  aproveitamentoPct: number;
  /** A orientação escolhida foi a girada (90°)? */
  rotacionado: boolean;
};

// =============================================================================
// 1. Aproveitamento de bobina (spec §6)
// =============================================================================

function aproveitamentoBruto(
  larguraItem: number,
  alturaItem: number,
  larguraBobina: number,
  quantidade: number,
  rotacionado: boolean,
): Aproveitamento {
  const w = rotacionado ? alturaItem : larguraItem;
  const h = rotacionado ? larguraItem : alturaItem;

  const porFileira = Math.floor(larguraBobina / w);
  if (porFileira === 0 || quantidade <= 0) {
    return {
      porFileira: 0,
      fileirasNecessarias: 0,
      comprimentoUsadoCm: Infinity,
      areaBobinaM2: 0,
      areaUtilM2: 0,
      aproveitamentoPct: 0,
      rotacionado,
    };
  }
  const fileirasNecessarias = Math.ceil(quantidade / porFileira);
  const comprimentoUsadoCm = fileirasNecessarias * h;
  const areaBobinaM2 = (comprimentoUsadoCm * larguraBobina) / 10_000;
  const areaUtilM2 = (larguraItem * alturaItem * quantidade) / 10_000;
  return {
    porFileira,
    fileirasNecessarias,
    comprimentoUsadoCm,
    areaBobinaM2,
    areaUtilM2,
    aproveitamentoPct: areaBobinaM2 > 0 ? (areaUtilM2 / areaBobinaM2) * 100 : 0,
    rotacionado,
  };
}

/**
 * Compara orientação normal vs. girada (90°) e devolve a que usa menos bobina.
 * Para itens quadrados, retorna a normal (escolha estável).
 */
export function melhorAproveitamento(
  larguraItem: number,
  alturaItem: number,
  larguraBobina: number,
  quantidade: number,
): Aproveitamento {
  const normal = aproveitamentoBruto(larguraItem, alturaItem, larguraBobina, quantidade, false);
  const rot = aproveitamentoBruto(larguraItem, alturaItem, larguraBobina, quantidade, true);
  if (rot.comprimentoUsadoCm < normal.comprimentoUsadoCm) return rot;
  return normal;
}

// =============================================================================
// 2. Calculadora por m² (spec §5 — 14 passos)
// =============================================================================

export type InputM2 = {
  larguraCm: number;
  alturaCm: number;
  quantidade: number;
  material: CalculoMaterial;
  impressao: CalculoImpressao;
  acabamento?: CalculoAcabamento | null;
  /** Margem desejada em % (ex.: 50 = 50%) */
  margemPct: number;
  /** Margem mínima protegida em % (vem de ConfiguracaoSistema) */
  margemMinimaPct: number;
};

export function calcularPorM2(i: InputM2): ResultadoCalculo {
  // Passo 1-3: dimensões e quantidade já recebidas.

  // Passo 4: área unitária (cm² → m²)
  const areaUnitariaM2 = (i.larguraCm * i.alturaCm) / 10_000;

  // Passo 5: aproveitamento real na bobina (escolhe melhor orientação)
  const yieldData = melhorAproveitamento(
    i.larguraCm,
    i.alturaCm,
    i.material.larguraBobinaCm,
    i.quantidade,
  );

  // Passo 6: área total de bobina consumida
  const areaTotalM2 = yieldData.areaBobinaM2;

  // Passo 7: custo de material (sobre a bobina consumida)
  const custoMaterial = areaTotalM2 * i.material.precoM2;

  // Passo 8: custo de impressão (sobre a área impressa, não a bobina)
  const areaImpressaM2 = areaUnitariaM2 * i.quantidade;
  const custoImpressao = areaImpressaM2 * i.impressao.precoM2;

  // Passo 9: custo de acabamento
  const custoAcabamento = i.acabamento
    ? (i.acabamento.precoM2 ?? 0) * areaImpressaM2 +
      (i.acabamento.precoFixo ?? 0) * i.quantidade
    : 0;

  // Passo 10: custo total
  const custoTotal = custoMaterial + custoImpressao + custoAcabamento;

  // Passo 11: aplica proteção de margem mínima
  const margemAbaixoDaMinima = i.margemPct < i.margemMinimaPct;
  const margemEfetiva = Math.max(i.margemPct, i.margemMinimaPct);

  // Passo 12: preço total (markup pela margem desejada)
  // precoTotal = custoTotal / (1 - margem/100)
  const divisor = 1 - margemEfetiva / 100;
  const precoTotal = divisor > 0 ? custoTotal / divisor : custoTotal;

  // Passo 13: preço unitário
  const precoUnitario = i.quantidade > 0 ? precoTotal / i.quantidade : 0;

  // Passo 14: retorno completo
  return {
    areaUnitariaM2,
    areaTotalM2,
    aproveitamentoPct: yieldData.aproveitamentoPct,
    custoMaterial,
    custoImpressao,
    custoAcabamento,
    custoTotal,
    margemPct: margemEfetiva,
    margemAbaixoDaMinima,
    precoUnitario,
    precoTotal,
  };
}

// =============================================================================
// 3. Calculadora por cartela (spec §7)
// =============================================================================

export type InputCartela = {
  larguraCartelaCm: number;
  alturaCartelaCm: number;
  quantidadeCartelas: number;
  /** Quantos adesivos por cartela (informativo, não entra no cálculo) */
  adesivosPorCartela: number;
  material: CalculoMaterial;
  impressao: CalculoImpressao;
  acabamento?: CalculoAcabamento | null;
  margemPct: number;
  margemMinimaPct: number;
};

export type ResultadoCartela = ResultadoCalculo & {
  adesivosTotais: number;
  precoPorAdesivo: number;
};

/**
 * Cálculo por cartela. Trata a cartela como o "item" da calculadora por m².
 * O número de adesivos por cartela é apenas informativo para o cliente.
 */
export function calcularPorCartela(i: InputCartela): ResultadoCartela {
  const base = calcularPorM2({
    larguraCm: i.larguraCartelaCm,
    alturaCm: i.alturaCartelaCm,
    quantidade: i.quantidadeCartelas,
    material: i.material,
    impressao: i.impressao,
    acabamento: i.acabamento ?? null,
    margemPct: i.margemPct,
    margemMinimaPct: i.margemMinimaPct,
  });
  const adesivosTotais = i.adesivosPorCartela * i.quantidadeCartelas;
  return {
    ...base,
    adesivosTotais,
    precoPorAdesivo: adesivosTotais > 0 ? base.precoTotal / adesivosTotais : 0,
  };
}

// =============================================================================
// Formatadores auxiliares
// =============================================================================

/** R$ 1.234,56 — usar no UI e no PDF */
export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(v);
}

/** 12,34 m² */
export function formatM2(v: number): string {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
}

/** 98,4 % */
export function formatPct(v: number): string {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

// =============================================================================
// Verificação contra exemplos da spec — referência somente, não executa em runtime
// =============================================================================
//
// Exemplo 1 (spec §5):
//   Adesivo 5×5 cm, 1000 un., mídia 127 cm, vinil R$ 8/m², látex R$ 15/m², margem 50%
//   calcularPorM2({larguraCm:5,alturaCm:5,quantidade:1000,
//     material:{id:'',precoM2:8,larguraBobinaCm:127},
//     impressao:{id:'',precoM2:15},margemPct:50,margemMinimaPct:0})
//   → areaUnitariaM2: 0.0025
//   → areaTotalM2:    2.54  (40 fileiras × 5 cm × 127 cm / 10000)
//   → aproveitamentoPct: 98.43...  (2.5/2.54)
//   → custoMaterial: 20.32  custoImpressao: 37.50  custoTotal: 57.82
//   → precoTotal:    115.64 precoUnitario: 0.11564
//
// Exemplo 2 (spec §6):
//   10×30 cm, 100 un., bobina 127 cm
//   melhorAproveitamento(10,30,127,100)
//   normal:        12/fileira × 9 fileiras × 30cm = 270cm, área 3.429m², util 0.30m²
//   rotacionado:   4/fileira × 25 fileiras × 10cm = 250cm, área 3.175m², util 0.30m²
//   → vencedor: rotacionado (250 < 270)
//
// Exemplo 3 (spec §7):
//   Cartela A4 (21×29.7cm), 12 adesivos × 50 cartelas, vinil R$8, látex R$15, margem 50%
//   → areaUnitariaM2: 0.06237  areaImpressa: 3.1185m²
//   → 6 cartelas/fileira, 9 fileiras, comprimento 267.3cm, áreaBobina 3.395m²
//   → custoTotal: ~73.96  precoTotal: ~147.92  precoPorCartela: ~2.96  adesivosTotais: 600
