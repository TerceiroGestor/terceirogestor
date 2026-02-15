# Registro de Tenant + Usuário Admin (email + OAuth)

Objetivo: permitir criar uma nova **instituição (tenant)** e o **usuário administrador**, com:
- `slug` gerado automaticamente a partir do nome (com sufixo se necessário)
- confirmação obrigatória via **código enviado por email** (com expiração)
- opção de cadastro via **Google** ou **Microsoft** (OAuth)
- criação de roles/permissões padrão (Admin recebe tudo)

## Backend

### Endpoints (públicos, sem `/t/:slug`)
- `POST /registration/tenant/request`
  - cria registro pendente e envia código por email
- `GET /registration/tenant/:id`
  - retorna status/infos do registro (sem dados sensíveis)
- `POST /registration/tenant/confirm`
  - confirma o código, cria tenant + admin e retorna token

### OAuth (opcional)
- `GET /registration/oauth/google/start?tenantName=...`
- `GET /registration/oauth/google/callback?...`
- `GET /registration/oauth/microsoft/start?tenantName=...`
- `GET /registration/oauth/microsoft/callback?...`

### Variáveis de ambiente (backend)
Arquivo: `backend/.env` (use `backend/.env.example` como base)

Obrigatórias:
- `DATABASE_URL`
- `JWT_SECRET`

Recomendadas:
- `WEB_URL` (para onde o callback OAuth redireciona, ex.: `http://localhost:3000`)

SMTP (para envio do código):
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (ex.: `Sistema <no-reply@seudominio.com>`)

OAuth:
- Google:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`
  - `GOOGLE_OAUTH_REDIRECT_URI`
- Microsoft:
  - `MICROSOFT_OAUTH_CLIENT_ID`
  - `MICROSOFT_OAUTH_CLIENT_SECRET`
  - `MICROSOFT_OAUTH_REDIRECT_URI`

## Frontend

### Rotas
- `GET /register`
- `GET /register/confirm?rid=...`

### Fluxo (resumo)
1) Usuário envia tenant + admin (ou inicia OAuth)  
2) Recebe código por email  
3) Confirma código  
4) Backend retorna `accessToken` + cookie refresh e o frontend redireciona para `/{slug}/dashboard`

## Como testar (dev)
1) Subir API:
```bash
cd backend
npx prisma migrate dev
npm run start:dev
```

2) Subir Web:
```bash
cd frontend
npm run dev
```

3) Abrir:
- `http://localhost:3000/register`

