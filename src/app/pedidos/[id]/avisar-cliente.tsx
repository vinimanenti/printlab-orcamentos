import { MessageCircle } from "lucide-react";
import type { PedidoStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { renderTemplate } from "@/lib/templates";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { formatBRL } from "@/lib/calculadoras";

/**
 * Mapeamento status → chave do template no banco.
 * Status sem template não renderiza o card.
 */
const TEMPLATE_POR_STATUS: Partial<Record<PedidoStatus, { chave: string; titulo: string }>> = {
  AGUARDANDO_ARTE: { chave: "pedido_aprovado", titulo: "Confirmar pedido recebido" },
  ARTE_EM_APROVACAO: { chave: "arte_aprovacao", titulo: "Pedir aprovação da arte" },
  EM_PRODUCAO: { chave: "pedido_em_producao", titulo: "Avisar que entrou em produção" },
  PRONTO: { chave: "pedido_pronto", titulo: "Avisar que está pronto" },
  ENTREGUE: { chave: "pedido_enviado", titulo: "Confirmar entrega" },
};

export type AvisarClienteProps = {
  status: PedidoStatus;
  cliente: {
    nome: string;
    telefone: string;
    whatsapp: string | null;
  };
  numero: number;
  total: number;
  saldo: number;
  empresaNome: string;
};

/**
 * Card "Avisar cliente" — mostra a mensagem do template correspondente
 * ao status atual do pedido e botões pra copiar/abrir WhatsApp.
 * Não aparece se não houver template definido pro status atual.
 */
export async function AvisarCliente({
  status,
  cliente,
  numero,
  total,
  saldo,
  empresaNome,
}: AvisarClienteProps) {
  const config = TEMPLATE_POR_STATUS[status];
  if (!config) return null;

  const texto = await renderTemplate(config.chave, {
    cliente: cliente.nome,
    numero: `#${String(numero).padStart(4, "0")}`,
    total: formatBRL(total),
    saldo: formatBRL(saldo),
    empresa: empresaNome,
    // {{link}} e {{rastreio}} ficam como placeholder literal pra vendedor
    // editar manualmente quando aplicável (link de aprovação ou código)
  });

  if (!texto) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="size-4 text-cyan" />
          Avisar cliente
          <Badge variant="outline" className="ml-1 text-[10px]">
            {config.chave}
          </Badge>
        </CardTitle>
        <CardDescription>
          {config.titulo}. Texto vem do template <code>{config.chave}</code> —
          edite em <a className="underline" href="/configuracoes/templates">/configuracoes/templates</a>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="text-xs whitespace-pre-wrap font-sans bg-muted/40 rounded p-3 leading-relaxed">
          {texto}
        </pre>
        <div className="flex gap-2 justify-end">
          <WhatsAppButton
            texto={texto}
            telefone={cliente.whatsapp || cliente.telefone}
            label="Enviar pelo WhatsApp"
          />
        </div>
      </CardContent>
    </Card>
  );
}
