-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL', 'ONCE');

-- CreateEnum
CREATE TYPE "PersonFinancialEntryType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'BENEFIT');

-- CreateEnum
CREATE TYPE "AccessLogAction" AS ENUM ('LOGIN', 'REFRESH', 'LOGOUT');

-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "TenantRegistrationMethod" AS ENUM ('EMAIL', 'GOOGLE', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "TenantRegistrationStatus" AS ENUM ('PENDING_OAUTH', 'PENDING_VERIFICATION', 'CONFIRMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PersonContactType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "PersonContactRole" AS ENUM ('SELF', 'RESPONSIBLE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "SensitiveAccessAction" AS ENUM ('READ', 'UPDATE');

-- CreateEnum
CREATE TYPE "HouseholdTransferType" AS ENUM ('PENSION', 'TRANSFER');

-- CreateTable
CREATE TABLE "Person" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "socialName" TEXT,
    "sex" TEXT,
    "gender" TEXT,
    "raceColor" TEXT,
    "maritalStatus" TEXT,
    "nationality" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "rg" TEXT,
    "nis" TEXT,
    "personType" TEXT NOT NULL DEFAULT 'Atendido',
    "status" TEXT,
    "departureReason" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "profileSummary" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonContact" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "role" "PersonContactRole" NOT NULL DEFAULT 'SELF',
    "type" "PersonContactType" NOT NULL,
    "label" TEXT,
    "name" TEXT,
    "relationship" TEXT,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRecordComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "recordType" VARCHAR(64) NOT NULL,
    "recordId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonRecordComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRecordAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "recordType" VARCHAR(64) NOT NULL,
    "recordId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonRecordAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRecordTag" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "recordType" VARCHAR(64) NOT NULL,
    "recordId" CHAR(36) NOT NULL,
    "value" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonRecordTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonSensitiveDocument" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "dataEnc" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "tag" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonSensitiveDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonSensitiveAccessLog" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "action" "SensitiveAccessAction" NOT NULL,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonSensitiveAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "householdId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "role" TEXT,
    "isLegalGuardian" BOOLEAN NOT NULL DEFAULT false,
    "isHouseholdHead" BOOLEAN NOT NULL DEFAULT false,
    "isIncomeContributor" BOOLEAN NOT NULL DEFAULT false,
    "isProvider" BOOLEAN NOT NULL DEFAULT false,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdProfile" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "householdId" CHAR(36) NOT NULL,
    "type" TEXT,
    "condition" TEXT,
    "ownership" TEXT,
    "areaM2" DOUBLE PRECISION,
    "rooms" INTEGER,
    "bathrooms" INTEGER,
    "cep" VARCHAR(8),
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" VARCHAR(2),
    "ibge" VARCHAR(7),
    "gia" TEXT,
    "ddd" VARCHAR(3),
    "siafi" VARCHAR(4),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdAsset" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "householdId" CHAR(36) NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "condition" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonAsset" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "condition" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonIncome" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "householdId" CHAR(36),
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "IncomeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "contractType" TEXT,
    "isHouseholdContribution" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonFinancialEntry" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "householdId" CHAR(36),
    "fromHouseholdId" CHAR(36),
    "toHouseholdId" CHAR(36),
    "entryType" "PersonFinancialEntryType" NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "status" TEXT,
    "amount" DECIMAL(10,2),
    "frequency" "IncomeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "contractType" TEXT,
    "includeInHouseholdBudget" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonFinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRelation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "relatedPersonId" CHAR(36) NOT NULL,
    "type" TEXT NOT NULL,
    "livesTogether" BOOLEAN NOT NULL DEFAULT false,
    "isLegalGuardian" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonExpense" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "householdId" CHAR(36),
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "IncomeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "isHouseholdExpense" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonBenefit" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "householdId" CHAR(36),
    "type" TEXT NOT NULL,
    "status" TEXT,
    "amount" DECIMAL(10,2),
    "frequency" "IncomeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonDetention" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT,
    "unit" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonDetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonHealthCondition" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT,
    "diagnosisDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonHealthCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonMedication" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "reason" TEXT,
    "medication" TEXT NOT NULL,
    "dosage" TEXT,
    "schedule" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "prescribingDoctor" TEXT,
    "permissionDocumentUrl" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonMedication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonEducation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT,
    "institution" TEXT,
    "grade" TEXT,
    "schoolYear" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdTransfer" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "fromHouseholdId" CHAR(36) NOT NULL,
    "toHouseholdId" CHAR(36) NOT NULL,
    "type" "HouseholdTransferType" NOT NULL DEFAULT 'PENSION',
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "IncomeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "action" "AccessLogAction" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36),
    "entity" TEXT NOT NULL,
    "entityId" CHAR(36),
    "action" "AuditLogAction" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantRegistration" (
    "id" CHAR(36) NOT NULL,
    "method" "TenantRegistrationMethod" NOT NULL,
    "status" "TenantRegistrationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "tenantName" TEXT NOT NULL,
    "tenantSlug" TEXT NOT NULL,
    "adminName" TEXT,
    "adminEmail" TEXT,
    "adminPasswordHash" TEXT,
    "oauthProviderSub" TEXT,
    "oauthStateHash" TEXT,
    "verificationCodeHash" TEXT,
    "verificationCodeExpiresAt" TIMESTAMP(3),
    "tenantId" CHAR(36),
    "adminUserId" CHAR(36),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMfaTotpSetup" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "secretEnc" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMfaTotpSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMfaChallenge" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "type" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMfaChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrustedDevice" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "label" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMfaRecoveryCode" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "codeHash" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "UserMfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "cnpj" TEXT,
    "startYear" INTEGER,
    "description" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaTotpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaTotpSecretEnc" TEXT,
    "mfaTotpVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" CHAR(36) NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "roleId" CHAR(36) NOT NULL,
    "permissionId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "roleId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");

-- CreateIndex
CREATE INDEX "Person_fullName_idx" ON "Person"("fullName");

-- CreateIndex
CREATE INDEX "PersonContact_tenantId_idx" ON "PersonContact"("tenantId");

-- CreateIndex
CREATE INDEX "PersonContact_personId_idx" ON "PersonContact"("personId");

-- CreateIndex
CREATE INDEX "PersonContact_tenantId_personId_type_idx" ON "PersonContact"("tenantId", "personId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PersonContact_tenantId_personId_type_value_key" ON "PersonContact"("tenantId", "personId", "type", "value");

-- CreateIndex
CREATE INDEX "PersonComment_tenantId_idx" ON "PersonComment"("tenantId");

-- CreateIndex
CREATE INDEX "PersonComment_personId_createdAt_idx" ON "PersonComment"("personId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonComment_authorUserId_idx" ON "PersonComment"("authorUserId");

-- CreateIndex
CREATE INDEX "PersonAttachment_tenantId_idx" ON "PersonAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "PersonAttachment_personId_createdAt_idx" ON "PersonAttachment"("personId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonAttachment_uploadedByUserId_idx" ON "PersonAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "PersonRecordComment_tenantId_idx" ON "PersonRecordComment"("tenantId");

-- CreateIndex
CREATE INDEX "PRComment_record_idx" ON "PersonRecordComment"("personId", "recordType", "recordId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonRecordComment_authorUserId_idx" ON "PersonRecordComment"("authorUserId");

-- CreateIndex
CREATE INDEX "PersonRecordAttachment_tenantId_idx" ON "PersonRecordAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "PRAttach_record_idx" ON "PersonRecordAttachment"("personId", "recordType", "recordId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonRecordAttachment_uploadedByUserId_idx" ON "PersonRecordAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "PersonRecordTag_tenantId_idx" ON "PersonRecordTag"("tenantId");

-- CreateIndex
CREATE INDEX "PRTag_record_idx" ON "PersonRecordTag"("personId", "recordType", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "PRTag_record_value_key" ON "PersonRecordTag"("tenantId", "recordType", "recordId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "PersonSensitiveDocument_personId_key" ON "PersonSensitiveDocument"("personId");

-- CreateIndex
CREATE INDEX "PersonSensitiveDocument_tenantId_idx" ON "PersonSensitiveDocument"("tenantId");

-- CreateIndex
CREATE INDEX "PersonSensitiveAccessLog_tenantId_idx" ON "PersonSensitiveAccessLog"("tenantId");

-- CreateIndex
CREATE INDEX "PersonSensitiveAccessLog_personId_idx" ON "PersonSensitiveAccessLog"("personId");

-- CreateIndex
CREATE INDEX "PersonSensitiveAccessLog_userId_idx" ON "PersonSensitiveAccessLog"("userId");

-- CreateIndex
CREATE INDEX "PersonSensitiveAccessLog_tenantId_personId_action_idx" ON "PersonSensitiveAccessLog"("tenantId", "personId", "action");

-- CreateIndex
CREATE INDEX "Household_tenantId_idx" ON "Household"("tenantId");

-- CreateIndex
CREATE INDEX "HouseholdMember_tenantId_idx" ON "HouseholdMember"("tenantId");

-- CreateIndex
CREATE INDEX "HouseholdMember_householdId_idx" ON "HouseholdMember"("householdId");

-- CreateIndex
CREATE INDEX "HouseholdMember_personId_idx" ON "HouseholdMember"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_householdId_personId_key" ON "HouseholdMember"("householdId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdProfile_householdId_key" ON "HouseholdProfile"("householdId");

-- CreateIndex
CREATE INDEX "HouseholdProfile_tenantId_idx" ON "HouseholdProfile"("tenantId");

-- CreateIndex
CREATE INDEX "HouseholdProfile_tenantId_cep_idx" ON "HouseholdProfile"("tenantId", "cep");

-- CreateIndex
CREATE INDEX "HouseholdAsset_tenantId_idx" ON "HouseholdAsset"("tenantId");

-- CreateIndex
CREATE INDEX "HouseholdAsset_householdId_idx" ON "HouseholdAsset"("householdId");

-- CreateIndex
CREATE INDEX "PersonAsset_tenantId_idx" ON "PersonAsset"("tenantId");

-- CreateIndex
CREATE INDEX "PersonAsset_personId_idx" ON "PersonAsset"("personId");

-- CreateIndex
CREATE INDEX "PersonIncome_tenantId_idx" ON "PersonIncome"("tenantId");

-- CreateIndex
CREATE INDEX "PersonIncome_personId_idx" ON "PersonIncome"("personId");

-- CreateIndex
CREATE INDEX "PersonIncome_householdId_idx" ON "PersonIncome"("householdId");

-- CreateIndex
CREATE INDEX "PersonFinancialEntry_tenantId_idx" ON "PersonFinancialEntry"("tenantId");

-- CreateIndex
CREATE INDEX "PersonFinancialEntry_personId_idx" ON "PersonFinancialEntry"("personId");

-- CreateIndex
CREATE INDEX "PersonFinancialEntry_householdId_idx" ON "PersonFinancialEntry"("householdId");

-- CreateIndex
CREATE INDEX "PersonFinancialEntry_fromHouseholdId_idx" ON "PersonFinancialEntry"("fromHouseholdId");

-- CreateIndex
CREATE INDEX "PersonFinancialEntry_toHouseholdId_idx" ON "PersonFinancialEntry"("toHouseholdId");

-- CreateIndex
CREATE INDEX "PersonFinancialEntry_entryType_idx" ON "PersonFinancialEntry"("entryType");

-- CreateIndex
CREATE INDEX "PersonFinancialEntry_tenantId_personId_entryType_idx" ON "PersonFinancialEntry"("tenantId", "personId", "entryType");

-- CreateIndex
CREATE INDEX "PersonRelation_tenantId_idx" ON "PersonRelation"("tenantId");

-- CreateIndex
CREATE INDEX "PersonRelation_personId_idx" ON "PersonRelation"("personId");

-- CreateIndex
CREATE INDEX "PersonRelation_relatedPersonId_idx" ON "PersonRelation"("relatedPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonRelation_tenantId_personId_relatedPersonId_type_key" ON "PersonRelation"("tenantId", "personId", "relatedPersonId", "type");

-- CreateIndex
CREATE INDEX "PersonExpense_tenantId_idx" ON "PersonExpense"("tenantId");

-- CreateIndex
CREATE INDEX "PersonExpense_personId_idx" ON "PersonExpense"("personId");

-- CreateIndex
CREATE INDEX "PersonExpense_householdId_idx" ON "PersonExpense"("householdId");

-- CreateIndex
CREATE INDEX "PersonBenefit_tenantId_idx" ON "PersonBenefit"("tenantId");

-- CreateIndex
CREATE INDEX "PersonBenefit_personId_idx" ON "PersonBenefit"("personId");

-- CreateIndex
CREATE INDEX "PersonBenefit_householdId_idx" ON "PersonBenefit"("householdId");

-- CreateIndex
CREATE INDEX "PersonBenefit_tenantId_personId_idx" ON "PersonBenefit"("tenantId", "personId");

-- CreateIndex
CREATE INDEX "PersonDetention_tenantId_idx" ON "PersonDetention"("tenantId");

-- CreateIndex
CREATE INDEX "PersonDetention_personId_idx" ON "PersonDetention"("personId");

-- CreateIndex
CREATE INDEX "PersonDetention_tenantId_personId_idx" ON "PersonDetention"("tenantId", "personId");

-- CreateIndex
CREATE INDEX "PersonHealthCondition_tenantId_idx" ON "PersonHealthCondition"("tenantId");

-- CreateIndex
CREATE INDEX "PersonHealthCondition_personId_idx" ON "PersonHealthCondition"("personId");

-- CreateIndex
CREATE INDEX "PersonMedication_tenantId_idx" ON "PersonMedication"("tenantId");

-- CreateIndex
CREATE INDEX "PersonMedication_personId_idx" ON "PersonMedication"("personId");

-- CreateIndex
CREATE INDEX "PersonEducation_tenantId_idx" ON "PersonEducation"("tenantId");

-- CreateIndex
CREATE INDEX "PersonEducation_personId_idx" ON "PersonEducation"("personId");

-- CreateIndex
CREATE INDEX "PersonEducation_tenantId_personId_idx" ON "PersonEducation"("tenantId", "personId");

-- CreateIndex
CREATE INDEX "HouseholdTransfer_tenantId_idx" ON "HouseholdTransfer"("tenantId");

-- CreateIndex
CREATE INDEX "HouseholdTransfer_personId_idx" ON "HouseholdTransfer"("personId");

-- CreateIndex
CREATE INDEX "HouseholdTransfer_fromHouseholdId_idx" ON "HouseholdTransfer"("fromHouseholdId");

-- CreateIndex
CREATE INDEX "HouseholdTransfer_toHouseholdId_idx" ON "HouseholdTransfer"("toHouseholdId");

-- CreateIndex
CREATE INDEX "UserSession_tenantId_idx" ON "UserSession"("tenantId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tenantId_idx" ON "PasswordResetToken"("tenantId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccessLog_tenantId_idx" ON "AccessLog"("tenantId");

-- CreateIndex
CREATE INDEX "AccessLog_userId_idx" ON "AccessLog"("userId");

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "TenantRegistration_adminEmail_idx" ON "TenantRegistration"("adminEmail");

-- CreateIndex
CREATE INDEX "TenantRegistration_tenantSlug_idx" ON "TenantRegistration"("tenantSlug");

-- CreateIndex
CREATE INDEX "TenantRegistration_status_idx" ON "TenantRegistration"("status");

-- CreateIndex
CREATE INDEX "TenantRegistration_createdAt_idx" ON "TenantRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "UserMfaTotpSetup_tenantId_idx" ON "UserMfaTotpSetup"("tenantId");

-- CreateIndex
CREATE INDEX "UserMfaTotpSetup_userId_idx" ON "UserMfaTotpSetup"("userId");

-- CreateIndex
CREATE INDEX "UserMfaTotpSetup_expiresAt_idx" ON "UserMfaTotpSetup"("expiresAt");

-- CreateIndex
CREATE INDEX "UserMfaChallenge_tenantId_idx" ON "UserMfaChallenge"("tenantId");

-- CreateIndex
CREATE INDEX "UserMfaChallenge_userId_idx" ON "UserMfaChallenge"("userId");

-- CreateIndex
CREATE INDEX "UserMfaChallenge_expiresAt_idx" ON "UserMfaChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "UserTrustedDevice_tenantId_idx" ON "UserTrustedDevice"("tenantId");

-- CreateIndex
CREATE INDEX "UserTrustedDevice_userId_idx" ON "UserTrustedDevice"("userId");

-- CreateIndex
CREATE INDEX "UserTrustedDevice_expiresAt_idx" ON "UserTrustedDevice"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrustedDevice_tenantId_tokenHash_key" ON "UserTrustedDevice"("tenantId", "tokenHash");

-- CreateIndex
CREATE INDEX "UserMfaRecoveryCode_tenantId_idx" ON "UserMfaRecoveryCode"("tenantId");

-- CreateIndex
CREATE INDEX "UserMfaRecoveryCode_userId_idx" ON "UserMfaRecoveryCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMfaRecoveryCode_tenantId_codeHash_key" ON "UserMfaRecoveryCode"("tenantId", "codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_name_key" ON "Role"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "RolePermission_tenantId_idx" ON "RolePermission"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_tenantId_roleId_permissionId_key" ON "RolePermission"("tenantId", "roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_tenantId_idx" ON "UserRole"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_tenantId_userId_roleId_key" ON "UserRole"("tenantId", "userId", "roleId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonContact" ADD CONSTRAINT "PersonContact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonContact" ADD CONSTRAINT "PersonContact_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonComment" ADD CONSTRAINT "PersonComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonComment" ADD CONSTRAINT "PersonComment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonComment" ADD CONSTRAINT "PersonComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAttachment" ADD CONSTRAINT "PersonAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAttachment" ADD CONSTRAINT "PersonAttachment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAttachment" ADD CONSTRAINT "PersonAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordComment" ADD CONSTRAINT "PersonRecordComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordComment" ADD CONSTRAINT "PersonRecordComment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordComment" ADD CONSTRAINT "PersonRecordComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordAttachment" ADD CONSTRAINT "PersonRecordAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordAttachment" ADD CONSTRAINT "PersonRecordAttachment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordAttachment" ADD CONSTRAINT "PersonRecordAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordTag" ADD CONSTRAINT "PersonRecordTag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRecordTag" ADD CONSTRAINT "PersonRecordTag_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSensitiveDocument" ADD CONSTRAINT "PersonSensitiveDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSensitiveDocument" ADD CONSTRAINT "PersonSensitiveDocument_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSensitiveAccessLog" ADD CONSTRAINT "PersonSensitiveAccessLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSensitiveAccessLog" ADD CONSTRAINT "PersonSensitiveAccessLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSensitiveAccessLog" ADD CONSTRAINT "PersonSensitiveAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdProfile" ADD CONSTRAINT "HouseholdProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdProfile" ADD CONSTRAINT "HouseholdProfile_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdAsset" ADD CONSTRAINT "HouseholdAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdAsset" ADD CONSTRAINT "HouseholdAsset_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAsset" ADD CONSTRAINT "PersonAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAsset" ADD CONSTRAINT "PersonAsset_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIncome" ADD CONSTRAINT "PersonIncome_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIncome" ADD CONSTRAINT "PersonIncome_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIncome" ADD CONSTRAINT "PersonIncome_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFinancialEntry" ADD CONSTRAINT "PersonFinancialEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFinancialEntry" ADD CONSTRAINT "PersonFinancialEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFinancialEntry" ADD CONSTRAINT "PersonFinancialEntry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFinancialEntry" ADD CONSTRAINT "PersonFinancialEntry_fromHouseholdId_fkey" FOREIGN KEY ("fromHouseholdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFinancialEntry" ADD CONSTRAINT "PersonFinancialEntry_toHouseholdId_fkey" FOREIGN KEY ("toHouseholdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRelation" ADD CONSTRAINT "PersonRelation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRelation" ADD CONSTRAINT "PersonRelation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRelation" ADD CONSTRAINT "PersonRelation_relatedPersonId_fkey" FOREIGN KEY ("relatedPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonExpense" ADD CONSTRAINT "PersonExpense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonExpense" ADD CONSTRAINT "PersonExpense_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonExpense" ADD CONSTRAINT "PersonExpense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonBenefit" ADD CONSTRAINT "PersonBenefit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonBenefit" ADD CONSTRAINT "PersonBenefit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonBenefit" ADD CONSTRAINT "PersonBenefit_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonDetention" ADD CONSTRAINT "PersonDetention_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonDetention" ADD CONSTRAINT "PersonDetention_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonHealthCondition" ADD CONSTRAINT "PersonHealthCondition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonHealthCondition" ADD CONSTRAINT "PersonHealthCondition_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMedication" ADD CONSTRAINT "PersonMedication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonMedication" ADD CONSTRAINT "PersonMedication_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonEducation" ADD CONSTRAINT "PersonEducation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonEducation" ADD CONSTRAINT "PersonEducation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdTransfer" ADD CONSTRAINT "HouseholdTransfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdTransfer" ADD CONSTRAINT "HouseholdTransfer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdTransfer" ADD CONSTRAINT "HouseholdTransfer_fromHouseholdId_fkey" FOREIGN KEY ("fromHouseholdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdTransfer" ADD CONSTRAINT "HouseholdTransfer_toHouseholdId_fkey" FOREIGN KEY ("toHouseholdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMfaTotpSetup" ADD CONSTRAINT "UserMfaTotpSetup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMfaTotpSetup" ADD CONSTRAINT "UserMfaTotpSetup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMfaChallenge" ADD CONSTRAINT "UserMfaChallenge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMfaChallenge" ADD CONSTRAINT "UserMfaChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrustedDevice" ADD CONSTRAINT "UserTrustedDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrustedDevice" ADD CONSTRAINT "UserTrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMfaRecoveryCode" ADD CONSTRAINT "UserMfaRecoveryCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMfaRecoveryCode" ADD CONSTRAINT "UserMfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
