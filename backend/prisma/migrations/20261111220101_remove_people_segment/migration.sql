-- DropForeignKey
ALTER TABLE "PeopleSegment" DROP CONSTRAINT "PeopleSegment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "PeopleSegmentMembership" DROP CONSTRAINT "PeopleSegmentMembership_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "PeopleSegmentMembership" DROP CONSTRAINT "PeopleSegmentMembership_segmentId_fkey";

-- DropForeignKey
ALTER TABLE "PeopleSegmentMembership" DROP CONSTRAINT "PeopleSegmentMembership_personId_fkey";

-- DropTable
DROP TABLE "PeopleSegment";

-- DropTable
DROP TABLE "PeopleSegmentMembership";
