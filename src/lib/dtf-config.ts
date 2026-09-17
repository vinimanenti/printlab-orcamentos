import { z } from "zod";

const preco = z.string()
  .trim()
  .regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um preço com até duas casas decimais.")
  .transform((value) => Number(value.replace(",", ".")))
  .pipe(z.number().min(0.01, "O preço deve ser maior que zero.").max(999999.99, "O preço máximo é R$ 999.999,99."));

export const dtfPricingSchema = z.object({
  cliente: preco,
  revendedor: preco,
  abaixo10Cm: preco,
});
