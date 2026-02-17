-- CreateTable
CREATE TABLE `ProjectGroup` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectGroup_tenantId_projectId_name_key`(`tenantId`, `projectId`, `name`),
    INDEX `ProjectGroup_tenantId_idx`(`tenantId`),
    INDEX `ProjectGroup_projectId_idx`(`projectId`),
    INDEX `ProjectGroup_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectCycle` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectCycle_tenantId_projectId_name_key`(`tenantId`, `projectId`, `name`),
    INDEX `ProjectCycle_tenantId_idx`(`tenantId`),
    INDEX `ProjectCycle_projectId_idx`(`projectId`),
    INDEX `ProjectCycle_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectEnrollment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `groupId` CHAR(36) NULL,
    `cycleId` CHAR(36) NULL,
    `status` ENUM('ACTIVE', 'ENDED') NOT NULL DEFAULT 'ACTIVE',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectEnrollment_tenantId_idx`(`tenantId`),
    INDEX `ProjectEnrollment_projectId_idx`(`projectId`),
    INDEX `ProjectEnrollment_personId_idx`(`personId`),
    INDEX `ProjectEnrollment_groupId_idx`(`groupId`),
    INDEX `ProjectEnrollment_cycleId_idx`(`cycleId`),
    INDEX `ProjectEnrollment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectGroup` ADD CONSTRAINT `ProjectGroup_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectGroup` ADD CONSTRAINT `ProjectGroup_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectCycle` ADD CONSTRAINT `ProjectCycle_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectCycle` ADD CONSTRAINT `ProjectCycle_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollment` ADD CONSTRAINT `ProjectEnrollment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollment` ADD CONSTRAINT `ProjectEnrollment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollment` ADD CONSTRAINT `ProjectEnrollment_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollment` ADD CONSTRAINT `ProjectEnrollment_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `ProjectGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectEnrollment` ADD CONSTRAINT `ProjectEnrollment_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `ProjectCycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

