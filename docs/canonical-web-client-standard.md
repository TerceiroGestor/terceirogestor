# Padrão Canônico do Web Client

## Objetivo

Todo módulo do sistema deve usar a mesma estrutura visual e comportamental. O usuário não deve reaprender a interface ao mudar de módulo.

## Estrutura obrigatória

Cada módulo canônico tem:

1. rota principal `/module`
2. detail em `/module/new` e `/module/[id]`
3. list principal com `RecordListHost`
4. detail com `DetailShellEngine`
5. side padrão com `StandardDetailMetadataSide`

## List Principal

O list principal é sempre construído no mesmo padrão:

- botão principal `Novo`
- `SearchPanel` único do sistema
- `Filter` e `Group` no menu do painel
- `typeviews` no mesmo conjunto padrão
- colunas base comuns do módulo

### SearchPanel

O `SearchPanel` não deve ganhar barras paralelas, filtros fora do menu ou controles exclusivos do módulo.

O padrão canônico permite:

- busca textual
- favoritos
- `Filter`
- `Group`
- refresh
- contador

Se o módulo precisar de filtros por `Projeto`, `Grupo`, `Status` ou qualquer outro campo, isso entra no próprio `SearchPanelMenu`.

### Typeviews padrão

Quando o módulo suportar visualização analítica, usar somente a base compartilhada:

- `Tabela`
- `Kanban`
- `Timeline`
- `Calendário`
- `Gantt`
- `Gráfico`

Não criar typeview alternativo fora desses componentes.

### Colunas base

Todo list principal deve expor, quando fizer sentido:

- coluna principal do item
- `Tags`
- `Cadastro`
- `Status`

Outras colunas entram conforme o domínio, mas essas são a base visual do sistema.

## Detail

O detail é o centro de gestão do item.

### Regra de layout

O detail canônico é dividido em 4 zonas:

1. `headSlot`
2. `detailSlot`
3. `sideSlot`
4. `relationSlot`

### headSlot

O `headSlot` contém:

- título do item
- status
- ações de topo

Regras:

- o botão `Novo` não aparece no detail
- a ação destrutiva principal é `Excluir`, quando permitida
- `new` e `edit` usam o mesmo cabeçalho e a mesma estrutura

### detailSlot

O `detailSlot` é o formulário principal do item.

Regras:

- `new` e `edit` usam o mesmo formulário
- não criar formulário antigo para `new` e outro para `edit`
- o formulário principal é sempre editável
- o módulo não deve depender de `FormEngine` legado
- os campos principais do item ficam aqui, não no `sideSlot`

### sideSlot

O `sideSlot` é único e padronizado.

Abas canônicas:

- `Auditoria`
- `Comentarios`
- `Notas internas`
- `Tags`
- `Anexos`
- `Historico`
- `Contexto`

Regras:

- `Tags` ficam somente no `sideSlot`
- não duplicar `Tags` no corpo principal
- `Historico` deve nascer da auditoria canônica sempre que possível
- `Comentarios` usam menção por `@`
- `Anexos` usam o fluxo padrão de upload e exclusão

### relationSlot

O `relationSlot` representa relações do item com outros registros.

Regras:

- relations ficam no rodapé do detail
- cada relation deve se comportar como um list do sistema
- usar `ListView` e o host relacional compartilhado
- clicar em um item da relation deve abrir o detail do item relacionado
- `Novo` dentro da relation abre o fluxo de criação relacional correto
- evitar cards operacionais isolados quando a relação puder ser modelada como list

## Regras de implementação

### Obrigatório

- `RecordListHost` no list principal
- `DetailShellEngine` no detail
- `StandardDetailMetadataSide` no side
- `RelationListHost` ou relation equivalente do web-client no rodapé

### Proibido

- criar page paralela fora do shell padrão
- criar `SearchPanel` customizado por módulo
- criar layout diferente entre `new` e `edit`
- deixar `Tags` no body principal
- usar componentes legados quando já existir capability canônica

## Checklist rápido

Um módulo só é canônico quando:

- `/module` usa o list padrão
- `/module/new` abre o detail padrão
- `/module/[id]` usa o mesmo detail padrão
- `sideSlot` tem a estrutura fixa
- `relationSlot` usa list relacional
- `SearchPanel` funciona igual aos outros módulos
- as mesmas views estão disponíveis quando o domínio suporta
