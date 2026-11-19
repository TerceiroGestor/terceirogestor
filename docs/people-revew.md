Auditoria do módulo people — Backend (NestJS + Prisma)

1. Arquivo principal: people.service.ts
backend/src/modules/people/people.service.ts tem 4140 linhas. people.controller.ts tem 992 linhas.

Métodos públicos principais (todos em people.service.ts, linha de assinatura indicada):

Person CRUD: create (964), findAll (978), findById (1021), update (1034), remove (3486)
Comentários/anexos genéricos: addComment (1065), deleteComment (1095), addAttachment (1106), deleteAttachment (1139)
"Record" (comentários/anexos/tags por sub-registro): getRecordMetadata (1158), addRecordComment (1196), deleteRecordComment (1235), addRecordAttachment (1263), deleteRecordAttachment (1305), setRecordTags (1333)
Documentos sensíveis: getSensitiveDocuments (1581), upsertSensitiveDocuments (1606)
Contatos: listContacts (1687), createContact (1696), updateContact (1743), removeContact (1809)
Financeiro: listIncomes/listFinancialEntries/listExpenses, createFinancialEntry (1839), updateFinancialEntry (1878), removeFinancialEntry (1959), createIncome (2014), updateIncome (2041), createExpense (2085), updateExpense (2111), removeExpense/removeIncome
Saúde: createHealthCondition (2182), updateHealthCondition (2214), removeHealthCondition (2254); createMedication (2280), updateMedication (2317), removeMedication (2368)
Educação: createEducation (2398), updateEducation (2445), removeEducation (2520)
Benefícios: createBenefit (2544), updateBenefit (2577), removeBenefit (2632)
Detenções: createDetention (2652), updateDetention (2677), removeDetention (2723)
Transferências/patrimônio (household): createTransfer/updateTransfer/removeTransfer, createHouseholdAsset/updateHouseholdAsset, createPersonAsset/updatePersonAsset, getHouseholdProfile/upsertHouseholdProfile (3101)
Resumos agregados: getFamilyIncomeSummary (3191), getFamilySummary (3371), getIdentity (3578)
Relações familiares: listRelations (3492), listRelationsTree (3693), createRelation (3789), updateRelation (3868), removeRelation (3953), syncInverseRelation (4093, privado)
Note que people.service.ts não contém nenhum método relacionado a PeopleGroup/PeopleSegment — isso é tratado por módulos separados (ver item 4).

1. Validações de negócio por sub-recurso
O padrão dominante é: DTO só valida tipo/presença (via class-validator), e o service aplica normalização de string/data, mas quase nenhuma regra de domínio. Exceções pontuais existem, e ajudam a evidenciar o contraste:

