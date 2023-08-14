/*
  Warnings:

  - A unique constraint covering the columns `[userId,endDate]` on the table `EnergyData` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "EnergyData_userId_userAppId_endDate_key";

-- CreateIndex
CREATE UNIQUE INDEX "EnergyData_userId_endDate_key" ON "EnergyData"("userId", "endDate");
