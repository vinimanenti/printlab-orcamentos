"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

/**
 * Server actions para produtos pré-cadastrados por cliente.
 *
 * Caso de uso: cliente recorrente que sempre compra a mesma coisa
 * ("Adesivo Resina 3L de tal medida com tal material"). Em vez de
 * preencher tudo todo orçamento, o vendedor cadastra o produto uma
 * vez no perfil do cliente e usa como atalho.
 */

export type ClienteProdutoActionResult = { ok: true; id?: string } | { error: string };

async function denyIfReadOnly(): Promise<ClienteProdutoActionResult | null> {
  const user = await verifySession();
  if (user.perfil === "PRO" || user.perfil === "FIN") {
    return { error: "Apenas vendedores e administradores podem editar produtos do cliente." };
  }
  return null;
}

const NENHUM = "__nenhum__";

const schema = z.object({
  id: z.string().optional(),
  clienteId: z.string().min(1, "Cliente obrigatório"),
  nome: z.string().trim().min(1, "Nome obrigatório").max(120),
  descricao: z.string().trim().max(300).optional().or(z.literal("")),
  larguraCm: z.coerce.number().positive().optional().nullable(),
  alturaCm: z.coerce.number().positive().optional().nullable(),
  quantidadePadrao: z.coerce.number().int().positive().default(1),
  materialId: z.string().optional().nullable(),
  impressaoId: z.string().optional().nullable(),
  acabamentoId: z.string().optional().nullable(),
  margemPct: z.coerce.number().min(0).max(100).optional().nullable(),
  observacoes: z.string().trim().max(500).optional().or(z.literal("")),
  ativo: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
});

function nullifyNenhum(v: string | null | undefined): string | null {
  if (!v || v === NENHUM) return null;
  return v;
}

export async function salvarClienteProduto(
  _prev: ClienteProdutoActionResult | undefined,
  formData: FormData,
): Promise<ClienteProdutoActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    clienteId: formData.get("clienteId"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao") ?? "",
    larguraCm: formData.get("larguraCm") || null,
    alturaCm: formData.get("alturaCm") || null,
    quantidadePadrao: formData.get("quantidadePadrao") || 1,
    materialId: formData.get("materialId") || null,
    impressaoId: formData.get("impressaoId") || null,
    acabamentoId: formData.get("acabamentoId") || null,
    margemPct: formData.get("margemPct") || null,
    observacoes: formData.get("observacoes") ?? "",
    ativo: formData.get("ativo") ?? true,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  const dataComum = {
    nome: d.nome,
    descricao: d.descricao || null,
    larguraCm: d.larguraCm != null ? new Prisma.Decimal(d.larguraCm) : null,
    alturaCm: d.alturaCm != null ? new Prisma.Decimal(d.alturaCm) : null,
    quantidadePadrao: d.quantidadePadrao,
    materialId: nullifyNenhum(d.materialId),
    impressaoId: nullifyNenhum(d.impressaoId),
    acabamentoId: nullifyNenhum(d.acabamentoId),
    margemPct: d.margemPct != null ? new Prisma.Decimal(d.margemPct) : null,
    observacoes: d.observacoes || null,
    ativo: d.ativo,
  };

  try {
    if (d.id) {
      await prisma.clienteProduto.update({
        where: { id: d.id },
        data: dataComum,
      });
      revalidatePath(`/clientes/${d.clienteId}`);
      return { ok: true, id: d.id };
    }
    const novo = await prisma.clienteProduto.create({
      data: { ...dataComum, clienteId: d.clienteId },
    });
    revalidatePath(`/clientes/${d.clienteId}`);
    return { ok: true, id: novo.id };
  } catch (e) {
    console.error("Erro ao salvar produto do cliente:", e);
    return { error: "Erro ao salvar produto." };
  }
}

export async function excluirClienteProduto(
  id: string,
): Promise<ClienteProdutoActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  try {
    const p = await prisma.clienteProduto.findUnique({
      where: { id },
      select: { clienteId: true },
    });
    if (!p) return { error: "Produto não encontrado" };
    await prisma.clienteProduto.delete({ where: { id } });
    revalidatePath(`/clientes/${p.clienteId}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao excluir produto." };
  }
}

export async function toggleClienteProdutoAtivo(id: string, ativo: boolean) {
  const denied = await denyIfReadOnly();
  if (denied) return denied;

  const p = await prisma.clienteProduto.update({
    where: { id },
    data: { ativo },
    select: { clienteId: true },
  });
  revalidatePath(`/clientes/${p.clienteId}`);
  return { ok: true } as const;
}
