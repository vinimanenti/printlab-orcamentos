# Decisões Técnicas

## Banco de dados — **Neon Postgres**
Postgres gerenciado serverless, free tier suficiente para single-tenant, branching para preview environments na Vercel, backups automáticos diários. Latência baixa quando colocado em região próxima da Vercel (sa-east-1 ou us-east-1). Alternativa: Supabase é overkill (vem com auth/storage que não usaremos).

## Auth — **NextAuth.js v5 (Auth.js)**
- Provider único: **Credentials** (email + senha hash com `argon2`).
- Sessão JWT (sem tabela de sessão) — mais simples para mono-tenant.
- Middleware `auth()` em `src/middleware.ts` protege rotas `(app)/*`; libera `/aprovacao/[token]` e `/login`.
- Roles via campo `perfil` no JWT; helper `requireRole(perfil)` em server actions.
- Google OAuth fica como TODO opcional pós-MVP.

## ORM — **Prisma**
Confirmado. Migrations versionadas em `prisma/migrations`. Cliente singleton em `src/lib/prisma.ts`. Middleware para `HistoricoAlteracao`.

## UI — **shadcn/ui + Tailwind CSS 4**
Confirmado. Componentes a instalar via CLI:
`button, input, label, textarea, select, checkbox, radio-group, switch, form, dialog, sheet, drawer, tabs, table, card, badge, separator, command, popover, dropdown-menu, toast (sonner), tooltip, alert, alert-dialog, calendar, date-picker, avatar, skeleton, progress, breadcrumb, navigation-menu`.
DataTable construída sobre **TanStack Table v8** com paginação server-side. Charts em **Recharts**. Paleta: preto/branco/cinza/ciano/magenta/amarelo (CSS variables Tailwind).

## Armazenamento de arquivos
- **Dev**: pasta `./uploads/` (gitignored), servida via route handler `/api/uploads/[...path]`.
- **Prod**: **Cloudflare R2** (S3-compatível, sem egress fee). Adapter via `@aws-sdk/client-s3`. URLs assinadas com TTL 24h para downloads autenticados; públicas (sem assinatura) para previews de arte na página `/aprovacao`.

## PDF — **@react-pdf/renderer**
Templates JSX para orçamento e pedido. Geração on-demand em route handler `/orcamentos/[id]/pdf` com `Content-Disposition: inline`. Logo lido de `ConfiguracaoSistema.empresaLogoPath`.

## WhatsApp — **`wa.me` deep links + clipboard**
Sem API oficial. Em `/orcamentos/[id]/whatsapp`: render do texto com Mustache simples sobre `MensagemTemplate`, botão "Abrir WhatsApp" (`wa.me/55<telefone>?text=<encoded>`) e botão "Copiar texto" (Clipboard API). Anexar PDF: instrui usuário a colar manualmente após abrir o chat (link curto para PDF gerado).

## Formulários — **react-hook-form + zod**
Schemas zod compartilhados entre client (`useForm` resolver) e server actions (parsing). Localização de mensagens via `zod-i18n-map` PT-BR.

## State e data — **RSC + Server Actions** como padrão
- Listas, detalhes, mutations CRUD: Server Components + Server Actions com `revalidatePath`.
- Cliente reativo apenas onde necessário:
  - Calculadora ao vivo (recalcula a cada mudança) — estado local React.
  - Kanban com drag-and-drop — **dnd-kit** + Server Action no drop com optimistic update.
  - Busca de cliente no Command — Server Action com debounce, sem TanStack Query.
- TanStack Query só entra se aparecer cenário de polling/refetch complexo (não no MVP).

## Drag-and-drop kanban — **dnd-kit/core + sortable**
Acessível, leve, suporta touch. Move card → Server Action atualiza `PedidoStatus`/`PedidoEtapa.status`.

## Charts — **Recharts**
Simples, integra com shadcn (`chart` component). Funil, barras de vendas/mês, linha de conversão.

## Dinheiro — **Prisma `Decimal` + helper `formatBRL`**
Schema usa `@db.Decimal(12,2)` para totais e `@db.Decimal(12,4)` para áreas. No client convertemos `Decimal.toNumber()` somente no momento de formatar. Helper `formatBRL(value)` em `src/lib/format.ts` usa `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Cálculos intermediários da calculadora usam `Decimal.js` puro (já vem com Prisma).

## Validação — **zod**
Schemas em `src/lib/schemas/*.ts`, reusados por server actions e forms. Exemplo: `clienteSchema`, `orcamentoItemSchema`, `calculoM2InputSchema`.

## Testes
- **Unitários** (calculadoras, validações): **Vitest**.
- **E2E** (fluxo orçamento → pedido → aprovação arte): **Playwright**, executa em CI pós-MVP. Banco de teste com `prisma migrate reset` em fixture global.

## Deploy — **Vercel**
- Variáveis: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `APP_BASE_URL`.
- Preview deploy por PR conectado a branch Neon.
- Cron: `vercel.json` define `/api/cron/alertas` (diário) e `/api/cron/backup-check` (semanal).

## Backup
Neon faz snapshots automáticos (7 dias retenção no plano free). Adicional: **Vercel Cron** roda `/api/cron/export-dump` semanal que gera dump via `pg_dump` e envia para R2 em bucket separado com lifecycle de 90 dias. Notifica via e-mail em falha.

## Decisões/assunções tomadas frente a ambiguidade da spec
1. Único tenant — sem conceito de Filial.
2. Cliente PF e PJ no mesmo model com `tipo` enum (não tabela separada).
3. Margem mínima é única global em `ConfiguracaoSistema` (não por produto).
4. Acabamento pode ser cobrado por m² **ou** valor fixo — modelado como dois campos opcionais.
5. Orçamento aprovado é imutável; correções viram novo orçamento ou edição no Pedido.
6. WhatsApp via `wa.me` apenas (sem API Business).
7. Anexos de arte são imagens ou PDFs; preview na página pública usa `<embed>` para PDF e `<img>` para imagem.
8. Numeração reseta nunca (sequencial perpétuo). Prefixos configuráveis para exibição apenas (`ORC-000142`).