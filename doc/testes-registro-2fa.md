# Testes (Registro de Tenant + 2FA TOTP)

Este roteiro valida o fluxo completo:
1) Reset do banco + seed
2) Registro de tenant com admin via `/register`
3) Confirmação por código (email)
4) Ativação de 2FA (TOTP) + QR Code
5) Login com step-up (solicita 2FA só quando necessário)
6) “Confiar neste dispositivo” + recovery codes

## 0) Pré-requisitos

- MySQL rodando e acessível pelo `DATABASE_URL` em `backend/.env`.
- `backend/.env` com `JWT_SECRET` definido.
- (Recomendado) `TOTP_ENCRYPTION_KEY` em `backend/.env` (32 bytes em hex/base64).
- Frontend e backend com dependências instaladas (`npm i`).

## 1) Reset do banco (dev)

> Atenção: apaga **todos** os dados do banco configurado no `DATABASE_URL`.

No terminal:

```bash
cd backend
npx prisma migrate reset --force
npx prisma db seed
```

Observação: o seed cria a tenant exemplo `instituicao-exemplo` e usuários de exemplo.
Para testar o registro, use um **nome diferente** no cadastro (o campo `Tenant.name` é `@unique`).

## 2) Subir backend + frontend (dev)

Em um terminal:

```bash
cd backend
npm run start:dev
```

Em outro terminal:

```bash
cd frontend
npm run dev
```

URLs padrão:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## 3) Teste: registro de tenant + admin

1. Acesse `http://localhost:3000/register`
2. Informe:
   - Nome da instituição (ex.: `Empresa Teste 2FA`)
   - Nome do admin
   - Email do admin
   - Senha do admin
3. Envie o formulário.

### Código por e-mail

- Se SMTP estiver configurado: o código chega no e-mail.
- Se SMTP **não** estiver configurado: o backend imprime o código no console (modo dev).

4. Acesse a tela de confirmação (o próprio frontend direciona).
5. Digite o código e confirme.
6. Resultado esperado:
   - Tenant criada
   - Usuário admin criado e ativo
   - Login automático (token) e redirecionamento para `/{slug}/dashboard`

## 4) Teste: ativar 2FA (TOTP)

1. Entre em `/{slug}/auth/profile`
2. Clique na aba **Segurança**
3. Clique em **Ativar 2FA**
4. Escaneie o **QR Code** no Google Authenticator / Microsoft Authenticator
5. Digite o código (6 dígitos) e confirme
6. Resultado esperado:
   - 2FA marcado como ativado
   - Lista de **recovery codes** exibida (salve, só aparece 1 vez)

## 5) Teste: login com step-up + “Confiar dispositivo”

1. Faça logout (ou abra uma janela anônima)
2. Acesse `/{slug}/login`
3. Informe email/senha do admin
4. Resultado esperado:
   - Login pede o **código 2FA** (etapa “Código 2FA”)
5. Marque “Confiar neste dispositivo por 30 dias”
6. Digite o código do app e conclua

### Validar “trusted device”

1. Faça logout
2. Faça login de novo no mesmo navegador/dispositivo
3. Resultado esperado:
   - **Não** pede 2FA (entra direto) enquanto o cookie `trusted_device` estiver válido

## 6) Teste: recovery code

1. Faça logout
2. Faça login
3. Quando pedir 2FA, em vez do código do app, digite um recovery code (formato `XXXXX-XXXXX`)
4. Resultado esperado:
   - Login completo
   - O recovery code usado não pode ser reutilizado

