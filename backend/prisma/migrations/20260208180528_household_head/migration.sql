/*
  Warnings:

  - Added the required column `updatedAt` to the `UserSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `HouseholdMember` ADD COLUMN `isHouseholdHead` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `UserSession` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
