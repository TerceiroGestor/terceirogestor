"use client";

import type {
  ActionPeopleParticipationRole,
  ActionStatus,
  AttendanceStatus,
  OccurrenceStatus,
  WeekDay,
} from "@/modules/actions/api";

export type ActionTarget = "PROJECT" | "PEOPLE_GROUP" | "ENROLLMENT";

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
  PEOPLE_GROUP: "Grupo de Pessoas",
  ENROLLMENT: "Participante",
};

export const ACTION_TARGET_OPTIONS = [
  { label: ACTION_TARGET_LABELS.PROJECT, value: "PROJECT" },
  { label: ACTION_TARGET_LABELS.PEOPLE_GROUP, value: "PEOPLE_GROUP" },
  { label: ACTION_TARGET_LABELS.ENROLLMENT, value: "ENROLLMENT" },
] satisfies { label: string; value: ActionTarget }[];

export const ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS: Record<
  ActionPeopleParticipationRole,
  string
> = {
  PARTICIPANTE: "Participante",
  FACILITADOR: "Facilitador",
  APOIO: "Apoio",
  VOLUNTARIO: "Voluntário",
  RESPONSAVEL_TECNICO: "Responsável técnico",
  CONVIDADO: "Convidado",
};

export const OCCURRENCE_STATUS_LABELS: Record<OccurrenceStatus, string> = {
  SCHEDULED: "Agendado",
  DONE: "Realizado",
  CANCELED: "Cancelado",
};

export const OCCURRENCE_STATUS_OPTIONS = [
  { label: OCCURRENCE_STATUS_LABELS.SCHEDULED, value: "SCHEDULED" },
  { label: OCCURRENCE_STATUS_LABELS.DONE, value: "DONE" },
  { label: OCCURRENCE_STATUS_LABELS.CANCELED, value: "CANCELED" },
] satisfies { label: string; value: OccurrenceStatus }[];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  MON: "Seg",
  TUE: "Ter",
  WED: "Qua",
  THU: "Qui",
  FRI: "Sex",
  SAT: "Sáb",
  SUN: "Dom",
};

export const WEEK_DAY_OPTIONS = [
  { label: WEEK_DAY_LABELS.MON, value: "MON" },
  { label: WEEK_DAY_LABELS.TUE, value: "TUE" },
  { label: WEEK_DAY_LABELS.WED, value: "WED" },
  { label: WEEK_DAY_LABELS.THU, value: "THU" },
  { label: WEEK_DAY_LABELS.FRI, value: "FRI" },
  { label: WEEK_DAY_LABELS.SAT, value: "SAT" },
  { label: WEEK_DAY_LABELS.SUN, value: "SUN" },
] satisfies { label: string; value: WeekDay }[];

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
