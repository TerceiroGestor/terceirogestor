# Pesquisa de Mercado — Módulo de Convivência e Fortalecimento de Vínculos (SCFV)

Data: 12/11/2026. Fontes: Tipificação Nacional de Serviços Socioassistenciais (Resolução CNAS nº 109/2009), Resolução CNAS nº 01/2013 (público prioritário), Resolução CIT nº 04/2011 e nº 20/2013 (RMA), SISC/MDS, notas técnicas estaduais (RN, SC, RS, ES, PE). Objetivo: validar se o modelo Programa→Projeto→Atividade→Encontro já desenhado atende à regra de negócio real do setor, e o que falta.

## 1. O que o SCFV é, oficialmente

Serviço de **proteção social básica**, de caráter preventivo, organizado em **grupos por ciclo de vida** (faixa etária), executado por **CRAS** (diretamente) ou por **ONGs/OSCs conveniadas** (execução indireta). Toda ONG que roda SCFV com recurso do Fundo de Assistência Social **presta conta ao SISC** (Sistema de Registro das Informações de Convivência e Fortalecimento de Vínculos) e ao **RMA** (Registro Mensal de Atendimentos), ambos do MDS. Isso significa: o módulo não serve só para gestão interna — ele é, na prática, **um sistema de compliance com órgão público**, e isso muda prioridades de modelagem.

## 2. Faixas etárias e carga horária — regra dura, não flexível

A Tipificação define 6 faixas, cada uma com limites de carga horária diária:

| Faixa etária | Carga diária | Observação |
|---|---|---|
| 0–6 anos | até 1h30/dia | dias úteis, feriados ou fds |
| 6–15 anos | até 4h/dia | — |
| 15–17 anos | até 3h/dia | — |
| 18–29 anos | sob demanda | horários programados |
| 30–59 anos | sob demanda | horários programados |
| 60+ (idosos) | sob demanda | horários programados |

**Impacto no schema:** `ActionOccurrence` (Encontro) já tem `startTime/endTime`, mas falta uma validação de regra de negócio ligada à faixa etária do `PeopleGroup`/grupo. Recomendo adicionar ao `PeopleGroup` (ou a uma entidade "Grupo SCFV") um campo `ageBracket` (enum: `ATE_6`, `6_A_15`, `15_A_17`, `18_A_29`, `30_A_59`, `60_MAIS`) e, na geração em lote de encontros, um aviso (não bloqueio rígido, porque há exceções) se a duração exceder o limite da faixa.

## 3. Grupo como unidade central — confirma o seu modelo

A documentação é explícita: **"a compreensão de Grupo no SCFV deve considerar o envolvimento dos participantes, a construção de vínculos entre participantes e com os profissionais, o compartilhamento de objetivos, a atuação na comunidade"**. Ou seja, grupo não é um filtro de relatório — é **a unidade de prestação do serviço**. Isso valida 100% a decisão já tomada no seu plano: encontros organizados por grupo e horário, com entrada/saída de participante no grupo tendo histórico temporal (`ProjectEnrollmentGroupMembership` já cobre isso).

**Ponto que falta no seu plano**: SISC trabalha com o conceito de **"percurso"** — o usuário avança entre grupos ao longo do tempo dentro da mesma faixa etária ou entre faixas (ex.: criança que faz aniversário migra de grupo). Vale um campo de **motivo de desligamento do grupo** (`TRANSFERENCIA_FAIXA_ETARIA`, `DESISTENCIA`, `MUDANCA_TERRITORIO`, `CONCLUSAO`, `OUTRO`) na saída do `ProjectEnrollmentGroupMembership`, porque isso é exatamente o que o SISC pede ao desvincular usuário.

## 4. Público prioritário — regra de elegibilidade que falta no seu plano atual

A Resolução CNAS 01/2013 define **público prioritário** para entrada no SCFV (concorrência por vaga quando há fila): crianças/adolescentes em situação de trabalho infantil, em medida protetiva, em cumprimento de medida socioeducativa, com deficiência, fora da escola, beneficiários do BPC/PBF, egressos de instituição, vítimas de violência, entre outros.

**Isso não existe no seu plano atual.** Recomendo um campo estruturado na Pessoa ou na Matrícula (`ProjectEnrollment`) tipo `priorityCriteria: String[]` (multi-seleção com os critérios oficiais) — ele alimenta tanto a fila de espera (priorização) quanto o próprio SISC/RMA, que pede essa contagem.

## 5. O que o SISC e o RMA exigem como registro mínimo (checklist de compliance)

Com base no manual CIT e nas notas técnicas estaduais, os dados mínimos exigidos mensalmente são:

