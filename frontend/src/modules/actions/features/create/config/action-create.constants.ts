"use client";

export const ACTION_CREATE_TEXT = {
  breadcrumbTitle: "Nova ação",
  breadcrumbItems: [{ label: "Ações", href: "/actions" }, { label: "Nova ação" }],
  pageTitle: "Nova ação",
  pageSubtitle: "Planejamento inicial da ação.",
  noAccessTitle: "Nova ação",
  noAccessSubtitle: "Você não tem permissão para criar ações.",
  requestAccessHint: "Solicite acesso ao administrador do sistema.",
  loadErrorTitle: "Falha ao carregar dados",
  loadErrorFallback: "Tente novamente.",
  validations: {
    projectRequired: "Selecione um projeto",
    typeRequired: "Selecione um tipo",
    titleRequired: "Informe um título",
    groupRequired: "Selecione um grupo",
    cycleRequired: "Selecione um ciclo",
  },
  toasts: {
    created: "Ação criada",
    createFailed: "Falha ao criar ação",
  },
  form: {
    projectLabel: "Projeto",
    projectPlaceholder: "Selecione um projeto",
    titleLabel: "Título",
    titlePlaceholder: "Ex.: Oficina de artes",
    typeLabel: "Tipo",
    typePlaceholder: "Selecione um tipo",
    statusLabel: "Status",
    groupLabel: "Grupo",
    groupPlaceholder: "Selecione um grupo",
    cycleLabel: "Ciclo",
    cyclePlaceholder: "Selecione um ciclo",
    plannedStartLabel: "Início planejado",
    plannedEndLabel: "Término planejado",
    planLabel: "Planejamento",
    planHelper: "Descreva objetivos, materiais, metodologia e etapas.",
    submitLabel: "Criar ação",
    cancelLabel: "Voltar",
  },
  steps: [
    {
      title: "Básico",
      description: "Projeto, título, tipo e status.",
      fields: ["projectId", "title", "actionTypeId", "status"],
    },
    {
      title: "Escopo",
      description: "Grupo e/ou Ciclo (quando aplicável).",
      fields: ["groupId", "cycleId"],
    },
    {
      title: "Planejamento",
      description: "Datas planejadas e descrição do plano.",
      fields: ["plannedStartAt", "plannedEndAt", "planHtml"],
    },
  ],
  usage: {
    title: "Criar ação",
    sections: [
      {
        title: "Selecionar projeto",
        items: [
          "Selecione um projeto para associar a ação.",
          "Se houver apenas um projeto disponível, ele pode vir pré-selecionado.",
        ],
      },
      {
        title: "Tipo e escopo",
        items: [
          "Escolha o Tipo: ele define se a ação é do Projeto, de um Grupo ou de um Ciclo.",
          "Se o tipo for Grupo, selecione o Grupo. Se for Ciclo, selecione o Ciclo.",
        ],
      },
      {
        title: "Planejamento",
        items: [
          "Preencha datas planejadas para facilitar relatórios e organização.",
          "Use o campo de Planejamento para detalhar o que será feito.",
        ],
      },
    ],
  },
} as const;
