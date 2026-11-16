-- CreateEnum
CREATE TYPE "FundingSourceType" AS ENUM ('MUNICIPAL', 'ESTADUAL', 'FEDERAL', 'TERCEIRO');

-- AlterTable
ALTER TABLE "ProjectAction" ADD COLUMN     "goalId" CHAR(36);

-- CreateTable
CREATE TABLE "ProjectFundingSource" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "source" "FundingSourceType" NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFundingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectAction_goalId_idx" ON "ProjectAction"("goalId");

-- CreateIndex
CREATE INDEX "ProjectFundingSource_tenantId_idx" ON "ProjectFundingSource"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectFundingSource_projectId_idx" ON "ProjectFundingSource"("projectId");

-- CreateIndex
CREATE INDEX "ProjectFundingSource_source_idx" ON "ProjectFundingSource"("source");

-- CreateIndex
CREATE INDEX "Goal_tenantId_idx" ON "Goal"("tenantId");

-- CreateIndex
CREATE INDEX "Goal_projectId_idx" ON "Goal"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectAction" ADD CONSTRAINT "ProjectAction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFundingSource" ADD CONSTRAINT "ProjectFundingSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFundingSource" ADD CONSTRAINT "ProjectFundingSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
