-- AlterTable
ALTER TABLE "PeopleGroup" ADD COLUMN     "tags" TEXT;

-- CreateTable
CREATE TABLE "PeopleGroupAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "peopleGroupId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeopleGroupAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeopleGroupAttachment_tenantId_idx" ON "PeopleGroupAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "PeopleGroupAttachment_peopleGroupId_createdAt_idx" ON "PeopleGroupAttachment"("peopleGroupId", "createdAt");

-- CreateIndex
CREATE INDEX "PeopleGroupAttachment_uploadedByUserId_idx" ON "PeopleGroupAttachment"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "PeopleGroupAttachment" ADD CONSTRAINT "PeopleGroupAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleGroupAttachment" ADD CONSTRAINT "PeopleGroupAttachment_peopleGroupId_fkey" FOREIGN KEY ("peopleGroupId") REFERENCES "PeopleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleGroupAttachment" ADD CONSTRAINT "PeopleGroupAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
