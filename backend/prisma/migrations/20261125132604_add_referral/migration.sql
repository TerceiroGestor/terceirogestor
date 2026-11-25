-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('SAUDE', 'EDUCACAO', 'CONSELHO_TUTELAR', 'ASSISTENCIA_SOCIAL', 'JURIDICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('ABERTO', 'EM_ACOMPANHAMENTO', 'ENCERRADO');

-- CreateTable
CREATE TABLE "Referral" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "attendanceId" CHAR(36) NOT NULL,
    "type" "ReferralType" NOT NULL,
    "destinationName" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'ABERTO',
    "outcomeNotes" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "referralId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_tenantId_idx" ON "Referral"("tenantId");

-- CreateIndex
CREATE INDEX "Referral_attendanceId_idx" ON "Referral"("attendanceId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "ReferralAttachment_tenantId_idx" ON "ReferralAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "ReferralAttachment_referralId_createdAt_idx" ON "ReferralAttachment"("referralId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralAttachment_uploadedByUserId_idx" ON "ReferralAttachment"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAttachment" ADD CONSTRAINT "ReferralAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAttachment" ADD CONSTRAINT "ReferralAttachment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAttachment" ADD CONSTRAINT "ReferralAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
