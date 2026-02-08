ALTER TABLE `PersonIncome` ADD COLUMN `householdId` CHAR(36) NULL;
CREATE INDEX `PersonIncome_householdId_idx` ON `PersonIncome`(`householdId`);
ALTER TABLE `PersonIncome` ADD CONSTRAINT `PersonIncome_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PersonExpense` ADD COLUMN `householdId` CHAR(36) NULL;
CREATE INDEX `PersonExpense_householdId_idx` ON `PersonExpense`(`householdId`);
ALTER TABLE `PersonExpense` ADD CONSTRAINT `PersonExpense_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
