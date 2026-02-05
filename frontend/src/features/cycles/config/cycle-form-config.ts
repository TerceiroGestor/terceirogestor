import type { FormField, FormStep } from "@/components/FormEngine/types";
import type { CycleFormData } from "@/features/cycles/domain/types";

export const cycleFormFields: FormField<CycleFormData>[] = [
  { name: "title", label: "Ciclo", type: "text" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Atual", value: "Atual" },
      { label: "Historico", value: "Historico" },
    ],
  },
  { name: "startDate", label: "Inicio", type: "date" },
  { name: "endDate", label: "Fim", type: "date" },
];

export const cycleFormSteps: FormStep[] = [
  {
    title: "Ciclo",
    fields: ["title", "status", "startDate", "endDate"],
  },
];
