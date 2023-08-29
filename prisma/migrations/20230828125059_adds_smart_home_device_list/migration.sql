-- CreateTable
CREATE TABLE "SmartHomeDevices" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "SmartHomeProvider" NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartHomeDevices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SmartHomeDevices" ADD CONSTRAINT "SmartHomeDevices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
