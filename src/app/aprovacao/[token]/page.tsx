import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AprovacaoForm } from "./aprovacao-form";

export const metadata = { title: "Aprovação de arte" };

/**
 * Página pública (sem login) para o cliente aprovar/recusar a arte.
 *
 * Acessada via token UUID na URL: /aprovacao/<token>
 * Aproveita o "isPublic" do proxy.ts pra liberar acesso anônimo.
 */
export default async function AprovacaoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const aprovacao = await prisma.aprovacaoArte.findUnique({
    where: { token },
    include: {
      pedido: {
        include: {
          cliente: { select: { nome: true } },
          itens: {
            orderBy: { ordem: "asc" },
            select: {
              descricao: true,
              quantidade: true,
              larguraCm: true,
              alturaCm: true,
              material: { select: { nome: true } },
              acabamento: { select: { nome: true } },
            },
          },
        },
      },
    },
  });

  if (!aprovacao) notFound();

  // Busca a versão de arte específica do token
  const versao = await prisma.arteVersao.findUnique({
    where: { id: aprovacao.arteVersaoId },
    include: { anexo: true },
  });

  const config = await prisma.configuracaoSistema.findUnique({
    where: { id: "singleton" },
    select: { empresaNome: true },
  });

  const expirado = aprovacao.expiraEm < new Date();
  const jaRespondido = aprovacao.status !== "PENDENTE";
  const podeResponder = !expirado && !jaRespondido;

  return (
    <main className="min-h-screen bg-muted/30 py-6 sm:py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {config?.empresaNome ?? "PrintLab"}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold">Aprovação de arte</h1>
          <p className="text-muted-foreground text-sm">
            Pedido #{aprovacao.pedido.numero} · {aprovacao.pedido.cliente.nome}
          </p>
        </div>

        {/* PREVIEW DA ARTE */}
        {versao && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Arte enviada
                <Badge variant="outline">v{versao.versao}</Badge>
              </CardTitle>
              <CardDescription>
                Enviada em {format(versao.criadaEm, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isImage(versao.anexo.mimeType) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={versao.anexo.caminho}
                  alt={`Arte ${versao.anexo.nomeOriginal}`}
                  className="w-full max-h-96 object-contain bg-card border rounded"
                />
              ) : (
                <a
                  href={versao.anexo.caminho}
                  target="_blank"
                  rel="noopener"
                  className="block border rounded-md p-6 text-center hover:bg-muted/50 transition-colors"
                >
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-medium underline">{versao.anexo.nomeOriginal}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique para abrir em nova aba
                  </p>
                </a>
              )}
              {versao.notas && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/40 rounded">
                  <strong>Notas do vendedor:</strong>
                  {"\n"}
                  {versao.notas}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* DADOS DO PEDIDO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">O que vai ser produzido</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {aprovacao.pedido.itens.map((it, ix) => (
                <li key={ix} className="border-l-2 pl-3 border-muted-foreground/30">
                  <div className="font-medium">{it.descricao}</div>
                  <div className="text-muted-foreground text-xs">
                    {Number(it.larguraCm)} × {Number(it.alturaCm)} cm · {it.quantidade} un
                    {it.material && ` · ${it.material.nome}`}
                    {it.acabamento && ` · ${it.acabamento.nome}`}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* RESPOSTA */}
        {jaRespondido ? (
          <Card className={aprovacao.status === "APROVADA" ? "border-emerald-500" : "border-amber-500"}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {aprovacao.status === "APROVADA" ? "✅ Arte aprovada" : "✏️ Ajuste solicitado"}
              </CardTitle>
              <CardDescription>
                Respondida em{" "}
                {aprovacao.respondidoEm &&
                  format(aprovacao.respondidoEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            {aprovacao.comentario && (
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground italic">
                  "{aprovacao.comentario}"
                </p>
              </CardContent>
            )}
          </Card>
        ) : expirado ? (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base">Link expirado</CardTitle>
              <CardDescription>
                Este link de aprovação venceu em{" "}
                {format(aprovacao.expiraEm, "dd/MM/yyyy", { locale: ptBR })}. Solicite um novo ao
                vendedor.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <AprovacaoForm token={token} />
        )}

        {podeResponder && (
          <p className="text-xs text-muted-foreground text-center">
            Link válido até {format(aprovacao.expiraEm, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </div>
    </main>
  );
}

function isImage(mime: string) {
  return /^image\/(png|jpe?g|webp|svg\+xml)/.test(mime);
}
