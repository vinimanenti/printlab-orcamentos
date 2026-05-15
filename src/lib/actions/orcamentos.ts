"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { proximoNumero } from "@/lib/numbering";

/**
 * Server actions de orçamentos.
 *
 * Regras (spec §27):
 *   - ADM, VEN podem criar/editar.
 *   - PRO, FIN podem visualizar.
 */

export type OrcamentoActionResult = { ok: true; id?: string } | { error: string };

async function denyIfNotSalesperson(): Promise<OrcamentoActionResult | null> {
  const user = await verifySession();
  if (user.perfil === "PRO" || user.perfil === "FIN") {
    return { error: "Apenas vendedores e administradores podem editar orçamentos." };
  }
  return null;
}

// Schema do item submetido pelo formulário. Os preços vêm pré-calculados
// pela calculadora no cliente, mas validamos no server por segurança.
const itemSchema = z.object({
  descricao: z.string().trim().min(1, "Descrição obrigatória").max(200),
  larguraCm: z.coerce.number().positive(),
  alturaCm: z.coerce.number().positive(),
  quantidade: z.coerce.number().int().positive(),
  materialId: z.string().min(1, "Material obrigatório"),
  impressaoId: z.string().min(1, "Tipo de impressão obrigatório"),
  acabamentoId: z.string().optional().nullable(),
  margemPct: z.coerce.number().min(0).max(100),
  // Snapshot do cálculo (precomputado no cliente)
  areaUnitariaM2: z.coerce.number().nonnegative(),
  areaTotalM2: z.coerce.number().nonnegative(),
  aproveitamentoPct: z.coerce.number().min(0).max(100),
  custoTotal: z.coerce.number().nonnegative(),
  precoUnitario: z.coerce.number().nonnegative(),
  precoTotal: z.coerce.number().nonnegative(),
});

const novoOrcamentoSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente"),
  validadeDias: z.coerce.number().int().min(1).max(365).default(7),
  prazoEntregaDias: z.coerce.number().int().min(0).max(365).optional().nullable(),
  observacoes: z.string().trim().max(2000).optional().or(z.literal("")),
  condicoesPagamento: z.string().trim().max(200).optional().or(z.literal("")),
  desconto: z.coerce.number().nonnegative().default(0),
  itens: z.array(itemSchema).min(1, "Inclua ao menos um item"),
});

export async function criarOrcamento(input: z.infer<typeof novoOrcamentoSchema>): Promise<OrcamentoActionResult> {
  const denied = await denyIfNotSalesperson();
  if (denied) return denied;

  const user = await verifySession();
  const parsed = novoOrcamentoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  // Soma os totais dos itens para o orçamento.
  const subtotal = data.itens.reduce((s, it) => s + it.precoTotal, 0);
  const total = Math.max(0, subtotal - data.desconto);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const numero = await proximoNumero(tx, "orcamento");
      const o = await tx.orcamento.create({
        data: {
          numero,
          clienteId: data.clienteId,
          vendedorId: user.id,
          status: "RASCUNHO",
          validadeDias: data.validadeDias,
          prazoEntregaDias: data.prazoEntregaDias ?? null,
          observacoes: data.observacoes || null,
          condicoesPagamento: data.condicoesPagamento || null,
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          desconto: new Prisma.Decimal(data.desconto.toFixed(2)),
          total: new Prisma.Decimal(total.toFixed(2)),
          itens: {
            create: data.itens.map((it, ix) => ({
              ordem: ix,
              descricao: it.descricao,
              unidadeCalculo: "METRO_QUADRADO" as const,
              larguraCm: new Prisma.Decimal(it.larguraCm),
              alturaCm: new Prisma.Decimal(it.alturaCm),
              quantidade: it.quantidade,
              materialId: it.materialId,
              impressaoId: it.impressaoId,
              acabamentoId: it.acabamentoId || null,
              areaUnitariaM2: new Prisma.Decimal(it.areaUnitariaM2.toFixed(4)),
              areaTotalM2: new Prisma.Decimal(it.areaTotalM2.toFixed(4)),
              aproveitamentoPct: new Prisma.Decimal(it.aproveitamentoPct.toFixed(2)),
              custoTotal: new Prisma.Decimal(it.custoTotal.toFixed(2)),
              margemPct: new Prisma.Decimal(it.margemPct.toFixed(2)),
              precoUnitario: new Prisma.Decimal(it.precoUnitario.toFixed(2)),
              precoTotal: new Prisma.Decimal(it.precoTotal.toFixed(2)),
            })),
          },
        },
      });
      return o.id;
    });
    revalidatePath("/orcamentos");
    return { ok: true, id };
  } catch (e) {
    console.error("Erro ao criar orçamento:", e);
    return { error: "Erro ao salvar orçamento." };
  }
}

const statusSchema = z.enum([
  "RASCUNHO",
  "ENVIADO",
  "EM_NEGOCIACAO",
  "APROVADO",
  "PERDIDO",
  "CANCELADO",
]);

export async function mudarStatusOrcamento(
  id: string,
  novoStatus: z.infer<typeof statusSchema>,
  motivoPerdaId?: string,
): Promise<OrcamentoActionResult> {
  const denied = await denyIfNotSalesperson();
  if (denied) return denied;

  const parsed = statusSchema.safeParse(novoStatus);
  if (!parsed.success) return { error: "Status inválido" };

  const update: Prisma.OrcamentoUpdateInput = {
    status: parsed.data,
  };
  if (parsed.data === "ENVIADO") update.enviadoEm = new Date();
  if (parsed.data === "APROVADO") update.aprovadoEm = new Date();
  if (parsed.data === "PERDIDO" && motivoPerdaId) {
    update.motivoPerda = { connect: { id: motivoPerdaId } };
  }

  try {
    await prisma.orcamento.update({ where: { id }, data: update });
    revalidatePath("/orcamentos");
    revalidatePath(`/orcamentos/${id}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao atualizar status." };
  }
}

export async function excluirOrcamento(id: string): Promise<OrcamentoActionResult> {
  const denied = await denyIfNotSalesperson();
  if (denied) return denied;
  const o = await prisma.orcamento.findUnique({ where: { id }, select: { status: true } });
  if (!o) return { error: "Orçamento não encontrado" };
  if (o.status !== "RASCUNHO") {
    return { error: "Apenas rascunhos podem ser excluídos. Use Cancelar para os outros." };
  }
  try {
    await prisma.orcamento.delete({ where: { id } });
    revalidatePath("/orcamentos");
    redirect("/orcamentos");
  } catch (e) {
    if (e instanceof Error && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    return { error: "Erro ao excluir." };
  }
}
