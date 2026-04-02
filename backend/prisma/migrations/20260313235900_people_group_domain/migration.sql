-- DropForeignKey
ALTER TABLE `ProjectAction` DROP FOREIGN KEY `ProjectAction_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectActionAttendance` DROP FOREIGN KEY `ProjectActionAttendance_cycleParticipationId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectCycle` DROP FOREIGN KEY `ProjectCycle_segmentId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` DROP FOREIGN KEY `PECP_cycle_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` DROP FOREIGN KEY `PECP_enrollment_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` DROP FOREIGN KEY `PECP_tenant_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` DROP FOREIGN KEY `PEGM_enrollment_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` DROP FOREIGN KEY `PEGM_group_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` DROP FOREIGN KEY `PEGM_tenant_fkey`;

-- DropIndex
DROP INDEX `ProjectActionAttendance_isHighlight_idx` ON `ProjectActionAttendance`;

-- AlterTable
ALTER TABLE `Program` MODIFY `internalNotes` TEXT NULL;

-- AlterTable
ALTER TABLE `ProjectActionPeopleParticipation` ADD COLUMN `participationKind` ENUM('PARTICIPANT', 'TEAM') NOT NULL DEFAULT 'TEAM';

-- AlterTable
ALTER TABLE `ProjectEnrollment` ADD COLUMN `participationKind` ENUM('PARTICIPANT', 'TEAM') NOT NULL DEFAULT 'PARTICIPANT',
    MODIFY `role` ENUM('PUBLICO_ATENDIDO', 'FAMILIAR', 'VOLUNTARIO', 'EQUIPE_TECNICA', 'FUNCIONARIO', 'OFICINEIRO', 'PARCEIRO', 'DOADOR', 'PATROCINADOR') NOT NULL DEFAULT 'PUBLICO_ATENDIDO';

-- DropTable
DROP TABLE `_ActionPeopleParticipationRole`;

