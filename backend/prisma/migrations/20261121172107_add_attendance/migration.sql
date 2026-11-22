-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('SOCIAL', 'PSICOLOGICO');

-- CreateEnum
CREATE TYPE "AttendanceCaseStatus" AS ENUM ('ABERTO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "AttendancePersonRole" AS ENUM ('ATENDIDO_PRINCIPAL', 'ATENDIDO_SECUNDARIO', 'FAMILIAR');

-- CreateTable
CREATE TABLE "Attendance" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "occurrenceId" CHAR(36),
    "type" "AttendanceType" NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "professionalId" CHAR(36) NOT NULL,
    "status" "AttendanceCaseStatus" NOT NULL DEFAULT 'ABERTO',
    "notes" TEXT,
    "closingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendancePeople" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "attendanceId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "role" "AttendancePersonRole" NOT NULL DEFAULT 'ATENDIDO_PRINCIPAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendancePeople_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceEvolution" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "attendanceId" CHAR(36) NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceBenefit" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "attendanceId" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_tenantId_idx" ON "Attendance"("tenantId");

-- CreateIndex
CREATE INDEX "Attendance_occurrenceId_idx" ON "Attendance"("occurrenceId");

-- CreateIndex
CREATE INDEX "Attendance_professionalId_idx" ON "Attendance"("professionalId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_type_idx" ON "Attendance"("type");

-- CreateIndex
CREATE INDEX "AttendancePeople_tenantId_idx" ON "AttendancePeople"("tenantId");

-- CreateIndex
CREATE INDEX "AttendancePeople_attendanceId_idx" ON "AttendancePeople"("attendanceId");

-- CreateIndex
CREATE INDEX "AttendancePeople_personId_idx" ON "AttendancePeople"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendancePeople_attendanceId_personId_role_key" ON "AttendancePeople"("attendanceId", "personId", "role");

-- CreateIndex
CREATE INDEX "AttendanceEvolution_tenantId_idx" ON "AttendanceEvolution"("tenantId");

-- CreateIndex
CREATE INDEX "AttendanceEvolution_attendanceId_idx" ON "AttendanceEvolution"("attendanceId");

-- CreateIndex
CREATE INDEX "AttendanceBenefit_tenantId_idx" ON "AttendanceBenefit"("tenantId");

-- CreateIndex
CREATE INDEX "AttendanceBenefit_attendanceId_idx" ON "AttendanceBenefit"("attendanceId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendancePeople" ADD CONSTRAINT "AttendancePeople_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendancePeople" ADD CONSTRAINT "AttendancePeople_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendancePeople" ADD CONSTRAINT "AttendancePeople_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEvolution" ADD CONSTRAINT "AttendanceEvolution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEvolution" ADD CONSTRAINT "AttendanceEvolution_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceBenefit" ADD CONSTRAINT "AttendanceBenefit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceBenefit" ADD CONSTRAINT "AttendanceBenefit_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
