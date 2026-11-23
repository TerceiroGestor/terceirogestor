import type { PrismaClient } from '../../src/generated/prisma';
export type MeetingsFase4Result = {
    meetings: number;
    attendances: number;
    teamParticipations: number;
};
export declare function seedMeetingsFase4(prisma: PrismaClient, tenantId: string): Promise<MeetingsFase4Result>;
