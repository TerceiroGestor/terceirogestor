-- CreateTable
CREATE TABLE `PersonEducation` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NULL,
    `institution` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NULL,
    `schoolYear` VARCHAR(191) NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonEducation_tenantId_idx`(`tenantId`),
    INDEX `PersonEducation_personId_idx`(`personId`),
    INDEX `PersonEducation_tenantId_personId_idx`(`tenantId`, `personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PersonEducation` ADD CONSTRAINT `PersonEducation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonEducation` ADD CONSTRAINT `PersonEducation_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

