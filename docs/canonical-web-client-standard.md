# PadrÃ£o CanÃ´nico do Web Client

## Objetivo

Todo mÃ³dulo do sistema deve usar a mesma estrutura visual e comportamental. O usuÃ¡rio nÃ£o deve reaprender a interface ao mudar de mÃ³dulo.

## Estrutura obrigatÃ³ria

Cada mÃ³dulo canÃ´nico tem:

1. rota principal `/module`
2. detail em `/module/new` e `/module/[id]`
3. list principal com `RecordListHost`
4. detail com `DetailShellEngine`
5. side padrÃ£o com `StandardDetailMetadataSide`

## List Principal

O list principal Ã© sempre construÃ­do no mesmo padrÃ£o:

- botÃ£o principal `Novo`
- `SearchPanel` Ãºnico do sistema
- `Filter` e `Group` no menu do painel
- `typeviews` no mesmo conjunto padrÃ£o
- colunas base comuns do mÃ³dulo

### SearchPanel

O `SearchPanel` nÃ£o deve ganhar barras paralelas, filtros fora do menu ou controles exclusivos do mÃ³dulo.

O padrÃ£o canÃ´nico permite:

- busca textual
- favoritos
- `Filter`
- `Group`
- refresh
- contador

Se o mÃ³dulo precisar de filtros por `Projeto`, `Grupo`, `Status` ou qualquer outro campo, isso entra no prÃ³prio `SearchPanelMenu`.

### Typeviews padrÃ£o

Quando o mÃ³dulo suportar visualizaÃ§Ã£o analÃ­tica, usar somente a base compartilhada:

- `Tabela`
- `Kanban`
- `Timeline`
- `CalendÃ¡rio`
- `Gantt`
- `GrÃ¡fico`

NÃ£o criar typeview alternativo fora desses componentes.

### Colunas base

Todo list principal deve expor, quando fizer sentido:

- coluna principal do item
- `Tags`
- `Cadastro`
- `Status`

Outras colunas entram conforme o domÃ­nio, mas essas sÃ£o a base visual do sistema.

## Detail

O detail Ã© o centro de gestÃ£o do item.

### Regra de layout

O detail canÃ´nico Ã© dividido em 4 zonas:

1. `headSlot`
2. `detailSlot`
3. `sideSlot`
4. `relationSlot`

### headSlot

O `headSlot` contÃ©m:

- tÃ­tulo do item
- status
- aÃ§Ãµes de topo

Regras:

- o botÃ£o `Novo` nÃ£o aparece no detail
- a aÃ§Ã£o destrutiva principal Ã© `Excluir`, quando permitida
- `new` e `edit` usam o mesmo cabeÃ§alho e a mesma estrutura

### detailSlot

O `detailSlot` Ã© o formulÃ¡rio principal do item.

Regras:

- `new` e `edit` usam o mesmo formulÃ¡rio
- nÃ£o criar formulÃ¡rio antigo para `new` e outro para `edit`
- o formulÃ¡rio principal Ã© sempre editÃ¡vel
- o mÃ³dulo nÃ£o deve depender de `renderizador legado de formularios` legado
- os campos principais do item ficam aqui, nÃ£o no `sideSlot`

### sideSlot

O `sideSlot` Ã© Ãºnico e padronizado.

Abas canÃ´nicas (padrÃ£o a partir de 2026-11-18): **apenas 4**, nesta ordem:

- `Tags`
- `Notas`
- `Anexos`
- `Auditoria`

Regras:

- `Tags` ficam somente no `sideSlot`
- nÃ£o duplicar `Tags` no corpo principal
- `Notas` usa rich text com mencao por `@` (`richText: true` + `mentionUsers`
  no `StandardDetailMetadataSide`) - isso cobre a necessidade de conversa/
  anotacao sobre o item, entao `Comentarios` nao existe mais como aba
  separada
- `Anexos` usam o fluxo padrÃ£o de upload e exclusÃ£o
- `Auditoria` mostra o historico real do registro (quem mudou o que e
  quando); nao existe mais uma aba `Historico` separada com feed proprio
  por modulo, nem uma aba `Contexto` - o conteudo que elas mostravam (log
  cru, metadados soltos) ou nao tinha uso real medido, ou pertence a
  Auditoria

**Legado ainda nÃ£o migrado:** People jÃ¡ segue o padrÃ£o de 4 abas; Activity
foi migrado em 2026-11-18 (ver `PLAN.md`). Projects, Programs, Tasks,
Pantry e Deposit ainda tem `Comentarios`/`Historico`/`Contexto` no
`sideSlot` - fica registrado em `docs/backlog.md` com o gatilho "proxima
vez que o modulo for mexido", nao e pra ser migrado em bloco so por causa
desta regra.

### relationSlot

O `relationSlot` representa relaÃ§Ãµes do item com outros registros.

Regras:

- relations ficam no rodapÃ© do detail
- cada relation deve se comportar como um list do sistema
- usar `ListView` e o host relacional compartilhado
- clicar em um item da relation deve abrir o detail do item relacionado
- `Novo` dentro da relation abre o fluxo de criaÃ§Ã£o relacional correto
- evitar cards operacionais isolados quando a relaÃ§Ã£o puder ser modelada como list

### Tipos de relation

Existem apenas 2 tipos canÃ´nicos de relation:

- `relation informacional`: lista relacional simples, com abertura do detail relacionado e aÃ§Ãµes de vincular/remover quando aplicÃ¡vel
- `relation operacional`: lista relacional que tambÃ©m executa operaÃ§Ã£o de negÃ³cio no prÃ³prio slot

### Relation operacional

Use `relation operacional` quando a mesma lista precisar suportar fluxo de trabalho dentro da aba ou do rodapÃ©, como:

- presenÃ§a
- nota
- destaque
- observaÃ§Ã£o
- seleÃ§Ã£o em lote
- aÃ§Ã£o por linha

Estrutura obrigatÃ³ria da `relation operacional`:

- barra superior compacta no prÃ³prio `relationSlot`
- busca no padrÃ£o do slot relacional
- filtros do domÃ­nio no topo da relation, sem criar tela paralela
- aÃ§Ãµes globais no topo (`Selecionar`, `Salvar`, `Vincular`, etc.) quando necessÃ¡rio
- mÃ©tricas compactas e textuais (`total`, `filtrados`, `alterados`, `selecionados`)
- corpo sempre em `ListView`
- aÃ§Ãµes por linha implementadas nas colunas da prÃ³pria lista
- seleÃ§Ã£o em lote usando a seleÃ§Ã£o nativa do `ListView`
- salvamento explÃ­cito quando houver mutaÃ§Ã£o em lote
- dialog auxiliar apenas para complemento operacional, nunca como estrutura principal da relation

Regras visuais da `relation operacional`:

- nÃ£o usar card de resumo duplicando a contagem jÃ¡ exibida na relation
- nÃ£o usar subtÃ­tulo ou texto explicativo no corpo da tela
- nÃ£o usar `grade tabular legada`
- nÃ£o criar page de gestÃ£o paralela quando o fluxo puder existir no shell atual

## Regras de implementaÃ§Ã£o

### ObrigatÃ³rio

- `RecordListHost` no list principal
- `DetailShellEngine` no detail
- `StandardDetailMetadataSide` no side
- `RelationListHost` ou relation equivalente do web-client no rodapÃ©

### Proibido

- criar page paralela fora do shell padrÃ£o
- criar `SearchPanel` customizado por mÃ³dulo
- criar layout diferente entre `new` e `edit`
- deixar `Tags` no body principal
- usar componentes legados quando jÃ¡ existir capability canÃ´nica
- usar `grade tabular legada` em `list`, `detail`, `relationSlot` ou abas relacionais do fluxo canÃ´nico ativo
- usar `renderizador legado de formularios` em `/module/new`, `/module/[id]` ou formulÃ¡rio principal de mÃ³dulo canÃ´nico
- manter modulo removido ou rota legada no fluxo ativo de modulos canonicos

## Legados a eliminar do fluxo ativo

Os seguintes legados nÃ£o fazem parte do padrÃ£o canÃ´nico `1.0`:

- `grade tabular legada`: substituir por `ListView`
- `renderizador legado de formularios`: substituir pelo formulÃ¡rio principal dentro de `DetailShellEngine`
- modulos removidos do canÃ´nico: excluir do fluxo ativo, sem compatibilidade permanente

## Checklist rÃ¡pido

Um mÃ³dulo sÃ³ Ã© canÃ´nico quando:

- `/module` usa o list padrÃ£o
- `/module/new` abre o detail padrÃ£o
- `/module/[id]` usa o mesmo detail padrÃ£o
- `sideSlot` tem a estrutura fixa
- `relationSlot` usa list relacional
- relation operacional usa `ListView`, nunca `grade tabular legada`
- `SearchPanel` funciona igual aos outros mÃ³dulos
- as mesmas views estÃ£o disponÃ­veis quando o domÃ­nio suporta

## Visual do Detail

Regras de estilo, para nao depender de releitura visual tela por tela.

### Header colado nas abas (padrao a partir de 2026-11-18)

Nao usar `header.slot` pra mostrar uma barra de campos (Status/Tipo/
Periodo/Cadastro etc.) entre o titulo e as abas - isso suja a tela e
quebra a leitura visual sem agregar nada que o formulario principal ja
nao mostre. O cabecalho do Detail fica só com titulo + acoes de topo;
logo abaixo, colado, vem a lista de abas (sem nenhum espaco/elemento no
meio - `DetailShell.tsx` confirma que `headerInfoSlot` vazio nao deixa
margem nenhuma). Os campos que apareciam nessa barra (Status, Tipo,
relacionamento principal) voltam pro formulario principal, na primeira
linha dele (ver secao seguinte); um campo que nao tenha outro lugar
natural (ex.: data de cadastro) fica disponivel so via Auditoria.

