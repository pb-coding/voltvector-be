-- CreateTable
CREATE TABLE "EnergyData" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userAppId" INTEGER NOT NULL,
    "systemId" TEXT NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "production" DOUBLE PRECISION NOT NULL,
    "consumption" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergyData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnergyData_userId_userAppId_endDate_key" ON "EnergyData"("userId", "userAppId", "endDate");

-- AddForeignKey
ALTER TABLE "EnergyData" ADD CONSTRAINT "EnergyData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyData" ADD CONSTRAINT "EnergyData_userAppId_fkey" FOREIGN KEY ("userAppId") REFERENCES "UserEnphaseApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
