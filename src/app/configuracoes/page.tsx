import Link from "next/link";
import { Layers, Printer, Sparkles, MessageCircle, Building2 } from "lucide-react";
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
          description="Ajuste os dados da sua empresa, o catálogo de preços e os textos automáticos."
        />

        {/* DESTAQUE: Dados da empresa */}
        <Link href="/configuracoes/empresa" className="block group">
          <Card className="border-foreground bg-foreground text-background transition-colors group-hover:border-cyan group-hover:bg-foreground/95">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-background/80">
                  <Building2 className="size-6" />
                </div>
                <span className="label-eyebrow text-background/60">/00</span>
              </div>
              <CardTitle className="text-xl">Dados da empresa</CardTitle>
              <CardDescription className="text-background/70">
                Nome, CNPJ, endereço, telefone — aparecem no PDF e nas mensagens.
                Regras padrão: margem mínima, validade do orçamento, prefixos.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            desc="HP Látex, Ecossolvente, UV. Custo adicional por m²."
          />
          <ConfigCard
            href="/configuracoes/acabamentos"
            icon={<Sparkles className="size-5" />}
            title="Acabamentos"
            count={nAcabamentos}
            desc="Refile, corte contorno, laminação, resina."
          />
          <ConfigCard
            href="/configuracoes/templates"
            icon={<MessageCircle className="size-5" />}
            title="Templates"
            count={nTemplates}
            desc="Textos prontos para WhatsApp."
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
