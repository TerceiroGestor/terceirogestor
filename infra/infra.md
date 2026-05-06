# Infraestrutura GCP do Projeto TerceiroGestor

## 1) Objetivo deste artigo

Este documento explica, de forma pratica e arquitetural, como a infraestrutura atual do projeto funciona no GCP, como ela e atualizada, quais erros sao mais comuns durante update/deploy e como operar tudo com seguranca no dia a dia.

Escopo coberto:

- Cloud Run (backend, frontend e job de migracao)
- Load Balancer serverless global
- Cloud Storage (bucket publico e privado)
- Cloud SQL PostgreSQL
- Terraform (infra como codigo)
- GCP CLI (gcloud), Docker e script de automacao

Este artigo foi escrito com base no estado real atual da infraestrutura e dos scripts em uso no repositorio.

---

## 2) Visao geral da arquitetura

Fluxo principal de requisicao HTTP:

1. Usuario acessa dominio publico (terceirogestor.org)
2. Global Load Balancer recebe o trafego HTTPS
3. Regras de roteamento enviam:
   - / para servico frontend (Cloud Run)
   - /api para servico backend (Cloud Run)
4. Backend acessa Cloud SQL via conector/instancia configurada
5. Backend acessa Cloud Storage para uploads e leitura de arquivos

Componentes principais provisionados:

- Artifact Registry: repositorio de imagens Docker
- Cloud Run Service: terceirogestor-backend
- Cloud Run Service: terceirogestor-frontend
- Cloud Run Job: terceirogestor-db-migrate
- Cloud SQL: instancia PostgreSQL + database da aplicacao
- Cloud Storage: bucket publico e bucket privado
- Secret Manager: segredos consumidos pelo backend
- Load Balancer serverless: entrada publica com TLS e roteamento

---

## 3) Organizacao da infraestrutura no repositorio

Pasta base:

- infra/

Estrutura relevante:

- infra/environments/prod/
  - versions.tf
  - providers.tf
  - variables.tf
  - main.tf
  - outputs.tf
  - terraform.tfvars
- infra/modules/
  - artifact_registry/
  - cloud_sql/
  - cloud_run_service/
  - cloud_run_job/
  - serverless_load_balancer/
  - storage_buckets/
  - secret_manager/
  - service_account/
  - project_services/
- infra/scripts/gcp/
  - gcp-update.ps1

Principio adotado: o environment prod compoe modulos reutilizaveis para manter infraestrutura consistente e declarativa.

---

## 4) Terraform: como tudo e criado

Arquivo de composicao principal:

- infra/environments/prod/main.tf

### 4.1 APIs obrigatorias

O modulo project_services habilita APIs fundamentais, por exemplo:

- run.googleapis.com
- compute.googleapis.com
- storage.googleapis.com
- sqladmin.googleapis.com
- secretmanager.googleapis.com
- artifactregistry.googleapis.com

Sem isso, recursos posteriores falham no apply.

### 4.2 Imagens de backend/frontend

As imagens usadas nos servicos sao montadas a partir de:

- backend_image_tag
- frontend_image_tag

No Terraform, isso vira:

- us-central1-docker.pkg.dev/<project>/<repo>/terceirogestor-backend:<tag>
- us-central1-docker.pkg.dev/<project>/<repo>/terceirogestor-frontend:<tag>

### 4.3 Cloud Run Services

Backend e frontend sao provisionados como servicos Cloud Run independentes.

- Backend recebe env vars de banco, buckets, projeto GCP, URL web e segredos
- Frontend recebe env vars como NEXT_PUBLIC_API_URL e API interna

### 4.4 Cloud Run Job de migracao

Existe um job dedicado para migracao de banco.

Comando atual do job (resumo):

- roda ensure-database.js
- verifica se existe pasta de migration
- executa prisma migrate deploy quando houver migration
- falha explicitamente se nao houver migration de producao

Isso evita fallback inseguro para db push em producao.

### 4.5 Storage

Ha dois buckets:

- publico: arquivos publicos (ex.: imagens e anexos publicos)
- privado: conteudo restrito/sensivel

O backend tem permissao para operacao de objetos conforme IAM definido.

