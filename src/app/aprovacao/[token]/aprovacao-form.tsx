"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sua resposta</CardTitle>
          <CardDescription>
            Por favor, revise a arte com atenção. Após aprovar, a produção começa imediatamente —
            ajustes posteriores são cobrados à parte.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            disabled={pending}
            onClick={() => setModo("APROVADA")}
            className="h-14"
          >
            <Check className="size-5" /> Aprovar arte
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={pending}
            onClick={() => setModo("AJUSTE_SOLICITADO")}
            className="h-14"
          >
            <X className="size-5" /> Solicitar ajuste
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {modo === "APROVADA" ? "Confirmar aprovação" : "Descreva o ajuste"}
        </CardTitle>
        <CardDescription>
          {modo === "APROVADA"
            ? "A produção será liberada após sua confirmação."
            : "Seja específico para a equipe ajustar de primeira."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <div className="grid sm:grid-cols-2 gap-2">
          <Button variant="outline" disabled={pending} onClick={() => setModo(null)}>
            Voltar
          </Button>
          <Button disabled={pending} onClick={() => responder(modo)}>
            {pending
              ? "Enviando…"
              : modo === "APROVADA"
                ? "Confirmar aprovação"
                : "Enviar pedido de ajuste"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
