/*
  Warnings:

  - Added the required column `universityId` to the `PoolSeason` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "universityId" INTEGER;

-- AlterTable
ALTER TABLE "PoolSeason" ADD COLUMN     "universityId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "University" (
    "universityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("universityId")
);

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("universityId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolSeason" ADD CONSTRAINT "PoolSeason_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("universityId") ON DELETE RESTRICT ON UPDATE CASCADE;
