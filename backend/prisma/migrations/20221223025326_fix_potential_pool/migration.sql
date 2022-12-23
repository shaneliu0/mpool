/*
  Warnings:

  - Added the required column `seasonId` to the `PotentialMatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PotentialMatch" ADD COLUMN     "seasonId" INTEGER NOT NULL;
