-- CreateTable
CREATE TABLE `Program` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('SCFV', 'PAIF', 'PAEFI', 'CULTURAL', 'QUALIFICATION', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PLANNED', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'PLANNED',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Program_tenantId_idx`(`tenantId`),
    INDEX `Program_name_idx`(`name`),
    INDEX `Program_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Program` ADD CONSTRAINT `Program_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

