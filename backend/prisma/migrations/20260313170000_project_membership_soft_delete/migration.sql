ALTER TABLE `ProjectEnrollment`
    ADD COLUMN `deletedAt` DATETIME(3) NULL;

ALTER TABLE `ProjectEnrollmentGroupMembership`
    ADD COLUMN `deletedAt` DATETIME(3) NULL;

ALTER TABLE `ProjectEnrollmentCycleParticipation`
    ADD COLUMN `deletedAt` DATETIME(3) NULL;
