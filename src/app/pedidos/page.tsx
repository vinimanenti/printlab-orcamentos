import Link from "next/link";
import { Box } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/calculadoras";
import { statusInfo, ordemStatusPedido } from "./_status";

export const metadata = { title: "Pedidos" };

const statusFiltros = [
  { key: "todos", label: "Todos" },
  { key: "abertos", label: "Em aberto" }, // tudo que não é ENTREGUE/CANCELADO
  ...ordemStatusPedido.map((s) => ({ key: s, label: statusInfo[s].label })),
] as const;

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await verifySession();
  const { status = "abertos", q = "" } = await searchParams;

  const statusKnown = ordemStatusPedido.find((s) => s === status);

  const where = {
    AND: [
      status === "abertos"
        ? { status: { notIn: ["ENTREGUE" as const, "CANCELADO" as const] } }
        : statusKnown
          ? { status: statusKnown }
          : {},
      q.trim()
        ? {
            OR: [
              { cliente: { nome: { contains: q.trim(), mode: "insensitive" as const } } },
              isNaN(Number(q)) ? null : { numero: Number(q) },
            ].filter((c): c is NonNullable<typeof c> => c !== null),
          }
        : {},
    ],
  };

  const pedidos = await prisma.pedido.findMany({
    where,
    include: {
      cliente: { select: { nome: true, tipo: true } },
      vendedor: { select: { nome: true } },
      orcamento: { select: { numero: true } },
    },
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    take: 100,
  });

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Pedidos" }]} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow="Produção"
          title="Pedidos"
          description={
            <>
              {pedidos.length} {pedidos.length === 1 ? "encontrado" : "encontrados"}.
            </>
          }
          actions={
            <Link href="/producao" className={buttonVariants({ variant: "outline" })}>
              Kanban →
            </Link>
          }
        />

        <div className="flex flex-wrap gap-2 text-sm">
          {statusFiltros.map((f) => (
            <Link
              key={f.key}
              href={`/pedidos?status=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1.5 rounded-md border transition-colors ${
                status === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    <Box className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    Nenhum pedido nesse filtro.{" "}
                    <Link href="/orcamentos?status=APROVADO" className="underline">
                      Ver orçamentos aprovados pra converter.
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                pedidos.map((p) => {
                  const info = statusInfo[p.status];
                  const atrasado =
                    p.prazoEntrega &&
                    p.prazoEntrega < new Date() &&
                    p.status !== "ENTREGUE" &&
                    p.status !== "CANCELADO";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono tabular-nums">#{p.numero}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/pedidos/${p.id}`} className="hover:underline">
                          {p.cliente.nome}
                          {p.cliente.tipo === "PJ" && (
                            <span className="text-muted-foreground text-xs ml-1">(empresa)</span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={info.variant} className={info.className}>
                          {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.prazoEntrega ? (
                          <span className={atrasado ? "text-destructive font-medium" : ""}>
                            {format(p.prazoEntrega, "dd/MM/yyyy", { locale: ptBR })}
                            {atrasado && " ⚠"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {p.prazoEntrega && !atrasado && (
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(p.prazoEntrega, { locale: ptBR, addSuffix: true })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatBRL(Number(p.total))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <Link href={`/orcamentos/${p.orcamentoId}`} className="underline">
                          orç #{p.orcamento.numero}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/pedidos/${p.id}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Abrir
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
