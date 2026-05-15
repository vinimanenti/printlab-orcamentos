"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export type PagamentoActionResult = { ok: true; id?: string } | { error: string };

async function denyIfReadOnly(): Promise<PagamentoActionResult | null> {
  const user = await verifySession();
  if (user.perfil === "PRO") {
    return { error: "Produção não registra pagamentos." };
  }
  return null;
}

const pagamentoSchema = z.object({
  id: z.string().optional(),
  pedidoId: z.string().min(1),
  valor: z.coerce.number().positive("Valor inválido"),
  metodo: z.enum([
    "DINHEIRO",
    "PIX",
    "CARTAO_DEBITO",
    "CARTAO_CREDITO",
    "BOLETO",
    "TRANSFERENCIA",
  ]),
  status: z
    .enum(["PREVISTO", "PAGO", "ATRASADO", "CANCELADO"])
    .default("PREVISTO"),
  vencimento: z.string().optional(),
  pagoEm: z.string().optional(),
  observacoes: z.string().trim().max(500).optional(),
});

/**
 * Recalcula o totalPago do pedido somando os pagamentos com status PAGO.
 * Mantém o campo consistente após qualquer mudança em pagamento.
 */
async function recalcularTotalPago(
  tx: Prisma.TransactionClient,
  pedidoId: string,
): Promise<void> {
  const aggr = await tx.pagamento.aggregate({
    where: { pedidoId, status: "PAGO" },
    _sum: { valor: true },
  });
  const totalPago = aggr._sum.valor ?? new Prisma.Decimal(0);
  await tx.pedido.update({
    where: { id: pedidoId },
    data: { totalPago },
  });
}

export async function salvarPagamento(
  _prev: PagamentoActionResult | undefined,
  formData: FormData,
): Promise<PagamentoActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  const parsed = pagamentoSchema.safeParse({
    id: formData.get("id") || undefined,
    pedidoId: formData.get("pedidoId"),
    valor: formData.get("valor"),
    metodo: formData.get("metodo"),
    status: formData.get("status") ?? "PREVISTO",
    vencimento: formData.get("vencimento") || undefined,
    pagoEm: formData.get("pagoEm") || undefined,
    observacoes: formData.get("observacoes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { id, pedidoId, valor, metodo, status, vencimento, pagoEm, observacoes } = parsed.data;

  const data: Prisma.PagamentoUncheckedCreateInput = {
    pedidoId,
    valor: new Prisma.Decimal(valor.toFixed(2)),
    metodo,
    status,
    vencimento: vencimento ? new Date(vencimento) : null,
    pagoEm: pagoEm ? new Date(pagoEm) : status === "PAGO" ? new Date() : null,
    observacoes: observacoes || null,
  };

  try {
    await prisma.$transaction(async (tx) => {
      if (id) {
        await tx.pagamento.update({ where: { id }, data });
      } else {
        await tx.pagamento.create({ data });
      }
      await recalcularTotalPago(tx, pedidoId);
    });
    revalidatePath(`/pedidos/${pedidoId}`);
    return { ok: true };
  } catch (e) {
    console.error("Erro ao salvar pagamento:", e);
    return { error: "Erro ao salvar pagamento." };
  }
}

export async function marcarPagoRapido(pagamentoId: string): Promise<PagamentoActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  try {
    const pgto = await prisma.$transaction(async (tx) => {
      const p = await tx.pagamento.update({
        where: { id: pagamentoId },
        data: { status: "PAGO", pagoEm: new Date() },
      });
      await recalcularTotalPago(tx, p.pedidoId);
      return p;
    });
    revalidatePath(`/pedidos/${pgto.pedidoId}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao marcar pagamento." };
  }
}

export async function cancelarPagamento(pagamentoId: string): Promise<PagamentoActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  try {
    const pgto = await prisma.$transaction(async (tx) => {
      const p = await tx.pagamento.update({
        where: { id: pagamentoId },
        data: { status: "CANCELADO" },
      });
      await recalcularTotalPago(tx, p.pedidoId);
      return p;
    });
    revalidatePath(`/pedidos/${pgto.pedidoId}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao cancelar pagamento." };
  }
}

export async function excluirPagamento(pagamentoId: string): Promise<PagamentoActionResult> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem excluir pagamentos." };
  }
  try {
    const pgto = await prisma.$transaction(async (tx) => {
      const p = await tx.pagamento.delete({ where: { id: pagamentoId } });
      await recalcularTotalPago(tx, p.pedidoId);
      return p;
    });
    revalidatePath(`/pedidos/${pgto.pedidoId}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao excluir pagamento." };
  }
}
