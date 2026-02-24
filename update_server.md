# Atualizacao do Servidor (Docker + Nginx + SSL Local)

Este documento resume o fluxo de atualizacao e as revisoes/ajustes feitos hoje.

## 1) Processo correto de atualizacao
1. Atualizar codigo no servidor:
```bash
cd /srv/terceirogestor
git pull --ff-only
```
2. Rebuild das imagens (o build acontece dentro do Dockerfile, nao no host):
```bash
docker compose build --pull backend frontend
```
3. Recriar containers:
```bash
docker compose up -d --force-recreate mysql backend frontend
```

## 2) Rotina automatizada
Script criado:
```bash
bash scripts/update.sh
```
O script executa:
- `git pull`
- `docker compose build --pull backend frontend`
- migrations dentro do container (`npm run db:migrate:deploy`)
- recria containers

## 3) Migrations sempre dentro do container
Evita problemas de Node/Prisma no host:
```bash
docker compose run --rm --no-deps backend npm run db:migrate:deploy
```

## 4) Erro de build no backend (ERESOLVE)
Causa: `backend/package.json` e `backend/package-lock.json` estavam alterados no servidor
(forcando versoes antigas do Nest/CLI).

Correcao:
```bash
git restore backend/package.json backend/package-lock.json
docker compose build --no-cache --pull backend
docker compose up -d --force-recreate backend
```

## 5) Erro de build no frontend
Mesma abordagem:
```bash
git restore frontend/package.json frontend/package-lock.json
docker compose build --no-cache --pull frontend
docker compose up -d --force-recreate frontend
```

## 6) SSL local (sem dominio publico)
Lets Encrypt nao emite para `.local`. Use certificado autoassinado.

Gerar cert com SAN:
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -newkey rsa:4096 -sha256 -days 365 \
  -keyout /etc/nginx/ssl/alvorada.local.key \
  -out /etc/nginx/ssl/alvorada.local.crt \
  -subj "/CN=alvorada.local" \
  -addext "subjectAltName=DNS:alvorada.local,DNS:www.alvorada.local"
sudo systemctl reload nginx
```

Nginx deve apontar para:
```
ssl_certificate     /etc/nginx/ssl/alvorada.local.crt;
ssl_certificate_key /etc/nginx/ssl/alvorada.local.key;
```

## 7) Hosts no Windows
Arquivo:
```
C:\Windows\System32\drivers\etc\hosts
```
Linha:
```
IP_DO_SERVIDOR  alvorada.local
```
Depois:
```bat
ipconfig /flushdns
```

## 8) Confiar o certificado no Windows (Chrome)
Erro comum: `NET::ERR_CERT_AUTHORITY_INVALID`.

Passos:
1. Importar o cert como Root (PowerShell admin):
```powershell
certutil -addstore "Root" C:\caminho\para\alvorada.local.crt
```
2. Limpar estado SSL:
Painel de Controle -> Opcoes da Internet -> Conteudo -> Limpar estado SSL
3. Limpar HSTS do Chrome:
`chrome://net-internals/#hsts` -> Delete domain `alvorada.local`
4. Fechar e abrir o Chrome.

## 9) API do frontend via host
Para acessar via host (e nao localhost), o frontend precisa do endpoint correto:
```
NEXT_PUBLIC_API_URL=https://alvorada.local/api
```
Depois:
```bash
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
```

## 10) Comandos de diagnostico rapidos
```bash
git status
git log -1 --oneline
docker compose ps
sudo nginx -t
sudo nginx -T | grep -E "ssl_certificate|server_name"
sudo openssl x509 -in /etc/nginx/ssl/alvorada.local.crt -text -noout | grep -A1 "Subject Alternative Name"
```
