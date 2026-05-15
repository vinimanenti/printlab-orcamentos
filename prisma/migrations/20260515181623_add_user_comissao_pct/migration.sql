-- AlterTable
ALTER TABLE "User" ADD COLUMN     "comissaoPct" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "User_perfil_ativo_idx" ON "User"("perfil", "ativo");
