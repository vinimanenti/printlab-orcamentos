import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/calculadoras";
import { ComissaoActions, MarcarTodasPagas } from "./comissao-actions";

export const metadata = { title: "Comissões" };

const STATUS_INFO = {
  PENDENTE: { label: "Pendente", className: "border-yellow text-yellow" },
  PAGA: { label: "Paga", className: "bg-cyan text-white border-cyan" },
  CANCELADA: { label: "Cancelada", className: "" },
} as const;

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; vendedor?: string }>;
}) {
  const me = await verifySession();
  // PRO não tem o que fazer aqui (não vê valores)
  if (me.perfil === "PRO") redirect("/sem-permissao");

  const { status = "todos", vendedor: vendedorParam } = await searchParams;
  const isVendedor = me.perfil === "VEN";
  const isFinanceiro = me.perfil === "ADM" || me.perfil === "FIN";

  const where = {
    AND: [
      // VEN sempre vê só as próprias
      isVendedor ? { vendedorId: me.id } : {},
      vendedorParam && !isVendedor ? { vendedorId: vendedorParam } : {},
      status !== "todos"
        ? { status: status as "PENDENTE" | "PAGA" | "CANCELADA" }
        : {},
    ],
  };

  const [comissoes, totaisPorStatus, vendedores] = await Promise.all([
    prisma.comissao.findMany({
      where,
      include: {
        pedido: {
          select: {
            numero: true,
            id: true,
            cliente: { select: { nome: true } },
          },
        },
        vendedor: { select: { id: true, nome: true } },
      },
      orderBy: [{ status: "asc" }, { criadaEm: "desc" }],
      take: 200,
    }),
    prisma.comissao.groupBy({
      by: ["status"],
      where: isVendedor ? { vendedorId: me.id } : {},
      _sum: { valorComissao: true },
      _count: true,
    }),
    isFinanceiro
      ? prisma.user.findMany({
          where: { perfil: "VEN", comissaoPct: { gt: 0 } },
          select: { id: true, nome: true },
          orderBy: { nome: "asc" },
        })
      : [],
  ]);

  const totaisMap = new Map(
    totaisPorStatus.map((t) => [t.status, { soma: Number(t._sum.valorComissao ?? 0), n: t._count }]),
  );
  const totalPendente = totaisMap.get("PENDENTE")?.soma ?? 0;
  const totalPaga = totaisMap.get("PAGA")?.soma ?? 0;
  const nPendente = totaisMap.get("PENDENTE")?.n ?? 0;

  const filtros = [
    { key: "todos", label: "Todas" },
    { key: "PENDENTE", label: "Pendentes" },
    { key: "PAGA", label: "Pagas" },
    { key: "CANCELADA", label: "Canceladas" },
  ] as const;

  return (
    <div className="min-h-screen">
      <AppHeader user={me} breadcrumbs={[{ label: "Comissões" }]} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow={isVendedor ? "Minhas comissões" : "Financeiro"}
          title={isVendedor ? "Minhas comissões" : "Comissões"}
          description={
            isVendedor
              ? "Comissões geradas automaticamente quando seus pedidos são entregues."
              : "Comissões geradas quando pedidos viram ENTREGUE. Confirme o pagamento depois do fechamento mensal."
          }
        />

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendentes a pagar</CardDescription>
              <CardTitle className="text-2xl tabular-nums text-yellow">
                {formatBRL(totalPendente)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {nPendente} {nPendente === 1 ? "comissão" : "comissões"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Já pagas</CardDescription>
              <CardTitle className="text-2xl tabular-nums text-cyan">
                {formatBRL(totalPaga)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total geral</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatBRL(totalPendente + totalPaga)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 text-sm">
          {filtros.map((f) => (
            <Link
              key={f.key}
              href={`/comissoes?status=${f.key}${
                vendedorParam && !isVendedor ? `&vendedor=${vendedorParam}` : ""
              }`}
              className={`px-3 py-1.5 rounded-md border ${
                status === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          ))}

          {isFinanceiro && vendedores.length > 0 && (
            <>
              <span className="px-2 text-muted-foreground self-center">·</span>
              <Link
                href={`/comissoes${status !== "todos" ? `?status=${status}` : ""}`}
                className={`px-3 py-1.5 rounded-md border ${
                  !vendedorParam
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card hover:bg-muted"
                }`}
              >
                Todos vendedores
              </Link>
              {vendedores.map((v) => (
                <Link
                  key={v.id}
                  href={`/comissoes?vendedor=${v.id}${
                    status !== "todos" ? `&status=${status}` : ""
                  }`}
                  className={`px-3 py-1.5 rounded-md border ${
                    vendedorParam === v.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  {v.nome.split(" ")[0]}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Ação em lote */}
        {isFinanceiro && vendedorParam && nPendente > 0 && (
          <div className="bg-muted/40 rounded-md p-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm">
              <strong>
                {comissoes.filter((c) => c.status === "PENDENTE" && c.vendedorId === vendedorParam).length}
              </strong>{" "}
              comissões pendentes para este vendedor.
            </p>
            <MarcarTodasPagas vendedorId={vendedorParam} />
          </div>
        )}

        {/* Tabela */}
        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                {!isVendedor && <TableHead>Vendedor</TableHead>}
                <TableHead className="text-right">Total pedido</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                {isFinanceiro && <TableHead className="w-24"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isVendedor ? 7 : isFinanceiro ? 9 : 8}
                    className="text-center text-muted-foreground py-12"
                  >
                    Nenhuma comissão neste filtro.
                  </TableCell>
                </TableRow>
              ) : (
                comissoes.map((c) => {
                  const info = STATUS_INFO[c.status];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/pedidos/${c.pedido.id}`} className="hover:underline">
                          #{String(c.pedido.numero).padStart(4, "0")}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{c.pedido.cliente.nome}</TableCell>
                      {!isVendedor && (
                        <TableCell className="text-sm">{c.vendedor.nome}</TableCell>
                      )}
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatBRL(Number(c.baseValor))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {Number(c.comissaoPct).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatBRL(Number(c.valorComissao))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={info.className}>
                          {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.status === "PAGA" && c.pagaEm
                          ? `Paga ${format(c.pagaEm, "dd/MM/yy", { locale: ptBR })}`
                          : `Gerada ${format(c.criadaEm, "dd/MM/yy", { locale: ptBR })}`}
                      </TableCell>
                      {isFinanceiro && (
                        <TableCell className="text-right">
                          <ComissaoActions id={c.id} status={c.status} />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {isVendedor && (
          <p className="text-xs text-muted-foreground text-center">
            Você não vê comissões de outros vendedores. Apenas as suas.
          </p>
        )}
      </main>
    </div>
  );
}
