CREATE TABLE `PeopleSegment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `ageMin` INTEGER NULL,
  `ageMax` INTEGER NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `internalNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PeopleSegment_tenantId_name_key`(`tenantId`, `name`),
  INDEX `PeopleSegment_tenantId_idx`(`tenantId`),
  INDEX `PeopleSegment_name_idx`(`name`),
  INDEX `PeopleSegment_category_idx`(`category`),
  INDEX `PeopleSegment_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PeopleSegmentMembership` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `segmentId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `activeKey` VARCHAR(80) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endsAt` DATETIME(3) NULL,
  `deletedAt` DATETIME(3) NULL,
  `internalNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PeopleSegmentMembership_tenantId_activeKey_key`(`tenantId`, `activeKey`),
  INDEX `PeopleSegmentMembership_tenantId_idx`(`tenantId`),
  INDEX `PeopleSegmentMembership_segmentId_idx`(`segmentId`),
  INDEX `PeopleSegmentMembership_personId_idx`(`personId`),
  INDEX `PeopleSegmentMembership_activeKey_idx`(`activeKey`),
  INDEX `PeopleSegmentMembership_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PeopleSegment`
  ADD CONSTRAINT `PeopleSegment_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PeopleSegmentMembership`
  ADD CONSTRAINT `PeopleSegmentMembership_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `PeopleSegmentMembership_segmentId_fkey`
  FOREIGN KEY (`segmentId`) REFERENCES `PeopleSegment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `PeopleSegmentMembership_personId_fkey`
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
