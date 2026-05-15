# Fluxo Orçamento → Pedido → Entrega

## Fluxo numerado

1. **Contato do cliente** (WhatsApp/telefone/balcão). Vendedor abre `/orcamentos/novo`.
2. **Busca/cadastro de cliente**: campo Command com busca por nome/CPF/CNPJ/telefone. Se não existir, modal de cadastro rápido (nome, telefone, PF/PJ, documento opcional).
3. **Criação do orçamento em RASCUNHO**: número sequencial atribuído na primeira gravação via `SequenceCounter`.
4. **Adição de itens**: cada item dispara a calculadora apropriada (m², bobina ou cartela). Vendedor preenche medida, quantidade, material, impressão, acabamento. Sistema calcula preço sugerido e checa margem mínima.
5. **Ajuste manual**: vendedor pode sobrescrever o preço unitário, mas o sistema bloqueia se ficar abaixo da margem mínima configurada (a menos que ADM autorize).
6. **Revisão e gravação**: status permanece `RASCUNHO`. PDF disponível.
7. **Envio ao cliente**: ação "Enviar por WhatsApp" — gera texto via template, abre `wa.me/<telefone>?text=<encoded>`. Status passa a `ENVIADO` e grava `enviadoEm`.
8. **Acompanhamento**: vendedor pode marcar como `EM_NEGOCIACAO` (opcional, manual).
9. **Aprovação do cliente**: vendedor clica "Aprovar orçamento". Sistema:
   - Status orçamento → `APROVADO`, congela snapshot (read-only).
   - Cria `Pedido` automaticamente copiando itens, totais e cliente. Pedido nasce em `AGUARDANDO_ARTE`.
   - Numera o pedido via `SequenceCounter`.
10. **Upload de arte**: produção/vendedor faz upload em `/pedidos/[id]/arte`. Cada upload cria uma `ArteVersao`.
11. **Checklist de arte**: ao clicar "Validar arte", abre formulário do `ChecklistArte` (sangria, resolução, cores, fontes convertidas, traçados de corte). Só permite envio ao cliente se checklist completo.
12. **Aprovação pública**: gera `AprovacaoArte` com token UUID. Vendedor envia link `wa.me` com URL `/aprovacao/[token]`. Cliente acessa, vê preview, aprova ou solicita ajuste. Aprovação registra IP, user-agent e timestamp.
13. **Liberação para produção**: status pedido → `EM_PRODUCAO`. Aparece no kanban.
14. **Etapas de produção**: cada `PedidoEtapa` (impressão, recorte, laminação, acabamento) muda no kanban via drag-and-drop. Sistema baixa `EstoqueMovimento` da máquina/material ao iniciar a etapa de impressão.
15. **Pronto**: status → `PRONTO`. Notifica vendedor para cobrar e agendar entrega.
16. **Pagamento**: registrado em `Pagamento` (à vista, parcelado, sinal/saldo). Pedido só vai para `ENTREGUE` com saldo zero (configurável).
17. **Entrega/retirada**: status → `ENTREGUE`. Registra data, responsável e canal (retirada balcão / motoboy / transportadora).
18. **Pós-venda**: pedido entra em métricas, dispara alerta de recorrência se aplicável.

## Estados do `Orcamento.status`

| De → Para | Gatilho | Quem |
|---|---|---|
| - → `RASCUNHO` | Criação | VEN/ADM |
| `RASCUNHO` → `ENVIADO` | Ação "Enviar WhatsApp/PDF" | VEN/ADM |
| `ENVIADO` → `EM_NEGOCIACAO` | Manual | VEN/ADM |
| `ENVIADO`/`EM_NEGOCIACAO` → `APROVADO` | Ação "Aprovar" (gera Pedido) | VEN/ADM |
| `ENVIADO`/`EM_NEGOCIACAO` → `PERDIDO` | Ação "Marcar como perdido" (exige `MotivoPerda`) | VEN/ADM |
| `RASCUNHO` → `CANCELADO` | Ação "Cancelar" | VEN/ADM |
| `APROVADO` → ❌ | Imutável após aprovação (snapshot) | — |

## Estados do `Pedido.status`

| De → Para | Gatilho | Quem |
|---|---|---|
| - → `AGUARDANDO_ARTE` | Criado por aprovação de orçamento | sistema |
| `AGUARDANDO_ARTE` → `ARTE_EM_APROVACAO` | Envio do link público | VEN/ADM |
| `ARTE_EM_APROVACAO` → `AGUARDANDO_ARTE` | Cliente solicita ajuste | sistema (via página pública) |
| `ARTE_EM_APROVACAO` → `EM_PRODUCAO` | Cliente aprova arte | sistema (via página pública) |
| `EM_PRODUCAO` → `ACABAMENTO` | Kanban | PRO/ADM |
| `ACABAMENTO` → `PRONTO` | Kanban | PRO/ADM |
| `PRONTO` → `ENTREGUE` | Ação "Marcar entregue" (exige pagamento OK) | VEN/ADM/FIN |
| qualquer → `CANCELADO` | Ação "Cancelar" (exige justificativa) | ADM |

## Ações automáticas (destacadas)

- **Conversão orçamento → pedido**: ao aprovar, o orçamento é **clonado em snapshot read-only**. Toda edição posterior é no `Pedido`, nunca no `Orcamento`. Se houver erro detectado após aprovação, abrir novo orçamento.
- **Numeração**: `Orcamento.numero` e `Pedido.numero` são atribuídos no primeiro `save` via transação com `SequenceCounter` (lock row-level) para evitar buracos.
- **Estoque**: baixa automática na transição `AGUARDANDO_ARTE`/`ARTE_EM_APROVACAO` → `EM_PRODUCAO`.
- **Histórico**: todo `UPDATE` em Orçamento, Pedido, Cliente, Produto grava em `HistoricoAlteracao` (via middleware Prisma).
- **Alertas**: cron diário verifica pedidos parados >3 dias em uma etapa, orçamentos enviados sem resposta >7 dias, materiais com estoque abaixo do mínimo.