import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Perfil } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Module augmentation — adiciona campos customizados (id, perfil) ao
 * `session.user` e ao JWT. Mantém o resto da tipagem do NextAuth.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      perfil: Perfil;
    } & DefaultSession["user"];
  }
  interface User {
    perfil?: Perfil;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Estratégia JWT (cookie httpOnly assinado). Necessária com Credentials Provider.
  session: { strategy: "jwt" },
  // Páginas customizadas — login.
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.ativo) return null;

        const passwordOk = await bcrypt.compare(password, user.senhaHash);
        if (!passwordOk) return null;

        // Retorno usado para popular o JWT e a sessão
        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          perfil: user.perfil,
        };
      },
    }),
  ],
  callbacks: {
    // Embute id + perfil no JWT (cookie de sessão)
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // Campo extra customizado, salvo no JWT.
        (token as { perfil?: Perfil }).perfil = (user as { perfil?: Perfil }).perfil;
      }
      return token;
    },
    // Reidrata a sessão lida pelos componentes/server actions
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      const tokenPerfil = (token as { perfil?: Perfil }).perfil;
      if (tokenPerfil) session.user.perfil = tokenPerfil;
      return session;
    },
  },
});