Aplicado em Activity (`actions-detail-layout-contract.tsx`) em
2026-11-18. Projects, Programs e People-Groups ainda tem essa barra nos
seus `header.slot` - migrar quando esses modulos forem revisados (ver
`docs/backlog.md`), removendo a funcao que monta a barra por inteiro, nao
so escondendo.

### Abas

Toda aba de Detail (principal ou do painel lateral) usa `MODULE_TABS_LIST_CLASS_NAME` / `MODULE_TAB_TRIGGER_CLASS_NAME` de `web-client/ui/ModulePrimitives.tsx`. A aba ativa ganha fundo colorido (`bg-primary/10 text-primary font-semibold`), nunca so uma linha fina - isso e o que faz o usuario perceber qual aba esta aberta sem precisar ler o texto. Abas inativas tem hover (`hover:bg-muted/70`) para ficar obvio que sao clicaveis. Uma variante de cor diferente (ex.: ambar em "Documentos sensiveis" de People) e permitida quando a aba marca algo sensivel/especial - nesse caso o padrao e reaproveitado, so a cor muda.

Nao criar um novo estilo de aba por modulo. Se o modulo precisar de um componente de abas proprio (como o de People, que tem icones e scroll), ele ainda usa essas duas constantes para o `className` do `TabsTrigger`.

### Contagem nas abas (padrao a partir de 2026-11-18)

`DetailTabTemplate.badge?: (context) => ReactNode` (e o equivalente do painel
lateral, `DetailSideTabItem.badge`) ja existem na infra e ja sao renderizados
por `DetailTabsRenderer`/`DetailSideTabs` exatamente da mesma forma (numero
discreto ao lado do rotulo, some quando o valor e `0`/`undefined`). Usar
`badge` em toda aba principal que representa uma lista, sempre que a
contagem ja estiver disponivel no `context` sem fetch extra (ex.:
`badge: (ctx) => ctx.algumaLista.length || undefined`). Nao forcar um
pre-fetch so pra popular a contagem de uma aba que ainda nao foi aberta -
nesse caso a aba simplesmente fica sem badge (campo opcional, "desativado"
e so nao preencher). Abas que nao sao lista (ex.: um formulario) nunca
ganham badge.

### Filtro de periodo na relation (`dateRange`, padrao a partir de 2026-11-18)

`DetailRelationFilterConfig` aceita `type: "dateRange"` alem de `type:
"select"`, renderizado no mesmo lugar (barra de filtro ao lado da busca,
dentro do toolbar do `relationSlot`) via `DateRangeFilterButton`
(`web-client/ui/DateRangeFilterButton.tsx`): botao compacto com icone de
calendario, mostra o intervalo formatado quando preenchido ou um texto
placeholder quando vazio, abre um `Popover` com `Calendar` (shadcn,
`mode="range"`) e um botao "Limpar". Nunca voltar a usar um par solto de
`<Input type="date">` fora do toolbar da relation - isso e o que o filtro
de periodo da Atividade (aba Participantes) tinha antes e foi substituido.
`components/ui/calendar.tsx` foi corrigido nesta mesma rodada para as
chaves de `classNames` da v9 do react-day-picker (a v8 usava
`head_row`/`day_selected`/etc., a v9 renomeou pra `weekdays`/`selected`/etc.,
e as chaves antigas sao ignoradas em silencio, sem erro, so o estilo
quebra) e ganhou `locale={ptBR}` por padrao - qualquer novo uso do
`Calendar` compartilhado ja herda os dois.

### FormulÃ¡rio principal (`detailSlot`)

- Nao usar titulo + paragrafo descritivo em cabecalho de secao. Se o campo precisar de contexto, o contexto vai no `placeholder` ou em texto de ajuda inline no proprio campo - nunca um paragrafo de 1-2 linhas acima da secao.
- Cabecalho de secao (quando o formulario tem mais de um grupo de campos) usa `DetailSectionHeading` de `web-client/detail/DetailFormSection.tsx`: titulo curto + barra de acento colorida a esquerda. Sem linha divisoria cinza, sem descricao.
- Rotulo de campo usa `DetailSectionField` do mesmo arquivo: label pequeno em maiusculas acima do campo. Nao reimplementar esse label por modulo (varios modulos tinham a mesma constante `fieldLabelClassName`/`SectionField` copiada - foi consolidado).
- Formulario com 1 grupo so de campos (sem sub-secoes) pode usar `DetailSectionField` direto, sem `DetailSectionHeading`.

### Nao e regra do Detail

`ModuleSectionHeader` (tambem em `ModulePrimitives.tsx`) continua existindo e pode usar `description` - ele e para cabecalho de lista/relation/overview, nao para o formulario principal do Detail. Nao confundir os dois.
