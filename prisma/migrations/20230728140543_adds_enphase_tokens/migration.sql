-- CreateTable
CREATE TABLE "EnphaseAuthTokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnphaseAuthTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnphaseAuthTokens_userId_key" ON "EnphaseAuthTokens"("userId");

-- AddForeignKey
ALTER TABLE "EnphaseAuthTokens" ADD CONSTRAINT "EnphaseAuthTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
