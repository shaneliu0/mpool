CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Pool" (
    "poolId" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("poolId")
);

-- CreateTable
CREATE TABLE "Message" (
    "messageId" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "Place" (
    "placeId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "coords" geometry(Point, 3857) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("placeId")
);

-- CreateTable
CREATE TABLE "PoolSeason" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "PoolSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolRequest" (
    "requestId" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,
    "poolSeasonId" INTEGER NOT NULL,

    CONSTRAINT "PoolRequest_pkey" PRIMARY KEY ("requestId")
);

-- CreateTable
CREATE TABLE "_PoolToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_PoolToUser_AB_unique" ON "_PoolToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_PoolToUser_B_index" ON "_PoolToUser"("B");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Pool"("poolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_poolSeasonId_fkey" FOREIGN KEY ("poolSeasonId") REFERENCES "PoolSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Place"("placeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolRequest" ADD CONSTRAINT "PoolRequest_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Place"("placeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PoolToUser" ADD CONSTRAINT "_PoolToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Pool"("poolId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PoolToUser" ADD CONSTRAINT "_PoolToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
