# Testes — Registro de Tenant + 2FA (TOTP)

Este roteiro valida o fluxo completo:
1) reset do banco
2) registro de tenant com admin via `/register`
3) confirmação por código (email)
4) ativação de 2FA (TOTP) + QR Code + recovery codes
5) login com step-up (solicita 2FA só quando necessário)
6) “Confiar neste dispositivo” (trusted device)

## 0) Pré-requisitos
- MySQL/MariaDB rodando e acessível via `DATABASE_URL` em `backend/.env`
- `JWT_SECRET` definido
- (Recomendado) SMTP configurado para receber o código por email

## 1) Reset do banco (dev)

> Atenção: apaga todos os dados do banco do `DATABASE_URL`.

```bash
cd backend
npx prisma migrate reset --force
npx prisma db seed
```

## 2) Subir backend + frontend (dev)

Terminal 1:
```bash
cd backend
npm run start:dev
```

Terminal 2:
```bash
cd frontend
npm run dev
```

URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## 3) Teste: registro de tenant + admin
1. Acesse `http://localhost:3000/register`
2. Informe:
   - Nome da instituição (use um nome novo)
   - Nome do admin
   - Email do admin
   - Senha do admin
3. Envie o formulário
4. Confirme o código na tela `/register/confirm`

Resultado esperado:
- tenant criada
- usuário admin criado e ativo
- auto-login e redirect para `/{slug}/dashboard`

## 4) Teste: ativar 2FA (TOTP)
1. Acesse `/{slug}/auth/profile`
2. Aba **Segurança**
3. Clique em **Ativar 2FA**
4. Escaneie o **QRCode** no Google Authenticator / Microsoft Authenticator
5. Digite o código (6 dígitos) e confirme

Resultado esperado:
- 2FA marcada como ativa
- recovery codes exibidos (salvar; normalmente aparecem 1 vez)

## 5) Teste: login com step-up + “Confiar dispositivo”
1. Faça logout (ou use janela anônima)
2. Acesse `/{slug}/login`
3. Informe email/senha
4. Resultado esperado: pede 2FA (etapa do código)
5. Marque “Confiar neste dispositivo…”
6. Informe o código TOTP e finalize

Validar trusted device:
1. Faça logout
2. Faça login novamente no mesmo navegador/dispositivo
3. Resultado esperado: não pede 2FA enquanto o cookie estiver válido

## 6) Teste: recovery code
1. Faça logout
2. Faça login (quando pedir MFA)
3. Informe um recovery code (ex.: `XXXXX-XXXXX`)

Resultado esperado:
- login completo
- o recovery code usado não pode ser reutilizado

