"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export type LoginState = {
  error?: string;
  fields?: Partial<{ email: string }>;
} | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      fields: { email: String(formData.get("email") ?? "") },
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      // redirectTo trata a navegação no fim do fluxo
      redirectTo: String(formData.get("next") ?? "/"),
    });
    // Inalcançável: signIn lança redirect quando bem-sucedido.
    return undefined;
  } catch (error) {
    // Repropaga redirects do Next.js (NEXT_REDIRECT é o caminho feliz)
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof AuthError) {
      return {
        error: "E-mail ou senha incorretos.",
        fields: { email: parsed.data.email },
      };
    }
    return {
      error: "Erro ao entrar. Tente novamente.",
      fields: { email: parsed.data.email },
    };
  }
}
