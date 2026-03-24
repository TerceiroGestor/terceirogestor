RENAME TABLE
  `StorageItem` TO `DepositItem`,
  `StorageSector` TO `DepositSector`,
  `StorageDonor` TO `DepositDonor`,
  `StorageEntry` TO `DepositEntry`,
  `StorageExit` TO `DepositExit`,
  `StorageExitAllocation` TO `DepositExitAllocation`,
  `StorageItemComment` TO `DepositItemComment`,
  `StorageItemAttachment` TO `DepositItemAttachment`,
  `StorageDonorComment` TO `DepositDonorComment`,
  `StorageDonorAttachment` TO `DepositDonorAttachment`,
  `StorageEntryComment` TO `DepositEntryComment`,
  `StorageEntryAttachment` TO `DepositEntryAttachment`,
  `StorageExitComment` TO `DepositExitComment`,
  `StorageExitAttachment` TO `DepositExitAttachment`;

ALTER TABLE `DepositItem`
  RENAME INDEX `StorageItem_tenantId_idx` TO `DepositItem_tenantId_idx`,
  RENAME INDEX `StorageItem_name_idx` TO `DepositItem_name_idx`;

ALTER TABLE `DepositSector`
  RENAME INDEX `StorageSector_tenantId_idx` TO `DepositSector_tenantId_idx`,
  RENAME INDEX `StorageSector_tenantId_name_key` TO `DepositSector_tenantId_name_key`;

ALTER TABLE `DepositDonor`
  RENAME INDEX `StorageDonor_tenantId_idx` TO `DepositDonor_tenantId_idx`,
  RENAME INDEX `StorageDonor_name_idx` TO `DepositDonor_name_idx`;

ALTER TABLE `DepositEntry`
  RENAME INDEX `StorageEntry_tenantId_idx` TO `DepositEntry_tenantId_idx`,
  RENAME INDEX `StorageEntry_itemId_idx` TO `DepositEntry_itemId_idx`,
  RENAME INDEX `StorageEntry_donorId_idx` TO `DepositEntry_donorId_idx`,
  RENAME INDEX `StorageEntry_sector_idx` TO `DepositEntry_sector_idx`,
  RENAME INDEX `StorageEntry_entryDate_idx` TO `DepositEntry_entryDate_idx`,
  RENAME INDEX `StorageEntry_expiryDate_idx` TO `DepositEntry_expiryDate_idx`,
  RENAME INDEX `StorageEntry_reversalOfExitId_idx` TO `DepositEntry_reversalOfExitId_idx`;

ALTER TABLE `DepositExit`
  RENAME INDEX `StorageExit_tenantId_idx` TO `DepositExit_tenantId_idx`,
  RENAME INDEX `StorageExit_itemId_idx` TO `DepositExit_itemId_idx`,
  RENAME INDEX `StorageExit_sector_idx` TO `DepositExit_sector_idx`,
  RENAME INDEX `StorageExit_exitDate_idx` TO `DepositExit_exitDate_idx`,
  RENAME INDEX `StorageExit_reversalOfEntryId_idx` TO `DepositExit_reversalOfEntryId_idx`;

ALTER TABLE `DepositExitAllocation`
  RENAME INDEX `StorageExitAllocation_tenantId_idx` TO `DepositExitAllocation_tenantId_idx`,
  RENAME INDEX `StorageExitAllocation_exitId_idx` TO `DepositExitAllocation_exitId_idx`,
  RENAME INDEX `StorageExitAllocation_entryId_idx` TO `DepositExitAllocation_entryId_idx`,
  RENAME INDEX `StorageExitAllocation_exitId_entryId_key` TO `DepositExitAllocation_exitId_entryId_key`;

ALTER TABLE `DepositItemComment`
  RENAME INDEX `StorageItemComment_tenantId_idx` TO `DepositItemComment_tenantId_idx`,
  RENAME INDEX `StorageItemComment_itemId_createdAt_idx` TO `DepositItemComment_itemId_createdAt_idx`,
  RENAME INDEX `StorageItemComment_authorUserId_idx` TO `DepositItemComment_authorUserId_idx`;

ALTER TABLE `DepositItemAttachment`
  RENAME INDEX `StorageItemAttachment_tenantId_idx` TO `DepositItemAttachment_tenantId_idx`,
  RENAME INDEX `StorageItemAttachment_itemId_createdAt_idx` TO `DepositItemAttachment_itemId_createdAt_idx`,
  RENAME INDEX `StorageItemAttachment_uploadedByUserId_idx` TO `DepositItemAttachment_uploadedByUserId_idx`;

