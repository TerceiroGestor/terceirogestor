# PadrÃ£o CanÃ´nico do Web Client

## Objetivo

Todo mÃ³dulo do sistema deve usar a mesma estrutura visual e comportamental. O usuÃ¡rio nÃ£o deve reaprender a interface ao mudar de mÃ³dulo.

Na pratica isso se resume a duas telas, cada uma com sua propria barra
de ferramentas "painelSearch" (busca + Colunas + Filtros + agrupamento +
typeview + Novo), mas as duas compartilhando o mesmo vocabulario visual
e os mesmos componentes: o List Principal do modulo (`RecordListHost`) e
cada aba de relation no rodape do Detail (`RelationListHost`). O
metadata do Detail (4 abas fixas no painel lateral, SplitView
redimensionavel) e um terceiro pedaco padronizado, independente dessas
duas telas - ver `sideSlot` mais abaixo. Atividades (modulo `actions`) e
a referencia completa das duas telas desde 2026-11-19: List Principal
com a ordem Busca->typeview->Novo, e as 4 relations do rodape
(Encontros/Participantes/Qualidade/Equipe) todas em `RelationListHost`,
sem nenhum controle solto fora do padrao Busca+[Colunas|Filtros]-
>typeview->Novo. Use Atividades como exemplo vivo ao implementar ou
revisar outro modulo, nao só esta doc.

## Estrutura obrigatÃ³ria

Cada mÃ³dulo canÃ´nico tem:

1. rota principal `/module`
2. detail em `/module/new` e `/module/[id]`
3. list principal com `RecordListHost`
4. detail com `DetailShellEngine`
5. side padrÃ£o com `StandardDetailMetadataSide`

## List Principal

O list principal Ã© sempre construÃ­do no mesmo padrÃ£o:

- `SearchPanel` Ãºnico do sistema, ocupando toda a largura disponivel
- `Filter` e `Group` no menu do painel
- `typeviews` no mesmo conjunto padrÃ£o
- botÃ£o principal `Novo`, **no final, a direita** (depois do typeview -
  ver "Visual do List e do Detail" pro detalhe visual completo: fundo
  `bg-toolbar`, contraste de hover, ordem dos elementos)
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

Se o mÃ³dulo precisar de filtros por `Projeto`, `Grupos`, `Status` ou qualquer outro campo, isso entra no prÃ³prio `SearchPanelMenu`.

### Typeviews padrÃ£o

Quando o mÃ³dulo suportar visualizaÃ§Ã£o analÃ­tica, usar somente a base compartilhada:

- `Tabela`
- `Kanban`
- `Timeline`
- `CalendÃ¡rio`
- `Gantt`
- `GrÃ¡fico`

NÃ£o criar typeview alternativo fora desses componentes.

### Dados completos para análise (padrão a partir de 2026-11-24)

Toda tela de lista que oferece Gráfico/Kanban/Timeline/Calendário/Gantt
ou agrupamento (`groupBy`) busca o conjunto filtrado **completo**
(`all: true` no backend - `resolvePagination`/`buildPaginationMeta` já
honram esse parâmetro em todo módulo, basta repassar `query.all` em vez
de hardcodar `all: false`). A paginação client-side (slice de
`rows`/`filteredRows` num `pagedRows`) é só para a visão **Tabela** -
nunca alimentar Gráfico/Kanban/Timeline/Calendário/agrupamento com a
página atual da paginação do backend.

Referência correta (`frontend/src/modules/projects/features/list/ui/projects-list-module-client-page.tsx`):
busca tudo uma vez (`all: true`), filtra (`filteredRows`) e só então
corta pra tabela (`pagedRows = filteredRows.slice(...)`); Gráfico/
Kanban/Timeline/Calendário recebem `rows`/`filteredRows` (completo),
nunca `pagedRows`.

Achado de 2026-11-24 (usuário testou e confirmou o bug): `People` e os
Doadores de Pantry/Deposit buscavam só a página atual e alimentavam
Gráfico/Kanban/`groupBy` com ela - corrigido pra esse padrão. `Actions`
já buscava tudo, mas via um loop manual de N páginas porque o backend
desse módulo nunca aceitava `all: true` - corrigido na raiz (backend
honra `all` de verdade agora, frontend virou uma chamada só).

Isso busca linha por linha pro navegador - funciona bem na escala atual
(baixos milhares de registros por tenant). Se um tenant real crescer
muito além disso, a evolução correta é um endpoint de agregação real
(contagens via SQL, sem trazer linha nenhuma) - ver `docs/backlog.md`.

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

Mecanismo pra "mesmo formulário", na prática (ver "Create reaproveita o
formulário de edit" na seção "Formulário principal" mais abaixo pro passo a
passo completo, referência: Atividade, migrada em 2026-11-20): o componente
que renderiza os campos recebe `mode` (`"create" | "edit"`) como prop e
ramifica só o que for genuinamente diferente dentro do mesmo campo (ex.: um
`<Select>` editável em `create` vs. texto read-only em `edit`, quando o
valor já é fixo) — nunca um componente de arquivo separado por modo.

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

**Legado ainda nÃ£o migrado:** People ja segue o padrao de 4 abas;
Activity foi migrado em 2026-11-18 (ver `PLAN.md`). Projects, Programs,
Tasks, Pantry e Deposit ainda tem `Comentarios`/`Historico`/`Contexto`
no `sideSlot` - fica registrado em `docs/backlog.md` com o gatilho
"proxima vez que o modulo for mexido", nao e pra ser migrado em bloco so
por causa desta regra. Occurrences e Attendances tambem nao seguem a
regra - nao passam `tags`/`notes`/`attachments` nem `tabOrder` pro
`StandardDetailMetadataSide`, entao caem no fallback de compatibilidade
do componente (mostra `Historico`+`Contexto`, que nao deveriam mais
existir, e nao mostra Tags/Notas/Anexos nenhum). Fechar isso exige
schema novo no backend (tabelas tipo `AttendanceComment`/
`AttendanceAttachment`/tag, espelhando `ProjectActionComment`/
`ProjectActionAttachment`) - nao e so mudanca de frontend, ver
`docs/backlog.md`.

### relationSlot

O `relationSlot` representa relaÃ§Ãµes do item com outros registros.

Regras:

- relations ficam no rodapÃ© do detail
- cada relation deve se comportar como um list do sistema
- usar `ListView` e o host relacional compartilhado
- clicar em um item da relation deve abrir o detail do item relacionado
- `Novo` dentro da relation segue a regra "Criar dentro de uma relation" abaixo
- evitar cards operacionais isolados quando a relaÃ§Ã£o puder ser modelada como list

### Criar dentro de uma relation: dialogo pra criar, Detail pra editar (padrao a partir de 2026-11-21, sem excecao)

Regra unica pra qualquer relation, de qualquer modulo, independente do
quao simples ou complexo for o sub-registro:

- **So existe um botao pra criar: `Novo`.** Nao criar um segundo botao
  tipo "Agendar em lote"/"Criar varios" do lado - isso suja o padrao, que
  e "so o botao Novo" em toda relation do sistema. `Novo` abre um
  dialogo - de busca+selecao quando a relation e um vinculo com uma
  entidade que ja tem Detail propria (ex.: pessoa envolvida numa
  Ocorrencia/Atendimento, responsavel de um Encontro, participante de um
  Grupo), ou de criacao (so os campos minimos necessarios) quando a
  relation e um sub-registro com campos proprios (ex.: Encontro de uma
  Atividade, vinculo familiar/financeiro/de saude de uma Pessoa). Um
  unico dialogo pode cobrir "criar um" e "criar varios de uma vez"
  (recorrencia/lote) ao mesmo tempo - nao precisa de dois fluxos
  separados: referencia viva e o Encontro
  (`BulkScheduleOccurrencesDialog`,
  `modules/actions/features/manage/ui/action-occurrences-section.tsx`),
  que gera as datas a partir de um periodo (`De`/`Ate`) + dias da semana
  marcados + passo de preview antes de confirmar - pra criar só 1
  Encontro, o usuario so precisa deixar `De` igual a `Ate` (mesmo dia) e
  marcar o dia da semana correspondente, o preview mostra exatamente 1
  data. Nenhuma relation abre uma pagina de criacao separada - antes
  disso, o Encontro abria `/meetings/new` (tela de Detail inteira) pra
  criar um avulso, com um botao separado "Agendar em lote" pro caso de
  varios - decisao explicita do usuario em 2026-11-21 unificou os dois
  num so dialogo, atras de um so botao.
- Quando o dialogo e de busca+selecao (vinculo), ele **permanece aberto
  entre selecoes** - da pra vincular varias pessoas em sequencia sem
  fechar o dialogo a cada clique, so fecha quando o usuario decide (X,
  Escape, clique fora). Referencia viva: `OccurrencePeoplePickerDialog`
  (`modules/occurrences/features/detail/ui/`). Quando o dialogo e de
  criacao de sub-registro, ele fecha sozinho apos confirmar - a lista so
  ganha a(s) linha(s) nova(s), sem navegar pra lugar nenhum.
- **Clicar numa linha ja criada sempre abre uma tela de Detail** - da
  entidade vinculada, quando for vinculo simples sem campo proprio (ex.:
  a Pessoa em `/people/[id]` - nao existe tela de Detail pro vinculo em
  si, porque ele nao tem campo alem do papel/role, editado removendo e
  re-adicionando); ou do proprio sub-registro (mesmo shell canonico -
  `DetailShellEngine`, side de 4 abas, autosave), quando ele tiver campos
  proprios - referencia viva: Encontro (`/meetings/[id]`). O dialogo de
  criacao **nunca** dobra como editor (nao reabrir o mesmo dialogo
  preenchido ao clicar numa linha - isso e o sinal de que falta a tela
  de Detail do sub-registro).

Essa regra substitui a suposicao antiga de que "criar sempre abre o
Detail em modo create": isso continua valendo pro registro raiz do
modulo (`/modulo/new`, ver Checklist rapido), mas nao se aplica a
relations dentro de um Detail - la o que importa e criar rapido (sem
navegar pra longe so pra adicionar 1 vinculo) e editar completo (sempre
ha uma tela de Detail alcancavel clicando na linha).

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
- `RelationListHost` (direto, ou via `DetailRelationTablePanel` quando a
  relation nao precisa de visualizacao alternativa) no rodapÃ© - ver
  "Visual do Detail" / "Relation no rodape do Detail" pro padrao visual
  completo. `DetailRelationsRenderer`/`DetailRelationConfig` segue
  existindo so pras relations ainda nao migradas (`docs/backlog.md`), nao
  usar em relation nova.

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

## Visual do List e do Detail

Regras de estilo, para nao depender de releitura visual tela por tela.
Cobre tanto o List Principal (`ControlPanelShell`) quanto o Detail
(`DetailShell`/`DetailTabsRenderer`/`RelationListHost`) porque, a partir
de 2026-11-19, os dois usam o mesmo vocabulario visual (`bg-toolbar`,
mesma ordem de elementos, mesmo contraste de hover) - uma tela nao deve
parecer de um sistema diferente da outra.

### O que e automatico vs o que e por modulo

A maior parte das regras desta secao vive em **componentes
compartilhados** (`ControlPanelShell.tsx`, `DetailShell.tsx`,
`DetailTabsRenderer`/`DetailLayoutSections.tsx`, `RecordListHost.tsx`,
`SearchBar.tsx`, `RecordBrowserViewSwitcher.tsx`,
`components/ui/toggle-group.tsx`) - isso significa que **todo modulo
canonico ja segue automaticamente**, sem precisar de nenhuma mudanca no
layout contract do modulo: fundo `bg-toolbar` do list principal e do
header/abas do Detail, ordem Busca→typeview→Novo, busca ocupando a
largura toda, contraste de hover/active, abas sem `gap`/`rounded` com
divisor azul curto. Nao existe "modulo X ainda nao migrou" pra essas
partes - se alguma tela nao estiver assim, e bug, nao pendencia de
rollout.

