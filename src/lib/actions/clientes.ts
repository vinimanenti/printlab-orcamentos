"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

/**
 * Server actions de clientes.
 *
 * Regras (spec §27):
 *  - ADM e VEN podem criar/editar clientes.
 *  - PRO e FIN podem apenas visualizar.
 */

export type ClienteActionResult = { ok: true; id?: string } | { error: string };

async function denyIfNotSalesperson(): Promise<ClienteActionResult | null> {
  const user = await verifySession();
  if (user.perfil === "PRO" || user.perfil === "FIN") {
    return { error: "Apenas vendedores e administradores podem editar clientes." };
  }
  return null;
}

const clienteSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(["PF", "PJ"]),
  nome: z.string().trim().min(1, "Nome obrigatório").max(120),
  documento: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || v.length === 11 || v.length === 14, "CPF deve ter 11 e CNPJ 14 dígitos")
    .optional()
    .or(z.literal("")),
  email: z.union([z.email("E-mail inválido"), z.literal("")]).optional(),
  telefone: z.string().trim().min(8, "Telefone obrigatório").max(30),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  observacoes: z.string().trim().max(2000).optional().or(z.literal("")),
  ativo: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
});

export async function salvarCliente(
  _prev: ClienteActionResult | undefined,
  formData: FormData,
): Promise<ClienteActionResult> {
  const denied = await denyIfNotSalesperson();
  if (denied) return denied;

  const parsed = clienteSchema.safeParse({
    id: formData.get("id") || undefined,
    tipo: formData.get("tipo"),
    nome: formData.get("nome"),
    documento: formData.get("documento") ?? "",
    email: formData.get("email") ?? "",
    telefone: formData.get("telefone"),
    whatsapp: formData.get("whatsapp") ?? "",
    observacoes: formData.get("observacoes") ?? "",
    ativo: formData.get("ativo") ?? true,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { id, ...rest } = parsed.data;
  const data = {
    tipo: rest.tipo,
    nome: rest.nome,
    documento: rest.documento || null,
    email: rest.email || null,
    telefone: rest.telefone,
    whatsapp: rest.whatsapp || null,
    observacoes: rest.observacoes || null,
    ativo: rest.ativo,
  };

  try {
    if (id) {
      await prisma.cliente.update({ where: { id }, data });
      revalidatePath("/clientes");
      revalidatePath(`/clientes/${id}`);
      return { ok: true, id };
    }
    const novo = await prisma.cliente.create({ data });
    revalidatePath("/clientes");
    return { ok: true, id: novo.id };
  } catch {
    return { error: "Erro ao salvar cliente." };
  }
}

export async function arquivarCliente(id: string) {
  const denied = await denyIfNotSalesperson();
  if (denied) return denied;
  await prisma.cliente.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/clientes");
  return { ok: true } as const;
}

export async function reativarCliente(id: string) {
  const denied = await denyIfNotSalesperson();
  if (denied) return denied;
  await prisma.cliente.update({ where: { id }, data: { ativo: true } });
  revalidatePath("/clientes");
  return { ok: true } as const;
}

/**
 * Busca por nome, telefone ou documento. Usada na lista e em autocompletes.
 */
export async function buscarClientes(q: string) {
  await verifySession();
  const termo = q.trim();
  if (!termo) {
    return prisma.cliente.findMany({
      take: 50,
      orderBy: { criadoEm: "desc" },
    });
  }
  const soDigitos = termo.replace(/\D/g, "");
  return prisma.cliente.findMany({
    where: {
      OR: [
        { nome: { contains: termo, mode: "insensitive" as const } },
        soDigitos.length >= 4 ? { telefone: { contains: soDigitos } } : null,
        soDigitos.length >= 4 ? { whatsapp: { contains: soDigitos } } : null,
        soDigitos.length >= 4 ? { documento: { contains: soDigitos } } : null,
      ].filter((c): c is NonNullable<typeof c> => c !== null),
    },
    take: 50,
    orderBy: { nome: "asc" },
  });
}
