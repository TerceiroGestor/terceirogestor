-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('SCFV', 'PAIF', 'PAEFI', 'CULTURAL', 'QUALIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "ProjectParticipationRole" AS ENUM ('PUBLICO_ATENDIDO', 'FAMILIAR', 'VOLUNTARIO', 'EQUIPE_TECNICA', 'FUNCIONARIO', 'OFICINEIRO', 'PARCEIRO', 'DOADOR', 'PATROCINADOR');

-- CreateEnum
CREATE TYPE "ParticipationKind" AS ENUM ('PARTICIPANT', 'TEAM');

-- CreateEnum
CREATE TYPE "PeopleGroupType" AS ENUM ('CYCLE', 'SEGMENT', 'TEAM_POOL', 'NETWORK', 'OTHER');

-- CreateEnum
CREATE TYPE "PeopleGroupPurpose" AS ENUM ('PUBLICO', 'EQUIPE');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PLANNED', 'EXECUTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ActionTarget" AS ENUM ('PROJECT', 'PROJECT_GROUP', 'PEOPLE_GROUP', 'ENROLLMENT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ActionPeopleParticipationRole" AS ENUM ('PARTICIPANTE', 'FACILITADOR', 'APOIO', 'VOLUNTARIO', 'RESPONSAVEL_TECNICO', 'CONVIDADO');

-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL', 'ONCE');

-- CreateEnum
CREATE TYPE "PersonFinancialEntryType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'BENEFIT');

-- CreateEnum
CREATE TYPE "AccessLogAction" AS ENUM ('LOGIN', 'REFRESH', 'LOGOUT');

-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "PantryDonorType" AS ENUM ('PERSON', 'COMPANY');

-- CreateEnum
CREATE TYPE "PantryExitType" AS ENUM ('ATTENDED', 'DONATION', 'EVENT', 'PARTY', 'CORRECTION');

-- CreateEnum
CREATE TYPE "DepositDonorType" AS ENUM ('PERSON', 'COMPANY');

-- CreateEnum
CREATE TYPE "DepositExitType" AS ENUM ('LOAN', 'FINAL_REMOVAL', 'TRANSFER', 'ADJUSTMENT', 'LOSS');

-- CreateEnum
CREATE TYPE "TaskOrganizerStatus" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskOrganizerPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskOrganizerKind" AS ENUM ('FEATURE', 'BUG', 'ROUTINE');

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
CREATE TABLE "Tenant" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "cnpj" TEXT,
    "startYear" INTEGER,
    "description" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
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
CREATE TABLE "Program" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProgramType" NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'PLANNED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "programId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "programId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "programId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeopleGroup" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "groupType" "PeopleGroupType" NOT NULL DEFAULT 'SEGMENT',
    "purpose" "PeopleGroupPurpose" NOT NULL DEFAULT 'PUBLICO',
    "category" TEXT,
    "description" TEXT,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeopleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeopleGroupParticipation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "peopleGroupId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "activeKey" VARCHAR(80),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeopleGroupParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeopleSegment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeopleSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeopleSegmentMembership" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "segmentId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "activeKey" VARCHAR(80),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeopleSegmentMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectGroup" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPeopleGroup" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "peopleGroupId" CHAR(36) NOT NULL,
    "participationKind" "ParticipationKind" NOT NULL DEFAULT 'PARTICIPANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPeopleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEnrollment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "participationKind" "ParticipationKind" NOT NULL DEFAULT 'PARTICIPANT',
    "role" "ProjectParticipationRole" NOT NULL DEFAULT 'PUBLICO_ATENDIDO',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEnrollmentGroupMembership" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "enrollmentId" CHAR(36) NOT NULL,
    "groupId" CHAR(36) NOT NULL,
    "activeKey" VARCHAR(80),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEnrollmentGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionType" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" "ActionTarget" NOT NULL DEFAULT 'PROJECT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAction" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "createdByUserId" CHAR(36),
    "groupId" CHAR(36),
    "targetEnrollmentId" CHAR(36),
    "actionTypeId" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "planHtml" TEXT,
    "executedHtml" TEXT,
    "conclusionHtml" TEXT,
    "completionPercent" INTEGER,
    "photoPaths" JSONB,
    "status" "ActionStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedStartAt" TIMESTAMP(3),
    "plannedEndAt" TIMESTAMP(3),
    "executedStartAt" TIMESTAMP(3),
    "executedEndAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActionComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "actionId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectActionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActionAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "actionId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectActionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPeopleGroup" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "actionId" CHAR(36) NOT NULL,
    "peopleGroupId" CHAR(36) NOT NULL,
    "participationKind" "ParticipationKind" NOT NULL DEFAULT 'PARTICIPANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPeopleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActionAttendance" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "actionId" CHAR(36) NOT NULL,
    "enrollmentId" CHAR(36) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "qualityScore" INTEGER,
    "qualityNotes" TEXT,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectActionAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActionPeopleParticipation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "actionId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "enrollmentId" CHAR(36),
    "participationKind" "ParticipationKind" NOT NULL DEFAULT 'TEAM',
    "role" "ActionPeopleParticipationRole" NOT NULL DEFAULT 'PARTICIPANTE',
    "activeKey" VARCHAR(120),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectActionPeopleParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT,
    "defaultSector" TEXT NOT NULL DEFAULT 'Geral',
    "unit" TEXT NOT NULL,
    "minStock" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantrySector" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantrySector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryDonor" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PantryDonorType" NOT NULL DEFAULT 'PERSON',
    "contact" TEXT,
    "avatarUrl" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryDonor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryEntry" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "donorId" CHAR(36),
    "sector" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "reversalOfExitId" CHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryExit" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "sector" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "exitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PantryExitType" NOT NULL DEFAULT 'ATTENDED',
    "eventName" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "reversalOfEntryId" CHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryExit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryExitAllocation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "exitId" CHAR(36) NOT NULL,
    "entryId" CHAR(36) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PantryExitAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItemComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItemComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItemAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItemAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryDonorComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "donorId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryDonorComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryDonorAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "donorId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryDonorAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryEntryComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "entryId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryEntryComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryEntryAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "entryId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryEntryAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryExitComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "exitId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryExitComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryExitAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "exitId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryExitAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositItem" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT,
    "defaultSector" TEXT NOT NULL DEFAULT 'Geral',
    "unit" TEXT NOT NULL,
    "minStock" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositSector" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositDonor" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DepositDonorType" NOT NULL DEFAULT 'PERSON',
    "contact" TEXT,
    "avatarUrl" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositDonor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositEntry" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "donorId" CHAR(36),
    "sector" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "reversalOfExitId" CHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositExit" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "sector" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "exitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "DepositExitType" NOT NULL DEFAULT 'FINAL_REMOVAL',
    "destinationName" TEXT,
    "destinationType" TEXT,
    "expectedReturnAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "returnedQuantity" DECIMAL(10,2),
    "returnNotes" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "internalNotes" TEXT,
    "reversalOfEntryId" CHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositExit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositExitAllocation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "exitId" CHAR(36) NOT NULL,
    "entryId" CHAR(36) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositExitAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositItemComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositItemComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositItemAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "itemId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositItemAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositDonorComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "donorId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositDonorComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositDonorAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "donorId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositDonorAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositEntryComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "entryId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositEntryComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositEntryAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "entryId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositEntryAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositExitComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "exitId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositExitComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositExitAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "exitId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositExitAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOrganizerTask" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "status" "TaskOrganizerStatus" NOT NULL DEFAULT 'BACKLOG',
    "priority" "TaskOrganizerPriority" NOT NULL DEFAULT 'MEDIUM',
    "kind" "TaskOrganizerKind" NOT NULL DEFAULT 'FEATURE',
    "owner" TEXT,
    "ownerUserId" CHAR(36),
    "team" TEXT,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "effortPoints" INTEGER,
    "tags" JSONB,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOrganizerTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOrganizerAttachment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "taskId" CHAR(36) NOT NULL,
    "uploadedByUserId" CHAR(36),
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOrganizerAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOrganizerChecklistItem" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "taskId" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "owner" TEXT,
    "ownerUserId" CHAR(36),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOrganizerChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOrganizerSubtask" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "taskId" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskOrganizerStatus" NOT NULL DEFAULT 'BACKLOG',
    "owner" TEXT,
    "ownerUserId" CHAR(36),
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOrganizerSubtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOrganizerComment" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "taskId" CHAR(36) NOT NULL,
    "authorUserId" CHAR(36),
    "body" TEXT NOT NULL,
    "mentionUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOrganizerComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOrganizerTaskDependency" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "taskId" CHAR(36) NOT NULL,
    "dependsOnTaskId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskOrganizerTaskDependency_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Program_tenantId_idx" ON "Program"("tenantId");

-- CreateIndex
CREATE INDEX "Program_name_idx" ON "Program"("name");

-- CreateIndex
CREATE INDEX "Program_status_idx" ON "Program"("status");

-- CreateIndex
CREATE INDEX "ProgramComment_tenantId_idx" ON "ProgramComment"("tenantId");

-- CreateIndex
CREATE INDEX "ProgramComment_programId_createdAt_idx" ON "ProgramComment"("programId", "createdAt");

-- CreateIndex
CREATE INDEX "ProgramComment_authorUserId_idx" ON "ProgramComment"("authorUserId");

-- CreateIndex
CREATE INDEX "ProgramAttachment_tenantId_idx" ON "ProgramAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "ProgramAttachment_programId_createdAt_idx" ON "ProgramAttachment"("programId", "createdAt");

-- CreateIndex
CREATE INDEX "ProgramAttachment_uploadedByUserId_idx" ON "ProgramAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");

