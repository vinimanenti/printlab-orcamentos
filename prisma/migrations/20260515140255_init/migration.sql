-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADM', 'VEN', 'PRO', 'FIN');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "OrcamentoStatus" AS ENUM ('RASCUNHO', 'ENVIADO', 'EM_NEGOCIACAO', 'APROVADO', 'PERDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('AGUARDANDO_ARTE', 'ARTE_EM_APROVACAO', 'EM_PRODUCAO', 'ACABAMENTO', 'PRONTO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EtapaTipo" AS ENUM ('IMPRESSAO', 'RECORTE', 'LAMINACAO', 'RESINA', 'ACABAMENTO', 'EMBALAGEM');

-- CreateEnum
CREATE TYPE "EtapaStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'PULADA');

-- CreateEnum
CREATE TYPE "UnidadeCalculo" AS ENUM ('METRO_QUADRADO', 'CARTELA', 'BOBINA', 'UNIDADE');

-- CreateEnum
CREATE TYPE "EstoqueTipo" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "PagamentoMetodo" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'BOLETO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PREVISTO', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AprovacaoArteStatus" AS ENUM ('PENDENTE', 'APROVADA', 'AJUSTE_SOLICITADO', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "AnexoCategoria" AS ENUM ('ARTE', 'REFERENCIA', 'CONTRATO', 'COMPROVANTE', 'OUTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'VEN',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tipo" "TipoPessoa" NOT NULL DEFAULT 'PF',
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "telefone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "rotulo" TEXT,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "larguraBobinaCm" DECIMAL(8,2) NOT NULL,
    "precoM2" DECIMAL(12,2) NOT NULL,
    "estoqueMinimoM2" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldoM2" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoImpressao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoM2" DECIMAL(12,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoImpressao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acabamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoM2" DECIMAL(12,2),
    "precoFixo" DECIMAL(12,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Acabamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidadeCalculo" "UnidadeCalculo" NOT NULL DEFAULT 'METRO_QUADRADO',
    "materialPadraoId" TEXT,
    "impressaoPadraoId" TEXT,
    "acabamentoPadraoId" TEXT,
    "precoMinimo" DECIMAL(12,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maquina" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "larguraUtilCm" DECIMAL(8,2) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "Maquina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueMovimento" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "tipo" "EstoqueTipo" NOT NULL,
    "quantidadeM2" DECIMAL(12,2) NOT NULL,
    "saldoApos" DECIMAL(12,2) NOT NULL,
    "motivo" TEXT,
    "pedidoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstoqueMovimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "status" "OrcamentoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "validadeDias" INTEGER NOT NULL DEFAULT 7,
    "observacoes" TEXT,
    "condicoesPagamento" TEXT,
    "prazoEntregaDias" INTEGER,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "motivoPerdaId" TEXT,
    "observacaoPerda" TEXT,
    "enviadoEm" TIMESTAMP(3),
    "aprovadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrcamentoItem" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT NOT NULL,
    "unidadeCalculo" "UnidadeCalculo" NOT NULL,
    "larguraCm" DECIMAL(8,2),
    "alturaCm" DECIMAL(8,2),
    "quantidade" INTEGER NOT NULL,
    "materialId" TEXT,
    "impressaoId" TEXT,
    "acabamentoId" TEXT,
    "areaUnitariaM2" DECIMAL(12,4),
    "areaTotalM2" DECIMAL(12,4),
    "aproveitamentoPct" DECIMAL(5,2),
    "custoTotal" DECIMAL(12,2) NOT NULL,
    "margemPct" DECIMAL(5,2) NOT NULL,
    "precoUnitario" DECIMAL(12,2) NOT NULL,
    "precoTotal" DECIMAL(12,2) NOT NULL,
    "notasTecnicas" TEXT,

    CONSTRAINT "OrcamentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "status" "PedidoStatus" NOT NULL DEFAULT 'AGUARDANDO_ARTE',
    "prazoEntrega" TIMESTAMP(3),
    "observacoes" TEXT,
    "notasProducao" TEXT,
    "enderecoEntregaId" TEXT,
    "canalEntrega" TEXT,
    "total" DECIMAL(12,2) NOT NULL,
    "totalPago" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "entregueEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT NOT NULL,
    "unidadeCalculo" "UnidadeCalculo" NOT NULL,
    "larguraCm" DECIMAL(8,2),
    "alturaCm" DECIMAL(8,2),
    "quantidade" INTEGER NOT NULL,
    "materialId" TEXT,
    "impressaoId" TEXT,
    "acabamentoId" TEXT,
    "maquinaId" TEXT,
    "areaTotalM2" DECIMAL(12,4),
    "precoUnitario" DECIMAL(12,2) NOT NULL,
    "precoTotal" DECIMAL(12,2) NOT NULL,
    "notasTecnicas" TEXT,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoEtapa" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "tipo" "EtapaTipo" NOT NULL,
    "status" "EtapaStatus" NOT NULL DEFAULT 'PENDENTE',
    "ordem" INTEGER NOT NULL,
    "responsavelId" TEXT,
    "iniciadaEm" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "observacoes" TEXT,

    CONSTRAINT "PedidoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistArte" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "sangriaOk" BOOLEAN NOT NULL DEFAULT false,
    "resolucaoOk" BOOLEAN NOT NULL DEFAULT false,
    "coresCmykOk" BOOLEAN NOT NULL DEFAULT false,
    "fontesConvertidas" BOOLEAN NOT NULL DEFAULT false,
    "tracadoCorteOk" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "validadoPorId" TEXT,
    "validadoEm" TIMESTAMP(3),

    CONSTRAINT "ChecklistArte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArteVersao" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "anexoId" TEXT NOT NULL,
    "enviadaPorId" TEXT NOT NULL,
    "notas" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArteVersao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AprovacaoArte" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "arteVersaoId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "AprovacaoArteStatus" NOT NULL DEFAULT 'PENDENTE',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "respondidoEm" TIMESTAMP(3),
    "respondidoIp" TEXT,
    "respondidoUserAgent" TEXT,
    "comentario" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AprovacaoArte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "pedidoId" TEXT,
    "categoria" "AnexoCategoria" NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "metodo" "PagamentoMetodo" NOT NULL,
    "status" "PagamentoStatus" NOT NULL DEFAULT 'PREVISTO',
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "comprovanteAnexoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemTemplate" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MensagemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoSistema" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "empresaNome" TEXT NOT NULL,
    "empresaCnpj" TEXT,
    "empresaTelefone" TEXT NOT NULL,
    "empresaEmail" TEXT,
    "empresaEndereco" TEXT,
    "empresaLogoPath" TEXT,
    "margemMinimaPct" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "prefixoOrcamento" TEXT NOT NULL DEFAULT 'ORC',
    "prefixoPedido" TEXT NOT NULL DEFAULT 'PED',
    "validadeOrcamentoDias" INTEGER NOT NULL DEFAULT 7,
    "validadeAprovacaoDias" INTEGER NOT NULL DEFAULT 7,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceCounter" (
    "chave" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SequenceCounter_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "MotivoPerda" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MotivoPerda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoAlteracao" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "diff" JSONB NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoAlteracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_ativo_idx" ON "User"("ativo");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "Cliente"("nome");

-- CreateIndex
CREATE INDEX "Cliente_documento_idx" ON "Cliente"("documento");

-- CreateIndex
CREATE INDEX "Cliente_telefone_idx" ON "Cliente"("telefone");

-- CreateIndex
CREATE INDEX "Endereco_clienteId_idx" ON "Endereco"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_nome_key" ON "Material"("nome");

-- CreateIndex
CREATE INDEX "Material_ativo_idx" ON "Material"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoImpressao_nome_key" ON "TipoImpressao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Acabamento_nome_key" ON "Acabamento"("nome");

-- CreateIndex
CREATE INDEX "Produto_ativo_idx" ON "Produto"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Maquina_nome_key" ON "Maquina"("nome");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_materialId_criadoEm_idx" ON "EstoqueMovimento"("materialId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_numero_key" ON "Orcamento"("numero");

-- CreateIndex
CREATE INDEX "Orcamento_status_criadoEm_idx" ON "Orcamento"("status", "criadoEm");

-- CreateIndex
CREATE INDEX "Orcamento_clienteId_idx" ON "Orcamento"("clienteId");

-- CreateIndex
CREATE INDEX "Orcamento_vendedorId_idx" ON "Orcamento"("vendedorId");

-- CreateIndex
CREATE INDEX "OrcamentoItem_orcamentoId_idx" ON "OrcamentoItem"("orcamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_orcamentoId_key" ON "Pedido"("orcamentoId");

-- CreateIndex
CREATE INDEX "Pedido_status_prazoEntrega_idx" ON "Pedido"("status", "prazoEntrega");

-- CreateIndex
CREATE INDEX "Pedido_clienteId_idx" ON "Pedido"("clienteId");

-- CreateIndex
CREATE INDEX "PedidoItem_pedidoId_idx" ON "PedidoItem"("pedidoId");

-- CreateIndex
CREATE INDEX "PedidoEtapa_pedidoId_ordem_idx" ON "PedidoEtapa"("pedidoId", "ordem");

-- CreateIndex
CREATE INDEX "PedidoEtapa_status_idx" ON "PedidoEtapa"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistArte_pedidoId_key" ON "ChecklistArte"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "ArteVersao_anexoId_key" ON "ArteVersao"("anexoId");

-- CreateIndex
CREATE INDEX "ArteVersao_pedidoId_idx" ON "ArteVersao"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "ArteVersao_pedidoId_versao_key" ON "ArteVersao"("pedidoId", "versao");

-- CreateIndex
CREATE UNIQUE INDEX "AprovacaoArte_token_key" ON "AprovacaoArte"("token");

-- CreateIndex
CREATE INDEX "AprovacaoArte_token_idx" ON "AprovacaoArte"("token");

-- CreateIndex
CREATE INDEX "AprovacaoArte_pedidoId_idx" ON "AprovacaoArte"("pedidoId");

-- CreateIndex
CREATE INDEX "Anexo_pedidoId_idx" ON "Anexo"("pedidoId");

-- CreateIndex
CREATE INDEX "Anexo_clienteId_idx" ON "Anexo"("clienteId");

-- CreateIndex
CREATE INDEX "Pagamento_pedidoId_idx" ON "Pagamento"("pedidoId");

-- CreateIndex
CREATE INDEX "Pagamento_status_vencimento_idx" ON "Pagamento"("status", "vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "MensagemTemplate_chave_key" ON "MensagemTemplate"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "MotivoPerda_nome_key" ON "MotivoPerda"("nome");

-- CreateIndex
CREATE INDEX "HistoricoAlteracao_entidade_entidadeId_idx" ON "HistoricoAlteracao"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "HistoricoAlteracao_criadoEm_idx" ON "HistoricoAlteracao"("criadoEm");

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_motivoPerdaId_fkey" FOREIGN KEY ("motivoPerdaId") REFERENCES "MotivoPerda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoItem" ADD CONSTRAINT "OrcamentoItem_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoItem" ADD CONSTRAINT "OrcamentoItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoItem" ADD CONSTRAINT "OrcamentoItem_impressaoId_fkey" FOREIGN KEY ("impressaoId") REFERENCES "TipoImpressao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoItem" ADD CONSTRAINT "OrcamentoItem_acabamentoId_fkey" FOREIGN KEY ("acabamentoId") REFERENCES "Acabamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_impressaoId_fkey" FOREIGN KEY ("impressaoId") REFERENCES "TipoImpressao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_acabamentoId_fkey" FOREIGN KEY ("acabamentoId") REFERENCES "Acabamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoEtapa" ADD CONSTRAINT "PedidoEtapa_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArteVersao" ADD CONSTRAINT "ArteVersao_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArteVersao" ADD CONSTRAINT "ArteVersao_anexoId_fkey" FOREIGN KEY ("anexoId") REFERENCES "Anexo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprovacaoArte" ADD CONSTRAINT "AprovacaoArte_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAlteracao" ADD CONSTRAINT "HistoricoAlteracao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
