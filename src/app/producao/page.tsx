import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/calculadoras";
import { statusInfo } from "../pedidos/_status";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Produção" };

// Colunas que aparecem no kanban (ENTREGUE/CANCELADO ficam fora)
const colunas = [
  "AGUARDANDO_ARTE",
  "ARTE_EM_APROVACAO",
  "EM_PRODUCAO",
  "ACABAMENTO",
  "PRONTO",
] as const;

export default async function ProducaoPage() {
  const user = await verifySession();

  const pedidos = await prisma.pedido.findMany({
    where: { status: { in: colunas as unknown as Array<(typeof colunas)[number]> } },
    include: {
      cliente: { select: { nome: true } },
      etapas: { select: { status: true } },
    },
    orderBy: [{ prazoEntrega: "asc" }, { criadoEm: "asc" }],
    take: 200,
  });

  // Agrupa por status
  const porStatus = new Map<(typeof colunas)[number], typeof pedidos>();
  for (const c of colunas) porStatus.set(c, []);
  for (const p of pedidos) {
    const arr = porStatus.get(p.status as (typeof colunas)[number]);
    if (arr) arr.push(p);
  }

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Produção" }]} />

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 space-y-5">
        <PageHeader
          eyebrow="Chão de fábrica"
          title="Kanban de produção"
          description={
            <>
              {pedidos.length} pedido(s) ativos. Clique em um card para abrir.
            </>
          }
          actions={
            <Link href="/pedidos" className="text-sm underline">
              Lista de pedidos →
            </Link>
          }
        />

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 min-h-[500px]">
          {colunas.map((status) => {
            const info = statusInfo[status];
            const items = porStatus.get(status) ?? [];
            return (
              <div key={status} className="bg-muted/40 rounded-md p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 pt-1">
                  <h3 className="font-semibold text-sm">{info.label}</h3>
                  <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">vazio</div>
                  ) : (
                    items.map((p) => {
                      const atrasado =
                        p.prazoEntrega && p.prazoEntrega < new Date();
                      const etapasFeitas = p.etapas.filter(
                        (e) => e.status === "CONCLUIDA" || e.status === "PULADA",
                      ).length;
                      const etapasTotal = p.etapas.length;
                      return (
                        <Link key={p.id} href={`/pedidos/${p.id}`} className="block">
                          <Card className="p-3 hover:border-foreground/30 transition-colors space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                #{p.numero}
                              </span>
                              {atrasado && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  atrasado
                                </Badge>
                              )}
                            </div>
                            <div className="font-medium text-sm truncate">{p.cliente.nome}</div>
                            <div className="text-xs text-muted-foreground tabular-nums">
                              {formatBRL(Number(p.total))}
                            </div>
                            {etapasTotal > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Etapas: {etapasFeitas}/{etapasTotal}
                              </div>
                            )}
                            {p.prazoEntrega && (
                              <div
                                className={`text-xs ${
                                  atrasado ? "text-destructive font-medium" : "text-muted-foreground"
                                }`}
                              >
                                {atrasado
                                  ? `Atrasado · ${format(p.prazoEntrega, "dd/MM", { locale: ptBR })}`
                                  : `Prazo ${formatDistanceToNow(p.prazoEntrega, {
                                      locale: ptBR,
                                      addSuffix: true,
                                    })}`}
                              </div>
                            )}
                          </Card>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
