/*
  Warnings:

  - You are about to drop the `_PoolToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `seasonId` to the `Pool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Pool` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_PoolToUser" DROP CONSTRAINT "_PoolToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_PoolToUser" DROP CONSTRAINT "_PoolToUser_B_fkey";

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "departTime" TIMESTAMP(3),
ADD COLUMN     "fromId" TEXT,
ADD COLUMN     "seasonId" INTEGER NOT NULL,
ADD COLUMN     "toId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "_PoolToUser";

-- CreateTable
CREATE TABLE "NotificationTokens" (
    "userId" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTokens_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PotentialMatch" (
    "potentialMatchId" SERIAL NOT NULL,
    "poolId" INTEGER,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PotentialMatch_pkey" PRIMARY KEY ("potentialMatchId")
);

-- AddForeignKey
ALTER TABLE "NotificationTokens" ADD CONSTRAINT "NotificationTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "PoolSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Place"("placeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Place"("placeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotentialMatch" ADD CONSTRAINT "PotentialMatch_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("poolId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotentialMatch" ADD CONSTRAINT "PotentialMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
