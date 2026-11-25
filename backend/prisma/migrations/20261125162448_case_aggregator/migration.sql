-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('ABERTO', 'ENCERRADO');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "caseId" CHAR(36);

-- AlterTable
ALTER TABLE "Occurrence" ADD COLUMN     "caseId" CHAR(36);

-- CreateTable
CREATE TABLE "Case" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'ABERTO',
    "closingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasePeople" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "caseId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CasePeople_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Case_tenantId_idx" ON "Case"("tenantId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "CasePeople_tenantId_idx" ON "CasePeople"("tenantId");

-- CreateIndex
CREATE INDEX "CasePeople_caseId_idx" ON "CasePeople"("caseId");

-- CreateIndex
CREATE INDEX "CasePeople_personId_idx" ON "CasePeople"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CasePeople_caseId_personId_key" ON "CasePeople"("caseId", "personId");

-- CreateIndex
CREATE INDEX "Attendance_caseId_idx" ON "Attendance"("caseId");

-- CreateIndex
CREATE INDEX "Occurrence_caseId_idx" ON "Occurrence"("caseId");

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePeople" ADD CONSTRAINT "CasePeople_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePeople" ADD CONSTRAINT "CasePeople_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePeople" ADD CONSTRAINT "CasePeople_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
