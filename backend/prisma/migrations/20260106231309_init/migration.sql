/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Dispute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderPhoto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_courierId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_storeId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderLog" DROP CONSTRAINT "OrderLog_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderPhoto" DROP CONSTRAINT "OrderPhoto_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_orderId_fkey";

-- DropIndex
DROP INDEX "User_phone_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "fullName",
DROP COLUMN "passwordHash",
DROP COLUMN "refreshToken",
DROP COLUMN "role",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "Dispute";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "OrderItem";

-- DropTable
DROP TABLE "OrderLog";

-- DropTable
DROP TABLE "OrderPhoto";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "Transaction";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "UserRole";
