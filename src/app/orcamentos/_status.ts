import type { OrcamentoStatus } from "@prisma/client";

export type StatusInfo = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  desc: string;
};

/**
 * Apresentação dos status de orçamento.
 *
 * Estados do orçamento (conforme docs/02-fluxo-orcamento-pedido.md):
 *
 *   RASCUNHO ─► ENVIADO ─► EM_NEGOCIACAO ─► APROVADO ─► (vira pedido)
 *                                       └─► PERDIDO
 *                ↓
 *               CANCELADO
 *
 * Cores: APROVADO = cyan (sucesso identitário), PERDIDO = magenta (alerta
 * de perda), EM_NEGOCIACAO = yellow (atenção). Resto neutro.
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
    variant: "outline",
    className: "border-yellow text-yellow",
    desc: "Cliente pediu ajustes; novo retorno esperado.",
  },
  APROVADO: {
    label: "Aprovado",
    variant: "default",
    className: "bg-cyan hover:bg-cyan/90 text-white border-cyan",
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
  APROVADO: [],
  PERDIDO: ["RASCUNHO"],
  CANCELADO: ["RASCUNHO"],
};
