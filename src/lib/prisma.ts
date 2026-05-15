import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client singleton (Prisma 7+).
 *
 * Em dev, o HMR do Next.js reexecuta este módulo várias vezes; sem o singleton,
 * cada reload abriria uma nova conexão e estouraria o limite do banco.
 *
 * Em Prisma 7, a conexão é fornecida via driver adapter (não mais pelo
 * datasource block do schema). Aqui usamos o `pg` adapter, que funciona com
 * qualquer Postgres (Neon, Supabase, local, RDS, etc.).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
