/*
  Warnings:

  - You are about to drop the column `destinationName` on the `Referral` table. All the data in the column will be lost.
  - Added the required column `evolutionId` to the `AttendanceBenefit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationId` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evolutionId` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AttendanceBenefit" ADD COLUMN     "evolutionId" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "destinationName",
ADD COLUMN     "destinationId" CHAR(36) NOT NULL,
ADD COLUMN     "evolutionId" CHAR(36) NOT NULL;

-- CreateTable
CREATE TABLE "ReferralDestination" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "responsibleName" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralDestination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferralDestination_tenantId_idx" ON "ReferralDestination"("tenantId");

-- CreateIndex
CREATE INDEX "ReferralDestination_isActive_idx" ON "ReferralDestination"("isActive");

-- CreateIndex
CREATE INDEX "AttendanceBenefit_evolutionId_idx" ON "AttendanceBenefit"("evolutionId");

-- CreateIndex
CREATE INDEX "Referral_evolutionId_idx" ON "Referral"("evolutionId");

-- CreateIndex
CREATE INDEX "Referral_destinationId_idx" ON "Referral"("destinationId");

-- AddForeignKey
ALTER TABLE "AttendanceBenefit" ADD CONSTRAINT "AttendanceBenefit_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "AttendanceEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralDestination" ADD CONSTRAINT "ReferralDestination_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "AttendanceEvolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "ReferralDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
