# Terceiro Gestor

Este projeto foi reorganizado para rodar direto no Docker, com acesso unico em `http://localhost`, persistencia de dados, backup automatico e atualizacao simplificada por PowerShell.

Toda a configuracao do projeto agora fica centralizada no `.env` da raiz. Isso vale para Docker e tambem para execucao local de backend/frontend.

## Como ficou

- acesso publico so por `http://localhost:80`
- `mysql` e `uploads` persistidos em volumes Docker
- backup automatico do banco e dos uploads
- backup manual com um comando
- atualizacao com `git pull`, rebuild, migracao e recriacao da stack sem apagar dados
- uma documentacao operacional unica neste `README.md`

## Pre-requisitos

- Docker Desktop em execucao
- PowerShell
- Git

## Arquivos importantes

- `docker-compose.yml`: stack oficial de producao/local
- `.env.example`: modelo unico de configuracao do Docker
- `script/up.ps1`: primeira subida e reexecucao da stack
- `script/update.ps1`: atualizacao do projeto com backup de seguranca
- `script/backup-now.ps1`: backup manual
- `script/restore.ps1`: restauracao de backup

## Primeira subida

1. Criar o arquivo de ambiente:

```powershell
Copy-Item .env.example .env
```

2. Editar o minimo necessario em `.env`:

- `MYSQL_ROOT_PASSWORD`
- `JWT_SECRET`
- `DATABASE_URL` se for rodar backend fora do Docker
- `TOTP_ENCRYPTION_KEY` e `PII_MASTER_KEY` se quiser deixar a seguranca pronta desde o inicio
- `BACKUP_PATH` se quiser salvar backups fora do repositorio

3. Subir o projeto:

```powershell
.\script\up.ps1
```

O script valida automaticamente:

- se o Docker Desktop esta em execucao
- se `.env` tem as chaves minimas obrigatorias
- se algum valor com `$` foi deixado sem aspas simples

4. Acessar:

```text
http://localhost
```

Se quiser subir com dados de demonstracao na primeira vez:

```powershell
.\script\up.ps1 -SeedDemoData
```

Importante:

- o seed de demonstracao nao roda por padrao
- `backend/.env` e `frontend/.env` nao sao mais necessarios
- `localhost:3000` e `localhost:3001` nao sao mais o caminho oficial de acesso

## Onde os dados ficam

- banco: volume Docker `terceirogestor_mysql_data`
- uploads: volume Docker `terceirogestor_uploads_data`
- backups: pasta definida em `BACKUP_PATH`

Padrao de backup:

```text
storage/backups
```

Isso significa:

- `docker compose down` para os containers, mas nao apaga dados
- `docker compose down -v` apaga os volumes e deve ser evitado
- `git pull` e rebuild nao apagam banco nem uploads

## Operacao do dia a dia

Subir ou religar a stack:

```powershell
.\script\up.ps1
```

Ver status:

```powershell
docker compose ps
```

Ver logs:

```powershell
docker compose logs -f nginx
docker compose logs -f backend
docker compose logs -f mysql
docker compose logs -f backup
```

Parar a stack:

```powershell
docker compose down
```

## Backup

O servico `backup` roda automaticamente em cron e salva:

- dump do MySQL
- arquivo compactado dos uploads

Configuracoes no `.env`:

- `BACKUP_SCHEDULE`: horario do backup
- `BACKUP_KEEP_DAYS`: quantos dias manter
- `BACKUP_PATH`: onde salvar
- `TZ`: fuso horario do cron e dos nomes dos arquivos

Exemplo padrao:

```text
BACKUP_SCHEDULE=0 3 * * *
BACKUP_KEEP_DAYS=14
TZ=America/Sao_Paulo
```

Para rodar um backup manual agora:

```powershell
.\script\backup-now.ps1
```

## Atualizacao do projeto

Para atualizar a partir do GitHub:

```powershell
.\script\update.ps1
```

Esse script faz, nesta ordem:

1. garante que o MySQL esta de pe
2. cria um backup de seguranca antes da atualizacao
3. executa `git pull --ff-only`
4. rebuilda as imagens
5. aplica migrations
6. executa o backfill de permissoes
7. recria backend, frontend, nginx e backup

Se voce quiser atualizar e tambem carregar os dados de demonstracao:

```powershell
.\script\update.ps1 -SeedDemoData
```

Use isso com cuidado. O seed deste projeto e destrutivo e serve para ambiente de demonstracao, nao para restaurar producao.

## Restauracao

Restaurar o banco usando o ultimo backup:

```powershell
.\script\restore.ps1
```

Restaurar somente uploads usando o ultimo backup:

```powershell
.\script\restore.ps1 -DatabaseBackup "--skip" -UploadsBackup "--latest"
```

Restaurar arquivos especificos:

```powershell
.\script\restore.ps1 -DatabaseBackup "C:\server\system_development\storage\backups\terceirogestor-db-20260401-030000.sql.gz"
.\script\restore.ps1 -DatabaseBackup "--skip" -UploadsBackup "C:\server\system_development\storage\backups\terceirogestor-uploads-20260401-030000.tar.gz"
```

Atencao:

- restaurar uploads substitui o conteudo atual do volume de uploads
- restaure primeiro em homologacao se estiver em duvida

## Variaveis principais do `.env`

- `MYSQL_ROOT_PASSWORD`: senha do MySQL
- `MYSQL_DATABASE`: nome do banco
- `JWT_SECRET`: segredo principal da aplicacao
- `WEB_URL`: URL externa do sistema. Para este fluxo, use `http://localhost`
- `NEXT_PUBLIC_API_URL`: mantenha `/api`
- `GOOGLE_OAUTH_REDIRECT_URI`: callback publica do Google
- `MICROSOFT_OAUTH_REDIRECT_URI`: callback publica da Microsoft

Observacao importante:

- use apenas caracteres seguros para URL em `MYSQL_ROOT_PASSWORD` como letras, numeros, ponto, underscore e hifen
- se algum segredo tiver `$`, use aspas simples no `.env` da raiz para o Docker Compose nao interpretar isso como variavel

## Problemas comuns

Se o PowerShell bloquear execucao de script:

```powershell
powershell -ExecutionPolicy Bypass -File .\script\up.ps1
```

Se o script reclamar que o Docker nao esta pronto:

- abra o Docker Desktop
- espere o status ficar como ativo
- rode o comando novamente

Se quiser recriar tudo sem perder dados:

```powershell
.\script\up.ps1
```

Se algo falhar depois de uma atualizacao:

1. confira os logs com `docker compose logs -f`
2. use o backup gerado pelo `update.ps1`
3. rode `.\script\restore.ps1` se precisar voltar o banco

## Fluxo recomendado

1. editar codigo
2. fazer commit e push
3. no servidor ou maquina principal, rodar `.\script\update.ps1`
4. acessar `http://localhost`
