-- CreateTable
CREATE TABLE `HouseholdProfile` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `householdId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NULL,
    `condition` VARCHAR(191) NULL,
    `ownership` VARCHAR(191) NULL,
    `areaM2` DOUBLE NULL,
    `rooms` INTEGER NULL,
    `bathrooms` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HouseholdProfile_householdId_key`(`householdId`),
    INDEX `HouseholdProfile_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PersonIncome` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `frequency` ENUM('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL', 'ONCE') NOT NULL DEFAULT 'MONTHLY',
    `isHouseholdContribution` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonIncome_tenantId_idx`(`tenantId`),
    INDEX `PersonIncome_personId_idx`(`personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HouseholdProfile` ADD CONSTRAINT `HouseholdProfile_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HouseholdProfile` ADD CONSTRAINT `HouseholdProfile_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonIncome` ADD CONSTRAINT `PersonIncome_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonIncome` ADD CONSTRAINT `PersonIncome_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
