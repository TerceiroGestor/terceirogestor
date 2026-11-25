import type { PrismaClient } from '../../src/generated/prisma';
import type { PeopleFase1Result } from './people-fase1';
export type AttendancesOccurrencesFase2Result = {
    occurrences: number;
    attendances: number;
    evolutions: number;
    benefits: number;
    referralDestinations: number;
};
export declare function seedAttendancesOccurrencesFase2(prisma: PrismaClient, tenantId: string, people: PeopleFase1Result): Promise<AttendancesOccurrencesFase2Result>;
