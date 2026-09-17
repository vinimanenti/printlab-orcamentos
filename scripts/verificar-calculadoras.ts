/**
 * Verifica que as calculadoras produzem os valores esperados na spec.
 * Rode com: npx tsx scripts/verificar-calculadoras.ts
 */
import {
  calcularPorM2,
  calcularPorCartela,
  melhorAproveitamento,
} from "../src/lib/calculadoras";
import { calcItem, calcItems, type CustomerType } from "../src/lib/dtf";
import { dtfPricingSchema } from "../src/lib/dtf-config";

let failures = 0;
function check(label: string, actual: number, expected: number, tol = 0.01) {
  const ok = Math.abs(actual - expected) <= tol;
  const status = ok ? "PASS" : "FAIL";
  if (!ok) failures++;
  const round = (n: number) => Math.round(n * 10000) / 10000;
  console.log(
    `[${status}] ${label}  esperado=${round(expected)}  obtido=${round(actual)}`,
  );
}

console.log("\n=== Exemplo 1 (spec §5): Adesivo 5x5cm, 1000 un., bobina 127cm ===");
const r1 = calcularPorM2({
  larguraCm: 5,
  alturaCm: 5,
  quantidade: 1000,
  material: { id: "vinil", precoM2: 8, larguraBobinaCm: 127 },
  impressao: { id: "latex", precoM2: 15 },
  margemPct: 50,
  margemMinimaPct: 0,
});
check("areaUnitariaM2", r1.areaUnitariaM2, 0.0025);
check("areaTotalM2 (bobina consumida)", r1.areaTotalM2, 2.54);
check("aproveitamentoPct", r1.aproveitamentoPct, 98.43, 0.1);
check("custoMaterial", r1.custoMaterial, 20.32);
check("custoImpressao", r1.custoImpressao, 37.5);
check("custoTotal", r1.custoTotal, 57.82);
check("precoTotal (50% margem)", r1.precoTotal, 115.64);
check("precoUnitario", r1.precoUnitario, 0.11564, 0.0001);

console.log("\n=== Exemplo 2 (spec §6): 10x30cm, 100 un., bobina 127cm ===");
const apr = melhorAproveitamento(10, 30, 127, 100);
check("rotacionado?", apr.rotacionado ? 1 : 0, 1);
check("comprimentoUsadoCm (rotacionado)", apr.comprimentoUsadoCm, 250);
check("porFileira (rotacionado, 30cm na largura)", apr.porFileira, 4);
check("fileirasNecessarias (rotacionado)", apr.fileirasNecessarias, 25);

console.log("\n=== Exemplo 3 (spec §7): Cartela A4 21x29.7, 12 ades/cartela, 50 cartelas ===");
const r3 = calcularPorCartela({
  larguraCartelaCm: 21,
  alturaCartelaCm: 29.7,
  quantidadeCartelas: 50,
  adesivosPorCartela: 12,
  material: { id: "vinil", precoM2: 8, larguraBobinaCm: 127 },
  impressao: { id: "latex", precoM2: 15 },
  margemPct: 50,
  margemMinimaPct: 0,
});
check("adesivosTotais", r3.adesivosTotais, 600);
check("areaUnitariaM2", r3.areaUnitariaM2, 0.06237, 0.001);
check("custoTotal", r3.custoTotal, 73.96, 0.5);
check("precoTotal", r3.precoTotal, 147.92, 1);
check("precoPorAdesivo", r3.precoPorAdesivo, 0.2465, 0.01);

console.log("\n=== Margem mínima protegida ===");
const r4 = calcularPorM2({
  larguraCm: 10,
  alturaCm: 10,
  quantidade: 1,
  material: { id: "m", precoM2: 10, larguraBobinaCm: 100 },
  impressao: { id: "i", precoM2: 0 },
  margemPct: 10, // pediu 10%
  margemMinimaPct: 30, // mas mínima é 30%
});
check("margem efetiva = 30%", r4.margemPct, 30);
check("flag margemAbaixoDaMinima", r4.margemAbaixoDaMinima ? 1 : 0, 1);

