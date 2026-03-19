CREATE TABLE `Cycle` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `audienceType` VARCHAR(191) NULL,
    `ageMin` INTEGER NULL,
    `ageMax` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Cycle_tenantId_idx`(`tenantId`),
    INDEX `Cycle_name_idx`(`name`),
    INDEX `Cycle_isActive_idx`(`isActive`),
    UNIQUE INDEX `Cycle_tenantId_name_key`(`tenantId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Cycle`
    ADD CONSTRAINT `Cycle_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
