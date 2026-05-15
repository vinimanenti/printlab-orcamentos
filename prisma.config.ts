/**
 * Prisma 7+ — configuração do schema, conexão e migrations.
 * Substitui o `datasource db { url = env(...) }` que existia no schema.prisma
 * em versões anteriores.
 *
 * - A URL do banco (lida do .env) é usada pelo Prisma Migrate e Prisma Studio.
 * - Em runtime, src/lib/prisma.ts cria um PrismaClient com `adapter` próprio
 *   (pg adapter), conforme exigido pelo Prisma 7.
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
