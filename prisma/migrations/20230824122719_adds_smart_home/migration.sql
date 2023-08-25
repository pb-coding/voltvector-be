-- CreateEnum
CREATE TYPE "SmartHomeProvider" AS ENUM ('MEROSS');

-- CreateTable
CREATE TABLE "SmartHomeAuth" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "SmartHomeProvider" NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartHomeAuth_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SmartHomeAuth" ADD CONSTRAINT "SmartHomeAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
