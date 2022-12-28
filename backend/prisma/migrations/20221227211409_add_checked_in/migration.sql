-- CreateTable
CREATE TABLE "CheckedIn" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckedIn_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "CheckedIn" ADD CONSTRAINT "CheckedIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
