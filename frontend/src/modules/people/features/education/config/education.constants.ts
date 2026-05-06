export const EDUCATION_STATUS_OPTIONS = [
  { value: "Cursando", label: "Cursando" },
  { value: "Concluído", label: "Concluído" },
  { value: "Interrompido", label: "Interrompido" },
  { value: "Não informado", label: "Não informado" },
] as const;

export const EDUCATION_LEVEL_SUGGESTIONS = [
  "Não alfabetizado",
  "Alfabetizado",
  "Ensino fundamental incompleto",
  "Ensino fundamental completo",
  "Ensino médio incompleto",
  "Ensino médio completo",
  "Ensino superior incompleto",
  "Ensino superior completo",
  "Pós-graduação",
] as const;

export const EDUCATION_GRADE_OPTIONS = [
  "Creche",
  "Pre-escola",
  "1 ano",
  "2 ano",
  "3 ano",
  "4 ano",
  "5 ano",
  "6 ano",
  "7 ano",
  "8 ano",
  "9 ano",
  "1 serie",
  "2 serie",
  "3 serie",
] as const;

export const EDUCATION_TEXT = {
  cardTitle: "Educação",
  cardSubtitle: "Escolaridade e histórico escolar",
  emptyState: "Nenhum registro de escolaridade cadastrado.",
  dialog: {
    createTitle: "Adicionar escolaridade",
    editTitle: "Editar escolaridade",
    description: "Registre o nível atual e o histórico (se necessário).",
  },
  form: {
    levelLabel: "Nível",
    levelPlaceholder: "Ex: Ensino médio completo",
    statusLabel: "Situação",
    institutionLabel: "Instituição",
    institutionPlaceholder: "Nome da escola/instituição",
    gradeLabel: "Série/Ano",
    gradePlaceholder: "Ex: 8º ano, 2º ano",
    schoolYearLabel: "Ano letivo",
    schoolYearPlaceholder: "Ex: 2025",
    isCurrentLabel: "Registro atual",
    startDateLabel: "Início",
    endDateLabel: "Fim",
    notesLabel: "Observações",
    notesPlaceholder: "Observações relevantes",
    submitCreate: "Salvar",
    submitEdit: "Atualizar",
  },
  actions: {
    new: "Nova escolaridade",
  },
} as const;

