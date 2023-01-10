-- CreateTable
CREATE TABLE "Reports" (
    "reportId" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "messageId" INTEGER,
    "userId" TEXT,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "BlockedUser" (
    "blockId" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedById" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("blockId")
);

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
