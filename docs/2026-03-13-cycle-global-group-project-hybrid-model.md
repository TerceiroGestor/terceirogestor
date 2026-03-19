# Modelo Hibrido: Cycle Global e Group Interno ao Project

> Documento superado conceitualmente pelo modelo em [2026-03-13-people-unified-participation-model.md](/c:/server/system_development/docs/2026-03-13-people-unified-participation-model.md).

## Objetivo

Definir uma modelagem de negocio e uma estrategia de migracao para suportar:

- `cycle` como estrutura institucional reutilizavel
- `project` selecionando um ou mais ciclos que atende
- `group` permanecendo interno ao projeto como agrupamento operacional flexivel
- `actions` podendo operar por projeto, ciclo e grupo sem quebrar o padrao canonical do `web-client`

Este documento complementa:

- `docs/standards/record-module-starter.md`
- `docs/2026-03-13-web-client-centralization-plan.md`
- `docs/2026-03-13-web-client-pilot-migration-projects-programs-actions.md`

## Contexto de negocio

Pelos cenarios levantados, `cycle` nao esta funcionando apenas como uma subdivisao operacional do projeto.
Ele representa principalmente:

- turma cronologica
- faixa etaria
- publico pedagogico
- jornada formativa institucional

Ja `group` atende melhor a um papel operacional interno, por exemplo:

- reorganizar participantes para uma acao especifica
- separar meninos e meninas quando a atividade exigir
- montar grupos por horario, facilitador, territorio ou dinamica local

Tambem existe o caso de projetos voltados para familiares, o que reforca a necessidade de um catalogo de ciclos mais flexivel, institucional e configuravel.

## Decisao recomendada

Adotar um modelo hibrido:

- `Cycle` vira catalogo institucional global por tenant
- `Project` passa a selecionar um ou mais ciclos via uma entidade de vinculo
- `Group` continua como entidade filha operacional do projeto
- matricula em projeto continua explicita
- participacao em ciclo acontece no contexto do projeto

Resumo:

- `cycle` = estrutura institucional
- `projectCycle` = uso do ciclo dentro do projeto
- `group` = agrupamento operacional local do projeto

## O que nao recomendamos

### 1. Nao manter `cycle` preso diretamente ao projeto para sempre

Isso limita a flexibilidade para:

- reaproveitar turmas cronologicas entre projetos
- consolidar relatorios institucionais por ciclo
- atender ONGs com modelos pedagogicos mais amplos

### 2. Nao compartilhar diretamente a mesma entidade operacional de ciclo entre projetos sem camada de vinculo

Isso introduz ambiguidade em:

- participantes
- datas
- capacidade
- auditoria
- regras de permissao
- relatorios

### 3. Nao matricular automaticamente todas as pessoas de um ciclo no projeto apenas porque o ciclo foi vinculado

Isso parece agilizar a operacao, mas cria riscos:

- matriculas sem intencao operacional explicita
- participantes indevidos no projeto
- historico confuso
- dificuldade para relatorios e auditoria
- pouca aderencia a regras reais de vagas, consentimento, territorio ou triagem

Regra recomendada:

- vincular um ciclo ao projeto habilita aquele ciclo dentro do projeto
- matricular uma pessoa no projeto continua sendo uma acao explicita
- a matricula pode opcionalmente escolher um ciclo inicial entre os ciclos habilitados no projeto

## Modelo conceitual recomendado

### 1. `Cycle`

Catalogo institucional da ONG.

Responsabilidade:

- definir turmas cronologicas
- definir recortes por faixa etaria
- definir publicos como infancia, adolescencia ou familiares
- servir como base reutilizavel para varios projetos

Exemplos:

- `C1 Manha`
- `C2 Tarde`
- `Adolescentes 12-14`
- `Familiares`

### 2. `ProjectCycle`

Entidade de vinculo entre `Project` e `Cycle`.

Responsabilidade:

- declarar que um projeto atende determinado ciclo institucional
- guardar configuracoes operacionais do ciclo naquele projeto
- servir como contexto para participacoes e relatorios dentro do projeto

Exemplos de dados proprios do vinculo:

