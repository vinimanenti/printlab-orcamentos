"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { aprovarArtePublica } from "@/lib/actions/arte";

export function AprovacaoForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modo, setModo] = useState<null | "APROVADA" | "AJUSTE_SOLICITADO">(null);
  const [comentario, setComentario] = useState("");

  function responder(decisao: "APROVADA" | "AJUSTE_SOLICITADO") {
    if (decisao === "AJUSTE_SOLICITADO" && !comentario.trim()) {
      toast.error("Descreva o ajuste necessário.");
      return;
    }
    startTransition(async () => {
      const r = await aprovarArtePublica(token, decisao, comentario);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(decisao === "APROVADA" ? "Arte aprovada! Obrigado." : "Ajuste registrado.");
      router.refresh();
    });
  }

  if (modo === null) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="label-eyebrow">Sua decisão</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Revise a arte e os itens com atenção. Após aprovar, a produção
            começa imediatamente — ajustes posteriores são cobrados à parte.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setModo("APROVADA")}
            className="group border-2 border-foreground bg-foreground text-background rounded-md p-6 text-left hover:bg-cyan hover:border-cyan transition-colors disabled:opacity-50"
          >
            <Check className="size-6 mb-3" />
            <div className="font-semibold text-lg">Aprovar arte</div>
            <div className="text-sm opacity-80 mt-1">
              Tudo certo. Pode iniciar a produção.
            </div>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setModo("AJUSTE_SOLICITADO")}
            className="border-2 border-foreground rounded-md p-6 text-left hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="size-6 mb-3" />
            <div className="font-semibold text-lg">Solicitar ajuste</div>
            <div className="text-sm text-muted-foreground mt-1">
              Tem algo pra mudar. Vou descrever embaixo.
            </div>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="label-eyebrow">
          {modo === "APROVADA" ? "Confirmar aprovação" : "Descreva o ajuste"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {modo === "APROVADA"
            ? "A produção será liberada após sua confirmação."
            : "Seja específico para a equipe ajustar de primeira."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comentario">
          {modo === "APROVADA" ? "Mensagem (opcional)" : "O que precisa mudar?"}
        </Label>
        <Textarea
          id="comentario"
          rows={4}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder={
            modo === "APROVADA"
              ? "Algum comentário antes da produção?"
              : "ex: O texto na lateral precisa ficar maior. A cor de fundo está clara demais."
          }
          autoFocus
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-2 pt-2">
        <Button variant="outline" disabled={pending} onClick={() => setModo(null)}>
          Voltar
        </Button>
        <Button disabled={pending} onClick={() => responder(modo)} size="lg">
          {pending
            ? "Enviando…"
            : modo === "APROVADA"
              ? "✓ Confirmar aprovação"
              : "Enviar pedido de ajuste"}
        </Button>
      </div>
    </section>
  );
}
