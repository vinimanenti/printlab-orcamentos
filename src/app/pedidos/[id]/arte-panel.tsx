"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Link as LinkIcon, Check, X, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { AprovacaoArteStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { enviarArte } from "@/lib/actions/arte";

type ArteVersao = {
  id: string;
  versao: number;
  notas: string | null;
  criadaEm: Date;
  anexo: {
    nomeOriginal: string;
    caminho: string;
    mimeType: string;
    tamanhoBytes: number;
  };
};

type AprovacaoData = {
  id: string;
  token: string;
  status: AprovacaoArteStatus;
  expiraEm: Date;
  respondidoEm: Date | null;
  comentario: string | null;
  arteVersaoId: string;
};

export function ArtePanel({
  pedidoId,
  versoes,
  aprovacoes,
  podeEditar,
}: {
  pedidoId: string;
  versoes: ArteVersao[];
  aprovacoes: AprovacaoData[];
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gerarLink, setGerarLink] = useState(true);
  const [notas, setNotas] = useState("");
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    formData.set("pedidoId", pedidoId);
    if (gerarLink) formData.set("gerarLink", "on");

    startTransition(async () => {
      const result = await enviarArte(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Arte enviada!");
      setNotas("");
      setFileLabel(null);
      if (result.token) {
        const url = `${window.location.origin}/aprovacao/${result.token}`;
        navigator.clipboard.writeText(url).catch(() => {});
        toast.message("Link de aprovação copiado", { description: url });
      }
      router.refresh();
    });
  }

  const aprovacoesByVersaoId = new Map<string, AprovacaoData[]>();
  for (const a of aprovacoes) {
    const arr = aprovacoesByVersaoId.get(a.arteVersaoId) ?? [];
    arr.push(a);
    aprovacoesByVersaoId.set(a.arteVersaoId, arr);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">🎨 Arte</CardTitle>
        <CardDescription>
          {versoes.length === 0
            ? "Nenhuma arte enviada ainda."
            : `${versoes.length} versão(ões) enviada(s).`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HISTÓRICO DE VERSÕES */}
        {versoes.length > 0 && (
          <div className="space-y-2">
            {versoes.map((v) => {
              const aps = aprovacoesByVersaoId.get(v.id) ?? [];
              const aprovacaoAtiva = aps[0];
              return (
                <div key={v.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline">v{v.versao}</Badge>
                      <a
                        href={v.anexo.caminho}
                        target="_blank"
                        rel="noopener"
                        className="text-sm font-medium underline truncate"
                      >
                        {v.anexo.nomeOriginal}
                      </a>
                      <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {format(v.criadaEm, "dd/MM HH:mm", { locale: ptBR })} ·{" "}
                      {(v.anexo.tamanhoBytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  {v.notas && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{v.notas}</p>
                  )}
                  {aprovacaoAtiva && <AprovacaoBadge a={aprovacaoAtiva} />}
                </div>
              );
            })}
          </div>
        )}

        {/* UPLOAD */}
        {podeEditar && (
          <form
            action={handleSubmit}
            encType="multipart/form-data"
            className="space-y-3 border-t pt-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="file">Nova versão da arte</Label>
              <Input
                id="file"
                name="file"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.ai,.eps,.psd,.cdr,.dxf"
                onChange={(e) => setFileLabel(e.target.files?.[0]?.name ?? null)}
              />
              {fileLabel && (
                <p className="text-xs text-muted-foreground">{fileLabel}</p>
              )}
              <p className="text-xs text-muted-foreground">
                PDF, PNG, JPG, SVG, AI, EPS, PSD, CDR, DXF. Até 25MB.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                name="notas"
                rows={2}
                placeholder="ex: Versão com ajuste do logo"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="gerarLink" className="cursor-pointer">
                  Gerar link de aprovação para o cliente
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando ligado, copio o link no seu clipboard pra mandar pelo WhatsApp.
                </p>
              </div>
              <Switch
                id="gerarLink"
                name="gerarLink"
                checked={gerarLink}
                onCheckedChange={setGerarLink}
              />
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              <Upload className="size-4" /> {pending ? "Enviando…" : "Enviar arte"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function AprovacaoBadge({ a }: { a: AprovacaoData }) {
  const expirado = a.expiraEm < new Date();
  if (a.status === "APROVADA") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-700">
        <Check className="size-3.5" /> Aprovada pelo cliente em{" "}
        {a.respondidoEm && format(a.respondidoEm, "dd/MM HH:mm", { locale: ptBR })}
        {a.comentario && <span className="text-muted-foreground">— "{a.comentario}"</span>}
      </div>
    );
  }
  if (a.status === "AJUSTE_SOLICITADO") {
    return (
      <div className="flex items-start gap-2 text-xs text-amber-700">
        <X className="size-3.5 mt-0.5" />
        <div>
          Ajuste solicitado em{" "}
          {a.respondidoEm && format(a.respondidoEm, "dd/MM HH:mm", { locale: ptBR })}
          {a.comentario && (
            <div className="text-muted-foreground italic mt-1 whitespace-pre-wrap">
              "{a.comentario}"
            </div>
          )}
        </div>
      </div>
    );
  }
  // PENDENTE / EXPIRADA
  return (
    <div className="flex items-center gap-2 text-xs">
      <Clock className={`size-3.5 ${expirado ? "text-muted-foreground" : "text-amber-600"}`} />
      <span className={expirado ? "text-muted-foreground" : "text-amber-700"}>
        {expirado ? "Link expirou" : "Aguardando resposta"}
      </span>
      {!expirado && (
        <CopyLinkBtn url={`/aprovacao/${a.token}`} />
      )}
    </div>
  );
}

function CopyLinkBtn({ url }: { url: string }) {
  function copiar() {
    const full = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    navigator.clipboard
      .writeText(full)
      .then(() => toast.success("Link copiado"))
      .catch(() => toast.error("Não foi possível copiar"));
  }
  return (
    <button type="button" onClick={copiar} className="underline inline-flex items-center gap-1">
      <LinkIcon className="size-3" /> copiar link
    </button>
  );
}
