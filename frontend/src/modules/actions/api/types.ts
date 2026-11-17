"use client";

import type { ApiProjectEnrollment } from "@/modules/projects/api";

export type ApiActivityType = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  target: "PROJECT" | "PEOPLE_GROUP" | "ENROLLMENT";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActionStatus = "PLANNED" | "EXECUTED" | "CANCELED";

export type ApiActivityPeopleGroupLink = {
  peopleGroupId: string;
  peopleGroup?: {
    id: string;
    name: string;
    category?: string | null;
    description?: string | null;
    ageMin?: number | null;
    ageMax?: number | null;
    isActive?: boolean;
  } | null;
};

export type ApiActivity = {
  id: string;
  tenantId: string;
  projectId: string;
  createdByUserId: string | null;
  peopleGroupId: string | null;
  peopleGroupIds: string[];
  peopleGroups?: ApiActivityPeopleGroupLink[];
  targetEnrollmentId: string | null;
  actionTypeId: string;
  goalId: string | null;
  title: string;
  description: string | null;
  pedagogicalPlanHtml: string | null;
  tags: string[];
  internalNotes: string | null;
  completionPercent: number | null;
  status: ActionStatus;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  executedStartAt: string | null;
  executedEndAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments: ApiProjectActionComment[];
  attachments: ApiProjectActionAttachment[];
  project?: { id: string; name: string };
  actionType?: {
    id: string;
    name: string;
    target?: "PROJECT" | "PEOPLE_GROUP" | "ENROLLMENT";
  };
  goal?: { id: string; title: string } | null;
  createdByUser?: { id: string; name: string | null; email: string };
  peopleGroup?:
    | {
        id: string;
        name: string;
        category?: string | null;
        description?: string | null;
        ageMin?: number | null;
        ageMax?: number | null;
        isActive?: boolean;
        segmentId?: string | null;
        segment?: {
          id: string;
          name: string;
          category?: string | null;
        } | null;
        catalogCycleId?: string | null;
        catalogCycle?: {
          id: string;
          name: string;
          audienceType?: string | null;
        } | null;
      }
    | null;
  targetEnrollment?: ApiProjectEnrollment | null;
};

