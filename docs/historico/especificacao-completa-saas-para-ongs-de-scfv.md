# Especificação Completa de Funcionalidades — SaaS para OSCs executoras do SCFV

Consolidação de duas pesquisas (regras oficiais do SCFV/SISC/RMA e benchmarks de prontuário eletrônico SUAS) em um documento único de funcionalidades-alvo. Data: 13/11/2026.

## 1. Visão geral da arquitetura funcional

```
Pessoa/Família (People)
   └─ Prontuário Social (Atendimento + Encaminhamento + Ocorrência) [NOVO]
   └─ Matrícula em Projeto (ProjectEnrollment)
         └─ Grupo (PeopleGroup, por faixa etária/ciclo)
               └─ Atividade (ProjectAction, ex.: Coral) [relabel "Ação"→"Atividade"]
                     └─ Encontro (ActionOccurrence) [NOVO]
                           └─ Presença (ProjectActionAttendance, migrado para nível de Encontro)
Programa → Projeto → Atividade → Encontro (estrutura organizacional)
```

Tudo converge para dois produtos finais: **(a)** a timeline/prontuário de 360° da pessoa, e **(b)** os relatórios de gestão/compliance (RMA/SISC e prestação de contas a financiadores).

## 2. Módulo People (cadastro) — já existente, sem mudança estrutural

- Pessoa: identificação, documentos, contato, `personType`, status, tags/notas.
- Família/domicílio: `Household`, `HouseholdMember` (papéis: responsável legal, chefe de família, provedor, dependente), `HouseholdProfile`, parentesco (`PersonRelation`).
- Financeiro: renda, despesa, benefícios sociais, patrimônio (individual e domiciliar).
- Saúde/educação/reclusão: condições de saúde, medicação, histórico escolar, reclusão.
- Documento sensível com criptografia + log de auditoria de acesso.
- Comentários/anexos/tags genéricos reaplicáveis a qualquer sub-registro (`recordType`+`recordId`).
- **Gap pendente de UI:** telas de patrimônio (`PersonAsset`/`HouseholdAsset`) existem no backend sem tela.

## 3. Módulo Programas/Projetos/Atividades/Encontros

### 3.1 Hierarquia e papéis já cobertos
- **Programa**: guarda-chuva (já existente, sem mudança).
- **Projeto**: início/meio/fim, ligado ao Programa (já existente).
- **Atividade** (relabel de "Ação" só na UI, model continua `ProjectAction`): serviço recorrente dentro do projeto (ex. Coral, Violão). Um ou mais profissionais (`ProjectActionPeopleParticipation`), um ou mais grupos-alvo (`ActionPeopleGroup`).
- **Grupo de pessoas** (`PeopleGroup`): unidade central de organização do atendimento, com histórico de entrada/saída (`PeopleGroupParticipation`/`activeKey`).

### 3.2 Encontro — peça que falta hoje (model novo)
`ActionOccurrence`: data, horário, grupo, status (`SCHEDULED/DONE/CANCELED`), profissionais herdados da atividade, geração em lote por recorrência (dias da semana + período), agrupados por `recurrenceBatchId` para edição/cancelamento em série.

### 3.3 Presença por encontro (migração de granularidade)
`ProjectActionAttendance` passa a ser por `(occurrenceId, enrollmentId)` em vez de `(actionId, enrollmentId)` — permite frequência real dia a dia, exigida pelo RMA/SISC. Migração em 2 deploys (expandir→contrair), com backfill de histórico.

### 3.4 Regras de negócio oficiais do SCFV que o sistema precisa refletir
| Regra | Campo/mecanismo proposto |
|---|---|
| Faixa etária do grupo com limite de carga horária diária (0-6: 1h30; 6-15: 4h; 15-17: 3h; 18+: sob demanda) | `ageBracket` no grupo + alerta (não bloqueio) na geração de encontros |
| Público prioritário (trabalho infantil, BPC/PBF, medida protetiva, deficiência, fora da escola etc.) | `priorityCriteria[]` na matrícula/pessoa — alimenta fila e relatório |
| Lista de espera por grupo/faixa etária | Status `WAITLIST` na matrícula (ou tabela própria) com data de entrada, para ordenação + priorização |
| Motivo de desligamento do grupo (transferência de faixa, desistência, mudança de território, conclusão) | Campo na saída do `PeopleGroupParticipation`/`ProjectEnrollmentGroupMembership` |
| Técnico de referência/encaminhador (diferente de quem executa o encontro) | Papel novo em `ProjectActionPeopleParticipation` ou campo na matrícula |
| Avaliação periódica qualitativa do grupo (diário de bordo) | `GroupAssessment` (fase futura, baixo custo de adicionar depois) |

