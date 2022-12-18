/*
  Warnings:

  - You are about to drop the column `poolSeasonId` on the `PoolRequest` table. All the data in the column will be lost.
  - Added the required column `departTime` to the `PoolRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `active` to the `PoolSeason` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endsAt` to the `PoolSeason` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileProfileId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PoolRequest" DROP CONSTRAINT "PoolRequest_poolSeasonId_fkey";

-- AlterTable
ALTER TABLE "PoolRequest" DROP COLUMN "poolSeasonId",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "departTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "poolId" INTEGER;

-- AlterTable
ALTER TABLE "PoolSeason" ADD COLUMN     "active" BOOLEAN NOT NULL,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileId" INTEGER NOT NULL,
ADD COLUMN     "profileProfileId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Profile" (
    "profileId" SERIAL NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("profileId")
);

-- CreateTable
CREATE TABLE "ProfileContent" (
    "profileContentId" SERIAL NOT NULL,
    "promptId" INTEGER NOT NULL,
    "text" TEXT,
    "profileProfileId" INTEGER,

    CONSTRAINT "ProfileContent_pkey" PRIMARY KEY ("profileContentId")
);

-- CreateTable
CREATE TABLE "ContentTile" (
    "contentTileId" SERIAL NOT NULL,
    "content" TEXT,
    "interestId" INTEGER,
    "profileContentProfileContentId" INTEGER,

    CONSTRAINT "ContentTile_pkey" PRIMARY KEY ("contentTileId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" SERIAL NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "Prompt" (
    "promptId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "allowText" BOOLEAN NOT NULL,
    "allowTiles" BOOLEAN NOT NULL,
    "restrictTiles" BOOLEAN NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("promptId")
);

-- CreateTable
CREATE TABLE "Interest" (
    "interestId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "promptId" INTEGER,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("interestId")
);

-- CreateTable
CREATE TABLE "InterestCategory" (
    "categoryId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InterestCategory_pkey" PRIMARY KEY ("categoryId")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileProfileId_fkey" FOREIGN KEY ("profileProfileId") REFERENCES "Profile"("profileId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileContent" ADD CONSTRAINT "ProfileContent_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("promptId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileContent" ADD CONSTRAINT "ProfileContent_profileProfileId_fkey" FOREIGN KEY ("profileProfileId") REFERENCES "Profile"("profileId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTile" ADD CONSTRAINT "ContentTile_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("interestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTile" ADD CONSTRAINT "ContentTile_profileContentProfileContentId_fkey" FOREIGN KEY ("profileContentProfileContentId") REFERENCES "ProfileContent"("profileContentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "PoolSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("poolId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InterestCategory"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("promptId") ON DELETE SET NULL ON UPDATE CASCADE;
