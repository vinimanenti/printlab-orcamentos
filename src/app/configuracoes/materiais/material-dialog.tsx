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
import { salvarMaterial, type ActionResult } from "@/lib/actions/catalogo";

type Material = {
  id: string;
  nome: string;
  precoM2: number;
  larguraBobinaCm: number;
  estoqueMinimoM2: number;
  ativo: boolean;
};

export function MaterialDialog({
  material,
  variant = "edit",
}: {
  material?: Material;
  /** "new" = botão primário "Novo material"; "edit" = botão ghost "Editar" */
  variant?: "new" | "edit";
}) {
  const [open, setOpen] = useState(false);
  const [ativo, setAtivo] = useState(material?.ativo ?? true);
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(
    async (prev, formData) => {
      const result = await salvarMaterial(prev, formData);
      if (result && "ok" in result) {
        toast.success(material ? "Material atualizado" : "Material criado");
        setOpen(false);
      }
      return result;
    },
    undefined,
  );

  const titulo = material ? "Editar material" : "Novo material";

  return (
    <>
      {variant === "new" ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Novo material
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Os valores aqui alimentam a calculadora.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {material && <input type="hidden" name="id" value={material.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              required
              defaultValue={material?.nome}
              placeholder="Ex: Vinil branco brilho"
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
                required
                defaultValue={material?.precoM2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="larguraBobinaCm">Largura da bobina (cm)</Label>
              <Input
                id="larguraBobinaCm"
                name="larguraBobinaCm"
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                required
                defaultValue={material?.larguraBobinaCm}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estoqueMinimoM2">Estoque mínimo (m²) — opcional</Label>
            <Input
              id="estoqueMinimoM2"
              name="estoqueMinimoM2"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              defaultValue={material?.estoqueMinimoM2 ?? 0}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="ativo" className="cursor-pointer">
                Material ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Inativo não aparece na calculadora.
              </p>
            </div>
            <Switch
              id="ativo"
              name="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
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
