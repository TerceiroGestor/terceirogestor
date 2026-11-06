# Terceiro Gestor

SaaS multi-tenant para gestão de instituições do terceiro setor. Stack:
Next 16 + React 19 (frontend), Nest 11 + Prisma 7 + PostgreSQL (backend).

Para as regras do projeto, estrutura de pastas e o estado atual do trabalho,
veja [`AGENTS.md`](./AGENTS.md) e [`PLAN.md`](./PLAN.md). Para subir tudo em
Docker (incluindo o ambiente `full`), veja [`DOCKER_README.md`](./DOCKER_README.md).

## Rodar localmente

Pré-requisitos: Docker Desktop (só para o Postgres), Node 22.x, PowerShell.

1. Criar o `.env` na raiz a partir do modelo:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Editar no `.env` o mínimo necessário: `POSTGRES_PASSWORD`, `JWT_SECRET`,
   `PII_MASTER_KEY` e `TOTP_ENCRYPTION_KEY` (gere com os comandos indicados
   nos comentários do próprio `.env.example`).

3. Subir só o Postgres em Docker:

   ```powershell
   .\docker.ps1 up -Environment dev
   ```

4. Rodar backend e frontend localmente, cada um no seu terminal:

   ```powershell
   cd backend
   npm ci
   npx prisma generate
   npm run start:dev
   ```

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

5. Acessar `http://localhost:3000`.

## Comandos úteis

```powershell
# backend
cd backend
npx tsc --noEmit -p tsconfig.build.json   # checkpoint rápido
npm test                                  # 15 suítes
npx eslint "src/**/*.ts"                  # medir lint (NÃO usar `npm run lint`: aplica --fix)

# frontend
cd frontend
npx tsc --noEmit
npx eslint src
npm run build
```

## Onde os dados ficam

Em desenvolvimento (`docker.ps1 up -Environment dev`), o Postgres grava no
volume Docker `postgres_dev_data`. `docker compose down` não apaga o
volume; `docker compose down -v` apaga, e deve ser evitado.
