"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { salvarArquivo, removerArquivo } from "@/lib/storage";

export type EmpresaActionResult = { ok: true; logoPath?: string | null } | { error: string };

const schema = z.object({
  // Dados que aparecem no PDF e nos cabeçalhos do sistema
  empresaNome: z.string().trim().min(1, "Nome da empresa obrigatório.").max(120),
  empresaCnpj: z.string().trim().max(30).optional().or(z.literal("")),
  empresaTelefone: z.string().trim().min(8, "Telefone obrigatório.").max(30),
  empresaEmail: z.union([z.email("E-mail inválido"), z.literal("")]).optional(),
  empresaEndereco: z.string().trim().max(300).optional().or(z.literal("")),

  // Regras do sistema
  margemMinimaPct: z.coerce.number().min(0).max(100),
  prefixoOrcamento: z.string().trim().min(1).max(8).regex(/^[A-Z0-9-]+$/i, "Use apenas letras, números ou hífen."),
  prefixoPedido: z.string().trim().min(1).max(8).regex(/^[A-Z0-9-]+$/i, "Use apenas letras, números ou hífen."),
  validadeOrcamentoDias: z.coerce.number().int().min(1).max(365),
  validadeAprovacaoDias: z.coerce.number().int().min(1).max(90),
});

export async function salvarEmpresa(
  _prev: EmpresaActionResult | undefined,
  formData: FormData,
): Promise<EmpresaActionResult> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem editar a empresa." };
  }

  const parsed = schema.safeParse({
    empresaNome: formData.get("empresaNome"),
    empresaCnpj: formData.get("empresaCnpj") ?? "",
    empresaTelefone: formData.get("empresaTelefone"),
    empresaEmail: formData.get("empresaEmail") ?? "",
    empresaEndereco: formData.get("empresaEndereco") ?? "",
    margemMinimaPct: formData.get("margemMinimaPct"),
    prefixoOrcamento: formData.get("prefixoOrcamento"),
    prefixoPedido: formData.get("prefixoPedido"),
    validadeOrcamentoDias: formData.get("validadeOrcamentoDias"),
    validadeAprovacaoDias: formData.get("validadeAprovacaoDias"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  try {
    await prisma.configuracaoSistema.upsert({
      where: { id: "singleton" },
      update: {
        empresaNome: d.empresaNome,
        empresaCnpj: d.empresaCnpj || null,
        empresaTelefone: d.empresaTelefone,
        empresaEmail: d.empresaEmail || null,
        empresaEndereco: d.empresaEndereco || null,
        margemMinimaPct: new Prisma.Decimal(d.margemMinimaPct.toFixed(2)),
        prefixoOrcamento: d.prefixoOrcamento.toUpperCase(),
        prefixoPedido: d.prefixoPedido.toUpperCase(),
        validadeOrcamentoDias: d.validadeOrcamentoDias,
        validadeAprovacaoDias: d.validadeAprovacaoDias,
      },
      create: {
        id: "singleton",
        empresaNome: d.empresaNome,
        empresaCnpj: d.empresaCnpj || null,
        empresaTelefone: d.empresaTelefone,
        empresaEmail: d.empresaEmail || null,
        empresaEndereco: d.empresaEndereco || null,
        margemMinimaPct: new Prisma.Decimal(d.margemMinimaPct.toFixed(2)),
        prefixoOrcamento: d.prefixoOrcamento.toUpperCase(),
        prefixoPedido: d.prefixoPedido.toUpperCase(),
        validadeOrcamentoDias: d.validadeOrcamentoDias,
        validadeAprovacaoDias: d.validadeAprovacaoDias,
      },
    });
    // Tudo que depende da config precisa revalidar
    revalidatePath("/configuracoes/empresa");
    revalidatePath("/calculadora");
    revalidatePath("/orcamentos");
    revalidatePath("/orcamentos/novo");
    revalidatePath("/aprovacao", "layout");
    return { ok: true };
  } catch {
    return { error: "Erro ao salvar dados da empresa." };
  }
}

// ============= LOGO DA EMPRESA =============

const LOGO_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Upload da logo da empresa. Substitui a logo desenhada (Print ●●●● Lab)
 * no PDF e em outros locais. Aceita PNG, JPG ou WebP até 2MB.
 *
 * Em dev: grava em ./public/uploads/empresa/
 * Em prod: sobe pro Cloudflare R2 (se configurado)
 */
export async function salvarLogoEmpresa(formData: FormData): Promise<EmpresaActionResult> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem alterar a logo." };
  }

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "Selecione um arquivo." };

  try {
    // Remove logo anterior se existir
    const configAtual = await prisma.configuracaoSistema.findUnique({
      where: { id: "singleton" },
      select: { empresaLogoPath: true },
    });
    if (configAtual?.empresaLogoPath) {
      await removerArquivo(configAtual.empresaLogoPath);
    }

    const salvo = await salvarArquivo("empresa", file, {
      maxBytes: LOGO_MAX_BYTES,
      mimesPermitidos: LOGO_MIMES,
    });

    await prisma.configuracaoSistema.update({
      where: { id: "singleton" },
      data: { empresaLogoPath: salvo.publicPath },
    });

    revalidatePath("/configuracoes/empresa");
    return { ok: true, logoPath: salvo.publicPath };
  } catch (e) {
    console.error("Erro ao salvar logo:", e);
    return {
      error: e instanceof Error ? e.message : "Erro ao salvar arquivo.",
    };
  }
}

/**
 * Remove a logo personalizada. O PDF volta a usar o desenho padrão
 * "Print ●●●● Lab" automaticamente.
 */
export async function removerLogoEmpresa(): Promise<EmpresaActionResult> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem alterar a logo." };
  }

  const configAtual = await prisma.configuracaoSistema.findUnique({
    where: { id: "singleton" },
    select: { empresaLogoPath: true },
  });
  if (configAtual?.empresaLogoPath) {
    await removerArquivo(configAtual.empresaLogoPath);
  }

  await prisma.configuracaoSistema.update({
    where: { id: "singleton" },
    data: { empresaLogoPath: null },
  });

  revalidatePath("/configuracoes/empresa");
  return { ok: true, logoPath: null };
}
