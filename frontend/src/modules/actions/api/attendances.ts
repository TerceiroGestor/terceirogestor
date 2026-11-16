"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type {
  AttendanceStatus,
  MeetingAttendancesListResponse,
} from "./types";

export async function listMeetingAttendances(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
  params?: {
    q?: string;
    status?: AttendanceStatus;
    groupId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = buildQuery(params);
  return apiRequest<MeetingAttendancesListResponse>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}/attendances${query}`,
    {},
    token,
  );
}

export async function upsertMeetingAttendances(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
  items: {
    enrollmentId: string;
    status: AttendanceStatus;
    notes?: string | null;
    qualityScore?: number | null;
    qualityNotes?: string | null;
    isHighlight?: boolean;
  }[],
) {
  return apiRequest<{ ok: true; created: number; updated: number }>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}/attendances`,
    { method: "PUT", body: JSON.stringify({ items }) },
    token,
  );
}
