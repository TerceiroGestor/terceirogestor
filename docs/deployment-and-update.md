# Deploy, Docker e Atualização

## Stack oficial

O projeto sobe com:

- MySQL
- backend NestJS
- frontend Next.js
- serviço de backup

Arquivo principal:

- [docker-compose.yml](/c:/server/system_development/docker-compose.yml)

## Regras de deploy

- o container do backend não deve executar seed a cada subida
- migrations rodam no start e no script de atualização
- seed deve ser explícito, não automático
- backup fica ativo no compose

## Subida local/servidor

```bash
copy .env.compose.example .env
docker compose up -d mysql
docker compose build --pull backend frontend
docker compose up -d backend frontend backup
```

Fluxo guiado no Windows / PowerShell:

```powershell
Copy-Item .env.compose.example .env
.\script\up.ps1
```

Sem seed:

```powershell
.\script\up.ps1 -SkipSeed
```

Com proxy local Nginx no mesmo projeto Docker:

```powershell
.\script\up.ps1 -WithNginx
```

Se quiser guardar volumes fora do repo no Windows, prefira um caminho como `C:/docker-data/system_development` em `DATA_DIR`.

## Atualização oficial

Script oficial:

- [script/update.sh](/c:/server/system_development/script/update.sh)
- [script/update.ps1](/c:/server/system_development/script/update.ps1)

Fluxo:

1. `git pull --ff-only`
2. garantir MySQL ativo
3. build das imagens
4. `db:migrate:deploy`
5. `db:seed` opcional
6. `permissions:backfill`
7. recriar `backend`, `frontend` e `backup`
8. exibir status

### Uso

```bash
bash script/update.sh
```

PowerShell:

```powershell
.\script\update.ps1
```

Sem seed:

```bash
bash script/update.sh --skip-seed
```

PowerShell sem seed:

```powershell
.\script\update.ps1 -SkipSeed
```

## Verificação mínima

```bash
cd backend && npm run build
cd ../frontend && npm run build
```
