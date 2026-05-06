import type { FormField, FormStep } from "@/web-client/forms/types";

export type MedicationFormValues = {
  reason?: string;
  medication: string;
  dosage?: string;
  schedule?: string;
  startDate?: string;
  endDate?: string;
  prescribingDoctor?: string;
  notes?: string;
};

export const medicationReasonOptions = [
  { label: "TDAH", value: "TDAH" },
  { label: "Ansiedade", value: "Ansiedade" },
  { label: "Hipertensao", value: "Hipertensao" },
  { label: "Diabetes", value: "Diabetes" },
  { label: "Outro", value: "Outro" },
];

export const medicationFormFields: FormField<MedicationFormValues>[] = [
  {
    name: "reason",
    label: "Motivo",
    type: "select",
    options: medicationReasonOptions,
  },
  {
    name: "medication",
    label: "Medicamento",
    type: "text",
    required: true,
  },
  { name: "dosage", label: "Dosagem", type: "text" },
  {
    name: "schedule",
    label: "Horarios",
    type: "text",
    placeholder: "Ex: 08h/08h",
  },
  { name: "startDate", label: "Inicio", type: "date" },
  { name: "endDate", label: "Fim", type: "date" },
  {
    name: "prescribingDoctor",
    label: "Profissional responsavel",
    type: "text",
  },
];

export const medicationFormSteps: FormStep[] = [
  {
    title: "Medicacao",
    fields: [
      "reason",
      "medication",
      "dosage",
      "schedule",
      "startDate",
      "endDate",
      "prescribingDoctor",
    ],
  },
];
