# Calculadoras

Todas usam `Decimal.js` via Prisma para precisão monetária. Funções abaixo em TS tipado; em produção retornam `Prisma.Decimal`.

## Tipos comuns

```typescript
type CalculoMaterial = {
  id: string;
  precoM2: number;
  larguraBobinaCm: number;
};

type CalculoImpressao = { id: string; precoM2: number };
type CalculoAcabamento = { id: string; precoM2?: number; precoFixo?: number };

type ResultadoCalculo = {
  areaUnitariaM2: number;
  areaTotalM2: number;
  aproveitamentoPct: number;     // % de uso útil da bobina
  custoMaterial: number;
  custoImpressao: number;
  custoAcabamento: number;
  custoTotal: number;
  margemPct: number;
  precoUnitario: number;
  precoTotal: number;
};
```

## 1. Calculadora por m² (spec §5 — 14 passos)

```typescript
type InputM2 = {
  larguraCm: number;          // 1
  alturaCm: number;           // 2
  quantidade: number;         // 3
  material: CalculoMaterial;  // 4
  impressao: CalculoImpressao;// 5
  acabamento?: CalculoAcabamento; // 6
  margemPct: number;          // 13 (margem desejada)
  margemMinimaPct: number;    // proteção
};

function calcularPorM2(i: InputM2): ResultadoCalculo {
  // Passo 1-3: dimensões já recebidas
  // Passo 4: área unitária (cm² → m²)
  const areaUnitariaM2 = (i.larguraCm * i.alturaCm) / 10000;

  // Passo 5: cálculo de aproveitamento na bobina
  const yield_ = melhorAproveitamento(i.larguraCm, i.alturaCm, i.material.larguraBobinaCm, i.quantidade);

  // Passo 6: área total considerando aproveitamento real
  const areaTotalM2 = (yield_.comprimentoUsadoCm * i.material.larguraBobinaCm) / 10000;

  // Passo 7: custo de material
  const custoMaterial = areaTotalM2 * i.material.precoM2;

  // Passo 8: custo de impressão (sobre área impressa real = unitária * qtd)
  const areaImpressaM2 = areaUnitariaM2 * i.quantidade;
  const custoImpressao = areaImpressaM2 * i.impressao.precoM2;

  // Passo 9: custo de acabamento
  const custoAcabamento = i.acabamento
    ? (i.acabamento.precoM2 ?? 0) * areaImpressaM2 + (i.acabamento.precoFixo ?? 0) * i.quantidade
    : 0;

  // Passo 10: custo total
  const custoTotal = custoMaterial + custoImpressao + custoAcabamento;

  // Passo 11: margem aplicada (proteção de margem mínima)
  const margemEfetiva = Math.max(i.margemPct, i.margemMinimaPct);

  // Passo 12: preço total
  const precoTotal = custoTotal / (1 - margemEfetiva / 100);

  // Passo 13: preço unitário
  const precoUnitario = precoTotal / i.quantidade;

  // Passo 14: retorna resultado completo
  return {
    areaUnitariaM2,
    areaTotalM2,
    aproveitamentoPct: yield_.aproveitamentoPct,
    custoMaterial,
    custoImpressao,
    custoAcabamento,
    custoTotal,
    margemPct: margemEfetiva,
    precoUnitario,
    precoTotal,
  };
}
```

### Exemplo numérico — Adesivo 5×5 cm, 1000 un., mídia 127 cm

Material vinil R$ 8,00/m², impressão Látex R$ 15,00/m², sem acabamento, margem 50%.

- Área unitária: 5×5/10000 = **0,0025 m²**
- Área impressa total: 0,0025 × 1000 = **2,5 m²**
- Aproveitamento por linha (5cm na largura): floor(127/5) = **25 por fileira**
- Fileiras necessárias: ceil(1000/25) = **40 fileiras**
- Comprimento usado: 40 × 5 = **200 cm = 2,0 m**
- Área da bobina consumida: 2,0 × 1,27 = **2,54 m²**
- Aproveitamento: 2,5/2,54 = **98,4%**
- Custo material: 2,54 × 8 = R$ **20,32**
- Custo impressão: 2,5 × 15 = R$ **37,50**
- Custo total: **R$ 57,82**
- Preço total (margem 50%): 57,82/(1-0,5) = **R$ 115,64**
- Preço unitário: **R$ 0,12** (1000 un.)

## 2. Calculadora de aproveitamento (spec §6)

