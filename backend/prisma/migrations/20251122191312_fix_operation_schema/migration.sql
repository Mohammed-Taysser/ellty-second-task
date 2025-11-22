/*
  Warnings:

  - You are about to drop the column `endedAt` on the `Operation` table. All the data in the column will be lost.
  - You are about to drop the column `isEnded` on the `Operation` table. All the data in the column will be lost.
  - You are about to drop the column `startingValue` on the `Operation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Operation" DROP COLUMN "endedAt",
DROP COLUMN "isEnded",
DROP COLUMN "startingValue",
ADD COLUMN     "afterValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
