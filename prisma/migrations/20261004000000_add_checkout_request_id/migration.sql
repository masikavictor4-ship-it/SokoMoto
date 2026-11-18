-- Reconcile the existing checkoutRequestId column and unique index.
-- These already exist in the development database.
ALTER TABLE "Order" ADD COLUMN "checkoutRequestId" TEXT;
CREATE UNIQUE INDEX "Order_checkoutRequestId_key" ON "Order"("checkoutRequestId");