console.log("\n=== DTF: tarifas, limites e arredondamento ===");
const dtfCases: {
  label: string;
  width: number;
  height: number;
  qty: number;
  type: CustomerType;
  meters: number;
  rate: number;
  total: number;
}[] = [
  { label: "Cliente, tarifa base em 10 cm", width: 30, height: 10, qty: 1, type: "cliente", meters: 0.1, rate: 150, total: 15 },
  { label: "Revendedor, tarifa base", width: 30, height: 10, qty: 1, type: "revendedor", meters: 0.1, rate: 100, total: 10 },
  { label: "Cliente abaixo de 10 cm", width: 5, height: 9.9, qty: 1, type: "cliente", meters: 0.099, rate: 200, total: 19.8 },
  { label: "Revendedor abaixo de 10 cm", width: 5, height: 5, qty: 1, type: "revendedor", meters: 0.05, rate: 200, total: 10 },
  { label: "Cliente abaixo de 5 m", width: 30, height: 499.9, qty: 1, type: "cliente", meters: 4.999, rate: 150, total: 749.85 },
  { label: "Cliente com exatamente 5 m incluindo espaços", width: 30, height: 48.2, qty: 10, type: "cliente", meters: 5, rate: 150, total: 750 },
  { label: "Revendedor com exatamente 5 m incluindo espaços", width: 30, height: 48.2, qty: 10, type: "revendedor", meters: 5, rate: 100, total: 500 },
  { label: "Abaixo de 5 m incluindo espaços", width: 30, height: 48.19, qty: 10, type: "cliente", meters: 4.999, rate: 150, total: 749.85 },
  { label: "Adesivos de 5 cm somam mais de 10 cm, cliente", width: 5, height: 5, qty: 100, type: "cliente", meters: 6.98, rate: 150, total: 1047 },
  { label: "Adesivos de 5 cm somam mais de 10 cm, revendedor", width: 5, height: 5, qty: 100, type: "revendedor", meters: 6.98, rate: 100, total: 698 },
  { label: "Acima de 5 m", width: 30, height: 60, qty: 10, type: "cliente", meters: 6.18, rate: 150, total: 927 },
  { label: "Largura menor sem encaixe lateral", width: 1, height: 50, qty: 10, type: "cliente", meters: 5.18, rate: 150, total: 777 },
  { label: "Medida decimal", width: 21, height: 29.7, qty: 3, type: "cliente", meters: 0.931, rate: 150, total: 139.65 },
  { label: "Arredondamento para centavos", width: 20, height: 10.01, qty: 1, type: "cliente", meters: 0.1001, rate: 150, total: 15.02 },
  { label: "3 adesivos de 4 cm consomem 16 cm, cliente", width: 5, height: 4, qty: 3, type: "cliente", meters: 0.16, rate: 150, total: 24 },
  { label: "3 adesivos de 4 cm consomem 16 cm, revendedor", width: 5, height: 4, qty: 3, type: "revendedor", meters: 0.16, rate: 100, total: 16 },
  { label: "2 adesivos de 4 cm atingem exatamente 10 cm", width: 5, height: 4, qty: 2, type: "cliente", meters: 0.1, rate: 150, total: 15 },
  { label: "Quantidade e espaços ainda abaixo de 10 cm", width: 5, height: 3.9, qty: 2, type: "cliente", meters: 0.098, rate: 200, total: 19.6 },
];
for (const scenario of dtfCases) {
  const result = calcItem(scenario.width, scenario.height, scenario.qty, scenario.type);
  check(`${scenario.label}: metragem`, result?.linearM ?? NaN, scenario.meters, 1e-9);
  check(`${scenario.label}: tarifa`, result?.pricePerM ?? NaN, scenario.rate, 0);
  check(`${scenario.label}: total`, result?.total ?? NaN, scenario.total, 1e-9);
}

console.log("\n=== DTF: mínimo pela soma de todos os itens e espaços ===");
const smallItems = [{ widthCm: 5, heightCm: 4, qty: 1 }, { widthCm: 5, heightCm: 4, qty: 1 }];
for (const type of ["cliente", "revendedor"] as const) {
  const [first, second] = calcItems(smallItems, type);
  check(`${type}: um único espaço entre dois itens`, (first?.gapCm ?? NaN) + (second?.gapCm ?? NaN), 2, 0);
  check(`${type}: metragem total de dois itens atinge 10 cm`, (first?.linearCm ?? NaN) + (second?.linearCm ?? NaN), 10, 0);
  check(`${type}: primeiro item usa tarifa normal`, first?.pricePerM ?? NaN, type === "cliente" ? 150 : 100, 0);
  check(`${type}: segundo item usa tarifa normal`, second?.pricePerM ?? NaN, type === "cliente" ? 150 : 100, 0);
  check(`${type}: total do orçamento`, (first?.total ?? NaN) + (second?.total ?? NaN), type === "cliente" ? 15 : 10, 0);
}
const belowMinimum = calcItems([{ widthCm: 5, heightCm: 3, qty: 1 }, { widthCm: 5, heightCm: 3, qty: 1 }], "cliente");
check("Soma de 8 cm mantém tarifa mínima em todos os itens", belowMinimum.every(item => item?.pricePerM === 200) ? 1 : 0, 1, 0);
check("Soma de 8 cm custa R$16", belowMinimum.reduce((sum, item) => sum + (item?.total ?? NaN), 0), 16, 0);
const mixedItems = calcItems([{ widthCm: 5, heightCm: 4, qty: 2 }, { widthCm: 10, heightCm: 6, qty: 3 }], "cliente");
check("5 adesivos em dois itens têm 4 espaços", mixedItems.reduce((sum, item) => sum + (item?.gapCm ?? NaN), 0), 8, 0);
check("Medidas diferentes somam 34 cm com espaços", mixedItems.reduce((sum, item) => sum + (item?.linearCm ?? NaN), 0), 34, 0);
check("Orçamento misto totaliza R$51", mixedItems.reduce((sum, item) => sum + (item?.total ?? NaN), 0), 51, 0);
check("Um único adesivo não recebe espaço adicional", calcItem(5, 4, 1, "cliente")?.gapCm ?? NaN, 0, 0);
check("Remover um item reaplica a tarifa mínima", calcItems(smallItems.slice(0, 1), "cliente")[0]?.pricePerM ?? NaN, 200, 0);
const incompleteItems = calcItems([smallItems[0], { widthCm: 0, heightCm: 500, qty: 1 }, smallItems[1]], "cliente");
check("Item inválido não é calculado", incompleteItems[1] === null ? 1 : 0, 1, 0);
check("Item inválido não acrescenta espaço nem metragem", incompleteItems.reduce((sum, item) => sum + (item?.linearCm ?? 0), 0), 10, 0);
check("Orçamento vazio não gera resultados", calcItems([], "cliente").length, 0, 0);

