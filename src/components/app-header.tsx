import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/session";
import { PrintLabMark } from "@/components/brand/printlab-mark";

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export type Crumb = { href?: string; label: string };

/**
 * Header editorial PrintLab — marca oficial + breadcrumb + usuário.
 */
export function AppHeader({
  user,
  breadcrumbs = [],
}: {
  user: SessionUser;
  breadcrumbs?: Crumb[];
}) {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="shrink-0" aria-label="PrintLab — início">
            <PrintLabMark variant="wordmark" size="sm" />
          </Link>

          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-sm min-w-0 ml-1 pl-3 border-l border-border">
              {breadcrumbs.map((c, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 text-muted-foreground truncate"
                >
                  {i > 0 && <ChevronRight className="size-3 shrink-0 opacity-40" />}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-foreground transition-colors truncate">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground truncate">{c.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/perfil"
            className="hidden sm:flex flex-col items-end leading-none group"
            title="Meu perfil"
          >
            <span className="label-eyebrow group-hover:text-foreground transition-colors">
              Operador
            </span>
            <span className="text-sm font-semibold mt-0.5 group-hover:underline">
              {user.nome}
            </span>
          </Link>
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
