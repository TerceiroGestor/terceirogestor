# Nginx + SSL no servidor (Ubuntu)

Este guia assume:
- Os containers rodam apenas `mysql`, `backend` e `frontend`.
- O frontend exposto em `http://127.0.0.1:3000`.
- O backend exposto em `http://127.0.0.1:3001`.

## 1) DNS e firewall
1. Crie registros DNS (A) apontando para o IP do servidor:
   - `terceirogestor.org`
   - `www.terceirogestor.org` (opcional)
2. Libere as portas 80 e 443:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 2) Instalar Nginx e Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 3) Configurar o Nginx
Crie o arquivo:
```bash
sudo nano /etc/nginx/sites-available/terceirogestor.conf
```

Conteudo sugerido:
```nginx
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}

server {
  listen 80;
  server_name terceirogestor.org www.terceirogestor.org;

  location /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Ative o site:
```bash
sudo ln -s /etc/nginx/sites-available/terceirogestor.conf /etc/nginx/sites-enabled/terceirogestor.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 4) Emitir SSL com Certbot
```bash
sudo certbot --nginx -d terceirogestor.org -d www.terceirogestor.org
```

O Certbot vai ajustar o bloco HTTPS automaticamente.

## 5) Renovacao automatica
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## Notas
- Se o frontend estiver em outro dominio (ex: `app.dominio.com`), ajuste `server_name`.
- Se quiser API em subdominio (ex: `api.dominio.com`), crie outro `server` apontando para `127.0.0.1:3001`.