PersonHealthCondition (createHealthCondition, people.service.ts:2182-2212; updateHealthCondition:2214-2252): só normaliza strings e faz parseDateInput em diagnosisDate. Nenhuma checagem de que diagnosisDate não seja futura, nenhuma validação de severity contra uma lista fechada.
PersonMedication (createMedication:2280-2315; updateMedication:2317-2366): tem startDate/endDate mas não há checagem startDate <= endDate em nenhum dos dois métodos.
PersonDetention (createDetention:2652-2675; updateDetention:2677-2721): única regra real é "status não pode ser vazio" (2659-2661, 2694-2696). Sem validação de datas.
PersonBenefit, PersonFinancialEntry, PersonIncome, PersonExpense: createFinancialEntry (1839-1876) e updateFinancialEntry (1878-1957) passam dto.amount direto para o Prisma sem checar sinal; o DTO (create-person-financial-entry.dto.ts:18-21, create-person-income.dto.ts:8-10, create-person-expense.dto.ts:8-10, create-person-benefit.dto.ts:13-16) usa somente @IsNumber(), sem @Min(0) — é possível registrar renda/benefício/despesa com valor negativo.
Nenhum sub-recurso com startDate/endDate (financial-entry, benefit, detention, education, medication) valida que startDate <= endDate. Isso é uma lacuna sistemática, não um caso isolado.
parseDateInput (backend/src/core/utils/dates.ts:1-19) retorna undefined silenciosamente para strings de data inválidas (não lança erro). Como os DTOs de detention/benefit/financial-entry só exigem @IsString() (não @IsDateString() — ver item 6), uma data malformada passa a validação do DTO e depois é silenciosamente descartada (vira null/campo omitido), sem erro para o usuário.
Contraexemplo positivo (mostra que o padrão de qualidade é inconsistente, não ausente): createContact/updateContact (people.service.ts:1696-1807) têm regra de negócio real — exige nome quando role !== 'SELF' (1711-1713, 1769-1771) e garante exclusividade de contato primário por tipo dentro de uma transação (1729-1737, 1793-1799). Isso mostra que o padrão de validação "só tipo/presença" não é uma limitação técnica, mas uma escolha aplicada de forma desigual entre sub-recursos.
create() de Person (964-976) tem uma regra de negócio real: exige departureReason quando status === 'Desligado' (965-970) — mas é a única regra de negócio aplicada ao cadastro da pessoa em si; não há checagem de birthDate no futuro, nem de formato de CPF/RG (que de qualquer forma não são mais persistidos em texto puro — ver item 7).
CreatePersonContactDto.value (create-person-contact.dto.ts:10-11) é @IsString() puro mesmo quando type === 'EMAIL' — não há @ValidateIf/@IsEmail() condicional; o formato de e-mail/telefone não é validado no DTO (há normalização best-effort no service via normalizeEmailValue/normalizePhoneDigits, mas não é validação que rejeite entrada malformada).
3. Relações familiares — modelo PersonRelation
Modelo: PersonRelation (prisma/schema.prisma:831-851), com duas relações nomeadas para Person (PersonRelationPerson/PersonRelationRelated), chave única @@unique([tenantId, personId, relatedPersonId, type]).

A relação é mantida bidirecional automaticamente pelo backend, via syncInverseRelation (people.service.ts:4093-4139), chamada dentro da mesma transação em createRelation (3838) e updateRelation (3923). O tipo inverso é resolvido por resolveInverseType (751-823), uma função de mapeamento textual (ex.: "Pai"/"Mãe" → "Filho(a)"; "Filho(a)" → resolve dinamicamente "Pai"/"Mãe"/"Responsável" olhando sex/gender da outra pessoa em resolveParentTypeFromPerson, 728-740). removeRelation (3953-3983) também remove os dois lados (3963-3970).

Isso é bem implementado para os tipos de parentesco previstos na lista fixa GENEALOGY_RELATION_KEYS/mapeamento de resolveInverseType. Porém há uma fragilidade real:

O campo type em PersonRelation é string livre, não um enum (prisma/schema.prisma:836: type String), e o DTO (create-person-relation.dto.ts:7-8) também só exige @IsString(). Para qualquer type que não bata com os prefixos conhecidos (ex.: "Padrinho", "Tutor legal", "Vizinho"), resolveInverseType cai no return relation.type (linha 822) — ou seja, assume que a relação é simétrica por padrão. Isso está correto para tipos simétricos (ex. "Amigo"), mas produzirá inverso semanticamente errado para qualquer tipo assimétrico não cadastrado no mapa (ex.: se "Padrinho" não está na lista, B também seria marcado como "Padrinho" de A, quando deveria ser "Apadrinhado(a)").
updateRelation (3868-3951) tem uma lógica de "limpeza de duplicata" (3895-3908) que busca e deleta silenciosamente outra linha de PersonRelation com o mesmo par + novo tipo antes de salvar — é um código defensivo que sugere que o modelo já permitiu estados inconsistentes/duplicados no passado e foi remendado reativamente, em vez de ter a causa raiz endereçada (ex.: constraint ou lookup mais estrito na criação).
listRelationsTree (3693-3787) é a parte do código com melhor engenharia desse módulo: BFS com visited/frontier, maxDepth limitado a 4 (3701) e maxNodes = 200 (3702), evitando explosão em grafos cíclicos. É um contraste positivo em relação à ausência de validação em outros pontos.
4. PeopleGroup vs PeopleSegment no backend
Os dois modelos são estruturalmente quase idênticos no schema: PeopleGroup (schema.prisma:1237-1264) com groupType/purpose/category/ageMin/ageMax/isActive; PeopleSegment (1292-1313) com category/ageMin/ageMax/isActive (sem groupType/purpose). Ambos têm membership própria: PeopleGroupParticipation (1266-1290) e PeopleSegmentMembership (1315+).