- status
- datas no contexto do projeto
- capacidade
- observacoes internas

### 3. `ProjectEnrollment`

Matricula da pessoa no projeto.

Responsabilidade:

- representar o atendimento real daquela pessoa no projeto
- ser a base para participacao em ciclo, grupo e acao

### 4. `ProjectEnrollmentCycleParticipation`

Participacao da matricula em um `ProjectCycle`.

Responsabilidade:

- dizer em qual ciclo daquele projeto a pessoa esta ou esteve
- preservar historico com encerramento logico

### 5. `ProjectGroup`

Entidade filha do projeto.

Responsabilidade:

- organizar participantes do projeto em agrupamentos operacionais
- permitir reorganizacao rapida sem alterar a estrutura institucional de ciclos

### 6. `ProjectEnrollmentGroupMembership`

Participacao da matricula em um `ProjectGroup`.

Responsabilidade:

- manter o historico de passagem por grupos
- permitir mudancas ao longo do tempo

## Entidades e relacoes

### Estrutura alvo

- `Cycle` pertence ao tenant
- `ProjectCycle` vincula `Project` a `Cycle`
- `ProjectEnrollment` vincula `Person` a `Project`
- `ProjectEnrollmentCycleParticipation` vincula `ProjectEnrollment` a `ProjectCycle`
- `ProjectGroup` pertence ao `Project`
- `ProjectEnrollmentGroupMembership` vincula `ProjectEnrollment` a `ProjectGroup`

### Leitura de negocio

- o projeto escolhe quais ciclos atende
- a pessoa entra no projeto por matricula explicita
- a matricula pode ser associada a um ciclo do projeto
- grupos reorganizam operacionalmente os matriculados
- acoes podem segmentar por projeto, ciclo e grupo

## Proposta de Prisma

O schema abaixo e ilustrativo e mostra a direcao recomendada.

### `Cycle`

```prisma
model Cycle {
  id            String   @id @default(uuid()) @db.Char(36)
  tenantId      String   @db.Char(36)
  name          String
  description   String?  @db.Text
  audienceType  String?
  ageMin        Int?
  ageMax        Int?
  isActive      Boolean  @default(true)
  internalNotes String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  projectCycles ProjectCycle[]

  @@unique([tenantId, name])
  @@index([tenantId])
}
```

### `ProjectCycle`

```prisma
model ProjectCycle {
  id            String   @id @default(uuid()) @db.Char(36)
  tenantId      String   @db.Char(36)
  projectId     String   @db.Char(36)
  cycleId       String   @db.Char(36)
  startsAt      DateTime?
  endsAt        DateTime?
  status        String?
  capacity      Int?
  internalNotes String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  project        Project  @relation(fields: [projectId], references: [id])
  cycle          Cycle    @relation(fields: [cycleId], references: [id])
  participations ProjectEnrollmentCycleParticipation[]

  @@unique([tenantId, projectId, cycleId])
  @@index([tenantId])
  @@index([projectId])
  @@index([cycleId])
}
```

### `ProjectEnrollmentCycleParticipation`

```prisma
model ProjectEnrollmentCycleParticipation {
  id                  String      @id @default(uuid()) @db.Char(36)
  tenantId            String      @db.Char(36)
  enrollmentId        String      @db.Char(36)
  projectCycleId      String      @db.Char(36)
  startsAt            DateTime?
  endsAt              DateTime?
  status              String?
  isActive            Boolean     @default(true)
  deletedAt           DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  tenant              Tenant      @relation(fields: [tenantId], references: [id])
  enrollment          ProjectEnrollment @relation(fields: [enrollmentId], references: [id])
  projectCycle        ProjectCycle      @relation(fields: [projectCycleId], references: [id])

  @@index([tenantId])
  @@index([enrollmentId])
  @@index([projectCycleId])
}
```

### Observacoes importantes

- `Cycle` nao precisa carregar datas operacionais obrigatorias
- datas do uso do ciclo dentro do projeto devem ficar em `ProjectCycle`
- `ProjectGroup` continua vinculado diretamente a `Project`
- participacoes em ciclo e grupo devem preservar historico por `deletedAt`, `endedAt`, `isActive` ou equivalente

