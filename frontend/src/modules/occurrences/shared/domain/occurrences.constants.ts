import type { SelectOption } from "@/web-client/forms/types";
import type { UsageDocumentationSection } from "@/components/UsageDocumentation/usage-documentation.helpers";

export const OCCURRENCE_AUDIT_FIELD_LABELS = {
  title: "Título",
  description: "Descrição",
  status: "Status",
  outcomeNotes: "Desfecho",
  meetingId: "Encontro de origem",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

export const OCCURRENCE_CASE_STATUS_LABELS: Record<string, string> = {
  REGISTRADA: "Registrada",
  EM_ANALISE: "Em análise",
  DESFECHO_DEFINIDO: "Desfecho definido",
};

export const OCCURRENCE_CASE_STATUS_OPTIONS: SelectOption[] = [
  { value: "REGISTRADA", label: "Registrada" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "DESFECHO_DEFINIDO", label: "Desfecho definido" },
];

export const OCCURRENCE_PERSON_ROLE_LABELS: Record<string, string> = {
  ENVOLVIDO: "Envolvido",
  TESTEMUNHA: "Testemunha",
};

export const OCCURRENCE_USAGE_TEXT = {
  detail: {
    title: "Ocorrências",
    sections: [
      {
        title: "Dados principais",
        items: [
          "Registre o fato logo que acontecer - título e descrição curtos já bastam.",
          "O status avança sozinho: registrada → em análise → desfecho definido. Não dá pra voltar o status.",
          "O desfecho (texto livre) é obrigatório antes de marcar como 'Desfecho definido'.",
        ],
      },
      {
        title: "Envolvidos",
        items: [
          "Use a aba Envolvidos para vincular as pessoas (papel envolvido ou testemunha).",
          "Clique em uma pessoa vinculada para abrir o detalhe relacionado.",
        ],
      },
    ] satisfies UsageDocumentationSection[],
  },
} as const;
