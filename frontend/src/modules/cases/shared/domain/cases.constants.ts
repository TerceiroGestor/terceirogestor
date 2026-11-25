import type { SelectOption } from "@/web-client/forms/types";
import type { UsageDocumentationSection } from "@/components/UsageDocumentation/usage-documentation.helpers";

export const CASE_AUDIT_FIELD_LABELS = {
  title: "Título",
  summary: "Resumo",
  status: "Status",
  closingNotes: "Parecer de encerramento",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

export const CASE_STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  ENCERRADO: "Encerrado",
};

export const CASE_STATUS_OPTIONS: SelectOption[] = [
  { value: "ABERTO", label: "Aberto" },
  { value: "ENCERRADO", label: "Encerrado" },
];

export const CASE_USAGE_TEXT = {
  detail: {
    title: "Casos",
    sections: [
      {
        title: "Dados principais",
        items: [
          "Use o Caso pra amarrar Ocorrências e Atendimentos da mesma situação, pra ter visão histórica consolidada.",
          "O parecer de encerramento é obrigatório antes de marcar como 'Encerrado' - e o caso pode ser reaberto depois, se a situação voltar.",
        ],
      },
      {
        title: "Pessoas",
        items: ["Vincule aqui todas as pessoas envolvidas na situação (atendido, familiares etc.)."],
      },
      {
        title: "Relatório",
        items: [
          "A aba Relatório soma automaticamente quantos atendimentos, evoluções, encaminhamentos e benefícios vieram dos Atendimentos/Ocorrências vinculados a este Caso.",
        ],
      },
    ] satisfies UsageDocumentationSection[],
  },
} as const;
