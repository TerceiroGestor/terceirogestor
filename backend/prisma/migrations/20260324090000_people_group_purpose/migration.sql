ALTER TABLE `PeopleGroup`
ADD COLUMN `purpose` ENUM('PUBLICO', 'EQUIPE') NOT NULL DEFAULT 'PUBLICO';

UPDATE `PeopleGroup`
SET `purpose` =
  CASE
    WHEN `groupType` = 'TEAM_POOL' THEN 'EQUIPE'
    ELSE 'PUBLICO'
  END;

CREATE INDEX `PeopleGroup_purpose_idx` ON `PeopleGroup`(`purpose`);
