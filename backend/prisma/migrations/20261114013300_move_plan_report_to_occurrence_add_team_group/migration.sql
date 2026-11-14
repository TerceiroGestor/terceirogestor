-- AlterTable
ALTER TABLE "ActionOccurrence" ADD COLUMN     "conclusionHtml" TEXT,
ADD COLUMN     "executedHtml" TEXT,
ADD COLUMN     "photoPaths" JSONB,
ADD COLUMN     "planHtml" TEXT;

-- AlterTable
ALTER TABLE "ProjectAction" DROP COLUMN "conclusionHtml",
DROP COLUMN "executedHtml",
DROP COLUMN "photoPaths",
DROP COLUMN "planHtml";

-- CreateTable
CREATE TABLE "ActionOccurrenceTeamGroup" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "occurrenceId" CHAR(36) NOT NULL,
    "peopleGroupId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionOccurrenceTeamGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionOccurrenceTeamGroup_tenantId_idx" ON "ActionOccurrenceTeamGroup"("tenantId");

-- CreateIndex
CREATE INDEX "ActionOccurrenceTeamGroup_occurrenceId_idx" ON "ActionOccurrenceTeamGroup"("occurrenceId");

-- CreateIndex
CREATE INDEX "ActionOccurrenceTeamGroup_peopleGroupId_idx" ON "ActionOccurrenceTeamGroup"("peopleGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionOccurrenceTeamGroup_tenantId_occurrenceId_peopleGroup_key" ON "ActionOccurrenceTeamGroup"("tenantId", "occurrenceId", "peopleGroupId");

-- AddForeignKey
ALTER TABLE "ActionOccurrenceTeamGroup" ADD CONSTRAINT "ActionOccurrenceTeamGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionOccurrenceTeamGroup" ADD CONSTRAINT "ActionOccurrenceTeamGroup_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "ActionOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionOccurrenceTeamGroup" ADD CONSTRAINT "ActionOccurrenceTeamGroup_peopleGroupId_fkey" FOREIGN KEY ("peopleGroupId") REFERENCES "PeopleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
