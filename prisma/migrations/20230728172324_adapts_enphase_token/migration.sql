/*
  Warnings:

  - You are about to drop the `EnphaseAuthTokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EnphaseAuthTokens" DROP CONSTRAINT "EnphaseAuthTokens_userId_fkey";

-- DropTable
DROP TABLE "EnphaseAuthTokens";

-- CreateTable
CREATE TABLE "EnphaseApp" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnphaseApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEnphaseApp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "appId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEnphaseApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnphaseApp_name_key" ON "EnphaseApp"("name");

-- AddForeignKey
ALTER TABLE "UserEnphaseApp" ADD CONSTRAINT "UserEnphaseApp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEnphaseApp" ADD CONSTRAINT "UserEnphaseApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "EnphaseApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
