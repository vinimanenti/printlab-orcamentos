# Fases de Entrega

## Fase 1 — Núcleo de Orçamento (S/M/L/XL: **L**)
**Objetivo**: gráfica consegue emitir orçamento de adesivo com calculadora, gerar PDF e mandar pelo WhatsApp. Substitui a planilha do dia 1.

- Auth (NextAuth Credentials, 1 usuário ADM).
- CRUD Cliente + Endereço.
- CRUD Material, TipoImpressao, Acabamento (configurações de preço).
- Calculadora por m² + aproveitamento.
- Orçamento (RASCUNHO → ENVIADO) com itens, PDF e link `wa.me`.
- ConfiguracaoSistema (logo, dados da empresa, margem mínima).
- SequenceCounter para numeração.

Models: `User`, `Cliente`, `Endereco`, `Material`, `TipoImpressao`, `Acabamento`, `Orcamento`, `OrcamentoItem`, `ConfiguracaoSistema`, `SequenceCounter`, `MensagemTemplate`.
Telas: `/login`, `/`, `/clientes`, `/clientes/novo`, `/clientes/[id]`, `/orcamentos`, `/orcamentos/novo`, `/orcamentos/[id]`, `/orcamentos/[id]/pdf`, `/orcamentos/[id]/whatsapp`, `/configuracoes/empresa`, `/configuracoes/materiais`, `/configuracoes/impressoes`, `/configuracoes/acabamentos`.

## Fase 2 — Pedido + Produção básica (**M**)
- Aprovação de orçamento gera Pedido (snapshot read-only).
- Pedido com itens, status, kanban simples (estados fixos).
- Calculadora por cartela.
- Templates de mensagem editáveis.
- Histórico de alterações.

Models: `Pedido`, `PedidoItem`, `PedidoEtapa`, `HistoricoAlteracao`, `MotivoPerda`.
Telas: `/pedidos`, `/pedidos/[id]`, `/producao` (kanban), `/orcamentos/funil`, `/configuracoes/templates`, `/configuracoes/motivos-perda`, `/admin/historico`.

## Fase 3 — Arte e aprovação pública (**M**)
- Upload de arte com versionamento.
- Checklist de arte.
- Link público de aprovação com token.
- Anexos vinculados a cliente/pedido.
- Storage R2 em produção (local em dev).

Models: `Anexo`, `ArteVersao`, `ChecklistArte`, `AprovacaoArte`.
Telas: `/pedidos/[id]/arte`, `/pedidos/[id]/arte/enviar-aprovacao`, `/aprovacao/[token]`, `/producao/checklists`.

## Fase 4 — Financeiro + Entrega (**M**)
- Pagamentos parciais.
- Bloqueio de entrega com saldo aberto.
- Dados de entrega/canal.
- Relatórios financeiros e de vendas básicos.
- Multi-usuário com perfis (VEN, PRO, FIN).

Models: `Pagamento`.
Telas: `/pedidos/[id]/pagamentos`, `/pedidos/[id]/entrega`, `/relatorios/vendas`, `/relatorios/financeiro`, `/configuracoes/usuarios`.

## Fase 5 — Avançado / pós-MVP (**XL**)
- Estoque com baixa automática.
- Cadastro de máquinas e filas.
- CRM funnel completo, taxa de conversão.
- Relatórios de produção e conversão.
- Alertas (cron diário).
- Backups automatizados.

Models: `Maquina`, `EstoqueMovimento`.
Telas: `/configuracoes/maquinas`, `/configuracoes/estoque`, `/configuracoes/produtos`, `/producao/maquinas`, `/relatorios/conversao`, `/relatorios/produtos`, `/relatorios/producao`, `/admin/backups`.

## Grafo de dependências

```
Fase 1 (Núcleo) ──► Fase 2 (Pedido) ──► Fase 3 (Arte)
                          │                  │
                          ▼                  ▼
                   Fase 4 (Financeiro/Entrega)
                          │
                          ▼
                     Fase 5 (Estoque, Máquinas, CRM, Relatórios)
```

Fase 3 e Fase 4 podem rodar em paralelo após Fase 2 se houver banda.