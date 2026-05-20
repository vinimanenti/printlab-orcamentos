"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { excluirClienteProduto } from "@/lib/actions/cliente-produtos";

export function ProdutoDelete({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition();

  function excluir() {
    if (!confirm(`Excluir o produto "${nome}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const r = await excluirClienteProduto(id);
      if (r && "error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Produto excluído");
    });
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={excluir} title="Excluir produto">
      <Trash2 className="size-3.5 text-destructive" />
    </Button>
  );
}