## 4. Módulo de Atendimento Técnico (Social/Psicológico) — NOVO

Hoje não existe nenhum model equivalente — é o maior gap estrutural identificado.

- **`PersonServiceRecord`** ("Atendimento"): tipo (`SOCIAL/PSICOLOGICO/JURIDICO/SAUDE/OUTRO`), modalidade (`INDIVIDUAL/FAMILIAR/GRUPAL`), data, profissional responsável, demanda, registro técnico (texto estruturado), sigilo (`confidential`), vínculo opcional com matrícula/projeto, próximos passos, status (`OPEN/IN_PROGRESS/CLOSED`).
- **Plano de Acompanhamento** (`PersonCarePlan`, fase 2): objetivo, data início/meta, status, revisões periódicas — espelha "Planejamento e evolução do acompanhamento familiar" do Prontuário SUAS.
- Diferença explícita de um comentário solto: atendimento precisa ser **filtrável e relatoriável** (quantos atendimentos sociais no mês, quantos casos em aberto).

## 5. Módulo de Encaminhamentos para Rede — NOVO

- **`Referral`**: rede de destino (`CRAS/CREAS/CENTRO_POP/SUS/CONSELHO_TUTELAR/ESCOLA/MINISTERIO_PUBLICO/OUTRO`), unidade específica, motivo, profissional que encaminhou, **status com contrarreferência** (`SENT/ACKNOWLEDGED/IN_PROGRESS/RETURNED/NO_RESPONSE`), data de retorno e notas de retorno.
- Diferencial de mercado confirmado pela pesquisa: encaminhamento não é só "enviei um ofício" — é um fluxo com **retorno rastreado**, com alerta automático para casos sem resposta após N dias.
- Cadastro formal de Rede Socioassistencial (`NetworkPartner`) como fase 2 opcional; texto livre resolve o MVP.

## 6. Módulo de Ocorrências — NOVO

- **`PersonOccurrence`**: categoria (`COMPORTAMENTAL/VIOLACAO_DIREITOS/SAUDE/SEGURANCA/ADMINISTRATIVA/OUTRO`), gravidade (`BAIXA/MEDIA/ALTA`), descrição, quem registrou, ação tomada no momento, sigilo, vínculo opcional com o Encontro (`ActionOccurrence`) em que ocorreu.
- Pode gerar, a partir do mesmo registro, um Atendimento formal e/ou um Encaminhamento — os três módulos são interligados, não isolados.

## 7. Controle de acesso e sigilo profissional

- Registro marcado `confidential=true` (em Atendimento e Ocorrência) visível só para: autor, papéis `PSICOLOGO`/`COORDENACAO_TECNICA` e administradores do tenant.
- Reaproveita o padrão de log de auditoria já existente para documento sensível (`PersonSensitiveAccessLog`), aplicado também a estes registros confidenciais.

## 8. Histórico 360° da Pessoa (timeline unificada)

Implementa a aba "Atendimentos" hoje desabilitada, reunindo em uma única linha do tempo filtrável:

1. Matrículas em projetos e grupos.
2. Atividades e encontros (frequência, presença, agendados futuros).
3. Atendimentos técnicos (social/psicológico/jurídico/saúde).
4. Encaminhamentos e seus retornos.
5. Ocorrências registradas.

Este é o "registro completo dos serviços prestados" — o maior diferencial comercial perante concorrentes que só fazem agenda/frequência.

## 9. Relatórios finais — como devem ser entregues

Os relatórios não são telas isoladas: devem aparecer **no contexto onde o gestor já está** (detalhe do Programa/Projeto/Pessoa) e sempre no formato "pronto para apresentar" — para o conselho, o financiador ou para digitar no sistema do governo.