Diferente do que o contexto da tarefa sugeria verificar, people.service.ts/people.controller.ts não lidam com nenhum dos dois — não há nenhuma ocorrência de PeopleGroup/PeopleSegment nesses dois arquivos (confirmado via grep). Cada um é um módulo Nest independente e espelhado:

backend/src/modules/people-groups/people-groups.controller.ts e .service.ts
backend/src/modules/people-segments/people-segments.controller.ts e .service.ts
Os dois controllers são estruturalmente idênticos (mesmas rotas GET /, GET /:id, POST /, PATCH /:id, DELETE /:id, GET /:id/{participations|memberships}, POST /:id/{participations|memberships}, PATCH /:id/.../:subId/end), usando as mesmas permissões (people.read/people.create/people.update/people.delete). Ambos estão registrados em src/app.module.ts:61-66 (PeopleModule, PeopleSegmentsModule, PeopleGroupsModule). Não há código morto de PeopleGroup no backend — ele é efetivamente usado por actions.service.ts e project-structure.service.ts via ProjectPeopleGroup/ActionPeopleGroup (ex.: backend/src/modules/project-structure/project-structure.service.ts:148-193, backend/src/modules/actions/actions.service.ts:1220-1267), isto é, PeopleGroup é o modelo que projetos/ações usam para vincular públicos-alvo, enquanto PeopleSegment não tem nenhum vínculo equivalente com projetos/ações no schema (nenhuma referência de PeopleSegment fora do próprio módulo).

Conclusão para o planejamento: a inconsistência real não é "módulo fantasma" no backend (ambos funcionam e estão testáveis via API), mas sim duplicação conceitual: dois modelos quase idênticos (PeopleGroup/PeopleSegment) resolvendo o mesmo problema de categorização de pessoas, um dos quais (PeopleGroup) ganhou integração com Projetos/Ações e o outro (PeopleSegment) ficou isolado e sem consumidor fora do próprio CRUD. Isso é exatamente o tipo de ambiguidade que vai gerar confusão quando o frontend for implementado — é preciso decidir se PeopleSegment será unificado com PeopleGroup ou se de fato são conceitos distintos (segmentação demográfica vs. Grupos operacional ligado a projeto), porque hoje nada no código documenta essa distinção.

1. Exclusão / soft-delete de Person
remove() (people.service.ts:3486-3490) faz hard delete puro:

async remove(tenantId: string, id: string) {
  await this.findById(tenantId, id);
  await this.prisma.person.delete({ where: { id } });
  return { deleted: true };
}
Exposto em DELETE /people/:id com @Permissions('people.delete') (people.controller.ts:967-975).

No schema.prisma, apenas 5 relações têm onDelete: Cascade na FK para Person: PersonComment (523), PersonAttachment (544), PersonRecordComment (565), PersonRecordAttachment (588), PersonRecordTag (607). Todas as demais (PersonContact, PersonAsset, PersonIncome, PersonFinancialEntry — e seus FKs de fromHouseholdId/toHouseholdId — PersonRelation (ambos os lados), PersonExpense, PersonBenefit, PersonDetention, PersonHealthCondition, PersonMedication, PersonEducation, PersonSensitiveDocument, PersonSensitiveAccessLog, HouseholdMember, PeopleGroupParticipation, PeopleSegmentMembership, ProjectEnrollment, ProjectActionPeopleParticipation) não especificam onDelete, o que no Postgres gerado pelo Prisma resulta em NO ACTION (equivalente a RESTRICT).

