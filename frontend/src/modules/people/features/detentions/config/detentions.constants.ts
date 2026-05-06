export const DETENTIONS_TEXT = {
  cardTitle: "Reclusão",
  cardSubtitle: "Situação e histórico de reclusão",
  emptyState: "Nenhum registro de reclusão cadastrado.",
  dialog: {
    createTitle: "Adicionar reclusão",
    editTitle: "Editar reclusão",
    description: "Registre a situação, período e observações relevantes.",
  },
  form: {
    statusLabel: "Situação",
    statusPlaceholder: "Ex: Em reclusão, Medida socioeducativa",
    typeLabel: "Tipo",
    typePlaceholder: "Ex: Fechado, Semiaberto, Internação",
    unitLabel: "Unidade/Local",
    unitPlaceholder: "Ex: Unidade X",
    startDateLabel: "Início",
    endDateLabel: "Fim",
    notesLabel: "Observações",
    notesPlaceholder: "Observações relevantes",
    submitCreate: "Salvar",
    submitEdit: "Atualizar",
  },
  actions: {
    new: "Nova reclusão",
  },
} as const;

export const DETENTION_STATUS_OPTIONS = [
  { value: "Em reclusao", label: "Em reclusao" },
  { value: "Medida socioeducativa", label: "Medida socioeducativa" },
  { value: "Egresso", label: "Egresso" },
  { value: "Sem informacao", label: "Sem informacao" },
] as const;

export const DETENTION_TYPE_OPTIONS = [
  { value: "Fechado", label: "Fechado" },
  { value: "Semiaberto", label: "Semiaberto" },
  { value: "Aberto", label: "Aberto" },
  { value: "Internacao", label: "Internacao" },
  { value: "Outro", label: "Outro" },
] as const;

