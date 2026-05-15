"use client";

import { useState, useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { salvarTemplate, type TemplateActionResult } from "@/lib/actions/templates";

type Template = {
  id: string;
  chave: string;
  nome: string;
  corpo: string;
  ativo: boolean;
};

export function TemplateDialog({ template }: { template: Template }) {
  const [open, setOpen] = useState(false);
  const [ativo, setAtivo] = useState(template.ativo);
  const [state, action, pending] = useActionState<TemplateActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await salvarTemplate(prev, formData);
      if (r && "ok" in r) {
        toast.success("Template atualizado");
        setOpen(false);
      }
      return r;
    },
    undefined,
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar template</DialogTitle>
            <DialogDescription>
              Use {"{{cliente}}"}, {"{{numero}}"}, {"{{total}}"}, {"{{validade}}"}, {"{{prazo}}"},{" "}
              {"{{link}}"}, {"{{itens}}"}, {"{{saldo}}"}, {"{{rastreio}}"} conforme o contexto. Os
              colchetes são preservados se a variável não existir.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-4">
            <input type="hidden" name="id" value={template.id} />

            <div className="space-y-1.5">
              <Label htmlFor="chave-readonly">Chave</Label>
              <Input id="chave-readonly" value={template.chave} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                A chave é fixa para que o código saiba qual template usar.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required defaultValue={template.nome} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="corpo">Corpo da mensagem</Label>
              <Textarea
                id="corpo"
                name="corpo"
                required
                defaultValue={template.corpo}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="ativo" className="cursor-pointer">
                Ativo
              </Label>
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
