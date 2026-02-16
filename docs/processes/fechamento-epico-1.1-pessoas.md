# Fechamento do ÉPICO 1.1 — Pessoas (checklist)

Objetivo: encerrar o ÉPICO 1.1 com um conjunto mínimo de **validações repetíveis** (build + smoke tests) para garantir um sistema robusto e fácil de manter.

## Pré-requisitos

- Backend e frontend com dependências instaladas (`npm install`).
- Banco configurado no `backend/.env` (`DATABASE_URL`) e acessível.
- Para documentos sensíveis:
  - `PII_MASTER_KEY` configurada no `backend/.env` (base64 com pelo menos 32 bytes após decodificar).

## 1) Migrações e permissões

Rodar no diretório do repositório:

```bash
# aplica migrations do Prisma
npm -C backend run db:migrate:deploy

# garante permissões novas em tenants existentes (inclui people.sensitive.*)
npm -C backend run permissions:backfill
```

Opcional (somente se existirem valores legados em `Person.document/rg/nis` e você quiser migrar):

```bash
npm -C backend run people:backfill-sensitive-docs
```

## 2) Build e testes

```bash
# backend
npm -C backend run build
npm -C backend test

# frontend
npm -C frontend run build
```

## 3) Smoke tests (manual)

### 3.1 Cadastro/edição de pessoa (dados básicos)

- Criar pessoa com:
  - nome completo + data de nascimento + sexo/gênero/raça/cor + tipo + status
  - tags
  - resumo dinâmico
- Editar pessoa e confirmar:
  - status “Desligado” exige “Motivo do desligamento”
  - tags salvam e refletem no detalhe

### 3.2 Contatos (no detalhe)

- Abrir detalhe da pessoa → card de contatos:
  - cadastrar múltiplos telefones/e-mails
  - definir um contato primário (SELF)
  - marcar WhatsApp e validar link `wa.me`
- Confirmar que o formulário principal de pessoa **não** possui mais campos de contato.

### 3.3 Endereço (domicílio) + mapa

- No contexto familiar/domicílio, cadastrar endereço via CEP.
- Validar autopreenchimento com ViaCEP (logradouro/bairro/cidade/UF).
- No card da pessoa:
  - endereço aparece no card
  - clicar no ícone do mapa abre o dialog com o iframe
  - botão “Abrir no Google Maps” abre em nova aba

### 3.4 Documentos sensíveis (LGPD)

- Com um usuário **sem** `people.sensitive.read/update`:
  - tentar abrir “Gerenciar” → deve falhar com acesso negado (403) ou a UI deve orientar ausência de permissão.
- Com um usuário **com** permissão:
  - abrir “Gerenciar”
  - salvar CPF/RG/NIS/CNS
  - validar que CPF inválido é rejeitado (HTTP 400 “CPF inválido.”)
- Conferir auditoria/redação:
  - não deve haver CPF/RG/NIS/CNS em logs/audit.

## 4) Critérios para “encerrar”

- Migrações aplicadas sem erro.
- Permissões backfill executado (para tenants antigos).
- `npm -C backend test` e `npm -C frontend run build` passando.
- Smoke tests acima concluídos.

## Próximo passo sugerido

Seguir para o ÉPICO 1.3 (Escolaridade / Benefícios / Reclusão).
