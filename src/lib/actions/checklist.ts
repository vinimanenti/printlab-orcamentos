"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export type ChecklistActionResult = { ok: true } | { error: string };

const checklistSchema = z.object({
  pedidoId: z.string().min(1),
  sangriaOk: z.boolean(),
  resolucaoOk: z.boolean(),
  coresCmykOk: z.boolean(),
  fontesConvertidas: z.boolean(),
  tracadoCorteOk: z.boolean(),
  observacoes: z.string().trim().max(1000).optional(),
});

export type ChecklistInput = z.infer<typeof checklistSchema>;

/**
 * Salva o checklist de arte de um pedido (upsert).
 * Quando todos os 5 itens estão OK, marca como validado por quem salvou.
 */
export async function salvarChecklistArte(input: ChecklistInput): Promise<ChecklistActionResult> {
  const user = await verifySession();
  if (user.perfil === "FIN") {
    return { error: "Financeiro não valida arte." };
  }

  const parsed = checklistSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { pedidoId, observacoes, ...flags } = parsed.data;
  const todosOk =
    flags.sangriaOk &&
    flags.resolucaoOk &&
    flags.coresCmykOk &&
    flags.fontesConvertidas &&
    flags.tracadoCorteOk;

  try {
    await prisma.checklistArte.upsert({
      where: { pedidoId },
      create: {
        pedidoId,
        ...flags,
        observacoes: observacoes || null,
        validadoPorId: todosOk ? user.id : null,
        validadoEm: todosOk ? new Date() : null,
      },
      update: {
        ...flags,
        observacoes: observacoes || null,
        validadoPorId: todosOk ? user.id : null,
        validadoEm: todosOk ? new Date() : null,
      },
    });
    revalidatePath(`/pedidos/${pedidoId}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao salvar checklist." };
  }
}
