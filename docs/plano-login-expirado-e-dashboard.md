# Plano — redirecionamento ao expirar sessão + repaginação do Dashboard

Levantamento feito em 2026-11-12. Isto é só um plano — nada aqui foi
implementado. Cobre dois pontos trazidos pelo usuário:

1. Token expirado não volta pra tela de login (mostra "sem permissão").
2. Repaginar o Dashboard para um visual mais institucional.

---

## 1. Token expirado mostra "sem permissão" em vez de voltar ao login

### Diagnóstico (com evidência)

O mecanismo de detectar expiração e limpar a sessão **já funciona**:

- `frontend/src/lib/api.ts` (`apiRequest`, linhas 177-261): se o token já
  está expirado antes da chamada, tenta um refresh silencioso; se o
  refresh falha, dispara `window.dispatchEvent(new
  CustomEvent("auth:unauthorized"))` (linha 193) e lança `ApiError`
  (401, "Sessao expirada..."). No caminho de resposta 401 real
  (linhas 229-246), mesma coisa: tenta um refresh-e-repete, e se falhar
  de novo dispara o mesmo evento.
- `frontend/src/features/auth/auth-context.tsx` (linhas 127-133): escuta
  `"auth:unauthorized"` e chama `logout()`, que limpa o token do
  `sessionStorage` e zera o estado (`isAuthenticated` vira `false`).

**O problema é que nada nesse caminho navega para `/login`.** Tanto
`api.ts` quanto `auth-context.tsx` só limpam estado — a navegação é
responsabilidade de quem consome `useAuth()`.

Existe um hook pronto pra isso, `frontend/src/hooks/use-require-auth.ts`
(28 linhas): lê `isAuthenticated`/`isLoading` de `useAuth()` e, quando
`!isLoading && !isAuthenticated`, faz
`router.replace("/login?next=<pathname-atual>")`. Funciona corretamente
— mas é **opt-in**, chamado manualmente em só **9 arquivos**
(`core-dashboard-client-page.tsx`, `profile-client-page.tsx`,
`admin-user-detail-client-page.tsx`, `people-tree-client-page.tsx`,
`projects-detail-route-client-page.tsx`,
`project-enrollments-manage-route-client-page.tsx`,
`audit-timeline-page.tsx`, `action-create-form-section.tsx`, e mais um).

O caminho dominante do app — **`frontend/src/web-client/screen/
ScreenHost.tsx`**, usado por ~58 rotas de módulo (`people`, `tasks`,
`projects`, `programs`, `deposit`, `pantry`, `admin/*`, `people-groups`,
`actions` — qualquer `page.tsx` que renderiza `<ScreenHost
actionId="..." />`) — **não chama `useRequireAuth()` e nunca verifica
`isAuthenticated`**. Ele só olha `permissions`:

```tsx
// ScreenHost.tsx:11-47
const { isLoading: authLoading } = useAuth();
const { permissions, isLoading: userLoading, user, tenant } = useCurrentUser();
...
if (authLoading || (userLoading && !hasResolvedCurrentUser)) { ...Carregando...; }

const canRead = hasPermissionRequirement(requiredPermission, permissions, true);
if (!canRead) {
  return <div>...Você não tem permissão para acessar esta área.</div>;
}
```

Quando o token expira, `useCurrentUser().refresh()`
(`current-user-context.tsx`, linhas 38-61) falha ao buscar
`getCurrentUser`/`getTenantProfile` (401) e cai no mesmo `catch` que
trataria "nunca logou": `user`/`tenant` viram `null`, `permissions` vira
`[]` (linhas 54-56, 94-97) — **o código não distingue "não autenticado"
de "autenticado mas sem a permissão"**. `ScreenHost` recebe
`permissions: []`, `hasPermissionRequirement(..., [], true)` dá `false`,
e a tela mostra "sem permissão" — um falso negativo. A pessoa está
deslogada, não sem-permissão.

