# Docker

Stack local única para desenvolvimento com PostgreSQL em container e imagens prontas para Cloud Run em frontend e backend separados.

## Estrutura

- `docker-compose.yml`: stack local oficial
- `backend/Dockerfile`: imagem do backend pronta para Cloud Run
- `frontend/Dockerfile`: imagem do frontend pronta para Cloud Run
- `docker.ps1`: script operacional único
- `.env.example`: template local
- `.env.production`: template para Cloud Run

## Portas e URLs

- Host local:
  - frontend: `http://localhost:3000`
  - backend: `http://localhost:3001`
  - postgres: `localhost:5432`
- Rede Docker interna:
  - frontend usa `API_INTERNAL_URL=http://backend:8080`
  - backend e frontend escutam internamente em `8080`

Separação de URLs:

- `FRONTEND_PUBLIC_API_URL`: URL pública usada no build do frontend para chamadas do navegador
- `NEXT_PUBLIC_API_URL`: variável mantida por compatibilidade com o app e builds manuais
- `API_INTERNAL_URL`: URL interna usada pelo frontend server-side dentro da rede Docker ou no runtime do deploy

## Local

1. Criar `.env` a partir de `.env.example`.
2. Ajustar ao menos `POSTGRES_PASSWORD` e `JWT_SECRET`.
3. Subir a stack:

```powershell
.\docker.ps1 up
```

## Comandos

```powershell
.\docker.ps1 up
.\docker.ps1 up backend -Build
.\docker.ps1 down
.\docker.ps1 logs frontend
.\docker.ps1 ps
.\docker.ps1 restart
.\docker.ps1 build
```

## Cloud Run

Backend:

- usar a imagem gerada a partir de `backend/Dockerfile`
- definir `DATABASE_URL` apontando para Cloud SQL
- manter `RUN_DB_PRESTART=false`
- deixar o Cloud Run injetar `PORT=8080`

Frontend:

- usar a imagem gerada a partir de `frontend/Dockerfile`
- fazer build com `FRONTEND_PUBLIC_API_URL` apontando para a URL pública do backend
- manter `NEXT_PUBLIC_API_URL` com o mesmo valor por compatibilidade
- definir `API_INTERNAL_URL` com a mesma URL pública, a menos que exista um roteamento interno diferente

Exemplo de build local para GCP:

```powershell
docker build -f backend/Dockerfile -t terceirogestor-backend ./backend
docker build --build-arg NEXT_PUBLIC_API_URL=https://backend-service-xxxx.a.run.app -f frontend/Dockerfile -t terceirogestor-frontend ./frontend
```

## Observações

- A execução automática de migrations ficou restrita ao ambiente local controlado por `RUN_DB_PRESTART=true`.
- Quando não há migrations versionadas, o backend sincroniza o schema local com `prisma db push`.
- O compose antigo fragmentado foi removido para evitar drift de configuração.
- Se houver load balancer no GCP com rota `/api`, o frontend pode ser rebuildado com `NEXT_PUBLIC_API_URL=/api`.
  Conexão DB:
  host: localhost
  port: 5432
  user: postgres
  password: seu*password_no*.env
  database: terceeiro-gestor

```

---

## ⏱️ Tempo de Operações

| Operação              | Tempo      |
| --------------------- | ---------- |
| Primeira subida       | ~2-3 min   |
| Restart (sem rebuild) | ~30 seg    |
| Rebuild backend       | ~1-2 min   |
| Rebuild frontend      | ~30 seg    |
| Backup database       | ~5-10 seg  |
| Restore database      | ~10-30 seg |
| Reset completo        | ~1 min     |

---

## 🎉 Conclusão

Você agora tem:

- ✅ 3 docker-compose individuais e modulares
- ✅ 2 scripts PowerShell para automação
- ✅ 6 documentos detalhados
- ✅ Pronto para desenvolvimento local
- ✅ Pronto para migração para CloudSQL/GCP
- ✅ Exemplos de 20 cenários práticos

Está tudo documentado, testado e pronto para usar.

**Próximo passo**: Rode `.\docker-manage.ps1` e comece a desenvolver! 🚀

---

**Versão**: 1.0
**Data**: Abril 2026
**Mantido por**: Projeto Terceeiro Gestor
**Documentação**: Veja guias específicos para mais detalhes
```
