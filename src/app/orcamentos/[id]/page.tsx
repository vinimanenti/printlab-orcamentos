import Link from "next/link";
import { notFound } from "next/navigation";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { buttonVariants } from "@/components/ui/button";
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
import { formatBRL, formatM2 } from "@/lib/calculadoras";
import { statusInfo, transicoesValidas } from "../_status";
import { StatusActions } from "./status-actions";
import { WhatsAppButton } from "./whatsapp-button";

export const metadata = { title: "Orçamento" };

export default async function OrcamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await verifySession();
  const { id } = await params;

  const o = await prisma.orcamento.findUnique({
    where: { id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      motivoPerda: true,
      itens: {
        orderBy: { ordem: "asc" },
        include: {
          material: { select: { nome: true } },
          impressao: { select: { nome: true } },
          acabamento: { select: { nome: true } },
        },
      },
    },
  });
  if (!o) notFound();

  const motivos = await prisma.motivoPerda.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  const config = await prisma.configuracaoSistema.findUnique({ where: { id: "singleton" } });

  const podeEditar = user.perfil === "ADM" || user.perfil === "VEN";
  const info = statusInfo[o.status];
  const transicoes = transicoesValidas[o.status];
  const validadeAte = addDays(o.criadoEm, o.validadeDias);

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/orcamentos", label: "Orçamentos" },
          { label: `#${o.numero}` },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">
        {/* HEADER do orçamento */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Orçamento #{o.numero}</h1>
              <Badge variant={info.variant}>{info.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Para <strong>{o.cliente.nome}</strong> · criado em{" "}
              {format(o.criadoEm, "dd/MM/yyyy HH:mm", { locale: ptBR })} · vendedor {o.vendedor.nome}
            </p>
            <p className="text-muted-foreground text-xs">{info.desc}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <WhatsAppButton
              cliente={o.cliente}
              numero={o.numero}
              total={Number(o.total)}
              validadeAte={validadeAte}
              empresaNome={config?.empresaNome ?? "PrintLab"}
              itens={o.itens.map((it) => ({
                descricao: it.descricao,
                quantidade: it.quantidade,
                larguraCm: Number(it.larguraCm),
                alturaCm: Number(it.alturaCm),
                precoUnitario: Number(it.precoUnitario),
                precoTotal: Number(it.precoTotal),
                material: it.material?.nome,
                impressao: it.impressao?.nome,
                acabamento: it.acabamento?.nome,
              }))}
              prazoDias={o.prazoEntregaDias}
            />
            {podeEditar && transicoes.length > 0 && (
              <StatusActions orcamentoId={o.id} atual={o.status} motivos={motivos} />
            )}
          </div>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cliente</CardDescription>
              <CardTitle className="text-base">{o.cliente.nome}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-muted-foreground">
              <div>
                <Badge variant="outline">{o.cliente.tipo === "PJ" ? "Empresa" : "PF"}</Badge>
              </div>
              <div>📞 {o.cliente.telefone}</div>
              {o.cliente.whatsapp && o.cliente.whatsapp !== o.cliente.telefone && (
                <div>💬 {o.cliente.whatsapp}</div>
              )}
              {o.cliente.email && <div>✉️ {o.cliente.email}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Validade</CardDescription>
              <CardTitle className="text-base">{o.validadeDias} dias</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div>Até {format(validadeAte, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
              {o.prazoEntregaDias != null && (
                <div className="mt-1">Prazo de produção: {o.prazoEntregaDias} dias</div>
              )}
              {o.condicoesPagamento && (
                <div className="mt-1">Pagamento: {o.condicoesPagamento}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{formatBRL(Number(o.total))}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatBRL(Number(o.subtotal))}</span>
              </div>
              {Number(o.desconto) > 0 && (
                <div className="flex justify-between">
                  <span>Desconto</span>
                  <span className="tabular-nums">− {formatBRL(Number(o.desconto))}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ITENS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Itens</CardTitle>
            <CardDescription>{o.itens.length} item(s) neste orçamento.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">#</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Medida</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Unitário</TableHead>
                  <TableHead className="text-right pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {o.itens.map((it, ix) => (
                  <TableRow key={it.id}>
                    <TableCell className="pl-6 text-muted-foreground">{ix + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{it.descricao}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.impressao?.nome}
                        {it.acabamento ? ` · ${it.acabamento.nome}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {Number(it.larguraCm)} × {Number(it.alturaCm)} cm
                      <div className="text-xs text-muted-foreground">
                        {formatM2(Number(it.areaUnitariaM2 ?? 0))} cada
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantidade}</TableCell>
                    <TableCell className="text-sm">{it.material?.nome ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(it.precoUnitario))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium pr-6">
                      {formatBRL(Number(it.precoTotal))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* OBSERVAÇÕES */}
        {(o.observacoes || o.observacaoPerda) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {o.observacoes && (
                <div>
                  <div className="text-muted-foreground text-xs">Para o cliente</div>
                  <p className="whitespace-pre-wrap">{o.observacoes}</p>
                </div>
              )}
              {o.observacaoPerda && (
                <div>
                  <div className="text-muted-foreground text-xs">
                    Motivo de perda{o.motivoPerda ? ` (${o.motivoPerda.nome})` : ""}
                  </div>
                  <p className="whitespace-pre-wrap text-muted-foreground">{o.observacaoPerda}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FOOTER LINKS */}
        <div className="flex justify-between text-sm">
          <Link
            href="/orcamentos"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            ← Voltar à lista
          </Link>
          <span className="text-muted-foreground">
            Atualizado em {format(o.atualizadoEm, "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
        </div>
      </main>
    </div>
  );
}