Isso significa que, na prática, DELETE /people/:id vai falhar com violação de FK (Prisma P2003) para qualquer pessoa que tenha pelo menos um registro em qualquer um desses ~16 sub-recursos — ou seja, praticamente qualquer pessoa cadastrada de verdade no sistema (uma pessoa sem nenhum contato, renda, relação familiar, documento sensível etc. é um caso raro). O endpoint de exclusão está, portanto, quebrado para o caso de uso real, e isso não é coberto por teste algum (ver item 8).

Não existe soft-delete via status para esse fluxo: embora Person.status (schema.prisma:447) aceite 'Desligado'/'Inativo' como valores de negócio (STATUS_OPTIONS, people.constants.ts:27-33), esse campo é tratado como um atributo de cadastro comum (preenchido manualmente pelo usuário via update()), não como mecanismo de exclusão lógica — não há nenhum método de serviço que faça "soft delete" setando status a partir do endpoint de remoção, nem qualquer filtro que exclua pessoas com um certo status das listagens (findAll, 978-1019, não filtra por status).

Isso é relevante para o planejamento do "direito ao esquecimento" (LGPD): hoje a modelagem não oferece nem cascade real nem soft-delete consistente — qualquer trabalho de LGPD vai precisar (a) decidir entre adicionar onDelete: Cascade nas ~16 relações restantes (cuidado: isso mudaria o comportamento de exclusão para algo irreversível em cascata) ou (b) implementar soft-delete de verdade com um fluxo de anonimização, porque hoje nenhuma das duas opções está implementada de ponta a ponta.

Achado secundário: deleteAttachment (people.service.ts:1139-1156) apaga apenas a linha no banco (this.prisma.personAttachment.delete), sem remover o arquivo físico em disco (filePath, validado para começar com /uploads/people/ em addAttachment:1120-1122) — gera arquivos órfãos em storage, o que também é relevante para expectativa de "apagar dados" sob LGPD.

1. DTOs (backend/src/modules/people/dto/)
A pasta tem 36 arquivos. Padrões inconsistentes encontrados:

Validação de data divergente entre sub-recursos: create-person-health-condition.dto.ts:16-17 e update-person-health-condition.dto.ts:16-17 usam @IsDateString() para diagnosisDate; create-person-education.dto.ts/update-person-education.dto.ts usam @IsDateString() para startDate/endDate; create-person-medication.dto.ts/update-person-medication.dto.ts usam @IsDateString(). Mas create-person-detention.dto.ts/update-person-detention.dto.ts, create-person-benefit.dto.ts/update-person-benefit.dto.ts e create-person-financial-entry.dto.ts/update-person-financial-entry.dto.ts usam apenas @IsString() para startDate/endDate — aceitando literalmente qualquer string, que depois (item 2) é silenciosamente descartada se não for data válida.
Valores monetários sem limite de sinal: create-person-income.dto.ts:7-9, create-person-expense.dto.ts:7-9, create-person-benefit.dto.ts:13-16, create-person-financial-entry.dto.ts:18-21 (e os respectivos update-*) usam @IsNumber() sem @Min(0) — nenhum valor monetário no módulo tem piso.
Campos "enum-like" tratados como string livre com fallback silencioso: frequency (ex.: create-person-income.dto.ts:11-12), entryType (create-person-financial-entry.dto.ts:6-7) são @IsString(), não @IsIn(...). No service, resolveIncomeFrequency (people.service.ts:832-840) e resolveFinancialEntryType (852-859) fazem fallback silencioso para um valor padrão ('MONTHLY', 'INCOME') quando o valor não corresponde a nenhum enum válido — ou seja, um typo do cliente ("mensal" em vez de "MONTHLY") não gera erro 400, é silenciosamente substituído, mascarando o problema de dados. Em contraste, Person.sex/gender/raceColor/status/personType em create-person.dto.ts/update-person.dto.ts usam @IsIn(SEX_OPTIONS) etc. (rejeitam valores fora da lista) — mostrando que o padrão "enum fechado com rejeição" existe no código, mas não foi aplicado aos sub-recursos financeiros/temporais.
CreatePersonAttachmentDto (create-person-attachment.dto.ts) é o DTO mais bem construído do diretório — tem @Transform(trimString), @MaxLength, @Min/@Max em fileSizeBytes (limite de 10MB) — bom contraste de qualidade frente aos DTOs financeiros/saúde.
UpsertPersonSensitiveDocumentsDto (upsert-person-sensitive-documents.dto.ts) trata cpf/rg/nis/cns como @IsString() puro, sem validação de formato/dígito verificador de CPF.
7. Permissões por sub-recurso (RBAC)
Confirmado via leitura de people.controller.ts: people.sensitive.read/people.sensitive.update são usados exclusivamente nos endpoints GET /people/:id/sensitive-documents (277) e PUT /people/:id/sensitive-documents (287) — que cobrem CPF/RG/NIS/CNS criptografados (PersonSensitiveDocument).

