/*
  Warnings:

  - A unique constraint covering the columns `[userId,appId]` on the table `UserEnphaseApp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserEnphaseApp_userId_appId_key" ON "UserEnphaseApp"("userId", "appId");
