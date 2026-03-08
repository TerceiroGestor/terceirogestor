# Gantt View Roadmap

## Objetivo

Registrar as evolucoes desejadas para a `GanttView` compartilhada do `web-client`, separando:

- melhorias de leitura visual
- melhorias de interacao
- melhorias de contrato reutilizavel
- melhorias de backend/dados
- melhorias de performance e escala

Este documento serve como backlog tecnico para evoluir o `Gantt` sem perder consistencia entre modulos.

## Escopo atual entregue

Hoje a `GanttView` ja suporta:

- visualizacao temporal por tarefa
- agrupamento por campos declarados no contrato
- escalas `week`, `month` e `quarter`
- linha de hoje
- clique para abrir `detail`
- dependencias visuais entre tarefas
- selecao visual de dependencia
- destaque de tarefa bloqueada e tarefa relacionada
- `milestone` explicito
- subtarefas colapsaveis
- drag e resize de faixa de data
- restricao de range por item filho

## Principios para as proximas evolucoes

- manter o `Gantt` como `view` declarativa do `web-client`
- evitar logica ad-hoc de modulo dentro do renderer
- usar o `SearchPanelMenu` como area principal de analise/configuracao
- preservar leitura limpa, com densidade alta e pouco ruido visual
- permitir avancar em camadas: primeiro visualizacao, depois operacao assistida, depois automacao

## Roadmap Prioritario

### P0 - Leitura e operacao imediata

- Destacar toda a cadeia de dependencias da tarefa focada, nao so uma linha clicada.
- Permitir foco em uma tarefa e realce de:
  - predecessoras
  - sucessoras
  - subtarefas
- Exibir resumo persistente da selecao:
  - bloqueada por
  - desbloqueia
  - quantidade de subtarefas
  - prazo total
- Melhorar labels de barras pequenas:
  - texto fora da barra
  - fallback para descricao curta
  - truncamento com tooltip
- Exibir marcadores de atraso diretamente na barra:
  - atrasada
  - vence hoje
  - sem data
- Diferenciar visualmente:
  - tarefa
  - subtarefa
  - milestone
  - tarefa bloqueada

### P1 - Navegacao e produtividade

- Zoom mais rico:
  - `day`
  - `week`
  - `month`
  - `quarter`
  - `year`
- Scroll para:
  - hoje
  - data de inicio do item selecionado
  - primeira tarefa atrasada
- Modo de foco:
  - mostrar so grupo ativo
  - mostrar so tarefa selecionada + cadeia
- Ordenacao contextual dentro do grupo:
  - por inicio
  - por entrega
  - por prioridade
  - por responsavel
  - por progresso
- Colapso/expansao em lote:
  - expandir tudo
  - recolher tudo
  - expandir grupo

### P1 - Dependencias mais fortes

- Tooltip/inspecao da dependencia ao passar o mouse.
- Selecionar uma tarefa e visualizar automaticamente:
  - quem bloqueia
  - quem depende dela
- Tipos de dependencia explicitos:
  - finish-to-start
  - start-to-start
  - finish-to-finish
  - start-to-finish
- Validacao visual de conflito:
  - dependencia impossivel
  - predecessor termina depois do inicio permitido
  - cadeia com atraso propagado
- Aviso de ciclo de dependencia.

### P1 - Milestones e marcos

- Campo explicito de `milestone` ja existe em `tasks`, mas pode evoluir com:
  - icones diferentes por tipo de marco
  - cor por categoria
  - label compacta ao lado do diamante
- Permitir milestones sem barra pai.
- Permitir agrupamento/analise por `milestone`.

## Roadmap de Interacao Avancada

### P2 - Edicao assistida no proprio Gantt

- Drag com snap por escala ativa.
- Resize com preview mais claro de datas.
- Confirmacao opcional antes de persistir mudancas.
- Undo local apos mover ou redimensionar.
- Edicao por teclado:
  - mover 1 dia
  - mover 1 semana
  - expandir/reduzir faixa
- Criacao rapida de subtarefa dentro do grupo da tarefa pai.

### P2 - Operacao por subtarefas

- Criar subtarefa diretamente a partir da linha da tarefa.
- Reordenar subtarefas no proprio Gantt.
- Mostrar faixa agregada da tarefa pai baseada nas subtarefas.
- Aviso quando subtarefa estiver fora da janela ideal do pai.
- Comparar progresso da tarefa com progresso consolidado das subtarefas.

### P2 - Selecoes e acoes em lote