-- CreateIndex
CREATE INDEX "Project_programId_idx" ON "Project"("programId");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "ProjectComment_tenantId_idx" ON "ProjectComment"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectComment_projectId_idx" ON "ProjectComment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectComment_authorUserId_idx" ON "ProjectComment"("authorUserId");

-- CreateIndex
CREATE INDEX "ProjectAttachment_tenantId_idx" ON "ProjectAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectAttachment_projectId_idx" ON "ProjectAttachment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAttachment_uploadedByUserId_idx" ON "ProjectAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "PeopleGroup_tenantId_idx" ON "PeopleGroup"("tenantId");

-- CreateIndex
CREATE INDEX "PeopleGroup_name_idx" ON "PeopleGroup"("name");

-- CreateIndex
CREATE INDEX "PeopleGroup_groupType_idx" ON "PeopleGroup"("groupType");

-- CreateIndex
CREATE INDEX "PeopleGroup_purpose_idx" ON "PeopleGroup"("purpose");

-- CreateIndex
CREATE INDEX "PeopleGroup_category_idx" ON "PeopleGroup"("category");

-- CreateIndex
CREATE INDEX "PeopleGroup_isActive_idx" ON "PeopleGroup"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PeopleGroup_tenantId_name_key" ON "PeopleGroup"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PeopleGroupParticipation_tenantId_idx" ON "PeopleGroupParticipation"("tenantId");

