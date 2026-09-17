import Decimal from "decimal.js";

export type CustomerType = "cliente" | "revendedor";
export type DtfItemInput = { widthCm: number; heightCm: number; qty: number };

export const ROLL_WIDTH = 30; // cm
export const STICKER_GAP_CM = 2;
const PRICING = {
  cliente:    { base: 250, min10: 400, discount5m: 50 },
  revendedor: { base: 150, min10: 400, discount5m: 50 },
};

function measureItem({ widthCm, heightCm, qty }: DtfItemInput, hasPreviousItem: boolean) {
  if (![widthCm, heightCm, qty].every(Number.isFinite) || widthCm <= 0 || widthCm > ROLL_WIDTH || heightCm <= 0 || !Number.isSafeInteger(qty) || qty <= 0) return null;
  // O espaço entre grupos pertence ao próximo item; não há espaço após o último adesivo.
  const gapCount = qty - 1 + (hasPreviousItem ? 1 : 0);
  const gapCm = gapCount * STICKER_GAP_CM;
  const length = new Decimal(heightCm).times(qty).plus(gapCm);
  const linearCm = length.toNumber();
  const linearM = length.div(100).toNumber();
  if (!Number.isFinite(linearCm) || !Number.isFinite(linearM)) return null;
  return { widthCm, heightCm, qty, gapCm, linearCm, linearM };
}

function priceItem(item: NonNullable<ReturnType<typeof measureItem>>, orderLinearCm: number, type: CustomerType) {
  const p = PRICING[type];
  let pricePerM = p.base;
  let alert = null;

  if (orderLinearCm < 10) {
    pricePerM = p.min10;
    alert = "Orçamento abaixo de 10 cm lineares no total — tarifa mínima aplicada";
  }

  if (item.linearM >= 5) {
    pricePerM -= p.discount5m;
    alert = `Desconto volume: −R$${p.discount5m}/m (${item.linearM.toFixed(2)}m no item)`;
  }

  const total = new Decimal(item.linearM).times(pricePerM).toDecimalPlaces(2).toNumber();
  if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER / 100) return null;
  return { ...item, pricePerM, total, alert };
}

export function calcItems(items: DtfItemInput[], type: CustomerType) {
  let hasPreviousItem = false;
  const measured = items.map((input) => {
    const item = measureItem(input, hasPreviousItem);
    // Itens incompletos ou fora dos limites não alteram a metragem dos demais.
    if (!item || !priceItem(item, item.linearCm, type)) return null;
    hasPreviousItem = true;
    return item;
  });
  const orderLinearCm = measured.reduce(
    (sum, item) => sum.plus(item?.linearCm ?? 0),
    new Decimal(0),
  ).toNumber();

  return measured.map((item) => item ? priceItem(item, orderLinearCm, type) : null);
}

export const calcItem = (widthCm: number, heightCm: number, qty: number, type: CustomerType) => {
  return calcItems([{ widthCm, heightCm, qty }], type)[0];
};
