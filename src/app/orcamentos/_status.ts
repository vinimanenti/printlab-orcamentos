import type { OrcamentoStatus } from "@prisma/client";

export type StatusInfo = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  desc: string;
};

/**
 * Apresentação dos status de orçamento — label em PT-BR, badge variant
 * e uma descrição curta usada em tooltip ou tela de detalhe.
 *
 * Estados do orçamento (conforme docs/02-fluxo-orcamento-pedido.md):
 *
 *   RASCUNHO ─► ENVIADO ─► EM_NEGOCIACAO ─► APROVADO ─► (vira pedido)
 *                                       └─► PERDIDO
 *                ↓
 *               CANCELADO
 */
export const statusInfo: Record<OrcamentoStatus, StatusInfo> = {
  RASCUNHO: {
    label: "Rascunho",
    variant: "secondary",
    desc: "Em construção; ainda não enviado ao cliente.",
  },
  ENVIADO: {
    label: "Enviado",
    variant: "default",
    desc: "Encaminhado ao cliente, aguardando retorno.",
  },
  EM_NEGOCIACAO: {
    label: "Em negociação",
    variant: "default",
    desc: "Cliente pediu ajustes; novo retorno esperado.",
  },
  APROVADO: {
    label: "Aprovado",
    variant: "default",
    desc: "Cliente aprovou. Pronto para virar pedido.",
  },
  PERDIDO: {
    label: "Perdido",
    variant: "destructive",
    desc: "Cliente recusou ou desistiu.",
  },
  CANCELADO: {
    label: "Cancelado",
    variant: "outline",
    desc: "Cancelado pelo vendedor antes do envio.",
  },
};

/** Transições permitidas a partir de cada status. */
export const transicoesValidas: Record<OrcamentoStatus, OrcamentoStatus[]> = {
  RASCUNHO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["EM_NEGOCIACAO", "APROVADO", "PERDIDO"],
  EM_NEGOCIACAO: ["ENVIADO", "APROVADO", "PERDIDO"],
  APROVADO: [], // só pode virar pedido — fluxo coberto na Fase 2
  PERDIDO: ["RASCUNHO"], // permite reabrir como rascunho
  CANCELADO: ["RASCUNHO"],
};
