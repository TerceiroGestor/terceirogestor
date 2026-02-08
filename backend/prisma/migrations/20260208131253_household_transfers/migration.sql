ALTER TABLE `PersonIncome` ADD COLUMN `contractType` VARCHAR(191) NULL;

CREATE TABLE `HouseholdTransfer` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `fromHouseholdId` CHAR(36) NOT NULL,
  `toHouseholdId` CHAR(36) NOT NULL,
  `type` ENUM('PENSION','TRANSFER') NOT NULL DEFAULT 'PENSION',
  `amount` DECIMAL(10,2) NOT NULL,
  `frequency` ENUM('MONTHLY','WEEKLY','BIWEEKLY','ANNUAL','ONCE') NOT NULL DEFAULT 'MONTHLY',
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `HouseholdTransfer_tenantId_idx` ON `HouseholdTransfer`(`tenantId`);
CREATE INDEX `HouseholdTransfer_personId_idx` ON `HouseholdTransfer`(`personId`);
CREATE INDEX `HouseholdTransfer_fromHouseholdId_idx` ON `HouseholdTransfer`(`fromHouseholdId`);
CREATE INDEX `HouseholdTransfer_toHouseholdId_idx` ON `HouseholdTransfer`(`toHouseholdId`);

ALTER TABLE `HouseholdTransfer` ADD CONSTRAINT `HouseholdTransfer_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `HouseholdTransfer` ADD CONSTRAINT `HouseholdTransfer_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `HouseholdTransfer` ADD CONSTRAINT `HouseholdTransfer_fromHouseholdId_fkey` FOREIGN KEY (`fromHouseholdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `HouseholdTransfer` ADD CONSTRAINT `HouseholdTransfer_toHouseholdId_fkey` FOREIGN KEY (`toHouseholdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
