import type { PedidoStatus, EtapaStatus, EtapaTipo } from "@prisma/client";

export type StatusInfo = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  desc: string;
};

/**
 * Estados do pedido (kanban de produção):
 *
 *   AGUARDANDO_ARTE → ARTE_EM_APROVACAO → EM_PRODUCAO → ACABAMENTO → PRONTO → ENTREGUE
 *                                                                        └─► CANCELADO
 *
 * Cores CMYK: PRONTO = cyan (sucesso), ENTREGUE = ink (concluído neutro),
 * ARTE_EM_APROVACAO = yellow (atenção - aguardando), CANCELADO = magenta.
 */
export const statusInfo: Record<PedidoStatus, StatusInfo> = {
  AGUARDANDO_ARTE: {
    label: "Aguardando arte",
    variant: "secondary",
    desc: "Aguardando arquivo do cliente ou criação da arte.",
  },
  ARTE_EM_APROVACAO: {
    label: "Arte em aprovação",
    variant: "outline",
    className: "border-yellow text-yellow",
    desc: "Cliente revisando a arte antes da produção.",
  },
  EM_PRODUCAO: {
    label: "Em produção",
    variant: "default",
    desc: "Sendo impresso na máquina.",
  },
  ACABAMENTO: {
    label: "Acabamento",
    variant: "default",
    desc: "Em recorte, laminação ou resina.",
  },
  PRONTO: {
    label: "Pronto",
    variant: "default",
    className: "bg-cyan hover:bg-cyan/90 text-white border-cyan",
    desc: "Acabado e embalado. Aguardando retirada/envio.",
  },
  ENTREGUE: {
    label: "Entregue",
    variant: "outline",
    desc: "Finalizado.",
  },
  CANCELADO: {
    label: "Cancelado",
    variant: "destructive",
    desc: "Pedido cancelado.",
  },
};

export const transicoesValidas: Record<PedidoStatus, PedidoStatus[]> = {
  AGUARDANDO_ARTE: ["ARTE_EM_APROVACAO", "EM_PRODUCAO", "CANCELADO"],
  ARTE_EM_APROVACAO: ["EM_PRODUCAO", "AGUARDANDO_ARTE", "CANCELADO"],
  EM_PRODUCAO: ["ACABAMENTO", "PRONTO", "CANCELADO"],
  ACABAMENTO: ["PRONTO", "EM_PRODUCAO"],
  PRONTO: ["ENTREGUE"],
  ENTREGUE: [],
  CANCELADO: ["AGUARDANDO_ARTE"],
};

export const etapaInfo: Record<EtapaTipo, { label: string; emoji: string }> = {
  IMPRESSAO: { label: "Impressão", emoji: "🖨️" },
  RECORTE: { label: "Recorte", emoji: "✂️" },
  LAMINACAO: { label: "Laminação", emoji: "📜" },
  RESINA: { label: "Resina", emoji: "💎" },
  ACABAMENTO: { label: "Acabamento", emoji: "✨" },
  EMBALAGEM: { label: "Embalagem", emoji: "📦" },
};

export const etapaStatusInfo: Record<EtapaStatus, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "text-muted-foreground" },
  EM_ANDAMENTO: { label: "Em andamento", color: "text-yellow" },
  CONCLUIDA: { label: "Concluída", color: "text-cyan" },
  PULADA: { label: "Pulada", color: "text-muted-foreground line-through" },
};

export const ordemStatusPedido: PedidoStatus[] = [
  "AGUARDANDO_ARTE",
  "ARTE_EM_APROVACAO",
  "EM_PRODUCAO",
  "ACABAMENTO",
  "PRONTO",
  "ENTREGUE",
  "CANCELADO",
];