- Multi-select de tarefas.
- Acao em lote:
  - mover prazo
  - alterar responsavel
  - alterar status
  - criar milestone
- Aplicar deslocamento em cadeia para subtarefas/dependentes.

## Roadmap de Contrato Reutilizavel

### P1 - Evolucao do `GanttViewConfig`

Adicionar ao contrato compartilhado:

- `milestoneField`
- `dependencyField`
- `childCollectionField`
- `constraintWindow`
- `defaultExpandMode`
- `scaleOptions` mais amplas
- `supportsInlineEdit`
- `supportsDependencies`
- `supportsChildren`
- `supportsMilestones`
- `rowBadges`
- `legend`

### P2 - Analise por view

Levar para `SearchPanelMenu`:

- ordenacao do Gantt
- zoom/escala
- filtros especificos de prazo
- mostrar/ocultar dependencias
- mostrar/ocultar subtarefas
- mostrar/ocultar milestones
- focar em atrasadas / criticas / bloqueadas

### P2 - Politicas de edicao

Padronizar no contrato:

- `movePolicy`
- `resizePolicy`
- `childRangePolicy`
- `dependencyShiftPolicy`
- `snapToScale`
- `confirmOnDrop`

## Roadmap de Backend e Modelo de Dados

### P1 - Dados minimos recomendados por modulo

Para um `Gantt` forte, o modulo deve poder declarar:

- `startDate`
- `dueDate`
- `progress`
- `isMilestone`
- `dependencies`
- `children`
- `owner`
- `status`
- `priority`

### P2 - Dados evolutivos

- baseline:
  - `baselineStartDate`
  - `baselineDueDate`
- estimativa:
  - `plannedEffort`
  - `actualEffort`
- dependencia tipada
- caminho critico calculado
- atraso herdado por cadeia
- calendario util:
  - dias uteis
  - feriados
  - indisponibilidades

### P3 - Execucao server-side

- agregacoes de grande volume no backend
- query otimizada por janela temporal
- endpoints para:
  - dependencia expandida
  - caminho critico
  - conflitos
  - resumo por grupo

## Roadmap Visual

### P0 - Clareza

- legenda discreta de estados visuais
- melhor contraste para dependencias selecionadas
- melhor contraste entre tarefa e subtarefa
- barra pai com leitura de titulo mais estavel

### P1 - Densidade

- modo compacto
- modo confortavel
- alturas diferentes por nivel
- esconder metadados secundarios em telas menores

### P1 - Responsividade

- modo reduzido para tablet
- degradacao controlada para mobile
- fallback para lista temporal quando a area util for insuficiente

## Roadmap de Exportacao e Compartilhamento

- exportar Gantt com:
  - barras
  - dependencias
  - labels externas
  - grupo ativo
- copiar snapshot da janela atual
- gerar imagem/PDF do range visivel
- compartilhar estado exato via URL

## Roadmap de Acessibilidade

- navegacao por teclado nas linhas
- foco visivel nas barras
- leitura textual da dependencia selecionada
- labels sem depender apenas de cor
- suporte a leitores de tela para:
  - item
  - periodo
  - dependencia
  - progresso

## Roadmap de Performance

- virtualizacao vertical de linhas
- virtualizacao horizontal por colunas temporais
- memoizacao de geometria de barras
- render incremental de dependencias
- threshold para esconder labels externas em datasets grandes
- modo simplificado para mais de N itens

## Roadmap especifico para `tasks`

- destacar SLA da tarefa dentro do Gantt
- identificar responsavel sobrecarregado
- mostrar tarefas recorrentes
- mostrar dependencias entre tarefas de times diferentes
- permitir criar milestone de entrega de sprint/ciclo
- mostrar barra agregada por projeto/time no futuro

## Ordem recomendada de execucao

1. cadeia completa de dependencias por foco
2. ordenacao e filtros de Gantt no `SearchPanelMenu`
3. zoom `day` e `year`
4. tooltips e resumo rico da selecao
5. tipos de dependencia
6. baseline e conflito de cronograma
7. virtualizacao e modo para grandes volumes
8. exportacao de Gantt
9. drag/reschedule com politica de cadeia

## Criterio de pronto para proxima fase

Antes de entrar em caminho critico, baseline e dependencia tipada, o `Gantt` deveria ter:

- foco em tarefa com cadeia destacada
- zoom suficiente para operacao real
- filtros/analise centralizados no painel
- leitura boa de barras pequenas
- comportamento previsivel para subtarefas
- exportacao basica do estado visivel
