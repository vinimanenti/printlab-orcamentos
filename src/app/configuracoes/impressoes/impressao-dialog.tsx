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
import { salvarImpressao, type ActionResult } from "@/lib/actions/catalogo";

type Impressao = { id: string; nome: string; precoM2: number; ativo: boolean };

export function ImpressaoDialog({
  impressao,
  variant = "edit",
}: {
  impressao?: Impressao;
  variant?: "new" | "edit";
}) {
  const [open, setOpen] = useState(false);
  const [ativo, setAtivo] = useState(impressao?.ativo ?? true);
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await salvarImpressao(prev, formData);
      if (r && "ok" in r) {
        toast.success(impressao ? "Atualizado" : "Criado");
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
          <Plus className="size-4" /> Novo tipo
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>{impressao ? "Editar tipo de impressão" : "Novo tipo"}</DialogTitle>
          <DialogDescription>
            Custo adicional aplicado por m² impresso.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {impressao && <input type="hidden" name="id" value={impressao.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              required
              defaultValue={impressao?.nome}
              placeholder="Ex: HP Látex"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="precoM2">Custo por m² (R$)</Label>
            <Input
              id="precoM2"
              name="precoM2"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              defaultValue={impressao?.precoM2 ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              Use 0 quando o custo já estiver embutido no material.
            </p>
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
