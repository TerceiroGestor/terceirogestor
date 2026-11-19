"use client";

export const ACTION_CREATE_TEXT = {
  breadcrumbTitle: "Nova atividade",
  breadcrumbItems: [{ label: "Atividades", href: "/actions" }, { label: "Nova atividade" }],
  pageTitle: "Nova atividade",
  pageSubtitle: "Nova atividade",
  noAccessTitle: "Nova atividade",
  noAccessSubtitle: "Você não tem permissão para criar atividades.",
  requestAccessHint: "Solicite acesso ao administrador do sistema.",
  loadErrorTitle: "Falha ao carregar dados",
  loadErrorFallback: "Tente novamente.",
  validations: {
    projectRequired: "Selecione um projeto",
    typeRequired: "Selecione um tipo",
    titleRequired: "Informe um título",
    cycleRequired: "Selecione um Grupos",
  },
  toasts: {
    created: "Atividade criada",
    createFailed: "Falha ao criar atividade",
  },
  form: {
    projectLabel: "Projeto",
    projectPlaceholder: "Selecione um projeto",
    titleLabel: "Título",
    titlePlaceholder: "Ex.: Oficina de artes",
    typeLabel: "Tipo",
    typePlaceholder: "Selecione um tipo",
    targetLabel: "Direcionamento",
    statusLabel: "Status",
    cycleLabel: "Grupos",
    cyclePlaceholder: "Selecione um Grupos",
    plannedStartLabel: "Início planejado",
    plannedEndLabel: "Término planejado",
    submitLabel: "Criar atividade",
    cancelLabel: "Voltar",
  },
  usage: {
    title: "Criar atividade",
    sections: [
      {
        title: "Selecionar projeto",
        items: [
          "Selecione um projeto para associar a atividade.",
          "Se houver apenas um projeto disponível, ele pode vir pré-selecionado.",
        ],
      },
      {
        title: "Tipo e escopo",
        items: [
          "Escolha o tipo: ele define se a atividade é do projeto, de um Grupos de participantes ou de um Grupos.",
          "Selecione o direcionamento correspondente para manter a atividade ligada ao público correto.",
        ],
      },
      {
        title: "Planejamento",
        items: [
          "Preencha datas planejadas para facilitar relatórios e organização.",
          "Use o campo de planejamento para detalhar o que será feito.",
        ],
      },
    ],
  },
} as const;
