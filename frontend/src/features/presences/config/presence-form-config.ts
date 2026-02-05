import type { FormField, FormStep } from "@/components/FormEngine/types";
import type { PresenceFormData } from "@/features/presences/domain/types";

export const presenceFormFields: FormField<PresenceFormData>[] = [
  { name: "date", label: "Data", type: "date" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Presenca", value: "Presenca" },
      { label: "Falta", value: "Falta" },
    ],
  },
];

export const presenceFormSteps: FormStep[] = [
  {
    title: "Presenca",
    fields: ["date", "status"],
  },
];
