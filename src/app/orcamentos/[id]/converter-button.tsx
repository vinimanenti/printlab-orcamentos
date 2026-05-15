"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Box } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { converterOrcamentoEmPedido } from "@/lib/actions/pedidos";

export function ConverterButton({
  orcamentoId,
  jaConvertido,
  pedidoId,
}: {
  orcamentoId: string;
  jaConvertido: boolean;
  pedidoId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (jaConvertido && pedidoId) {
    return (
      <Link
        href={`/pedidos/${pedidoId}`}
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        <Box className="size-4" /> Ver pedido <ArrowRight className="size-4" />
      </Link>
    );
  }

  function converter() {
    if (!confirm("Converter este orçamento em pedido? O orçamento ficará bloqueado para edição.")) return;
    startTransition(async () => {
      const r = await converterOrcamentoEmPedido(orcamentoId);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Pedido criado!");
      if (r.id) router.push(`/pedidos/${r.id}`);
    });
  }

  return (
    <Button size="sm" disabled={pending} onClick={converter}>
      <Box className="size-4" /> {pending ? "Convertendo…" : "Converter em pedido"}
    </Button>
  );
}
