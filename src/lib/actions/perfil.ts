"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export type SenhaActionResult = { ok: true } | { error: string; field?: "atual" | "nova" };

const schema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z
      .string()
      .min(8, "A nova senha precisa ter no mínimo 8 caracteres.")
      .max(72, "Senha muito longa.")
      .refine((s) => /[A-Za-z]/.test(s), "A senha deve conter pelo menos uma letra.")
      .refine((s) => /[0-9]/.test(s), "A senha deve conter pelo menos um número."),
    confirmacao: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((d) => d.novaSenha === d.confirmacao, {
    message: "A confirmação não bate com a nova senha.",
    path: ["confirmacao"],
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    message: "A nova senha precisa ser diferente da atual.",
    path: ["novaSenha"],
  });

/**
 * Altera a senha do usuário logado.
 *
 * Fluxo:
 *   1. Valida campos (zod) — devolve erro se senha curta/sem números/etc.
 *   2. Confere a senha atual contra o hash do banco (bcrypt.compare).
 *   3. Hash da nova senha (bcrypt 12 rounds, mesmo do seed).
 *   4. Update no User.
 *
 * Não invalida a sessão atual — o usuário continua logado.
 */
export async function alterarSenha(
  _prev: SenhaActionResult | undefined,
  formData: FormData,
): Promise<SenhaActionResult> {
  const session = await verifySession();

  const parsed = schema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return {
      error: issue?.message ?? "Dados inválidos.",
      field: field === "senhaAtual" ? "atual" : "nova",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { senhaHash: true },
  });
  if (!user) return { error: "Sessão inválida. Faça login de novo." };

  const senhaOk = await bcrypt.compare(parsed.data.senhaAtual, user.senhaHash);
  if (!senhaOk) {
    return { error: "Senha atual incorreta.", field: "atual" };
  }

  const novoHash = await bcrypt.hash(parsed.data.novaSenha, 12);
  await prisma.user.update({
    where: { id: session.id },
    data: { senhaHash: novoHash },
  });

  return { ok: true };
}
