/*
  Warnings:

  - You are about to drop the column `profileProfileId` on the `User` table. All the data in the column will be lost.
  - Added the required column `initialized` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoUrl` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_profileProfileId_fkey";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "initialized" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileProfileId",
ADD COLUMN     "photoUrl" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("profileId") ON DELETE RESTRICT ON UPDATE CASCADE;
