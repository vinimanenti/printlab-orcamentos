"use client";

import { useMemo } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/calculadoras";

type ItemResumo = {
  descricao: string;
  quantidade: number;
  larguraCm: number;
  alturaCm: number;
  precoUnitario: number;
  precoTotal: number;
  material?: string;
  impressao?: string;
  acabamento?: string;
};

/**
 * Gera o texto do orçamento formatado pra WhatsApp e abre wa.me com o cliente.
 * Também copia pra clipboard como alternativa.
 */
export function WhatsAppButton({
  cliente,
  numero,
  total,
  validadeAte,
  empresaNome,
  itens,
  prazoDias,
}: {
  cliente: { nome: string; telefone: string; whatsapp: string | null };
  numero: number;
  total: number;
  validadeAte: Date;
  empresaNome: string;
  itens: ItemResumo[];
  prazoDias: number | null;
}) {
  const texto = useMemo(() => {
    const linhas: string[] = [
      `Olá ${cliente.nome}, tudo bem?`,
      "",
      `Segue o orçamento #${numero} — *${empresaNome}*:`,
      "",
    ];
    itens.forEach((it, ix) => {
      linhas.push(`${ix + 1}. *${it.descricao}*`);
      linhas.push(`   📐 ${it.larguraCm} × ${it.alturaCm} cm × ${it.quantidade} un`);
      const detalhes = [it.material, it.impressao, it.acabamento].filter(Boolean).join(" · ");
      if (detalhes) linhas.push(`   ${detalhes}`);
      linhas.push(`   ${formatBRL(it.precoUnitario)}/un · *${formatBRL(it.precoTotal)}*`);
      linhas.push("");
    });
    linhas.push(`*Total: ${formatBRL(total)}*`);
    linhas.push(`Validade: ${format(validadeAte, "dd/MM/yyyy", { locale: ptBR })}`);
    if (prazoDias != null) linhas.push(`Prazo de produção: ${prazoDias} dias após aprovação`);
    linhas.push("");
    linhas.push("Para aprovar, basta responder confirmando.");
    return linhas.join("\n");
  }, [cliente.nome, numero, total, validadeAte, empresaNome, itens, prazoDias]);

  function copiar() {
    navigator.clipboard.writeText(texto).then(
      () => toast.success("Texto copiado", { icon: <Check className="size-4" /> }),
      () => toast.error("Não foi possível copiar"),
    );
  }

  function abrirWhatsApp() {
    const fone = (cliente.whatsapp || cliente.telefone).replace(/\D/g, "");
    const numeroComDDI = fone.startsWith("55") ? fone : "55" + fone;
    const url = fone
      ? `https://wa.me/${numeroComDDI}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={copiar}>
        <Copy className="size-4" /> Copiar texto
      </Button>
      <Button size="sm" onClick={abrirWhatsApp}>
        <MessageCircle className="size-4" /> WhatsApp
      </Button>
    </>
  );
}
