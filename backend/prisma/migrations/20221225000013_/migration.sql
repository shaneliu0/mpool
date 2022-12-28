/*
  Warnings:

  - You are about to drop the column `userId` on the `PotentialMatch` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PotentialMatch" DROP CONSTRAINT "PotentialMatch_userId_fkey";

-- AlterTable
ALTER TABLE "PotentialMatch" DROP COLUMN "userId",
ADD COLUMN     "declined" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "derivedPoolId" INTEGER,
ADD COLUMN     "poolPoolId" INTEGER;

-- CreateTable
CREATE TABLE "_PotentialMatchToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PotentialMatchToUser_AB_unique" ON "_PotentialMatchToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_PotentialMatchToUser_B_index" ON "_PotentialMatchToUser"("B");

-- AddForeignKey
ALTER TABLE "PotentialMatch" ADD CONSTRAINT "PotentialMatch_derivedPoolId_fkey" FOREIGN KEY ("derivedPoolId") REFERENCES "Pool"("poolId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PotentialMatchToUser" ADD CONSTRAINT "_PotentialMatchToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "PotentialMatch"("potentialMatchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PotentialMatchToUser" ADD CONSTRAINT "_PotentialMatchToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
