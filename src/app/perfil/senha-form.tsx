"use client";

import { useActionState, useState } from "react";
import { Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alterarSenha, type SenhaActionResult } from "@/lib/actions/perfil";

export function SenhaForm() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [state, action, pending] = useActionState<SenhaActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await alterarSenha(prev, formData);
      if (r && "ok" in r) {
        toast.success("Senha alterada com sucesso", {
          icon: <Check className="size-4" />,
        });
        // Limpa os campos
        setNovaSenha("");
        setConfirmacao("");
        // Reseta o form (DOM)
        (document.getElementById("form-senha") as HTMLFormElement | null)?.reset();
      }
      return r;
    },
    undefined,
  );

  // Validações em tempo real para o hint visual
  const novaSenhaValida = novaSenha.length >= 8 && /[A-Za-z]/.test(novaSenha) && /[0-9]/.test(novaSenha);
  const confirmacaoValida = confirmacao.length > 0 && confirmacao === novaSenha;

  return (
    <form id="form-senha" action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="senhaAtual">Senha atual</Label>
        <Input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="rule-thin" />

      <div className="space-y-1.5">
        <Label htmlFor="novaSenha">Nova senha</Label>
        <Input
          id="novaSenha"
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <ul className="text-xs space-y-0.5 mt-2">
          <Requisito
            ok={novaSenha.length >= 8}
            label="Mínimo de 8 caracteres"
          />
          <Requisito ok={/[A-Za-z]/.test(novaSenha)} label="Pelo menos uma letra" />
          <Requisito ok={/[0-9]/.test(novaSenha)} label="Pelo menos um número" />
        </ul>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmacao">Confirmar nova senha</Label>
        <Input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        {confirmacao.length > 0 && (
          <Requisito ok={confirmacaoValida} label="As senhas conferem" />
        )}
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || !novaSenhaValida || !confirmacaoValida}
        className="w-full"
      >
        <Lock className="size-4" />
        {pending ? "Salvando…" : "Alterar senha"}
      </Button>
    </form>
  );
}

function Requisito({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-cyan" : "text-muted-foreground"}`}>
      <span
        className={`inline-flex items-center justify-center size-3.5 rounded-full text-[10px] ${
          ok ? "bg-cyan text-white" : "border border-current"
        }`}
      >
        {ok ? "✓" : ""}
      </span>
      {label}
    </li>
  );
}
