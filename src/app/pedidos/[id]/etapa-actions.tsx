"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Play, Check, SkipForward, RotateCcw } from "lucide-react";
import type { EtapaStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { mudarEtapa } from "@/lib/actions/pedidos";

/**
 * Botões para mudar o estado de uma etapa de produção.
 * Mostra apenas as ações relevantes ao estado atual.
 */
export function EtapaActions({
  pedidoId,
  etapaId,
  atual,
}: {
  pedidoId: string;
  etapaId: string;
  atual: EtapaStatus;
}) {
  const [pending, startTransition] = useTransition();

  function aplicar(novo: EtapaStatus) {
    startTransition(async () => {
      const r = await mudarEtapa(pedidoId, etapaId, novo);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Etapa atualizada");
    });
  }

  return (
    <div className="flex gap-1 shrink-0">
      {atual === "PENDENTE" && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => aplicar("EM_ANDAMENTO")}
          >
            <Play className="size-3.5" /> Iniciar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => aplicar("PULADA")}
            title="Pular esta etapa"
          >
            <SkipForward className="size-3.5" />
          </Button>
        </>
      )}
      {atual === "EM_ANDAMENTO" && (
        <Button size="sm" disabled={pending} onClick={() => aplicar("CONCLUIDA")}>
          <Check className="size-3.5" /> Concluir
        </Button>
      )}
      {(atual === "CONCLUIDA" || atual === "PULADA") && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => aplicar("PENDENTE")}
          title="Reabrir"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
