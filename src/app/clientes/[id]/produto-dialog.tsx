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
import {
  salvarClienteProduto,
  type ClienteProdutoActionResult,
} from "@/lib/actions/cliente-produtos";

const NENHUM = "__nenhum__";

export type CatalogoSelect = {
  materiais: { id: string; nome: string }[];
  impressoes: { id: string; nome: string }[];
  acabamentos: { id: string; nome: string }[];
};

export type ClienteProdutoData = {
  id: string;
  nome: string;
  descricao: string | null;
  larguraCm: number | null;
  alturaCm: number | null;
  quantidadePadrao: number;
  materialId: string | null;
  impressaoId: string | null;
  acabamentoId: string | null;
  margemPct: number | null;
  observacoes: string | null;
  ativo: boolean;
};

export function ProdutoDialog({
  clienteId,
  catalogo,
  produto,
  variant = "edit",
}: {
  clienteId: string;
  catalogo: CatalogoSelect;
  produto?: ClienteProdutoData;
  variant?: "new" | "edit";
}) {
  const isEdit = !!produto;
  const [open, setOpen] = useState(false);
  const [materialId, setMaterialId] = useState(produto?.materialId ?? NENHUM);
  const [impressaoId, setImpressaoId] = useState(produto?.impressaoId ?? NENHUM);
  const [acabamentoId, setAcabamentoId] = useState(produto?.acabamentoId ?? NENHUM);
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);

  const materiaisItems = {
    [NENHUM]: "Não definido",
    ...Object.fromEntries(catalogo.materiais.map((m) => [m.id, m.nome])),
  };
  const impressoesItems = {
    [NENHUM]: "Não definido",
    ...Object.fromEntries(catalogo.impressoes.map((i) => [i.id, i.nome])),
  };
  const acabamentosItems = {
    [NENHUM]: "Nenhum",
    ...Object.fromEntries(catalogo.acabamentos.map((a) => [a.id, a.nome])),
  };

  const [state, action, pending] = useActionState<
    ClienteProdutoActionResult | undefined,
    FormData
  >(async (prev, formData) => {
    const r = await salvarClienteProduto(prev, formData);
    if (r && "ok" in r) {
      toast.success(isEdit ? "Produto atualizado" : "Produto cadastrado");
      setOpen(false);
    }
    return r;
  }, undefined);

  return (
    <>
      {variant === "new" ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Novo produto
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar produto" : "Novo produto do cliente"}
            </DialogTitle>
            <DialogDescription>
              Pré-cadastro pra acelerar orçamentos recorrentes. Aparece como
              atalho na hora de criar orçamento pra este cliente.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-4">
            <input type="hidden" name="clienteId" value={clienteId} />
            {isEdit && <input type="hidden" name="id" value={produto.id} />}

            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do produto</Label>
              <Input
                id="nome"
                name="nome"
                required
                defaultValue={produto?.nome}
                placeholder="ex: Adesivo Resina 3L"
              />
              <p className="text-xs text-muted-foreground">
                Nome curto que vai aparecer na lista de atalhos.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                name="descricao"
                defaultValue={produto?.descricao ?? ""}
                placeholder="Detalhes técnicos do item"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="larguraCm">Largura (cm)</Label>
                <Input
                  id="larguraCm"
                  name="larguraCm"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  defaultValue={produto?.larguraCm ?? ""}
                  placeholder="opcional"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alturaCm">Altura (cm)</Label>
                <Input
                  id="alturaCm"
                  name="alturaCm"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  defaultValue={produto?.alturaCm ?? ""}
                  placeholder="opcional"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantidadePadrao">Qtd. padrão</Label>
                <Input
                  id="quantidadePadrao"
                  name="quantidadePadrao"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  required
                  defaultValue={produto?.quantidadePadrao ?? 1}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Material padrão</Label>
                <Select
                  value={materialId}
                  onValueChange={(v) => v && setMaterialId(v)}
                  items={materiaisItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Não definido</SelectItem>
                    {catalogo.materiais.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="materialId" value={materialId} />
              </div>
              <div className="space-y-1.5">
                <Label>Impressão padrão</Label>
                <Select
                  value={impressaoId}
                  onValueChange={(v) => v && setImpressaoId(v)}
                  items={impressoesItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Não definido</SelectItem>
                    {catalogo.impressoes.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="impressaoId" value={impressaoId} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Acabamento padrão</Label>
                <Select
                  value={acabamentoId}
                  onValueChange={(v) => v && setAcabamentoId(v)}
                  items={acabamentosItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Nenhum</SelectItem>
                    {catalogo.acabamentos.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="acabamentoId" value={acabamentoId} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="margemPct">Margem padrão (%)</Label>
                <Input
                  id="margemPct"
                  name="margemPct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  defaultValue={produto?.margemPct ?? ""}
                  placeholder="ex: 50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                rows={2}
                defaultValue={produto?.observacoes ?? ""}
                placeholder="Notas internas sobre como este cliente prefere"
              />
            </div>

            {isEdit && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="ativo" className="cursor-pointer">
                    Produto ativo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Inativos não aparecem como atalho no orçamento.
                  </p>
                </div>
                <Switch
                  id="ativo"
                  name="ativo"
                  checked={ativo}
                  onCheckedChange={setAtivo}
                />
              </div>
            )}
            {!isEdit && <input type="hidden" name="ativo" value="true" />}

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
