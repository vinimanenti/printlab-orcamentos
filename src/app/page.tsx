import Link from "next/link";
import {
  Calculator,
  Settings,
  Users,
  FileText,
  Box,
  Kanban,
  TrendingUp,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { verifySession, vendedorFilter } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/calculadoras";
import { startOfDay, startOfMonth } from "date-fns";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await verifySession();
  const agora = new Date();
  const inicioDia = startOfDay(agora);
  const inicioMes = startOfMonth(agora);
  const filtroVendedor = vendedorFilter(user);
  const isVendedor = user.perfil === "VEN";

  // KPIs em paralelo — VEN só conta dele mesmo, ADM/FIN/PRO contam tudo
  const [orcDia, orcMes, pedidosAbertos, pedidosAtrasados, vendidoMes] =
    await Promise.all([
      prisma.orcamento.count({
        where: { ...filtroVendedor, criadoEm: { gte: inicioDia } },
      }),
      prisma.orcamento.count({
        where: { ...filtroVendedor, criadoEm: { gte: inicioMes } },
      }),
      prisma.pedido.count({
        where: { ...filtroVendedor, status: { notIn: ["ENTREGUE", "CANCELADO"] } },
      }),
      prisma.pedido.count({
        where: {
          ...filtroVendedor,
          prazoEntrega: { lt: agora },
          status: { notIn: ["ENTREGUE", "CANCELADO"] },
        },
      }),
      prisma.pedido.aggregate({
        where: {
          ...filtroVendedor,
          criadoEm: { gte: inicioMes },
          status: { not: "CANCELADO" },
        },
        _sum: { total: true },
      }),
    ]);

  const vendidoMesValor = Number(vendidoMes._sum.total ?? 0);

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10">
        {/* ============= HERO EDITORIAL ============= */}
        <section className="space-y-2">
          <p className="label-eyebrow text-muted-foreground">
            {format(agora, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <h1 className="display-xl">
            Olá, <span className="text-cyan">{user.nome.split(" ")[0]}</span>.
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Aqui está o panorama da PrintLab agora. Clique em qualquer card para
            agir.
          </p>
        </section>

        {/* ============= KPIs INDICADORES ============= */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="label-eyebrow">
              {isVendedor ? "Meus indicadores" : "Indicadores da equipe"}
            </h2>
            <span className="label-eyebrow text-muted-foreground">
              hoje · {format(agora, "HH:mm")}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-border rule-thick rounded-md border border-foreground overflow-hidden">
            <Kpi
              label={isVendedor ? "Meus orç. hoje" : "Orçamentos hoje"}
              value={String(orcDia)}
            />
            <Kpi
              label={isVendedor ? "Meus orç. no mês" : "Orçamentos no mês"}
              value={String(orcMes)}
            />
            <Kpi
              label={isVendedor ? "Meus pedidos abertos" : "Pedidos em aberto"}
              value={String(pedidosAbertos)}
            />
            <Kpi
              label={isVendedor ? "Meus atrasados" : "Atrasados"}
              value={String(pedidosAtrasados)}
              accent={pedidosAtrasados > 0 ? "magenta" : undefined}
            />
            <Kpi
              label={isVendedor ? "Vendi no mês" : "Vendido no mês"}
              value={formatBRL(vendidoMesValor)}
              mono
            />
          </div>
        </section>

        {/* ============= ACESSO RÁPIDO ============= */}
        <section>
          <h2 className="label-eyebrow mb-3">Acesso rápido</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NavCard
              href="/orcamentos/novo"
              n="01"
              icon={<FileText className="size-4" />}
              title="Novo orçamento"
              desc="Calculadora embutida, multi-item, gera PDF e link WhatsApp."
              primary
            />
            <NavCard
              href="/orcamentos"
              n="02"
              icon={<FileText className="size-4" />}
              title="Orçamentos"
              desc="Lista, filtros, status e conversão."
            />
            <NavCard
              href="/pedidos"
              n="03"
              icon={<Box className="size-4" />}
              title="Pedidos"
              desc="Em produção, prazos, etapas, pagamentos."
            />
            <NavCard
              href="/producao"
              n="04"
              icon={<Kanban className="size-4" />}
              title="Kanban"
              desc="Visão de produção em colunas."
            />
            <NavCard
              href="/calculadora"
              n="05"
              icon={<Calculator className="size-4" />}
              title="Calculadora"
              desc="Cotação rápida — m² ou cartela."
            />
            <NavCard
              href="/clientes"
              n="06"
              icon={<Users className="size-4" />}
              title="Clientes"
              desc="Cadastro e busca."
            />
            <NavCard
              href="/comissoes"
              n="07"
              icon={<Wallet className="size-4" />}
              title={isVendedor ? "Minhas comissões" : "Comissões"}
              desc={
                isVendedor
                  ? "Suas comissões a receber e pagas."
                  : "Comissões dos vendedores."
              }
            />
            <NavCard
              href="/relatorios"
              n="08"
              icon={<TrendingUp className="size-4" />}
              title="Relatórios"
              desc="Faturamento, conversão, top materiais."
            />
            <NavCard
              href="/configuracoes"
              n="09"
              icon={<Settings className="size-4" />}
              title="Configurações"
              desc="Catálogo de preços e templates."
            />
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between text-xs label-eyebrow text-muted-foreground">
          <span>PrintLab Orçamentos · v0.1</span>
          <span>
            Plano em{" "}
            <Link
              href="https://github.com/vinimanenti/printlab-orcamentos/tree/main/docs"
              className="underline hover:text-foreground"
            >
              /docs
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

function Kpi({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "cyan" | "magenta" | "yellow";
}) {
  const accentClass =
    accent === "magenta"
      ? "text-magenta"
      : accent === "cyan"
        ? "text-cyan"
        : accent === "yellow"
          ? "text-yellow"
          : "";
  return (
    <div className="p-4 sm:p-5 bg-card">
      <p className="label-eyebrow">{label}</p>
      <p
        className={`mt-2 text-2xl sm:text-3xl tabular-nums font-semibold tracking-tight ${
          mono ? "font-mono" : ""
        } ${accentClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function NavCard({
  href,
  n,
  icon,
  title,
  desc,
  primary,
}: {
  href: string;
  n: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="block group">
      <Card
        className={`h-full transition-all duration-150 ${
          primary
            ? "bg-foreground text-background border-foreground hover:border-cyan"
            : "hover:border-foreground/40"
        }`}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-xs ${primary ? "text-background/60" : "text-muted-foreground"}`}
            >
              /{n}
            </span>
            <span className={primary ? "text-background/60" : "text-muted-foreground"}>
              {icon}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <ArrowRight
              className={`size-4 shrink-0 transition-transform group-hover:translate-x-1 ${
                primary ? "text-background/80" : "text-muted-foreground"
              }`}
            />
          </div>
          <CardDescription
            className={primary ? "text-background/70" : "text-muted-foreground"}
          >
            {desc}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
