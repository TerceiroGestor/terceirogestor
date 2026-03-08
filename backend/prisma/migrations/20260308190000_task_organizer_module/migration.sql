-- CreateTable
CREATE TABLE `TaskOrganizerTask` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `description` TEXT NULL,
    `status` ENUM('BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED') NOT NULL DEFAULT 'BACKLOG',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `kind` ENUM('FEATURE', 'BUG', 'ROUTINE') NOT NULL DEFAULT 'FEATURE',
    `owner` VARCHAR(191) NULL,
    `ownerUserId` CHAR(36) NULL,
    `team` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `effortPoints` INTEGER NULL,
    `tags` JSON NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TaskOrganizerTask_tenantId_idx`(`tenantId`),
    INDEX `TaskOrganizerTask_tenantId_status_idx`(`tenantId`, `status`),
    INDEX `TaskOrganizerTask_tenantId_priority_idx`(`tenantId`, `priority`),
    INDEX `TaskOrganizerTask_tenantId_kind_idx`(`tenantId`, `kind`),
    INDEX `TaskOrganizerTask_tenantId_owner_idx`(`tenantId`, `owner`),
    INDEX `TaskOrganizerTask_ownerUserId_idx`(`ownerUserId`),
    INDEX `TaskOrganizerTask_startDate_idx`(`startDate`),
    INDEX `TaskOrganizerTask_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskOrganizerChecklistItem` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT false,
    `owner` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TaskOrganizerChecklistItem_tenantId_idx`(`tenantId`),
    INDEX `TaskOrganizerChecklistItem_taskId_sortOrder_idx`(`taskId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskOrganizerSubtask` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED') NOT NULL DEFAULT 'BACKLOG',
    `owner` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TaskOrganizerSubtask_tenantId_idx`(`tenantId`),
    INDEX `TaskOrganizerSubtask_taskId_sortOrder_idx`(`taskId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TaskOrganizerTask` ADD CONSTRAINT `TaskOrganizerTask_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskOrganizerTask` ADD CONSTRAINT `TaskOrganizerTask_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskOrganizerChecklistItem` ADD CONSTRAINT `TaskOrganizerChecklistItem_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskOrganizerChecklistItem` ADD CONSTRAINT `TaskOrganizerChecklistItem_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `TaskOrganizerTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskOrganizerSubtask` ADD CONSTRAINT `TaskOrganizerSubtask_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskOrganizerSubtask` ADD CONSTRAINT `TaskOrganizerSubtask_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `TaskOrganizerTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
