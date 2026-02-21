"use client";

export const PANTRY_OVERVIEW_USAGE = {
  title: "Despensa",
  sections: [
    {
      title: "Visão geral (o que é este módulo?)",
      items: [
        "A Despensa controla o estoque por alimento, setor físico e por lote (validade).",
        "Entradas aumentam o estoque (ex.: doação/compra). Saídas diminuem o estoque (ex.: atendimentos/eventos).",
        "Quando há validade, o sistema organiza os lotes para ajudar a consumir primeiro os que vencem antes.",
      ],
    },
    {
      title: "Como começar (passo a passo)",
      items: [
        "1) Cadastre o alimento (nome, unidade e estoque mínimo).",
        "2) Registre uma entrada (lote) informando setor, quantidade e validade (se houver).",
        "3) Para consumir, use a tela de movimentação (saída rápida) clicando em uma linha do estoque.",
      ],
    },
    {
      title: "Estoque por setor (tabela principal)",
      items: [
        "Mostra o saldo físico por setor e o saldo total do alimento.",
        "Mostra alertas: abaixo do mínimo e situação de validade.",
        "Clique em uma linha para abrir “Movimentar estoque” e registrar saída com base nos lotes daquele alimento.",
      ],
    },
    {
      title: "Movimentar estoque (saída rápida por lote)",
      items: [
        "Coluna Histórico: lista apenas as ENTRADAS (lotes), ordenadas por validade (mais próxima primeiro).",
        "Botão “Usar” no lote: seleciona o lote e preenche o formulário com setor/unidade do lote (você pode limpar).",
        "Coluna Formulário de saída: informe quantidade, tipo (Atendidos/Doações/Eventos/Festas) e observações.",
        "Se você não selecionar um lote, o backend pode alocar automaticamente (quando aplicável).",
      ],
    },
    {
      title: "Entradas (lotes)",
      items: [
        "Uma entrada representa um lote: setor + quantidade + unidade + data + validade opcional + doador opcional.",
        "Editar entrada: alguns campos podem ficar bloqueados quando já houve consumo vinculado ao lote.",
        "Estornar entrada: cria uma saída de correção consumindo o lote (use com cuidado).",
      ],
    },
    {
      title: "Saídas (consumo/uso)",
      items: [
        "Uma saída registra o consumo: setor, quantidade, tipo e observações (evento é obrigatório para Evento/Festa).",
        "Editar saída: ajusta os dados; o sistema pode recalcular a alocação por lote quando necessário.",
        "Estornar saída: cria entradas de correção devolvendo o estoque aos lotes alocados (validade/setor).",
      ],
    },
    {
      title: "Alertas (vencidos) e Histórico",
      items: [
        "Alertas: clique no sino no topo da página para abrir o menu de notificações (vencidos e próximos vencimentos: 30/15/7 dias).",
        "No menu de alertas, clique em um item para abrir a movimentação já filtrada no setor.",
        "Histórico: lista movimentos recentes (entradas e saídas). Clique para abrir a edição do movimento.",
      ],
    },
    {
      title: "Unidade e validade (boas práticas)",
      items: [
        "Defina a unidade padrão no cadastro do alimento (ex.: kg, g, unidade, l).",
        "Use a mesma unidade nos lotes daquele alimento para evitar confusão na leitura do estoque.",
        "Quando existir validade, preencha no lote para o sistema priorizar o consumo dos mais próximos.",
      ],
    },
    {
      title: "Permissões (quando algo não aparece)",
      items: [
        "Para ver as telas: precisa de pantry.read.",
        "Para criar registros: precisa de pantry.create.",
        "Para editar: precisa de pantry.update. Para excluir: pantry.delete.",
      ],
    },
  ],
} as const;
