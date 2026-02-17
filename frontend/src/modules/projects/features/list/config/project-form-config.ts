import type { FormField, SelectOption } from "@/components/FormEngine/types";
import { PROJECT_STATUS_OPTIONS } from "@/modules/projects/shared/domain/projects.constants";
import type { ProjectStatus } from "@/modules/projects/api";

export type ProjectFormValues = {
  programId: string;
  name: string;
  status: ProjectStatus;
  startsAt: string;
  endsAt: string;
  description: string;
};

export function buildProjectFormFields(programOptions: SelectOption[]): FormField<ProjectFormValues>[] {
  return [
    { name: "programId", label: "Programa", type: "select", options: programOptions, required: true },
    { name: "name", label: "Nome", type: "text", required: true },
    { name: "status", label: "Status", type: "select", options: PROJECT_STATUS_OPTIONS, required: true },
    { name: "startsAt", label: "Início (vigência)", type: "date" },
    { name: "endsAt", label: "Término (vigência)", type: "date" },
    {
      name: "description",
      label: "Descrição",
      type: "textarea",
      helperText: "Detalhes operacionais, metas e público-alvo (opcional).",
      rows: 4,
    },
  ];
}

