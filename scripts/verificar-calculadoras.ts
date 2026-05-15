/**
 * Verifica que as calculadoras produzem os valores esperados na spec.
 * Rode com: npx tsx scripts/verificar-calculadoras.ts
 */
import {
  calcularPorM2,
  calcularPorCartela,
  melhorAproveitamento,
} from "../src/lib/calculadoras";

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

console.log(`\n${failures === 0 ? "✓ Tudo OK" : "✗ " + failures + " falhas"}\n`);
process.exit(failures === 0 ? 0 : 1);
