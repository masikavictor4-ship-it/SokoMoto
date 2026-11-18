-- AlterTable
ALTER TABLE "Order" ADD COLUMN "airtelReference" TEXT;
ALTER TABLE "Order" ADD COLUMN "airtelTransactionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "cryptoAmount" TEXT;
ALTER TABLE "Order" ADD COLUMN "cryptoCurrency" TEXT;
ALTER TABLE "Order" ADD COLUMN "cryptoNetwork" TEXT;
ALTER TABLE "Order" ADD COLUMN "cryptoTransactionId" TEXT;

-- CreateIndex
CREATE INDEX "Order_airtelTransactionId_idx" ON "Order"("airtelTransactionId");

-- CreateIndex
CREATE INDEX "Order_airtelReference_idx" ON "Order"("airtelReference");
