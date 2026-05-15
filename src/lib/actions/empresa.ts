"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

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

const LOGO_PASTA = "uploads/empresa";
const TIPOS_PERMITIDOS = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const TAMANHO_MAX_MB = 2;

/**
 * Upload da logo da empresa. Substitui a logo desenhada (Print ●●●● Lab)
 * no PDF e em outros locais. Aceita PNG, JPG ou WebP até 2MB.
 *
 * Se já houver logo anterior, o arquivo antigo é apagado do disco
 * antes de gravar o novo.
 */
export async function salvarLogoEmpresa(formData: FormData): Promise<EmpresaActionResult> {
  const user = await verifySession();
  if (user.perfil !== "ADM") {
    return { error: "Apenas administradores podem alterar a logo." };
  }

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "Selecione um arquivo." };

  if (!TIPOS_PERMITIDOS.has(file.type)) {
    return { error: "Formato inválido. Use PNG, JPG ou WebP." };
  }
  if (file.size > TAMANHO_MAX_MB * 1024 * 1024) {
    return { error: `Arquivo excede ${TAMANHO_MAX_MB}MB.` };
  }

  try {
    const pasta = path.join(process.cwd(), "public", LOGO_PASTA);
    await fs.mkdir(pasta, { recursive: true });

    // Remove logo anterior se existir
    const configAtual = await prisma.configuracaoSistema.findUnique({
      where: { id: "singleton" },
      select: { empresaLogoPath: true },
    });
    if (configAtual?.empresaLogoPath) {
      const antigaAbs = path.join(process.cwd(), "public", configAtual.empresaLogoPath);
      await fs.unlink(antigaAbs).catch(() => {
        // arquivo já não existe — segue
      });
    }

    // Grava o novo
    const ext = file.type === "image/png" ? ".png"
      : file.type === "image/webp" ? ".webp"
      : ".jpg";
    const nomeArquivo = `logo-${randomUUID().slice(0, 8)}${ext}`;
    const destino = path.join(pasta, nomeArquivo);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(destino, buffer);

    const publicPath = `/${LOGO_PASTA}/${nomeArquivo}`;
    await prisma.configuracaoSistema.update({
      where: { id: "singleton" },
      data: { empresaLogoPath: publicPath },
    });

    revalidatePath("/configuracoes/empresa");
    return { ok: true, logoPath: publicPath };
  } catch (e) {
    console.error("Erro ao salvar logo:", e);
    return { error: "Erro ao salvar arquivo." };
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
    const abs = path.join(process.cwd(), "public", configAtual.empresaLogoPath);
    await fs.unlink(abs).catch(() => {
      // já deletado externamente — ok
    });
  }

  await prisma.configuracaoSistema.update({
    where: { id: "singleton" },
    data: { empresaLogoPath: null },
  });

  revalidatePath("/configuracoes/empresa");
  return { ok: true, logoPath: null };
}
