# 📘 HISTÓRIAS DE USUÁRIO, PERSONAS E JORNADAS

## Plataforma de Gestão Socioassistencial

---

# 🧑 PERSONAS

## Persona 1 — Educador Social (SCFV)

Atua diretamente com grupos, oficinas e ações socioeducativas.

Objetivos:

- Planejar atividades
- Registrar presenças
- Identificar situações de risco

---

## Persona 2 — Técnico de Referência (Assistente Social / Psicólogo)

Responsável por acompanhamento familiar e individual.

Objetivos:

- Registrar atendimentos
- Acompanhar ocorrências
- Encaminhar para rede

---

## Persona 3 — Coordenador de Serviço

Gestão de equipes e indicadores.

Objetivos:

- Visualizar dashboards
- Validar planejamentos
- Acompanhar casos críticos

---

## Persona 4 — Responsável Familiar

Responsável legal pela criança/adolescente.

Objetivos:

- Acompanhar frequência
- Receber comunicados

---

## Persona 5 — Parceiro/Apoiador

Instituição financiadora ou doadora.

Objetivos:

- Visualizar impacto
- Baixar relatórios

---

---

# 🧭 JORNADAS PRINCIPAIS

## Jornada — Criança no SCFV

1. Cadastro da criança
2. Vinculação à família
3. Vinculação ao projeto SCFV
4. Inclusão em grupo
5. Participação em ações
6. Registro de presença
7. Registro de destaques
8. Possível ocorrência
9. Atendimento
10. Encaminhamento (se necessário)

---

## Jornada — Família no PAIF

1. Cadastro família
2. Atendimento inicial
3. Plano de acompanhamento
4. Evoluções
5. Encaminhamentos

---

---

# 🧱 HISTÓRIAS DE USUÁRIO COM CRITÉRIOS

---

# 🧱 ÉPICO — PROGRAMAS (Camada Estratégica)

## 📌 Contexto SUAS

No âmbito do Sistema Único de Assistência Social (SUAS), os Programas representam o nível estratégico da oferta socioassistencial.

Exemplos:

- SCFV (Serviço de Convivência e Fortalecimento de Vínculos)
- PAIF (Programa de Atenção Integral à Família)
- PAEFI (Proteção e Atendimento Especializado a Famílias e Indivíduos)
- Programa de Cultura
- Programa de Qualificação Profissional

O Programa organiza:

- Finalidade institucional
- Público-alvo
- Diretrizes metodológicas
- Projetos operacionais vinculados

---

# 👥 Personas Envolvidas

### Coordenador de Serviço

Responsável por estruturar programas e supervisionar execução.

### Gestor Institucional

Responsável por relatórios e prestação de contas.

---

# 🧭 Jornada — Criação e Execução de Programa

1. Gestor cria Programa
2. Define tipo (SCFV, PAIF, etc.)
3. Define público-alvo
4. Vincula projetos
5. Acompanha indicadores consolidados
6. Gera relatórios para prestação de contas

---

# 📘 Histórias de Usuário

---

## HU-PROG-01 — Criar Programa

Como gestor  
Quero criar um programa  
Para organizar os serviços ofertados pela instituição.

### Critérios de Aceite

- Informar nome
- Selecionar tipo (SCFV, PAIF, PAEFI, Cultural, etc.)
- Definir descrição
- Definir status (Planejado | Ativo | Encerrado)
- Definir período de vigência (opcional)

---

## HU-PROG-02 — Editar Programa

Como gestor  
Quero editar informações do programa  
Para manter dados atualizados.

### Critérios

- Alterações ficam registradas em log de auditoria
- Não permitir exclusão se houver projetos vinculados

---

## HU-PROG-03 — Vincular Projeto ao Programa

Como gestor  
Quero vincular projetos a um programa  
Para organizar execução operacional.

### Critérios

- Projeto deve pertencer a apenas um programa
- Exibir lista de projetos vinculados
- Permitir filtro por status do projeto

---

## HU-PROG-04 — Visualizar Indicadores do Programa

Como coordenador  
Quero visualizar indicadores consolidados  
Para acompanhamento estratégico.