As excecoes, que **sao** opt-in e precisam de uma decisao por modulo/aba,
estao marcadas explicitamente mais abaixo: `flushToolbar`
(`RelationListHost`) + `flushContent` (`DetailTabTemplate`) +
`stickyHeaderOffsetPx` (`ListView`) - usar so quando uma relation
e o conteudo inteiro de uma aba e deve ficar com a barra (e,
opcionalmente, o cabecalho da tabela) fixa, colada nas abas acima -
referencia: aba Encontros da Atividade. O variant de cor do botao de
acao extra do header (`variant: "default"` azul vs `variant: "action"`
laranja) tambem e decisao por modulo - ver `docs/backlog.md`.

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
2026-11-18, e no Encontro (`meeting-detail-layout-contract.tsx`) em
2026-11-21 (regressao isolada - tinha escapado da migracao original,
mesmo a Atividade-mae ja estando limpa). Projects, Programs,
People-Groups, People, Occurrences e Attendances ainda tem essa barra
nos seus `header.slot` - migrar quando esses modulos forem revisados
(ver `docs/backlog.md`), removendo a funcao que monta a barra por
inteiro, nao so escondendo. **Isso nao afeta o fundo do header** (`bg-toolbar`,
proxima secao) - esse ja e automatico pra todo modulo, inclusive os 3
que ainda tem a barra antiga; a barra antiga so fica visualmente mais
cheia dentro do mesmo fundo, ate ser migrada.

### Abas

