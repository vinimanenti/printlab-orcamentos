"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { PedidoStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { mudarStatusPedido } from "@/lib/actions/pedidos";
import { transicoesValidas, statusInfo } from "../_status";

export function StatusActions({
  pedidoId,
  atual,
}: {
  pedidoId: string;
  atual: PedidoStatus;
}) {
  const transicoes = transicoesValidas[atual];
  const [pending, startTransition] = useTransition();

  function aplicar(novo: PedidoStatus) {
    if (novo === "CANCELADO") {
      if (!confirm("Cancelar este pedido? A ação pode ser revertida depois.")) return;
    }
    startTransition(async () => {
      const r = await mudarStatusPedido(pedidoId, novo);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(`Status alterado para ${statusInfo[novo].label}`);
    });
  }

  return (
    <>
      {transicoes.map((novo) => (
        <Button
          key={novo}
          variant={novo === "ENTREGUE" || novo === "PRONTO" ? "default" : "outline"}
          size="sm"
          disabled={pending}
          onClick={() => aplicar(novo)}
        >
          {labelAcao(atual, novo)}
        </Button>
      ))}
    </>
  );
}

function labelAcao(_de: PedidoStatus, para: PedidoStatus): string {
  const labels: Record<PedidoStatus, string> = {
    AGUARDANDO_ARTE: "Reabrir",
    ARTE_EM_APROVACAO: "Enviar arte para cliente",
    EM_PRODUCAO: "Iniciar produção",
    ACABAMENTO: "Passar para acabamento",
    PRONTO: "Marcar pronto",
    ENTREGUE: "Marcar entregue",
    CANCELADO: "Cancelar",
  };
  return labels[para] ?? statusInfo[para].label;
}