### 9.1 Relatórios de estrutura (Programa/Projeto/Atividade)
| Relatório | Dado-fonte | Onde aparece |
|---|---|---|
| Projetos por programa | `Project` agrupado por `programId` | Aba "Projetos" no detalhe do Programa |
| Pessoas atendidas por projeto | `ProjectEnrollment` ativo, por projeto | Resumo no detalhe do Projeto |
| Total de atividades por projeto | contagem de `ProjectAction` | Resumo no topo do Projeto |
| Total de encontros (realizados/agendados) por atividade/projeto | contagem de `ActionOccurrence`, filtrável por período/status | Detalhe da Atividade e do Projeto |

### 9.2 Relatórios de compliance (RMA/SISC)
- Export aproximado do formulário oficial: nº de grupos ativos por faixa etária, inseridos/desvinculados/lista de espera por grupo, carga horária semanal, encontros realizados no mês, público prioritário atendido.
- Não precisa integração direta com o sistema do governo — o valor está em entregar o relatório **pronto para digitar manualmente no SISC**, por período e por unidade.

### 9.3 Relatórios de gestão de casos (atendimento/encaminhamento/ocorrência)
| Relatório | Fonte | Uso |
|---|---|---|
| Atendimentos por tipo/profissional/período | `PersonServiceRecord` | Gestão de equipe técnica |
| Casos em aberto / encaminhamentos sem retorno | `status=OPEN` / `status≠RETURNED` + tempo decorrido | Gestão de risco — evita caso esquecido |
| Ocorrências por categoria e gravidade | `PersonOccurrence` | Identifica padrões por grupo/território |
| Encaminhamentos por rede de destino | `Referral` agrupado por `targetNetwork` | Mostra ao financiador/conselho a articulação com a rede |

### 9.4 Relatório individual (prontuário para impressão/auditoria)
- Timeline completa da seção 8, consolidada em um único documento por pessoa, com dados de identificação, matrículas, frequência, atendimentos, encaminhamentos e ocorrências.
- Uso: resposta a auditoria, solicitação do Conselho Tutelar/Ministério Público, ou transferência de caso para outra unidade/rede.
- Deve respeitar o controle de sigilo da seção 7: quem exporta só vê (e só consegue incluir no PDF) os registros confidenciais aos quais tem acesso.

### 9.5 Padrão de construção
- Todos reaproveitam a camada de visualização (`GraphView`) já usada em outros módulos — sem necessidade de biblioteca nova.
- Todos devem ser filtráveis por período, unidade/projeto e, quando aplicável, por profissional ou categoria.
- Nenhum exige infraestrutura de agregação nova: são consultas diretas sobre os models propostos.

## 10. Roadmap de implementação sugerido

| Fase | Entrega | Depende de |
|---|---|---|
| 1 | Schema `ActionOccurrence` + endpoints + geração em lote | nada |
| 2 | UI de Encontros (lista/calendário + agendamento) | Fase 1 |
| 3 | Migração de presença para nível de Encontro (2 deploys) | Fase 1 |
| 4 | Relabel "Ação"→"Atividade" na UI | paralelo, baixo risco |
| 5 | Models `PersonServiceRecord`, `Referral`, `PersonOccurrence` + regras de sigilo | paralelo às fases 1-4 |
| 6 | Aba "Atendimentos" (timeline 360°) | Fases 1, 3 e 5 |
| 7 | Regras SCFV: `ageBracket`, `priorityCriteria`, lista de espera, motivo de desligamento | pode começar já, independente |
| 8 | Relatórios de estrutura e compliance (seção 9.1-9.3) | Fases 1, 5 e 7 com dado real |
| 9 | Relatório individual consolidado (seção 9.4) | Fase 6 |

## 11. Decisões pendentes do usuário

- Papéis exatos que acessam registro confidencial (quem é "psicólogo"/"coordenação técnica" no modelo de permissões atual).
- Encaminhamento sempre nasce de um atendimento, ou pode ser direto?
- Ocorrência é sempre de uma pessoa específica, ou pode ser coletiva (do grupo, sem identificar um único atendido)?
- Override de profissional por encontro específico é necessário desde já, ou fica só herdado da atividade por enquanto?
- Onde ficam os relatórios cross-projeto: dentro de Projeto/Programa (como proposto) ou módulo "Relatórios" separado?
- Momento de implementação: tudo isso é "Parte 5 — Evolução de arquitetura" (pós go-live) ou entra à frente da Parte 4?