## Impacto na UX

## Principio geral

O frontend deve seguir os padroes canonicals ja definidos para o `web-client`.

Isso significa:

- rota principal de modulo em `table-view`
- search cobrindo todas as colunas visiveis
- search com icone de lupa e placeholder `Pesquisar`
- `detail` com formulario completo
- side com auditoria e anotacoes quando aplicavel
- relations em tabs no footer
- relation toolbar compacta com search e add
- pickers canonicals em dialog com `table-view`, nunca com `DataTable`, quando fizerem parte do fluxo do modulo

## UX do modulo `cycle`

### Rota principal

- `/cycle`

### Papel do modulo

Gerenciar o catalogo institucional de ciclos.

### Fluxo canonical

- list principal em `table-view`
- outras views apenas se fizerem sentido para analise institucional
- row action abre `detail` do ciclo global
- `detail` contem formulario completo do ciclo
- side com auditoria e anotacoes

### Campos recomendados

- nome
- tipo de publico
- faixa etaria
- descricao
- notas internas
- status

### O que nao acontece aqui

- este modulo nao gerencia matriculas diretamente
- este modulo nao mostra grupos
- este modulo nao mistura participantes de varios projetos numa unica operacao

## UX do modulo `project`

### Tab `Ciclos`

`projects > ciclos` deixa de apontar para o ciclo global puro e passa a listar `ProjectCycle`.

Tipo canonical:

- `association relation` com detalhe proprio do vinculo

Fluxo:

- `Adicionar ciclo` abre dialog com o modulo `cycle` em `table-view`
- cada row do dialog tem acao para adicionar o ciclo ao projeto
- o dialog nao fecha automaticamente ao adicionar, para permitir varios vinculos sequenciais
- ao clicar na row da tab de ciclos, abre o `detail` do `ProjectCycle`

### Detail de `ProjectCycle`

Esse detalhe deve ser um detalhe canonical completo:

- formulario principal com dados do vinculo no projeto
- side com auditoria e anotacoes
- relation/tab de participantes do ciclo no contexto do projeto

### Tab de participantes dentro de `ProjectCycle`

Tipo canonical:

- `scoped relation`

Fluxo:

- `Adicionar participante` abre dialog com os matriculados do projeto em `table-view`
- search do dialog pesquisa todas as colunas visiveis
- cada row adiciona imediatamente ao ciclo atual
- row da relacao abre o `detail` da pessoa
- acao de remocao deve encerrar vinculacao, nunca apagar historico

### Tab `Grupos`

`projects > grupos` continua como:

- `child relation`

Fluxo:

- `Adicionar grupo` abre o `detail` de criacao do grupo
- row da tab abre o `detail` do grupo
- o `detail` do grupo segue o canonical completo com side e participantes em `scoped relation`

### Tab `Participantes`

Continua como:

- `association relation`

Fluxo:

- `Novo participante` abre dialog com `people` em `table-view`
- search do dialog cobre todas as colunas visiveis
- row action adiciona a pessoa ao projeto
- o dialog nao fecha automaticamente para permitir varias matriculas
- row da relacao abre o `detail` da pessoa
- acao de remocao encerra matricula com historico

## UX de `group`

O modulo `group` continua existindo como modulo principal e tambem como detalhe filho dentro de projeto.

### Papel do modulo

- consultas e analises sobre grupos
- operacao detalhada de cada grupo

### Fluxo canonical

- rota principal em `table-view`
- side no `detail`
- participantes como `scoped relation`
- `Adicionar participante` mostra apenas matriculados do projeto

## Impacto em `actions`

`actions` precisa considerar este desenho como contrato de segmentacao.

Uma acao pode ser direcionada por:

- projeto
- ciclos habilitados naquele projeto
- grupos daquele projeto
- filtros adicionais das pessoas quando necessario

Exemplos:

- acao para um ciclo especifico do projeto
- acao para um grupo operacional especifico
- acao para familiares em um projeto que atende o ciclo institucional `Familiares`
- acao para participantes de um grupo montado por criterio pratico, como somente meninos

## Regras de negocio recomendadas

