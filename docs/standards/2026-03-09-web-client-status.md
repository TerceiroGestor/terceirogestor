# Status de 09/03/2026

## Alteracoes realizadas hoje

- Consolidacao do padrao `web-client` em modulos principais:
  - `pantry`
  - `tasks`
  - `admin`
  - `people`
- Padronizacao visual de `Detail`, `side`, `tabs`, feed de auditoria e area de analise por view.
- Evolucao do `tasks` como modulo real:
  - backend
  - atribuicao por usuario
  - comentarios, dependencias, checklist, subtarefas
  - `GanttView` reutilizavel no `web-client`
- Migracao do modulo administrativo para `ScreenHost`, `RecordListHost` e `DetailShellEngine`.
- Padronizacao de avatar/foto no `Detail` via componente compartilhado:
  - `DetailIdentityMediaField`
  - uso em `admin users`, `admin tenant`, `people` e `pantry donors`
- Limpeza de fluxo legado de `people` que nao era mais usado:
  - detail antigo por rota propria
  - edit antigo baseado em mock

## Problemas resolvidos hoje

- Oscilacao de view na primeira troca de tela por sincronismo de URL/estado persistido.
- Loops de carregamento em `detail` por efeitos e dependencias instaveis.
- Erros de hooks em telas de `detail` do admin.
- Tipos gerados em `.next/dev` interferindo no `tsc`.
- Gantt reutilizavel com:
  - escala
  - agrupamento
  - dependencias visuais
  - milestones
  - drag/resize
  - subtarefas colapsaveis

## Pendencias para amanha

- Revalidar o fluxo de upload de foto end-to-end no navegador apos a simplificacao do header.
- Se ainda houver falha de upload no cliente:
  - instrumentar o fluxo no browser para capturar `upload -> PATCH -> refresh`
  - verificar se o estado salvo retorna com a URL nova e se o `detail` reidrata corretamente
- Revisar outros arquivos legados fora de `people` para limpar wrappers ou fluxos mortos restantes.
- Revisao funcional completa do admin na base nova:
  - usuarios
  - perfis
  - permissoes
  - auditoria
  - MFA
- Aplicar o mesmo padrao de avatar compacto em outros detalhes com imagem principal.

## Observacoes

- O backend ja respondeu corretamente para `upload + PATCH + GET` nos fluxos testados (`users`, `people`, `pantry donors`).
- O ponto ainda sensivel permanece no comportamento do cliente durante a atualizacao visual da foto.
