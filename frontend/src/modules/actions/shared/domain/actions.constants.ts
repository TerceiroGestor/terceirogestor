"use client";

import type {
  ActionPeopleParticipationRole,
  ActionStatus,
  AttendanceStatus,
} from "@/modules/actions/api";

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
  CYCLE: "Segmento",
};

export const ACTION_TARGET_OPTIONS = [
  { label: ACTION_TARGET_LABELS.PROJECT, value: "PROJECT" },
  { label: ACTION_TARGET_LABELS.GROUP, value: "GROUP" },
  { label: ACTION_TARGET_LABELS.CYCLE, value: "CYCLE" },
] satisfies { label: string; value: ActionTarget }[];

export const ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS: Record<
  ActionPeopleParticipationRole,
  string
> = {
  PARTICIPANTE: "Participante",
  FACILITADOR: "Facilitador",
  APOIO: "Apoio",
  VOLUNTARIO: "Voluntario",
  RESPONSAVEL_TECNICO: "Responsavel tecnico",
  CONVIDADO: "Convidado",
};

export const ACTION_PEOPLE_PARTICIPATION_ROLE_OPTIONS = [
  { label: ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS.PARTICIPANTE, value: "PARTICIPANTE" },
  { label: ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS.FACILITADOR, value: "FACILITADOR" },
  { label: ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS.APOIO, value: "APOIO" },
  { label: ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS.VOLUNTARIO, value: "VOLUNTARIO" },
  {
    label: ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS.RESPONSAVEL_TECNICO,
    value: "RESPONSAVEL_TECNICO",
  },
  { label: ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS.CONVIDADO, value: "CONVIDADO" },
] satisfies { label: string; value: ActionPeopleParticipationRole }[];
