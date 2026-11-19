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
`stickyHeaderOffsetClassName` (`ListView`) - usar so quando uma relation
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
2026-11-18. Projects, Programs e People-Groups ainda tem essa barra nos
seus `header.slot` - migrar quando esses modulos forem revisados (ver
`docs/backlog.md`), removendo a funcao que monta a barra por inteiro, nao
so escondendo. **Isso nao afeta o fundo do header** (`bg-toolbar`,
proxima secao) - esse ja e automatico pra todo modulo, inclusive os 3
que ainda tem a barra antiga; a barra antiga so fica visualmente mais
cheia dentro do mesmo fundo, ate ser migrada.

### Abas

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

### Cabecalho de tabela fixo dentro de uma relation `flushToolbar`

Quando a relation `flushToolbar` tem muitos registros e a tabela rola, o
cabecalho de colunas (`<thead>`) tambem deveria ficar fixo, logo abaixo
da toolbar - senao ele rola junto com as linhas e passa por baixo (ou,
sem o ajuste certo, por cima) da toolbar/abas. Mecanismo (`ListView.tsx`):

- Prop `stickyHeaderOffsetClassName` no `ListView` - quando informada,
  substitui o `top-0` padrao do `<TableHeader>` por um offset customizado
  (ex.: `"top-[117px]"` = 44px das Abas + 73px da toolbar `flushToolbar`
  com `py-4`). So usar quando o `ListView` estiver dentro de uma relation
  `flushToolbar`; em qualquer outro lugar (List Principal, relations
  normais) o padrao (`top-0`, sem a prop) continua certo.
- Passar essa prop tambem muda automaticamente, dentro do `ListView`, o
  `overflow` de 3 wrappers internos pra `visible` (o wrapper proprio, o
  container do componente base `Table` via nova prop `containerClassName`
  em `components/ui/table.tsx`, e o `ModuleSurface` que embrulha o
  `ListView` inteiro) - necessario pelo motivo da proxima secao. Nenhum
  desses 3 muda quando a prop nao e passada - zero efeito em qualquer
  outro uso de `ListView`/`Table`.
- Referencia completa: `action-occurrences-section.tsx` (Encontros),
  unico uso ate agora.

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

- `ListView` com `bordered={false}` dentro de uma relation do
  `RelationListHost` - sem borda externa nem linhas divisorias entre
  cabecalho/linhas. `bordered` e opcional (padrao `true`, preserva o
  visual de qualquer `ListView` fora desse contexto, ex.: List Principal).
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

### Nao e regra do Detail

`ModuleSectionHeader` (tambem em `ModulePrimitives.tsx`) continua existindo e pode usar `description` - ele e para cabecalho de lista/relation/overview, nao para o formulario principal do Detail. Nao confundir os dois.
