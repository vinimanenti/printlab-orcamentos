"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export type TemplateActionResult = { ok: true } | { error: string };

async function denyIfNotAdmin(): Promise<TemplateActionResult | null> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem editar templates." };
  }
  return null;
}

const templateSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(1, "Nome obrigatório").max(80),
  corpo: z.string().trim().min(1, "Corpo obrigatório").max(2000),
  ativo: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
});

export async function salvarTemplate(
  _prev: TemplateActionResult | undefined,
  formData: FormData,
): Promise<TemplateActionResult> {
  const denied = await denyIfNotAdmin();
  if (denied) return denied;

  const parsed = templateSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    corpo: formData.get("corpo"),
    ativo: formData.get("ativo") ?? false,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { id, nome, corpo, ativo } = parsed.data;

  try {
    await prisma.mensagemTemplate.update({ where: { id }, data: { nome, corpo, ativo } });
    revalidatePath("/configuracoes/templates");
    return { ok: true };
  } catch {
    return { error: "Erro ao salvar template." };
  }
}
