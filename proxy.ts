/**
 * Proxy do Next.js 16 — substitui o antigo middleware.ts.
 * Roda em todas as rotas listadas no `matcher` e bloqueia acesso anônimo
 * a rotas protegidas, redirecionando para /login.
 *
 * Faz apenas verificação otimista (lê o cookie de sessão NextAuth). A
 * checagem real de autorização acontece dentro de cada Server Action /
 * Server Component via verifySession() do DAL (src/lib/session.ts).
 */
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/aprovacao", // página pública de aprovação de arte (token na URL)
  "/api/auth", // endpoints do NextAuth
  "/_next",
  "/favicon",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // NextAuth v5 grava o JWT em authjs.session-token (ou __Secure-authjs.session-token em prod)
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie?.value) {
    const url = new URL("/login", req.nextUrl);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Não roda em assets estáticos. Tudo o que sobra é checado.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
