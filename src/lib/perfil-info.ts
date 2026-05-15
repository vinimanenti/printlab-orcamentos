import type { Perfil } from "@prisma/client";

/**
 * Constantes de apresentação dos perfis de usuário.
 * Em arquivo separado porque actions.ts ("use server") só pode
 * exportar funções async — objetos quebram a regra.
 */

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
