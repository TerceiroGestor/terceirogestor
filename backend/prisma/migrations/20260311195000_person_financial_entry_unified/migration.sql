CREATE TABLE `PersonFinancialEntry` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `householdId` CHAR(36) NULL,
  `fromHouseholdId` CHAR(36) NULL,
  `toHouseholdId` CHAR(36) NULL,
  `entryType` ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'BENEFIT') NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `subcategory` VARCHAR(191) NULL,
  `status` VARCHAR(191) NULL,
  `amount` DECIMAL(10, 2) NULL,
  `frequency` ENUM('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL', 'ONCE') NOT NULL DEFAULT 'MONTHLY',
  `contractType` VARCHAR(191) NULL,
  `includeInHouseholdBudget` BOOLEAN NOT NULL DEFAULT true,
  `startDate` DATETIME(3) NULL,
  `endDate` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `PersonFinancialEntry_tenantId_idx`(`tenantId`),
  INDEX `PersonFinancialEntry_personId_idx`(`personId`),
  INDEX `PersonFinancialEntry_householdId_idx`(`householdId`),
  INDEX `PersonFinancialEntry_fromHouseholdId_idx`(`fromHouseholdId`),
  INDEX `PersonFinancialEntry_toHouseholdId_idx`(`toHouseholdId`),
  INDEX `PersonFinancialEntry_entryType_idx`(`entryType`),
  INDEX `PersonFinancialEntry_tenantId_personId_entryType_idx`(`tenantId`, `personId`, `entryType`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PersonFinancialEntry`
  ADD CONSTRAINT `PersonFinancialEntry_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `PersonFinancialEntry_personId_fkey`
    FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `PersonFinancialEntry_householdId_fkey`
    FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `PersonFinancialEntry_fromHouseholdId_fkey`
    FOREIGN KEY (`fromHouseholdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `PersonFinancialEntry_toHouseholdId_fkey`
    FOREIGN KEY (`toHouseholdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