console.log("\n=== DTF: sem desconto por volume ===");
const [dtfItemA, dtfItemB] = calcItems([{ widthCm: 30, heightCm: 100, qty: 3 }, { widthCm: 20, heightCm: 100, qty: 2 }], "cliente");
check("Dois itens somam 5,08 m com quatro espaços", (dtfItemA?.linearM ?? NaN) + (dtfItemB?.linearM ?? NaN), 5.08, 1e-9);
check("Orçamento acima de 5 m mantém a tarifa base", (dtfItemA?.total ?? NaN) + (dtfItemB?.total ?? NaN), 762, 0);

console.log("\n=== DTF: preços configuráveis ===");
const customPricing = dtfPricingSchema.parse({ cliente: "175,50", revendedor: "120.25", abaixo10Cm: "230" });
check("Configuração aceita centavos com vírgula", customPricing.cliente, 175.5, 0);
check("Configuração aceita centavos com ponto", customPricing.revendedor, 120.25, 0);
for (const type of ["cliente", "revendedor"] as const) {
  check(`${type}: usa preço configurado em 1 m`, calcItem(30, 100, 1, type, customPricing)?.total ?? NaN, type === "cliente" ? 175.5 : 120.25, 0);
  check(`${type}: mínimo configurado abaixo de 10 cm`, calcItem(5, 5, 1, type, customPricing)?.total ?? NaN, 11.5, 0);
  check(`${type}: preço configurado sem desconto em 10 m`, calcItem(30, 1000, 1, type, customPricing)?.total ?? NaN, type === "cliente" ? 1755 : 1202.5, 0);
  const configuredItems = calcItems(smallItems, type, customPricing);
  check(`${type}: itens pequenos somados usam tarifa configurada normal`, configuredItems.every(item => item?.pricePerM === customPricing[type]) ? 1 : 0, 1, 0);
}
for (const invalidPrice of ["", " ", "0", "-1", "150,123", "1.234,56", "Infinity", "NaN", "1000000", null]) {
  for (const field of ["cliente", "revendedor", "abaixo10Cm"] as const) {
    const parsed = dtfPricingSchema.safeParse({ cliente: "150", revendedor: "100", abaixo10Cm: "200", [field]: invalidPrice });
    check(`${field}: rejeita preço inválido ${String(invalidPrice)}`, parsed.success ? 1 : 0, 0, 0);
  }
}

console.log("\n=== DTF: entradas inválidas ===");
const invalidDtfCases: [string, number, number, number][] = [
  ["Largura zero", 0, 10, 1],
  ["Largura negativa", -1, 10, 1],
  ["Largura acima do rolo", 30.1, 10, 1],
  ["Largura não numérica", NaN, 10, 1],
  ["Largura infinita", Infinity, 10, 1],
  ["Altura zero", 10, 0, 1],
  ["Altura negativa", 10, -1, 1],
  ["Altura não numérica", 10, NaN, 1],
  ["Altura infinita", 10, Infinity, 1],
  ["Quantidade zero", 10, 10, 0],
  ["Quantidade negativa", 10, 10, -1],
  ["Quantidade fracionada", 10, 10, 1.5],
  ["Quantidade não numérica", 10, 10, NaN],
  ["Quantidade infinita", 10, 10, Infinity],
  ["Quantidade fora da precisão segura", 10, 10, Number.MAX_SAFE_INTEGER + 1],
  ["Estouro da metragem", 10, Number.MAX_VALUE, 2],
  ["Total fora da precisão segura", 10, 1e15, 1],
];
for (const [label, width, height, qty] of invalidDtfCases) {
  check(label, calcItem(width, height, qty, "cliente") === null ? 1 : 0, 1, 0);
}

console.log(`\n${failures === 0 ? "✓ Tudo OK" : "✗ " + failures + " falhas"}\n`);
process.exit(failures === 0 ? 0 : 1);
