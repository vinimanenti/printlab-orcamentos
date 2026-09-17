"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { dtfPricingSchema } from "@/lib/dtf-config";

export type DtfActionResult = { ok: true } | { error: string };

export async function salvarPrecosDtf(
  _prev: DtfActionResult | undefined,
  formData: FormData,
): Promise<DtfActionResult> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem alterar os preços DTF." };
  }

  const parsed = dtfPricingSchema.safeParse({
    cliente: formData.get("cliente"),
    revendedor: formData.get("revendedor"),
    abaixo10Cm: formData.get("abaixo10Cm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Preços inválidos." };
  }

  const data = {
    dtfClienteMetro: new Prisma.Decimal(parsed.data.cliente),
    dtfRevendedorMetro: new Prisma.Decimal(parsed.data.revendedor),
    dtfAbaixo10CmMetro: new Prisma.Decimal(parsed.data.abaixo10Cm),
  };
  try {
    await prisma.configuracaoSistema.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", empresaNome: "PrintLab", empresaTelefone: "", ...data },
    });
  } catch {
    return { error: "Não foi possível salvar os preços. Tente novamente." };
  }

  revalidatePath("/configuracoes/dtf");
  revalidatePath("/calculadora");
  return { ok: true };
}
