# Plano de Aulas: Operacao de Servidor e Producao

Este material organiza um trilho de estudo pratico para administrar o servidor do projeto com mais seguranca e previsibilidade.

## Objetivo

Sair do estado "o sistema esta funcionando" para "eu sei operar, atualizar, diagnosticar e recuperar o ambiente em producao".

## Formato sugerido

- 2 aulas por semana
- 60 a 90 minutos por aula
- Sempre com pratica no servidor real
- Cada aula termina com um procedimento escrito e testado

## Trilha de aulas

### Aula 1 - Fundamentos do Ubuntu

Objetivo:
- Entender usuarios, permissoes, servicos, disco, memoria, rede e processos

Pratica:
- Usar `top`, `df -h`, `free -h`, `ss -tulpn`, `journalctl`
- Revisar como administrar sem depender de `root`

### Aula 2 - Estrutura da stack em producao

Objetivo:
- Entender o papel de `frontend`, `backend`, `mysql`, `backup`, `nginx`, `.env`, volumes e rede Docker

Pratica:
- Mapear o fluxo do navegador ate o banco de dados

### Aula 3 - Docker e Docker Compose para operacao

Objetivo:
- Operar containers com seguranca e entender rebuild, recreate, restart, logs, healthcheck e volumes

Pratica:
- Usar `docker compose ps`, `logs`, `exec`, `inspect`, `up`, `build`, `down`

### Aula 4 - Variaveis de ambiente e segredos

Objetivo:
- Saber o que exige rebuild, o que muda em runtime e como proteger credenciais

Pratica:
- Classificar `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`, `DATABASE_URL`, `MYSQL_ROOT_PASSWORD`, `WEB_URL`, `JWT_SECRET`

### Aula 5 - Nginx, DNS, IP e SSL

Objetivo:
- Entender reverse proxy, `server_name`, TLS, certificados e diferencas entre acesso por dominio e por IP

Pratica:
- Configurar `/` para frontend e `/api/` para backend
- Validar o comportamento com `alvorada.local` e com IP

### Aula 6 - Banco de dados com seguranca

Objetivo:
- Reduzir dependencia de `root`, controlar acessos e operar migrations com seguranca

Pratica:
- Criar usuario de aplicacao no MySQL
- Revisar permissoes e acesso remoto
- Testar migration e seed sem improviso

### Aula 7 - Backup e restauracao

Objetivo:
- Garantir que backup funcione de verdade e possa ser restaurado

Pratica:
- Validar geracao de backup
- Restaurar em base limpa
- Definir retencao e rotina de verificacao

### Aula 8 - Atualizacao segura da aplicacao

Objetivo:
- Atualizar o sistema sem quebrar producao

Pratica:
- Revisar `script/update.sh`
- Entender ordem de `git pull`, `build`, `migrate`, `seed`, `recreate`
- Definir um rollback simples

### Aula 9 - Logs, monitoramento e diagnostico

Objetivo:
- Identificar falhas antes que elas virem incidente

Pratica:
- Usar `docker logs`, `docker compose ps`, `journalctl`
- Monitorar CPU, memoria, disco, SSL e backups

### Aula 10 - Hardening do servidor

Objetivo:
- Reduzir a superficie de ataque

Pratica:
- Configurar `ufw`
- Revisar SSH com chave
- Desabilitar login root
- Avaliar `fail2ban`
- Revisar permissoes de arquivos e segredos

### Aula 11 - Resposta a incidentes

Objetivo:
- Ter procedimentos para falhas comuns

Pratica:
- Criar playbooks para:
- backend indisponivel
- falha de conexao com banco
- SSL expirado
- disco cheio
- falha em migration ou seed
- falha de backup

### Aula 12 - Checklist de producao

Objetivo:
- Consolidar um checklist operacional antes de expor o sistema em ambiente real

Pratica:
- Revisar configuracao, seguranca, backup, restore, observabilidade e rotina de atualizacao

## Resultado esperado

Ao final da trilha, voce deve conseguir:

- Atualizar a aplicacao com seguranca
- Diagnosticar falhas comuns sem improviso
- Restaurar backups
- Operar DNS, SSL e Nginx com confianca
- Proteger melhor credenciais e dados
- Manter o ambiente mais proximo de um padrao de producao

## Proximo passo

Comecar pela Aula 1 e transformar cada encontro em um procedimento documentado dentro desta pasta.