-- CreateTable
CREATE TABLE `PeopleGroup` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `groupType` ENUM('CYCLE', 'SEGMENT', 'TEAM_POOL', 'NETWORK', 'OTHER') NOT NULL DEFAULT 'SEGMENT',
    `category` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `ageMin` INTEGER NULL,
    `ageMax` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PeopleGroup_tenantId_idx`(`tenantId`),
    INDEX `PeopleGroup_name_idx`(`name`),
    INDEX `PeopleGroup_groupType_idx`(`groupType`),
    INDEX `PeopleGroup_category_idx`(`category`),
    INDEX `PeopleGroup_isActive_idx`(`isActive`),
    UNIQUE INDEX `PeopleGroup_tenantId_name_key`(`tenantId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeopleGroupParticipation` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `peopleGroupId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `activeKey` VARCHAR(80) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endsAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PeopleGroupParticipation_tenantId_idx`(`tenantId`),
    INDEX `PeopleGroupParticipation_peopleGroupId_idx`(`peopleGroupId`),
    INDEX `PeopleGroupParticipation_personId_idx`(`personId`),
    INDEX `PeopleGroupParticipation_activeKey_idx`(`activeKey`),
    INDEX `PeopleGroupParticipation_isActive_idx`(`isActive`),
    UNIQUE INDEX `PeopleGroupParticipation_tenantId_activeKey_key`(`tenantId`, `activeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectPeopleGroup` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `peopleGroupId` CHAR(36) NOT NULL,
    `participationKind` ENUM('PARTICIPANT', 'TEAM') NOT NULL DEFAULT 'PARTICIPANT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectPeopleGroup_tenantId_idx`(`tenantId`),
    INDEX `ProjectPeopleGroup_projectId_idx`(`projectId`),
    INDEX `ProjectPeopleGroup_peopleGroupId_idx`(`peopleGroupId`),
    INDEX `ProjectPeopleGroup_participationKind_idx`(`participationKind`),
    UNIQUE INDEX `ProjectPeopleGroup_tenantId_projectId_peopleGroupId_particip_key`(`tenantId`, `projectId`, `peopleGroupId`, `participationKind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionPeopleGroup` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `actionId` CHAR(36) NOT NULL,
    `peopleGroupId` CHAR(36) NOT NULL,
    `participationKind` ENUM('PARTICIPANT', 'TEAM') NOT NULL DEFAULT 'PARTICIPANT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ActionPeopleGroup_tenantId_idx`(`tenantId`),
    INDEX `ActionPeopleGroup_actionId_idx`(`actionId`),
    INDEX `ActionPeopleGroup_peopleGroupId_idx`(`peopleGroupId`),
    INDEX `ActionPeopleGroup_participationKind_idx`(`participationKind`),
    UNIQUE INDEX `ActionPeopleGroup_tenantId_actionId_peopleGroupId_participat_key`(`tenantId`, `actionId`, `peopleGroupId`, `participationKind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ProjectActionPeopleParticipation_participationKind_idx` ON `ProjectActionPeopleParticipation`(`participationKind`);

-- CreateIndex
CREATE INDEX `ProjectEnrollment_participationKind_idx` ON `ProjectEnrollment`(`participationKind`);

-- AddForeignKey
ALTER TABLE `PeopleGroup` ADD CONSTRAINT `PeopleGroup_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeopleGroupParticipation` ADD CONSTRAINT `PeopleGroupParticipation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeopleGroupParticipation` ADD CONSTRAINT `PeopleGroupParticipation_peopleGroupId_fkey` FOREIGN KEY (`peopleGroupId`) REFERENCES `PeopleGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeopleGroupParticipation` ADD CONSTRAINT `PeopleGroupParticipation_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPeopleGroup` ADD CONSTRAINT `ProjectPeopleGroup_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPeopleGroup` ADD CONSTRAINT `ProjectPeopleGroup_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPeopleGroup` ADD CONSTRAINT `ProjectPeopleGroup_peopleGroupId_fkey` FOREIGN KEY (`peopleGroupId`) REFERENCES `PeopleGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectCycle` ADD CONSTRAINT `ProjectCycle_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `PeopleSegment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` ADD CONSTRAINT `ProjectEnrollmentGroupMembership_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` ADD CONSTRAINT `ProjectEnrollmentGroupMembership_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `ProjectEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentGroupMembership` ADD CONSTRAINT `ProjectEnrollmentGroupMembership_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `ProjectGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` ADD CONSTRAINT `ProjectEnrollmentCycleParticipation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` ADD CONSTRAINT `ProjectEnrollmentCycleParticipation_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `ProjectEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` ADD CONSTRAINT `ProjectEnrollmentCycleParticipation_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `ProjectCycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectAction` ADD CONSTRAINT `ProjectAction_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `ProjectCycle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionPeopleGroup` ADD CONSTRAINT `ActionPeopleGroup_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionPeopleGroup` ADD CONSTRAINT `ActionPeopleGroup_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `ProjectAction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionPeopleGroup` ADD CONSTRAINT `ActionPeopleGroup_peopleGroupId_fkey` FOREIGN KEY (`peopleGroupId`) REFERENCES `PeopleGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectActionAttendance` ADD CONSTRAINT `ProjectActionAttendance_cycleParticipationId_fkey` FOREIGN KEY (`cycleParticipationId`) REFERENCES `ProjectEnrollmentCycleParticipation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentCycleParticipation` RENAME INDEX `PECP_activeKey_idx` TO `ProjectEnrollmentCycleParticipation_activeKey_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentCycleParticipation` RENAME INDEX `PECP_active_idx` TO `ProjectEnrollmentCycleParticipation_isActive_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentCycleParticipation` RENAME INDEX `PECP_cycle_idx` TO `ProjectEnrollmentCycleParticipation_cycleId_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentCycleParticipation` RENAME INDEX `PECP_enrollment_idx` TO `ProjectEnrollmentCycleParticipation_enrollmentId_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentCycleParticipation` RENAME INDEX `PECP_tenant_activeKey_key` TO `ProjectEnrollmentCycleParticipation_tenantId_activeKey_key`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentCycleParticipation` RENAME INDEX `PECP_tenant_idx` TO `ProjectEnrollmentCycleParticipation_tenantId_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentGroupMembership` RENAME INDEX `PEGM_activeKey_idx` TO `ProjectEnrollmentGroupMembership_activeKey_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentGroupMembership` RENAME INDEX `PEGM_active_idx` TO `ProjectEnrollmentGroupMembership_isActive_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentGroupMembership` RENAME INDEX `PEGM_enrollment_idx` TO `ProjectEnrollmentGroupMembership_enrollmentId_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentGroupMembership` RENAME INDEX `PEGM_group_idx` TO `ProjectEnrollmentGroupMembership_groupId_idx`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentGroupMembership` RENAME INDEX `PEGM_tenant_activeKey_key` TO `ProjectEnrollmentGroupMembership_tenantId_activeKey_key`;

-- RenameIndex
ALTER TABLE `ProjectEnrollmentGroupMembership` RENAME INDEX `PEGM_tenant_idx` TO `ProjectEnrollmentGroupMembership_tenantId_idx`;
