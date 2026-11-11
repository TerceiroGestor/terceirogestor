import type { SelectOption } from "@/web-client/forms/types";
import type { UsageDocumentationSection } from "@/components/UsageDocumentation/usage-documentation.helpers";

export const PEOPLE_GROUP_AUDIT_FIELD_LABELS = {
  name: "Nome",
  groupType: "Tipo do grupo",
  purpose: "Finalidade",
  category: "Categoria",
  description: "Descrição",
  ageMin: "Idade mínima",
  ageMax: "Idade máxima",
  isActive: "Status",
  internalNotes: "Notas internas",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
} as const;

export const PEOPLE_GROUP_TYPE_OPTIONS: SelectOption[] = [
  { value: "CYCLE", label: "Ciclo/Turma" },
  { value: "SEGMENT", label: "Segmento" },
  { value: "TEAM_POOL", label: "Equipe" },
  { value: "NETWORK", label: "Rede" },
  { value: "OTHER", label: "Outro" },
];

export const PEOPLE_GROUP_PURPOSE_OPTIONS: SelectOption[] = [
  { value: "PUBLICO", label: "Público atendido" },
  { value: "EQUIPE", label: "Equipe institucional" },
];

export const PEOPLE_GROUP_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "Ciclo", label: "Ciclo" },
  { value: "Público", label: "Público" },
  { value: "Equipe", label: "Equipe" },
  { value: "Relacionamento", label: "Relacionamento" },
  { value: "Rede", label: "Rede" },
  { value: "Outro", label: "Outro" },
];

export const PEOPLE_GROUP_USAGE_TEXT = {
  detail: {
    title: "Grupos de Pessoas",
    sections: [
      {
        title: "Dados principais",
        items: [
          "Edite nome, tipo do grupo, finalidade, categoria e status diretamente no detalhe.",
          "Use o tipo 'Ciclo/Turma' para turmas escolares e ciclos que participam de atividades.",
          "Preencha a faixa etária apenas quando ela fizer parte da regra do grupo.",
        ],
      },
      {
        title: "Participantes",
        items: [
          "Use a aba Pessoas para adicionar ou encerrar participantes vinculados.",
          "Clique em uma pessoa vinculada para abrir o detalhe relacionado.",
        ],
      },
      {
        title: "Painel lateral",
        items: [
          "Notas internas, histórico e contexto apoiam a consulta operacional do grupo.",
          "A auditoria reúne as alterações do grupo e dos vínculos.",
        ],
      },
    ] satisfies UsageDocumentationSection[],
  },
} as const;
