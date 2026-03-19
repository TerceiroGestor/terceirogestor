ALTER TABLE `ProjectCycle`
    ADD COLUMN `catalogCycleId` CHAR(36) NULL;

CREATE INDEX `ProjectCycle_catalogCycleId_idx` ON `ProjectCycle`(`catalogCycleId`);

ALTER TABLE `ProjectCycle`
    ADD CONSTRAINT `ProjectCycle_catalogCycleId_fkey`
    FOREIGN KEY (`catalogCycleId`) REFERENCES `Cycle`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
