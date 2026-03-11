# Incidente: Upload de Foto no Detail Recarregando a Tela

## Contexto

O problema afetava o fluxo de foto/avatar/logo nos details que usam o `web-client`, principalmente em:

- `admin users`
- `admin tenant`
- `people`
- `pantry donors`

O sintoma apareceu durante a migração para o padrão novo de `Detail` com autosave.

## Sintoma

Ao selecionar uma imagem:

- o seletor de arquivo abria normalmente
- depois da seleção, a tela parecia recarregar os dados antigos
- o fluxo da foto era interrompido
- a imagem não era persistida no banco

Na prática, o usuário percebia que:

- a tela “pisca” ou volta para o estado anterior
- o autosave não chega na etapa final da foto
- remover foto podia funcionar, mas adicionar/alterar não

## Impacto

- upload de foto/logo instável ou aparentemente quebrado
- vários módulos afetados ao mesmo tempo
- alto custo de diagnóstico, porque o backend e o build estavam saudáveis

## Causa Raiz

O problema principal **não** estava no upload em si.

O problema era a combinação de:

1. `CurrentUserProvider` fazia refresh em `window focus` e `visibilitychange`
2. ao fechar o seletor nativo de arquivo, o navegador devolvia foco para a aba
3. esse foco disparava refresh global do contexto
4. o [ScreenHost](c:/server/system_development/frontend/src/web-client/screen/ScreenHost.tsx) desmontava a tela quando `userLoading` voltava para `true`
5. o detail era remontado com os dados antigos antes do fluxo de mídia terminar

Resultado:

- o upload podia até iniciar
- mas o detail perdia o estado no meio do processo
- o usuário enxergava “recarregou e não salvou”

## Falsas Pistas Investigadas

Durante o diagnóstico, estas hipóteses pareceram plausíveis, mas não eram a causa raiz:

- posição do input de foto no formulário
- uso de dialog/modal para selecionar imagem
- clique direto no avatar vs botão
- autosave comum do formulário
- problema exclusivo de backend
- problema exclusivo do banco
- problema exclusivo do `PATCH`
- problema exclusivo do `POST /files/...`
- problema exclusivo de Node 24/Turbopack

Observação:

Havia também um problema real de runtime com Node 24 no `dev`, mas **ele não era a causa principal desse bug específico**.

## Solução Aplicada

### 1. Guard compartilhado para fluxo de mídia

Foi criado um guard compartilhado para marcar que o fluxo de mídia está ativo:

- [detail-media-autosave-guard.ts](c:/server/system_development/frontend/src/web-client/detail/detail-media-autosave-guard.ts)

Ele passou a ser usado para suspender autosave e, depois, liberar o fluxo novamente.

### 2. Autosave do detail respeita suspensão de mídia

O autosave compartilhado foi ajustado para:

- não salvar durante interação de mídia
- enfileirar saves pendentes
- só liberar o flush quando o fluxo de mídia termina

Arquivo:

- [useDetailAutoSaveController.ts](c:/server/system_development/frontend/src/web-client/detail/useDetailAutoSaveController.ts)

### 3. Refresh global por foco não roda durante mídia

O refresh do contexto global foi bloqueado enquanto o fluxo de mídia está suspenso:

- [current-user-context.tsx](c:/server/system_development/frontend/src/features/auth/current-user-context.tsx)

Isso impediu que o fechamento do seletor de arquivo disparasse reload global no meio da troca da imagem.

### 4. ScreenHost não desmonta tela já resolvida

O host da tela foi ajustado para não apagar toda a interface quando já existe contexto carregado:

- [ScreenHost.tsx](c:/server/system_development/frontend/src/web-client/screen/ScreenHost.tsx)

Isso removeu o remount destrutivo do detail durante refresh secundário.

### 5. Interação de mídia voltou a funcionar no header

Com a causa raiz resolvida, foi possível restaurar o padrão visual mais fluido:

- clique direto na foto/avatar/logo
- upload imediato com autosave estável

Arquivo:

- [DetailIdentityMediaField.tsx](c:/server/system_development/frontend/src/web-client/detail/DetailIdentityMediaField.tsx)

## Arquivos Envolvidos

Base compartilhada:

- [detail-media-autosave-guard.ts](c:/server/system_development/frontend/src/web-client/detail/detail-media-autosave-guard.ts)
- [useDetailAutoSaveController.ts](c:/server/system_development/frontend/src/web-client/detail/useDetailAutoSaveController.ts)
- [DetailIdentityMediaField.tsx](c:/server/system_development/frontend/src/web-client/detail/DetailIdentityMediaField.tsx)
- [ScreenHost.tsx](c:/server/system_development/frontend/src/web-client/screen/ScreenHost.tsx)
- [current-user-context.tsx](c:/server/system_development/frontend/src/features/auth/current-user-context.tsx)

Módulos afetados na validação:

- [admin-detail-layouts.tsx](c:/server/system_development/frontend/src/modules/core/admin/config/admin-detail-layouts.tsx)
- [admin-user-detail-engine-client-page.tsx](c:/server/system_development/frontend/src/modules/core/admin/ui/admin-user-detail-engine-client-page.tsx)
- [admin-institution-detail-client-page.tsx](c:/server/system_development/frontend/src/modules/core/admin/ui/admin-institution-detail-client-page.tsx)
- [people-detail-layout-contract.tsx](c:/server/system_development/frontend/src/modules/people/config/people-detail-layout-contract.tsx)
- [people-detail-engine-client-page.tsx](c:/server/system_development/frontend/src/modules/people/features/detail/ui/people-detail-engine-client-page.tsx)
- [pantry-detail-layout-contract.tsx](c:/server/system_development/frontend/src/modules/pantry/config/pantry-detail-layout-contract.tsx)
- [pantry-donor-detail-engine-client-page.tsx](c:/server/system_development/frontend/src/modules/pantry/features/donors/ui/pantry-donor-detail-engine-client-page.tsx)

## Regra Preventiva

Qualquer fluxo que:

- abra seletor nativo de arquivo
- abra picker do sistema
- abra janela externa
- dependa de retorno de foco para a aba

deve ser tratado como **interação crítica de mídia/sistema**.

Nesse caso:

1. suspender autosave
2. impedir refresh por foco
3. evitar desmontar a tela por loading secundário
4. só retomar o ciclo normal ao fim da interação

## Regra Arquitetural

No `web-client`, flows de mídia não devem depender de:

- `blur` de input comum
- remount do detail
- refresh global de usuário/tenant

Fluxos de mídia devem ser tratados como um canal separado, mas integrado ao estado salvo da entidade.

## Como Testar no Futuro

Checklist mínimo:

1. abrir o detail de uma entidade com foto
2. focar um campo qualquer do formulário
3. clicar na foto
4. selecionar arquivo
5. confirmar que a tela não desmonta
6. confirmar que a foto muda visualmente
7. confirmar que o backend recebe:
   - `POST /files/...`
   - `PATCH` da entidade
8. confirmar persistência no banco

## Build Validado

Na solução final, os builds passaram:

- `frontend`: `npm run build`
- `backend`: `npm run build`

## Observação Final

O bug parecia um “problema simples de upload”, mas na prática era um problema de ciclo de vida da tela causado por:

- retorno de foco do seletor nativo
- refresh global de contexto
- desmontagem indevida do detail

Esse histórico deve ser consultado sempre que aparecer qualquer bug de:

- upload de mídia
- autosave interrompido
- remount inesperado do detail
- refresh ao voltar foco para a aba
