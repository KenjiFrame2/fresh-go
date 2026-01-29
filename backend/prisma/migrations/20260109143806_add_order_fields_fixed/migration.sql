-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "address" TEXT NOT NULL DEFAULT 'адресс не указан',
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
