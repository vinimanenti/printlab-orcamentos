-- CreateEnum
CREATE TYPE "ComissaoStatus" AS ENUM ('PENDENTE', 'PAGA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Comissao" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "baseValor" DECIMAL(12,2) NOT NULL,
    "comissaoPct" DECIMAL(5,2) NOT NULL,
    "valorComissao" DECIMAL(12,2) NOT NULL,
    "status" "ComissaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "pagaEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comissao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comissao_pedidoId_key" ON "Comissao"("pedidoId");

-- CreateIndex
CREATE INDEX "Comissao_vendedorId_status_idx" ON "Comissao"("vendedorId", "status");

-- CreateIndex
CREATE INDEX "Comissao_status_criadaEm_idx" ON "Comissao"("status", "criadaEm");

-- AddForeignKey
ALTER TABLE "Comissao" ADD CONSTRAINT "Comissao_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comissao" ADD CONSTRAINT "Comissao_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
