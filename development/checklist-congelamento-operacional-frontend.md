# Checklist de Congelamento Operacional Frontend - Onda 0

Data: 2026-05-13
Status: ativo

## 1. Objetivo

Validar a aplicacao segura do congelamento operacional no frontend sem remocao fisica de modulo.

## 2. Escopo

Arquivo principal de controle:

- frontend/src/modules/registry.ts

Regra aplicada:

- navegacao publica deve expor apenas o fluxo alvo de People First
- modulos congelados permanecem no codigo, mas fora da navegacao padrao

## 3. Checklist de validacao tecnica

- [x] Registro global atualizado para manter somente manifests do fluxo alvo
- [x] Imports de manifests congelados removidos do registry para evitar uso acidental
- [ ] Navegacao carregada sem links de modulos congelados
- [ ] Fluxo principal de people acessivel por lista, create e detail
- [ ] Fluxo de autenticacao e seguranca sem regressao visual

## 4. Checklist de validacao funcional manual

- [ ] Entrar no sistema com perfil operacional e validar menu lateral
- [ ] Confirmar ausencia de itens: actions, deposit, pantry, programs, projects, tasks, people-segments
- [ ] Confirmar presenca de people
- [ ] Navegar por people listagem, criacao e detalhe sem erro bloqueante

## 5. Critério de aceite desta etapa

Esta etapa e considerada concluida quando:

- a navegacao nao expoe modulos congelados
- o fluxo people permanece operacional
- nao ha regressao de autenticacao/seguranca para acesso ao modulo

## 6. Pendencias para proxima etapa

- [x] implementar gate de CI para bloquear alteracoes em modulos congelados sem justificativa de excecao
- preparar matriz de excecoes permitidas por seguranca, tenancy e compliance
