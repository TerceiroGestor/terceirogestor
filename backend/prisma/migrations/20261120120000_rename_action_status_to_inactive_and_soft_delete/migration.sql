-- AlterEnum
BEGIN;
CREATE TYPE "ActionStatus_new" AS ENUM ('PLANNED', 'EXECUTED', 'INACTIVE');
ALTER TABLE "public"."ProjectAction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ProjectAction" ALTER COLUMN "status" TYPE "ActionStatus_new" USING ("status"::text::"ActionStatus_new");
ALTER TYPE "ActionStatus" RENAME TO "ActionStatus_old";
ALTER TYPE "ActionStatus_new" RENAME TO "ActionStatus";
DROP TYPE "public"."ActionStatus_old";
ALTER TABLE "ProjectAction" ALTER COLUMN "status" SET DEFAULT 'PLANNED';
COMMIT;

-- AlterTable
ALTER TABLE "ProjectAction" ADD COLUMN "deletedAt" TIMESTAMP(3);
