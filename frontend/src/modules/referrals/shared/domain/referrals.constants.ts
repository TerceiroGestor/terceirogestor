import type { SelectOption } from "@/web-client/forms/types";
import type { UsageDocumentationSection } from "@/components/UsageDocumentation/usage-documentation.helpers";

export const REFERRAL_AUDIT_FIELD_LABELS = {
  type: "Tipo",
  destinationId: "Rede de destino",
  status: "Status",
  outcomeNotes: "Desfecho",
  evolutionId: "Evolução de origem",
  attendanceId: "Atendimento de origem",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

export const REFERRAL_TYPE_LABELS: Record<string, string> = {
  SAUDE: "Saúde",
  EDUCACAO: "Educação",
  CONSELHO_TUTELAR: "Conselho Tutelar",
  ASSISTENCIA_SOCIAL: "Assistência Social",
  JURIDICO: "Jurídico",
  OUTRO: "Outro",
};

export const REFERRAL_TYPE_OPTIONS: SelectOption[] = [
  { value: "SAUDE", label: "Saúde" },
  { value: "EDUCACAO", label: "Educação" },
  { value: "CONSELHO_TUTELAR", label: "Conselho Tutelar" },
  { value: "ASSISTENCIA_SOCIAL", label: "Assistência Social" },
  { value: "JURIDICO", label: "Jurídico" },
  { value: "OUTRO", label: "Outro" },
];

export const REFERRAL_STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ACOMPANHAMENTO: "Em acompanhamento",
  ENCERRADO: "Encerrado",
};

export const REFERRAL_STATUS_OPTIONS: SelectOption[] = [
  { value: "ABERTO", label: "Aberto" },
  { value: "EM_ACOMPANHAMENTO", label: "Em acompanhamento" },
  { value: "ENCERRADO", label: "Encerrado" },
];

export const REFERRAL_USAGE_TEXT = {
  detail: {
    title: "Encaminhamentos",
    sections: [
      {
        title: "Dados principais",
        items: [
          "Todo encaminhamento nasce de uma Evolução - abra o Atendimento, entre na evolução e use o botão 'Registrar encaminhamento'.",
          "A Rede de destino é um cadastro próprio - selecione uma existente ou crie uma nova (+) direto no formulário.",
          "O status avança sozinho: aberto → em acompanhamento → encerrado. Não dá pra voltar o status.",
          "O desfecho (texto livre) é obrigatório antes de marcar como 'Encerrado'.",
          "Se a rede não responder, encerre este encaminhamento e abra um novo pra mesma situação - não existe reabertura.",
        ],
      },
      {
        title: "Anexos",
        items: ["Use a aba Anexos para guardar ofícios, protocolos e comprovantes de envio."],
      },
    ] satisfies UsageDocumentationSection[],
  },
} as const;
