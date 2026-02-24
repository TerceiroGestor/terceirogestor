# system_development

## Setup rapido (novo computador)

1) Clonar o repositorio
```bash
git clone https://github.com/TerceiroGestor/system_development.git
cd system_development
```

2) Subir o banco (MySQL via Docker)
```bash
docker compose up -d mysql
```

3) Configurar variaveis de ambiente
- Backend: copie `backend/.env.example` para `backend/.env`.
- Frontend: copie `frontend/.env.example` para `frontend/.env`.

4) Instalar dependencias
```bash
cd backend
npm install
cd ../frontend
npm install
```

5) Migracoes e seed
```bash
cd ../backend
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

6) Rodar em desenvolvimento
```bash
# backend
cd backend
npm run start:dev

# frontend
cd ../frontend
npm run dev
```

## Checklist rapido (antes de finalizar alteracoes)
- Rodar `npm run build` no frontend.
- Rodar `npm run build` no backend.

## Docker (stack mysql + backend + frontend)
1) Preparar variaveis do compose
```bash
copy .env.compose.example .env
```
Edite `.env` com:
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `NEXT_PUBLIC_API_URL` (ex: `http://localhost:3001`)
- `TZ`

2) Ajustar `.env` do backend e frontend (se necessario)
- Backend: `backend/.env` (DATABASE_URL sera sobrescrita no container).
- Frontend: `frontend/.env` (NEXT_PUBLIC_API_URL pode ser sobrescrita no container).

3) Subir o banco, backend e frontend
```bash
docker compose up -d mysql backend frontend
```
Observacao: os dados do MySQL ficam em `/srv/dados/terceirogestor/mysql` (bind mount).

Backup automatico:
- arquivos em `/srv/dados/terceirogestor/backups`
- executa diariamente as 12:00 (meio-dia) no timezone do container
- ajuste `BACKUP_KEEP_DAYS` e `TZ` em `.env`
```bash
docker compose up -d backup
```

4) SSL em producao
- Configure Nginx/Certbot direto no servidor (fora do compose).

## Atualizacao (servidor)
Rotina automatizada (Ubuntu):
```bash
bash scripts/update.sh
```
O script faz `git pull`, build das imagens, aplica migrations e recria os containers.
Observacao: migrations rodam dentro do container, sem depender do Node/Prisma do host.

Execucao manual (se precisar):
```bash
docker compose run --rm --no-deps backend npm run db:migrate:deploy
```