`frontend/src/proxy.ts` (middleware do Next) não ajuda aqui: só
reescreve caminhos de tenant (`/t/:slug` → `/:slug/dashboard` etc.), não
inspeciona token nenhum.

### Correção proposta

**Opção recomendada — consertar no `ScreenHost.tsx` (conserta as ~58
rotas de uma vez, e qualquer módulo novo que usar `ScreenHost` já nasce
corrigido):**

Chamar `useRequireAuth()` dentro do próprio `ScreenHost`, antes da
checagem de permissão. O hook já faz exatamente o que falta
(`isAuthenticated` + redirect com `?next=`) e já é usado com sucesso em
9 páginas — é reaproveitar, não inventar. Ajuste necessário: `ScreenHost`
precisa esperar o hook decidir redirecionar antes de renderizar "sem
permissão" (hoje ele já tem uma guarda de loading; só precisa incluir
`!isAuthenticated` nela).

**Opção complementar (mais estrutural, discutir se vale a pena agora ou
depois do go-live) — um guard global:**

Mover a lógica para um nível acima (`AppShell.tsx` ou dentro de
`AppProviders.tsx`), observando `isAuthenticated` globalmente e
redirecionando para `/login` sempre que ele virar `false` numa rota
autenticada (pulando `/login`, `/register`, `/forgot-password`,
`/reset-password`). Isso cobriria até páginas que não usam `ScreenHost`
nem `useRequireAuth` (nenhuma hoje, mas qualquer uma nova que algum dia
esqueça de chamar o hook). Mais abrangente, porém maior superfície de
mudança (toca o shell que envolve o app inteiro) — o trade-off sugerido:
fazer a correção pontual no `ScreenHost` agora (baixo risco, resolve o
bug relatado) e registrar a versão global como melhoria futura no
`docs/backlog.md`, não bloquear nisso.

**Dívida secundária, não bloqueante:** `current-user-context.tsx` trata
"sem token" e "401 na busca" de forma idêntica. Não causa o bug relatado
(a correção acima resolve antes de chegar nessa ambiguidade), mas vale
registrar: seria melhor UX mostrar um toast "Sessão expirada, faça login
novamente" em vez de um redirect silencioso. Fica como melhoria
opcional, não faz parte do conserto mínimo.

### Critério de aceite (pra quando for implementar)

- Login, deixar o token expirar (ou forçar via devtools removendo/
  corrompendo o token no `sessionStorage`), navegar para qualquer rota de
  módulo (`/people`, `/tasks`, etc.) → deve cair em `/login?next=<rota>`,
  nunca em "sem permissão".
- Confirmar que uma pessoa **de fato sem a permissão** (autenticada,
  papel sem acesso ao módulo) continua vendo a mensagem de "sem
  permissão" normalmente — a correção não pode esconder esse caso.
- Teste manual nos dois: Dashboard (já usa `useRequireAuth`, deve
  continuar igual) e pelo menos 2 módulos via `ScreenHost` (ex.: people,
  tasks).

---

## 2. Dashboard com visual mais institucional

### Estado atual

Tudo vive num arquivo só: `frontend/src/modules/core/features/dashboard/
ui/core-dashboard-client-page.tsx` (619 linhas). Não está no sistema de
registry genérico dos outros módulos (sem `*-module-contract.tsx`, sem
`actionId`, sem `searchConfig`) — é uma página própria que já chama
`useRequireAuth()` diretamente.

O que existe hoje, de cima pra baixo:

1. Cabeçalho simples: rótulo "ONG", `<h1>Visão geral da ONG</h1>`,
   seletor de período (De/Até + Aplicar/Atualizar). **Sem logo, sem nome
   da instituição, sem saudação ao usuário.**
2. 5 cartões de estatística em grade: Atendidos ativos, Familiares
   ativos, Atendidos em espera, Total de atendimentos, Ações realizadas.
3. Gráfico de barras (atendimentos/ações por mês) + cartão "Análise
   social" (gênero, raça/cor) lado a lado.
