import type { SelectOption } from "@/web-client/forms/types";
import type { UsageDocumentationSection } from "@/components/UsageDocumentation/usage-documentation.helpers";

export const ATTENDANCE_AUDIT_FIELD_LABELS = {
  type: "Tipo",
  scheduledDate: "Data",
  professionalId: "Profissional",
  status: "Status",
  notes: "Observações",
  closingNotes: "Parecer de encerramento",
  occurrenceId: "Ocorrência de origem",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

export const ATTENDANCE_TYPE_LABELS: Record<string, string> = {
  SOCIAL: "Social",
  PSICOLOGICO: "Psicológico",
};

export const ATTENDANCE_TYPE_OPTIONS: SelectOption[] = [
  { value: "SOCIAL", label: "Social" },
  { value: "PSICOLOGICO", label: "Psicológico" },
];

export const ATTENDANCE_CASE_STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  ENCERRADO: "Encerrado",
};

export const ATTENDANCE_CASE_STATUS_OPTIONS: SelectOption[] = [
  { value: "ABERTO", label: "Aberto" },
  { value: "ENCERRADO", label: "Encerrado" },
];

export const ATTENDANCE_PERSON_ROLE_LABELS: Record<string, string> = {
  ATENDIDO_PRINCIPAL: "Atendido principal",
  ATENDIDO_SECUNDARIO: "Atendido secundário",
  FAMILIAR: "Familiar",
};

export const ATTENDANCE_PERSON_ROLE_OPTIONS: SelectOption[] = [
  { value: "ATENDIDO_PRINCIPAL", label: "Atendido principal" },
  { value: "ATENDIDO_SECUNDARIO", label: "Atendido secundário" },
  { value: "FAMILIAR", label: "Familiar" },
];

export const ATTENDANCE_USAGE_TEXT = {
  detail: {
    title: "Atendimentos",
    sections: [
      {
        title: "Dados principais",
        items: [
          "Informe tipo, data e o profissional responsável. A ocorrência de origem é opcional - deixe em branco para um atendimento espontâneo.",
          "O parecer de encerramento é obrigatório antes de marcar o atendimento como 'Encerrado'. Diferente da Ocorrência, um atendimento encerrado pode ser reaberto.",
        ],
      },
      {
        title: "Pessoas atendidas",
        items: [
          "Use a aba Pessoas para vincular quem participa do atendimento (atendido principal, atendido secundário ou familiar).",
        ],
      },
      {
        title: "Evoluções",
        items: [
          "Registre uma evolução por visita/sessão, com data e observação - não há limite de registros.",
        ],
      },
      {
        title: "Benefícios",
        items: [
          "Lance benefícios concretos entregues (cesta básica, auxílio etc.) vinculados a este atendimento.",
        ],
      },
    ] satisfies UsageDocumentationSection[],
  },
} as const;
