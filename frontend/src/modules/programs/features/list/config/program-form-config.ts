import type { FormField } from "@/components/FormEngine/types";
import {
  PROGRAM_STATUS_OPTIONS,
  PROGRAM_TYPE_OPTIONS,
} from "@/modules/programs/shared/domain/programs.constants";
import type { ProgramStatus, ProgramType } from "@/modules/programs/api";

export type ProgramFormValues = {
  name: string;
  type: ProgramType;
  status: ProgramStatus;
  startsAt: string;
  endsAt: string;
  description: string;
};

export const programFormFields: FormField<ProgramFormValues>[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  { name: "type", label: "Tipo", type: "select", options: PROGRAM_TYPE_OPTIONS, required: true },
  { name: "status", label: "Status", type: "select", options: PROGRAM_STATUS_OPTIONS, required: true },
  { name: "startsAt", label: "Início (vigência)", type: "date" },
  { name: "endsAt", label: "Término (vigência)", type: "date" },
  {
    name: "description",
    label: "Descrição",
    type: "textarea",
    helperText: "Objetivo, público-alvo e observações gerais (opcional).",
    rows: 4,
  },
];

