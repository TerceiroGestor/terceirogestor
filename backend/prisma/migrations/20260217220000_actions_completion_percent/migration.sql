-- Add completion percentage to action conclusion (0-100).

ALTER TABLE `ProjectAction`
  ADD COLUMN `completionPercent` INT NULL;

