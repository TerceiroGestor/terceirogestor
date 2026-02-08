-- CreateTable
CREATE TABLE `PersonHealthCondition` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `severity` VARCHAR(191) NULL,
    `diagnosisDate` DATETIME(3) NULL,
    `documentUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonHealthCondition_tenantId_idx`(`tenantId`),
    INDEX `PersonHealthCondition_personId_idx`(`personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PersonMedication` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `medication` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NULL,
    `schedule` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `prescribingDoctor` VARCHAR(191) NULL,
    `permissionDocumentUrl` VARCHAR(191) NULL,
    `documentUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonMedication_tenantId_idx`(`tenantId`),
    INDEX `PersonMedication_personId_idx`(`personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PersonHealthCondition` ADD CONSTRAINT `PersonHealthCondition_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonHealthCondition` ADD CONSTRAINT `PersonHealthCondition_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonMedication` ADD CONSTRAINT `PersonMedication_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonMedication` ADD CONSTRAINT `PersonMedication_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
