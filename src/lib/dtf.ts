export type CustomerType = "cliente" | "revendedor";

export const ROLL_WIDTH = 30; // cm
const PRICING = {
  cliente:    { base: 250, min10: 400, discount5m: 50 },
  revendedor: { base: 150, min10: 400, discount5m: 50 },
};

export const calcItem = (widthCm: number, heightCm: number, qty: number, type: CustomerType) => {
  if (![widthCm, heightCm, qty].every(Number.isFinite) || widthCm <= 0 || widthCm > ROLL_WIDTH || heightCm <= 0 || !Number.isSafeInteger(qty) || qty <= 0) return null;
  const p = PRICING[type];
  const linearCm = heightCm * qty;
  const linearM = linearCm / 100;

  let pricePerM = p.base;
  let alert = null;

  if (heightCm < 10) {
    pricePerM = p.min10;
    alert = "Altura abaixo de 10cm — tarifa mínima aplicada";
  }

  if (linearM >= 5) {
    pricePerM -= p.discount5m;
    alert = `${alert ? alert + "; " : ""}Desconto volume: −R$${p.discount5m}/m (${linearM.toFixed(1)}m total)`;
  }

  const total = Math.round(linearM * pricePerM * 100) / 100;
  if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER / 100) return null;
  return { linearCm, linearM, pricePerM, total, alert, widthCm, heightCm, qty };
};
