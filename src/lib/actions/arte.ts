"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { salvarArquivoArte } from "@/lib/storage";

export type ArteActionResult = { ok: true; arteVersaoId?: string; token?: string } | { error: string };

async function denyIfReadOnly(): Promise<ArteActionResult | null> {
  const user = await verifySession();
  if (user.perfil === "FIN") {
    return { error: "Financeiro não envia arte." };
  }
  return null;
}

/**
 * Faz upload de uma nova versão da arte para um pedido.
 * Cria ArteVersao + Anexo + (opcionalmente) AprovacaoArte pendente
 * pra gerar link público de aprovação.
 */
export async function enviarArte(formData: FormData): Promise<ArteActionResult> {
  const denied = await denyIfReadOnly();
  if (denied) return denied;
  const user = await verifySession();

  const pedidoId = String(formData.get("pedidoId") ?? "");
  const file = formData.get("file") as File | null;
  const notas = String(formData.get("notas") ?? "").trim();
  const gerarLinkAprovacao = formData.get("gerarLink") === "on";

  if (!pedidoId) return { error: "Pedido inválido" };
  if (!file || file.size === 0) return { error: "Selecione um arquivo" };

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { arteVersoes: { select: { versao: true } } },
  });
  if (!pedido) return { error: "Pedido não encontrado" };

  try {
    const salvo = await salvarArquivoArte(pedidoId, file);
    const proximaVersao =
      Math.max(0, ...pedido.arteVersoes.map((v) => v.versao)) + 1;

    const result = await prisma.$transaction(async (tx) => {
      const anexo = await tx.anexo.create({
        data: {
          pedidoId,
          categoria: "ARTE",
          nomeOriginal: salvo.nomeOriginal,
          caminho: salvo.publicPath,
          mimeType: salvo.mimeType,
          tamanhoBytes: salvo.tamanhoBytes,
          uploadedById: user.id,
        },
      });
      const versao = await tx.arteVersao.create({
        data: {
          pedidoId,
          versao: proximaVersao,
          anexoId: anexo.id,
          enviadaPorId: user.id,
          notas: notas || null,
        },
      });

      let token: string | undefined;
      if (gerarLinkAprovacao) {
        const config = await tx.configuracaoSistema.findUnique({
          where: { id: "singleton" },
          select: { validadeAprovacaoDias: true },
        });
        const validadeDias = config?.validadeAprovacaoDias ?? 7;
        const aprovacao = await tx.aprovacaoArte.create({
          data: {
            pedidoId,
            arteVersaoId: versao.id,
            expiraEm: new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000),
          },
        });
        token = aprovacao.token;

        // Avança status do pedido para "Arte em aprovação"
        await tx.pedido.update({
          where: { id: pedidoId },
          data: { status: "ARTE_EM_APROVACAO" },
        });
      }

      return { versaoId: versao.id, token };
    });

    revalidatePath(`/pedidos/${pedidoId}`);
    revalidatePath("/producao");
    return { ok: true, arteVersaoId: result.versaoId, token: result.token };
  } catch (e) {
    console.error("Erro ao enviar arte:", e);
    return {
      error: e instanceof Error ? e.message : "Erro ao salvar arquivo de arte.",
    };
  }
}

/**
 * Action chamada pela página pública /aprovacao/[token]. Não requer login —
 * a validação é pelo token (UUID) + validade.
 */
export async function aprovarArtePublica(
  token: string,
  decisao: "APROVADA" | "AJUSTE_SOLICITADO",
  comentario?: string,
): Promise<ArteActionResult> {
  const aprovacao = await prisma.aprovacaoArte.findUnique({
    where: { token },
    include: { pedido: { select: { id: true, status: true } } },
  });
  if (!aprovacao) return { error: "Link inválido." };
  if (aprovacao.status !== "PENDENTE") {
    return { error: "Esta arte já foi respondida." };
  }
  if (aprovacao.expiraEm < new Date()) {
    return { error: "Este link de aprovação expirou. Solicite um novo ao vendedor." };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const ua = hdrs.get("user-agent") ?? null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.aprovacaoArte.update({
        where: { id: aprovacao.id },
        data: {
          status: decisao,
          comentario: comentario?.trim() || null,
          respondidoEm: new Date(),
          respondidoIp: ip,
          respondidoUserAgent: ua,
        },
      });
      // Aprovou → libera produção. Pediu ajuste → volta pra aguardar arte.
      await tx.pedido.update({
        where: { id: aprovacao.pedidoId },
        data: {
          status: decisao === "APROVADA" ? "EM_PRODUCAO" : "AGUARDANDO_ARTE",
        },
      });
    });

    revalidatePath(`/pedidos/${aprovacao.pedidoId}`);
    return { ok: true };
  } catch {
    return { error: "Erro ao registrar resposta. Tente novamente." };
  }
}
