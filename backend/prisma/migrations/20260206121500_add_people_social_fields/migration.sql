-- Add social fields and metadata to Person
ALTER TABLE `Person`
  ADD COLUMN `sex` VARCHAR(10) NULL,
  ADD COLUMN `raceColor` VARCHAR(10) NULL,
  ADD COLUMN `departureReason` TEXT NULL,
  ADD COLUMN `tags` TEXT NULL,
  ADD COLUMN `hasHealthIssue` BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing sexo values by moving current gender -> sex
UPDATE `Person`
SET `sex` = `gender`
WHERE `sex` IS NULL AND `gender` IS NOT NULL;

-- Reset gender to be filled with the new genero values
UPDATE `Person`
SET `gender` = NULL
WHERE `gender` IS NOT NULL;