export type ApiProjectActionComment = {
  id: string;
  body: string;
  mentionUserIds: string[];
  author: {
    id: string | null;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type ApiProjectActionAttachment = {
  id: string;
  label: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedBy: {
    id: string | null;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type ActivitiesListResponse = {
  data: ApiActivity[];
  pagination: PaginationMeta;
};

export type ActivityInput = {
  actionTypeId: string;
  title: string;
  description?: string | null;
  pedagogicalPlanHtml?: string | null;
  tags?: string[];
  internalNotes?: string | null;
  completionPercent?: number | null;
  status?: ActionStatus;
  peopleGroupIds?: string[];
  targetEnrollmentId?: string | null;
  goalId?: string | null;
  plannedStartAt?: string | null;
  plannedEndAt?: string | null;
  executedStartAt?: string | null;
  executedEndAt?: string | null;
};

export type ProjectActionCommentInput = {
  body: string;
  mentionUserIds?: string[];
};

export type ProjectActionAttachmentInput = {
  label: string;
  filePath: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
};

export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";
export type ActionPeopleParticipationRole =
  | "PARTICIPANTE"
  | "FACILITADOR"
  | "APOIO"
  | "VOLUNTARIO"
  | "RESPONSAVEL_TECNICO"
  | "CONVIDADO";

export type ApiMeetingAttendance = {
  id: string;
  enrollmentId: string;
  status: AttendanceStatus;
  notes: string | null;
  qualityScore: number | null;
  qualityNotes: string | null;
  isHighlight: boolean;
  updatedAt: string;
};

export type MeetingAttendancesListItem = {
  enrollment: import("@/modules/projects/api").ApiProjectEnrollment;
  attendance: ApiMeetingAttendance | null;
};

export type MeetingAttendancesListResponse = {
  action: {
    id: string;
    title: string;
    peopleGroupId: string | null;
    targetEnrollmentId?: string | null;
  };
  occurrence: {
    id: string;
    scheduledDate: string;
    status: OccurrenceStatus;
    peopleGroupId: string | null;
  };
  data: MeetingAttendancesListItem[];
  pagination: PaginationMeta;
};

export type ActionAttendanceSummaryItem = {
  enrollment: import("@/modules/projects/api").ApiProjectEnrollment;
  totalMeetings: number;
  presentCount: number;
  attendanceRate: number | null;
  averageQuality: number | null;
  occurrencesCount: number;
};

export type ActionAttendanceSummaryResponse = {
  action: { id: string; title: string };
  data: ActionAttendanceSummaryItem[];
  pagination: PaginationMeta;
};

export type ApiProjectActionPeopleParticipation = {
  id: string;
  tenantId: string;
  actionId: string;
  personId: string;
  enrollmentId: string | null;
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
    socialName?: string | null;
    birthDate: string | null;
    status: string | null;
    avatarUrl: string | null;
    sex?: string | null;
    gender?: string | null;
    raceColor?: string | null;
    hasHealthCondition?: boolean | null;
    hasMedication?: boolean | null;
  };
  enrollment: ApiProjectEnrollment | null;
};

export type ProjectActionPeopleParticipationsListResponse = {
  data: ApiProjectActionPeopleParticipation[];
  pagination: PaginationMeta;
};

export type ActionPeopleParticipationInput = {
  personId: string;
  enrollmentId?: string | null;
  role?: ActionPeopleParticipationRole;
  startsAt?: string | null;
  internalNotes?: string | null;
};

export type EndActionPeopleParticipationInput = {
  endsAt?: string | null;
  internalNotes?: string | null;
};

export type ApiActivityPeopleGroup = {
  id: string;
  tenantId: string;
  actionId: string;
  peopleGroupId: string;
  participationKind: "PARTICIPANT" | "TEAM";
  createdAt: string;
  updatedAt: string;
  peopleGroup: {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    ageMin: number | null;
    ageMax: number | null;
    isActive: boolean;
  };
};

export type ActivityPeopleGroupInput = {
  peopleGroupId: string;
  participationKind: "PARTICIPANT" | "TEAM";
};

export type WeekDay = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type OccurrenceStatus = "SCHEDULED" | "DONE" | "CANCELED";

export type ApiActionOccurrenceTeamGroup = {
  id: string;
  peopleGroupId: string;
  peopleGroup: { id: string; name: string };
};

export type ApiActionOccurrencePeopleGroup = {
  id: string;
  peopleGroupId: string;
  peopleGroup: { id: string; name: string };
};

export type ApiMeeting = {
  id: string;
  tenantId: string;
  actionId: string;
  peopleGroupId: string | null;
  peopleGroupIds: string[];
  scheduledDate: string;
  startTime: string;
  endTime: string | null;
  status: OccurrenceStatus;
  notes: string | null;
  planHtml: string | null;
  executedHtml: string | null;
  conclusionHtml: string | null;
  photoPaths: string[] | null;
  recurrenceBatchId: string | null;
  createdAt: string;
  updatedAt: string;
  peopleGroup: { id: string; name: string } | null;
  peopleGroups: ApiActionOccurrencePeopleGroup[];
  teamPeopleGroups: ApiActionOccurrenceTeamGroup[];
};

export type MeetingsListResponse = {
  data: ApiMeeting[];
  pagination: PaginationMeta;
};

export type MeetingInput = {
  scheduledDate: string;
  startTime: string;
  endTime?: string | null;
  peopleGroupIds?: string[];
  teamPeopleGroupIds?: string[];
  notes?: string | null;
  planHtml?: string | null;
  executedHtml?: string | null;
  conclusionHtml?: string | null;
  photoPaths?: string[] | null;
};

export type MeetingUpdateInput = {
  scheduledDate?: string;
  startTime?: string;
  endTime?: string | null;
  peopleGroupIds?: string[];
  teamPeopleGroupIds?: string[];
  status?: OccurrenceStatus;
  notes?: string | null;
  planHtml?: string | null;
  executedHtml?: string | null;
  conclusionHtml?: string | null;
  photoPaths?: string[] | null;
};

export type BulkCreateMeetingsInput = {
  peopleGroupIds?: string[];
  teamPeopleGroupIds?: string[];
  startDate: string;
  endDate: string;
  daysOfWeek: WeekDay[];
  startTime: string;
  endTime?: string | null;
  notes?: string | null;
  planHtml?: string | null;
  executedHtml?: string | null;
  conclusionHtml?: string | null;
  photoPaths?: string[] | null;
  excludedDates?: string[];
};

export type BulkCreateMeetingsResponse = {
  recurrenceBatchId: string;
  created: number;
  data: ApiMeeting[];
};

export type PreviewMeetingsInput = {
  startDate: string;
  endDate: string;
  daysOfWeek: WeekDay[];
};

export type PreviewMeetingsResponse = {
  dates: string[];
};

export type UpdateMeetingBatchInput = {
  status: OccurrenceStatus;
  fromDate?: string;
};
