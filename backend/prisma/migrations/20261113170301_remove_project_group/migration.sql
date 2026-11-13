-- AlterEnum
BEGIN;
CREATE TYPE "ActionTarget_new" AS ENUM ('PROJECT', 'PEOPLE_GROUP', 'ENROLLMENT');
ALTER TABLE "public"."ActionType" ALTER COLUMN "target" DROP DEFAULT;
ALTER TABLE "ActionType" ALTER COLUMN "target" TYPE "ActionTarget_new" USING ("target"::text::"ActionTarget_new");
ALTER TYPE "ActionTarget" RENAME TO "ActionTarget_old";
ALTER TYPE "ActionTarget_new" RENAME TO "ActionTarget";
DROP TYPE "public"."ActionTarget_old";
ALTER TABLE "ActionType" ALTER COLUMN "target" SET DEFAULT 'PROJECT';
COMMIT;

-- DropForeignKey
ALTER TABLE "ProjectAction" DROP CONSTRAINT "ProjectAction_groupId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectEnrollmentGroupMembership" DROP CONSTRAINT "ProjectEnrollmentGroupMembership_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectEnrollmentGroupMembership" DROP CONSTRAINT "ProjectEnrollmentGroupMembership_groupId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectEnrollmentGroupMembership" DROP CONSTRAINT "ProjectEnrollmentGroupMembership_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectGroup" DROP CONSTRAINT "ProjectGroup_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectGroup" DROP CONSTRAINT "ProjectGroup_tenantId_fkey";

-- DropIndex
DROP INDEX "ProjectAction_groupId_idx";

-- AlterTable
ALTER TABLE "ProjectAction" DROP COLUMN "groupId";

-- DropTable
DROP TABLE "ProjectEnrollmentGroupMembership";

-- DropTable
DROP TABLE "ProjectGroup";
