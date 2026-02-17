import type { SelectOption } from "@/components/FormEngine/types";
import type { ProjectStatus } from "@/modules/projects/api";
import type { EnrollmentStatus } from "@/modules/projects/api";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Planejado",
  ACTIVE: "Ativo",
  CLOSED: "Encerrado",
};

export const PROJECT_STATUS_OPTIONS: SelectOption[] = (
  Object.entries(PROJECT_STATUS_LABELS) as Array<[ProjectStatus, string]>
).map(([value, label]) => ({ value, label }));

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: "Ativa",
  ENDED: "Encerrada",
};

export const ENROLLMENT_STATUS_OPTIONS: SelectOption[] = (
  Object.entries(ENROLLMENT_STATUS_LABELS) as Array<[EnrollmentStatus, string]>
).map(([value, label]) => ({ value, label }));