### 4.6 Banco de dados

Cloud SQL PostgreSQL e criado com parametros de edition/tier/backup/deletion protection definidos em variaveis.

### 4.7 Load Balancer serverless

Quando habilitado:

- expõe dominio publico HTTPS
- roteia frontend e backend
- padrao operacional atual usa /api como contrato publico para backend

---

## 5) Cloud Run no projeto (estado atual)

Servicos ativos:

- terceirogestor-backend
- terceirogestor-frontend

Padrao de update:

- nova imagem Docker com tag de timestamp
- update do tag no terraform.tfvars
- terraform apply com target especifico para reduzir mudancas fora de escopo

Ponto importante:

- deploy de backend e deploy de frontend podem ser feitos separadamente

---

## 6) Uploads e Cloud Storage (como esta funcionando)

Historico recente:

- uploads eram dependentes de disco local
- backend foi adaptado para upload em memoria + GCS
- validacao de path de anexo foi ajustada para aceitar URLs reais do GCS

Problema que ocorreu:

- erro Caminho de anexo invalido
- causa: validacao esperava path iniciando em /uploads/... e nao tratava URL com bucket no path

Exemplo de URL retornada pelo GCS:

- https://storage.googleapis.com/<bucket>/uploads/people/...

Correcao aplicada:

- normalizacao agora remove host e tambem permite remover o primeiro segmento (bucket)
- depois valida prefixo esperado (/uploads/people/, /uploads/projects/, etc.)

Resultado:

- avatar e anexos passam a respeitar o contrato de upload com GCS

---

## 7) Script de operacao: gcp-update.ps1

Arquivo:

- infra/scripts/gcp/gcp-update.ps1

Responsabilidades:

1. Resolver comandos (docker, gcloud, terraform)
2. Ler project/region/repo no terraform.tfvars
3. Build e push de imagem (frontend, backend ou ambos)
4. Atualizar tags no terraform.tfvars
5. Terraform validate/apply com targets por tipo de deploy
6. Executar job de migracao para backend/both
7. Rodar validacao HTTP final

### 7.1 Comportamento atual de resiliencia

Ajuste importante implementado:

- se Target for backend e o Cloud Run Job de migracao falhar, o deploy nao e mais interrompido
- o script gera warning e comandos de troubleshooting
- para cenarios mais amplos (both), a falha do job continua critica

### 7.2 Validacao HTTP final atual

Checks atuais no script:

- frontend-root
- backend-root
- public-api-root (quando load balancer estiver ativo)

Observacao:

- checks antigos em /health/detailed estavam gerando falso negativo no ambiente atual
- por isso foram trocados para endpoints que realmente respondem no contrato atual

---

## 8) Erros comuns em atualizacao no GCP (e como tratar)

Esta e a parte mais importante para operacao futura.

### 8.1 Falha no Cloud Run Job de migracao

Sintoma:

- gcloud run jobs execute ... --wait retorna execution failed

Causas tipicas:

- nao existem migrations versionadas
- erro de segredo/credencial do banco
- timeout ou erro de comando no container

Como verificar:

- gcloud run jobs executions list --job <job> --project <project> --region <region> --limit=5
- gcloud run jobs executions describe <execution>
- gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=<job>" --project <project> --limit=50 --format=json

Acao recomendada:

- corrigir causa do job
- manter deploy backend resiliente quando necessario (ja implementado)

### 8.2 Falso negativo em health check

Sintoma:

- deploy termina com erro de validacao HTTP, mesmo servico aparentemente no ar

Causa tipica:

- endpoint de health usado no script nao corresponde ao endpoint real exposto

Acao:

- testar endpoints reais com curl/Invoke-WebRequest
- ajustar contrato de validacao no script

### 8.3 Erro de autenticacao Terraform/GCP

Sintoma:

- terraform apply falha por credencial

Causa:

- token ausente/expirado

Acao:

- garantir login gcloud
- deixar script preencher TF_VAR_gcp_access_token automaticamente (comportamento atual)

### 8.4 Imagem nao atualiza no Cloud Run

Sintoma:

- deploy aplica sem erro, mas revisao continua em imagem antiga

