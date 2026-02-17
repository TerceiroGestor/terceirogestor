"use client";

export type ApiActionType = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  target: "PROJECT" | "GROUP" | "CYCLE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActionStatus = "PLANNED" | "EXECUTED" | "CANCELED";

export type ApiProjectAction = {
  id: string;
  tenantId: string;
  projectId: string;
  createdByUserId: string | null;
  groupId: string | null;
  cycleId: string | null;
  actionTypeId: string;
  title: string;
  description: string | null;
  planHtml: string | null;
  executedHtml: string | null;
  conclusionHtml: string | null;
  completionPercent: number | null;
  photoPaths: string[] | null;
  status: ActionStatus;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  executedStartAt: string | null;
  executedEndAt: string | null;
  createdAt: string;
  updatedAt: string;
  actionType?: { id: string; name: string; target?: "PROJECT" | "GROUP" | "CYCLE" };
  createdByUser?: { id: string; name: string | null; email: string };
  group?: { id: string; name: string } | null;
  cycle?: { id: string; name: string } | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type ProjectActionsListResponse = {
  data: ApiProjectAction[];
  pagination: PaginationMeta;
};

export type ProjectActionInput = {
  actionTypeId: string;
  title: string;
  description?: string | null;
  planHtml?: string | null;
  executedHtml?: string | null;
  conclusionHtml?: string | null;
  completionPercent?: number | null;
  photoPaths?: string[] | null;
  status?: ActionStatus;
  groupId?: string | null;
  cycleId?: string | null;
  plannedStartAt?: string | null;
  plannedEndAt?: string | null;
  executedStartAt?: string | null;
  executedEndAt?: string | null;
};

export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

export type ApiProjectActionAttendance = {
  id: string;
  enrollmentId: string;
  status: AttendanceStatus;
  notes: string | null;
  qualityScore: number | null;
  qualityNotes: string | null;
  isHighlight: boolean;
  cycleParticipationId: string | null;
  updatedAt: string;
};

export type ProjectActionAttendancesListItem = {
  enrollment: import("@/modules/projects/api").ApiProjectEnrollment;
  attendance: ApiProjectActionAttendance | null;
};

export type ProjectActionAttendancesListResponse = {
  action: { id: string; title: string; cycleId: string | null; groupId?: string | null };
  data: ProjectActionAttendancesListItem[];
  pagination: PaginationMeta;
};
