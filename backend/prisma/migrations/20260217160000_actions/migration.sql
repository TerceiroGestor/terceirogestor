-- CreateTable
CREATE TABLE `ActionType` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ActionType_tenantId_name_key`(`tenantId`, `name`),
    INDEX `ActionType_tenantId_idx`(`tenantId`),
    INDEX `ActionType_name_idx`(`name`),
    INDEX `ActionType_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectAction` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `cycleId` CHAR(36) NULL,
    `actionTypeId` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PLANNED', 'EXECUTED', 'CANCELED') NOT NULL DEFAULT 'PLANNED',
    `plannedStartAt` DATETIME(3) NULL,
    `plannedEndAt` DATETIME(3) NULL,
    `executedStartAt` DATETIME(3) NULL,
    `executedEndAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectAction_tenantId_idx`(`tenantId`),
    INDEX `ProjectAction_projectId_idx`(`projectId`),
    INDEX `ProjectAction_cycleId_idx`(`cycleId`),
    INDEX `ProjectAction_actionTypeId_idx`(`actionTypeId`),
    INDEX `ProjectAction_status_idx`(`status`),
    INDEX `ProjectAction_plannedStartAt_idx`(`plannedStartAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectActionAttendance` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `actionId` CHAR(36) NOT NULL,
    `enrollmentId` CHAR(36) NOT NULL,
    `cycleParticipationId` CHAR(36) NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'PRESENT',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectActionAttendance_tenantId_actionId_enrollmentId_key`(`tenantId`, `actionId`, `enrollmentId`),
    INDEX `ProjectActionAttendance_tenantId_idx`(`tenantId`),
    INDEX `ProjectActionAttendance_actionId_idx`(`actionId`),
    INDEX `ProjectActionAttendance_enrollmentId_idx`(`enrollmentId`),
    INDEX `ProjectActionAttendance_cycleParticipationId_idx`(`cycleParticipationId`),
    INDEX `ProjectActionAttendance_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActionType` ADD CONSTRAINT `ActionType_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectAction` ADD CONSTRAINT `ProjectAction_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectAction` ADD CONSTRAINT `ProjectAction_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectAction` ADD CONSTRAINT `ProjectAction_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `ProjectCycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectAction` ADD CONSTRAINT `ProjectAction_actionTypeId_fkey` FOREIGN KEY (`actionTypeId`) REFERENCES `ActionType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectActionAttendance` ADD CONSTRAINT `ProjectActionAttendance_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectActionAttendance` ADD CONSTRAINT `ProjectActionAttendance_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `ProjectAction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectActionAttendance` ADD CONSTRAINT `ProjectActionAttendance_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `ProjectEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectActionAttendance` ADD CONSTRAINT `ProjectActionAttendance_cycleParticipationId_fkey` FOREIGN KEY (`cycleParticipationId`) REFERENCES `ProjectEnrollmentCycleParticipation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
