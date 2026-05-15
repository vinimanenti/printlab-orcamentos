import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
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
import { statusInfo } from "./_status";

export const metadata = { title: "Orçamentos" };

const statusFiltros = [
  { key: "todos", label: "Todos" },
  { key: "RASCUNHO", label: "Rascunhos" },
  { key: "ENVIADO", label: "Enviados" },
  { key: "EM_NEGOCIACAO", label: "Em negociação" },
  { key: "APROVADO", label: "Aprovados" },
  { key: "PERDIDO", label: "Perdidos" },
] as const;

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await verifySession();
  const { status = "todos", q = "" } = await searchParams;
  const podeEditar = user.perfil === "ADM" || user.perfil === "VEN";

  const where = {
    AND: [
      status !== "todos" && statusFiltros.find((f) => f.key === status)
        ? { status: status as Exclude<(typeof statusFiltros)[number]["key"], "todos"> }
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

  const orcamentos = await prisma.orcamento.findMany({
    where,
    include: {
      cliente: { select: { nome: true, tipo: true } },
      vendedor: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Orçamentos" }]} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow="Comercial"
          title="Orçamentos"
          description={
            <>
              {orcamentos.length} {orcamentos.length === 1 ? "encontrado" : "encontrados"}.
            </>
          }
          actions={
            podeEditar && (
              <Link href="/orcamentos/novo" className={buttonVariants({ variant: "default" })}>
                <Plus className="size-4" /> Novo orçamento
              </Link>
            )
          }
        />

        {/* Filtros de status */}
        <div className="flex flex-wrap gap-2 text-sm">
          {statusFiltros.map((f) => (
            <Link
              key={f.key}
              href={`/orcamentos?status=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orcamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    <FileText className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    Nenhum orçamento ainda.{" "}
                    {podeEditar && (
                      <Link href="/orcamentos/novo" className="underline">
                        Criar o primeiro.
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                orcamentos.map((o) => {
                  const info = statusInfo[o.status];
                  return (
                    <TableRow key={o.id} className="cursor-pointer">
                      <TableCell className="font-mono tabular-nums">#{o.numero}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/orcamentos/${o.id}`} className="hover:underline">
                          {o.cliente.nome}
                          {o.cliente.tipo === "PJ" && (
                            <span className="text-muted-foreground text-xs ml-1">(empresa)</span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={info.variant} className={info.className}>
                          {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatBRL(Number(o.total))}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{o.vendedor.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(o.criadoEm, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/orcamentos/${o.id}`}
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
