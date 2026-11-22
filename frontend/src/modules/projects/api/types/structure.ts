import type { ActionPeopleParticipationRole } from "@/modules/actions/api";
import type { ProjectsPagination } from "./shared";

export type EnrollmentStatus = "ACTIVE" | "ENDED";
export type ProjectParticipationRole =
  | "PUBLICO_ATENDIDO"
  | "FAMILIAR"
  | "VOLUNTARIO"
  | "EQUIPE_TECNICA"
  | "FUNCIONARIO"
  | "OFICINEIRO"
  | "PARCEIRO"
  | "DOADOR"
  | "PATROCINADOR";

export type ParticipationKind = "PARTICIPANT" | "TEAM";

export type ApiProjectPeopleGroup = {
  id: string;
  tenantId: string;
  projectId: string;
  peopleGroupId: string;
  participationKind: ParticipationKind;
  createdAt: string;
  updatedAt: string;
  peopleGroup: {
    id: string;
    name: string;
    groupType?: "CYCLE" | "SEGMENT" | "TEAM_POOL" | "NETWORK" | "OTHER";
    category?: string | null;
    description?: string | null;
    ageMin?: number | null;
    ageMax?: number | null;
    isActive?: boolean;
  };
};

export type ApiEnrollmentPerson = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  birthDate: string | null;
  status: string | null;
  sex?: string | null;
  gender?: string | null;
  raceColor?: string | null;
  hasHealthCondition?: boolean | null;
  hasMedication?: boolean | null;
};

export type ApiEligibleProjectPerson = ApiEnrollmentPerson & {
  tenantId: string;
  socialName?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  personType?: string | null;
  departureReason?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  profileSummary?: string | null;
  createdAt: string;
  updatedAt: string;
  eligiblePeopleGroups?: Array<{
    id: string;
    name: string;
    category?: string | null;
  }>;
};

export type ApiProjectEnrollment = {
  id: string;
  tenantId: string;
  projectId: string;
  personId: string;
  status: EnrollmentStatus;
  role: ProjectParticipationRole;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  person: ApiEnrollmentPerson;
  peopleGroups: { id: string; name: string; category?: string | null }[];
  cycle: { id: string; name: string } | null;
};

export type ProjectEnrollmentInput = {
  personId: string;
  status?: EnrollmentStatus;
  role?: ProjectParticipationRole;
  participationKind?: ParticipationKind;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type ProjectPeopleGroupInput = {
  peopleGroupId: string;
  participationKind: ParticipationKind;
};

export type ProjectEnrollmentsListResponse = {
  data: ApiProjectEnrollment[];
  pagination: ProjectsPagination;
};

export type EligibleProjectPeopleListResponse = {
  data: ApiEligibleProjectPerson[];
  pagination: ProjectsPagination;
};

export type SyncPeopleGroupEnrollmentsInput = {
  role?: ProjectParticipationRole;
};

export type SyncPeopleGroupEnrollmentsResponse = {
  enrolled: { id: string; personId: string; fullName: string }[];
  ended: { id: string; personId: string; fullName: string }[];
};

export type FundingSourceType = "MUNICIPAL" | "ESTADUAL" | "FEDERAL" | "TERCEIRO";

export type ApiProjectFundingSource = {
  id: string;
  tenantId: string;
  projectId: string;
  source: FundingSourceType;
  name: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFundingSourceInput = {
  source: FundingSourceType;
  name?: string | null;
  notes?: string | null;
};

export type ApiGoal = {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalInput = {
  title: string;
  description?: string | null;
};

/**
 * Equipe individual do Projeto (revisão da hierarquia de equipe,
 * 2026-11-21): mesmo papel usado pela Atividade (ActionPeopleParticipationRole)
 * - decisão do usuário de ter um único enum de papel nos 3 níveis
 * (Projeto/Atividade/Encontro).
 */
export type ApiProjectTeamParticipation = {
  id: string;
  tenantId: string;
  projectId: string;
  personId: string;
  role: ActionPeopleParticipationRole;
  activeKey: string | null;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  deletedAt: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  person: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    status: string | null;
  };
};

export type ProjectTeamParticipationInput = {
  personId: string;
  role?: ActionPeopleParticipationRole;
  startsAt?: string | null;
  internalNotes?: string | null;
};

export type EndProjectTeamParticipationInput = {
  endsAt?: string | null;
  internalNotes?: string | null;
};
