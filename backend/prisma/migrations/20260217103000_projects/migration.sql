-- CreateTable
CREATE TABLE `Project` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `programId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PLANNED', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'PLANNED',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_tenantId_idx`(`tenantId`),
    INDEX `Project_programId_idx`(`programId`),
    INDEX `Project_name_idx`(`name`),
    INDEX `Project_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

