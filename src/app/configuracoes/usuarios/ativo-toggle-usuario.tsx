"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleUsuarioAtivo } from "@/lib/actions/usuarios";

/**
 * Switch inline para ativar/desativar usuário.
 * Bloqueado pelo server quando tenta desativar a si mesmo ou o último ADM.
 */
export function AtivoToggleUsuario({
  id,
  ativo,
}: {
  id: string;
  ativo: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    startTransition(async () => {
      const r = await toggleUsuarioAtivo(id, next);
      if (r && "error" in r) {
        toast.error(r.error);
      }
    });
  }

  return <Switch checked={ativo} disabled={pending} onCheckedChange={handleChange} />;
}
