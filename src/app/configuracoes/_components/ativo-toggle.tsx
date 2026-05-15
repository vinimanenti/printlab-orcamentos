"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  toggleMaterialAtivo,
  toggleImpressaoAtivo,
  toggleAcabamentoAtivo,
} from "@/lib/actions/catalogo";

const actions = {
  material: toggleMaterialAtivo,
  impressao: toggleImpressaoAtivo,
  acabamento: toggleAcabamentoAtivo,
} as const;

/**
 * Toggle inline para ativar/desativar item do catálogo.
 * Usa Server Action via useTransition para feedback de loading sem refresh.
 */
export function AtivoToggle({
  id,
  ativo,
  entidade,
}: {
  id: string;
  ativo: boolean;
  entidade: keyof typeof actions;
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    startTransition(async () => {
      const result = await actions[entidade](id, next);
      if (result && "error" in result) {
        toast.error(result.error);
      }
    });
  }

  return <Switch checked={ativo} disabled={pending} onCheckedChange={handleChange} />;
}
