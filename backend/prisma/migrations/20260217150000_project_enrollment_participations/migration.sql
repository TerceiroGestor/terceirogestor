-- CreateTable
CREATE TABLE `ProjectEnrollmentGroupMembership` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `enrollmentId` CHAR(36) NOT NULL,
    `groupId` CHAR(36) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PEGM_tenant_enroll_group_active_key`(`tenantId`, `enrollmentId`, `groupId`, `isActive`),
    INDEX `PEGM_tenant_idx`(`tenantId`),
    INDEX `PEGM_enrollment_idx`(`enrollmentId`),
    INDEX `PEGM_group_idx`(`groupId`),
    INDEX `PEGM_active_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectEnrollmentCycleParticipation` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `enrollmentId` CHAR(36) NOT NULL,
    `cycleId` CHAR(36) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PECP_tenant_enroll_active_key`(`tenantId`, `enrollmentId`, `isActive`),
    INDEX `PECP_tenant_idx`(`tenantId`),
    INDEX `PECP_enrollment_idx`(`enrollmentId`),
    INDEX `PECP_cycle_idx`(`cycleId`),
    INDEX `PECP_active_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` ADD CONSTRAINT `PEGM_tenant_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` ADD CONSTRAINT `PEGM_enrollment_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `ProjectEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` ADD CONSTRAINT `PEGM_group_fkey` FOREIGN KEY (`groupId`) REFERENCES `ProjectGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` ADD CONSTRAINT `PECP_tenant_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` ADD CONSTRAINT `PECP_enrollment_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `ProjectEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` ADD CONSTRAINT `PECP_cycle_fkey` FOREIGN KEY (`cycleId`) REFERENCES `ProjectCycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill from legacy columns (ProjectEnrollment.groupId / ProjectEnrollment.cycleId)
INSERT INTO `ProjectEnrollmentGroupMembership` (
  `id`,
  `tenantId`,
  `enrollmentId`,
  `groupId`,
  `isActive`,
  `startsAt`,
  `endsAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  `tenantId`,
  `id` as `enrollmentId`,
  `groupId`,
  true,
  COALESCE(`startsAt`, `createdAt`),
  NULL,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `ProjectEnrollment`
WHERE `groupId` IS NOT NULL;

INSERT INTO `ProjectEnrollmentCycleParticipation` (
  `id`,
  `tenantId`,
  `enrollmentId`,
  `cycleId`,
  `isActive`,
  `startsAt`,
  `endsAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  `tenantId`,
  `id` as `enrollmentId`,
  `cycleId`,
  true,
  COALESCE(`startsAt`, `createdAt`),
  NULL,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `ProjectEnrollment`
WHERE `cycleId` IS NOT NULL;

-- Drop legacy FKs / indexes / columns
ALTER TABLE `ProjectEnrollment` DROP FOREIGN KEY `ProjectEnrollment_groupId_fkey`;
ALTER TABLE `ProjectEnrollment` DROP FOREIGN KEY `ProjectEnrollment_cycleId_fkey`;

DROP INDEX `ProjectEnrollment_groupId_idx` ON `ProjectEnrollment`;
DROP INDEX `ProjectEnrollment_cycleId_idx` ON `ProjectEnrollment`;

ALTER TABLE `ProjectEnrollment` DROP COLUMN `groupId`;
ALTER TABLE `ProjectEnrollment` DROP COLUMN `cycleId`;
