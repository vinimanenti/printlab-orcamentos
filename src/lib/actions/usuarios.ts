"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma, type Perfil } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export type UsuarioActionResult = { ok: true; id?: string } | { error: string };

async function requireAdmin(): Promise<UsuarioActionResult | null> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem gerenciar usuários." };
  }
  return null;
}

// =====================================================
// SCHEMAS
// =====================================================

const senhaSchema = z
  .string()
  .min(8, "Senha de no mínimo 8 caracteres.")
  .max(72, "Senha muito longa.")
  .refine((s) => /[A-Za-z]/.test(s), "A senha precisa conter pelo menos uma letra.")
  .refine((s) => /[0-9]/.test(s), "A senha precisa conter pelo menos um número.");

const baseSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório.").max(80),
  email: z.email("E-mail inválido.").transform((e) => e.toLowerCase().trim()),
  perfil: z.enum(["ADM", "VEN", "PRO", "FIN"]),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  comissaoPct: z.coerce.number().min(0).max(100).default(0),
  ativo: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
});

const criarSchema = baseSchema.extend({
  senha: senhaSchema,
});

const editarSchema = baseSchema.extend({
  id: z.string().min(1),
});

const resetSchema = z.object({
  id: z.string().min(1),
  novaSenha: senhaSchema,
});

// =====================================================
// CRIAR USUÁRIO
// =====================================================

export async function criarUsuario(
  _prev: UsuarioActionResult | undefined,
  formData: FormData,
): Promise<UsuarioActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = criarSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    perfil: formData.get("perfil"),
    telefone: formData.get("telefone") ?? "",
    comissaoPct: formData.get("comissaoPct") ?? 0,
    ativo: formData.get("ativo") ?? true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  try {
    const senhaHash = await bcrypt.hash(d.senha, 12);
    const user = await prisma.user.create({
      data: {
        nome: d.nome,
        email: d.email,
        senhaHash,
        perfil: d.perfil,
        telefone: d.telefone || null,
        comissaoPct: new Prisma.Decimal(d.comissaoPct.toFixed(2)),
        ativo: d.ativo,
      },
    });
    revalidatePath("/configuracoes/usuarios");
    return { ok: true, id: user.id };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { error: "Já existe usuário com este e-mail." };
    }
    console.error("Erro criar usuário:", e);
    return { error: "Erro ao criar usuário." };
  }
}

// =====================================================
// EDITAR USUÁRIO (sem mexer em senha)
// =====================================================

export async function editarUsuario(
  _prev: UsuarioActionResult | undefined,
  formData: FormData,
): Promise<UsuarioActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await verifySession();

  const parsed = editarSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    perfil: formData.get("perfil"),
    telefone: formData.get("telefone") ?? "",
    comissaoPct: formData.get("comissaoPct") ?? 0,
    ativo: formData.get("ativo") ?? true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  // Bloqueios de auto-sabotagem
  if (d.id === me.id) {
    if (d.perfil !== "ADM") {
      return { error: "Você não pode rebaixar seu próprio perfil de admin." };
    }
    if (!d.ativo) {
      return { error: "Você não pode desativar a si mesmo." };
    }
  }

  // Proteção contra remover o último ADM ativo
  if (d.perfil !== "ADM" || !d.ativo) {
    const usuarioAtual = await prisma.user.findUnique({
      where: { id: d.id },
      select: { perfil: true, ativo: true },
    });
    if (usuarioAtual?.perfil === "ADM" && usuarioAtual.ativo) {
      const totalAdmsAtivos = await prisma.user.count({
        where: { perfil: "ADM", ativo: true },
      });
      if (totalAdmsAtivos <= 1) {
        return {
          error: "Não dá pra alterar o último administrador ativo. Crie outro ADM antes.",
        };
      }
    }
  }

  try {
    await prisma.user.update({
      where: { id: d.id },
      data: {
        nome: d.nome,
        email: d.email,
        perfil: d.perfil,
        telefone: d.telefone || null,
        comissaoPct: new Prisma.Decimal(d.comissaoPct.toFixed(2)),
        ativo: d.ativo,
      },
    });
    revalidatePath("/configuracoes/usuarios");
    return { ok: true, id: d.id };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { error: "Já existe usuário com este e-mail." };
    }
    return { error: "Erro ao atualizar usuário." };
  }
}

// =====================================================
// REDEFINIR SENHA (admin força nova senha)
// =====================================================

export async function redefinirSenha(
  _prev: UsuarioActionResult | undefined,
  formData: FormData,
): Promise<UsuarioActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = resetSchema.safeParse({
    id: formData.get("id"),
    novaSenha: formData.get("novaSenha"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    const senhaHash = await bcrypt.hash(parsed.data.novaSenha, 12);
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { senhaHash },
    });
    revalidatePath("/configuracoes/usuarios");
    return { ok: true };
  } catch {
    return { error: "Erro ao redefinir senha." };
  }
}

// =====================================================
// TOGGLE ATIVO (atalho)
// =====================================================

export async function toggleUsuarioAtivo(id: string, ativo: boolean) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await verifySession();

  if (id === me.id && !ativo) {
    return { error: "Você não pode desativar a si mesmo." };
  }

  if (!ativo) {
    const usuario = await prisma.user.findUnique({
      where: { id },
      select: { perfil: true },
    });
    if (usuario?.perfil === "ADM") {
      const totalAdmsAtivos = await prisma.user.count({
        where: { perfil: "ADM", ativo: true },
      });
      if (totalAdmsAtivos <= 1) {
        return { error: "Não dá pra desativar o último administrador ativo." };
      }
    }
  }

  await prisma.user.update({ where: { id }, data: { ativo } });
  revalidatePath("/configuracoes/usuarios");
  return { ok: true } as const;
}

/** Util: gera senha temporária aleatória (10 chars, letra+número+símbolo) */
export async function gerarSenhaTemporaria(): Promise<string> {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const nums = "23456789";
  const syms = "!@#$";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 3; i++) s += nums[Math.floor(Math.random() * nums.length)];
  s += syms[Math.floor(Math.random() * syms.length)];
  return s;
}

export const PERFIL_LABELS: Record<Perfil, string> = {
  ADM: "Administrador",
  VEN: "Vendedor",
  PRO: "Produção",
  FIN: "Financeiro",
};

export const PERFIL_DESCRICOES: Record<Perfil, string> = {
  ADM: "Acesso total: configurações, usuários, preços, todos os dados.",
  VEN: "Cria clientes, orçamentos e pedidos. Vê os pedidos que ele mesmo lançou.",
  PRO: "Visualiza pedidos e atualiza etapas de produção. Não vê valores.",
  FIN: "Visualiza tudo + registra pagamentos. Não edita orçamentos.",
};
