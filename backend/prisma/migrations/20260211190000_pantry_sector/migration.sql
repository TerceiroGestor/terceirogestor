-- AlterTable
ALTER TABLE `PantryEntry` ADD COLUMN `sector` VARCHAR(191) NOT NULL DEFAULT 'Geral' AFTER `donorId`;

-- AlterTable
ALTER TABLE `PantryExit` ADD COLUMN `sector` VARCHAR(191) NOT NULL DEFAULT 'Geral' AFTER `itemId`;

-- CreateIndex
CREATE INDEX `PantryEntry_sector_idx` ON `PantryEntry`(`sector`);

-- CreateIndex
CREATE INDEX `PantryExit_sector_idx` ON `PantryExit`(`sector`);
