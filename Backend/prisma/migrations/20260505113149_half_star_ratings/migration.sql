/*
  Warnings:

  - You are about to alter the column `stars` on the `ratings` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(2,1)`.

*/
-- AlterTable
ALTER TABLE "ratings" ALTER COLUMN "stars" SET DATA TYPE DECIMAL(2,1);
