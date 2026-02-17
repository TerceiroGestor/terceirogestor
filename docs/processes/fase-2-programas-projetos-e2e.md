# Processo E2E — Fase 2 (Programas, Projetos, Participantes, Grupos e Ciclos)

Estado: **concluído (core)** — 2026-02-17

## Objetivo
Entregar a organização institucional para execução de serviços/ações: **Programas** → **Projetos** → **Participantes**, com **Grupos** e **Ciclos** gerenciáveis e regras consistentes para histórico.

## Escopo (o que entra no core)
- Cadastro e gestão de **Programas**.
- Cadastro e gestão de **Projetos** (vinculados a um programa).
- **Participantes do projeto (matrículas)**:
  - vincular pessoa ao projeto;
  - listar, editar status e período;
  - encerrar (preenche apenas término);
  - remover;
  - vínculo e ações em massa.
- **Estrutura do projeto**:
  - **Grupos** (múltiplos simultâneos por pessoa, com histórico);
  - **Ciclos** (1 ativo por vez, com histórico de participações).

## Regras de negócio (resumo)
### Matrícula (participante no projeto)
- Matrícula representa o vínculo **Pessoa ↔ Projeto**.
- Ao criar matrícula, **data de início deve ser preenchida automaticamente** (padrão: hoje).
- Encerrar matrícula: altera `status=ENDED` e **preenche somente `endsAt`** (padrão: hoje, fim do dia).

### Grupos (N:N, simultâneos)
- Uma pessoa vinculada ao projeto pode estar em **vários grupos ao mesmo tempo**.
- A participação em grupo deve ter **histórico** (`startsAt`/`endsAt`) e evitar duplicidade de vínculo ativo no mesmo grupo.

### Ciclos (1 ativo por vez, com histórico)
- Uma pessoa vinculada ao projeto participa de **um ciclo por vez**.
- Trocar ciclo:
  - encerra participação ativa anterior (`endsAt`, `isActive=false`);
  - cria nova participação ativa.
- O histórico permite rastrear “o que a pessoa fez quando estava no ciclo X” em fases futuras.

## Permissões (RBAC) usadas no core
- Programas: `programs.read/create/update/delete`
- Projetos: `projects.read/create/update/delete`
- Estrutura do projeto: `project-structure.read/create/update/delete`
- Matrículas (participantes): `enrollments.read/create/update/delete`
- Pessoas (consulta para vínculo): `people.read`

## UI/UX (rotas principais)
- Programas: listagem + CRUD.
- Projetos: listagem + CRUD + detalhe.
- Detalhe do projeto:
  - card **Participantes** (matrículas) com busca, filtros e ações (individual e em massa);
  - menu **Gerenciar** para acessar:
    - **Grupos**: lista → detalhe do grupo → participantes do grupo → vincular pessoas;
    - **Ciclos**: lista → detalhe do ciclo → participantes do ciclo → definir/trocar ciclo.

## Fluxos E2E (passo a passo)
### 1) Criar programa e projeto
1. Criar um **Programa** com tipo e status.
2. Criar um **Projeto** vinculado ao programa, definir status e período.

### 2) Vincular participantes ao projeto
1. Abrir o **detalhe do projeto** → **Participantes** → **Vincular Pessoas**.
2. Selecionar pessoas e confirmar:
   - matrícula criada com `status=ACTIVE` e `startsAt` preenchido.

### 3) Encerrar/remover participantes
- Encerrar (individual):
  - ação “Encerrar” na linha → confirma → `status=ENDED` + `endsAt` preenchido.
- Remover (individual):
  - ação “Remover” na linha → confirma → matrícula removida.
- Em massa:
  1. Ativar seleção na tabela (botão “Selecionar”).
  2. Selecionar linhas → “Ações” → “Encerrar selecionados” ou “Remover selecionados”.

### 4) Gerenciar grupos e ciclos
- Grupos:
  1. Abrir **Grupos** do projeto.
  2. Criar grupo (opcional).
  3. Selecionar um grupo na lista → ver participantes.
  4. Vincular pessoas ao grupo (somente pessoas já vinculadas ao projeto).
- Ciclos:
  1. Abrir **Ciclos** do projeto.
  2. Criar ciclo (opcional).
  3. Selecionar um ciclo na lista → ver participantes.
  4. Definir/trocar ciclo para uma pessoa (mantendo histórico).

## Checklist de validação (para “fechar” a fase)
- [ ] Criar programa/projeto sem erros.
- [ ] Vincular pessoa ao projeto preenche `startsAt` automaticamente.
- [ ] Encerrar matrícula preenche apenas `endsAt` (e mantém `startsAt`).
- [ ] Ações em massa funcionam (encerrar/remover) e respeitam permissões.
- [ ] Pessoa em múltiplos grupos simultâneos.
- [ ] Trocar ciclo mantém histórico e garante 1 ativo por vez.
- [ ] Permissões bloqueiam UI e API quando usuário não tem acesso.

## Pendências fora do core (próximas evoluções)
- Turmas.
- Regras de elegibilidade (idade/perfil).
- Metas/indicadores por projeto (base de dashboards).
- Visibilidade/recortes por unidade/equipe (se aplicável).

