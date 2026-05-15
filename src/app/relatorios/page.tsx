import Link from "next/link";
import { TrendingUp, FileText, Box, AlertTriangle, Users } from "lucide-react";
import { startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/calculadoras";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Relatórios" };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const user = await verifySession();
  const { periodo = "30d" } = await searchParams;

  // Determina janela do relatório
  const agora = new Date();
  const inicio =
    periodo === "mes"
      ? startOfMonth(agora)
      : periodo === "ano"
        ? new Date(agora.getFullYear(), 0, 1)
        : subDays(agora, 30);
  const fim = periodo === "mes" ? endOfMonth(agora) : agora;

  // Todas as queries em paralelo para ficar rápido
  const [
    pedidosNoPeriodo,
    pagamentosNoPeriodo,
    orcamentosTotais,
    orcamentosAprovados,
    pedidosAtrasados,
    topClientes,
    topMateriais,
    perdas,
  ] = await Promise.all([
    // Faturamento do período = soma dos totais de pedidos criados no período
    prisma.pedido.aggregate({
      where: { criadoEm: { gte: inicio, lte: fim }, status: { not: "CANCELADO" } },
      _sum: { total: true },
      _count: true,
    }),

    // Total efetivamente recebido no período (pagamentos PAGO)
    prisma.pagamento.aggregate({
      where: { status: "PAGO", pagoEm: { gte: inicio, lte: fim } },
      _sum: { valor: true },
      _count: true,
    }),

    prisma.orcamento.count({
      where: { criadoEm: { gte: inicio, lte: fim } },
    }),
    prisma.orcamento.count({
      where: { criadoEm: { gte: inicio, lte: fim }, status: "APROVADO" },
    }),

    prisma.pedido.findMany({
      where: {
        prazoEntrega: { lt: agora },
        status: { notIn: ["ENTREGUE", "CANCELADO"] },
      },
      select: {
        id: true,
        numero: true,
        prazoEntrega: true,
        cliente: { select: { nome: true } },
      },
      orderBy: { prazoEntrega: "asc" },
      take: 10,
    }),

    // Top 5 clientes por valor pago no período
    prisma.pagamento.groupBy({
      by: ["pedidoId"],
      where: { status: "PAGO", pagoEm: { gte: inicio, lte: fim } },
      _sum: { valor: true },
    }),

    // Top 5 materiais mais usados em itens no período
    prisma.orcamentoItem.groupBy({
      by: ["materialId"],
      where: {
        orcamento: { criadoEm: { gte: inicio, lte: fim } },
        materialId: { not: null },
      },
      _sum: { areaTotalM2: true, precoTotal: true },
      _count: true,
      orderBy: { _sum: { areaTotalM2: "desc" } },
      take: 5,
    }),

    // Motivos de perda no período (orçamentos com status PERDIDO)
    prisma.orcamento.groupBy({
      by: ["motivoPerdaId"],
      where: {
        criadoEm: { gte: inicio, lte: fim },
        status: "PERDIDO",
      },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  // Resolve nomes dos materiais
  const materialIds = topMateriais.map((m) => m.materialId).filter(Boolean) as string[];
  const materiaisInfo = await prisma.material.findMany({
    where: { id: { in: materialIds } },
    select: { id: true, nome: true },
  });
  const nomeMaterial = new Map(materiaisInfo.map((m) => [m.id, m.nome]));

  // Resolve top clientes
  const pedidoIds = topClientes.map((p) => p.pedidoId);
  const pedidosDosTops = await prisma.pedido.findMany({
    where: { id: { in: pedidoIds } },
    select: { id: true, clienteId: true, cliente: { select: { nome: true } } },
  });
  const valorPorCliente = new Map<string, { nome: string; valor: number }>();
  for (const p of topClientes) {
    const ped = pedidosDosTops.find((pd) => pd.id === p.pedidoId);
    if (!ped) continue;
    const atual = valorPorCliente.get(ped.clienteId);
    valorPorCliente.set(ped.clienteId, {
      nome: ped.cliente.nome,
      valor: (atual?.valor ?? 0) + Number(p._sum.valor ?? 0),
    });
  }
  const topClientesArr = [...valorPorCliente.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // Resolve motivos de perda
  const motivoIds = perdas.map((p) => p.motivoPerdaId).filter(Boolean) as string[];
  const motivosInfo = await prisma.motivoPerda.findMany({
    where: { id: { in: motivoIds } },
    select: { id: true, nome: true },
  });
  const nomeMotivo = new Map(motivosInfo.map((m) => [m.id, m.nome]));

  // KPIs
  const faturamento = Number(pedidosNoPeriodo._sum.total ?? 0);
  const recebido = Number(pagamentosNoPeriodo._sum.valor ?? 0);
  const taxaConversao =
    orcamentosTotais > 0 ? (orcamentosAprovados / orcamentosTotais) * 100 : 0;

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Relatórios" }]} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          eyebrow="Gerência"
          title="Relatórios"
          description={
            <>
              {format(inicio, "dd 'de' MMM", { locale: ptBR })} —{" "}
              {format(fim, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </>
          }
          actions={
            <div className="flex gap-2 text-sm">
              {[
                { key: "30d", label: "30 dias" },
                { key: "mes", label: "Mês" },
                { key: "ano", label: "Ano" },
              ].map((p) => (
                <Link
                  key={p.key}
                  href={`/relatorios?periodo=${p.key}`}
                  className={`px-3 py-1.5 rounded-md border text-xs uppercase tracking-wider font-semibold ${
                    periodo === p.key
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          }
        />

        {/* ============ KPI CARDS ============ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<TrendingUp className="size-5 text-emerald-600" />}
            label="Faturamento"
            value={formatBRL(faturamento)}
            sub={`${pedidosNoPeriodo._count} pedido(s) no período`}
          />
          <KpiCard
            icon={<TrendingUp className="size-5 text-blue-600" />}
            label="Recebido"
            value={formatBRL(recebido)}
            sub={`${pagamentosNoPeriodo._count} pagamento(s) confirmado(s)`}
          />
          <KpiCard
            icon={<FileText className="size-5" />}
            label="Taxa de conversão"
            value={`${taxaConversao.toFixed(0)}%`}
            sub={`${orcamentosAprovados} aprov. de ${orcamentosTotais} orçamento(s)`}
          />
          <KpiCard
            icon={<AlertTriangle className="size-5 text-amber-600" />}
            label="Pedidos atrasados"
            value={String(pedidosAtrasados.length)}
            sub={pedidosAtrasados.length > 0 ? "ver tabela abaixo" : "tudo em dia"}
          />
        </div>

        {/* ============ TOP CLIENTES + TOP MATERIAIS ============ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4" /> Top clientes (recebido)
              </CardTitle>
              <CardDescription>Por valor efetivamente pago no período.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {topClientesArr.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-4">
                  Nenhum pagamento confirmado no período.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Cliente</TableHead>
                      <TableHead className="text-right pr-6">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClientesArr.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="pl-6 font-medium">{c.nome}</TableCell>
                        <TableCell className="text-right pr-6 tabular-nums font-medium">
                          {formatBRL(c.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Box className="size-4" /> Top materiais (área usada)
              </CardTitle>
              <CardDescription>
                Materiais mais consumidos por área (m²) em orçamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {topMateriais.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-4">
                  Sem orçamentos no período.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Material</TableHead>
                      <TableHead className="text-right">Área</TableHead>
                      <TableHead className="text-right pr-6">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topMateriais.map((m) => (
                      <TableRow key={m.materialId ?? "_"}>
                        <TableCell className="pl-6 font-medium">
                          {m.materialId ? nomeMaterial.get(m.materialId) ?? "—" : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {Number(m._sum.areaTotalM2 ?? 0).toFixed(2)} m²
                        </TableCell>
                        <TableCell className="text-right pr-6 tabular-nums font-medium">
                          {formatBRL(Number(m._sum.precoTotal ?? 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============ MOTIVOS DE PERDA ============ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivos de perda</CardTitle>
            <CardDescription>
              Orçamentos marcados como PERDIDO no período, agrupados pelo motivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {perdas.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-4">
                Nenhum orçamento perdido no período. 🎉
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Motivo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right pr-6">Valor perdido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perdas
                    .sort((a, b) => Number(b._sum.total ?? 0) - Number(a._sum.total ?? 0))
                    .map((p) => (
                      <TableRow key={p.motivoPerdaId ?? "_"}>
                        <TableCell className="pl-6 font-medium">
                          {p.motivoPerdaId ? nomeMotivo.get(p.motivoPerdaId) ?? "—" : "Não informado"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p._count}</TableCell>
                        <TableCell className="text-right pr-6 tabular-nums text-muted-foreground">
                          {formatBRL(Number(p._sum.total ?? 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ============ PEDIDOS ATRASADOS ============ */}
        {pedidosAtrasados.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" /> Pedidos atrasados
              </CardTitle>
              <CardDescription>
                Prazo de entrega já passou e ainda não foram concluídos.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="pr-6">Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosAtrasados.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6 font-mono tabular-nums">#{p.numero}</TableCell>
                      <TableCell>
                        <Link href={`/pedidos/${p.id}`} className="hover:underline">
                          {p.cliente.nome}
                        </Link>
                      </TableCell>
                      <TableCell className="pr-6">
                        <Badge variant="destructive">
                          {p.prazoEntrega && format(p.prazoEntrega, "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          {icon}
        </div>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {sub && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </CardContent>
      )}
    </Card>
  );
}
