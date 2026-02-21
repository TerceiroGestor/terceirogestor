-- CreateTable
CREATE TABLE `PantrySector` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `PantrySector_tenantId_idx`(`tenantId`),
  UNIQUE INDEX `PantrySector_tenantId_name_key`(`tenantId`, `name`),
  PRIMARY KEY (`id`),
  CONSTRAINT `PantrySector_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

