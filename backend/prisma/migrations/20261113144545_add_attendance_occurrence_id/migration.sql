-- AlterTable
ALTER TABLE "ProjectActionAttendance" ADD COLUMN     "occurrenceId" CHAR(36);

-- CreateIndex
CREATE INDEX "ProjectActionAttendance_occurrenceId_idx" ON "ProjectActionAttendance"("occurrenceId");

-- AddForeignKey
ALTER TABLE "ProjectActionAttendance" ADD CONSTRAINT "ProjectActionAttendance_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "ActionOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
