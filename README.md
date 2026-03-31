# system_development

## Inicio Rapido

Fluxo recomendado para Windows com PowerShell e Docker Desktop.

Use esta secao como referencia principal para subir o projeto.

Prerequisitos:

- Docker Desktop instalado e em execucao
- PowerShell

1. Preparar os arquivos de ambiente:

```powershell
Copy-Item .env.compose.example .env -ErrorAction SilentlyContinue
Copy-Item backend\.env.example backend\.env -ErrorAction SilentlyContinue
```

2. Revisar o minimo necessario:

- em `.env`, ajuste `MYSQL_ROOT_PASSWORD`
- em `backend/.env`, ajuste `JWT_SECRET`
- se quiser salvar os dados fora do repo, use `DATA_DIR=C:/docker-data/system_development` em `.env`

3. Subir toda a stack:

```powershell
.\script\up.ps1
```

4. Acessar a aplicacao:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`

Com proxy Nginx:

```powershell
.\script\up.ps1 -WithNginx
```

URL com proxy:

- nginx: `http://localhost`

Atualizacao rapida:

```powershell
.\script\update.ps1 -SkipSeed
```

Parar a stack:

```powershell
docker compose down
```

Se o PowerShell bloquear a execucao do script:

```powershell
powershell -ExecutionPolicy Bypass -File .\script\up.ps1
```

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
