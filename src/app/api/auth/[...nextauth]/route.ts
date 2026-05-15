/**
 * Endpoint NextAuth v5. Reexporta os handlers gerados em src/lib/auth.ts.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
