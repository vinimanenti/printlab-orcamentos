import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package, FileText, Box } from "lucide-react";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
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
import { ClienteDialog } from "../cliente-dialog";
import { ProdutoDialog } from "./produto-dialog";
import { ProdutoDelete } from "./produto-delete";

export const metadata = { title: "Cliente" };

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await verifySession();
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      produtos: {
        orderBy: [{ ativo: "desc" }, { nome: "asc" }],
        include: {
          material: { select: { nome: true } },
          impressao: { select: { nome: true } },
          acabamento: { select: { nome: true } },
        },
      },
      _count: {
        select: { orcamentos: true, pedidos: true },
      },
    },
  });
  if (!cliente) notFound();

  const podeEditar = user.perfil === "ADM" || user.perfil === "VEN";

  // Catálogo pra dialog de produto
  const [materiais, impressoes, acabamentos, ultimosOrcamentos] = await Promise.all([
    prisma.material.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.tipoImpressao.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.acabamento.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.orcamento.findMany({
      where: { clienteId: id },
      orderBy: { criadoEm: "desc" },
      take: 5,
      select: { id: true, numero: true, status: true, total: true, criadoEm: true },
    }),
  ]);

  const catalogo = { materiais, impressoes, acabamentos };

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/clientes", label: "Clientes" },
          { label: cliente.nome },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          eyebrow={cliente.tipo === "PJ" ? "Empresa" : "Pessoa física"}
          title={cliente.nome}
          description={
            <>
              {cliente._count.orcamentos} orçamento(s) · {cliente._count.pedidos} pedido(s)
              {!cliente.ativo && (
                <Badge variant="secondary" className="ml-2">
                  Inativo
                </Badge>
              )}
            </>
          }
          actions={
            podeEditar && (
              <ClienteDialog
                cliente={{
                  id: cliente.id,
                  tipo: cliente.tipo,
                  nome: cliente.nome,
                  documento: cliente.documento,
                  email: cliente.email,
                  telefone: cliente.telefone,
                  whatsapp: cliente.whatsapp,
                  observacoes: cliente.observacoes,
                  ativo: cliente.ativo,
                }}
              />
            )
          }
        />

        {/* DADOS BÁSICOS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados de contato</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label-eyebrow mb-1">Telefone</p>
              <p className="tabular-nums">{cliente.telefone}</p>
            </div>
            {cliente.whatsapp && cliente.whatsapp !== cliente.telefone && (
              <div>
                <p className="label-eyebrow mb-1">WhatsApp</p>
                <p className="tabular-nums">{cliente.whatsapp}</p>
              </div>
            )}
            {cliente.email && (
              <div>
                <p className="label-eyebrow mb-1">E-mail</p>
                <p>{cliente.email}</p>
              </div>
            )}
            {cliente.documento && (
              <div>
                <p className="label-eyebrow mb-1">{cliente.tipo === "PJ" ? "CNPJ" : "CPF"}</p>
                <p className="font-mono text-xs">{cliente.documento}</p>
              </div>
            )}
            {cliente.observacoes && (
              <div className="sm:col-span-2">
                <p className="label-eyebrow mb-1">Observações</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {cliente.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PRODUTOS CADASTRADOS */}
        <Card>
          <CardHeader>
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="size-4" />
                  Produtos cadastrados
                </CardTitle>
                <CardDescription>
                  Atalhos para itens que este cliente compra com frequência. Ao
                  criar orçamento, basta selecionar e os campos da calculadora
                  vêm preenchidos.
                </CardDescription>
              </div>
              {podeEditar && (
                <ProdutoDialog clienteId={cliente.id} catalogo={catalogo} variant="new" />
              )}
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {cliente.produtos.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                <Package className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                Nenhum produto cadastrado para este cliente ainda.
                {podeEditar && (
                  <>
                    <br />
                    Use o botão acima para adicionar o primeiro.
                  </>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Produto</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead className="text-right">Qtd. padrão</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Impressão</TableHead>
                    <TableHead>Acabamento</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    {podeEditar && <TableHead className="w-28 pr-4 text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cliente.produtos.map((p) => (
                    <TableRow key={p.id} className={!p.ativo ? "opacity-50" : ""}>
                      <TableCell className="pl-6 font-medium">
                        {p.nome}
                        {!p.ativo && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            inativo
                          </Badge>
                        )}
                        {p.descricao && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.descricao}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm text-muted-foreground">
                        {p.larguraCm && p.alturaCm
                          ? `${Number(p.larguraCm)} × ${Number(p.alturaCm)} cm`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.quantidadePadrao}
                      </TableCell>
                      <TableCell className="text-sm">{p.material?.nome ?? "—"}</TableCell>
                      <TableCell className="text-sm">{p.impressao?.nome ?? "—"}</TableCell>
                      <TableCell className="text-sm">{p.acabamento?.nome ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {p.margemPct != null ? `${Number(p.margemPct).toFixed(0)}%` : "—"}
                      </TableCell>
                      {podeEditar && (
                        <TableCell className="pr-4 text-right">
                          <ProdutoDialog
                            clienteId={cliente.id}
                            catalogo={catalogo}
                            produto={{
                              id: p.id,
                              nome: p.nome,
                              descricao: p.descricao,
                              larguraCm: p.larguraCm ? Number(p.larguraCm) : null,
                              alturaCm: p.alturaCm ? Number(p.alturaCm) : null,
                              quantidadePadrao: p.quantidadePadrao,
                              materialId: p.materialId,
                              impressaoId: p.impressaoId,
                              acabamentoId: p.acabamentoId,
                              margemPct: p.margemPct ? Number(p.margemPct) : null,
                              observacoes: p.observacoes,
                              ativo: p.ativo,
                            }}
                          />
                          <ProdutoDelete id={p.id} nome={p.nome} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ÚLTIMOS ORÇAMENTOS */}
        {ultimosOrcamentos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" /> Últimos orçamentos
              </CardTitle>
              <CardDescription>
                <Link
                  href={`/orcamentos?q=${encodeURIComponent(cliente.nome)}`}
                  className="underline"
                >
                  ver todos →
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Nº</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-6">Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ultimosOrcamentos.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="pl-6 font-mono text-xs">
                        <Link href={`/orcamentos/${o.id}`} className="hover:underline">
                          #{String(o.numero).padStart(4, "0")}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(Number(o.total))}
                      </TableCell>
                      <TableCell className="pr-6 text-sm text-muted-foreground">
                        {format(o.criadoEm, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`/orcamentos/novo?cliente=${cliente.id}`}
            className={buttonVariants({ variant: "default" })}
          >
            <FileText className="size-4" /> Novo orçamento pra este cliente
          </Link>
          <Link
            href={`/pedidos?q=${encodeURIComponent(cliente.nome)}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Box className="size-4" /> Ver pedidos
          </Link>
        </div>
      </main>
    </div>
  );
}