4. Gráfico de pizza (distribuição por tipo de ação) + "Atividades
   recentes" (feed de auditoria: quem criou/atualizou/excluiu o quê).

Fonte de dados: um único endpoint agregado, `GET /dashboard/overview`
(`frontend/src/modules/core/api/dashboard.ts`), sem composição de
chamadas por módulo.

**Elementos institucionais já existentes no app, pra reaproveitar (não
inventar do zero):**

- `tenant.logoUrl`, `tenant.name`, `tenant.description`, `tenant.cnpj`,
  `tenant.startYear` — tudo já vem de `useCurrentUser().tenant`
  (`TenantProfile`, `frontend/src/features/auth/api.ts:41-52`).
- `resolveMediaUrl()` (`frontend/src/lib/api.ts`) já resolve
  `logoUrl` pra uma URL de imagem usável — é o que `AppSidebarHeader.tsx`
  e `login-form.tsx` já usam pra mostrar o logo.
- Ou seja: o dashboard hoje é a **única** tela institucional que não
  usa nada disso — nem logo, nem nome, nem descrição da instituição.

### Objetivo da repaginação

Hoje o dashboard parece um painel de métricas operacional genérico. A
ideia de "mais institucional" é fazer a tela comunicar primeiro **quem é
a instituição e o impacto do trabalho**, com os números operacionais
como apoio — mais no tom de um relatório/portal institucional do que um
painel de controle de sistema.

### Proposta de estrutura (pra discutir, não decidido)

1. **Cabeçalho institucional**: logo + nome da instituição (reaproveitar
   exatamente o que `AppSidebarHeader`/`login-form` já fazem), com
   `tenant.description` como subtítulo/missão se estiver preenchido.
   Saudação com o nome do usuário logado (`user.name`, já disponível via
   `useCurrentUser()`). O seletor de período continua, mas secundário.
2. **Cartões de estatística**: manter os 5 existentes, mas considerar
   reagrupar com uma moldura/título que os enquadre como "impacto no
   período" em vez de uma grade neutra de KPIs.
3. **Gráficos**: manter bar chart + pie chart (já funcionam, com
   download em PNG) — repensar só a casca visual (cores, tipografia,
   talvez textura/padrão mais "institucional" em vez do estilo
   dashboard-SaaS padrão).
4. **Atividades recentes**: manter, possivelmente reposicionar mais pra
   baixo/lateral, já que é o item mais "operacional" da tela.
5. **Novo, a avaliar**: atalhos rápidos para ações comuns (cadastrar
   pessoa, registrar ação) — comum em dashboards institucionais que
   funcionam como porta de entrada do dia a dia, mas aumenta escopo;
   decidir se entra nessa rodada ou fica para depois.

### Decisões que precisam do usuário antes de implementar

- Existe uma paleta de cor institucional própria (fora o tema neutro
  atual do sistema), ou o visual deve só reorganizar/hierarquizar melhor
  dentro do tema já existente?
- `tenant.description` hoje é um campo livre, sem garantia de estar
  preenchido em todo tenant — o layout precisa de um fallback decente
  quando estiver vazio (ou ocultar a seção).
- Os atalhos rápidos (item 5) entram nesta rodada ou ficam pra depois?
- Mantém o endpoint único `GET /dashboard/overview`, ou alguma seção
  nova (ex.: atalhos) precisa de dado que esse endpoint não devolve hoje
  (nesse caso é mudança de backend também, não só frontend)?

### Fora de escopo deste plano

- Nada aqui mexe no sistema de registry genérico (dashboard continua
  fora dele, como hoje) — unificar isso é uma decisão maior, separada.
- Nenhuma mudança de backend está pressuposta; se a resposta às
  perguntas acima pedir dado novo, isso vira um item à parte.

---

## Próximo passo

Nenhuma implementação foi feita. Quando o usuário quiser seguir:
- Item 1 (login): pode ser feito isolado, é pequeno e de baixo risco.
- Item 2 (dashboard): precisa das decisões de design acima antes de
  qualquer código.