```typescript
type Aproveitamento = {
  porFileira: number;
  fileirasNecessarias: number;
  comprimentoUsadoCm: number;
  areaBobinaM2: number;
  areaUtilM2: number;
  aproveitamentoPct: number;
  rotacionado: boolean;
};

function aproveitamento(
  larguraItem: number,
  alturaItem: number,
  larguraBobina: number,
  quantidade: number,
  rotacionado: boolean
): Aproveitamento {
  const w = rotacionado ? alturaItem : larguraItem;
  const h = rotacionado ? larguraItem : alturaItem;

  const porFileira = Math.floor(larguraBobina / w);
  if (porFileira === 0) {
    return { porFileira: 0, fileirasNecessarias: Infinity, comprimentoUsadoCm: Infinity,
             areaBobinaM2: 0, areaUtilM2: 0, aproveitamentoPct: 0, rotacionado };
  }
  const fileiras = Math.ceil(quantidade / porFileira);
  const comprimento = fileiras * h;
  const areaBobina = (comprimento * larguraBobina) / 10000;
  const areaUtil = (larguraItem * alturaItem * quantidade) / 10000;
  return {
    porFileira,
    fileirasNecessarias: fileiras,
    comprimentoUsadoCm: comprimento,
    areaBobinaM2: areaBobina,
    areaUtilM2: areaUtil,
    aproveitamentoPct: (areaUtil / areaBobina) * 100,
    rotacionado,
  };
}

function melhorAproveitamento(
  larguraItem: number,
  alturaItem: number,
  larguraBobina: number,
  quantidade: number
): Aproveitamento {
  const normal = aproveitamento(larguraItem, alturaItem, larguraBobina, quantidade, false);
  const rot = aproveitamento(larguraItem, alturaItem, larguraBobina, quantidade, true);
  // Escolhe o que usa menor comprimento de bobina
  return rot.comprimentoUsadoCm < normal.comprimentoUsadoCm ? rot : normal;
}
```

### Exemplo — 5×5 cm × 1000 un. em bobina 127 cm

- Normal: 25/fileira × 40 fileiras × 5 cm = 200 cm, área 2,54 m², aprov. 98,4%
- Rotacionado: idêntico (item quadrado).
- Retorna a versão normal.

### Exemplo — 10×30 cm × 100 un. em bobina 127 cm

- Normal (10 na largura): floor(127/10)=12 por fileira; ceil(100/12)=9 fileiras × 30 cm = 270 cm. Área 270×127/10000 = 3,429 m². Área útil 0,30 m². Aprov. 8,7% (péssimo).
- Rotacionado (30 na largura): floor(127/30)=4 por fileira; ceil(100/4)=25 fileiras × 10 cm = 250 cm. Área 3,175 m². Aprov. 9,4%.
- Vencedor: rotacionado.

## 3. Calculadora por cartela (spec §7)

Cartela = uma "folha" com múltiplos adesivos. Cálculo idêntico ao m², mas a unidade vendida é a cartela.

```typescript
type InputCartela = {
  larguraCartelaCm: number;
  alturaCartelaCm: number;
  quantidadeCartelas: number;
  adesivosPorCartela: number;  // informativo
  material: CalculoMaterial;
  impressao: CalculoImpressao;
  acabamento?: CalculoAcabamento;
  margemPct: number;
  margemMinimaPct: number;
};

function calcularPorCartela(i: InputCartela): ResultadoCalculo & { adesivosTotais: number } {
  const base = calcularPorM2({
    larguraCm: i.larguraCartelaCm,
    alturaCm: i.alturaCartelaCm,
    quantidade: i.quantidadeCartelas,
    material: i.material,
    impressao: i.impressao,
    acabamento: i.acabamento,
    margemPct: i.margemPct,
    margemMinimaPct: i.margemMinimaPct,
  });
  return { ...base, adesivosTotais: i.adesivosPorCartela * i.quantidadeCartelas };
}
```

### Exemplo — Cartela A4 (21×29,7 cm) com 12 adesivos × 50 cartelas, vinil em bobina 127 cm

- Área unitária: 0,0624 m². Área impressa total: 50 × 0,0624 = **3,12 m²**.
- Por fileira (21 cm): floor(127/21)=6; ceil(50/6)=9 fileiras × 29,7 = **267,3 cm**.
- Área bobina: 2,673 × 1,27 = **3,395 m²**. Aprov.: **91,9%**.
- Custo material: 3,395×8 = **R$ 27,16**. Impressão: 3,12×15 = **R$ 46,80**. Total: **R$ 73,96**.
- Preço total (margem 50%): **R$ 147,92**. Por cartela: **R$ 2,96**. Adesivos totais: **600**.