"use client";

import { useState, useActionState } from "react";
import { Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Perfil } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  criarUsuario,
  editarUsuario,
  type UsuarioActionResult,
} from "@/lib/actions/usuarios";
import { PERFIL_LABELS, PERFIL_DESCRICOES } from "@/lib/perfil-info";

export type UsuarioData = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  telefone: string | null;
  comissaoPct: number;
  ativo: boolean;
};

const PERFIS_ITEMS: Record<Perfil, string> = {
  ADM: PERFIL_LABELS.ADM,
  VEN: PERFIL_LABELS.VEN,
  PRO: PERFIL_LABELS.PRO,
  FIN: PERFIL_LABELS.FIN,
};

export function UsuarioDialog({
  usuario,
  variant = "edit",
}: {
  usuario?: UsuarioData;
  variant?: "new" | "edit";
}) {
  const isEdit = !!usuario;
  const [open, setOpen] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>(usuario?.perfil ?? "VEN");
  const [ativo, setAtivo] = useState(usuario?.ativo ?? true);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [state, action, pending] = useActionState<UsuarioActionResult | undefined, FormData>(
    async (prev, formData) => {
      const fn = isEdit ? editarUsuario : criarUsuario;
      const r = await fn(prev, formData);
      if (r && "ok" in r) {
        toast.success(isEdit ? "Usuário atualizado" : "Usuário criado");
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
          <Plus className="size-4" /> Novo usuário
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Atualiza dados do usuário. Para trocar a senha, use o botão 'Resetar senha' na lista."
                : "Cria um novo acesso ao sistema. A senha inicial será informada agora — passe pra ela trocar depois."}
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-4">
            {isEdit && <input type="hidden" name="id" value={usuario.id} />}

            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                name="nome"
                required
                defaultValue={usuario?.nome}
                placeholder="ex: Maria da Silva"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={usuario?.email}
                placeholder="maria@printlab.com.br"
              />
              <p className="text-xs text-muted-foreground">Usado para fazer login.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={usuario?.telefone ?? ""}
                placeholder="(14) 99999-0000"
              />
            </div>

            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha inicial</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="mín. 8 caracteres, com letra e número"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label="Mostrar senha"
                  >
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select
                  value={perfil}
                  onValueChange={(v) => v && setPerfil(v as Perfil)}
                  items={PERFIS_ITEMS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PERFIL_LABELS) as Perfil[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PERFIL_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="perfil" value={perfil} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {PERFIL_DESCRICOES[perfil]}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comissaoPct">Comissão (%)</Label>
                <Input
                  id="comissaoPct"
                  name="comissaoPct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  defaultValue={usuario?.comissaoPct ?? 0}
                  disabled={perfil !== "VEN"}
                />
                <p className="text-xs text-muted-foreground">
                  Aplica só a vendedores. Usado no cálculo de comissões.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="ativo" className="cursor-pointer">
                  Usuário ativo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Desativado não consegue logar.
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
                {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
