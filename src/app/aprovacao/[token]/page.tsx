import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PrintLabMark } from "@/components/brand/printlab-mark";
import { AprovacaoForm } from "./aprovacao-form";

export const metadata = { title: "Aprovação de arte" };

/**
 * Página pública (sem login) onde o cliente aprova ou pede ajuste na arte.
 * Editorial / specimen — primeira impressão que o cliente externo tem.
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

  const versao = await prisma.arteVersao.findUnique({
    where: { id: aprovacao.arteVersaoId },
    include: { anexo: true },
  });

  const config = await prisma.configuracaoSistema.findUnique({
    where: { id: "singleton" },
    select: { empresaNome: true, empresaTelefone: true },
  });

  const expirado = aprovacao.expiraEm < new Date();
  const jaRespondido = aprovacao.status !== "PENDENTE";
  const podeResponder = !expirado && !jaRespondido;

  return (
    <div className="min-h-screen bg-background">
      {/* ============= TOPO MINIMAL ============= */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <PrintLabMark variant="wordmark" />
          <span className="label-eyebrow text-muted-foreground">
            Aprovação de arte
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* ============= CABEÇALHO ============= */}
        <section className="space-y-3">
          <p className="label-eyebrow text-muted-foreground">
            Pedido nº <span className="font-mono">{String(aprovacao.pedido.numero).padStart(4, "0")}</span>
          </p>
          <h1 className="display-xl">
            Olá, {aprovacao.pedido.cliente.nome.split(" ")[0]}.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg leading-relaxed">
            Antes de a gente iniciar a produção, dá uma conferida na arte
            abaixo. Se estiver tudo certo, é só aprovar. Se quiser algum ajuste,
            descreve embaixo e a gente faz.
          </p>
        </section>

        {/* ============= ARTE (preview grande) ============= */}
        {versao && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="label-eyebrow">Arte enviada</h2>
              <span className="text-xs text-muted-foreground font-mono">
                v{versao.versao} ·{" "}
                {format(versao.criadaEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            {isImage(versao.anexo.mimeType) ? (
              <div className="border-2 border-foreground rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={versao.anexo.caminho}
                  alt={`Arte ${versao.anexo.nomeOriginal}`}
                  className="w-full max-h-[600px] object-contain bg-white"
                />
              </div>
            ) : (
              <a
                href={versao.anexo.caminho}
                target="_blank"
                rel="noopener"
                className="block border-2 border-foreground rounded-md p-10 text-center hover:bg-muted transition-colors"
              >
                <div className="text-5xl mb-3">📄</div>
                <p className="font-medium underline mb-1">{versao.anexo.nomeOriginal}</p>
                <p className="text-xs text-muted-foreground">
                  Clique para abrir o arquivo em nova aba
                </p>
              </a>
            )}

            {versao.notas && (
              <div className="rounded-md bg-muted/60 p-4 text-sm leading-relaxed">
                <p className="label-eyebrow mb-1">Notas do vendedor</p>
                <p className="whitespace-pre-wrap">{versao.notas}</p>
              </div>
            )}
          </section>
        )}

        {/* ============= ESPECIFICAÇÕES ============= */}
        <section className="space-y-3">
          <h2 className="label-eyebrow">O que vai ser produzido</h2>
          <ul className="divide-y divide-border border-y border-border">
            {aprovacao.pedido.itens.map((it, ix) => (
              <li key={ix} className="py-4 flex gap-4">
                <span className="font-mono text-xs text-muted-foreground w-8 shrink-0 mt-1">
                  {String(ix + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{it.descricao}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-mono tabular-nums">
                      {Number(it.larguraCm)} × {Number(it.alturaCm)} cm
                    </span>
                    <span className="font-mono tabular-nums">{it.quantidade} un</span>
                    {it.material && <span>{it.material.nome}</span>}
                    {it.acabamento && <span>{it.acabamento.nome}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ============= AÇÃO ============= */}
        {jaRespondido ? (
          <section
            className={`rounded-md border-2 p-6 ${
              aprovacao.status === "APROVADA"
                ? "border-cyan bg-cyan/5"
                : "border-yellow bg-yellow/5"
            }`}
          >
            <p className="label-eyebrow mb-2">
              {aprovacao.status === "APROVADA" ? "Arte aprovada" : "Ajuste solicitado"}
            </p>
            <h2 className="display-lg mb-3">
              {aprovacao.status === "APROVADA"
                ? "✓ Obrigado por confirmar"
                : "Recebido — vamos ajustar"}
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Respondida em{" "}
              {aprovacao.respondidoEm &&
                format(aprovacao.respondidoEm, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              .
            </p>
            {aprovacao.comentario && (
              <blockquote className="border-l-2 border-foreground pl-4 italic mt-4 text-sm">
                "{aprovacao.comentario}"
              </blockquote>
            )}
          </section>
        ) : expirado ? (
          <section className="rounded-md border-2 border-muted bg-muted/40 p-6 space-y-2">
            <p className="label-eyebrow">Link expirado</p>
            <h2 className="display-lg">Tempo esgotado</h2>
            <p className="text-sm text-muted-foreground">
              Este link de aprovação venceu em{" "}
              {format(aprovacao.expiraEm, "dd/MM/yyyy", { locale: ptBR })}.
              {config?.empresaTelefone && (
                <> Solicite um novo pelo WhatsApp: {config.empresaTelefone}.</>
              )}
            </p>
          </section>
        ) : (
          <AprovacaoForm token={token} />
        )}

        {podeResponder && (
          <p className="text-xs text-muted-foreground text-center font-mono">
            Link válido até {format(aprovacao.expiraEm, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-3xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <PrintLabMark variant="wordmark" className="text-sm" />
          <div className="label-eyebrow text-muted-foreground">
            {config?.empresaNome ?? "PrintLab"}
            {config?.empresaTelefone && ` · ${config.empresaTelefone}`}
          </div>
        </div>
      </footer>
    </div>
  );
}

function isImage(mime: string) {
  return /^image\/(png|jpe?g|webp|svg\+xml)/.test(mime);
}
