"use client";

import type { ActionStatus, AttendanceStatus } from "@/modules/actions/api";

export type ActionTarget = "PROJECT" | "GROUP" | "CYCLE";

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  PLANNED: "Planejada",
  EXECUTED: "Executada",
  CANCELED: "Cancelada",
};

export const ACTION_STATUS_OPTIONS = [
  { label: ACTION_STATUS_LABELS.PLANNED, value: "PLANNED" },
  { label: ACTION_STATUS_LABELS.EXECUTED, value: "EXECUTED" },
  { label: ACTION_STATUS_LABELS.CANCELED, value: "CANCELED" },
] satisfies { label: string; value: ActionStatus }[];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  EXCUSED: "Justificado",
};

export const ATTENDANCE_STATUS_OPTIONS = [
  { label: ATTENDANCE_STATUS_LABELS.PRESENT, value: "PRESENT" },
  { label: ATTENDANCE_STATUS_LABELS.ABSENT, value: "ABSENT" },
  { label: ATTENDANCE_STATUS_LABELS.EXCUSED, value: "EXCUSED" },
] satisfies { label: string; value: AttendanceStatus }[];

export const ACTION_TARGET_LABELS: Record<ActionTarget, string> = {
  PROJECT: "Projeto",
  GROUP: "Grupo",
  CYCLE: "Ciclo",
};

export const ACTION_TARGET_OPTIONS = [
  { label: ACTION_TARGET_LABELS.PROJECT, value: "PROJECT" },
  { label: ACTION_TARGET_LABELS.GROUP, value: "GROUP" },
  { label: ACTION_TARGET_LABELS.CYCLE, value: "CYCLE" },
] satisfies { label: string; value: ActionTarget }[];
