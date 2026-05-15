import Link from "next/link";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { CalculadoraForm } from "./calculadora-form";

export const metadata = { title: "Calculadora" };

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function CalculadoraPage() {
  const user = await verifySession();

  // Carrega catálogo do banco. Decimais do Prisma viram number para serializar
  // no boundary Server → Client. Filtra apenas itens ativos.
  const [materiaisRaw, impressoesRaw, acabamentosRaw, config] = await Promise.all([
    prisma.material.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.tipoImpressao.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.acabamento.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.configuracaoSistema.findUnique({ where: { id: "singleton" } }),
  ]);

  const materiais = materiaisRaw.map((m) => ({
    id: m.id,
    nome: m.nome,
    precoM2: Number(m.precoM2),
    larguraBobinaCm: Number(m.larguraBobinaCm),
  }));
  const impressoes = impressoesRaw.map((i) => ({
    id: i.id,
    nome: i.nome,
    precoM2: Number(i.precoM2),
  }));
  const acabamentos = acabamentosRaw.map((a) => ({
    id: a.id,
    nome: a.nome,
    precoM2: a.precoM2 ? Number(a.precoM2) : null,
    precoFixo: a.precoFixo ? Number(a.precoFixo) : null,
  }));

  const margemMinimaPct = config ? Number(config.margemMinimaPct) : 20;
  const empresaNome = config?.empresaNome ?? "PrintLab";

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <Link href="/" className="text-xl font-semibold">
              PrintLab Orçamentos
            </Link>
            <span className="text-sm text-muted-foreground">/ Calculadora</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.nome}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <CalculadoraForm
          materiais={materiais}
          impressoes={impressoes}
          acabamentos={acabamentos}
          margemMinimaPct={margemMinimaPct}
          empresaNome={empresaNome}
        />
      </main>
    </div>
  );
}
