# Schema do Banco (Prisma + Postgres)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ ENUMS ============

enum Perfil {
  ADM
  VEN
  PRO
  FIN
}

enum TipoPessoa {
  PF
  PJ
}

enum OrcamentoStatus {
  RASCUNHO
  ENVIADO
  EM_NEGOCIACAO
  APROVADO
  PERDIDO
  CANCELADO
}

enum PedidoStatus {
  AGUARDANDO_ARTE
  ARTE_EM_APROVACAO
  EM_PRODUCAO
  ACABAMENTO
  PRONTO
  ENTREGUE
  CANCELADO
}

enum EtapaTipo {
  IMPRESSAO
  RECORTE
  LAMINACAO
  RESINA
  ACABAMENTO
  EMBALAGEM
}

enum EtapaStatus {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDA
  PULADA
}

enum UnidadeCalculo {
  METRO_QUADRADO
  CARTELA
  BOBINA
  UNIDADE
}

enum EstoqueTipo {
  ENTRADA
  SAIDA
  AJUSTE
}

enum PagamentoMetodo {
  DINHEIRO
  PIX
  CARTAO_DEBITO
  CARTAO_CREDITO
  BOLETO
  TRANSFERENCIA
}

enum PagamentoStatus {
  PREVISTO
  PAGO
  ATRASADO
  CANCELADO
}

enum AprovacaoArteStatus {
  PENDENTE
  APROVADA
  AJUSTE_SOLICITADO
  EXPIRADA
}

enum AnexoCategoria {
  ARTE
  REFERENCIA
  CONTRATO
  COMPROVANTE
  OUTRO
}

// ============ AUTH/USERS ============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  nome          String
  senhaHash     String
  perfil        Perfil    @default(VEN)
  ativo         Boolean   @default(true)
  telefone      String?
  criadoEm      DateTime  @default(now())
  atualizadoEm  DateTime  @updatedAt

  orcamentos    Orcamento[]
  pedidos       Pedido[]
  historicos    HistoricoAlteracao[]

  @@index([ativo])
}

// ============ CLIENTES ============

model Cliente {
  id            String      @id @default(cuid())
  tipo          TipoPessoa  @default(PF)
  nome          String
  documento     String?     // CPF ou CNPJ, só dígitos
  email         String?
  telefone      String
  whatsapp      String?
  observacoes   String?
  ativo         Boolean     @default(true)
  criadoEm      DateTime    @default(now())
  atualizadoEm  DateTime    @updatedAt

  enderecos     Endereco[]
  orcamentos    Orcamento[]
  pedidos       Pedido[]
  anexos        Anexo[]

  @@index([nome])
  @@index([documento])
  @@index([telefone])
}

model Endereco {
  id            String   @id @default(cuid())
  clienteId     String
  rotulo        String?  // "Comercial", "Entrega"
  cep           String
  logradouro    String
  numero        String
  complemento   String?
  bairro        String
  cidade        String
  uf            String   @db.Char(2)
  principal     Boolean  @default(false)

  cliente       Cliente  @relation(fields: [clienteId], references: [id], onDelete: Cascade)

  @@index([clienteId])
}

// ============ CATÁLOGO ============

model Material {
  id              String   @id @default(cuid())
  nome            String   @unique  // "Vinil branco brilho", "Lona 440g"
  larguraBobinaCm Decimal  @db.Decimal(8,2)   // largura útil em cm
  precoM2         Decimal  @db.Decimal(12,2)  // custo por m²
  estoqueMinimoM2 Decimal  @db.Decimal(12,2)  @default(0)
  saldoM2         Decimal  @db.Decimal(12,2)  @default(0)
  ativo           Boolean  @default(true)

  movimentos      EstoqueMovimento[]
  orcamentoItens  OrcamentoItem[]
  pedidoItens     PedidoItem[]

  @@index([ativo])
}

model TipoImpressao {
  id          String   @id @default(cuid())
  nome        String   @unique  // "HP Látex", "Ecossolvente", "UV"
  precoM2     Decimal  @db.Decimal(12,2)
  ativo       Boolean  @default(true)

  orcamentoItens OrcamentoItem[]
  pedidoItens    PedidoItem[]
}

