-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('SCHEDULED', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "ActionOccurrence" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "actionId" CHAR(36) NOT NULL,
    "peopleGroupId" CHAR(36),
    "scheduledDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "OccurrenceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "recurrenceBatchId" CHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionOccurrence_tenantId_actionId_idx" ON "ActionOccurrence"("tenantId", "actionId");

-- CreateIndex
CREATE INDEX "ActionOccurrence_tenantId_scheduledDate_idx" ON "ActionOccurrence"("tenantId", "scheduledDate");

-- CreateIndex
CREATE INDEX "ActionOccurrence_recurrenceBatchId_idx" ON "ActionOccurrence"("recurrenceBatchId");

-- AddForeignKey
ALTER TABLE "ActionOccurrence" ADD CONSTRAINT "ActionOccurrence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionOccurrence" ADD CONSTRAINT "ActionOccurrence_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ProjectAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionOccurrence" ADD CONSTRAINT "ActionOccurrence_peopleGroupId_fkey" FOREIGN KEY ("peopleGroupId") REFERENCES "PeopleGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
