-- AlterEnum
BEGIN;
CREATE TYPE "TenantRegistrationMethod_new" AS ENUM ('EMAIL');
ALTER TABLE "TenantRegistration" ALTER COLUMN "method" TYPE "TenantRegistrationMethod_new" USING ("method"::text::"TenantRegistrationMethod_new");
ALTER TYPE "TenantRegistrationMethod" RENAME TO "TenantRegistrationMethod_old";
ALTER TYPE "TenantRegistrationMethod_new" RENAME TO "TenantRegistrationMethod";
DROP TYPE "public"."TenantRegistrationMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TenantRegistrationStatus_new" AS ENUM ('PENDING_VERIFICATION', 'CONFIRMED', 'EXPIRED');
ALTER TABLE "public"."TenantRegistration" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TenantRegistration" ALTER COLUMN "status" TYPE "TenantRegistrationStatus_new" USING ("status"::text::"TenantRegistrationStatus_new");
ALTER TYPE "TenantRegistrationStatus" RENAME TO "TenantRegistrationStatus_old";
ALTER TYPE "TenantRegistrationStatus_new" RENAME TO "TenantRegistrationStatus";
DROP TYPE "public"."TenantRegistrationStatus_old";
ALTER TABLE "TenantRegistration" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';
COMMIT;

-- AlterTable
ALTER TABLE "TenantRegistration" DROP COLUMN "oauthProviderSub",
DROP COLUMN "oauthStateHash";