Porém PersonHealthCondition e PersonMedication — dados de saúde, categoria de dado sensível sob a LGPD (art. 5º, II) — usam as permissões genéricas people.read/people.update, não people.sensitive.*:

GET /people/:id/health-conditions → @Permissions('people.read') (people.controller.ts:480)
POST/PATCH/DELETE .../health-conditions... → @Permissions('people.update') (490, 501, 519)
GET /people/:id/medications → @Permissions('people.read') (531)
POST/PATCH/DELETE .../medications... → @Permissions('people.update') (541, 552, 565)
Isso significa que qualquer usuário com a permissão base people.read/people.update — que no sistema provavelmente é concedida de forma ampla a vários perfis operacionais — consegue ler/editar condições de saúde e medicações sem precisar de people.sensitive.read/people.sensitive.update. Isso é reforçado pelo fato de que o log de auditoria obrigatório (logSensitiveAccess, people.service.ts:1563-1579) só é chamado dentro de getSensitiveDocuments (1583) e upsertSensitiveDocuments (1669) — ou seja, acessar/editar condição de saúde ou medicação de uma pessoa não gera nenhum registro em PersonSensitiveAccessLog, apesar de ser dado de saúde. Isso é inconsistente com o próprio desenho do sistema (que já tem toda a infraestrutura de log de acesso sensível pronta) e é um ponto crítico a corrigir antes de qualquer feature nova nessa área, já que hoje o controle de acesso a dado de saúde é, na prática, igual ao de um campo comum do cadastro.

getIdentity (people.service.ts:3578, permissão people.identity.read em people.controller.ts:910) é bem desenhado: expõe apenas hasHealthCondition/hasMedication (booleanos) via _count, nunca o conteúdo da condição/medicação — não há leak de dado sensível nesse endpoint.

1. Testes existentes
people.service.spec.ts (31 linhas) e people.controller.spec.ts (28 linhas) contêm apenas o teste de scaffold padrão do Nest CLI (it('should be defined', ...)), com todas as dependências mockadas como {} as X. Não há nenhum teste de regra de negócio — nenhum teste cobre: exclusividade de contato primário, exigência de departureReason em "Desligado", sincronização bidirecional de PersonRelation, comportamento de remove() com FK restrict, validação (ou ausência dela) em datas/valores financeiros, ou permissões por sub-recurso. Isso significa que qualquer um dos problemas listados acima pode regressar silenciosamente em um refactor futuro, já que não há rede de segurança automatizada nesse módulo.

As duas varreduras terminaram. Isto é bem mais revelador do que eu esperava — tem bug real quebrando produção, não só desorganização. Resumo consolidado, por prioridade:

🔴 Bugs reais (corrigir antes de qualquer feature nova)

