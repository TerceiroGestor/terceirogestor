import type { SelectOption } from "@/components/FormEngine/types";
import type { ProgramStatus, ProgramType } from "@/modules/programs/api";

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  SCFV: "SCFV",
  PAIF: "PAIF",
  PAEFI: "PAEFI",
  CULTURAL: "Cultura",
  QUALIFICATION: "Qualificação",
  OTHER: "Outro",
};

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  PLANNED: "Planejado",
  ACTIVE: "Ativo",
  CLOSED: "Encerrado",
};

export const PROGRAM_TYPE_OPTIONS: SelectOption[] = (
  Object.entries(PROGRAM_TYPE_LABELS) as Array<[ProgramType, string]>
).map(([value, label]) => ({ value, label }));

export const PROGRAM_STATUS_OPTIONS: SelectOption[] = (
  Object.entries(PROGRAM_STATUS_LABELS) as Array<[ProgramStatus, string]>
).map(([value, label]) => ({ value, label }));

