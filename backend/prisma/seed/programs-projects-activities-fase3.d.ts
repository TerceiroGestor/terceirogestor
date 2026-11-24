import type { PrismaClient } from '../../src/generated/prisma';
import type { PeopleFase1Result } from './people-fase1';
export type ProgramsProjectsActivitiesFase3Result = {
    programs: number;
    projects: number;
    activities: number;
    enrollments: number;
    teamParticipations: number;
    goals: number;
    directParticipants: number;
};
export declare function seedProgramsProjectsActivitiesFase3(prisma: PrismaClient, tenantId: string, people: PeopleFase1Result): Promise<ProgramsProjectsActivitiesFase3Result>;
