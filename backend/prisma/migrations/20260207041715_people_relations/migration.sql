-- AlterTable
ALTER TABLE `Person` MODIFY `sex` VARCHAR(191) NULL,
    MODIFY `raceColor` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Household` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Household_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HouseholdMember` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `householdId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `role` VARCHAR(191) NULL,
    `isLegalGuardian` BOOLEAN NOT NULL DEFAULT false,
    `isIncomeContributor` BOOLEAN NOT NULL DEFAULT false,
    `isProvider` BOOLEAN NOT NULL DEFAULT false,
    `isDependent` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HouseholdMember_tenantId_idx`(`tenantId`),
    INDEX `HouseholdMember_householdId_idx`(`householdId`),
    INDEX `HouseholdMember_personId_idx`(`personId`),
    UNIQUE INDEX `HouseholdMember_householdId_personId_key`(`householdId`, `personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PersonRelation` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `relatedPersonId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `livesTogether` BOOLEAN NOT NULL DEFAULT false,
    `isLegalGuardian` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonRelation_tenantId_idx`(`tenantId`),
    INDEX `PersonRelation_personId_idx`(`personId`),
    INDEX `PersonRelation_relatedPersonId_idx`(`relatedPersonId`),
    UNIQUE INDEX `PersonRelation_tenantId_personId_relatedPersonId_type_key`(`tenantId`, `personId`, `relatedPersonId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Household` ADD CONSTRAINT `Household_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HouseholdMember` ADD CONSTRAINT `HouseholdMember_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HouseholdMember` ADD CONSTRAINT `HouseholdMember_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HouseholdMember` ADD CONSTRAINT `HouseholdMember_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonRelation` ADD CONSTRAINT `PersonRelation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonRelation` ADD CONSTRAINT `PersonRelation_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonRelation` ADD CONSTRAINT `PersonRelation_relatedPersonId_fkey` FOREIGN KEY (`relatedPersonId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
