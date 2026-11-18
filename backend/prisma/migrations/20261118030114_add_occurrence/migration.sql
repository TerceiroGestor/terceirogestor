-- CreateEnum
CREATE TYPE "OccurrenceCaseStatus" AS ENUM ('REGISTRADA', 'EM_ANALISE', 'DESFECHO_DEFINIDO');

-- CreateEnum
CREATE TYPE "OccurrencePersonRole" AS ENUM ('ENVOLVIDO', 'TESTEMUNHA');

-- CreateTable
CREATE TABLE "Occurrence" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "meetingId" CHAR(36),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "OccurrenceCaseStatus" NOT NULL DEFAULT 'REGISTRADA',
    "outcomeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccurrencePeople" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "occurrenceId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "role" "OccurrencePersonRole" NOT NULL DEFAULT 'ENVOLVIDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OccurrencePeople_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Occurrence_tenantId_idx" ON "Occurrence"("tenantId");

-- CreateIndex
CREATE INDEX "Occurrence_meetingId_idx" ON "Occurrence"("meetingId");

-- CreateIndex
CREATE INDEX "Occurrence_status_idx" ON "Occurrence"("status");

-- CreateIndex
CREATE INDEX "OccurrencePeople_tenantId_idx" ON "OccurrencePeople"("tenantId");

-- CreateIndex
CREATE INDEX "OccurrencePeople_occurrenceId_idx" ON "OccurrencePeople"("occurrenceId");

-- CreateIndex
CREATE INDEX "OccurrencePeople_personId_idx" ON "OccurrencePeople"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "OccurrencePeople_occurrenceId_personId_role_key" ON "OccurrencePeople"("occurrenceId", "personId", "role");

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "ActionOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrencePeople" ADD CONSTRAINT "OccurrencePeople_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrencePeople" ADD CONSTRAINT "OccurrencePeople_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrencePeople" ADD CONSTRAINT "OccurrencePeople_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
