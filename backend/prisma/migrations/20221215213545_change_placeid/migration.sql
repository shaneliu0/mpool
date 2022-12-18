/*
  Warnings:

  - The primary key for the `Place` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "PoolRequest" DROP CONSTRAINT "PoolRequest_fromId_fkey";

-- DropForeignKey
ALTER TABLE "PoolRequest" DROP CONSTRAINT "PoolRequest_toId_fkey";

-- AlterTable
ALTER TABLE "Place" DROP CONSTRAINT "Place_pkey",
ALTER COLUMN "placeId" DROP DEFAULT,
ALTER COLUMN "placeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Place_pkey" PRIMARY KEY ("placeId");
DROP SEQUENCE "Place_placeId_seq";

-- AlterTable
ALTER TABLE "PoolRequest" ALTER COLUMN "fromId" SET DATA TYPE TEXT,
ALTER COLUMN "toId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Place"("placeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Place"("placeId") ON DELETE RESTRICT ON UPDATE CASCADE;
