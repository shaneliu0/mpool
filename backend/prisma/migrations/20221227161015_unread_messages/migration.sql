-- CreateTable
CREATE TABLE "UnreadMessage" (
    "userId" TEXT NOT NULL,
    "poolId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UnreadMessage_userId_poolId_key" ON "UnreadMessage"("userId", "poolId");

-- AddForeignKey
ALTER TABLE "UnreadMessage" ADD CONSTRAINT "UnreadMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnreadMessage" ADD CONSTRAINT "UnreadMessage_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("poolId") ON DELETE RESTRICT ON UPDATE CASCADE;