model Acabamento {
  id          String   @id @default(cuid())
  nome        String   @unique  // "Laminação fosca", "Corte contorno", "Resina"
  precoM2     Decimal? @db.Decimal(12,2)  // se cobrado por m²
  precoFixo   Decimal? @db.Decimal(12,2)  // se cobrado por unidade
  ativo       Boolean  @default(true)

  orcamentoItens OrcamentoItem[]
  pedidoItens    PedidoItem[]
}

model Produto {
  id              String          @id @default(cuid())
  nome            String          // "Adesivo personalizado", "Banner 1x1m"
  descricao       String?
  unidadeCalculo  UnidadeCalculo  @default(METRO_QUADRADO)
  materialPadraoId String?
  impressaoPadraoId String?
  acabamentoPadraoId String?
  precoMinimo     Decimal?        @db.Decimal(12,2)
  ativo           Boolean         @default(true)

  @@index([ativo])
}

// ============ MÁQUINAS ============

model Maquina {
  id              String   @id @default(cuid())
  nome            String   @unique  // "HP Látex 365", "Roland VS-540"
  tipo            String   // "Látex", "Ecossolvente", "UV", "Plotter recorte"
  larguraUtilCm   Decimal  @db.Decimal(8,2)
  ativa           Boolean  @default(true)
  observacoes     String?

  pedidoItens     PedidoItem[]
}

// ============ ESTOQUE ============

model EstoqueMovimento {
  id           String      @id @default(cuid())
  materialId   String
  tipo         EstoqueTipo
  quantidadeM2 Decimal     @db.Decimal(12,2)
  saldoApos    Decimal     @db.Decimal(12,2)
  motivo       String?
  pedidoId     String?
  criadoEm     DateTime    @default(now())

  material     Material    @relation(fields: [materialId], references: [id])
  pedido       Pedido?     @relation(fields: [pedidoId], references: [id])

  @@index([materialId, criadoEm])
}

// ============ ORÇAMENTO ============

model Orcamento {
  id                String          @id @default(cuid())
  numero            Int             @unique
  clienteId         String
  vendedorId        String
  status            OrcamentoStatus @default(RASCUNHO)
  validadeDias      Int             @default(7)
  observacoes       String?
  condicoesPagamento String?
  prazoEntregaDias  Int?
  subtotal          Decimal         @db.Decimal(12,2) @default(0)
  desconto          Decimal         @db.Decimal(12,2) @default(0)
  total             Decimal         @db.Decimal(12,2) @default(0)
  motivoPerdaId     String?
  observacaoPerda   String?
  enviadoEm         DateTime?
  aprovadoEm        DateTime?
  criadoEm          DateTime        @default(now())
  atualizadoEm      DateTime        @updatedAt

  cliente           Cliente         @relation(fields: [clienteId], references: [id])
  vendedor          User            @relation(fields: [vendedorId], references: [id])
  motivoPerda       MotivoPerda?    @relation(fields: [motivoPerdaId], references: [id])
  itens             OrcamentoItem[]
  pedido            Pedido?

  @@index([status, criadoEm])
  @@index([clienteId])
  @@index([vendedorId])
}

model OrcamentoItem {
  id              String   @id @default(cuid())
  orcamentoId     String
  ordem           Int      @default(0)
  descricao       String
  unidadeCalculo  UnidadeCalculo
  larguraCm       Decimal? @db.Decimal(8,2)
  alturaCm        Decimal? @db.Decimal(8,2)
  quantidade      Int
  materialId      String?
  impressaoId     String?
  acabamentoId    String?
  // snapshot dos cálculos para auditoria
  areaUnitariaM2  Decimal? @db.Decimal(12,4)
  areaTotalM2     Decimal? @db.Decimal(12,4)
  aproveitamentoPct Decimal? @db.Decimal(5,2)
  custoTotal      Decimal  @db.Decimal(12,2)
  margemPct       Decimal  @db.Decimal(5,2)
  precoUnitario   Decimal  @db.Decimal(12,2)
  precoTotal      Decimal  @db.Decimal(12,2)
  notasTecnicas   String?

  orcamento       Orcamento     @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)
  material        Material?     @relation(fields: [materialId], references: [id])
  impressao       TipoImpressao? @relation(fields: [impressaoId], references: [id])
  acabamento      Acabamento?   @relation(fields: [acabamentoId], references: [id])

  @@index([orcamentoId])
}

