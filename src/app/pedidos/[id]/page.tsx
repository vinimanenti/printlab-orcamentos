import Link from "next/link";
import { notFound } from "next/navigation";
import { Box } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { verifySession, podeVer } from "@/lib/session";
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
import { formatBRL } from "@/lib/calculadoras";
import { statusInfo, transicoesValidas, etapaInfo, etapaStatusInfo } from "../_status";
import { StatusActions } from "./status-actions";
import { EtapaActions } from "./etapa-actions";
import { ArtePanel } from "./arte-panel";
import { ChecklistPanel } from "./checklist-panel";
import { PagamentosPanel } from "./pagamentos-panel";
import { AvisarCliente } from "./avisar-cliente";

export const metadata = { title: "Pedido" };

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await verifySession();
  const { id } = await params;

  const p = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      orcamento: { select: { numero: true, id: true } },
      itens: {
        orderBy: { ordem: "asc" },
        include: {
          material: { select: { nome: true } },
          impressao: { select: { nome: true } },
          acabamento: { select: { nome: true } },
        },
      },
      etapas: { orderBy: { ordem: "asc" } },
      arteVersoes: {
        orderBy: { versao: "desc" },
        include: {
          anexo: {
            select: { nomeOriginal: true, caminho: true, mimeType: true, tamanhoBytes: true },
          },
        },
      },
      aprovacoes: {
        orderBy: { criadaEm: "desc" },
      },
      pagamentos: {
        orderBy: { criadoEm: "desc" },
      },
    },
  });
  if (!p) notFound();
  // Vendedor só vê pedidos próprios
  if (!podeVer(user, p)) notFound();

  // ChecklistArte não tem relação inversa no schema; query separada.
  const checklistRaw = await prisma.checklistArte.findUnique({
    where: { pedidoId: p.id },
  });
  const validadoPor = checklistRaw?.validadoPorId
    ? await prisma.user.findUnique({
        where: { id: checklistRaw.validadoPorId },
        select: { nome: true },
      })
    : null;
  const checklist = checklistRaw
    ? {
        sangriaOk: checklistRaw.sangriaOk,
        resolucaoOk: checklistRaw.resolucaoOk,
        coresCmykOk: checklistRaw.coresCmykOk,
        fontesConvertidas: checklistRaw.fontesConvertidas,
        tracadoCorteOk: checklistRaw.tracadoCorteOk,
        observacoes: checklistRaw.observacoes,
        validadoPorNome: validadoPor?.nome ?? null,
        validadoEm: checklistRaw.validadoEm,
      }
    : null;

  const podeEditar = user.perfil === "ADM" || user.perfil === "VEN" || user.perfil === "PRO";
  const podeFinanceiro = user.perfil === "ADM" || user.perfil === "VEN" || user.perfil === "FIN";
  const info = statusInfo[p.status];
  const transicoes = transicoesValidas[p.status];

  const config = await prisma.configuracaoSistema.findUnique({
    where: { id: "singleton" },
    select: { empresaNome: true },
  });
  const saldoAberto = Math.max(0, Number(p.total) - Number(p.totalPago));

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/pedidos", label: "Pedidos" },
          { label: `#${p.numero}` },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">Pedido #{p.numero}</h1>
              <Badge variant={info.variant} className={info.className}>
                {info.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Para <strong>{p.cliente.nome}</strong> · criado em{" "}
              {format(p.criadoEm, "dd/MM/yyyy HH:mm", { locale: ptBR })} · vendedor {p.vendedor.nome}
            </p>
            <p className="text-muted-foreground text-xs">{info.desc}</p>
          </div>
          {podeEditar && transicoes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <StatusActions pedidoId={p.id} atual={p.status} />
            </div>
          )}
        </div>

        {/* CARDS RESUMO */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cliente</CardDescription>
              <CardTitle className="text-base">{p.cliente.nome}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-muted-foreground">
              <div>📞 {p.cliente.telefone}</div>
              {p.cliente.whatsapp && p.cliente.whatsapp !== p.cliente.telefone && (
                <div>💬 {p.cliente.whatsapp}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Prazo de entrega</CardDescription>
              <CardTitle className="text-base">
                {p.prazoEntrega
                  ? format(p.prazoEntrega, "dd 'de' MMMM", { locale: ptBR })
                  : "Não definido"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Orçamento original:{" "}
              <Link href={`/orcamentos/${p.orcamento.id}`} className="underline">
                #{p.orcamento.numero}
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{formatBRL(Number(p.total))}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pago: {formatBRL(Number(p.totalPago))}
            </CardContent>
          </Card>
        </div>

        {/* AVISAR CLIENTE — texto vem do template correspondente ao status */}
        <AvisarCliente
          status={p.status}
          cliente={p.cliente}
          numero={p.numero}
          total={Number(p.total)}
          saldo={saldoAberto}
          empresaNome={config?.empresaNome ?? "PrintLab"}
        />

        {/* ARTE */}
        <ArtePanel
          pedidoId={p.id}
          versoes={p.arteVersoes.map((v) => ({
            id: v.id,
            versao: v.versao,
            notas: v.notas,
            criadaEm: v.criadaEm,
            anexo: v.anexo,
          }))}
          aprovacoes={p.aprovacoes.map((a) => ({
            id: a.id,
            token: a.token,
            status: a.status,
            expiraEm: a.expiraEm,
            respondidoEm: a.respondidoEm,
            comentario: a.comentario,
            arteVersaoId: a.arteVersaoId,
          }))}
          podeEditar={podeEditar}
        />

        {/* CHECKLIST DE ARTE */}
        <ChecklistPanel pedidoId={p.id} initial={checklist} podeEditar={podeEditar} />

        {/* PAGAMENTOS */}
        <PagamentosPanel
          pedidoId={p.id}
          total={Number(p.total)}
          totalPago={Number(p.totalPago)}
          pagamentos={p.pagamentos.map((pg) => ({
            id: pg.id,
            valor: Number(pg.valor),
            metodo: pg.metodo,
            status: pg.status,
            vencimento: pg.vencimento,
            pagoEm: pg.pagoEm,
            observacoes: pg.observacoes,
          }))}
          podeEditar={podeFinanceiro}
          isAdmin={user.perfil === "ADM"}
        />

        {/* ETAPAS DE PRODUÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="size-5" /> Etapas de produção
            </CardTitle>
            <CardDescription>
              Atualize conforme o pedido avança no chão de fábrica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {p.etapas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma etapa configurada.</p>
            ) : (
              p.etapas.map((e) => {
                const info = etapaInfo[e.tipo];
                const st = etapaStatusInfo[e.status];
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{info.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-medium">{info.label}</div>
                        <div className={`text-xs ${st.color}`}>
                          {st.label}
                          {e.concluidaEm && (
                            <span className="ml-1">
                              · {format(e.concluidaEm, "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {podeEditar && <EtapaActions pedidoId={p.id} etapaId={e.id} atual={e.status} />}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ITENS (snapshot do orçamento) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Itens do pedido</CardTitle>
            <CardDescription>
              Snapshot do orçamento. Valores congelados.
            </CardDescription>
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
                  <TableHead className="text-right pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.itens.map((it, ix) => (
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
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantidade}</TableCell>
                    <TableCell className="text-sm">{it.material?.nome ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium pr-6">
                      {formatBRL(Number(it.precoTotal))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {p.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{p.observacoes}</CardContent>
          </Card>
        )}

        <div className="flex justify-between text-sm">
          <Link href="/pedidos" className={buttonVariants({ variant: "outline", size: "sm" })}>
            ← Voltar à lista
          </Link>
          <span className="text-muted-foreground">
            Atualizado em {format(p.atualizadoEm, "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
        </div>
      </main>
    </div>
  );
}
