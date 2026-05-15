# PrintLab Orçamentos — Plano de Arquitetura

Sistema web mono-tenant para gráfica de comunicação visual: cadastro de clientes, orçamentos com calculadora de adesivos (m², bobina, cartela), conversão em pedidos, kanban de produção, aprovação pública de arte por link, PDF de orçamento e mensagens WhatsApp via `wa.me`. Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + Prisma + Postgres + NextAuth + shadcn/ui + @react-pdf/renderer, hospedado na Vercel com banco Neon e arquivos em Cloudflare R2.

## Índice

| Documento | Descrição |
|---|---|
| [01-sitemap.md](./01-sitemap.md) | Mapa completo de rotas por seção e perfil de acesso. |
| [02-fluxo-orcamento-pedido.md](./02-fluxo-orcamento-pedido.md) | Fluxo end-to-end e máquinas de estado de Orçamento/Pedido. |
| [03-schema-banco.md](./03-schema-banco.md) | Schema Prisma completo com enums, índices e justificativas. |
| [04-calculadoras.md](./04-calculadoras.md) | Pseudocódigo TS das três calculadoras (m², bobina, cartela) com exemplos numéricos. |
| [05-layouts.md](./05-layouts.md) | Wireframes ASCII das 7 telas principais e notas de responsividade. |
| [06-mvp-fases.md](./06-mvp-fases.md) | Quebra do MVP em 5 fases sequenciais com grafo de dependências. |
| [07-stack-decisoes.md](./07-stack-decisoes.md) | Decisões técnicas concretas com justificativa curta. |