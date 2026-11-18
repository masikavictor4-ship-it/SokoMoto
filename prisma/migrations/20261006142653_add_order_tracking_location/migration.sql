-- AlterTable
ALTER TABLE "Order" ADD COLUMN "currentLatitude" REAL;
ALTER TABLE "Order" ADD COLUMN "currentLongitude" REAL;
ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryLatitude" REAL;
ALTER TABLE "Order" ADD COLUMN "deliveryLongitude" REAL;
