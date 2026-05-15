"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export type ComissaoActionResult = { ok: true } | { error: string };

async function requireFinanceiro(): Promise<ComissaoActionResult | null> {
  const user = await verifySession();
  if (user.perfil !== "ADM" && user.perfil !== "FIN") {
    return {
      error: "Apenas administradores e financeiro podem gerenciar comissões.",
    };
  }
  return null;
}

/**
 * Marca a comissão como PAGA, gravando data atual.
 */
export async function marcarComissaoPaga(id: string): Promise<ComissaoActionResult> {
  const denied = await requireFinanceiro();
  if (denied) return denied;

  try {
    await prisma.comissao.update({
      where: { id },
      data: { status: "PAGA", pagaEm: new Date() },
    });
    revalidatePath("/comissoes");
    return { ok: true };
  } catch {
    return { error: "Erro ao marcar comissão como paga." };
  }
}

/**
 * Reverte para PENDENTE (caso pago por engano).
 */
export async function desmarcarComissao(id: string): Promise<ComissaoActionResult> {
  const denied = await requireFinanceiro();
  if (denied) return denied;

  try {
    await prisma.comissao.update({
      where: { id },
      data: { status: "PENDENTE", pagaEm: null },
    });
    revalidatePath("/comissoes");
    return { ok: true };
  } catch {
    return { error: "Erro ao reverter comissão." };
  }
}

/**
 * Cancela a comissão (ex: pedido cancelado ou vendedor desligado).
 * Não apaga — mantém histórico.
 */
export async function cancelarComissao(id: string): Promise<ComissaoActionResult> {
  const denied = await requireFinanceiro();
  if (denied) return denied;

  try {
    await prisma.comissao.update({
      where: { id },
      data: { status: "CANCELADA" },
    });
    revalidatePath("/comissoes");
    return { ok: true };
  } catch {
    return { error: "Erro ao cancelar comissão." };
  }
}

/**
 * Marca todas as comissões pendentes de um vendedor como pagas
 * (útil para fechamento mensal).
 */
export async function marcarTodasPagas(vendedorId: string): Promise<ComissaoActionResult> {
  const denied = await requireFinanceiro();
  if (denied) return denied;

  try {
    await prisma.comissao.updateMany({
      where: { vendedorId, status: "PENDENTE" },
      data: { status: "PAGA", pagaEm: new Date() },
    });
    revalidatePath("/comissoes");
    return { ok: true };
  } catch {
    return { error: "Erro ao confirmar pagamento em lote." };
  }
}
