"use client";

import { useTransition } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ComissaoStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  marcarComissaoPaga,
  desmarcarComissao,
  cancelarComissao,
  marcarTodasPagas,
} from "@/lib/actions/comissoes";

export function ComissaoActions({
  id,
  status,
}: {
  id: string;
  status: ComissaoStatus;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: true } | { error: string }>, ok: string) {
    startTransition(async () => {
      const r = await fn();
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(ok);
    });
  }

  return (
    <div className="flex gap-1 justify-end">
      {status === "PENDENTE" && (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => marcarComissaoPaga(id), "Marcada como paga")}
            title="Marcar como paga"
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (confirm("Cancelar esta comissão? Pode ser revertido depois.")) {
                run(() => cancelarComissao(id), "Comissão cancelada");
              }
            }}
            title="Cancelar"
          >
            <X className="size-3.5" />
          </Button>
        </>
      )}
      {status === "PAGA" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => desmarcarComissao(id), "Marcada como pendente")}
          title="Desmarcar (voltar pra pendente)"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
      {status === "CANCELADA" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => desmarcarComissao(id), "Comissão reaberta")}
          title="Reabrir"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

export function MarcarTodasPagas({ vendedorId }: { vendedorId: string }) {
  const [pending, startTransition] = useTransition();

  function executar() {
    if (
      !confirm(
        "Marcar TODAS as comissões pendentes deste vendedor como pagas? Use isso apenas no fechamento mensal.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const r = await marcarTodasPagas(vendedorId);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Todas as pendentes marcadas como pagas");
    });
  }

  return (
    <Button onClick={executar} disabled={pending}>
      <Check className="size-4" />
      {pending ? "Confirmando…" : "Marcar todas como pagas"}
    </Button>
  );
}