### Critérios

- Total de projetos ativos
- Total de participantes
- Total de ações realizadas
- Total de atendimentos
- Total de ocorrências
- Total de encaminhamentos

---

## HU-PROG-05 — Gerar Relatório do Programa

Como gestor  
Quero gerar relatório consolidado  
Para prestação de contas ao município ou parceiro.

### Critérios

- Filtro por período
- Consolidado por projeto
- Exportação em PDF
- Dados compatíveis com relatórios exigidos pelo SUAS

---

# 📜 Regras de Negócio

1. Todo Projeto deve pertencer a um Programa.
2. Programa não executa ações diretamente.
3. Indicadores do Programa são consolidados a partir dos Projetos.
4. Encaminhamentos e Atendimentos devem ser rastreáveis ao Programa via Projeto.
5. Exclusão de Programa só permitida se não houver projetos vinculados.

---

# 🔍 Conformidade SUAS

O módulo Programas deve garantir:

- Organização por tipo de serviço socioassistencial
- Centralidade na família e no território
- Evidências para prestação de contas
- Consolidação de dados para relatórios institucionais

---

# 🧠 Modelo Conceitual

Programa (Estratégia)
└── Projetos (Execução)
├── Ações
├── Ocorrências
├── Atendimentos
└── Encaminhamentos

## ÉPICO — AÇÕES (SCFV / Oficinas / Cursos)

### HU-A1 — Planejar ação

Como educador  
Quero planejar uma ação  
Para organizar atividades socioeducativas.

Critérios:

- Informar projeto
- Informar tipo de ação
- Definir objetivo alinhado ao serviço (SCFV, PAIF, etc.)

---

### HU-A2 — Executar ação

Como educador  
Quero executar ação  
Para registrar o que ocorreu.

Critérios:

- Data real
- Responsáveis
- Grupo

---

### HU-A3 — Registrar presença

Como educador  
Quero registrar presença  
Para comprovar participação.

Critérios:

- Lista automática do grupo
- Marcação presente/falta

---

### HU-A4 — Registrar destaque

Como educador  
Quero registrar destaque  
Para evidenciar desenvolvimento.

Critérios:

- Texto livre
- Opcional pessoa

---

---

## ÉPICO — OCORRÊNCIAS

### HU-O1 — Registrar ocorrência

Como educador  
Quero registrar ocorrência  
Para sinalizar situação de risco.

Critérios:

- Pessoa
- Projeto
- Tipo
- Gravidade
- Status inicial ABERTA

---

### HU-O2 — Acompanhar ocorrência

Como técnico  
Quero registrar evoluções  
Para resolver situação.

Critérios:

- Evoluções cronológicas
- Alteração de status

---

---

## ÉPICO — ATENDIMENTOS (PAIF / PAEFI)

### HU-AT1 — Criar atendimento

Como técnico  
Quero registrar atendimento  
Para intervenção familiar/individual.

Critérios:

- Pessoa ou família
- Tipo de atendimento
- Profissional

---

### HU-AT2 — Registrar evolução

Como técnico  
Quero registrar evolução  
Para acompanhamento contínuo.

Critérios:

- Texto livre
- Data

---

---

## ÉPICO — ENCAMINHAMENTOS

### HU-E1 — Criar encaminhamento

Como técnico  
Quero criar encaminhamento  
Para articular com rede.

Critérios:

- Origem (ocorrência ou atendimento)
- Destino (CRAS, UBS, CAPS, escola)
- Motivo

---

---

## ÉPICO — PORTAL FAMILIAR

### HU-PF1 — Visualizar presenças

Como responsável  
Quero ver presenças  
Para acompanhar frequência.

Critérios:

- Somente filhos vinculados

---

---

# 📜 PRINCÍPIOS DE CONFORMIDADE SUAS

- Centralidade no usuário e na família
- Registro de acompanhamentos
- Histórico contínuo
- Territorialização (projeto)
- Sigilo e controle de acesso
- Evidências para prestação de contas

---

# ✅ FIM DO DOCUMENTO
