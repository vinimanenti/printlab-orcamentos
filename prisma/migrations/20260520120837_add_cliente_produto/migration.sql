-- CreateTable
CREATE TABLE "ClienteProduto" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "larguraCm" DECIMAL(8,2),
    "alturaCm" DECIMAL(8,2),
    "quantidadePadrao" INTEGER NOT NULL DEFAULT 1,
    "materialId" TEXT,
    "impressaoId" TEXT,
    "acabamentoId" TEXT,
    "margemPct" DECIMAL(5,2),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteProduto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClienteProduto_clienteId_ativo_idx" ON "ClienteProduto"("clienteId", "ativo");

-- CreateIndex
CREATE INDEX "ClienteProduto_nome_idx" ON "ClienteProduto"("nome");

-- AddForeignKey
ALTER TABLE "ClienteProduto" ADD CONSTRAINT "ClienteProduto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteProduto" ADD CONSTRAINT "ClienteProduto_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteProduto" ADD CONSTRAINT "ClienteProduto_impressaoId_fkey" FOREIGN KEY ("impressaoId") REFERENCES "TipoImpressao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteProduto" ADD CONSTRAINT "ClienteProduto_acabamentoId_fkey" FOREIGN KEY ("acabamentoId") REFERENCES "Acabamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
