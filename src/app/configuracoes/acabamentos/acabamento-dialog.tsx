"use client";

import { useState, useActionState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { salvarAcabamento, type ActionResult } from "@/lib/actions/catalogo";

type Acabamento = {
  id: string;
  nome: string;
  precoM2: number | null;
  precoFixo: number | null;
  ativo: boolean;
};

export function AcabamentoDialog({
  acabamento,
  variant = "edit",
}: {
  acabamento?: Acabamento;
  variant?: "new" | "edit";
}) {
  const [open, setOpen] = useState(false);
  const [ativo, setAtivo] = useState(acabamento?.ativo ?? true);
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await salvarAcabamento(prev, formData);
      if (r && "ok" in r) {
        toast.success(acabamento ? "Atualizado" : "Criado");
        setOpen(false);
      }
      return r;
    },
    undefined,
  );

  return (
    <>
      {variant === "new" ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Novo acabamento
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>{acabamento ? "Editar acabamento" : "Novo acabamento"}</DialogTitle>
          <DialogDescription>
            Você pode cobrar por m², por unidade fixa, ou os dois. Use 0 ou deixe em branco quando não se aplica.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {acabamento && <input type="hidden" name="id" value={acabamento.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              required
              defaultValue={acabamento?.nome}
              placeholder="Ex: Laminação fosca"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="precoM2">Preço por m² (R$)</Label>
              <Input
                id="precoM2"
                name="precoM2"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={acabamento?.precoM2 ?? ""}
                placeholder="ex: 30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precoFixo">Preço fixo por un (R$)</Label>
              <Input
                id="precoFixo"
                name="precoFixo"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={acabamento?.precoFixo ?? ""}
                placeholder="ex: 5"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="ativo" className="cursor-pointer">
                Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Inativo não aparece na calculadora.
              </p>
            </div>
            <Switch id="ativo" name="ativo" checked={ativo} onCheckedChange={setAtivo} />
          </div>

          {state && "error" in state ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
