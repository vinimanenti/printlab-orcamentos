import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { Perfil } from "@prisma/client";
import { auth } from "./auth";

/**
 * Data Access Layer (DAL) para sessão.
 *
 * Use `verifySession()` em Server Components, Server Actions e Route Handlers
 * para garantir que o usuário está autenticado antes de buscar/mutar dados.
 *
 * O `cache()` do React memoiza o resultado dentro de uma mesma render pass,
 * evitando múltiplas leituras do JWT.
 *
 * Padrão recomendado pelo guia oficial de autenticação do Next.js 16
 * (node_modules/next/dist/docs/01-app/02-guides/authentication.md).
 */

export type SessionUser = {
  id: string;
  email: string;
  nome: string;
  perfil: Perfil;
};

export const verifySession = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    nome: session.user.name ?? "",
    perfil: session.user.perfil,
  };
});

/**
 * Variante que retorna null em vez de redirecionar (útil em layouts/headers).
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    nome: session.user.name ?? "",
    perfil: session.user.perfil,
  };
});

/**
 * Exige um perfil específico (ou maior). Redireciona para /sem-permissao caso contrário.
 */
export async function requirePerfil(...perfisAceitos: Perfil[]): Promise<SessionUser> {
  const user = await verifySession();
  if (!perfisAceitos.includes(user.perfil)) {
    redirect("/sem-permissao");
  }
  return user;
}

export function isAdmin(user: { perfil: Perfil } | null | undefined): boolean {
  return user?.perfil === "ADM";
}

/**
 * Helper de filtro por vendedor.
 *
 * Quando o usuário logado é VEN, retorna `{ vendedorId: user.id }` —
 * limita queries pra só mostrar dados do próprio vendedor.
 *
 * Para qualquer outro perfil (ADM, FIN, PRO) retorna objeto vazio,
 * que ao ser espalhado em `where: { ...filtro }` não restringe nada.
 *
 * Uso típico:
 *   const where = { ...vendedorFilter(user), status: 'ENVIADO' };
 *   await prisma.orcamento.findMany({ where });
 */
export function vendedorFilter(
  user: SessionUser,
): { vendedorId: string } | Record<string, never> {
  return user.perfil === "VEN" ? { vendedorId: user.id } : {};
}

/**
 * Indica se o usuário tem acesso a este pedido/orçamento.
 * Use em páginas de detalhe pra dar 404 quando VEN tenta ver de outro.
 */
export function podeVer(
  user: SessionUser,
  entidade: { vendedorId: string },
): boolean {
  if (user.perfil === "VEN") return entidade.vendedorId === user.id;
  return true; // ADM, FIN, PRO veem tudo
}