O mecanismo que coloca o formulario principal como a primeira aba
("Detalhes"), em vez de deixa-lo sempre visivel acima das abas, e a
prop `mainTab` do `DetailLayoutConfig` (`web-client/registry/types.ts`,
lida por `DetailShellEngine.tsx`) - `mainTab: true` usa
`key: "details"`/`label: "Detalhes"` por padrao, ou passe um objeto
`{ key, label }` pra customizar. E o unico jeito certo de ter abas como
controle de navegacao logo abaixo do header (ver "Header colado nas
abas") - modulo nenhum deve montar seu proprio `<Tabs>` dentro de
`main` pra isso (ver People, "Legado a eliminar" no `docs/backlog.md`).

Toda aba de Detail (principal ou do painel lateral) usa `MODULE_TABS_LIST_CLASS_NAME` / `MODULE_TAB_TRIGGER_CLASS_NAME` de `web-client/ui/ModulePrimitives.tsx`. A aba ativa ganha fundo colorido (`bg-primary/10 text-primary font-semibold`), nunca so uma linha fina - isso e o que faz o usuario perceber qual aba esta aberta sem precisar ler o texto. Abas inativas tem hover (`hover:bg-muted/70`) para ficar obvio que sao clicaveis. Uma variante de cor diferente (ex.: ambar em "Documentos sensiveis" de People) e permitida quando a aba marca algo sensivel/especial - nesse caso o padrao e reaproveitado, so a cor muda.

Nao criar um novo estilo de aba por modulo. Se o modulo precisar de um componente de abas proprio (como o de People, que tem icones e scroll), ele ainda usa essas duas constantes para o `className` do `TabsTrigger`.

**Abas principais (nao as laterais) tem 3 reforcos a mais, automaticos**
(vem de `DetailTabsRenderer`, nao das constantes `MODULE_TABS_LIST_CLASS_NAME`/
`MODULE_TAB_TRIGGER_CLASS_NAME` em si - ver "Fundo das areas de
ferramentas" pra detalhe completo): `gap-0` entre abas + `rounded-none`
nas triggers (em vez do `gap-1.5`/`rounded-md` padrao das constantes) pra
cada aba preencher 100% do espaco no hover/active sem sobra de cor atras;
um divisor azul curto (pseudo-elemento, nao `border-r`) entre cada aba; e
`hover:bg-background/80` por cima do `hover:bg-muted/70` padrao, porque
as abas principais agora ficam sobre `bg-toolbar`. As abas **laterais**
(`DetailSideTabs.tsx`) continuam exatamente como este paragrafo descreve
acima, sem nenhum dos 3 reforcos - fundo diferente (`bg-background`/
`bg-card`), entao `hover:bg-muted/70` e `gap-1.5`/`rounded-md` ja tem
contraste correto ali.

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

### Redimensionamento do painel lateral (SplitView, ja existente)

O painel lateral do Detail (`sideSlot`) e redimensionavel por arraste -
nao e um recurso novo nem especifico de modulo, ja vem de graca pra todo
modulo canonico porque mora no `DetailShell.tsx` compartilhado, nao em
cada layout contract. A alca fica na borda esquerda do painel
(`role="separator"`, `onPointerDown`), largura minima/maxima fixas
(`MIN_SIDE_WIDTH`/`MAX_SIDE_WIDTH`) e a largura escolhida persiste em
`localStorage` por usuario (nao por modulo). Confirmado identico em
People e Activity nesta revisao (2026-11-19) - nenhum dos dois precisa de
codigo proprio pra isso. Nao reimplementar esse comportamento dentro de
um layout contract de modulo; se faltar o divisor em algum lugar, o
problema esta em `hasSideSlot`/`sideOpen` nao estarem true, nao na falta
de um componente de resize novo.

### Ordem da barra do List Principal (padrao a partir de 2026-11-19)

`ControlPanelShell.tsx` e um grid de 3 colunas
(`[auto_minmax(0,1fr)_auto]`): esquerda (`actionSlot`/`leftSlot` - hoje
vazia em todo modulo, nenhum usa), centro (busca + filtro + agrupamento +
favoritos), direita (`viewSwitcherSlot` + `rightSlot` + o botao "Novo").
**"Novo" fica no final da direita, depois do typeview** - nao mais no
inicio a esquerda. Mesma ordem que `RelationListHost.tsx` ja usava
("busca → typeview → Novo", comentario no proprio codigo). A busca ocupa
toda a largura restante (sem `max-w-*`, sem `justify-center`) - antes
tinha um teto de largura e ficava centralizada, mesmo sobrando espaco
vazio dos dois lados. A coluna esquerda so entra no grid
(`lg:grid-cols-[auto_minmax(0,1fr)_auto]`) quando tem conteudo de fato;
caso contrario o grid vira 2 colunas
(`lg:grid-cols-[minmax(0,1fr)_auto]`) pra busca comecar colada na borda
esquerda, sem o gap morto que uma coluna vazia deixaria.

### Fundo das "areas de ferramentas" (`bg-toolbar`, padrao a partir de 2026-11-19)

Toda barra que agrupa busca + Colunas + Filtros + typeview + "Novo" -
seja a barra do list principal (`ControlPanelShell.tsx`), a lista de abas
do Detail (`DetailTabsRenderer`, `DetailLayoutSections.tsx`) ou a barra de
uma `relation` (`RelationListHost.tsx`) - usa o token `--toolbar` /
`--color-toolbar` (`globals.css`, light+dark) como fundo, nunca
`bg-background`/`bg-muted` direto. A intencao e o usuario reconhecer de
relance "isso e uma ferramenta" so pelo tom de cinza, em qualquer tela.
Nao criar um tom novo por modulo - sempre `bg-toolbar`.

Onde aplicar (valores conferidos no codigo em 2026-11-19, apos a rodada
final de ajuste - se o `px-4` do container pai de `DetailShell.tsx`
("w-full pb-3 pt-0 ...") for reintroduzido algum dia, todo `-mx-4`/`-mr-*`
abaixo precisa ser revisado, porque hoje nenhum deles cancela esse
`px-4` - ele nao existe mais):

- `ControlPanelShell.tsx`: a div raiz do shell inteiro (`bg-toolbar`, sem
  `backdrop-blur` - o fundo e solido, o blur so fazia sentido quando
  simulava transparencia sobre `bg-background/90`).
- `headerBlock` do Detail (`DetailShell.tsx`): `"sticky top-0 px-4 z-20
  pb-2 pt-2 bg-toolbar"` - so `px-4` direto (sem `-mx-4`, porque o
  container pai nao tem padding proprio pra cancelar), **sem** margem
  (`mb-*`) entre ele e a lista de abas logo abaixo, pra virar um unico
  bloco continuo com a mesma cor, nao duas faixas separadas.
- `DetailTabsRenderer` (`DetailLayoutSections.tsx`): o `TabsList`
  principal do Detail usa `"sticky top-0 z-10 w-auto gap-0 bg-toolbar
  px-4 lg:-mr-2"`. O `lg:-mr-2` cancela o `lg:pr-2` que o wrapper
  imediato do conteudo (`"lg:min-h-0 lg:flex-1 lg:pr-2 lg:overflow-y-auto"`
  em `DetailShell.tsx`) reserva pra scroll - sem ele sobra uma tira de
  8px sem `bg-toolbar` na borda direita em telas `lg:`; se esse `pr-2`
  mudar de valor algum dia, o `-mr-2` precisa acompanhar. Quando o
  painel lateral esta aberto, a faixa encosta exatamente na alca de
  redimensionamento, sem sobrepor. `gap-1.5` do
  `MODULE_TABS_LIST_CLASS_NAME` e sobrescrito pra `gap-0` e `rounded-md`
  do `MODULE_TAB_TRIGGER_CLASS_NAME` pra `rounded-none` (via `cn(...)`
  local, constantes compartilhadas intocadas - ver secao "Abas") pra
  cada aba preencher 100% do espaco no hover/active, sem sobra de cor de
  fundo entre elas. Cada aba tambem ganha um divisor azul entre abas
  (inclusive depois da ultima) - **nao** e um `border-r`, que ocuparia
  100% da altura e vira um "risco" visual grande; e um pseudo-elemento
  (`after:...`) de 3px de largura por 50% da altura, centralizado
  verticalmente (`relative` na trigger, `after:absolute after:top-1/2
  after:-translate-y-1/2 after:h-1/2`) - um traco curto, nao uma borda
  inteira. O badge de contagem (`tab.badge`) usa `text-blue-600` em vez
  de `text-muted-foreground`. Quando `tab.flushContent` e falso (a
  maioria das abas), o `TabsContent` ganha `px-4` (alem do `mt-4` ja
  existente) - sem isso o conteudo da aba (formulario, relation antiga)
  fica colado nas bordas junto com a faixa `bg-toolbar`, o que nao e
  desejado fora da propria faixa de ferramentas.
- `RelationListHost.tsx`: tem 2 variantes, controladas pela prop
  `flushToolbar` (default `false`):
  - `flushToolbar=false` (padrao, usado por todo `DetailRelationTablePanel`
    - paineis de pessoa como contatos/educacao/saude/etc.): barra
    `rounded-lg bg-toolbar px-3 py-2`, um "cartao" de ferramentas solto
    dentro do conteudo da aba. **Nao mudar esse padrao** sem revisar
    esses paineis especificamente.
  - `flushToolbar=true` (usado so por Encontros ate agora): barra
    `"sticky top-11 z-10 px-4 py-4 lg:-mr-2 bg-toolbar"` - sem
    `rounded-lg`, sangrando ate a borda real igual as abas (mesmo
    `lg:-mr-2` e pela mesma razao do `TabsList` acima). `sticky top-11`
    (44px = altura fixa do `TabsList`, `h-11`) gruda a barra logo abaixo
    da lista de abas (que ja e `sticky top-0` no mesmo contexto de
    scroll) - so os dados de `children` (a tabela) rolam por baixo. Usar
    quando a relation e o conteudo inteiro da aba e deve "colar"
    visualmente nas abas acima **e** ficar fixa durante o scroll.
  - Quando `flushToolbar=true`, a aba correspondente em
    `DetailTabTemplate` (`web-client/registry/types.ts`) tambem precisa de
    `flushContent: true` - isso tira o `mt-4`/`px-4`/`overflow-hidden` que
    o `TabsContent` (`DetailTabsRenderer`) usa por padrao entre a barra
    de abas e o conteudo (sem isso, sobra uma faixa sem cor entre as
    abas e a toolbar da relation, e o `overflow-hidden` quebra o
    `sticky` - ver "Por que `position: sticky` as vezes nao gruda"
    abaixo).
- Side tabs (`StandardDetailMetadataSide`/`DetailSideTabs.tsx`) **nao**
  mudam por enquanto - ficam de fora ate serem revisadas especificamente.

**Resultado esperado:** Header + lista de abas + (quando `flushToolbar`)
a barra da relation formam um unico bloco `bg-toolbar` sem nenhuma quebra
de cor entre eles - e a razao de existirem `flushContent`/`flushToolbar`
como opt-in, em vez de mudar o comportamento padrao pra todo mundo.

### Cabecalho de tabela e barra de Colunas/seleção fixos (padrão reescrito em 2026-11-20)

Essa seção já passou por duas rodadas de correção na mesma sessão -
documentando aqui só o estado final, correto, com o histórico das
tentativas erradas registrado como lição, não como passo a passo a
repetir.

**O bug raiz, só descoberto na 3ª rodada:** havia **dois contêineres de
scroll aninhados** (`components/ui/table.tsx` tinha seu próprio
`overflow-x-auto`, dentro do `overflow-auto` que `ListView.tsx` já tem um
nível acima) - `position: sticky` só funciona relativo ao contêiner de
scroll mais próximo, e esse contêiner era o de dentro (só rola
horizontal, nunca vertical), então o sticky vertical nunca tinha efeito
nenhum - nem no List Principal, nem em nenhuma relation. **Corrigido
removendo `overflow-x-auto` de `table.tsx` por completo** - `table.tsx`
só é usado por `ListView.tsx` (confirmado, nenhum outro lugar do sistema
importa dele), então isso não afeta mais nada. Agora existe um único
contêiner de scroll (o de `ListView.tsx`), que rola nos dois eixos
(`overflow-auto` já cobre vertical e horizontal) e é o único ponto de
referência do `<thead sticky>`.

**Segundo problema, só no List Principal:** mesmo com um único contêiner
de scroll, `position: sticky` só tem efeito visível se esse contêiner
realmente tiver uma altura **limitada** (menor que o conteúdo) - sem
isso, o contêiner sempre fica do tamanho exato do conteúdo, nunca
"scrolla" de fato, e quem rola é a página inteira por fora dele (sticky
relativo a um contêiner que nunca rola internamente não tem efeito
nenhum). Conferido: **não existe, em lugar nenhum do sistema, um
container de altura de viewport travada pras telas de List Principal** -
só o Detail já tinha isso (`DetailShell.tsx`). Corrigido em
`RecordListHost.tsx`: o wrapper do List Principal ganhou
`lg:h-[calc(100vh-var(--app-shell-sticky-offset,0px))] lg:min-h-0` -
reaproveitando a **mesma** variável CSS que `DetailShell.tsx` já usa,
medida automaticamente por `AppShell.tsx` (via `ResizeObserver` no
cabeçalho fixo do app, que já inclui a barra de busca/toolbar de cada
página - `ControlPanelShell` mora dentro do elemento medido). Dentro
desse wrapper, `{children}` (o `ListView`/typeview da tela + a
`PaginationBar`, normalmente) fica num grid de 2 linhas
(`lg:grid-rows-[minmax(0,1fr)_auto]`) - a primeira linha (a
lista/tabela) ocupa o espaço que sobra e rola internamente, qualquer
coisa depois dela (paginação) mantém altura natural e fica sempre
visível. Só em `lg:` - no mobile continua a rolagem simples de página,
igual já era (mesma convenção do Detail).

Mecanismo completo (`ListView.tsx`), pra relations `flushToolbar` **e**
pro List Principal, unificado:

- Prop `stickyHeaderOffsetPx` (número em px, não mais uma className) - só
  informada por relations `flushToolbar` (ex.: `117` = 44px das Abas +
  73px da toolbar da relation). No List Principal, não é passada - o
  cabeçalho usa `top-0`, porque ali o próprio contêiner do `ListView` é
  quem agora rola de verdade (ver correção acima), não depende de nada
  externo.
- **A barra de Colunas/seleção em lote (topo do `ListView`) agora é
  sempre a mesma peça, nos dois contextos** - antes, Encontros tinha uma
  barra "Excluir selecionados" escrita à mão dentro de
  `action-occurrences-section.tsx` (fora do `ListView`, como `children`
  do `RelationListHost`), diferente da barra que o List Principal já
  usa automaticamente (`bulkActions`/`shouldShowColumnVisibilityButton`,
  dentro do próprio `ListView`). Migrado: Encontros agora passa
  `bulkActions` pro `ListView` igual o List Principal - mesmo código,
  mesmo visual, em vez de duas implementações divergentes.
- Essa barra **sempre existe no DOM** (reserva `h-9` = `BULK_BAR_HEIGHT_PX`)
  sempre que `enableRowSelection`/`showColumnVisibilityButton` tornam ela
  relevante pra aquela tela - nunca monta/desmonta conforme a seleção
  muda, só o conteúdo interno (contagem + botão) aparece/some. Fundo
  sólido (`bg-background`, igual ao resto da página - não um tom
  chamativo) pra não ficar "visível demais" quando vazia.
- Quando `stickyHeaderOffsetPx` é informado (relation), essa barra
  **também** vira sticky, no mesmo offset recebido, e o cabeçalho da
  tabela automaticamente gruda `stickyHeaderOffsetPx + BULK_BAR_HEIGHT_PX`
  abaixo dela - a soma é feita dentro do próprio `ListView`, o módulo só
  informa o offset de abas+toolbar, nunca precisa somar a altura da
  barra na mão. Quando não é informado (List Principal), a barra fica
  simples, sem `position: sticky` nenhum - já fica "presa" de graça, por
  estar fora da área que rola internamente (ver correção do contêiner
  bounded acima).
- Referência completa: `action-occurrences-section.tsx` (Encontros, com
  `bulkActions`) e `actions-list-module-client-page.tsx` (List Principal,
  mesmo mecanismo, sem offset).
- **Regra, sem excecao:** toda relation com `flushToolbar` precisa de
  `stickyHeaderOffsetPx` no seu `ListView` interno - não é opcional
  quando `flushToolbar` está presente (Participantes/Qualidade/Equipe/
  Encontros, as 4 relations de Atividades hoje, todas precisam).

**Histórico das tentativas erradas (não repetir):**

1. Só reservar altura fixa pra barra de seleção (`h-9`), sem fixá-la -
   ao rolar, a barra (não sticky) saía de tela, mas o cabeçalho (ancorado
   num offset que já contava com ela) continuava parado - abria um vão
   sem nada cobrindo, linhas da tabela visíveis rolando atrás.
2. Fazer só a barra ficar sticky (um `<div>` escrito à mão em
   `action-occurrences-section.tsx`, com offset/altura calculados na
   mão) - funcionava sozinha, mas criava um mecanismo **diferente** do
   que o List Principal já usa, com espaçamento/cor inconsistentes entre
   as duas telas, e não resolvia o List Principal (que continuava sem
   nenhum contêiner de scroll real, então nada sticky tinha efeito ali).
   A causa raiz (dois contêineres de scroll + nenhuma altura travada no
   List Principal) só apareceu ao comparar as duas telas lado a lado.

### Por que `position: sticky` as vezes nao gruda

Licao reutilizavel, nao especifica de Encontros: **`position: sticky`
para de funcionar se qualquer ancestral entre o elemento e o verdadeiro
contêiner de scroll tiver `overflow` diferente de `visible`** - mesmo
que esse ancestral nao esteja de fato cortando nada no momento (a mera
presenca de `overflow: hidden/auto/scroll` ja quebra, nao precisa estar
"ativo"). Isso vale pra `overflow-x` sozinho tambem, porque o navegador
forca o `overflow-y` correspondente a sair de `visible` quando um dos
dois eixos nao e `visible` (regra do proprio CSS Overflow).

Pra achar a causa quando um `sticky` nao gruda: no DevTools, suba a
arvore de ancestrais a partir do elemento sticky ate o contêiner de
scroll real (ou via `getComputedStyle(el).overflow` em cada nivel) e
procure o primeiro `overflow` != `visible` no caminho - **esse** e quem
esta quebrando, nao necessariamente o pai direto. Neste modulo ja
apareceu em 3 niveis diferentes ao mesmo tempo (`TabsContent`, o wrapper
interno do `ListView`, o container do `Table`, e o `ModuleSurface`) -
corrigir so um nao resolve se outro, mais acima ou mais abaixo na
cadeia, continuar quebrando.

**Segunda lição reutilizável, achada em 2026-11-20:** `overflow` != `visible`
não é o único jeito de quebrar sticky - um contêiner de scroll com
**altura ilimitada** (sem `h-[...]`/`max-h-[...]` nenhum, só cresce pra
caber o conteúdo) também não tem efeito nenhum, mesmo com `overflow-auto`
"correto" - ele nunca precisa rolar de verdade (já nasce do tamanho do
conteúdo), então sticky relativo a ele nunca "ativa". Antes de procurar
`overflow` errado, confirmar que o contêiner de scroll pretendido
realmente tem uma altura menor que o conteúdo - se não tiver, o problema
não é overflow, é falta de um `h-[calc(100vh-...)]` (ou equivalente) em
algum lugar da cadeia.

### Contraste de hover/active sobre `bg-toolbar` (padrao a partir de 2026-11-19)

`bg-toolbar` e visivelmente mais escuro que `bg-background`/`bg-muted`
(era a lacuna original: o hover `hover:bg-accent` do botao `ghost` e o
`hover:bg-muted/70` das abas quase desapareciam contra o novo fundo,
porque `--accent`/`--muted` tem luminosidade quase igual a `--toolbar`).
A correcao usada em todo lugar: hover/estado ativo usam `bg-background`
(mais claro que `--toolbar`) pra "acender" visivelmente o elemento, nunca
`bg-accent`/`bg-muted` dentro de uma area `bg-toolbar`.

- Botoes `ghost` icon-only da toolbar (Atualizar/Colunas/Filtros):
  `BASE_CONTROL_BUTTON_CLASS` (`RecordListHost.tsx`) e
  `CONTROL_BUTTON_CLASS_NAME` (`RelationListHost.tsx`, mesmo valor) ganham
  `hover:bg-background` - essas duas constantes tem que continuar iguais
  entre si.
- Typeview (`RecordBrowserViewSwitcher.tsx`, usado por `ViewSwitcher` em
  ambas as toolbars): nao precisou de override custom de cor - o
  `ToggleGroupItem` base (`components/ui/toggle-group.tsx`) ja tem
  `hover:bg-background/60` e `data-[state=on]:bg-background
  data-[state=on]:shadow-sm` prontos; o unico ajuste foi parar de
  sobrescrever isso com um estilo proprio (borda inferior colorida) e so
  reforcar o hover pra `hover:bg-background/80`. Preferir sempre o
  comportamento padrao do componente base a inventar um estilo de
  selecao novo.
- Abas do Detail (`MODULE_TAB_TRIGGER_CLASS_NAME`): o hover inativo
  (`data-[state=inactive]:hover:bg-muted/70`, definido em
  `ModulePrimitives.tsx`) **nao foi alterado na constante compartilhada**
  porque ela tambem atende as abas laterais (ainda em `bg-background`/
  `bg-card`, onde `bg-muted/70` continua com contraste correto). Em vez
  disso, `DetailTabsRenderer` acrescenta
  `data-[state=inactive]:hover:bg-background/80` por cima, via `cn(...)`,
  só nas abas principais (que já estão sobre `bg-toolbar`). Se outro
  lugar precisar da mesma cor de hover de `MODULE_TAB_TRIGGER_CLASS_NAME`
  sobre um fundo `bg-toolbar`, repetir esse padrão de override local -
  não mudar a constante global.
- Linha inferior da busca (`SearchBar.tsx`): o `className` passado pelo
  chamador agora chega ate a `div` com a borda em **todos** os casos (tinha
  um caso - busca com `facets`/`rightSlot` - que silenciosamente ignorava
  o `className`; corrigido). `RecordListHost.tsx` e `RelationListHost.tsx`
  passam `className="border-border"` (opacidade cheia, em vez de
  `border-border/60`) especificamente por estarem dentro de `bg-toolbar` -
  outros usos de `SearchBar` (dialogs de picker, fundo branco) continuam
  sem essa prop, usando o `border-border/60` padrao do componente.

### Filtro de periodo na relation (`dateRange`, legado do mecanismo antigo)

`DetailRelationFilterConfig` aceita `type: "dateRange"` alem de `type:
"select"` - isso so existe no mecanismo antigo
(`DetailRelationsRenderer`/`DetailRelationConfig`,
`DetailLayoutSections.tsx`), que nao e mais usado por nenhuma relation da
Atividade (Participantes/Qualidade/Equipe migraram pra `RelationListHost`
em 2026-11-19 - ver proxima secao). Nao usar `dateRange` nem o mecanismo
antigo em relation nova.

`DateRangeFilterButton` (`web-client/ui/DateRangeFilterButton.tsx`) -
botao compacto com icone de calendario, Popover com `Calendar` (shadcn,
`mode="range"`) - continua existindo pra qualquer modulo que precise de
um seletor de periodo avulso fora do mecanismo de filtro (ex.: um
periodo que nao corresponde a nenhum campo por linha, usado so pra
parametrizar uma chamada). Mas **prefira sempre `filterFields`/
`groupByOptions` a esse botao quando o periodo corresponder a um campo
real da linha** - ver "Preferir filtro/agrupamento real a um controle
solto" logo abaixo; a aba Participantes da Atividade chegou a usar esse
botao (periodo controlando o fetch do servidor) e teve o botao removido
em 2026-11-19 porque esse resumo agregado nao tem um campo de data por
linha pra sustentar um filtro de verdade - preferiu-se simplificar
(calcular sempre sobre o historico completo) a manter um controle fora
do padrao. Se um filtro de periodo genuino existir (campo `type: "date"`
em `filterFields`, correspondendo a um valor real por linha), o atalho
De/Ate aparece sozinho no painel de Filtros do `SearchPanelMenu` - nao
precisa de nenhum botao a parte.

`components/ui/calendar.tsx` foi corrigido nesta mesma rodada para as
chaves de `classNames` da v9 do react-day-picker (a v8 usava
`head_row`/`day_selected`/etc., a v9 renomeou pra `weekdays`/`selected`/etc.,
e as chaves antigas sao ignoradas em silencio, sem erro, so o estilo
quebra) e ganhou `locale={ptBR}` por padrao - qualquer novo uso do
`Calendar` compartilhado ja herda os dois (inclusive `RelationListHost`).

### Tabela (`ListView`): largura de coluna, truncamento, tooltip, zebra e padding (padrão a partir de 2026-11-20, referência: lista principal de Atividades)

Vale pra **todo** `ListView` do sistema - List Principal (`RecordListHost`) e relation (`RelationListHost`/`DetailRelationTablePanel`), porque o mecanismo mora no próprio `ListView.tsx`/`table.tsx` (compartilhados, nenhum módulo precisa de código próprio). Atividades foi a referência onde isso foi implementado e aplicado primeiro; outros módulos herdam automaticamente a parte que é só do componente (largura/truncamento/zebra/header/padding) e precisam de um ajuste pontual por coluna só pra marcar qual é a "coluna principal" (ver abaixo) ou pra usar `TruncatedTextCell` num texto que hoje é `<span>` simples.

- **Toda coluna tem um limite de largura por padrão** (`DEFAULT_COLUMN_MAX_WIDTH = 280` px, exportado de `web-client/views/ListView.tsx`) - a coluna cresce com o conteúdo até esse limite (nunca mais larga que o necessário pra um valor curto) e, quando o conteúdo é maior, trunca com "..." **sem quebrar linha** (`whitespace-nowrap` + `overflow-hidden` + `text-ellipsis`, já existentes em `components/ui/table.tsx`). Isso é automático - nenhum módulo precisa declarar nada pra ganhar esse comportamento.
- **Coluna principal (nome/título) encolhe pro tamanho do conteúdo, com um teto próprio (maior que o das outras), e realce visual - automático, por posição:** o `ListView` trata a **primeira coluna de dado visível** (pulando a de seleção, quando `enableRowSelection` está ativo - `getPrimaryColumnId` em `ListView.tsx`) como a coluna principal, sempre - não é uma configuração por `ColumnDef`, é posicional. Isso já é a mesma regra de "Colunas base" (a coluna principal do item vem primeiro no List Principal), então nenhum módulo precisa declarar nada: a primeira coluna usa `width: "1%"` + seu próprio teto de largura, `--table-column-primary-max-width` (`globals.css`, 320px por padrão - maior que o `DEFAULT_COLUMN_MAX_WIDTH` de 280px das outras colunas) **e** ganha o tom `bg-table-column-primary`/`text-table-column-primary-foreground` (ver grupo de cores de tabela abaixo) em toda célula da coluna, não só no cabeçalho - é assim que o usuário reconhece de relance qual coluna é a principal, sem precisar ler o cabeçalho. **`width: "1%"` (2026-11-21, achado numa revisão de Atividades):** o `<table>` é `w-full` (`table.tsx`) - sem esse `width: "1%"`, o layout automático do HTML distribui a sobra de largura entre as colunas, e como só a principal tem fundo próprio, é nela que a sobra "aparece" como espaço vazio mesmo com um nome curto (nas outras colunas a mesma sobra existe, só não se nota porque o fundo é igual ao da linha). `width: "1%"` é o truque clássico de tabela HTML pra "não dar peso extra pra essa coluna" no layout automático - a coluna encolhe pro maior conteúdo real (cabeçalho ou valor visível), e o `maxWidth` continua sendo só o teto pra nome realmente longo, que aí sim trunca com "...". **Histórico:** a primeira versão disso usava um sinal por coluna (`maxSize: Infinity` no `ColumnDef`) - funcionava em teoria, mas era um passo de configuração fácil de esquecer por módulo e, na prática, criava a possibilidade de a coluna errada (ou nenhuma) ficar marcada; trocado pra detecção posicional automática, sem esse risco. Isso só é seguro quando o campo da primeira coluna já tem (ou devia ter) um limite de tamanho real - ver `docs/backlog.md` sobre `Activity.title` (hoje sem limite no banco, só validação de aplicação).
- **Coluna principal mostra um valor só - nunca duas linhas empilhadas.** Achado em 2026-11-20, revisando Atividades: a coluna principal da lista de Atividades ("Atividade") e a de Participantes/Qualidade ("Participante"/"Pessoa") mostravam o nome **e** um segundo valor embaixo (tipo da atividade; Grupos do participante) - a de Encontros ("Data") já tinha um valor só, e foi isso que deixou a diferença visível entre as telas. Corrigido tirando o segundo valor de dentro da coluna principal e criando uma coluna própria pra ele (`Tipo` em Atividades; `Grupos` em Participantes e Qualidade - essa última reaproveitando `renderParticipantIdentity` com a prop `showGroupsSubtitle={false}`, já que a função é compartilhada com `project-action-attendances-card.tsx`, fora de Atividades, que não foi tocado). **Regra a aplicar em qualquer coluna principal nova ou revisada:** se o dado teria uma segunda linha/informação secundária dentro da célula, essa informação vira coluna própria (geralmente com `TruncatedTextCell`, já que colunas secundárias usam o limite de largura padrão) - a coluna principal fica só com o valor que identifica o registro.
- **Tabela cresce pra direita, nunca quebra linha:** o container do `Table` já tem `overflow-x-auto` (`components/ui/table.tsx`) - quando a soma das colunas (a maioria capada em 280px, a principal em 320px - `--table-column-primary-max-width`) passa da largura disponível, aparece scroll horizontal em vez de qualquer coluna quebrar texto em múltiplas linhas. Não adicionar `white-space: normal`/remover o `nowrap` em nenhuma célula pra "caber" - a resposta certa pro conteúdo não caber é o limite de largura + truncamento, não a quebra de linha.
- **Tooltip no texto truncado - automático em toda célula, desde 2026-11-21, sem nenhum módulo precisar fazer nada.** `TableCell` (`components/ui/table.tsx`) mede, por `<td>`, se o conteúdo truncou de verdade (`scrollWidth > clientWidth + 2px` de tolerância - 1px não bastava, escala de tela do Windows ≠ 100% já cria 1-2px de diferença por arredondamento de subpixel sem nenhum corte real; via `ResizeObserver`, reavalia ao redimensionar; mede só depois de 2 `requestAnimationFrame`, pra não travar como "truncada" numa medição cedo demais) e, só quando truncou, envolve a célula em `Tooltip`/`TooltipTrigger`/`TooltipContent` (`components/ui/tooltip.tsx`, mesmo balão de sempre - `max-w-xs whitespace-pre-wrap`) mostrando o `textContent` real do DOM como valor completo. Funciona com qualquer conteúdo (texto puro, `<div>` aninhado, `<Badge>`) porque lê o DOM renderizado, não o `children` do React - **antes disso**, só quem usava `TruncatedTextCell` manualmente tinha tooltip; a maioria das colunas (data, número, "Tipo", a coluna principal) não tinha nenhum, e ficava sem jeito de ler um valor cortado. **`TruncatedTextCell` (`web-client/ui/TruncatedTextCell.tsx`) continua existindo e válido** pras colunas que precisam de algo que esse mecanismo automático não cobre: `icon` opcional (ex.: "Projeto" com `FolderKanban`), um placeholder `-` em cinza (`text-muted-foreground`) quando o valor é vazio, ou **texto livre que pode ser realmente longo** (nota, descrição, parágrafo - não só um nome/título) - ela não duplica tooltip com o automático porque sua própria truncagem acontece num `<span>` **interno**, então o `<td>` por fora nunca mede overflow (o filho já ficou do tamanho certo).
  **Pegadinha real - `max-width`/`min-w-0` sozinhos não garantem truncar texto livre bem longo (achado em 2026-11-21, aba Encontros/Notas de Atividades, 2 rodadas até fechar de verdade).** Um `<span>` com `white-space: nowrap` (o que `truncate`/ellipsis exige) tem largura mínima de conteúdo igual ao texto **inteiro** (não dá pra quebrar nem uma palavra) - no layout automático de tabela HTML, essa largura mínima pode vencer o `max-width` da célula/wrapper e fazer a **coluna inteira** crescer pra caber o texto, mesmo com `overflow-hidden`/`text-ellipsis` escritos no CSS - não é um bug de código, é assim que o algoritmo de layout de tabela funciona. **1ª tentativa:** a coluna "Notas" (antes `whitespace-normal break-words`, crescendo a **altura** da linha) trocou pra texto puro direto no `<td>` - a altura parou de crescer, mas a **largura** da coluna cresceu no lugar (texto puro não tem nenhuma defesa contra isso). **2ª tentativa:** trocar pra `TruncatedTextCell` (que usa `min-w-0` no wrapper) resolveu pra texto de tamanho normal, mas voltou a vazar pra fora da tela com uma nota de verdade longa (várias frases) - `min-w-0` ajuda o `<div>` a encolher, mas não é garantia absoluta contra qualquer tamanho de texto nesse cálculo de layout. **Correção final, nos dois níveis (`TruncatedTextCell.tsx`):** (1) o wrapper ganhou `style={{ maxWidth: maxWidthPx }}` **inline** (não só via className) - `maxWidthPx` é prop, default 280 (igual `DEFAULT_COLUMN_MAX_WIDTH`); (2) o valor **exibido** (não o do tooltip, que continua inteiro) é cortado em JavaScript **antes** de chegar no DOM, num limite de caracteres calculado a partir de `maxWidthPx` (`Math.floor(maxWidthPx / 7)`, 7px/caractere - estimativa conservadora pro texto de 13px da tabela) - isso garante que a largura mínima de conteúdo do `<span>` nunca passe de `maxWidthPx`, **independente** de qualquer detalhe de layout do navegador, porque o texto em si já é curto o suficiente. **Regra:** texto que pode ser parágrafo/nota longa (não só um nome) sempre usa `TruncatedTextCell`, nunca um texto puro direto no `cell` - mesmo com o tooltip automático existindo, ele não resolve esse caso.
- **Padding lateral de 4px:** o container do `Table` (`containerClassName` em `ListView.tsx`) tem `px-1` - a tabela não encosta na borda do cartão (`ModuleSurface`) nem, numa relation, na borda da aba. Esse padding é parte do container com scroll, então ele também aparece como uma margem mínima no início/fim do scroll horizontal - comportamento esperado, não bug.

**Grupo de variáveis de tabela, centralizado em `frontend/src/app/globals.css` (padrão a partir de 2026-11-20, +5 variáveis em 2026-11-21 - largura da coluna principal, checkbox e coluna fixada).** Tudo que é cor/tamanho de tabela mora em 16 variáveis, uma vez em `:root` (claro) e uma vez em `.dark` (escuro) - editar **só** essas 32 linhas pra recalibrar qualquer tabela do sistema, nunca `ListView.tsx`/`table.tsx`:

| Variável | Controla | Onde é usada |
| --- | --- | --- |
| `--table-header` | fundo do cabeçalho | `TableHeader` (`<thead>`), `components/ui/table.tsx` |
| `--table-header-foreground` | texto do cabeçalho | `TableHead` (`<th>`) |
| `--table-row` | fundo da linha "par" | `ListView.tsx`, escolhido por linha |
| `--table-row-zebra` | fundo da linha "ímpar" | `ListView.tsx`, escolhido por linha |
| `--table-row-foreground` | texto do corpo da tabela | `TableRow` (`<tr>`) - herda pros `<td>` por `color` ser herdável (só se nenhum elemento dentro da célula fixar a própria cor - ver pegadinha abaixo) |
| `--table-column-primary` | fundo da coluna principal (1ª coluna) | `ListView.tsx`, só no `<th>`/`<td>` dessa coluna |
| `--table-column-primary-foreground` | texto da coluna principal | `ListView.tsx`, `!text-table-column-primary-foreground` no `<th>`/`<td>` dessa coluna (precisa de `!` - ver "regra de arquitetura" abaixo) |
| `--table-column-primary-max-width` | largura máxima da coluna principal (2026-11-21) | `getColumnWidthStyle` em `ListView.tsx`, só na coluna principal |
| `--table-border` | cor das divisórias (linha e cabeçalho) | `TableHeader`, `TableRow` |
| `--table-cell-padding-x` | padding horizontal de toda célula | `TableHead`, `TableCell` |
| `--table-cell-padding-y` | padding vertical do corpo - **é isso que define a altura da linha**, não uma altura fixa | `TableCell` |
| `--table-checkbox-border` (2026-11-21) | borda do checkbox da coluna `__select__`, sem marcação | `SELECTION_CHECKBOX_CLASS_NAME` em `ListView.tsx`, com `!` |
| `--table-checkbox-checked-background` (2026-11-21) | fundo do checkbox da coluna `__select__`, marcado | idem, `data-[state=checked]:!bg-...` |
| `--table-checkbox-checked-foreground` (2026-11-21) | ícone de check, marcado | idem, `data-[state=checked]:!text-...` |
| `--table-pinned-background` (2026-11-21) | fundo de uma coluna fixada (sticky) que não é a principal nem a de seleção | `getPinnedStyles` em `ListView.tsx` |

(`--table-header-padding-y` existe separado, só pro cabeçalho, porque cabeçalho e corpo podem querer alturas diferentes.) Todas mapeadas em `@theme inline` (`--color-table-header: var(--table-header)`, etc. - mesmo mecanismo que já gera `bg-toolbar` a partir de `--toolbar`), então qualquer uma vira uma classe Tailwind normal (`bg-table-header`, `text-table-row-foreground`, `border-table-border`...) - exceto `--table-column-primary-max-width` e `--table-pinned-background`, que são lidas direto via `var(...)` num `style` inline (`getColumnWidthStyle`/`getPinnedStyles`), sem precisar de mapeamento em `@theme inline` (a 1ª é um tamanho, não cor; a 2ª só porque `getPinnedStyles` já monta um objeto de `style`, não `className`, nesse ponto). As cores são oklch **sólido, sem alpha** de propósito, **exceto `--table-checkbox-border`** (tem alpha - não é fundo, não precisa cobrir nada ao rolar): a coluna principal e qualquer coluna fixada precisam ser opacas pra cobrir o conteúdo que passa por baixo.

**As 16 variáveis sempre valem nos dois temas igual, e nos dois contextos (List Principal e relation) igual - conferir os dois ao editar.** Achado em 2026-11-20: `--table-cell-padding-y`/`--table-header-padding-y` foram editados só em `:root` (claro, pra `8px`) e o `.dark` ficou esquecido em `12px` - sem nenhum bug de código, só os dois blocos desincronizados; corrigido igualando os dois. Antes de concluir que um parâmetro "não funciona", confirmar qual tema está sendo testado e comparar o valor nos dois blocos (`:root`/`.dark`) em `globals.css`, não só um. (`--table-cell-padding-y` voltou a ficar desincronizado entre os temas - 15px no claro, 8px no escuro - achado em 2026-11-21 mas não corrigido por não ter sido pedido; ver `docs/backlog.md`.)

**Pegadinha real - cor do texto da célula não aplica mesmo com `--table-row-foreground`/`--table-column-primary-foreground` certos (achado em 2026-11-21, revisão de Atendimento e Atividades).** `color` é herdável, mas a herança só funciona se **nenhum elemento entre o `<td>` e o texto** fixar a própria cor - não é uma questão de especificidade CSS (que `!text-table-column-primary-foreground` resolveria), é que a declaração mais **interna** sempre vence, ponto. Causa raiz real: o `cell` do `ColumnDef`, em praticamente todo módulo de lista, envolve o valor num `<div>`/`<span>` com `text-foreground` - esse `text-foreground` interno anula qualquer cor vinda do `<tr>`/`<td>` por fora. **Não é só a coluna principal** - em Atividades (`actions-list-module-client-page.tsx`) o usuário reportou a 2ª coluna ("Tipo") não acompanhando `--table-row-foreground`, e o `cell` dela tinha exatamente o mesmo `text-foreground` fixo ("Inicio"/"Cadastro" também tinham, corrigidas junto). **Checklist pra qualquer `cell` novo ou revisado, em qualquer coluna:** se o `div`/`span` dentro da célula tem uma classe `text-*` de cor (não `text-xs`/`text-sm`, que são tamanho) além de `text-muted-foreground` num valor secundário intencional, é bug - tirar a cor e deixar o texto herdar do `<tr>`/`<td>`. Corrigido em Attendances (coluna principal) e em Actions/Atividades (coluna principal + "Tipo"/"Inicio"/"Cadastro") nesta sessão; os outros módulos com o mesmo padrão - alguns também em colunas secundárias, não só a principal - estão listados em `docs/backlog.md` (seção "Infraestrutura de UI").

**`bordered={false}` não desliga mais as linhas divisórias (2026-11-20).** Só controla a borda **externa** do cartão (`ModuleSurface`) - as linhas internas (`border-table-border`, no `<thead>`/`<tr>`) aparecem em qualquer `ListView`, relation ou não, desde que `--table-border` tenha largura visível no tema (que já tem, por padrão). Antes disso, `!bordered` forçava `border-bottom-width: 0` via um seletor `[&_tr]:border-b-0` de especificidade mais alta - zerava a borda de propósito, então mudar a cor de `--table-border` não tinha efeito nenhum nas relations (comportamento antigo, intencional até então). Religado porque a cor agora é configurável/sutil e não fazia mais sentido continuar apagando.

**Regra de arquitetura pra não repetir o bug de 2026-11-20 (duas rodadas de "a cor não aplica"):** nunca declarar duas classes de `background-color` (uma fixa, outra condicional) no **mesmo elemento** - com a mesma especificidade, qual delas "ganha" depende da ordem interna de geração do Tailwind, não da ordem no JSX, e não dá pra confiar nisso. Em vez disso, o fundo "base" sempre mora no elemento **pai** (`--table-header` no `<thead>`, não em cada `<th>`) e a excecão (coluna principal) é a **única** declaração de fundo no elemento **filho** (`<th>`/`<td>` daquela coluna) - sem concorrência nenhuma, o filho sempre cobre o pai nessa área, não importa a ordem de geração do CSS. Pelo mesmo motivo, `bg-table-row`/`bg-table-row-zebra` nunca coexistem como "classe base + classe condicional" no mesmo `<tr>` - `ListView.tsx` sempre escolhe **uma das duas**, nunca as duas. **Caso diferente, mesma causa (checkbox da coluna de seleção, 2026-11-21):** aqui as duas classes concorrentes não são de um `className` condicional do `ListView` contra ele mesmo, são o `className` do `ListView` (`SELECTION_CHECKBOX_CLASS_NAME`) contra as classes que já vêm **de dentro do componente** `Checkbox` (`border-primary`, `data-[state=checked]:bg-primary`, `components/ui/checkbox.tsx`) - não dá pra mover a "base" pro elemento pai porque o pai não é quem declara essas classes. Única saída confiável: `!` nas classes do `ListView` (`!border-table-checkbox-border`, `data-[state=checked]:!bg-table-checkbox-checked-background`) - força a vitória independente de ordem de geração.

**Pegadinha real, já corrigida - cuidado ao tocar em `getPinnedStyles`:** uma coluna fixada (`initialColumnPinning`, ex.: Atividades fixa "title" à esquerda) recebe um `style` **inline** com `background` (pra cobrir conteúdo ao rolar) **e** `width`/`minWidth`/`maxWidth` fixos (`column.getSize()`, 150px por padrão) - `style` inline sempre vence `className`, sem excecão nem especificidade que salve. Isso anulava `bg-table-column-primary` **e** travava a largura em 150px mesmo a coluna sendo "sem limite" - dois bugs do mesmo tipo, achados em duas rodadas diferentes (o segundo só apareceu porque o usuário comparou o List Principal, onde "title" é fixada, com uma relation, onde nenhuma coluna é fixada, e viu a 1ª coluna com tamanhos diferentes nas duas telas). Corrigido em `getCellStyle` (`ListView.tsx`): quando a coluna é a principal, mantém só o que a fixação realmente precisa (`position`/`left`/`right`/`zIndex`) e usa `getColumnWidthStyle` pra largura - sem herdar `background` nem `width` da fixação. Resultado: a coluna principal fica com a mesma largura/cor em qualquer tabela, fixada ou não. Se um dia outra coluna (não a principal) precisar desse mesmo tratamento, generalizar `getCellStyle`, não duplicar a lógica.

**Histórico de calibração (não repetir):** a primeira tentativa usou `bg-muted/10`→`/25` (cabeçalho) e `bg-muted/5`→`/40` (zebra) com opacidade Tailwind direto no componente - `--muted` e `--background` são quase idênticos em luminosidade neste tema (diferença de ~2%), então qualquer fração baixa dela fica imperceptível; confirmado pelo usuário duas vezes. **Lição:** antes de usar um token existente com opacidade baixa como "tom sutil", conferir se ele realmente tem contraste suficiente neste tema especificamente - e, pra qualquer cor pensada pra ser recalibrável por design (não só uma vez), usar uma variável dedicada em `globals.css`, nunca uma fração solta na className.

### Exclusão em lote: seleção colada à coluna principal (padrão do projeto a partir de 2026-11-20, referência: Encontros da Atividade)

**Regra, sem excecão:** sempre que uma lista (List Principal ou relation) precisar de exclusão em lote, o mecanismo é seleção por checkbox + botão de exclusão - nunca um botão de excluir por linha separado nem uma tela paralela de "gerenciar exclusões". Isso não é específico de Atividades - é o padrão de **todo o projeto** a partir de agora, porque a peça inteira mora no componente compartilhado (`ListView.tsx`): qualquer módulo que ligar `enableRowSelection={true}` já ganha automaticamente tudo abaixo, sem nenhum código visual próprio.

O mecanismo, pronto no `ListView`:

- `enableRowSelection` liga a coluna `__select__` (sempre a primeira coluna da tabela, antes até da coluna principal) e o checkbox de "selecionar todos" no cabeçalho.
- **A coluna de seleção é tratada como coluna de ação, colada à coluna principal** - `isLeadingColumn` em `ListView.tsx` dá à coluna `__select__` o mesmo tom `bg-table-column-primary` da coluna principal, formando um único bloco visual contínuo, sem costura de cor entre as duas. Não criar uma cor própria pra coluna de seleção em nenhum módulo - ela sempre usa esse mesmo tom.
- **O checkbox em si é sutil**, não o padrão cru do componente: `border-muted-foreground/40 shadow-none` (constante `SELECTION_CHECKBOX_CLASS_NAME` em `ListView.tsx`) em vez de `border-primary`/`shadow-sm` - numa tabela densa, o checkbox não deveria competir visualmente com os dados da linha. O estado marcado continua óbvio (`bg-primary`, já vem do componente base `Checkbox`).
- O botão de ação em lote (`bulkActions`, ex.: "Excluir selecionados") é passado pelo módulo pra `ListView`/`RelationListHost`, aparece só quando há linhas selecionadas, e some quando a seleção é limpa - ver `action-occurrences-section.tsx` (aba Encontros da Atividade) como referência viva completa: `enableRowSelection`, `onSelectionChange` com comparação de conteúdo (evita loop infinito - ver nota em `docs/backlog.md`/comentário no próprio arquivo), confirmação (`useConfirm`) antes de excluir, e exclusão em lote real (`runInBatches`) contra o endpoint de delete.
- **Quando a coluna principal também é fixada (`initialColumnPinning`), a coluna de seleção é fixada junto, automaticamente, na frente.** Achado em 2026-11-20 na lista principal de Atividades (`title` fixado à esquerda): o TanStack reordena colunas fixadas pra frente de todas as outras - então a coluna principal fixada "furava a fila" e aparecia **antes** da coluna de seleção, mesmo essa sendo sempre a primeira coluna declarada no array. `ListView.tsx` corrige isso sozinho: ao montar o estado inicial de `columnPinning`, se `enableRowSelection` estiver ativo e houver alguma coluna fixada à esquerda, `__select__` é prefixado nessa lista automaticamente - nenhum módulo precisa lembrar de fazer isso na mão. `getCellStyle` também precisou aprender a tratar a coluna de seleção como "coluna líder" (mesmo tratamento de remover o `background` inline da fixação que já existia pra coluna principal, mas **sem** soltar a largura fixa de 32px, que é intencional ali).

**Não adicionar a coluna de seleção só por padronização visual - só quando existe uma ação real de exclusão em lote por trás.** Um checkbox sem ação nenhuma é uma promessa vazia pro usuário. Exemplo já decidido: dentro da própria Atividade, Encontros tem seleção porque excluir um Encontro é uma operação real; Participantes e Qualidade não ganharam seleção, mesmo sendo visualmente parecidas, porque nenhuma das duas tem uma operação de exclusão em lote por trás (Participantes é um resumo agregado por matrícula, não um registro que se exclui; Qualidade edita nota/presença já existente, sem endpoint de exclusão em massa) - decisão confirmada com o usuário em 2026-11-20. Usar o mesmo critério em qualquer módulo: antes de ligar `enableRowSelection`, confirmar que existe um endpoint de exclusão em lote (ou em loop) real pra chamar - se não existir, não adicionar o checkbox.

### Exclusão é sempre soft delete, atrás de um status terminal do próprio módulo (padrão do projeto a partir de 2026-11-20, referência: Atividades)

**Regra, sem excecão:** nenhum módulo expõe exclusão (single ou em lote) como remoção física de dado. "Excluir" é sempre soft delete (`deletedAt` setado, linha nunca sai da tabela) **e** só é permitido quando o registro já está num status terminal definido pelo próprio módulo - nunca em um registro "vivo"/em uso. Decisão do usuário: prioriza não perder dado por acidente sobre liberar a tela imediatamente; quem precisa excluir de verdade primeiro move o status pra terminal (passo reversível, deliberado) e só depois exclui (agora seguro, porque já passou pelo primeiro passo).

Isso não é um campo/enum igual em todo módulo - **cada módulo define seu próprio gatilho**, porque cada um já tinha (ou não) um conceito equivalente antes desta regra:

- **Atividades (referência viva):** `ActionStatus` tem `INACTIVE` (antigo `CANCELED`, renomeado em 2026-11-20 - nenhum registro usava esse valor, troca segura) como status terminal. `Activity.deletedAt DateTime?` (mesmo padrão de campo já usado em `ProjectEnrollment`/`PeopleGroupParticipation`/`ProjectActionPeopleParticipation`). `deleteProjectAction` (`backend/src/modules/actions/actions.service.ts`) virou `prisma.activity.update({ data: { deletedAt: new Date() } })`, com `BadRequestException` se `status !== 'INACTIVE'` - **a checagem mora no backend**, nunca só no frontend (o botão escondido/cliente valida por UX, mas quem garante a regra é o service, senão é só decoração). Toda leitura de `Activity` (`buildProjectActionWhere`, `ensureProjectActionExists`, contagem em `project-structure.service.ts`, agregações em `dashboard.service.ts`) ganhou `deletedAt: null` no `where`.
- **Projects e People ainda não adotam esse padrão** - `ProjectStatus` não tem um valor terminal equivalente hoje (`PLANNED | ACTIVE | CLOSED`, precisa decidir qual serviria); People já tem seu próprio soft delete (`status: 'Excluido'`, sem checagem de status anterior) e não precisa mudar só pra "ficar igual" - ver `docs/backlog.md`.
- Hard delete (`prisma.x.delete(...)`) continua existindo só onde não há esse tipo de risco (ex.: `Goal`, bloqueado por contagem de Activities vinculadas) - a troca pra soft delete é sobre entidades que o usuário final cria/edita/apaga livremente pela tela, não sobre toda e qualquer exclusão do sistema.
- A auditoria (`backend/src/core/prisma/prisma.service.ts`) já grava um snapshot `before`/`after` de qualquer `update`/`delete` automaticamente - soft delete não precisa de nada extra pra manter rastro de quem/quando excluiu.

### Relation no rodape do Detail (padrao a partir de 2026-11-18, referencia: aba Encontros da Atividade)

**Regra, sem excecao:** toda relation nova, em qualquer modulo, tem que
sair identica a aba Encontros da Atividade - mesma estrutura, mesma
ordem, mesmos componentes. Nao e uma sugestao nem um estilo "parecido",
e o template. Resumindo a ordem numa linha so:

```text
PainelSearch (busca + [Colunas | Filtros]) — seletor de visualizacao (TypeView) — Novo
<tabela abaixo, sem borda>
```

Toda relation no rodape de um Detail usa `RelationListHost`
(`web-client/relation/RelationListHost.tsx`) - e so ele, nao
`DetailRelationsRenderer`/`DetailRelationConfig`
(`web-client/detail/DetailLayoutSections.tsx`), que fica reservado pras
relations que ainda nao migraram (ver `docs/backlog.md` - nao copiar o
padrao antigo pra relation nova, nem "pra ganhar tempo"). Pra relation
simples (so lista + busca + filtro + colunas, sem visualizacao
alternativa), usar `DetailRelationTablePanel`
(`web-client/detail/DetailRelationTablePanel.tsx`), que ja envolve
`RelationListHost` com uma `TableView` fixa - e o que os 7 paineis de
relacao de People (Escolaridade, Detencoes, Contatos, etc.) usam. Pra
relation que precisa alternar entre Lista e outra visualizacao (ex.:
Calendario), usar `RelationListHost` direto, igual a aba Encontros.

Atividade: as 4 relations do rodape (Encontros, Participantes,
Qualidade, Equipe) estao **todas** em `RelationListHost` desde
2026-11-19 - nenhuma usa mais o mecanismo antigo. Cada uma tem seu
proprio componente dedicado em
`modules/actions/features/manage/ui/action-<nome>-section.tsx`
(`action-occurrences-section.tsx`, `action-participants-section.tsx`,
`action-quality-section.tsx`, `action-team-section.tsx`), seguindo o
mesmo molde: estado local (`searchText` + o que mais a relation
precisar), `useMemo` pra filtrar os dados antes de passar pro
`<ListView data={...}>`, e `<RelationListHost flushToolbar>` como
wrapper.

**Occurrences ainda nao segue isso.** A aba "Envolvidos" de Occurrences
foi construida com `DetailRelationConfig` (`tabTemplates[].relations`,
o mecanismo antigo) - sem `SearchPanelMenu` (Colunas/Filtros/Agrupar).
Nao foi migrado ainda - ver `docs/backlog.md`, entrada "Relations ainda
no DetailRelationsRenderer".

**Attendances ja migrou (2026-11-21).** As 3 abas (Pessoas/Evolucoes/
Beneficios) usam `DetailRelationTablePanel` (`RelationListHost` +
`TableView`), mesmo mecanismo desta secao - ver
`attendances-detail-layout-contract.tsx`. Continua faltando so o side
de Tags/Notas/Anexos (depende de schema novo no backend - Fase B, ver
`docs/backlog.md`), nao a relation em si.

**`viewSwitcherSlot` e so pro seletor de visualizacao e pra acoes de
verdade que nao sao filtro (ex.: um botao "Salvar" de edicao em lote) -
nunca pra um seletor cujo unico papel e restringir ou agrupar quais
linhas aparecem.** Esse segundo tipo de controle sempre vira
`filterFields`/`groupByOptions`, mesmo quando isso exige buscar mais
dados do servidor - ver "Preferir filtro/agrupamento real a um controle
solto" logo abaixo pro raciocinio completo e um exemplo worked. O slot
aceita qualquer `ReactNode` quando precisar de mais de um elemento real
(`<div className="flex items-center gap-2">` com o seletor de
visualizacao + um botao "Salvar", por exemplo - `action-quality-section.tsx`
hoje). Quando a relation nao precisa criar registro novo (ex.:
Participantes, um resumo agregado sem fluxo de criacao), simplesmente
nao passar `onAdd`/`addHref` - o botao "Novo" some sozinho (mesmo
comportamento condicional que Encontros ja tinha).

### Preferir filtro/agrupamento real a um controle solto (padrao a partir de 2026-11-19)

Quando um controle existe so pra restringir ou agrupar quais linhas
aparecem (um select de "Grupos", um seletor de periodo, um seletor de
"qual registro-pai mostrar"), o padrao e virar `filterFields`/
`groupByOptions` dentro do painel de Filtros - **nunca** um select solto
no `viewSwitcherSlot`, mesmo que isso signifique mudar a forma como os
dados sao buscados do servidor. Prefira isso mesmo quando a conversao for
mais trabalhosa que so mover o componente de lugar.

Caso de referencia: a aba Qualidade da Atividade tinha dois selects soltos,
"Encontro" (controlava **qual Encontro era buscado do backend** - 1
fetch por vez, `occurrenceId`) e "Grupos" (ja filtrava em memoria, so
nao estava em `filterFields`). Os dois viraram filtro/agrupamento de
verdade em 2026-11-19 (`action-quality-section.tsx` +
`action-detail-engine-client-page.tsx`):

- **Grupos** foi direto - ja era filtro client-side, so precisou virar
  `filterFields`/`buildSearchRecord` em vez de um `qualityGroupId`
  mantido no componente pai.
- **Encontro** exigiu mudar a busca: em vez de 1 fetch por Encontro
  selecionado, a tela passou a buscar a presenca de **todos os
  Encontros de uma vez** (`fetchAllQualityAttendances`, concorrencia
  limitada, uma chamada por Encontro em paralelo) e cada linha carrega
  o Encontro de origem (`occurrenceId`+`scheduledDate`) pra virar um
  `filterFields`/`groupByOptions` normal.

**Efeito colateral a sempre considerar: identidade de linha.** Quando a
conversao faz uma mesma entidade logica (ex.: uma pessoa) aparecer mais
de uma vez no dataset (uma linha por Encontro em vez de 1 linha so), o
identificador antigo (so `enrollment.id`) deixa de ser unico - vira uma
chave composta (`${occurrenceId}::${enrollmentId}`, por exemplo). Isso
afeta tudo que usava aquele id como chave: `getRowId` do `ListView`,
rascunhos/edicoes em memoria (`qualityDrafts`), e o agrupamento de itens
na hora de salvar em lote (salvar passou a agrupar os itens alterados
por Encontro antes de chamar o endpoint, que continua sendo por
Encontro - 1 chamada por Encontro, em paralelo, nao 1 chamada geral).
Revisar esse ponto sempre que uma conversao desse tipo for feita; nao
assumir que o id antigo continua unico so porque continuava sendo antes
da mudanca.

Se a conversao tornar algum estado do componente pai morto (ex.: um
periodo que so existia pra alimentar o controle removido), remova esse
estado de verdade (ver `docs/backlog.md`/memoria do projeto sobre nao
deixar codigo morto) - nao deixe desligado "por garantia".

**Atencao a efeito colateral em outra aba.** Se o controle removido era
compartilhado com outra aba (ex.: o mesmo `occurrenceId` tambem decidia
o que a aba Progresso e Relatorio mostrava), confirme que a outra aba
ainda tem como trocar esse valor depois da remocao - senao ela fica
presa no padrao, silenciosamente, sem o usuario conseguir voltar a trocar
algo que antes trocava.

**Barra unica, sem cabecalho proprio:**

- Sem titulo tipo "Encontros" acima da barra - a aba do Detail ja
  identifica o conteudo (`title`/`subtitle` do `RelationListHost` ficam
  `sr-only` por padrao, nao removidos, so nao aparecem visualmente).
- Tudo numa linha so: busca + botao Colunas + botao Filtros + (quando a
  relation tiver mais de uma visualizacao) seletor de view + botao
  "Novo". A busca nao tem largura maxima fixa - ocupa o espaco que
  sobrar depois dos outros elementos, que tem largura fixa.
- Botoes Colunas e Filtros usam `variant="ghost"` + `size="icon"`, sem
  borda, cor `text-muted-foreground` (`hover:text-foreground`) - o
  mesmo estilo que o List Principal real ja usa em `RecordListHost.tsx`.
  O botao de Filtros ganha um ponto (`bg-primary`, `size-1.5`,
  `absolute right-1.5 top-1.5`) quando ha filtro ou agrupamento ativo.
  Nunca `variant="outline"` nem botao com texto pro Colunas/Filtros de
  uma relation.
- Seletor de visualizacao (quando existir) usa `RecordBrowserViewSwitcher`
  (`components/record-browser/RecordBrowserViewSwitcher.tsx`) com icones
  de `getStandardViewIcon` (`web-client/registry/view-icons.tsx`) - nunca
  um par de `<Button>` de texto tipo "Lista"/"Calendario". Sem borda nem
  fundo ao redor do Grupos de icones (`border-0 bg-transparent p-0` no
  `ToggleGroup`) - os icones ficam soltos, parecendo um controle so; cada
  opcao ja se distingue pelo sublinhado (`border-b-2`) quando ativa.
- Botao de criar e sempre "Novo", sempre `Button` solido (`variant`
  padrao = `bg-primary`, azul neste tema) - nunca um link de texto com
  seta, nunca um rotulo customizado tipo "Agendar encontros"/"Nova
  condicao"/"Novo vinculo". Rotulo diferente pra mesma acao (criar) passa
  a impressao de que sao coisas diferentes quando nao sao. `addLabel` foi
  removido do `RelationListHost` de proposito - nao reintroduzir.

**Filtros, agrupamento e colunas** (via `SearchPanelMenu`, jah embutido no
`RelationListHost` quando `filterFields` e informado):

- **Cada secao do painel de Filtros tem uma cor fixa** (padrao a partir
  de 2026-11-19, componente `PanelSection` em `SearchPanelMenu.tsx`, prop
  `tone`): Filtros = azul (`text-blue-600`/`dark:text-blue-400`), Agrupar
  por = verde (`text-emerald-600`/`dark:text-emerald-400`, icone
  `Layers`), Favoritos = roxo (`text-purple-600`/`dark:text-purple-400`).
  O icone do botao-gatilho "Filtros" na toolbar (`RecordListHost.tsx` e
  `RelationListHost.tsx`) tambem fica azul, nao cinza igual
  Colunas/Atualizar - e o unico dos 3 botoes de controle que abre esse
  painel colorido. Uma secao nova no painel (ex.: "Analise", generica,
  usada por pickers) fica com o `tone` padrao (`neutral`,
  `text-muted-foreground`) a menos que receba um `tone` proprio
  explicitamente - nao reaproveitar uma cor ja usada por Filtros/Agrupar/
  Favoritos pra outra coisa.
- **Os badges dentro do `SearchBar` (os "chips" que aparecem na propria
  barra de busca quando um filtro/agrupamento esta ativo - nao o painel
  de Filtros, que e o item anterior) seguem a mesma paleta** (padrao a
  partir de 2026-11-19, `getFacetClasses`/`getFacetIconClasses` em
  `SearchBar.tsx`): badge de agrupamento (`tone: "group"`, construido por
  `buildQueryFacets` em `queryFacets.tsx`) = verde
  (`border-emerald-500/20 bg-emerald-500/10 text-emerald-700`); badge de
  filtro (condicao de dominio, sem `tone` - o `default` da funcao) =
  azul (`border-blue-500/20 bg-blue-500/10 text-blue-700`). O sistema de
  `tone: "analysis"` (usado por paginas com breakdown analitico -
  Tasks/Programs/Projects/Deposit/Pantry/Admin, `analysisKind`
  `time`/`metric`/`chart`/`sort`) e um esquema **separado**, com paleta
  propria ja estabelecida (sky/emerald/cyan/amber/primario) - nao mudar
  junto, nao e a mesma coisa que o badge de filtro/Grupos do toolbar
  padrao.
- Agrupamento: todo campo que pode ter valores repetidos deveria estar
  disponivel em `groupByOptions`. Quando o campo nao e uma propriedade
  plana (ex.: uma lista de objetos relacionados, como Grupos),
  o `ListView` recebe `resolveGroupValue` (um calculo), nao so o nome do
  campo - ver `ListView.tsx`. Mostrar a contagem de cada Grupos como uma
  pilula (`rounded-full bg-muted`) do lado do rotulo, nunca so um numero
  solto no canto da linha.
- Qualquer campo `type: "date"` em `filterFields` ganha automaticamente
  um atalho de intervalo (De/Ate) no topo do painel de Filtros do
  `SearchPanelMenu`, sem precisar abrir "Filtro personalizado..." - isso
  e automatico (olha o `type` do campo), nao e algo que cada modulo liga
  na mao. Os campos De/Ate usam o mesmo estilo de linha do resto do
  formulario (so borda de baixo, sem caixa), um embaixo do outro, nunca
  lado a lado numa caixa com borda inteira.
- Colunas: passar `columns` pro `RelationListHost` liga o botao
  automaticamente (via `ColumnVisibilityProvider`/`ColumnVisibilityMenu`,
  `web-client/views/ListView.tsx`) - nao desligar com
  `showColumnVisibilityButton={false}` no `ListView` interno quando
  `columns` ja foi passado pro host (ficaria duplicado).
- **Um so vocabulario de nome de campo por relation.** `filterFields`
  (pro `Domain`/`SearchPanelMenu`) e `groupByOptions`+`resolveGroupValue`
  (pro `ListView`) sao dois mecanismos independentes, mas o `field`/
  `name` de cada campo tem que ser o mesmo nos dois - de preferencia o
  nome real da propriedade do dado (ex.: `scheduledDate`, nao uma
  traducao solta tipo `data`). Nomes diferentes pra a mesma coisa em
  cada mecanismo nao quebram nada na hora, mas viram um jeito facil de
  introduzir um bug silencioso depois (um `groupByOptions` novo copiado
  com o nome errado some sem erro, tudo cai em "Sem valor"). Ver
  `action-occurrences-section.tsx` como referencia - `status`/
  `peopleGroups`/`scheduledDate` usados identicos nos dois lugares.

**Tabela:**

- Largura de coluna, truncamento, tooltip, zebra e padding lateral - ver
  "Tabela (`ListView`): largura de coluna, truncamento, tooltip, zebra e
  padding" mais acima; vale igual dentro de uma relation, nenhuma regra
  extra aqui.
- `ListView` com `bordered={false}` dentro de uma relation do
  `RelationListHost` - sem a borda **externa** do cartão (`ModuleSurface`),
  já que a relation mora dentro da moldura do próprio Detail. `bordered`
  e opcional (padrao `true`, preserva o visual de qualquer `ListView` fora
  desse contexto, ex.: List Principal). **Mudança em 2026-11-20:** as
  linhas divisórias internas (cabeçalho e corpo) não são mais desligadas
  por essa prop - seguem `--table-border` (`globals.css`) em qualquer
  `ListView`, bordered ou não, porque a cor virou configurável/sutil e não
  fazia sentido continuar some com ela só nas relations.
- O checkbox do cabecalho (quando `enableRowSelection`) fica alinhado
  com os checkboxes das linhas - bug corrigido globalmente no `ListView`
  (o cabecalho tinha um wrapper extra sem `justify-center`); nao
  reintroduzir um wrapper proprio pro checkbox do cabecalho.
- **Sem coluna de Acoes por linha quando a mesma operacao ja existe de
  outro jeito**: clicar na linha abre pra editar (`onRowClick`), marcar o
  checkbox de uma ou mais linhas + "Excluir selecionados" cobre exclusao.
  So adicionar um botao de acao por linha quando a acao nao tiver outro
  caminho (ex.: uma acao que nao e editar nem excluir).

### Textos visiveis ao usuario: idioma e tamanho (padrao a partir de 2026-11-19)

Vale pra List Principal, Detail e relation - qualquer texto que o
usuario le. Dois bugs reais motivaram esta secao: o badge de
agrupamento de uma relation (`RelationListHost`) mostrando o nome bruto
do campo em ingles (`peopleGroups` em vez de "Grupos de pessoas") porque
o `searchView` usado pro calculo do label nao tinha `groupBy`
preenchido; e o badge de um filtro de periodo ficando grande demais e
cortando o texto porque a data aparecia em ISO cru (`2026-01-01`) em vez
do formato pt-BR, e o `max-width` do chip era pequeno demais pro
conteudo real.

**Por que isso escapa de revisao visual normal:** um campo de busca ou
de Grupos quase sempre esta correto na tela onde o usuario o configurou
(ex.: o menu "Agrupar por" mostra o `label` certo, porque ele vem direto
de `groupByOptions`) - o texto errado so aparece *depois*, no badge/chip
que representa esse filtro/Grupos *ja aplicado*, calculado por um
caminho de codigo diferente (`queryFacets.tsx`, nao o menu em si). Ao
revisar um filtro/agrupamento/coluna novo, **sempre aplicar de verdade e
olhar o badge resultado na barra de busca**, nao so abrir o menu e
conferir a lista de opcoes - os dois usam fontes de dados diferentes e
podem divergir silenciosamente.

Regras:

- **Nenhum texto visivel cai pro nome bruto do campo/variavel em
  ingles.** Toda config que define um campo pesquisavel/agrupavel
  (`filterFields`, `groupByOptions`, `columns`) tem que ter um `label`
  explicito em pt-BR - e qualquer funcao que *deriva* um label a partir
  dessas configs (`groupByLabel`/`fieldLabel` em `queryFacets.tsx`,
  `resolveColumnDefLabel` em `ListView.tsx`) deve conseguir achar esse
  label, nao cair num fallback pro `field`/`id` bruto. Se um fallback pro
  nome bruto existir por seguranca (nunca travar a tela), tratar
  qualquer ocorrencia dele como bug de configuracao, nao comportamento
  esperado - geralmente significa que uma config em algum lugar nao
  propagou os labels pra o lugar certo (foi o caso do `groupBy` ausente
  no `searchView` do `RelationListHost` - corrigido preenchendo
  automaticamente a partir de `groupByOptions`, entao hoje isso e
  automatico pra qualquer modulo que ja passa `groupByOptions` com label
  certo).
- **Datas em texto visivel usam `formatDateOnlyPtBR`
  (`@/lib/date.ts`)**, nunca ISO cru (`YYYY-MM-DD`) nem um `.slice()`
  manual - vale pra badges/chips, nao so pra campos de formulario (que
  ja seguiam isso). `describeValue` em `queryFacets.tsx` e a referencia.
- **Badge/chip de filtro ou Grupos ativo** (`SearchBar.tsx`,
  `getFacetClasses`): o texto usa `max-w-[18rem] truncate` - largo o
  bastante pra um "Campo entre DD/MM/AAAA → DD/MM/AAAA" inteiro sem
  cortar, mas ainda com um teto pra textos realmente longos (ex.: um
  filtro avancado com varias condicoes). Se um novo tipo de filtro
  gerar um texto tipicamente mais longo que isso, aumentar esse
  `max-w-*` em vez de abreviar o texto de um jeito que perca
  informacao - o mecanismo de colapso (`+N`, baseado em largura real
  medida) ja absorve o espaco extra sem quebrar o layout.

### FormulÃ¡rio principal (`detailSlot`)

- **Primeira linha do formulario, sempre nesta ordem:** Titulo -
  Status - Tipo - relacionamento principal/dependente do modulo (ex.:
  Projeto, na Atividade). Sem heading "Organizacao" acima - os 4 campos
  dividem um grid so (`md:grid-cols-[1.5fr_180px_200px_220px]` na
  Atividade - Titulo mais largo, os outros compactos), mesmo estilo de
  linha dos demais campos. Referencia: `ActivityDetailMain` em
  `actions-detail-layout-contract.tsx`.
- Nao usar titulo + paragrafo descritivo em cabecalho de secao. Se o campo precisar de contexto, o contexto vai no `placeholder` ou em texto de ajuda inline no proprio campo - nunca um paragrafo de 1-2 linhas acima da secao.
- Cabecalho de secao (quando o formulario tem mais de um Grupos de campos) usa `DetailSectionHeading` de `web-client/detail/DetailFormSection.tsx`: titulo curto + barra de acento colorida a esquerda. Sem linha divisoria cinza, sem descricao.
- Rotulo de campo usa `DetailSectionField` do mesmo arquivo: label pequeno em maiusculas acima do campo. Nao reimplementar esse label por modulo (varios modulos tinham a mesma constante `fieldLabelClassName`/`SectionField` copiada - foi consolidado).
- Formulario com 1 Grupos so de campos (sem sub-secoes) pode usar `DetailSectionField` direto, sem `DetailSectionHeading`.
- **Todo campo que recebe dado (`Input`, `Select`, data, numero, texto) usa `DETAIL_LINE_INPUT_CLASS_NAME`** - e pra `Textarea`, `DETAIL_LINE_TEXTAREA_CLASS_NAME` - os dois exportados de `web-client/detail/DetailFormSection.tsx`: so borda embaixo, sem caixa, sem sombra. Essa e a unica fonte - nunca escrever essa `className` de novo num modulo (3 copias dessa mesma string ja existiram, com a opacidade da borda ate divergindo entre elas - `border-border/60` vs `/70`). Tamanho proprio do campo (`h-8` num filtro compacto, `min-h-[Npx]` numa `Textarea` maior) e um `cn(DETAIL_LINE_INPUT_CLASS_NAME, "...")` por cima, nunca reescrever a base. Vale pro formulario principal do Detail **e** pros filtros de uma relation (ex.: `QuickDateRangeFilter` em `SearchPanelMenu.tsx`) - qualquer lugar do sistema que peca um valor ao usuario.

### Create reaproveita o formulário de edit, nunca um componente paralelo (padrão a partir de 2026-11-20, referência: Atividade)

**Regra, sem exceção:** o `detailSlot` de `create` e `edit` é a mesma função/componente React. Nunca um segundo componente (outro arquivo, outro JSX) que só é usado quando `mode === "create"` — isso é exatamente o anti-padrão que esta seção existe pra proibir (ver bullet "`new` e `edit` usam o mesmo formulário" em `detailSlot` acima). Atividade foi a prova de que isso é viável mesmo quando `create` e `edit` historicamente divergiram: `ActivityDetailMain` (`actions-detail-layout-contract.tsx`) virou o único renderizador, usado nos dois modos; o antigo `ActionCreateFormSection` (um componente à parte, com seu próprio estado e seu próprio `handleSubmit`) foi apagado, não mantido como alternativa.

Mecanismo, generalizável pra qualquer módulo que ainda tenha o mesmo problema (Projects e People já faziam assim antes de Atividade alcançar o padrão - não é novo, só estava documentado de menos):

- O componente do `detailSlot` recebe `mode: "create" | "edit"` como prop e ramifica **só o campo que precisa**, nunca o formulário inteiro. Um campo cujo valor é fixo em `edit` (porque já existe um registro) mas precisa ser escolhido em `create` (porque ainda não existe) mostra texto read-only num modo e um `<Select>`/`<Input>` editável no outro, dentro do mesmo bloco JSX - ver o campo "Projeto" em `ActivityDetailMain` (texto fixo em `edit`, `<Select>` de projetos em `create`, porque `/actions/new` pode chegar sem saber o projeto ainda).
- O `draft`/`setDraft` já existe nos dois modos (o mesmo hook/estado que `edit` usa pra popular o formulário a partir do registro carregado também funciona vazio em `create` - ver `buildDraft()` sem argumento). `onCommitField` (o callback que o formulário chama a cada campo) pode continuar sendo chamado igual nos dois modos: em `edit` ele persiste o campo (autosave `field-commit`); em `create`, como o autosave fica desabilitado (`enabled: mode === "edit"` no `useDetailAutoSaveController`, ou simplesmente um no-op quando a página de criação não usa esse hook), a chamada não faz nada - o valor já foi atualizado na tela via `setDraft` no `onChange`, então nenhum dado se perde.
- A criação de fato (chamar o endpoint de `create`, validar o mínimo, redirecionar pro Detail do registro criado) é **um botão só**, ligado via `onSave` do `DetailShellEngine` (`mode="create"` + `onSave={handleCreate}` já renderiza o botão "Salvar" padrão no header - não criar um botão de rodapé próprio do módulo).
- Validação do lado do cliente, antes de chamar o endpoint, deve ficar mínima (campos obviamente vazios: título, tipo, etc.) - regra de negócio mais específica (ex.: "Grupos é obrigatório pra este tipo de atividade") já é validada pelo backend com mensagem em pt-BR; repetir a mesma regra no cliente é duplicar lógica que pode divergir da do servidor com o tempo. Deixe o `catch` genérico (que já existe pra qualquer chamada de API) mostrar a mensagem de erro do backend.

**Legado ainda não migrado:** nenhum módulo canônico tem esse problema hoje (Atividade foi o último). Se aparecer de novo (um módulo novo, ou um módulo que ganhe um formulário de `create` separado por atalho), é bug de implementação, não uma variação aceitável.

### Campo obrigatório: asterisco via `DetailSectionField` (padrão a partir de 2026-11-20)

Todo campo que o usuário precisa preencher pra salvar o registro (ou pra habilitar uma ação específica, como publicar) mostra um asterisco vermelho ao lado do label: `<DetailSectionField label="Título" required>`. A prop `required` mora em `DetailSectionField` (`web-client/detail/DetailFormSection.tsx`), é compartilhada por todo o sistema - não reimplementar o asterisco por módulo, e não usar outro símbolo/cor pra sinalizar obrigatoriedade.

Regras de quando marcar:

- **`required` só quando o dado é de fato exigido pra salvar** - a mesma regra que o backend (`class-validator` no DTO, ou uma checagem explícita no service) já aplica. Não marcar um campo como obrigatório "porque parece importante" sem checar o DTO/service correspondente; e não deixar de marcar um campo que o backend rejeita se vier vazio. Referência de como achar a regra real: `backend/src/modules/actions/dto/create-project-action.dto.ts` (campos sem `@IsOptional()` são obrigatórios) e, quando a regra depende de outro campo (não é so presença/ausência), o `service` correspondente (ex.: `actions.service.ts` - "Grupos e obrigatorio para este tipo de acao").
- **`required` pode ser estático ou condicional.** Estático: `required` sempre `true` (ex.: Título, Tipo de Atividade - vazios em qualquer cenário fazem o backend rejeitar). Condicional: `required={expressão}`, quando a obrigatoriedade depende do valor de outro campo (ex.: o campo "Grupos" da Atividade só é obrigatório quando o Tipo selecionado tem `target === "PEOPLE_GROUP"` - `required={isPeopleGroupTarget}`) ou do próprio `mode` (ex.: "Projeto" só é um campo editável, e só então obrigatório, em `create` - `required={canChooseProject}`, onde `canChooseProject = mode === "create"`). Um campo que é sempre somente-leitura em `edit` não precisa do asterisco nesse modo, mesmo que o dado por trás seja obrigatório - o asterisco é um sinal de "preencha isto", não faz sentido sobre um campo que o usuário não pode editar ali.
- Campo com valor padrão sempre preenchido (ex.: Status, que nunca fica vazio porque o `<Select>` já nasce com um valor) não leva asterisco - não há risco real do usuário "esquecer" de preencher algo que já vem preenchido.
- Referência viva: `ActivityDetailMain` (`actions-detail-layout-contract.tsx`) - Título e Tipo estáticos, Grupos e Projeto condicionais.

### Nao e regra do Detail

`ModuleSectionHeader` (tambem em `ModulePrimitives.tsx`) continua existindo e pode usar `description` - ele e para cabecalho de lista/relation/overview, nao para o formulario principal do Detail. Nao confundir os dois.
