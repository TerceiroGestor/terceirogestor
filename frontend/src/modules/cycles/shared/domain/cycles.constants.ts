import type { CycleAudienceType } from "@/modules/cycles/api";

export const CYCLE_AUDIENCE_OPTIONS: Array<{ value: CycleAudienceType; label: string }> = [
  { value: "CHILDREN", label: "Criancas" },
  { value: "TEENS", label: "Adolescentes" },
  { value: "ADULTS", label: "Adultos" },
  { value: "FAMILIES", label: "Familiares" },
  { value: "OTHER", label: "Outro" },
];

export const CYCLE_AUDIENCE_LABELS: Record<CycleAudienceType, string> = {
  CHILDREN: "Criancas",
  TEENS: "Adolescentes",
  ADULTS: "Adultos",
  FAMILIES: "Familiares",
  OTHER: "Outro",
};

export const CYCLE_STATUS_OPTIONS = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
] as const;
