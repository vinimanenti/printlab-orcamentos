"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

/**
 * Server Actions para manter o catálogo de preços.
 *
 * Regra (spec §27): apenas administradores podem alterar tabela de preços.
 * Todas as actions verificam isso. Após gravação, revalida as páginas que
 * dependem do catálogo (configurações + calculadora).
 */

export type ActionResult = { ok: true } | { error: string };

/**
 * Verifica que o usuário é ADM. Retorna `null` se for, ou um ActionResult de
 * erro pronto pra retornar pela action. Padrão "early-return" — quando a
 * resposta é não-nula, sai imediatamente da action.
 */
async function adminErrorOrNull(): Promise<ActionResult | null> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem editar o catálogo." };
  }
  return null;
}

function revalidateCatalogo() {
  revalidatePath("/calculadora");
  revalidatePath("/configuracoes/materiais");
  revalidatePath("/configuracoes/impressoes");
  revalidatePath("/configuracoes/acabamentos");
}

// ============ MATERIAL ============

const materialSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Nome obrigatório").max(80),
  precoM2: z.coerce.number().nonnegative("Preço inválido"),
  larguraBobinaCm: z.coerce.number().positive("Largura deve ser > 0"),
  estoqueMinimoM2: z.coerce.number().nonnegative().default(0),
  ativo: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
});

export async function salvarMaterial(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const denied = await adminErrorOrNull();
  if (denied) return denied;

  const parsed = materialSchema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    precoM2: formData.get("precoM2"),
    larguraBobinaCm: formData.get("larguraBobinaCm"),
    estoqueMinimoM2: formData.get("estoqueMinimoM2") ?? 0,
    ativo: formData.get("ativo") ?? false,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.material.update({ where: { id }, data });
    } else {
      await prisma.material.create({ data });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { error: "Já existe um material com este nome." };
    }
    return { error: "Erro ao salvar." };
  }
  revalidateCatalogo();
  return { ok: true };
}

// ============ TIPO IMPRESSAO ============

const impressaoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1).max(60),
  precoM2: z.coerce.number().nonnegative(),
  ativo: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
});

export async function salvarImpressao(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const denied = await adminErrorOrNull();
  if (denied) return denied;

  const parsed = impressaoSchema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    precoM2: formData.get("precoM2"),
    ativo: formData.get("ativo") ?? false,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.tipoImpressao.update({ where: { id }, data });
    } else {
      await prisma.tipoImpressao.create({ data });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { error: "Já existe um tipo de impressão com este nome." };
    }
    return { error: "Erro ao salvar." };
  }
  revalidateCatalogo();
  return { ok: true };
}

// ============ ACABAMENTO ============

const acabamentoSchema = z
  .object({
    id: z.string().optional(),
    nome: z.string().trim().min(1).max(60),
    precoM2: z.coerce.number().nonnegative().nullish(),
    precoFixo: z.coerce.number().nonnegative().nullish(),
    ativo: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
  })
  .refine((d) => (d.precoM2 ?? 0) > 0 || (d.precoFixo ?? 0) >= 0, {
    message: "Informe preço por m² ou preço fixo (ou ambos como zero).",
  });

export async function salvarAcabamento(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const denied = await adminErrorOrNull();
  if (denied) return denied;

  const parsed = acabamentoSchema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    precoM2: formData.get("precoM2") || null,
    precoFixo: formData.get("precoFixo") || null,
    ativo: formData.get("ativo") ?? false,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { id, precoM2, precoFixo, ...rest } = parsed.data;
  const data = {
    ...rest,
    precoM2: precoM2 ?? null,
    precoFixo: precoFixo ?? null,
  };

  try {
    if (id) {
      await prisma.acabamento.update({ where: { id }, data });
    } else {
      await prisma.acabamento.create({ data });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { error: "Já existe um acabamento com este nome." };
    }
    return { error: "Erro ao salvar." };
  }
  revalidateCatalogo();
  return { ok: true };
}

// ============ TOGGLE ATIVO ============

export async function toggleMaterialAtivo(id: string, ativo: boolean) {
  const denied = await adminErrorOrNull();
  if (denied) return denied;
  await prisma.material.update({ where: { id }, data: { ativo } });
  revalidateCatalogo();
  return { ok: true } as const;
}

export async function toggleImpressaoAtivo(id: string, ativo: boolean) {
  const denied = await adminErrorOrNull();
  if (denied) return denied;
  await prisma.tipoImpressao.update({ where: { id }, data: { ativo } });
  revalidateCatalogo();
  return { ok: true } as const;
}

export async function toggleAcabamentoAtivo(id: string, ativo: boolean) {
  const denied = await adminErrorOrNull();
  if (denied) return denied;
  await prisma.acabamento.update({ where: { id }, data: { ativo } });
  revalidateCatalogo();
  return { ok: true } as const;
}
