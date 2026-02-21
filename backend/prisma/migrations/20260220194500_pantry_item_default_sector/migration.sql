-- Add defaultSector to PantryItem (default storage sector for the food)
ALTER TABLE `PantryItem`
  ADD COLUMN `defaultSector` VARCHAR(191) NOT NULL DEFAULT 'Geral';

