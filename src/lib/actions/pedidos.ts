"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { proximoNumero } from "@/lib/numbering";

/**
 * Server actions de pedidos.
 *
 * Regras:
 *   - ADM, VEN podem criar pedidos (via conversão de orçamento).
 *   - ADM, VEN, PRO podem mudar status de produção.
 *   - FIN apenas visualiza e atualiza pagamentos (não cobertos aqui).
 */

export type PedidoActionResult = { ok: true; id?: string } | { error: string };

async function denyIfReadOnly(): Promise<PedidoActionResult | null> {
  const user = await verifySession();
  if (user.perfil === "FIN") {
    return { error: "Financeiro só visualiza. Solicite alteração ao vendedor ou produção." };
  }
  return null;
}

async function denyIfNotSalesperson(): Promise<PedidoActionResult | null> {
  const user = await verifySession();
  if (user.perfil === "PRO" || user.perfil === "FIN") {
    return { error: "Apenas vendedores e administradores podem converter orçamentos." };
  }
  return null;
}

/**
 * Converte um Orçamento APROVADO em Pedido.
 *
 * Estratégia:
 *   - Faz um SNAPSHOT dos itens (Pedido fica imutável em relação a mudanças
 *     de catálogo posteriores; preserva o que foi vendido).
 *   - Gera número sequencial atômico.
 *   - Cria etapas padrão de produção (PENDENTE).
 *   - O orçamento original permanece intacto (visualizável e ligado ao
 *     pedido via Pedido.orcamentoId).
 */
export async function converterOrcamentoEmPedido(
  orcamentoId: string,
): Promise<PedidoActionResult> {
  const denied = await denyIfNotSalesperson();
  if (denied) return denied;

  const user = await verifySession();

  const orcamento = await prisma.orcamento.findUnique({
    where: { id: orcamentoId },
    include: {
      itens: {
        orderBy: { ordem: "asc" },
        include: {
          material: { select: { id: true, nome: true } },
          impressao: { select: { id: true } },
          acabamento: { select: { id: true, nome: true } },
        },
      },
      pedido: { select: { id: true } },
    },
  });

  if (!orcamento) return { error: "Orçamento não encontrado." };
  if (orcamento.status !== "APROVADO") {
    return { error: "Só é possível converter orçamentos aprovados." };
  }
  if (orcamento.pedido) {
    return { error: "Este orçamento já foi convertido em pedido.", };
  }

  // Determina etapas necessárias com base nos acabamentos/serviços usados.
  const acabamentosUsados = new Set(
    orcamento.itens
      .map((it) => it.acabamento?.nome?.toLowerCase() ?? "")
      .filter(Boolean),
  );
  type EtapaTipo = "IMPRESSAO" | "RECORTE" | "LAMINACAO" | "RESINA" | "ACABAMENTO" | "EMBALAGEM";
  const etapas: EtapaTipo[] = ["IMPRESSAO"];
  if ([...acabamentosUsados].some((a) => a.includes("recorte") || a.includes("corte") || a.includes("meio corte"))) {
    etapas.push("RECORTE");
  }
  if ([...acabamentosUsados].some((a) => a.includes("laminação") || a.includes("laminacao"))) {
    etapas.push("LAMINACAO");
  }
  if ([...acabamentosUsados].some((a) => a.includes("resina"))) {
    etapas.push("RESINA");
  }
  etapas.push("ACABAMENTO", "EMBALAGEM");

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const numero = await proximoNumero(tx, "pedido");
      const p = await tx.pedido.create({
        data: {
          numero,
          orcamentoId: orcamento.id,
          clienteId: orcamento.clienteId,
          vendedorId: user.id,
          status: "AGUARDANDO_ARTE",
          prazoEntrega: orcamento.prazoEntregaDias
            ? new Date(Date.now() + orcamento.prazoEntregaDias * 24 * 60 * 60 * 1000)
            : null,
          observacoes: orcamento.observacoes,
          total: orcamento.total,
          itens: {
            create: orcamento.itens.map((it, ix) => ({
              ordem: ix,
              descricao: it.descricao,
              unidadeCalculo: it.unidadeCalculo,
              larguraCm: it.larguraCm,
              alturaCm: it.alturaCm,
              quantidade: it.quantidade,
              materialId: it.materialId,
              impressaoId: it.impressaoId,
              acabamentoId: it.acabamentoId,
              areaTotalM2: it.areaTotalM2,
              precoUnitario: it.precoUnitario,
              precoTotal: it.precoTotal,
            })),
          },
          etapas: {
            create: etapas.map((tipo, i) => ({
              tipo,
              ordem: i,
              status: "PENDENTE" as const,
            })),
          },
        },
      });
      return p;
    });

    revalidatePath("/pedidos");
    revalidatePath("/orcamentos");
    revalidatePath(`/orcamentos/${orcamentoId}`);
    return { ok: true, id: pedido.id };
  } catch (e) {
    console.error("Erro ao converter orçamento:", e);
    return { error: "Erro ao criar pedido." };
  }
}

const statusSchema = z.enum([
  "AGUARDANDO_ARTE",
  "ARTE_EM_APROVACAO",
  "EM_PRODUCAO",
  "ACABAMENTO",
  "PRONTO",
  "ENTREGUE",
  "CANCELADO",
]);

export async function mudarStatusPedido(
  id: string,
  novoStatus: z.infer<typeof statusSchema>,
): Promise<PedidoActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  const parsed = statusSchema.safeParse(novoStatus);
  if (!parsed.success) return { error: "Status inválido" };

  const update: Prisma.PedidoUpdateInput = { status: parsed.data };
  if (parsed.data === "ENTREGUE") update.entregueEm = new Date();

  try {
    await prisma.pedido.update({ where: { id }, data: update });
    revalidatePath("/pedidos");
    revalidatePath(`/pedidos/${id}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao atualizar status do pedido." };
  }
}

/** Marca uma etapa específica como iniciada/concluída. */
export async function mudarEtapa(
  pedidoId: string,
  etapaId: string,
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "PULADA",
): Promise<PedidoActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  const data: Prisma.PedidoEtapaUpdateInput = { status };
  if (status === "EM_ANDAMENTO") data.iniciadaEm = new Date();
  if (status === "CONCLUIDA" || status === "PULADA") data.concluidaEm = new Date();

  try {
    await prisma.pedidoEtapa.update({ where: { id: etapaId }, data });
    revalidatePath(`/pedidos/${pedidoId}`);
    revalidatePath("/producao");
    return { ok: true };
  } catch {
    return { error: "Erro ao atualizar etapa." };
  }
}
