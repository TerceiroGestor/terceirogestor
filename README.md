# system_development

Base canônica do projeto:

- frontend em `frontend/`
- backend em `backend/`
- deploy local/servidor com `docker-compose.yml`
- atualização operacional com `script/update.sh`
- documentação oficial em [docs/README.md](/c:/server/system_development/docs/README.md)

Rotina rápida:

```bash
docker compose up -d mysql
cd backend && npm install
cd ../frontend && npm install
cd ../backend && npm run db:migrate:deploy && npm run db:seed
cd ../frontend && npm run dev
```

Windows / PowerShell:

```powershell
Copy-Item .env.compose.example .env
.\script\up.ps1
.\script\update.ps1 -SkipSeed
```

Validação mínima antes de finalizar mudanças:

```bash
cd backend && npm run build
cd ../frontend && npm run build
```