### 1. Vincular ciclo ao projeto nao matricula pessoas automaticamente

Essa regra deve permanecer explicita no backend e no frontend.

Comportamento recomendado:

- criar o projeto
- selecionar um ou mais ciclos atendidos
- depois matricular pessoas no projeto
- opcionalmente definir o ciclo inicial da matricula

### 2. Matricula pode sugerir ciclo, mas nao exigir automacao em massa

Ao matricular uma pessoa no projeto, o formulario pode permitir:

- matricular sem ciclo inicial
- matricular e ja associar a um dos ciclos habilitados

Isso acelera a operacao sem forcar uma regra automatica perigosa.

### 3. `Group` continua livre para reorganizacao operacional

Participantes do projeto podem ser reorganizados em grupos independentemente do ciclo, conforme a necessidade da ONG.

### 4. Encerramentos devem preservar historico

Para projeto, ciclo e grupo:

- nunca hard delete em membership relevante
- usar encerramento logico
- preservar auditoria e relatorios historicos

## Cenarios que essa modelagem atende melhor

### ONG com trilha pedagogica institucional

- `Cycle` representa etapas institucionais
- varios projetos usam os mesmos ciclos
- cada projeto decide quais ciclos atende

### ONG com publico de familiares

- existe um ciclo institucional `Familiares`
- um projeto pode habilitar esse ciclo
- acoes e relatorios conseguem segmentar esse publico sem hack de modelagem

### ONG com reorganizacao operacional frequente

- `Group` permite montar recortes temporarios
- isso nao exige alterar a estrutura de ciclos

### ONG com acoes especificas por publico

- acoes podem cruzar projeto, ciclo, grupo e atributos das pessoas
- isso suporta cenarios como oficinas por faixa etaria ou por recorte operacional

## Ordem segura de migracao

### Etapa 1. Criar o catalogo global de `Cycle`

Sem remover o modelo atual.

Entregas:

- tabela `Cycle`
- modulo `/cycle` canonical
- CRUD completo com list, detail, side, auditoria e anotacoes

### Etapa 2. Criar `ProjectCycle`

Sem desligar ainda o modelo antigo.

Entregas:

- nova tabela de vinculo `ProjectCycle`
- APIs para adicionar e remover ciclos do projeto com historico
- tab `projects > ciclos` preparada para listar o novo vinculo

### Etapa 3. Migrar o frontend de `projects > ciclos`

Entregas:

- `Adicionar ciclo` usando dialog com `cycle` em `table-view`
- row da tab abrindo o `detail` do vinculo `ProjectCycle`
- detail de `ProjectCycle` com side, auditoria, anotacoes e participantes

### Etapa 4. Migrar participacoes em ciclo

Entregas:

- `ProjectEnrollmentCycleParticipation` passando a apontar para `ProjectCycle`
- script de backfill dos dados atuais
- adaptacao das relacoes e filtros

### Etapa 5. Ajustar `actions`

Entregas:

- filtros por projeto, ciclo do projeto e grupo
- garantia de consistencia nas segmentacoes

### Etapa 6. Descontinuar o modelo antigo de ciclo filho do projeto

So depois de:

- migrar dados
- validar relatorios
- validar auditoria
- validar fluxos canonicals no frontend

## Impacto esperado

### Positivos

- mais flexibilidade para diferentes ONGs
- reaproveitamento institucional de ciclos
- melhor base para relatorios e segmentacao
- grupos continuam simples e operacionais
- modelo mais aderente aos cenarios reais descritos

### Custos

- mais uma camada conceitual: `Cycle` x `ProjectCycle`
- migracao de schema e dados
- ajuste dos fluxos de detalhe e relacoes
- adaptacao de `actions` para o novo contexto

## Recomendacao final

Seguir com o modelo hibrido:

- `cycle` global institucional
- `projectCycle` como vinculo contextual no projeto
- `group` interno ao projeto
- matricula explicita, nunca automatica em massa por vinculo de ciclo

Essa abordagem preserva simplicidade operacional onde ela importa, mas abre o produto para uma modelagem mais reutilizavel e mais adequada para diferentes ONGs sem romper o padrao canonical do frontend.
