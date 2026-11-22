-- CreateTable
CREATE TABLE "ProjectTeamParticipation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "projectId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "role" "ActionPeopleParticipationRole" NOT NULL DEFAULT 'PARTICIPANTE',
    "activeKey" VARCHAR(120),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTeamParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingTeamParticipation" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "meetingId" CHAR(36) NOT NULL,
    "personId" CHAR(36) NOT NULL,
    "role" "ActionPeopleParticipationRole" NOT NULL DEFAULT 'PARTICIPANTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingTeamParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectTeamParticipation_tenantId_idx" ON "ProjectTeamParticipation"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectTeamParticipation_projectId_idx" ON "ProjectTeamParticipation"("projectId");

-- CreateIndex
CREATE INDEX "ProjectTeamParticipation_personId_idx" ON "ProjectTeamParticipation"("personId");

-- CreateIndex
CREATE INDEX "ProjectTeamParticipation_role_idx" ON "ProjectTeamParticipation"("role");

-- CreateIndex
CREATE INDEX "ProjectTeamParticipation_isActive_idx" ON "ProjectTeamParticipation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTeamParticipation_tenantId_activeKey_key" ON "ProjectTeamParticipation"("tenantId", "activeKey");

-- CreateIndex
CREATE INDEX "MeetingTeamParticipation_tenantId_idx" ON "MeetingTeamParticipation"("tenantId");

-- CreateIndex
CREATE INDEX "MeetingTeamParticipation_meetingId_idx" ON "MeetingTeamParticipation"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingTeamParticipation_personId_idx" ON "MeetingTeamParticipation"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingTeamParticipation_meetingId_personId_role_key" ON "MeetingTeamParticipation"("meetingId", "personId", "role");

-- AddForeignKey
ALTER TABLE "ProjectTeamParticipation" ADD CONSTRAINT "ProjectTeamParticipation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeamParticipation" ADD CONSTRAINT "ProjectTeamParticipation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeamParticipation" ADD CONSTRAINT "ProjectTeamParticipation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTeamParticipation" ADD CONSTRAINT "MeetingTeamParticipation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTeamParticipation" ADD CONSTRAINT "MeetingTeamParticipation_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "ActionOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTeamParticipation" ADD CONSTRAINT "MeetingTeamParticipation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
