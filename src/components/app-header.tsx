import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/session";

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export type Crumb = { href?: string; label: string };

/**
 * Header padrão das páginas autenticadas. Mostra:
 *  - Marca PrintLab Orçamentos (link p/ dashboard)
 *  - Breadcrumb opcional
 *  - Nome do usuário + botão sair
 */
export function AppHeader({
  user,
  breadcrumbs = [],
}: {
  user: SessionUser;
  breadcrumbs?: Crumb[];
}) {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="font-semibold text-base sm:text-lg truncate">
            PrintLab Orçamentos
          </Link>
          {breadcrumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2 text-sm text-muted-foreground truncate">
              <ChevronRight className="size-3.5 shrink-0" />
              {c.href ? (
                <Link href={c.href} className="hover:underline truncate">
                  {c.label}
                </Link>
              ) : (
                <span className="truncate">{c.label}</span>
              )}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user.nome}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
