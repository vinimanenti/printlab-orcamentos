"use client";

import { useState, useActionState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { salvarCliente, type ClienteActionResult } from "@/lib/actions/clientes";

export type ClienteDialogData = {
  id: string;
  tipo: "PF" | "PJ";
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string;
  whatsapp: string | null;
  observacoes: string | null;
  ativo: boolean;
};

export function ClienteDialog({
  cliente,
  variant = "edit",
}: {
  cliente?: ClienteDialogData;
  variant?: "new" | "edit";
}) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"PF" | "PJ">(cliente?.tipo ?? "PF");
  const [ativo, setAtivo] = useState(cliente?.ativo ?? true);
  const [state, action, pending] = useActionState<ClienteActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await salvarCliente(prev, formData);
      if (r && "ok" in r) {
        toast.success(cliente ? "Cliente atualizado" : "Cliente criado");
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
          <Plus className="size-4" /> Novo cliente
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>
              Dados básicos para gerar orçamentos e contato.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-4">
            {cliente && <input type="hidden" name="id" value={cliente.id} />}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={tipo}
                  onValueChange={(v) => v && setTipo(v as "PF" | "PJ")}
                  items={{ PF: "Pessoa física", PJ: "Empresa" }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa física</SelectItem>
                    <SelectItem value="PJ">Empresa</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="tipo" value={tipo} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nome">{tipo === "PJ" ? "Razão social" : "Nome"}</Label>
                <Input
                  id="nome"
                  name="nome"
                  required
                  defaultValue={cliente?.nome}
                  placeholder={tipo === "PJ" ? "ex: PrintLab LTDA" : "ex: Maria Silva"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="documento">{tipo === "PJ" ? "CNPJ" : "CPF"}</Label>
                <Input
                  id="documento"
                  name="documento"
                  defaultValue={cliente?.documento ?? ""}
                  placeholder={tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={cliente?.email ?? ""}
                  placeholder="ex: maria@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  required
                  inputMode="tel"
                  defaultValue={cliente?.telefone}
                  placeholder="(11) 98765-4321"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  inputMode="tel"
                  defaultValue={cliente?.whatsapp ?? ""}
                  placeholder="(11) 98765-4321"
                />
                <p className="text-xs text-muted-foreground">
                  Se vazio, usa o telefone.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                defaultValue={cliente?.observacoes ?? ""}
                placeholder="Notas comerciais ou internas"
              />
            </div>

            {cliente && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="ativo" className="cursor-pointer">
                    Cliente ativo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Inativos não aparecem em listas padrão.
                  </p>
                </div>
                <Switch id="ativo" name="ativo" checked={ativo} onCheckedChange={setAtivo} />
              </div>
            )}
            {!cliente && <input type="hidden" name="ativo" value="true" />}

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