ALTER TABLE `DepositDonorComment`
  RENAME INDEX `StorageDonorComment_tenantId_idx` TO `DepositDonorComment_tenantId_idx`,
  RENAME INDEX `StorageDonorComment_donorId_createdAt_idx` TO `DepositDonorComment_donorId_createdAt_idx`,
  RENAME INDEX `StorageDonorComment_authorUserId_idx` TO `DepositDonorComment_authorUserId_idx`;

ALTER TABLE `DepositDonorAttachment`
  RENAME INDEX `StorageDonorAttachment_tenantId_idx` TO `DepositDonorAttachment_tenantId_idx`,
  RENAME INDEX `StorageDonorAttachment_donorId_createdAt_idx` TO `DepositDonorAttachment_donorId_createdAt_idx`,
  RENAME INDEX `StorageDonorAttachment_uploadedByUserId_idx` TO `DepositDonorAttachment_uploadedByUserId_idx`;

ALTER TABLE `DepositEntryComment`
  RENAME INDEX `StorageEntryComment_tenantId_idx` TO `DepositEntryComment_tenantId_idx`,
  RENAME INDEX `StorageEntryComment_entryId_createdAt_idx` TO `DepositEntryComment_entryId_createdAt_idx`,
  RENAME INDEX `StorageEntryComment_authorUserId_idx` TO `DepositEntryComment_authorUserId_idx`;

ALTER TABLE `DepositEntryAttachment`
  RENAME INDEX `StorageEntryAttachment_tenantId_idx` TO `DepositEntryAttachment_tenantId_idx`,
  RENAME INDEX `StorageEntryAttachment_entryId_createdAt_idx` TO `DepositEntryAttachment_entryId_createdAt_idx`,
  RENAME INDEX `StorageEntryAttachment_uploadedByUserId_idx` TO `DepositEntryAttachment_uploadedByUserId_idx`;

ALTER TABLE `DepositExitComment`
  RENAME INDEX `StorageExitComment_tenantId_idx` TO `DepositExitComment_tenantId_idx`,
  RENAME INDEX `StorageExitComment_exitId_createdAt_idx` TO `DepositExitComment_exitId_createdAt_idx`,
  RENAME INDEX `StorageExitComment_authorUserId_idx` TO `DepositExitComment_authorUserId_idx`;

ALTER TABLE `DepositExitAttachment`
  RENAME INDEX `StorageExitAttachment_tenantId_idx` TO `DepositExitAttachment_tenantId_idx`,
  RENAME INDEX `StorageExitAttachment_exitId_createdAt_idx` TO `DepositExitAttachment_exitId_createdAt_idx`,
  RENAME INDEX `StorageExitAttachment_uploadedByUserId_idx` TO `DepositExitAttachment_uploadedByUserId_idx`;

