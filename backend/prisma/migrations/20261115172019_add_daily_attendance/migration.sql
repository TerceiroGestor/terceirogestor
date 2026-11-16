-- CreateTable
CREATE TABLE "DailyAttendance" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyAttendance_tenantId_idx" ON "DailyAttendance"("tenantId");

-- CreateIndex
CREATE INDEX "DailyAttendance_personId_idx" ON "DailyAttendance"("personId");

-- CreateIndex
CREATE INDEX "DailyAttendance_tenantId_date_idx" ON "DailyAttendance"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttendance_tenantId_personId_date_key" ON "DailyAttendance"("tenantId", "personId", "date");

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
