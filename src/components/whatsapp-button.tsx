"use client";

import { MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Botão genérico de WhatsApp — copia texto e abre wa.me.
 *
 * O texto vem já renderizado do servidor (via renderTemplate em
 * src/lib/templates.ts), então qualquer página que tem um cliente
 * pode usar este componente sem duplicar lógica de formatação.
 */
export function WhatsAppButton({
  texto,
  telefone,
  label = "WhatsApp",
  iconOnly = false,
  variant = "default",
  size = "sm",
  showCopy = true,
}: {
  /** Texto pronto da mensagem (já com {{vars}} substituídas) */
  texto: string;
  /** Telefone do destinatário (com ou sem DDI/máscara — limpamos). Vazio → wa.me sem número */
  telefone?: string | null;
  label?: string;
  iconOnly?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg";
  showCopy?: boolean;
}) {
  function copiar() {
    navigator.clipboard.writeText(texto).then(
      () => toast.success("Texto copiado", { icon: <Check className="size-4" /> }),
      () => toast.error("Não foi possível copiar"),
    );
  }

  function abrirWhatsApp() {
    const fone = (telefone ?? "").replace(/\D/g, "");
    const numeroComDDI = fone && !fone.startsWith("55") ? "55" + fone : fone;
    const url = fone
      ? `https://wa.me/${numeroComDDI}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <>
      {showCopy && (
        <Button variant="outline" size={size} onClick={copiar} title="Copiar texto">
          <Copy className="size-4" />
          {!iconOnly && " Copiar"}
        </Button>
      )}
      <Button variant={variant} size={size} onClick={abrirWhatsApp}>
        <MessageCircle className="size-4" />
        {!iconOnly && ` ${label}`}
      </Button>
    </>
  );
}
