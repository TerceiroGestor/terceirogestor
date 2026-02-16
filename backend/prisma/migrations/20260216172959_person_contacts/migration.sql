-- CreateTable
CREATE TABLE `PersonContact` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `role` ENUM('SELF', 'RESPONSIBLE', 'EMERGENCY') NOT NULL DEFAULT 'SELF',
    `type` ENUM('EMAIL', 'PHONE') NOT NULL,
    `label` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `relationship` VARCHAR(191) NULL,
    `value` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `isWhatsapp` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonContact_tenantId_idx`(`tenantId`),
    INDEX `PersonContact_personId_idx`(`personId`),
    INDEX `PersonContact_tenantId_personId_type_idx`(`tenantId`, `personId`, `type`),
    UNIQUE INDEX `PersonContact_tenantId_personId_type_value_key`(`tenantId`, `personId`, `type`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PersonContact` ADD CONSTRAINT `PersonContact_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonContact` ADD CONSTRAINT `PersonContact_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