-- CreateIndex
CREATE INDEX "PeopleGroupParticipation_peopleGroupId_idx" ON "PeopleGroupParticipation"("peopleGroupId");

-- CreateIndex
CREATE INDEX "PeopleGroupParticipation_personId_idx" ON "PeopleGroupParticipation"("personId");

-- CreateIndex
CREATE INDEX "PeopleGroupParticipation_activeKey_idx" ON "PeopleGroupParticipation"("activeKey");

-- CreateIndex
CREATE INDEX "PeopleGroupParticipation_isActive_idx" ON "PeopleGroupParticipation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PeopleGroupParticipation_tenantId_activeKey_key" ON "PeopleGroupParticipation"("tenantId", "activeKey");

-- CreateIndex
CREATE INDEX "PeopleSegment_tenantId_idx" ON "PeopleSegment"("tenantId");

-- CreateIndex
CREATE INDEX "PeopleSegment_name_idx" ON "PeopleSegment"("name");

-- CreateIndex
CREATE INDEX "PeopleSegment_category_idx" ON "PeopleSegment"("category");

-- CreateIndex
CREATE INDEX "PeopleSegment_isActive_idx" ON "PeopleSegment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PeopleSegment_tenantId_name_key" ON "PeopleSegment"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PeopleSegmentMembership_tenantId_idx" ON "PeopleSegmentMembership"("tenantId");

-- CreateIndex
CREATE INDEX "PeopleSegmentMembership_segmentId_idx" ON "PeopleSegmentMembership"("segmentId");

-- CreateIndex
CREATE INDEX "PeopleSegmentMembership_personId_idx" ON "PeopleSegmentMembership"("personId");

-- CreateIndex
CREATE INDEX "PeopleSegmentMembership_activeKey_idx" ON "PeopleSegmentMembership"("activeKey");

-- CreateIndex
CREATE INDEX "PeopleSegmentMembership_isActive_idx" ON "PeopleSegmentMembership"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PeopleSegmentMembership_tenantId_activeKey_key" ON "PeopleSegmentMembership"("tenantId", "activeKey");

-- CreateIndex
CREATE INDEX "ProjectGroup_tenantId_idx" ON "ProjectGroup"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectGroup_projectId_idx" ON "ProjectGroup"("projectId");

-- CreateIndex
CREATE INDEX "ProjectGroup_name_idx" ON "ProjectGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGroup_tenantId_projectId_name_key" ON "ProjectGroup"("tenantId", "projectId", "name");

-- CreateIndex
CREATE INDEX "ProjectPeopleGroup_tenantId_idx" ON "ProjectPeopleGroup"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectPeopleGroup_projectId_idx" ON "ProjectPeopleGroup"("projectId");

-- CreateIndex
CREATE INDEX "ProjectPeopleGroup_peopleGroupId_idx" ON "ProjectPeopleGroup"("peopleGroupId");

-- CreateIndex
CREATE INDEX "ProjectPeopleGroup_participationKind_idx" ON "ProjectPeopleGroup"("participationKind");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPeopleGroup_tenantId_projectId_peopleGroupId_partici_key" ON "ProjectPeopleGroup"("tenantId", "projectId", "peopleGroupId", "participationKind");

-- CreateIndex
CREATE INDEX "ProjectEnrollment_tenantId_idx" ON "ProjectEnrollment"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectEnrollment_projectId_idx" ON "ProjectEnrollment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectEnrollment_personId_idx" ON "ProjectEnrollment"("personId");

-- CreateIndex
CREATE INDEX "ProjectEnrollment_participationKind_idx" ON "ProjectEnrollment"("participationKind");

-- CreateIndex
CREATE INDEX "ProjectEnrollment_status_idx" ON "ProjectEnrollment"("status");

-- CreateIndex
CREATE INDEX "ProjectEnrollmentGroupMembership_tenantId_idx" ON "ProjectEnrollmentGroupMembership"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectEnrollmentGroupMembership_enrollmentId_idx" ON "ProjectEnrollmentGroupMembership"("enrollmentId");

-- CreateIndex
CREATE INDEX "ProjectEnrollmentGroupMembership_groupId_idx" ON "ProjectEnrollmentGroupMembership"("groupId");

-- CreateIndex
CREATE INDEX "ProjectEnrollmentGroupMembership_activeKey_idx" ON "ProjectEnrollmentGroupMembership"("activeKey");

-- CreateIndex
CREATE INDEX "ProjectEnrollmentGroupMembership_isActive_idx" ON "ProjectEnrollmentGroupMembership"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEnrollmentGroupMembership_tenantId_activeKey_key" ON "ProjectEnrollmentGroupMembership"("tenantId", "activeKey");

-- CreateIndex
CREATE INDEX "ActionType_tenantId_idx" ON "ActionType"("tenantId");

-- CreateIndex
CREATE INDEX "ActionType_name_idx" ON "ActionType"("name");

-- CreateIndex
CREATE INDEX "ActionType_isActive_idx" ON "ActionType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ActionType_tenantId_name_key" ON "ActionType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ProjectAction_tenantId_idx" ON "ProjectAction"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectAction_projectId_idx" ON "ProjectAction"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAction_createdByUserId_idx" ON "ProjectAction"("createdByUserId");

