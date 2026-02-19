-- AlterTable
ALTER TABLE `PantryEntry` ADD COLUMN `reversalOfExitId` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `PantryExit` ADD COLUMN `reversalOfEntryId` CHAR(36) NULL,
    MODIFY `type` ENUM('ATTENDED', 'DONATION', 'EVENT', 'PARTY', 'CORRECTION') NOT NULL DEFAULT 'ATTENDED';

-- CreateIndex
CREATE INDEX `PantryEntry_reversalOfExitId_idx` ON `PantryEntry`(`reversalOfExitId`);

-- CreateIndex
CREATE INDEX `PantryExit_reversalOfEntryId_idx` ON `PantryExit`(`reversalOfEntryId`);

-- AddForeignKey
ALTER TABLE `PantryEntry` ADD CONSTRAINT `PantryEntry_reversalOfExitId_fkey` FOREIGN KEY (`reversalOfExitId`) REFERENCES `PantryExit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryExit` ADD CONSTRAINT `PantryExit_reversalOfEntryId_fkey` FOREIGN KEY (`reversalOfEntryId`) REFERENCES `PantryEntry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
