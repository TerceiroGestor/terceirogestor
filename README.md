# system_development

## Setup rapido (novo computador)

1) Clonar o repositorio
```bash
git clone https://github.com/TerceiroGestor/system_development.git
cd system_development
```

2) Subir o banco (MySQL via Docker)
```bash
cd backend
docker compose -f docker/docker-compose.yml up -d
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