// ============ PEDIDO ============

model Pedido {
  id              String       @id @default(cuid())
  numero          Int          @unique
  orcamentoId     String       @unique
  clienteId       String
  vendedorId      String
  status          PedidoStatus @default(AGUARDANDO_ARTE)
  prazoEntrega    DateTime?
  observacoes     String?
  notasProducao   String?
  enderecoEntregaId String?
  canalEntrega    String?      // "retirada", "motoboy", "transportadora"
  total           Decimal      @db.Decimal(12,2)
  totalPago       Decimal      @db.Decimal(12,2) @default(0)
  entregueEm      DateTime?
  criadoEm        DateTime     @default(now())
  atualizadoEm    DateTime     @updatedAt

  orcamento       Orcamento    @relation(fields: [orcamentoId], references: [id])
  cliente         Cliente      @relation(fields: [clienteId], references: [id])
  vendedor        User         @relation(fields: [vendedorId], references: [id])
  itens           PedidoItem[]
  etapas          PedidoEtapa[]
  arteVersoes     ArteVersao[]
  aprovacoes      AprovacaoArte[]
  pagamentos      Pagamento[]
  anexos          Anexo[]
  estoqueMovimentos EstoqueMovimento[]

  @@index([status, prazoEntrega])
  @@index([clienteId])
}

model PedidoItem {
  id              String         @id @default(cuid())
  pedidoId        String
  ordem           Int            @default(0)
  descricao       String
  unidadeCalculo  UnidadeCalculo
  larguraCm       Decimal?       @db.Decimal(8,2)
  alturaCm        Decimal?       @db.Decimal(8,2)
  quantidade      Int
  materialId      String?
  impressaoId     String?
  acabamentoId    String?
  maquinaId       String?
  areaTotalM2     Decimal?       @db.Decimal(12,4)
  precoUnitario   Decimal        @db.Decimal(12,2)
  precoTotal      Decimal        @db.Decimal(12,2)
  notasTecnicas   String?

  pedido          Pedido         @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  material        Material?      @relation(fields: [materialId], references: [id])
  impressao       TipoImpressao? @relation(fields: [impressaoId], references: [id])
  acabamento      Acabamento?    @relation(fields: [acabamentoId], references: [id])
  maquina         Maquina?       @relation(fields: [maquinaId], references: [id])

  @@index([pedidoId])
}

model PedidoEtapa {
  id           String      @id @default(cuid())
  pedidoId     String
  tipo         EtapaTipo
  status       EtapaStatus @default(PENDENTE)
  ordem        Int
  responsavelId String?
  iniciadaEm   DateTime?
  concluidaEm  DateTime?
  observacoes  String?

  pedido       Pedido      @relation(fields: [pedidoId], references: [id], onDelete: Cascade)

  @@index([pedidoId, ordem])
  @@index([status])
}

// ============ ARTE ============

model ChecklistArte {
  id                  String   @id @default(cuid())
  pedidoId            String   @unique
  sangriaOk           Boolean  @default(false)
  resolucaoOk         Boolean  @default(false)
  coresCmykOk         Boolean  @default(false)
  fontesConvertidas   Boolean  @default(false)
  tracadoCorteOk      Boolean  @default(false)
  observacoes         String?
  validadoPorId       String?
  validadoEm          DateTime?
}

model ArteVersao {
  id           String   @id @default(cuid())
  pedidoId     String
  versao       Int
  anexoId      String   @unique
  enviadaPorId String
  notas        String?
  criadaEm     DateTime @default(now())

  pedido       Pedido   @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  anexo        Anexo    @relation(fields: [anexoId], references: [id])

  @@unique([pedidoId, versao])
  @@index([pedidoId])
}

