# Wireframes das Telas Principais

Convenção: caixas em ASCII, `[btn]` = botão, `<...>` = campo, `==>` = navegação. Mobile colapsa sidebar em drawer e tabelas viram cards empilhados.

## 1. Dashboard `/`

```
┌─────────────────────────────────────────────────────────────────┐
│ PrintLab  [Buscar...]              Olá, Vini ▾   🔔 3           │
├────────────┬────────────────────────────────────────────────────┤
│ ▸ Início   │  Resumo do mês                                     │
│   Clientes │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│   Orçament.│  │Orçam: 42 │ │Aprov: 18 │ │R$ 24.300 │ │Conv 43%││
│   Pedidos  │  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│   Produção │                                                    │
│   Relatór. │  ┌──── Funil últimos 30d ──────┐  ┌── Alertas ───┐│
│   Config.  │  │ ▆▆▆▆▆▆▆▆ Rascunho   12      │  │• 4 sem resp. ││
│            │  │ ▆▆▆▆▆ Enviado        8      │  │• 2 estoque ↓ ││
│            │  │ ▆▆▆ Aprovado         5      │  │• 3 atrasados ││
│            │  └─────────────────────────────┘  └──────────────┘│
│            │                                                    │
│            │  Atalhos: [+ Novo orçamento] [+ Cliente]           │
└────────────┴────────────────────────────────────────────────────┘
```
Mobile: KPIs viram 2x2 grid; sidebar vira menu hamburger.

## 2. Lista de Orçamentos `/orcamentos`

```
┌─────────────────────────────────────────────────────────────────┐
│ Orçamentos                          [+ Novo orçamento]          │
│ [Status ▾] [Cliente <...>] [Período] [Vendedor ▾]   [Limpar]    │
├─────────────────────────────────────────────────────────────────┤
│ # ▾  | Cliente     | Itens | Total      | Status      | Ações  │
│ 142  | Padaria do… |   3   | R$ 1.240,00| ENVIADO     | ⋯      │
│ 141  | João Silva  |   1   | R$ 115,00  | APROVADO    | ⋯      │
│ 140  | …                                                        │
├─────────────────────────────────────────────────────────────────┤
│ [< 1 2 3 ... >]                                  120 resultados │
└─────────────────────────────────────────────────────────────────┘
```
Mobile: colunas Itens e Vendedor escondem; cada linha vira card com Cliente, Total, Status.

## 3. Novo Orçamento `/orcamentos/novo` (com calculadora)

```
┌─────────────────────────────────────────────────────────────────┐
│ Novo orçamento                                  Rascunho · #143 │
├─────────────────────────────────────────────────────────────────┤
│ Cliente: [🔍 Buscar ou cadastrar...]      [+ Novo cliente]      │
│ Vendedor: [Vini Manenti ▾]   Validade: [7] dias                 │
├─────────────────────────────────────────────────────────────────┤
│ Itens                                          [+ Adicionar]    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Item 1 · Adesivo personalizado            [×]               │ │
│ │ ┌─Calculadora───────────────┐ ┌─Resultado em tempo real──┐  │ │
│ │ │ Unidade: [m²▾] [cartela] │ │ Área un.: 0,0025 m²       │  │ │
│ │ │ L: [5] cm  A: [5] cm     │ │ Aproveitamento: 98,4%     │  │ │
│ │ │ Qtd: [1000]              │ │ Custo: R$ 57,82           │  │ │
│ │ │ Material: [Vinil ▾]      │ │ Margem: 50% (mín 20%)     │  │ │
│ │ │ Impressão: [Látex ▾]     │ │ Total: R$ 115,64          │  │ │
│ │ │ Acabamento: [— ▾]        │ │ Unitário: R$ 0,12         │  │ │
│ │ │ Margem: [50] %           │ │                           │  │ │
│ │ └──────────────────────────┘ │ [Preço manual: ____]       │  │
│ │                              └────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Subtotal: R$ 115,64   Desconto: R$ [0,00]   Total: R$ 115,64    │
│ Observações: [____________________________________________]      │
│           [Salvar rascunho]  [Gerar PDF]  [Enviar WhatsApp]     │
└─────────────────────────────────────────────────────────────────┘
```
Mobile: calculadora e resultado empilham verticalmente; barra de ações fica fixa no rodapé.

