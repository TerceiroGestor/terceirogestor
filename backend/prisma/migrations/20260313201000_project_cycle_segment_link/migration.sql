ALTER TABLE `ProjectCycle`
  ADD COLUMN `segmentId` CHAR(36) NULL;

CREATE INDEX `ProjectCycle_segmentId_idx` ON `ProjectCycle`(`segmentId`);

ALTER TABLE `ProjectCycle`
  ADD CONSTRAINT `ProjectCycle_segmentId_fkey`
  FOREIGN KEY (`segmentId`) REFERENCES `PeopleSegment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
