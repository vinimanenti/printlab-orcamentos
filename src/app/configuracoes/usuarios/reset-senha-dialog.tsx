"use client";

import { useState, useActionState } from "react";
import { Key, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  redefinirSenha,
  gerarSenhaTemporaria,
  type UsuarioActionResult,
} from "@/lib/actions/usuarios";

/**
 * Dialog para um admin redefinir a senha de qualquer usuário.
 * Gera senha temporária com 1 clique. Avisa o admin para passar
 * pro usuário e pedir pra trocar no primeiro login.
 */
export function ResetSenhaDialog({
  userId,
  userNome,
}: {
  userId: string;
  userNome: string;
}) {
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState("");
  const [feita, setFeita] = useState(false);

  const [state, action, pending] = useActionState<UsuarioActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await redefinirSenha(prev, formData);
      if (r && "ok" in r) {
        toast.success("Senha redefinida");
        setFeita(true);
      }
      return r;
    },
    undefined,
  );

  async function sugerir() {
    const nova = await gerarSenhaTemporaria();
    setSenha(nova);
  }

  function copiar() {
    navigator.clipboard.writeText(senha);
    toast.success("Senha copiada");
  }

  function fechar() {
    setOpen(false);
    // Reset state on close
    setTimeout(() => {
      setSenha("");
      setFeita(false);
    }, 200);
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} title="Resetar senha">
        <Key className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : fechar())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Cria uma senha nova para <strong>{userNome}</strong>. Passe a
              nova senha pra ela e peça pra trocar em <code>/perfil</code> no
              primeiro login.
            </DialogDescription>
          </DialogHeader>

          {feita ? (
            <div className="space-y-3">
              <div className="rounded-md border-2 border-cyan bg-cyan/5 p-4">
                <p className="label-eyebrow mb-2">Nova senha de {userNome}</p>
                <p className="font-mono text-lg break-all">{senha}</p>
              </div>
              <Button variant="outline" onClick={copiar} className="w-full">
                <Copy className="size-4" /> Copiar senha
              </Button>
              <p className="text-xs text-muted-foreground">
                Esta senha não fica salva em nenhum lugar visível depois que
                este dialog fechar — copie agora.
              </p>
              <DialogFooter>
                <Button onClick={fechar}>Pronto</Button>
              </DialogFooter>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <input type="hidden" name="id" value={userId} />

              <div className="space-y-1.5">
                <Label htmlFor="novaSenha">Nova senha</Label>
                <div className="flex gap-2">
                  <Input
                    id="novaSenha"
                    name="novaSenha"
                    type="text"
                    required
                    autoComplete="off"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="mín. 8 caracteres com letra e número"
                  />
                  <Button type="button" variant="outline" onClick={sugerir} title="Gerar aleatória">
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique no ícone pra gerar uma senha temporária aleatória.
                </p>
              </div>

              {state && "error" in state ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={fechar}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Redefinindo…" : "Redefinir senha"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