-- CreateIndex
CREATE INDEX "ProjectAction_groupId_idx" ON "ProjectAction"("groupId");

-- CreateIndex
CREATE INDEX "ProjectAction_targetEnrollmentId_idx" ON "ProjectAction"("targetEnrollmentId");

-- CreateIndex
CREATE INDEX "ProjectAction_actionTypeId_idx" ON "ProjectAction"("actionTypeId");

-- CreateIndex
CREATE INDEX "ProjectAction_status_idx" ON "ProjectAction"("status");

-- CreateIndex
CREATE INDEX "ProjectAction_plannedStartAt_idx" ON "ProjectAction"("plannedStartAt");

-- CreateIndex
CREATE INDEX "ProjectActionComment_tenantId_idx" ON "ProjectActionComment"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectActionComment_actionId_idx" ON "ProjectActionComment"("actionId");

-- CreateIndex
CREATE INDEX "ProjectActionComment_authorUserId_idx" ON "ProjectActionComment"("authorUserId");

-- CreateIndex
CREATE INDEX "ProjectActionAttachment_tenantId_idx" ON "ProjectActionAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectActionAttachment_actionId_idx" ON "ProjectActionAttachment"("actionId");

-- CreateIndex
CREATE INDEX "ProjectActionAttachment_uploadedByUserId_idx" ON "ProjectActionAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "ActionPeopleGroup_tenantId_idx" ON "ActionPeopleGroup"("tenantId");

-- CreateIndex
CREATE INDEX "ActionPeopleGroup_actionId_idx" ON "ActionPeopleGroup"("actionId");

-- CreateIndex
CREATE INDEX "ActionPeopleGroup_peopleGroupId_idx" ON "ActionPeopleGroup"("peopleGroupId");

-- CreateIndex
CREATE INDEX "ActionPeopleGroup_participationKind_idx" ON "ActionPeopleGroup"("participationKind");

-- CreateIndex
CREATE UNIQUE INDEX "ActionPeopleGroup_tenantId_actionId_peopleGroupId_participa_key" ON "ActionPeopleGroup"("tenantId", "actionId", "peopleGroupId", "participationKind");

-- CreateIndex
CREATE INDEX "ProjectActionAttendance_tenantId_idx" ON "ProjectActionAttendance"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectActionAttendance_actionId_idx" ON "ProjectActionAttendance"("actionId");

-- CreateIndex
CREATE INDEX "ProjectActionAttendance_enrollmentId_idx" ON "ProjectActionAttendance"("enrollmentId");

-- CreateIndex
CREATE INDEX "ProjectActionAttendance_status_idx" ON "ProjectActionAttendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectActionAttendance_tenantId_actionId_enrollmentId_key" ON "ProjectActionAttendance"("tenantId", "actionId", "enrollmentId");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_tenantId_idx" ON "ProjectActionPeopleParticipation"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_actionId_idx" ON "ProjectActionPeopleParticipation"("actionId");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_personId_idx" ON "ProjectActionPeopleParticipation"("personId");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_enrollmentId_idx" ON "ProjectActionPeopleParticipation"("enrollmentId");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_participationKind_idx" ON "ProjectActionPeopleParticipation"("participationKind");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_role_idx" ON "ProjectActionPeopleParticipation"("role");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_activeKey_idx" ON "ProjectActionPeopleParticipation"("activeKey");

-- CreateIndex
CREATE INDEX "ProjectActionPeopleParticipation_isActive_idx" ON "ProjectActionPeopleParticipation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectActionPeopleParticipation_tenantId_activeKey_key" ON "ProjectActionPeopleParticipation"("tenantId", "activeKey");

-- CreateIndex
CREATE INDEX "PantryItem_tenantId_idx" ON "PantryItem"("tenantId");

-- CreateIndex
CREATE INDEX "PantryItem_name_idx" ON "PantryItem"("name");

-- CreateIndex
CREATE INDEX "PantrySector_tenantId_idx" ON "PantrySector"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PantrySector_tenantId_name_key" ON "PantrySector"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PantryDonor_tenantId_idx" ON "PantryDonor"("tenantId");

-- CreateIndex
CREATE INDEX "PantryDonor_name_idx" ON "PantryDonor"("name");

-- CreateIndex
CREATE INDEX "PantryEntry_tenantId_idx" ON "PantryEntry"("tenantId");

-- CreateIndex
CREATE INDEX "PantryEntry_itemId_idx" ON "PantryEntry"("itemId");

-- CreateIndex
CREATE INDEX "PantryEntry_donorId_idx" ON "PantryEntry"("donorId");

-- CreateIndex
CREATE INDEX "PantryEntry_sector_idx" ON "PantryEntry"("sector");

-- CreateIndex
CREATE INDEX "PantryEntry_entryDate_idx" ON "PantryEntry"("entryDate");

-- CreateIndex
CREATE INDEX "PantryEntry_expiryDate_idx" ON "PantryEntry"("expiryDate");

-- CreateIndex
CREATE INDEX "PantryEntry_reversalOfExitId_idx" ON "PantryEntry"("reversalOfExitId");

-- CreateIndex
CREATE INDEX "PantryExit_tenantId_idx" ON "PantryExit"("tenantId");

-- CreateIndex
CREATE INDEX "PantryExit_itemId_idx" ON "PantryExit"("itemId");

-- CreateIndex
CREATE INDEX "PantryExit_sector_idx" ON "PantryExit"("sector");

-- CreateIndex
CREATE INDEX "PantryExit_exitDate_idx" ON "PantryExit"("exitDate");