## 4. Detalhe do Pedido `/pedidos/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│ Pedido #87 · Padaria do João           Status: EM_PRODUCAO      │
│ Orçamento origem #142 · Vendedor: Vini · Prazo: 18/05/2026      │
├─────────────────────────────────────────────────────────────────┤
│ [Itens] [Arte] [Produção] [Pagamentos] [Entrega] [Histórico]    │
├─────────────────────────────────────────────────────────────────┤
│ Itens                                                            │
│  1. Adesivo 5×5 × 1000     R$ 115,64                            │
│  2. Banner 1×2m × 1         R$ 90,00                            │
│  ─────                                                          │
│  Total: R$ 205,64    Pago: R$ 100,00    Saldo: R$ 105,64        │
├─────────────────────────────────────────────────────────────────┤
│ Etapas                                                          │
│  ✓ Aguardando arte (concluída 12/05)                            │
│  ✓ Arte aprovada (13/05)                                        │
│  ● Impressão — Látex 365 — iniciada 14/05                       │
│  ○ Recorte                                                      │
│  ○ Laminação                                                    │
│  ○ Pronto                                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Kanban de Produção `/producao`

```
┌─────────────────────────────────────────────────────────────────┐
│ Produção                            [Filtro: Máquina ▾] [Hoje ▾]│
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│Aguard.   │Em produç.│Acabament.│Pronto    │Entregue  │         │
│ARTE (4)  │(6)       │(2)       │(3)       │(12)      │         │
├──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│┌────────┐│┌────────┐│┌────────┐│┌────────┐│          │         │
││#87 João││#85 Bar  ││#82 Loja││#80 Café││          │         │
││Pad.    ││Maria   ││Fashion ││Doce    ││          │         │
││18/05 ⚠ ││17/05   ││16/05   ││15/05   ││          │         │
│└────────┘│└────────┘│└────────┘│└────────┘│          │         │
│┌────────┐│┌────────┐│          │          │          │         │
││#88 …   ││#86 …   ││          │          │          │         │
│└────────┘│└────────┘│          │          │          │         │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
```
Drag-and-drop (dnd-kit) entre colunas. Mobile: scroll horizontal entre colunas.

## 6. Cadastro de Cliente `/clientes/novo`

```
┌─────────────────────────────────────────────────────────────────┐
│ Novo cliente                                                    │
├─────────────────────────────────────────────────────────────────┤
│ Tipo: ( ) PF (•) PJ                                              │
│ Razão social/Nome: [_______________________________________]    │
│ CNPJ/CPF: [____________]   IE: [__________]                     │
│ Email: [_________________]   Telefone: [_____________]          │
│ WhatsApp: [_____________] [usar mesmo do telefone]              │
├─────────────────────────────────────────────────────────────────┤
│ Endereço principal                            [+ outro endereço]│
│ CEP: [_______] [🔍]   Logradouro: [____________________________]│
│ Nº: [____]   Compl.: [_______]   Bairro: [_____________]        │
│ Cidade: [_______________]   UF: [SP ▾]                          │
├─────────────────────────────────────────────────────────────────┤
│ Observações: [____________________________________________]      │
│                                          [Cancelar]  [Salvar]   │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Aprovação Pública de Arte `/aprovacao/[token]`

```
┌─────────────────────────────────────────────────────────────────┐
│        🖨 PrintLab — Aprovação de arte                          │
├─────────────────────────────────────────────────────────────────┤
│   Olá, João!  Pedido #87 — Padaria do João                      │
│   Por favor revise a arte antes de liberarmos para impressão.   │
│                                                                 │
│            ┌──────────────────────────┐                         │
│            │                          │                         │
│            │      [preview arte]      │                         │
│            │     (PNG ou PDF embed)   │                         │
│            │                          │                         │
│            └──────────────────────────┘                         │
│                                                                 │
│   Versão 2 — enviada em 14/05/2026                              │
│                                                                 │
│   Comentário (opcional): [_______________________________]       │
│                                                                 │
│        [ ✗ Solicitar ajuste ]     [ ✓ Aprovar arte ]            │
│                                                                 │
│   Após aprovar, sua arte vai para produção e não poderá ser     │
│   alterada. Em caso de dúvida, fale com nosso WhatsApp.         │
└─────────────────────────────────────────────────────────────────┘
```
Sem login, sem header com dados internos. Token expira em N dias (config).