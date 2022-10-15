/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `PoolRequest` table. All the data in the column will be lost.
  - Added the required column `content` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "content" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "PoolRequest" DROP COLUMN "updatedAt";
