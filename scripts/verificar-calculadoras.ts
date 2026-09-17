/**
 * Verifica que as calculadoras produzem os valores esperados na spec.
 * Rode com: npx tsx scripts/verificar-calculadoras.ts
 */
import {
  calcularPorM2,
  calcularPorCartela,
  melhorAproveitamento,
} from "../src/lib/calculadoras";
import { calcItem, type CustomerType } from "../src/lib/dtf";

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
  { label: "Cliente, tarifa base em 10 cm", width: 30, height: 10, qty: 1, type: "cliente", meters: 0.1, rate: 250, total: 25 },
  { label: "Revendedor, tarifa base", width: 30, height: 10, qty: 1, type: "revendedor", meters: 0.1, rate: 150, total: 15 },
  { label: "Cliente abaixo de 10 cm", width: 5, height: 9.9, qty: 1, type: "cliente", meters: 0.099, rate: 400, total: 39.6 },
  { label: "Revendedor abaixo de 10 cm", width: 5, height: 5, qty: 1, type: "revendedor", meters: 0.05, rate: 400, total: 20 },
  { label: "Cliente abaixo de 5 m", width: 30, height: 499.9, qty: 1, type: "cliente", meters: 4.999, rate: 250, total: 1249.75 },
  { label: "Cliente com exatamente 5 m", width: 30, height: 50, qty: 10, type: "cliente", meters: 5, rate: 200, total: 1000 },
  { label: "Revendedor com exatamente 5 m", width: 30, height: 50, qty: 10, type: "revendedor", meters: 5, rate: 100, total: 500 },
  { label: "Cliente, tarifa mínima com desconto", width: 5, height: 5, qty: 100, type: "cliente", meters: 5, rate: 350, total: 1750 },
  { label: "Revendedor, tarifa mínima com desconto", width: 5, height: 5, qty: 100, type: "revendedor", meters: 5, rate: 350, total: 1750 },
  { label: "Acima de 5 m", width: 30, height: 60, qty: 10, type: "cliente", meters: 6, rate: 200, total: 1200 },
  { label: "Largura menor sem encaixe lateral", width: 1, height: 50, qty: 10, type: "cliente", meters: 5, rate: 200, total: 1000 },
  { label: "Medida decimal", width: 21, height: 29.7, qty: 3, type: "cliente", meters: 0.891, rate: 250, total: 222.75 },
  { label: "Arredondamento para centavos", width: 20, height: 10.01, qty: 1, type: "cliente", meters: 0.1001, rate: 250, total: 25.03 },
];
for (const scenario of dtfCases) {
  const result = calcItem(scenario.width, scenario.height, scenario.qty, scenario.type);
  check(`${scenario.label}: metragem`, result?.linearM ?? NaN, scenario.meters, 1e-9);
  check(`${scenario.label}: tarifa`, result?.pricePerM ?? NaN, scenario.rate, 0);
  check(`${scenario.label}: total`, result?.total ?? NaN, scenario.total, 1e-9);
}

console.log("\n=== DTF: vários itens e desconto individual ===");
const dtfItemA = calcItem(30, 100, 3, "cliente");
const dtfItemB = calcItem(20, 100, 2, "cliente");
check("Dois itens somam 5 m", (dtfItemA?.linearM ?? NaN) + (dtfItemB?.linearM ?? NaN), 5, 0);
check("Volume não é somado entre itens para desconto", (dtfItemA?.total ?? NaN) + (dtfItemB?.total ?? NaN), 1250, 0);

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