ALTER TABLE `DepositItem`
  DROP FOREIGN KEY `StorageItem_tenantId_fkey`,
  ADD CONSTRAINT `DepositItem_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DepositSector`
  DROP FOREIGN KEY `StorageSector_tenantId_fkey`,
  ADD CONSTRAINT `DepositSector_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DepositDonor`
  DROP FOREIGN KEY `StorageDonor_tenantId_fkey`,
  ADD CONSTRAINT `DepositDonor_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DepositEntry`
  DROP FOREIGN KEY `StorageEntry_tenantId_fkey`,
  DROP FOREIGN KEY `StorageEntry_itemId_fkey`,
  DROP FOREIGN KEY `StorageEntry_donorId_fkey`,
  DROP FOREIGN KEY `StorageEntry_reversalOfExitId_fkey`,
  ADD CONSTRAINT `DepositEntry_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositEntry_itemId_fkey`
    FOREIGN KEY (`itemId`) REFERENCES `DepositItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositEntry_donorId_fkey`
    FOREIGN KEY (`donorId`) REFERENCES `DepositDonor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositEntry_reversalOfExitId_fkey`
    FOREIGN KEY (`reversalOfExitId`) REFERENCES `DepositExit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositExit`
  DROP FOREIGN KEY `StorageExit_tenantId_fkey`,
  DROP FOREIGN KEY `StorageExit_itemId_fkey`,
  DROP FOREIGN KEY `StorageExit_reversalOfEntryId_fkey`,
  ADD CONSTRAINT `DepositExit_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExit_itemId_fkey`
    FOREIGN KEY (`itemId`) REFERENCES `DepositItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExit_reversalOfEntryId_fkey`
    FOREIGN KEY (`reversalOfEntryId`) REFERENCES `DepositEntry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositExitAllocation`
  DROP FOREIGN KEY `StorageExitAllocation_tenantId_fkey`,
  DROP FOREIGN KEY `StorageExitAllocation_exitId_fkey`,
  DROP FOREIGN KEY `StorageExitAllocation_entryId_fkey`,
  ADD CONSTRAINT `DepositExitAllocation_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExitAllocation_exitId_fkey`
    FOREIGN KEY (`exitId`) REFERENCES `DepositExit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExitAllocation_entryId_fkey`
    FOREIGN KEY (`entryId`) REFERENCES `DepositEntry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DepositItemComment`
  DROP FOREIGN KEY `StorageItemComment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageItemComment_itemId_fkey`,
  DROP FOREIGN KEY `StorageItemComment_authorUserId_fkey`,
  ADD CONSTRAINT `DepositItemComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositItemComment_itemId_fkey`
    FOREIGN KEY (`itemId`) REFERENCES `DepositItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositItemComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositItemAttachment`
  DROP FOREIGN KEY `StorageItemAttachment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageItemAttachment_itemId_fkey`,
  DROP FOREIGN KEY `StorageItemAttachment_uploadedByUserId_fkey`,
  ADD CONSTRAINT `DepositItemAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositItemAttachment_itemId_fkey`
    FOREIGN KEY (`itemId`) REFERENCES `DepositItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositItemAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositDonorComment`
  DROP FOREIGN KEY `StorageDonorComment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageDonorComment_donorId_fkey`,
  DROP FOREIGN KEY `StorageDonorComment_authorUserId_fkey`,
  ADD CONSTRAINT `DepositDonorComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositDonorComment_donorId_fkey`
    FOREIGN KEY (`donorId`) REFERENCES `DepositDonor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositDonorComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositDonorAttachment`
  DROP FOREIGN KEY `StorageDonorAttachment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageDonorAttachment_donorId_fkey`,
  DROP FOREIGN KEY `StorageDonorAttachment_uploadedByUserId_fkey`,
  ADD CONSTRAINT `DepositDonorAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositDonorAttachment_donorId_fkey`
    FOREIGN KEY (`donorId`) REFERENCES `DepositDonor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositDonorAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositEntryComment`
  DROP FOREIGN KEY `StorageEntryComment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageEntryComment_entryId_fkey`,
  DROP FOREIGN KEY `StorageEntryComment_authorUserId_fkey`,
  ADD CONSTRAINT `DepositEntryComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositEntryComment_entryId_fkey`
    FOREIGN KEY (`entryId`) REFERENCES `DepositEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositEntryComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositEntryAttachment`
  DROP FOREIGN KEY `StorageEntryAttachment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageEntryAttachment_entryId_fkey`,
  DROP FOREIGN KEY `StorageEntryAttachment_uploadedByUserId_fkey`,
  ADD CONSTRAINT `DepositEntryAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositEntryAttachment_entryId_fkey`
    FOREIGN KEY (`entryId`) REFERENCES `DepositEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositEntryAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositExitComment`
  DROP FOREIGN KEY `StorageExitComment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageExitComment_exitId_fkey`,
  DROP FOREIGN KEY `StorageExitComment_authorUserId_fkey`,
  ADD CONSTRAINT `DepositExitComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExitComment_exitId_fkey`
    FOREIGN KEY (`exitId`) REFERENCES `DepositExit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExitComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DepositExitAttachment`
  DROP FOREIGN KEY `StorageExitAttachment_tenantId_fkey`,
  DROP FOREIGN KEY `StorageExitAttachment_exitId_fkey`,
  DROP FOREIGN KEY `StorageExitAttachment_uploadedByUserId_fkey`,
  ADD CONSTRAINT `DepositExitAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExitAttachment_exitId_fkey`
    FOREIGN KEY (`exitId`) REFERENCES `DepositExit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DepositExitAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