1. DELETE /people/:id está quebrado para qualquer pessoa com dado real. O remove() faz hard delete puro, mas ~16 das ~21 tabelas relacionadas (contatos, renda, despesas, benefícios, detenções, condições de saúde, medicações, relações familiares, documentos sensíveis...) não têm onDelete: Cascade no schema — só 5 têm (comentários/anexos genéricos). Excluir qualquer pessoa cadastrada de verdade vai estourar violação de FK. Sem teste nenhum cobrindo isso.

2. Condição de saúde e medicação furam o controle de dado sensível que o próprio sistema já tem pronto. PersonHealthCondition/PersonMedication usam as permissões genéricas people.read/people.update (deveriam usar people.sensitive.read/people.sensitive.update, como sensitive-documents já faz) e nunca chamam logSensitiveAccess — ou seja, acessar/editar dado de saúde de uma pessoa não gera nenhum registro de auditoria hoje, ao contrário de CPF/RG/NIS (que já foi fechado numa sessão anterior). É a mesma lacuna, só que não corrigida neste sub-recurso. O frontend espelha isso: sensitive-documents tem aviso de LGPD na tela, health-conditions/medications não têm nenhum.

🟡 Decisões de produto necessárias antes de planejar features (pra não ter que refazer depois)
3. PeopleGroup vs PeopleSegment — duplicação conceitual confirmada dos dois lados. No backend, os dois modelos são quase idênticos, mas só PeopleGroup é usado por Projetos/Ações (via ProjectPeopleGroup/ActionPeopleGroup); PeopleSegment não tem nenhum consumidor fora do próprio CRUD. No frontend, people-groups é literalmente um módulo fantasma (as rotas renderizam telas de people-segments). Isso não é um bug de código — é uma decisão de modelagem que ninguém tomou formalmente ainda. Precisa decidir: unificar os dois, ou definir claramente a diferença (segmentação demográfica vs. Grupos operacional ligado a projeto) antes de tocar em "relacionamentos" de pessoa.

1. O padrão de "relation" do people não segue o canônico documentado — e isso é sistemático, não pontual. As 5 relações de registro simples (detenções, educação, saúde, medicações, financeiro) estão todas dentro do detailSlot como abas feitas à mão, não no relationSlot/rodapé como o canonical-web-client-standard.md exige. Clicar numa linha abre uma rota separada fora do shell — o que o padrão chama explicitamente de proibido. É consistente entre si (um bom sinal), mas consistentemente fora do padrão. Continuar construindo features em cima disso sem decidir um rumo é exatamente o "muito trabalho depois" que você quer evitar.

2. Três pontas soltas pequenas, mas que valem decisão agora:

tree (árvore genealógica) é uma tela funcional sem nenhum link de entrada na UI — só acessível digitando a URL.
benefits não é uma feature de verdade — é um alias disfarçado que renderiza o painel financeiro.
Aba "Atendimentos" aparece sempre travada (disabled), sem tooltip explicando por quê.
Bônus: frontend/src/features/contacts (legado) parece código morto (zero importadores) e tem nome colidindo com people/features/contacts (que é o ativo, de verdade) — risco de confusão.
🟢 Dívida menor (dá pra arrumar de forma incremental, baixo risco)
Validação sistemicamente ausente: nenhum sub-recurso com data de início/fim valida início ≤ fim; nenhum valor monetário tem piso em zero; campos tipo-enum (frequency, entryType) aceitam qualquer string e fazem fallback silencioso em vez de rejeitar; tipo de vínculo familiar é texto livre (um valor desconhecido assume inverso simétrico, o que erra pra tipos assimétricos não mapeados). Zero teste de regra de negócio no módulo inteiro — só o scaffold padrão do Nest.

Dado isso, eu sugeriria essa ordem: 2 → 1 → 3 → 4, e os itens pequenos (5) e a dívida de validação (🟢) encaixados ao longo do caminho, já que não bloqueiam nada. Quer que eu comece por algum desses, ou prefere revisar com calma antes?
