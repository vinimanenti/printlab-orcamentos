"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { salvarChecklistArte } from "@/lib/actions/checklist";

type ChecklistData = {
  sangriaOk: boolean;
  resolucaoOk: boolean;
  coresCmykOk: boolean;
  fontesConvertidas: boolean;
  tracadoCorteOk: boolean;
  observacoes: string | null;
  validadoPorNome: string | null;
  validadoEm: Date | null;
};

const ITENS = [
  {
    key: "sangriaOk" as const,
    label: "Sangria",
    desc: "Margens de segurança + área de corte conferidas.",
  },
  {
    key: "resolucaoOk" as const,
    label: "Resolução",
    desc: "Mínimo 150dpi (vinis grandes) ou 300dpi (etiquetas).",
  },
  {
    key: "coresCmykOk" as const,
    label: "Cores em CMYK",
    desc: "Arquivo convertido para CMYK; cores especiais identificadas.",
  },
  {
    key: "fontesConvertidas" as const,
    label: "Fontes convertidas em curva",
    desc: "Evita problemas de fonte ausente na produção.",
  },
  {
    key: "tracadoCorteOk" as const,
    label: "Traçado de corte",
    desc: "Linha de corte na cor especial CutContour (ou equivalente).",
  },
];

export function ChecklistPanel({
  pedidoId,
  initial,
  podeEditar,
}: {
  pedidoId: string;
  initial: ChecklistData | null;
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState({
    sangriaOk: initial?.sangriaOk ?? false,
    resolucaoOk: initial?.resolucaoOk ?? false,
    coresCmykOk: initial?.coresCmykOk ?? false,
    fontesConvertidas: initial?.fontesConvertidas ?? false,
    tracadoCorteOk: initial?.tracadoCorteOk ?? false,
    observacoes: initial?.observacoes ?? "",
  });

  const okCount = ITENS.filter((it) => state[it.key]).length;
  const todosOk = okCount === ITENS.length;

  function toggle(key: keyof typeof state, value: boolean) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function marcarTudo() {
    setState((s) => ({
      ...s,
      sangriaOk: true,
      resolucaoOk: true,
      coresCmykOk: true,
      fontesConvertidas: true,
      tracadoCorteOk: true,
    }));
  }

  function salvar() {
    startTransition(async () => {
      const r = await salvarChecklistArte({
        pedidoId,
        sangriaOk: state.sangriaOk,
        resolucaoOk: state.resolucaoOk,
        coresCmykOk: state.coresCmykOk,
        fontesConvertidas: state.fontesConvertidas,
        tracadoCorteOk: state.tracadoCorteOk,
        observacoes: state.observacoes,
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(todosOk ? "Checklist completo!" : "Checklist salvo");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckSquare className="size-5" /> Checklist da arte
          {initial?.validadoEm && todosOk && (
            <Badge className="ml-2">Validado</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {okCount} de {ITENS.length} item(s) marcado(s).
          {initial?.validadoEm && initial.validadoPorNome && (
            <>
              {" "}Validado por <strong>{initial.validadoPorNome}</strong> em{" "}
              {format(initial.validadoEm, "dd/MM HH:mm", { locale: ptBR })}.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ITENS.map((it) => (
          <div
            key={it.key}
            className="flex items-start justify-between gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <Label htmlFor={it.key} className="cursor-pointer font-medium">
                {it.label}
              </Label>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
            <Switch
              id={it.key}
              checked={state[it.key]}
              disabled={!podeEditar || pending}
              onCheckedChange={(v) => toggle(it.key, v)}
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <Label htmlFor="obs-check">Observações de produção (opcional)</Label>
          <Textarea
            id="obs-check"
            rows={2}
            value={state.observacoes}
            disabled={!podeEditar}
            onChange={(e) => setState((s) => ({ ...s, observacoes: e.target.value }))}
            placeholder="ex: cliente pediu para repetir adesivo 1 com cor mais saturada"
          />
        </div>

        {podeEditar && (
          <div className="flex gap-2 flex-wrap">
            {!todosOk && (
              <Button
                variant="outline"
                disabled={pending}
                onClick={marcarTudo}
              >
                <Check className="size-4" /> Marcar tudo conferido
              </Button>
            )}
            <Button onClick={salvar} disabled={pending} className="ml-auto">
              {pending ? "Salvando…" : "Salvar checklist"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