- Nº de grupos ativos por faixa etária/unidade;
- Nº de usuários inseridos, desvinculados e em lista de espera por grupo;
- Carga horária semanal de funcionamento de cada grupo;
- Nº de encontros realizados no mês (frequência real, não planejada);
- Identificação do **público prioritário** atendido;
- Dados de CadÚnico/NIS do usuário (vínculo com o cadastro único, fora do escopo do módulo em si, mas é referenciado);
- Técnico de referência responsável pelo encaminhamento (geralmente do CRAS, pode ser externo à ONG).

**Conclusão prática:** seu modelo (`ActionOccurrence` + `ProjectActionAttendance` por encontro) já gera **exatamente** os dados que o RMA/SISC pedem — nº de encontros realizados, frequência por pessoa, grupos ativos. Isso é um grande acerto do plano. Falta só:
1. Campo de **técnico de referência externo/encaminhador** (pode ser um papel novo em `ProjectActionPeopleParticipation` ou campo simples na matrícula) — para diferenciar de "profissional que executa o encontro".
2. **Lista de espera** — hoje não existe no plano. Se a ONG tem fila por grupo/faixa etária, precisa de um status `WAITLIST` em `ProjectEnrollment` ou tabela própria, com data de entrada na fila (usada para priorização por ordem + critério prioritário).
3. Export/relatório no formato aproximado do RMA/SISC (mesmo que não seja integração direta com o sistema do governo, a ONG value um relatório "pronto para digitar no SISC").

## 6. Objetivos do serviço — plano de desenvolvimento individual/grupal

A Tipificação lista objetivos explícitos (fortalecer vínculos, prevenir institucionalização, promover acesso a direitos, trocas culturais, protagonismo no território). Muitas ONGs de maior maturidade (financiadoras privadas, editais, prestação de contas a conselhos) pedem registro de **avaliação periódica do grupo** — não presença simples, mas um "diário de bordo"/relato qualitativo por encontro ou por período.

**Sugestão de baixo custo:** o campo `notes` já previsto em `ActionOccurrence` cobre o relato pontual do encontro. Para avaliação periódica (ex.: trimestral), um model leve `GroupAssessment` (groupId, period, text, createdBy) atende sem necessidade de reestruturar nada — pode ficar como fase futura, não é bloqueante.

## 7. Estrutura de dados consolidada (ajustes sobre o plano original)

Seu plano de `ActionOccurrence` e migração de presença está correto e não muda. Ajustes recomendados, por ordem de prioridade:

| # | Ajuste | Onde | Prioridade |
|---|---|---|---|
| 1 | `ageBracket` no grupo (faixa etária oficial SCFV) | `PeopleGroup` ou grupo ligado ao projeto | Alta — é a espinha dorsal do serviço |
| 2 | `priorityCriteria[]` na matrícula/pessoa | `ProjectEnrollment` | Alta — usado pra fila e pra RMA |
| 3 | Lista de espera (`WAITLIST`) com data de entrada | `ProjectEnrollment` (novo status) ou tabela `WaitlistEntry` | Alta — demanda operacional real de ONG com fila |
| 4 | Motivo de desligamento do grupo | `ProjectEnrollmentGroupMembership` | Média |
| 5 | Papel "técnico de referência externo/encaminhador" | `ProjectActionPeopleParticipation` ou campo na matrícula | Média |
| 6 | Relatório formatado próximo ao RMA/SISC (export) | Camada de relatórios (seção 4 do plano original) | Média — forte diferencial comercial |
| 7 | `GroupAssessment` (avaliação qualitativa periódica) | Novo model, fase futura | Baixa |

## 8. Recomendação de posicionamento comercial

Para um SaaS vendido a ONGs de SCFV, o diferencial não é "ter atividades e encontros" (qualquer agenda faz isso) — é **sair pronto para a prestação de contas oficial** (SISC/RMA) e para **editais/financiadores privados** que pedem indicadores de permanência, frequência e público prioritário. Os itens 1, 2, 3 e 6 desta lista são o que transforma o módulo de "agenda de aulas" em "sistema de gestão de SCFV" — vale priorizá-los antes mesmo de abrir a fase de UI de Encontros, porque são campos de dados, não telas, e ficam baratos de adicionar agora e caros de adicionar depois (campos em produção com dado real).

## 9. O que confirma 100% o plano já escrito (sem necessidade de mudança)

- Programa → Projeto → Atividade → Encontro: bate exatamente com Programa (ex. "Proteção Social Básica") → Projeto com início/meio/fim → Atividade (grupo de Coral, Capoeira etc.) → Encontro (a aula do dia).
- Encontro por grupo e horário: é textualmente como o SCFV define "Grupo" na documentação oficial.
- Presença por encontro (não por atividade inteira): é o dado mínimo que RMA/SISC exigem — frequência real mês a mês.
- Múltiplos profissionais por atividade, herdados no encontro: compatível com a prática (educador social + orientador social, por exemplo).