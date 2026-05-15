"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { OrcamentoStatus, MotivoPerda } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { mudarStatusOrcamento } from "@/lib/actions/orcamentos";
import { statusInfo, transicoesValidas } from "../_status";

/**
 * Mostra um botão para cada transição válida a partir do status atual.
 * "PERDIDO" abre um dialog para escolher o motivo.
 */
export function StatusActions({
  orcamentoId,
  atual,
  motivos,
}: {
  orcamentoId: string;
  atual: OrcamentoStatus;
  motivos: MotivoPerda[];
}) {
  const transicoes = transicoesValidas[atual];
  const [pending, startTransition] = useTransition();
  const [perdaOpen, setPerdaOpen] = useState(false);
  const [motivoId, setMotivoId] = useState<string>(motivos[0]?.id ?? "");

  function aplicar(novo: OrcamentoStatus, motivo?: string) {
    startTransition(async () => {
      const r = await mudarStatusOrcamento(orcamentoId, novo, motivo);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(`Status alterado para ${statusInfo[novo].label}`);
      setPerdaOpen(false);
    });
  }

  return (
    <>
      {transicoes.map((novo) => {
        const info = statusInfo[novo];
        const isPerda = novo === "PERDIDO";
        return (
          <Button
            key={novo}
            variant={novo === "APROVADO" ? "default" : "outline"}
            size="sm"
            disabled={pending}
            onClick={() => (isPerda ? setPerdaOpen(true) : aplicar(novo))}
          >
            {labelAcao(atual, novo)}
          </Button>
        );
      })}

      <Dialog open={perdaOpen} onOpenChange={setPerdaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como perdido</DialogTitle>
            <DialogDescription>
              Selecione o motivo para acompanhamento comercial (relatório de motivos de perda).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select
              value={motivoId}
              onValueChange={(v) => v && setMotivoId(v)}
              items={Object.fromEntries(motivos.map((m) => [m.id, m.nome]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {motivos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPerdaOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending || !motivoId}
              onClick={() => aplicar("PERDIDO", motivoId)}
            >
              {pending ? "Salvando…" : "Marcar como perdido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function labelAcao(de: OrcamentoStatus, para: OrcamentoStatus): string {
  // Labels customizados por contexto da transição
  if (para === "ENVIADO" && de === "RASCUNHO") return "Marcar como enviado";
  if (para === "EM_NEGOCIACAO") return "Cliente pediu ajuste";
  if (para === "APROVADO") return "Aprovar";
  if (para === "PERDIDO") return "Marcar como perdido";
  if (para === "CANCELADO") return "Cancelar";
  if (para === "RASCUNHO") return "Reabrir como rascunho";
  return statusInfo[para].label;
}
