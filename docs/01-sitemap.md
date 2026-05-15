# Sitemap

Perfis: **ADM** (Administrador), **VEN** (Vendedor), **PRO** (Produção), **FIN** (Financeiro). ADM acessa tudo.

## Autenticação (pública)
| Rota | Descrição | Acesso |
|---|---|---|
| `/login` | Login com e-mail/senha (NextAuth Credentials) | público |
| `/aprovacao/[token]` | Página pública de aprovação de arte (sem login, token UUID) | público |

## Dashboard
| Rota | Descrição | Acesso |
|---|---|---|
| `/` | Painel com KPIs do mês, gráficos, alertas, atalhos | ADM, VEN, FIN |

## Clientes
| Rota | Descrição | Acesso |
|---|---|---|
| `/clientes` | Lista com busca, filtro PF/PJ, paginação | ADM, VEN |
| `/clientes/novo` | Cadastro de cliente | ADM, VEN |
| `/clientes/[id]` | Ficha + abas (dados, endereços, histórico, anexos) | ADM, VEN |
| `/clientes/[id]/editar` | Edição | ADM, VEN |

## Orçamentos
| Rota | Descrição | Acesso |
|---|---|---|
| `/orcamentos` | Lista com filtros por status, cliente, data, vendedor | ADM, VEN |
| `/orcamentos/novo` | Wizard de novo orçamento (cliente → itens → calculadora → revisão) | ADM, VEN |
| `/orcamentos/[id]` | Detalhe do orçamento (visual + ações) | ADM, VEN |
| `/orcamentos/[id]/editar` | Edição (apenas se status RASCUNHO ou ENVIADO) | ADM, VEN |
| `/orcamentos/[id]/pdf` | Geração/preview do PDF | ADM, VEN |
| `/orcamentos/[id]/whatsapp` | Tela com texto pronto e botão `wa.me` | ADM, VEN |
| `/orcamentos/funil` | Funil CRM kanban (rascunho → enviado → aprovado/perdido) | ADM, VEN |

## Pedidos
| Rota | Descrição | Acesso |
|---|---|---|
| `/pedidos` | Lista de pedidos com filtros | ADM, VEN, PRO, FIN |
| `/pedidos/[id]` | Detalhe completo com abas (itens, arte, produção, pagamentos, entrega) | ADM, VEN, PRO, FIN |
| `/pedidos/[id]/arte` | Upload e versionamento de arte + checklist | ADM, VEN, PRO |
| `/pedidos/[id]/arte/enviar-aprovacao` | Gera link público e mensagem WhatsApp | ADM, VEN |
| `/pedidos/[id]/pagamentos` | Lançamento de pagamentos parciais/total | ADM, VEN, FIN |
| `/pedidos/[id]/entrega` | Dados de entrega/retirada | ADM, VEN, PRO |

## Produção
| Rota | Descrição | Acesso |
|---|---|---|
| `/producao` | Kanban (Aguardando arte → Em produção → Acabamento → Pronto → Entregue) | ADM, PRO |
| `/producao/checklists` | Lista de checklists de arte pendentes | ADM, PRO |
| `/producao/maquinas` | Status das máquinas e fila por máquina | ADM, PRO |

## Configurações
| Rota | Descrição | Acesso |
|---|---|---|
| `/configuracoes` | Hub de configurações | ADM |
| `/configuracoes/empresa` | Dados da gráfica, logo, CNPJ, contato | ADM |
| `/configuracoes/precos` | Tabela de preços base (materiais, impressões, acabamentos) | ADM |
| `/configuracoes/materiais` | CRUD de materiais (mídia, vinil, lona, etc.) | ADM |
| `/configuracoes/impressoes` | CRUD de tipos de impressão (Látex, Ecossolvente, UV) | ADM |
| `/configuracoes/acabamentos` | CRUD de acabamentos (laminação, recorte, resina) | ADM |
| `/configuracoes/produtos` | CRUD de produtos pré-cadastrados | ADM |
| `/configuracoes/maquinas` | CRUD de máquinas (largura útil, status, manutenção) | ADM |
| `/configuracoes/estoque` | Movimentação e saldo de materiais | ADM, PRO |
| `/configuracoes/templates` | Templates de WhatsApp e e-mail | ADM |
| `/configuracoes/motivos-perda` | CRUD de motivos de perda | ADM |
| `/configuracoes/usuarios` | CRUD de usuários e perfis | ADM |
| `/configuracoes/sistema` | Margem mínima, prefixos, numeração, sequências | ADM |

## Relatórios
| Rota | Descrição | Acesso |
|---|---|---|
| `/relatorios` | Hub de relatórios | ADM, FIN |
| `/relatorios/vendas` | Vendas por período, vendedor, cliente | ADM, FIN |
| `/relatorios/produtos` | Mais vendidos, margem por produto | ADM, FIN |
| `/relatorios/conversao` | Taxa de conversão orçamento → pedido | ADM, VEN |
| `/relatorios/financeiro` | A receber, recebido, inadimplência | ADM, FIN |
| `/relatorios/producao` | Tempo médio por etapa, gargalos | ADM, PRO |

## Admin
| Rota | Descrição | Acesso |
|---|---|---|
| `/admin/historico` | Log de alterações (audit trail) | ADM |
| `/admin/backups` | Status dos backups | ADM |

## Árvore de URLs

```
/
├── login
├── aprovacao/[token]
├── (app)
│   ├── /                           (dashboard)
│   ├── clientes/
│   │   ├── novo
│   │   └── [id]/
│   │       └── editar
│   ├── orcamentos/
│   │   ├── novo
│   │   ├── funil
│   │   └── [id]/
│   │       ├── editar
│   │       ├── pdf
│   │       └── whatsapp
│   ├── pedidos/
│   │   └── [id]/
│   │       ├── arte/
│   │       │   └── enviar-aprovacao
│   │       ├── pagamentos
│   │       └── entrega
│   ├── producao/
│   │   ├── checklists
│   │   └── maquinas
│   ├── configuracoes/
│   │   ├── empresa
│   │   ├── precos
│   │   ├── materiais
│   │   ├── impressoes
│   │   ├── acabamentos
│   │   ├── produtos
│   │   ├── maquinas
│   │   ├── estoque
│   │   ├── templates
│   │   ├── motivos-perda
│   │   ├── usuarios
│   │   └── sistema
│   ├── relatorios/
│   │   ├── vendas
│   │   ├── produtos
│   │   ├── conversao
│   │   ├── financeiro
│   │   └── producao
│   └── admin/
│       ├── historico
│       └── backups
```