model AprovacaoArte {
  id           String              @id @default(cuid())
  pedidoId     String
  arteVersaoId String
  token        String              @unique @default(uuid())
  status       AprovacaoArteStatus @default(PENDENTE)
  expiraEm     DateTime
  respondidoEm DateTime?
  respondidoIp String?
  respondidoUserAgent String?
  comentario   String?
  criadaEm     DateTime            @default(now())

  pedido       Pedido              @relation(fields: [pedidoId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([pedidoId])
}

// ============ ANEXOS ============

model Anexo {
  id           String         @id @default(cuid())
  clienteId    String?
  pedidoId     String?
  categoria    AnexoCategoria
  nomeOriginal String
  caminho      String         // chave R2 ou path local
  mimeType     String
  tamanhoBytes Int
  uploadedById String
  criadoEm     DateTime       @default(now())

  cliente      Cliente?       @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  pedido       Pedido?        @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  arteVersao   ArteVersao?

  @@index([pedidoId])
  @@index([clienteId])
}

// ============ PAGAMENTOS ============

model Pagamento {
  id           String          @id @default(cuid())
  pedidoId     String
  valor        Decimal         @db.Decimal(12,2)
  metodo       PagamentoMetodo
  status       PagamentoStatus @default(PREVISTO)
  vencimento   DateTime?
  pagoEm       DateTime?
  observacoes  String?
  comprovanteAnexoId String?
  criadoEm     DateTime        @default(now())

  pedido       Pedido          @relation(fields: [pedidoId], references: [id], onDelete: Cascade)

  @@index([pedidoId])
  @@index([status, vencimento])
}

// ============ CONFIGURAÇÃO E SUPORTE ============

model MensagemTemplate {
  id        String   @id @default(cuid())
  chave     String   @unique  // "orcamento_envio", "arte_aprovacao", "pedido_pronto"
  nome      String
  corpo     String   @db.Text  // suporta {{cliente}}, {{numero}}, {{total}}, {{link}}
  ativo     Boolean  @default(true)
}

model ConfiguracaoSistema {
  id                    String   @id @default("singleton")
  empresaNome           String
  empresaCnpj           String?
  empresaTelefone       String
  empresaEmail          String?
  empresaEndereco       String?
  empresaLogoPath       String?
  margemMinimaPct       Decimal  @db.Decimal(5,2) @default(20)
  prefixoOrcamento      String   @default("ORC")
  prefixoPedido         String   @default("PED")
  validadeOrcamentoDias Int      @default(7)
  validadeAprovacaoDias Int      @default(7)
  atualizadoEm          DateTime @updatedAt
}

model SequenceCounter {
  chave  String @id  // "orcamento", "pedido"
  valor  Int    @default(0)
}

model MotivoPerda {
  id         String      @id @default(cuid())
  nome       String      @unique  // "Preço alto", "Prazo", "Sem retorno", "Concorrente"
  ativo      Boolean     @default(true)
  orcamentos Orcamento[]
}

model HistoricoAlteracao {
  id         String   @id @default(cuid())
  entidade   String   // "Orcamento", "Pedido", "Cliente"
  entidadeId String
  acao       String   // "CRIAR", "ATUALIZAR", "EXCLUIR", "MUDAR_STATUS"
  diff       Json     // { campo: { de, para } }
  usuarioId  String
  criadoEm   DateTime @default(now())

  usuario    User     @relation(fields: [usuarioId], references: [id])

  @@index([entidade, entidadeId])
  @@index([criadoEm])
}
```

## Índices importantes e justificativa

1. `Orcamento(status, criadoEm)` — lista padrão filtra por status e ordena por data.
2. `Pedido(status, prazoEntrega)` — kanban e alertas de prazo.
3. `Cliente(nome)`, `Cliente(documento)`, `Cliente(telefone)` — busca rápida no Command/autocomplete.
4. `EstoqueMovimento(materialId, criadoEm)` — extrato e cálculo de saldo histórico.
5. `AprovacaoArte(token)` — acesso da página pública por token UUID em O(1).
6. `Pagamento(status, vencimento)` — alertas de inadimplência e a receber.
7. `HistoricoAlteracao(entidade, entidadeId)` — exibir audit trail por registro.
8. `OrcamentoItem(orcamentoId)` e `PedidoItem(pedidoId)` — joins frequentes ao renderizar detalhes.
9. `PedidoEtapa(status)` — kanban global de produção.
10. `User(ativo)` — listagem de operadores ativos.