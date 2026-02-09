-- Add slug column as nullable to backfill existing rows
ALTER TABLE `Tenant` ADD COLUMN `slug` VARCHAR(191) NULL;

-- Backfill slug from name for existing tenants
UPDATE `Tenant`
SET `slug` = LOWER(REPLACE(`name`, ' ', '-'))
WHERE `slug` IS NULL OR `slug` = '';

-- Enforce NOT NULL and unique
ALTER TABLE `Tenant` MODIFY COLUMN `slug` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `Tenant_slug_key` ON `Tenant`(`slug`);
