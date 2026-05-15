import Link from "next/link";
import { verifySession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function DashboardPage() {
  const user = await verifySession();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">PrintLab Orçamentos</h1>
            <p className="text-sm text-muted-foreground">Olá, {user.nome}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PlaceholderCard label="Orçamentos hoje" value="—" />
          <PlaceholderCard label="Orçamentos no mês" value="—" />
          <PlaceholderCard label="Pedidos em aberto" value="—" />
          <PlaceholderCard label="Vendido no mês" value="R$ —" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fase 1 do MVP em construção</CardTitle>
            <CardDescription>
              O sistema está no esqueleto inicial. Próximas telas a entrar no ar:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm">
              <li>• Clientes (cadastro e busca)</li>
              <li>• Orçamentos (novo, listar, PDF)</li>
              <li>• Calculadora de adesivos</li>
              <li>• Configurações (materiais, impressões, acabamentos)</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Plano completo em{" "}
              <Link
                className="underline"
                href="https://github.com/vinimanenti/printlab-orcamentos/tree/main/docs"
              >
                /docs no repositório
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PlaceholderCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