Causas:

- tag no tfvars nao atualizada
- push da imagem falhou
- target Terraform nao incluiu servico correto

Acao:

- validar image tag publicada no Artifact Registry
- validar spec.template.spec.containers.image no Cloud Run

### 8.5 Problemas de roteamento /api no dominio

Sintoma:

- frontend abre, API publica retorna 404/erro

Causas:

- regra de URL map incorreta
- DNS apontando para destino errado
- certificado TLS em estado nao ativo

Acao:

- revisar URL map e host rules
- revisar DNS A/AAAA/CNAME
- revisar ssl-certificate managed status

### 8.6 Segredo inexistente ou sem permissao

Sintoma:

- container do backend sobe e cai, ou falha ao inicializar

Causas:

- secret nao criado
- IAM secretAccessor ausente para service account

Acao:

- validar nomes de secrets no Terraform
- validar IAM binding para service account do backend

---

## 9) Operacao futura: boas praticas de gestao

### 9.1 Estrategia de deploy recomendada

Para mudanca somente de backend:

1. commit da mudanca
2. build local do backend
3. deploy com Target backend
4. conferir revisao Cloud Run e logs
5. validar upload real no dominio publico

Para frontend:

1. build local do frontend
2. deploy com Target frontend
3. validar pagina inicial e chamadas /api

### 9.2 Separar classes de problema

Durante incidentes, separar em blocos:

- bloco A: build/imagem
- bloco B: terraform/infra
- bloco C: runtime Cloud Run
- bloco D: banco e migracao
- bloco E: networking publico (LB/DNS/TLS)

Isso reduz tempo de diagnostico.

### 9.3 Nunca depender de um unico check

Use sempre combinacao de sinais:

- status do Terraform
- status da revisao Cloud Run
- logs do job/servico
- chamada HTTP real no dominio publico

### 9.4 Padrao para mudancas em upload/arquivo

Qualquer mudanca de upload deve validar:

- URL final gravada no banco
- leitura posterior dessa URL
- validacao de prefixo/path nas regras de dominio
- permissao IAM do bucket

### 9.5 Governanca de Terraform

- manter mudancas pequenas e focadas
- evitar apply amplo quando escopo e apenas backend/frontend
- revisar outputs apos apply
- planejar evolucao para backend remoto de state quando necessario

---

## 10) Runbook rapido de comandos uteis

### 10.1 Ver servicos Cloud Run

- gcloud run services list --project <project> --region <region>

### 10.2 Ver imagem da revisao atual

- gcloud run services describe terceirogestor-backend --project <project> --region <region> --format="yaml(status.latestReadyRevisionName,spec.template.spec.containers)"

### 10.3 Executar deploy padrao backend

- PowerShell -ExecutionPolicy Bypass -File .\infra\scripts\gcp\gcp-update.ps1 -Target backend

### 10.4 Ver ultimas execucoes de migracao

- gcloud run jobs executions list --job terceirogestor-db-migrate --project <project> --region <region> --limit=10

### 10.5 Validar dominio e API publica

- curl -i https://terceirogestor.org/
- curl -i https://terceirogestor.org/api

---

## 11) Estado atual consolidado

Hoje, a estrutura esta estabilizada com:

- infraestrutura provisionada por Terraform
- backend e frontend em Cloud Run
- storage segregado (public/private)
- SQL gerenciado no Cloud SQL
- deploy automatizado por script com validacao HTTP
- tratamento resiliente para falha do job de migracao no deploy backend
- validacao de caminho de anexo ajustada para URLs reais do GCS

Ou seja: o caminho principal de operacao esta funcional, e os erros mais frequentes ja estao mapeados com acao de resposta.

---

## 12) Evolucoes recomendadas (proximos passos)

- Adicionar monitoramento/alerta para falha de execution do job de migracao
- Definir politica de migrations obrigatorias por release
- Consolidar endpoint de health sem ambiguidade para backend e LB
- Avaliar backend remoto para Terraform state (GCS + controle de lock)
- Adicionar checklist pre-deploy e post-deploy no pipeline CI/CD

Com isso, a operacao fica menos dependente de validacao manual e mais previsivel em producao.
