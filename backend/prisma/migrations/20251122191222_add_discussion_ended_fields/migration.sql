/*
  Warnings:

  - You are about to drop the column `afterValue` on the `Operation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Operation" DROP COLUMN "afterValue",
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "isEnded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startingValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
