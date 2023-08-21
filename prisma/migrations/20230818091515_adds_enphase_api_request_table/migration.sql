-- CreateTable
CREATE TABLE "EnphaseApiRequests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userAppId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnphaseApiRequests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnphaseApiRequests" ADD CONSTRAINT "EnphaseApiRequests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnphaseApiRequests" ADD CONSTRAINT "EnphaseApiRequests_userAppId_fkey" FOREIGN KEY ("userAppId") REFERENCES "UserEnphaseApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
