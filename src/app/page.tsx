import Link from "next/link";
import { Calculator, Settings, Users } from "lucide-react";
import { verifySession } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await verifySession();

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Olá, {user.nome}</h1>
          <p className="text-muted-foreground">O que você quer fazer agora?</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashCard
            href="/calculadora"
            icon={<Calculator className="size-5" />}
            title="Calculadora de adesivos"
            desc="Preço por medida, material e acabamento. Texto pronto pro WhatsApp."
          />
          <DashCard
            href="/configuracoes"
            icon={<Settings className="size-5" />}
            title="Configurações"
            desc="Materiais, tipos de impressão e acabamentos do catálogo."
          />
          <DashCard
            href="/clientes"
            icon={<Users className="size-5" />}
            title="Clientes"
            desc="Cadastro, busca e edição. Vinculam-se aos orçamentos."
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fase 1 do MVP</CardTitle>
            <CardDescription>
              Em construção. As funcionalidades a seguir entram no ar uma a uma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm">
              <li>✅ Login e perfis</li>
              <li>✅ Calculadora de adesivos</li>
              <li>✅ Configurações de materiais/impressões/acabamentos</li>
              <li>✅ Clientes (cadastro e busca)</li>
              <li>⏳ Orçamentos persistidos com numeração</li>
              <li>⏳ PDF do orçamento</li>
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

function DashCard({
  href,
  icon,
  title,
  desc,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  const card = (
    <Card
      className={
        disabled
          ? "opacity-50 cursor-not-allowed h-full"
          : "transition-colors group-hover:border-foreground/30 h-full"
      }
    >
      <CardHeader>
        <div className="text-muted-foreground">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
    </Card>
  );
  return disabled ? card : (
    <Link href={href} className="block group">
      {card}
    </Link>
  );
}
