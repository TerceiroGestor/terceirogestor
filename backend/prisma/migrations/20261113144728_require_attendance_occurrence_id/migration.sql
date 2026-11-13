-- DropForeignKey
ALTER TABLE "ProjectActionAttendance" DROP CONSTRAINT "ProjectActionAttendance_occurrenceId_fkey";

-- DropIndex
DROP INDEX "ProjectActionAttendance_tenantId_actionId_enrollmentId_key";

-- AlterTable
ALTER TABLE "ProjectActionAttendance" ALTER COLUMN "occurrenceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectActionAttendance_tenantId_occurrenceId_enrollmentId_key" ON "ProjectActionAttendance"("tenantId", "occurrenceId", "enrollmentId");

-- AddForeignKey
ALTER TABLE "ProjectActionAttendance" ADD CONSTRAINT "ProjectActionAttendance_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "ActionOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