-- CreateIndex
CREATE INDEX "PantryExit_reversalOfEntryId_idx" ON "PantryExit"("reversalOfEntryId");

-- CreateIndex
CREATE INDEX "PantryExitAllocation_tenantId_idx" ON "PantryExitAllocation"("tenantId");

-- CreateIndex
CREATE INDEX "PantryExitAllocation_exitId_idx" ON "PantryExitAllocation"("exitId");

-- CreateIndex
CREATE INDEX "PantryExitAllocation_entryId_idx" ON "PantryExitAllocation"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "PantryExitAllocation_exitId_entryId_key" ON "PantryExitAllocation"("exitId", "entryId");

-- CreateIndex
CREATE INDEX "PantryItemComment_tenantId_idx" ON "PantryItemComment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryItemComment_itemId_createdAt_idx" ON "PantryItemComment"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryItemComment_authorUserId_idx" ON "PantryItemComment"("authorUserId");

-- CreateIndex
CREATE INDEX "PantryItemAttachment_tenantId_idx" ON "PantryItemAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryItemAttachment_itemId_createdAt_idx" ON "PantryItemAttachment"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryItemAttachment_uploadedByUserId_idx" ON "PantryItemAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "PantryDonorComment_tenantId_idx" ON "PantryDonorComment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryDonorComment_donorId_createdAt_idx" ON "PantryDonorComment"("donorId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryDonorComment_authorUserId_idx" ON "PantryDonorComment"("authorUserId");

-- CreateIndex
CREATE INDEX "PantryDonorAttachment_tenantId_idx" ON "PantryDonorAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryDonorAttachment_donorId_createdAt_idx" ON "PantryDonorAttachment"("donorId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryDonorAttachment_uploadedByUserId_idx" ON "PantryDonorAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "PantryEntryComment_tenantId_idx" ON "PantryEntryComment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryEntryComment_entryId_createdAt_idx" ON "PantryEntryComment"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryEntryComment_authorUserId_idx" ON "PantryEntryComment"("authorUserId");

-- CreateIndex
CREATE INDEX "PantryEntryAttachment_tenantId_idx" ON "PantryEntryAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryEntryAttachment_entryId_createdAt_idx" ON "PantryEntryAttachment"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryEntryAttachment_uploadedByUserId_idx" ON "PantryEntryAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "PantryExitComment_tenantId_idx" ON "PantryExitComment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryExitComment_exitId_createdAt_idx" ON "PantryExitComment"("exitId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryExitComment_authorUserId_idx" ON "PantryExitComment"("authorUserId");

-- CreateIndex
CREATE INDEX "PantryExitAttachment_tenantId_idx" ON "PantryExitAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "PantryExitAttachment_exitId_createdAt_idx" ON "PantryExitAttachment"("exitId", "createdAt");

-- CreateIndex
CREATE INDEX "PantryExitAttachment_uploadedByUserId_idx" ON "PantryExitAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "DepositItem_tenantId_idx" ON "DepositItem"("tenantId");

-- CreateIndex
CREATE INDEX "DepositItem_name_idx" ON "DepositItem"("name");

-- CreateIndex
CREATE INDEX "DepositSector_tenantId_idx" ON "DepositSector"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositSector_tenantId_name_key" ON "DepositSector"("tenantId", "name");

-- CreateIndex
CREATE INDEX "DepositDonor_tenantId_idx" ON "DepositDonor"("tenantId");

-- CreateIndex
CREATE INDEX "DepositDonor_name_idx" ON "DepositDonor"("name");

-- CreateIndex
CREATE INDEX "DepositEntry_tenantId_idx" ON "DepositEntry"("tenantId");

-- CreateIndex
CREATE INDEX "DepositEntry_itemId_idx" ON "DepositEntry"("itemId");

-- CreateIndex
CREATE INDEX "DepositEntry_donorId_idx" ON "DepositEntry"("donorId");

-- CreateIndex
CREATE INDEX "DepositEntry_sector_idx" ON "DepositEntry"("sector");

-- CreateIndex
CREATE INDEX "DepositEntry_entryDate_idx" ON "DepositEntry"("entryDate");

-- CreateIndex
CREATE INDEX "DepositEntry_expiryDate_idx" ON "DepositEntry"("expiryDate");

-- CreateIndex
CREATE INDEX "DepositEntry_reversalOfExitId_idx" ON "DepositEntry"("reversalOfExitId");

-- CreateIndex
CREATE INDEX "DepositExit_tenantId_idx" ON "DepositExit"("tenantId");

-- CreateIndex
CREATE INDEX "DepositExit_itemId_idx" ON "DepositExit"("itemId");

-- CreateIndex
CREATE INDEX "DepositExit_sector_idx" ON "DepositExit"("sector");

-- CreateIndex
CREATE INDEX "DepositExit_exitDate_idx" ON "DepositExit"("exitDate");

-- CreateIndex
CREATE INDEX "DepositExit_reversalOfEntryId_idx" ON "DepositExit"("reversalOfEntryId");

-- CreateIndex
CREATE INDEX "DepositExitAllocation_tenantId_idx" ON "DepositExitAllocation"("tenantId");

-- CreateIndex
CREATE INDEX "DepositExitAllocation_exitId_idx" ON "DepositExitAllocation"("exitId");

-- CreateIndex
CREATE INDEX "DepositExitAllocation_entryId_idx" ON "DepositExitAllocation"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositExitAllocation_exitId_entryId_key" ON "DepositExitAllocation"("exitId", "entryId");

-- CreateIndex
CREATE INDEX "DepositItemComment_tenantId_idx" ON "DepositItemComment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositItemComment_itemId_createdAt_idx" ON "DepositItemComment"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositItemComment_authorUserId_idx" ON "DepositItemComment"("authorUserId");

-- CreateIndex
CREATE INDEX "DepositItemAttachment_tenantId_idx" ON "DepositItemAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositItemAttachment_itemId_createdAt_idx" ON "DepositItemAttachment"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositItemAttachment_uploadedByUserId_idx" ON "DepositItemAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "DepositDonorComment_tenantId_idx" ON "DepositDonorComment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositDonorComment_donorId_createdAt_idx" ON "DepositDonorComment"("donorId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositDonorComment_authorUserId_idx" ON "DepositDonorComment"("authorUserId");

-- CreateIndex
CREATE INDEX "DepositDonorAttachment_tenantId_idx" ON "DepositDonorAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositDonorAttachment_donorId_createdAt_idx" ON "DepositDonorAttachment"("donorId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositDonorAttachment_uploadedByUserId_idx" ON "DepositDonorAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "DepositEntryComment_tenantId_idx" ON "DepositEntryComment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositEntryComment_entryId_createdAt_idx" ON "DepositEntryComment"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositEntryComment_authorUserId_idx" ON "DepositEntryComment"("authorUserId");

-- CreateIndex
CREATE INDEX "DepositEntryAttachment_tenantId_idx" ON "DepositEntryAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositEntryAttachment_entryId_createdAt_idx" ON "DepositEntryAttachment"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositEntryAttachment_uploadedByUserId_idx" ON "DepositEntryAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "DepositExitComment_tenantId_idx" ON "DepositExitComment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositExitComment_exitId_createdAt_idx" ON "DepositExitComment"("exitId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositExitComment_authorUserId_idx" ON "DepositExitComment"("authorUserId");

-- CreateIndex
CREATE INDEX "DepositExitAttachment_tenantId_idx" ON "DepositExitAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "DepositExitAttachment_exitId_createdAt_idx" ON "DepositExitAttachment"("exitId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositExitAttachment_uploadedByUserId_idx" ON "DepositExitAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_tenantId_idx" ON "TaskOrganizerTask"("tenantId");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_tenantId_status_idx" ON "TaskOrganizerTask"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_tenantId_priority_idx" ON "TaskOrganizerTask"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_tenantId_kind_idx" ON "TaskOrganizerTask"("tenantId", "kind");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_tenantId_owner_idx" ON "TaskOrganizerTask"("tenantId", "owner");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_ownerUserId_idx" ON "TaskOrganizerTask"("ownerUserId");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_startDate_idx" ON "TaskOrganizerTask"("startDate");

-- CreateIndex
CREATE INDEX "TaskOrganizerTask_dueDate_idx" ON "TaskOrganizerTask"("dueDate");

-- CreateIndex
CREATE INDEX "TaskOrganizerAttachment_tenantId_idx" ON "TaskOrganizerAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "TaskOrganizerAttachment_taskId_createdAt_idx" ON "TaskOrganizerAttachment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskOrganizerAttachment_uploadedByUserId_idx" ON "TaskOrganizerAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "TaskOrganizerChecklistItem_tenantId_idx" ON "TaskOrganizerChecklistItem"("tenantId");

-- CreateIndex
CREATE INDEX "TaskOrganizerChecklistItem_taskId_sortOrder_idx" ON "TaskOrganizerChecklistItem"("taskId", "sortOrder");

-- CreateIndex
CREATE INDEX "TaskOrganizerChecklistItem_ownerUserId_idx" ON "TaskOrganizerChecklistItem"("ownerUserId");

-- CreateIndex
CREATE INDEX "TaskOrganizerSubtask_tenantId_idx" ON "TaskOrganizerSubtask"("tenantId");

-- CreateIndex
CREATE INDEX "TaskOrganizerSubtask_taskId_sortOrder_idx" ON "TaskOrganizerSubtask"("taskId", "sortOrder");

-- CreateIndex
CREATE INDEX "TaskOrganizerSubtask_ownerUserId_idx" ON "TaskOrganizerSubtask"("ownerUserId");

-- CreateIndex
CREATE INDEX "TaskOrganizerComment_tenantId_idx" ON "TaskOrganizerComment"("tenantId");

-- CreateIndex
CREATE INDEX "TaskOrganizerComment_taskId_createdAt_idx" ON "TaskOrganizerComment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskOrganizerComment_authorUserId_idx" ON "TaskOrganizerComment"("authorUserId");

-- CreateIndex
CREATE INDEX "TaskOrganizerTaskDependency_tenantId_idx" ON "TaskOrganizerTaskDependency"("tenantId");

-- CreateIndex
CREATE INDEX "TaskOrganizerTaskDependency_taskId_idx" ON "TaskOrganizerTaskDependency"("taskId");

-- CreateIndex
CREATE INDEX "TaskOrganizerTaskDependency_dependsOnTaskId_idx" ON "TaskOrganizerTaskDependency"("dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskOrganizerTaskDependency_taskId_dependsOnTaskId_key" ON "TaskOrganizerTaskDependency"("taskId", "dependsOnTaskId");

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
ALTER TABLE "Program" ADD CONSTRAINT "Program_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramComment" ADD CONSTRAINT "ProgramComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramComment" ADD CONSTRAINT "ProgramComment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramComment" ADD CONSTRAINT "ProgramComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAttachment" ADD CONSTRAINT "ProgramAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAttachment" ADD CONSTRAINT "ProgramAttachment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAttachment" ADD CONSTRAINT "ProgramAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectComment" ADD CONSTRAINT "ProjectComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectComment" ADD CONSTRAINT "ProjectComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectComment" ADD CONSTRAINT "ProjectComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAttachment" ADD CONSTRAINT "ProjectAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAttachment" ADD CONSTRAINT "ProjectAttachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAttachment" ADD CONSTRAINT "ProjectAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleGroup" ADD CONSTRAINT "PeopleGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleGroupParticipation" ADD CONSTRAINT "PeopleGroupParticipation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleGroupParticipation" ADD CONSTRAINT "PeopleGroupParticipation_peopleGroupId_fkey" FOREIGN KEY ("peopleGroupId") REFERENCES "PeopleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleGroupParticipation" ADD CONSTRAINT "PeopleGroupParticipation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleSegment" ADD CONSTRAINT "PeopleSegment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleSegmentMembership" ADD CONSTRAINT "PeopleSegmentMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleSegmentMembership" ADD CONSTRAINT "PeopleSegmentMembership_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "PeopleSegment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleSegmentMembership" ADD CONSTRAINT "PeopleSegmentMembership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGroup" ADD CONSTRAINT "ProjectGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGroup" ADD CONSTRAINT "ProjectGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPeopleGroup" ADD CONSTRAINT "ProjectPeopleGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPeopleGroup" ADD CONSTRAINT "ProjectPeopleGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPeopleGroup" ADD CONSTRAINT "ProjectPeopleGroup_peopleGroupId_fkey" FOREIGN KEY ("peopleGroupId") REFERENCES "PeopleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollmentGroupMembership" ADD CONSTRAINT "ProjectEnrollmentGroupMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollmentGroupMembership" ADD CONSTRAINT "ProjectEnrollmentGroupMembership_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProjectEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollmentGroupMembership" ADD CONSTRAINT "ProjectEnrollmentGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProjectGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionType" ADD CONSTRAINT "ActionType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAction" ADD CONSTRAINT "ProjectAction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAction" ADD CONSTRAINT "ProjectAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAction" ADD CONSTRAINT "ProjectAction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAction" ADD CONSTRAINT "ProjectAction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProjectGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAction" ADD CONSTRAINT "ProjectAction_targetEnrollmentId_fkey" FOREIGN KEY ("targetEnrollmentId") REFERENCES "ProjectEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAction" ADD CONSTRAINT "ProjectAction_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "ActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionComment" ADD CONSTRAINT "ProjectActionComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionComment" ADD CONSTRAINT "ProjectActionComment_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ProjectAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionComment" ADD CONSTRAINT "ProjectActionComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionAttachment" ADD CONSTRAINT "ProjectActionAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionAttachment" ADD CONSTRAINT "ProjectActionAttachment_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ProjectAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionAttachment" ADD CONSTRAINT "ProjectActionAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPeopleGroup" ADD CONSTRAINT "ActionPeopleGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPeopleGroup" ADD CONSTRAINT "ActionPeopleGroup_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ProjectAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPeopleGroup" ADD CONSTRAINT "ActionPeopleGroup_peopleGroupId_fkey" FOREIGN KEY ("peopleGroupId") REFERENCES "PeopleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionAttendance" ADD CONSTRAINT "ProjectActionAttendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionAttendance" ADD CONSTRAINT "ProjectActionAttendance_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ProjectAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionAttendance" ADD CONSTRAINT "ProjectActionAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProjectEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionPeopleParticipation" ADD CONSTRAINT "ProjectActionPeopleParticipation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionPeopleParticipation" ADD CONSTRAINT "ProjectActionPeopleParticipation_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ProjectAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionPeopleParticipation" ADD CONSTRAINT "ProjectActionPeopleParticipation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActionPeopleParticipation" ADD CONSTRAINT "ProjectActionPeopleParticipation_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProjectEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantrySector" ADD CONSTRAINT "PantrySector_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryDonor" ADD CONSTRAINT "PantryDonor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntry" ADD CONSTRAINT "PantryEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntry" ADD CONSTRAINT "PantryEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PantryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntry" ADD CONSTRAINT "PantryEntry_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "PantryDonor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntry" ADD CONSTRAINT "PantryEntry_reversalOfExitId_fkey" FOREIGN KEY ("reversalOfExitId") REFERENCES "PantryExit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExit" ADD CONSTRAINT "PantryExit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExit" ADD CONSTRAINT "PantryExit_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PantryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExit" ADD CONSTRAINT "PantryExit_reversalOfEntryId_fkey" FOREIGN KEY ("reversalOfEntryId") REFERENCES "PantryEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitAllocation" ADD CONSTRAINT "PantryExitAllocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitAllocation" ADD CONSTRAINT "PantryExitAllocation_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "PantryExit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitAllocation" ADD CONSTRAINT "PantryExitAllocation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "PantryEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemComment" ADD CONSTRAINT "PantryItemComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemComment" ADD CONSTRAINT "PantryItemComment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PantryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemComment" ADD CONSTRAINT "PantryItemComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemAttachment" ADD CONSTRAINT "PantryItemAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemAttachment" ADD CONSTRAINT "PantryItemAttachment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PantryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemAttachment" ADD CONSTRAINT "PantryItemAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryDonorComment" ADD CONSTRAINT "PantryDonorComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryDonorComment" ADD CONSTRAINT "PantryDonorComment_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "PantryDonor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryDonorComment" ADD CONSTRAINT "PantryDonorComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryDonorAttachment" ADD CONSTRAINT "PantryDonorAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryDonorAttachment" ADD CONSTRAINT "PantryDonorAttachment_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "PantryDonor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryDonorAttachment" ADD CONSTRAINT "PantryDonorAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntryComment" ADD CONSTRAINT "PantryEntryComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntryComment" ADD CONSTRAINT "PantryEntryComment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "PantryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntryComment" ADD CONSTRAINT "PantryEntryComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntryAttachment" ADD CONSTRAINT "PantryEntryAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntryAttachment" ADD CONSTRAINT "PantryEntryAttachment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "PantryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryEntryAttachment" ADD CONSTRAINT "PantryEntryAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitComment" ADD CONSTRAINT "PantryExitComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitComment" ADD CONSTRAINT "PantryExitComment_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "PantryExit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitComment" ADD CONSTRAINT "PantryExitComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitAttachment" ADD CONSTRAINT "PantryExitAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitAttachment" ADD CONSTRAINT "PantryExitAttachment_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "PantryExit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryExitAttachment" ADD CONSTRAINT "PantryExitAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositItem" ADD CONSTRAINT "DepositItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositSector" ADD CONSTRAINT "DepositSector_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDonor" ADD CONSTRAINT "DepositDonor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntry" ADD CONSTRAINT "DepositEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntry" ADD CONSTRAINT "DepositEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DepositItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntry" ADD CONSTRAINT "DepositEntry_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "DepositDonor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntry" ADD CONSTRAINT "DepositEntry_reversalOfExitId_fkey" FOREIGN KEY ("reversalOfExitId") REFERENCES "DepositExit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExit" ADD CONSTRAINT "DepositExit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExit" ADD CONSTRAINT "DepositExit_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DepositItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExit" ADD CONSTRAINT "DepositExit_reversalOfEntryId_fkey" FOREIGN KEY ("reversalOfEntryId") REFERENCES "DepositEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitAllocation" ADD CONSTRAINT "DepositExitAllocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitAllocation" ADD CONSTRAINT "DepositExitAllocation_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "DepositExit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitAllocation" ADD CONSTRAINT "DepositExitAllocation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DepositEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositItemComment" ADD CONSTRAINT "DepositItemComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositItemComment" ADD CONSTRAINT "DepositItemComment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DepositItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositItemComment" ADD CONSTRAINT "DepositItemComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositItemAttachment" ADD CONSTRAINT "DepositItemAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositItemAttachment" ADD CONSTRAINT "DepositItemAttachment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DepositItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositItemAttachment" ADD CONSTRAINT "DepositItemAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDonorComment" ADD CONSTRAINT "DepositDonorComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDonorComment" ADD CONSTRAINT "DepositDonorComment_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "DepositDonor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDonorComment" ADD CONSTRAINT "DepositDonorComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDonorAttachment" ADD CONSTRAINT "DepositDonorAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDonorAttachment" ADD CONSTRAINT "DepositDonorAttachment_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "DepositDonor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDonorAttachment" ADD CONSTRAINT "DepositDonorAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntryComment" ADD CONSTRAINT "DepositEntryComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntryComment" ADD CONSTRAINT "DepositEntryComment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DepositEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntryComment" ADD CONSTRAINT "DepositEntryComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntryAttachment" ADD CONSTRAINT "DepositEntryAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntryAttachment" ADD CONSTRAINT "DepositEntryAttachment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DepositEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEntryAttachment" ADD CONSTRAINT "DepositEntryAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitComment" ADD CONSTRAINT "DepositExitComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitComment" ADD CONSTRAINT "DepositExitComment_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "DepositExit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitComment" ADD CONSTRAINT "DepositExitComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitAttachment" ADD CONSTRAINT "DepositExitAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitAttachment" ADD CONSTRAINT "DepositExitAttachment_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "DepositExit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositExitAttachment" ADD CONSTRAINT "DepositExitAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerTask" ADD CONSTRAINT "TaskOrganizerTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerTask" ADD CONSTRAINT "TaskOrganizerTask_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerAttachment" ADD CONSTRAINT "TaskOrganizerAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerAttachment" ADD CONSTRAINT "TaskOrganizerAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskOrganizerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerAttachment" ADD CONSTRAINT "TaskOrganizerAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerChecklistItem" ADD CONSTRAINT "TaskOrganizerChecklistItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerChecklistItem" ADD CONSTRAINT "TaskOrganizerChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskOrganizerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerChecklistItem" ADD CONSTRAINT "TaskOrganizerChecklistItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerSubtask" ADD CONSTRAINT "TaskOrganizerSubtask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerSubtask" ADD CONSTRAINT "TaskOrganizerSubtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskOrganizerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerSubtask" ADD CONSTRAINT "TaskOrganizerSubtask_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerComment" ADD CONSTRAINT "TaskOrganizerComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerComment" ADD CONSTRAINT "TaskOrganizerComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskOrganizerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerComment" ADD CONSTRAINT "TaskOrganizerComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerTaskDependency" ADD CONSTRAINT "TaskOrganizerTaskDependency_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerTaskDependency" ADD CONSTRAINT "TaskOrganizerTaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskOrganizerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrganizerTaskDependency" ADD CONSTRAINT "TaskOrganizerTaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "TaskOrganizerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

