import Link from "next/link";
import { Layers, Printer, Sparkles, MessageCircle } from "lucide-react";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const user = await verifySession();
  const [nMateriais, nImpressoes, nAcabamentos, nTemplates] = await Promise.all([
    prisma.material.count(),
    prisma.tipoImpressao.count(),
    prisma.acabamento.count(),
    prisma.mensagemTemplate.count(),
  ]);

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Configurações" }]} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          eyebrow="Sistema"
          title="Configurações"
          description="Ajuste o catálogo e os preços que alimentam a calculadora."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ConfigCard
            href="/configuracoes/materiais"
            icon={<Layers className="size-5" />}
            title="Materiais"
            count={nMateriais}
            desc="Vinis, lonas, papéis. Preço por m² e largura da bobina."
          />
          <ConfigCard
            href="/configuracoes/impressoes"
            icon={<Printer className="size-5" />}
            title="Tipos de impressão"
            count={nImpressoes}
            desc="HP Látex, Ecossolvente, UV, Sem impressão. Custo adicional por m²."
          />
          <ConfigCard
            href="/configuracoes/acabamentos"
            icon={<Sparkles className="size-5" />}
            title="Acabamentos"
            count={nAcabamentos}
            desc="Refile, corte contorno, laminação, resina. Cobrança por m² ou fixa."
          />
          <ConfigCard
            href="/configuracoes/templates"
            icon={<MessageCircle className="size-5" />}
            title="Templates de mensagem"
            count={nTemplates}
            desc="Textos prontos para WhatsApp. Edite sem mexer no código."
          />
        </div>
      </main>
    </div>
  );
}

function ConfigCard({
  href,
  icon,
  title,
  count,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  count: number;
  desc: string;
}) {
  return (
    <Link href={href} className="block group">
      <Card className="transition-colors group-hover:border-foreground/30 h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">{icon}</div>
            <span className="text-xs text-muted-foreground tabular-nums">{count} itens</span>
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
