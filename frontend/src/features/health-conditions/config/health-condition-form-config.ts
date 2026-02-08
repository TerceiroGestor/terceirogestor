import type { FormField, FormStep } from "@/components/FormEngine/types";

export type HealthConditionFormValues = {
  type: string;
  description?: string;
  severity?: string;
  diagnosisDate?: string;
  documentUrl?: string;
  documentFile?: File | null;
  notes?: string;
};

export const healthConditionTypeOptions = [
  { label: "Deficiencia Auditiva", value: "Deficiencia Auditiva" },
  { label: "Deficiencia Visual", value: "Deficiencia Visual" },
  { label: "Deficiencia Motora", value: "Deficiencia Motora" },
  { label: "Deficiencia Intelectual", value: "Deficiencia Intelectual" },
  { label: "Condicao Cronica", value: "Condicao Cronica" },
  { label: "Alergia", value: "Alergia" },
  { label: "Transtorno", value: "Transtorno" },
  { label: "Necessidade Especifica", value: "Necessidade Especifica" },
  { label: "Outro", value: "Outro" },
];

export const healthConditionSeverityOptions = [
  { label: "Leve", value: "Leve" },
  { label: "Moderada", value: "Moderada" },
  { label: "Severa", value: "Severa" },
  { label: "Nao informado", value: "Nao informado" },
];

export const healthConditionFormFields: FormField<HealthConditionFormValues>[] = [
  {
    name: "type",
    label: "Tipo de condicao",
    type: "select",
    options: healthConditionTypeOptions,
    required: true,
  },
  {
    name: "description",
    label: "Descricao",
    type: "textarea",
    rows: 3,
  },
  {
    name: "severity",
    label: "Severidade",
    type: "select",
    options: healthConditionSeverityOptions,
  },
  { name: "diagnosisDate", label: "Data do diagnostico", type: "date" },
  {
    name: "documentUrl",
    label: "Documento",
    type: "url",
    placeholder: "uploads/health/parecer-medico.pdf",
  },
  {
    name: "documentFile",
    label: "Upload do documento",
    type: "file",
    accept: ".pdf,image/*",
  },
  {
    name: "notes",
    label: "Observacoes",
    type: "textarea",
    rows: 3,
  },
];

export const healthConditionFormSteps: FormStep[] = [
  {
    title: "Condicao de saude",
    fields: [
      "type",
      "description",
      "severity",
      "diagnosisDate",
      "documentUrl",
      "notes",
    ],
  },
];
