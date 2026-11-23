"use strict";
// Fase 3 do seed de homologacao (Programas/Projetos/Atividades) - ver
// PLAN.md. Consome o `PeopleFase1Result` (grupos/ciclos, familiares por
// atendido, pools de equipe) em vez de IDs fixos, mesmo padrao das Fases
// 1 e 2. Escopo pedido pelo usuario: 5 Programas, media de 10 Projetos
// por Programa, media de 30 Atividades por Projeto, cobrindo servicos
// diversos (SCFV/assistencialismo, PAIF, PAEFI, Cultura, Esporte/Lazer).
//
// Fica de fora de proposito (fase seguinte): Meeting/"Encontro"
// (instancia concreta de uma Atividade numa data, com presenca) e tudo
// que depende dele (MeetingAttendance, MeetingTeamParticipation,
// ActionOccurrenceTeamGroup/ActionOccurrencePeopleGroup) - Fase 4.
// Comentarios/anexos (Program/Project/ProjectAction Comment/Attachment)
// tambem ficam de fora, mesmo padrao da Fase 1 pra Pessoas (recurso de
// uso manual, nao faz parte do cenario de dados).
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProgramsProjectsActivitiesFase3 = seedProgramsProjectsActivitiesFase3;
const faker_helpers_1 = require("./faker-helpers");
// Mesma ordem de `CYCLES` em people-fase1.ts - os 6 primeiros projetos do
// Programa SCFV mapeiam 1:1 pros 6 ciclos (publico/grupo ja existente da
// Fase 1), em vez de sortear atendidos de novo.
const CYCLE_KEYS = ['c1m', 'c2m', 'c3m', 'c1t', 'c2t', 'c3t'];
const PROGRAM_SPECS = [
    {
        key: 'SCFV',
        name: 'Servico de Convivencia e Fortalecimento de Vinculos',
        type: 'SCFV',
        description: 'Servico socioassistencial de convivencia em grupo, organizado por ciclo etario, com foco em fortalecimento de vinculos familiares e comunitarios.',
        projectNames: [
            'Convivencia Ciclo 1 - Manha',
            'Convivencia Ciclo 2 - Manha',
            'Convivencia Ciclo 3 - Manha',
            'Convivencia Ciclo 1 - Tarde',
            'Convivencia Ciclo 2 - Tarde',
            'Convivencia Ciclo 3 - Tarde',
            'Fortalecimento de Vinculos Familiares',
            'Grupo de Maes e Responsaveis',
            'Projeto Ferias na Instituicao',
            'Clube de Leitura e Convivencia',
        ],
        activityPool: [
            'Roda de conversa sobre direitos da crianca e do adolescente',
            'Dinamica de integracao e boas-vindas',
            'Oficina de brincadeiras e jogos cooperativos',
            'Atividade de leitura e contacao de historias',
            'Roda de musica e ritmos',
            'Oficina de reciclagem e sustentabilidade',
            'Dinamica sobre resolucao de conflitos',
            'Atividade de culinaria comunitaria',
            'Passeio ao parque/espaco cultural',
            'Oficina de desenho e pintura livre',
            'Roda de debate sobre bullying',
            'Atividade de horta comunitaria',
            'Dinamica de autoconhecimento',
            'Oficina de danca e expressao corporal',
            'Atividade recreativa de fim de semestre',
            'Roda de conversa com as familias',
            'Visita domiciliar de acompanhamento',
            'Oficina de jogos de tabuleiro',
            'Atividade de confraternizacao',
            'Dinamica sobre valores e cidadania',
            'Oficina de reaproveitamento de materiais',
            'Atividade esportiva recreativa',
            'Roda de conversa sobre identidade e pertencimento',
            'Encontro de avaliacao do semestre com educadores',
            'Atividade de fortalecimento de vinculos familiares',
        ],
        goalPool: [
            'Ampliar o acesso a convivencia comunitaria',
            'Fortalecer vinculos familiares e sociais',
            'Estimular o desenvolvimento socioeducativo de criancas e adolescentes',
            'Reduzir a evasao do servico',
        ],
        teamGroupKey: 'oficineiros',
    },
    {
        key: 'PAIF',
        name: 'Protecao e Atendimento Integral a Familia',
        type: 'PAIF',
        description: 'Servico de protecao social basica com acompanhamento as familias, encaminhamentos e fortalecimento da funcao protetiva.',
        projectNames: [
            'Acompanhamento Familiar PAIF',
            'Grupo de Orientacao a Familias',
            'Visitas Domiciliares',
            'Encaminhamento a Beneficios Sociais',
            'Grupo de Geracao de Renda',
            'Oficina de Economia Domestica',
            'Acolhimento de Familias em Vulnerabilidade',
            'Cadastro Unico e Beneficios',
            'Grupo de Apoio a Parentalidade',
            'Plantao Social',
        ],
        activityPool: [
            'Acolhimento inicial da familia',
            'Visita domiciliar de diagnostico socioeconomico',
            'Atualizacao de Cadastro Unico',
            'Encaminhamento para Bolsa Familia',
            'Grupo de orientacao sobre direitos socioassistenciais',
            'Oficina de economia domestica e orcamento familiar',
            'Reuniao de acompanhamento familiar',
            'Encaminhamento para rede de saude',
            'Grupo de geracao de renda e empreendedorismo',
            'Atendimento individual de triagem social',
            'Palestra sobre direitos da familia',
            'Visita domiciliar de monitoramento',
            'Grupo de apoio a parentalidade',
            'Articulacao com Conselho Tutelar',
            'Oficina sobre prevencao de violencia domestica',
            'Reuniao de rede de protecao social',
            'Atendimento psicossocial a responsaveis',
            'Grupo de convivencia de familias',
            'Encaminhamento para beneficios eventuais',
            'Avaliacao de vulnerabilidade social',
            'Oficina de qualificacao para o trabalho',
            'Plantao social de atendimento a comunidade',
            'Reuniao de devolutiva com a familia',
            'Atividade de fortalecimento da autonomia familiar',
            'Encontro de avaliacao de casos com a equipe tecnica',
        ],
        goalPool: [
            'Reduzir a vulnerabilidade social das familias atendidas',
            'Ampliar o acesso a beneficios e direitos socioassistenciais',
            'Fortalecer a funcao protetiva da familia',
            'Melhorar o acesso a rede de servicos publicos',
        ],
        teamGroupKey: 'funcionarios',
    },
    {
        key: 'PAEFI',
        name: 'Protecao e Atendimento Especializado a Familias e Individuos',
        type: 'PAEFI',
        description: 'Servico de protecao social especial para familias e individuos em situacao de violacao de direitos, com acompanhamento especializado.',
        projectNames: [
            'Acompanhamento Especializado PAEFI',
            'Atendimento a Familias em Situacao de Violacao de Direitos',
            'Grupo de Enfrentamento a Violencia',
            'Acompanhamento Pos-Violacao',
            'Articulacao com Rede de Protecao',
            'Grupo de Apoio Psicossocial',
            'Acompanhamento de Medidas Protetivas',
            'Orientacao Juridico-Social',
            'Grupo de Fortalecimento de Autonomia',
            'Plantao Psicossocial',
        ],
        activityPool: [
            'Atendimento especializado a familia em situacao de violacao de direitos',
            'Visita domiciliar de acompanhamento especializado',
            'Articulacao com o Conselho Tutelar',
            'Articulacao com a Vara da Infancia e Juventude',
            'Grupo de enfrentamento a violencia domestica',
            'Atendimento psicologico especializado',
            'Atendimento de servico social especializado',
            'Reuniao de rede de protecao especializada',
            'Elaboracao de Plano de Acompanhamento Individual/Familiar',
            'Grupo de apoio a familias em medida protetiva',
            'Oficina sobre direitos da crianca e do adolescente',
            'Encaminhamento para avaliacao psicologica externa',
            'Acompanhamento de caso pos-desligamento',
            'Reuniao de estudo de caso com a equipe tecnica',
            'Atendimento de orientacao juridico-social',
            'Visita domiciliar de verificacao de risco',
            'Grupo de fortalecimento da autonomia e autoestima',
            'Articulacao com delegacia especializada',
            'Atendimento a adolescente em medida protetiva',
            'Reuniao de devolutiva com familia acompanhada',
            'Oficina sobre prevencao ao abuso e exploracao',
            'Encontro de supervisao tecnica de casos',
            'Atendimento de acolhimento emergencial',
            'Reuniao de rede intersetorial',
            'Avaliacao de desfecho de caso acompanhado',
        ],
        goalPool: [
            'Garantir protecao a familias em situacao de violacao de direitos',
            'Reduzir a reincidencia de situacoes de violacao',
            'Fortalecer a autonomia e autoestima dos acompanhados',
            'Ampliar a articulacao com a rede de protecao',
        ],
        teamGroupKey: 'funcionarios',
    },
    {
        key: 'CULTURAL',
        name: 'Cultura e Arte',
        type: 'CULTURAL',
        description: 'Programa de oficinas e vivencias culturais - artes visuais, musica, danca e teatro - como ferramenta de expressao e formacao.',
        projectNames: [
            'Oficina de Teatro',
            'Oficina de Danca',
            'Oficina de Musica',
            'Coral Comunitario',
            'Oficina de Artes Visuais',
            'Grupo de Capoeira',
            'Oficina de Cinema e Audiovisual',
            'Sarau Comunitario',
            'Oficina de Grafite',
            'Festival Cultural Anual',
        ],
        activityPool: [
            'Oficina de teatro e expressao cenica',
            'Oficina de danca contemporanea',
            'Aula de musica e percussao',
            'Oficina de artes visuais e pintura',
            'Ensaio do coral comunitario',
            'Oficina de cinema e producao audiovisual',
            'Roda de capoeira',
            'Sarau de poesia e literatura',
            'Oficina de grafite e arte urbana',
            'Apresentacao cultural para a comunidade',
            'Oficina de confeccao de instrumentos musicais',
            'Visita a museu/espaco cultural',
            'Oficina de fotografia',
            'Festival cultural da instituicao',
            'Oficina de artesanato',
            'Aula de violao e canto',
            'Oficina de contacao de historias e teatro de bonecos',
            'Mostra de talentos culturais',
            'Oficina de hip hop e cultura urbana',
            'Ensaio para apresentacao de fim de ano',
            'Oficina de figurino e cenografia',
            'Roda de samba e musica popular brasileira',
            'Oficina de desenho e quadrinhos',
            'Producao de mural coletivo',
            'Encontro de avaliacao do projeto cultural com educadores',
        ],
        goalPool: [
            'Ampliar o acesso a bens e producoes culturais',
            'Estimular a expressao artistica e criativa',
            'Valorizar a cultura local e popular',
            'Formar novos talentos artisticos na comunidade',
        ],
        teamGroupKey: 'oficineiros',
    },
    {
        key: 'OTHER',
        name: 'Esporte e Lazer',
        type: 'OTHER',
        description: 'Programa de atividades esportivas e recreativas, voltado a promocao de habitos saudaveis, lazer e trabalho em equipe.',
        projectNames: [
            'Futebol de Campo',
            'Volei e Handebol',
            'Judo e Artes Marciais',
            'Natacao',
            'Xadrez e Jogos de Tabuleiro',
            'Recreacao e Jogos Cooperativos',
            'Passeios e Excursoes',
            'Colonia de Ferias',
            'Ginastica e Danca Fitness',
            'Torneio Esportivo Comunitario',
        ],
        activityPool: [
            'Treino de futebol de campo',
            'Aula de volei',
            'Aula de handebol',
            'Treino de judo',
            'Aula de natacao',
            'Torneio de xadrez',
            'Tarde de jogos cooperativos',
            'Passeio recreativo ao parque',
            'Excursao para colonia de ferias',
            'Gincana esportiva',
            'Aula de ginastica funcional',
            'Treino de atletismo',
            'Jogos de tabuleiro e recreacao',
            'Torneio interno de futsal',
            'Aula de danca fitness',
            'Atividade de alongamento e relaxamento',
            'Passeio ao clube/praca esportiva',
            'Torneio esportivo comunitario',
            'Aula de iniciacao ao basquete',
            'Atividade recreativa aquatica',
            'Gincana de ferias',
            'Roda de jogos populares',
            'Treino de capoeira esportiva',
            'Encontro esportivo intergrupos',
            'Encontro de avaliacao do projeto esportivo com a equipe',
        ],
        goalPool: [
            'Promover habitos saudaveis e pratica esportiva regular',
            'Ampliar o acesso a lazer e recreacao',
            'Estimular valores de trabalho em equipe e disciplina',
            'Identificar talentos esportivos na comunidade',
        ],
        teamGroupKey: 'voluntarios',
    },
];
const ACTIVITY_TITLE_SUFFIXES = [
    'Turma A',
    'Turma B',
    'Turma C',
    'Grupo 1',
    'Grupo 2',
    'Edicao 2024',
    'Edicao 2025',
    'Edicao 2026',
    '1o semestre',
    '2o semestre',
];
const FUNDING_NAMES = {
    MUNICIPAL: ['Prefeitura Municipal - Secretaria de Assistencia Social'],
    ESTADUAL: ['Governo do Estado - Secretaria de Desenvolvimento Social'],
    FEDERAL: ['Ministerio do Desenvolvimento e Assistencia Social'],
    TERCEIRO: [
        'Instituto Crescer',
        'Fundacao Horizonte',
        'Empresa Apoio Social Ltda',
        'Fundacao Vida Plena',
    ],
};
const ACTIVITY_TYPE_CATALOG = [
    { name: 'Atividade de Projeto', target: 'PROJECT' },
    { name: 'Oficina Tematica', target: 'PROJECT' },
    { name: 'Evento Comunitario', target: 'PROJECT' },
    { name: 'Capacitacao de Equipe', target: 'PROJECT' },
    { name: 'Reuniao de Rede/Articulacao', target: 'PROJECT' },
    { name: 'Atendimento em Grupo', target: 'PEOPLE_GROUP' },
    { name: 'Aula/Turma Regular', target: 'PEOPLE_GROUP' },
    { name: 'Passeio/Excursao', target: 'PEOPLE_GROUP' },
    { name: 'Visita Domiciliar', target: 'ENROLLMENT' },
    { name: 'Acompanhamento Individual', target: 'ENROLLMENT' },
];
const NOW = new Date();
const EARLIEST_PROGRAM_START = new Date(Date.UTC(2018, 0, 1));
const EARLIEST_PROJECT_START = new Date(Date.UTC(2022, 0, 1));
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function addDaysCapped(date, days, cap) {
    const result = addDays(date, days);
    return result.getTime() > cap.getTime() ? cap : result;
}
function dateBetween(from, to) {
    return to.getTime() > from.getTime() ? faker_helpers_1.faker.date.between({ from, to }) : from;
}
function jsonTags(tags) {
    return JSON.stringify(tags);
}
/** Mesmo helper duplicado nas Fases 1/2 - cada arquivo de fase fica independente. */
async function insertInChunks(items, chunkSize, insert) {
    for (let i = 0; i < items.length; i += chunkSize) {
        await insert(items.slice(i, i + chunkSize));
    }
}
function pickProjectStatus() {
    return (0, faker_helpers_1.pickWeighted)([
        { value: 'ACTIVE', weight: 65 },
        { value: 'PLANNED', weight: 15 },
        { value: 'CLOSED', weight: 20 },
    ]);
}
function projectWindow(programStart, status) {
    if (status === 'PLANNED') {
        const startsAt = addDays(NOW, faker_helpers_1.faker.number.int({ min: 10, max: 120 }));
        return { startsAt, endsAt: null };
    }
    const earliest = programStart.getTime() > EARLIEST_PROJECT_START.getTime()
        ? programStart
        : EARLIEST_PROJECT_START;
    if (status === 'CLOSED') {
        const startsAt = dateBetween(earliest, new Date(Date.UTC(2025, 0, 1)));
        const endsAt = dateBetween(addDays(startsAt, 90), NOW);
        return { startsAt, endsAt };
    }
    // ACTIVE
    const latestStart = addDays(NOW, -60);
    const startsAt = dateBetween(earliest, latestStart.getTime() > earliest.getTime() ? latestStart : earliest);
    return { startsAt, endsAt: null };
}
function pickActivityStatus(projectStatus) {
    if (projectStatus === 'PLANNED') {
        return (0, faker_helpers_1.chance)(0.9) ? 'PLANNED' : 'INACTIVE';
    }
    if (projectStatus === 'CLOSED') {
        return (0, faker_helpers_1.pickWeighted)([
            { value: 'EXECUTED', weight: 8 },
            { value: 'INACTIVE', weight: 2 },
        ]);
    }
    return (0, faker_helpers_1.pickWeighted)([
        { value: 'EXECUTED', weight: 55 },
        { value: 'PLANNED', weight: 30 },
        { value: 'INACTIVE', weight: 15 },
    ]);
}
function activityDates(window, status) {
    const windowEnd = window.endsAt ?? NOW;
    if (status === 'PLANNED') {
        const from = window.startsAt.getTime() > NOW.getTime() ? window.startsAt : NOW;
        const to = windowEnd.getTime() > from.getTime() ? windowEnd : addDays(from, 120);
        const plannedStartAt = dateBetween(from, to);
        return {
            plannedStartAt,
            plannedEndAt: addDays(plannedStartAt, faker_helpers_1.faker.number.int({ min: 7, max: 60 })),
            executedStartAt: null,
            executedEndAt: null,
            completionPercent: 0,
        };
    }
    const to = windowEnd.getTime() < NOW.getTime() ? windowEnd : NOW;
    if (status === 'EXECUTED') {
        const executedStartAt = dateBetween(window.startsAt, to);
        const executedEndAt = addDaysCapped(executedStartAt, faker_helpers_1.faker.number.int({ min: 7, max: 90 }), to);
        return {
            plannedStartAt: addDays(executedStartAt, -faker_helpers_1.faker.number.int({ min: 1, max: 10 })),
            plannedEndAt: executedEndAt,
            executedStartAt,
            executedEndAt,
            completionPercent: faker_helpers_1.faker.number.int({ min: 80, max: 100 }),
        };
    }
    // INACTIVE - planejada e descontinuada antes de concluir (parte delas
    // chegou a comecar, por isso executedStartAt as vezes preenchido sem
    // executedEndAt).
    const plannedStartAt = dateBetween(window.startsAt, to);
    const started = (0, faker_helpers_1.chance)(0.5);
    return {
        plannedStartAt,
        plannedEndAt: null,
        executedStartAt: started ? plannedStartAt : null,
        executedEndAt: null,
        completionPercent: started ? faker_helpers_1.faker.number.int({ min: 10, max: 60 }) : 0,
    };
}
/** Pools de equipe relevantes pro tema do programa - ver PLAN.md. */
function staffCandidatesFor(programKey, people) {
    const base = [
        ...people.funcionarios.map((id) => ({ personId: id, role: 'FUNCIONARIO' })),
        ...people.voluntarios.map((id) => ({ personId: id, role: 'VOLUNTARIO' })),
        ...people.oficineiros.map((id) => ({ personId: id, role: 'OFICINEIRO' })),
    ];
    if (programKey === 'PAIF' || programKey === 'PAEFI') {
        base.push(...people.assistentesSociais.map((id) => ({ personId: id, role: 'EQUIPE_TECNICA' })), ...people.psicologas.map((id) => ({ personId: id, role: 'EQUIPE_TECNICA' })));
    }
    if (programKey === 'CULTURAL' || programKey === 'OTHER') {
        base.push(...people.parceiros.map((id) => ({ personId: id, role: 'PARCEIRO' })), ...people.doadores.map((id) => ({ personId: id, role: 'DOADOR' })));
    }
    return base;
}
function actionRoleForStaffRole(role) {
    switch (role) {
        case 'FUNCIONARIO':
        case 'EQUIPE_TECNICA':
            return 'RESPONSAVEL_TECNICO';
        case 'VOLUNTARIO':
            return 'VOLUNTARIO';
        case 'OFICINEIRO':
            return 'FACILITADOR';
        case 'PARCEIRO':
        case 'DOADOR':
        case 'PATROCINADOR':
            return 'APOIO';
        default:
            return 'PARTICIPANTE';
    }
}
/** Grupo (Fase 1) a vincular como publico/participante do projeto, quando existir um natural pro tema. */
function participantGroupKeyFor(programKey, projectIndex) {
    if (programKey === 'SCFV' && projectIndex < CYCLE_KEYS.length) {
        return CYCLE_KEYS[projectIndex];
    }
    if ((programKey === 'PAIF' || programKey === 'PAEFI') && projectIndex % 2 === 0) {
        return 'familiares';
    }
    return null;
}
async function seedProgramsProjectsActivitiesFase3(prisma, tenantId, people) {
    // --- 1) Program -----------------------------------------------------
    const programRows = PROGRAM_SPECS.map((spec) => ({
        id: (0, faker_helpers_1.newId)(),
        spec,
        startsAt: faker_helpers_1.faker.date.between({ from: EARLIEST_PROGRAM_START, to: new Date(Date.UTC(2021, 11, 31)) }),
    }));
    await prisma.program.createMany({
        data: programRows.map((p) => ({
            id: p.id,
            tenantId,
            name: p.spec.name,
            type: p.spec.type,
            description: p.spec.description,
            tags: jsonTags([p.spec.key]),
            status: 'ACTIVE',
            startsAt: p.startsAt,
            endsAt: null,
        })),
    });
    const projectRows = [];
    for (const programRow of programRows) {
        programRow.spec.projectNames.forEach((name, index) => {
            const status = pickProjectStatus();
            const window = projectWindow(programRow.startsAt, status);
            projectRows.push({
                id: (0, faker_helpers_1.newId)(),
                programRow,
                index,
                name,
                status,
                startsAt: window.startsAt,
                endsAt: window.endsAt,
                atendidoEnrollmentIds: [],
                teamPersonIds: [],
                goalIds: [],
                participantGroupId: null,
                teamGroupId: people.groups[programRow.spec.teamGroupKey],
            });
        });
    }
    await insertInChunks(projectRows, 500, (chunk) => prisma.project.createMany({
        data: chunk.map((p) => ({
            id: p.id,
            tenantId,
            programId: p.programRow.id,
            name: p.name,
            description: `${p.programRow.spec.description} ${faker_helpers_1.faker.lorem.sentence()}`,
            tags: jsonTags([p.programRow.spec.key]),
            status: p.status,
            startsAt: p.startsAt,
            endsAt: p.endsAt,
        })),
    }));
    const fundingRows = [];
    for (const project of projectRows) {
        if (!(0, faker_helpers_1.chance)(0.4))
            continue;
        const source = (0, faker_helpers_1.pickWeighted)([
            { value: 'MUNICIPAL', weight: 40 },
            { value: 'ESTADUAL', weight: 25 },
            { value: 'FEDERAL', weight: 15 },
            { value: 'TERCEIRO', weight: 20 },
        ]);
        fundingRows.push({
            id: (0, faker_helpers_1.newId)(),
            tenantId,
            projectId: project.id,
            source,
            name: (0, faker_helpers_1.pick)(FUNDING_NAMES[source]),
            notes: null,
        });
    }
    await insertInChunks(fundingRows, 500, (chunk) => prisma.projectFundingSource.createMany({ data: chunk }));
    // --- 3) ProjectPeopleGroup -------------------------------------------
    const projectPeopleGroupRows = [];
    for (const project of projectRows) {
        projectPeopleGroupRows.push({
            id: (0, faker_helpers_1.newId)(),
            tenantId,
            projectId: project.id,
            peopleGroupId: project.teamGroupId,
            participationKind: 'TEAM',
        });
        const participantGroupKey = participantGroupKeyFor(project.programRow.spec.key, project.index);
        if (participantGroupKey) {
            project.participantGroupId = people.groups[participantGroupKey];
            projectPeopleGroupRows.push({
                id: (0, faker_helpers_1.newId)(),
                tenantId,
                projectId: project.id,
                peopleGroupId: project.participantGroupId,
                participationKind: 'PARTICIPANT',
            });
        }
    }
    await insertInChunks(projectPeopleGroupRows, 500, (chunk) => prisma.projectPeopleGroup.createMany({ data: chunk }));
    // --- 4) ProjectEnrollment (publico + equipe) --------------------------
    const enrollmentRows = [];
    const addEnrollment = (project, personId, role, participationKind, enrolledSet) => {
        if (enrolledSet.has(personId))
            return;
        enrolledSet.add(personId);
        const id = (0, faker_helpers_1.newId)();
        const status = (0, faker_helpers_1.chance)(0.85) ? 'ACTIVE' : 'ENDED';
        const endsAt = status === 'ENDED' ? dateBetween(project.startsAt, project.endsAt ?? NOW) : null;
        enrollmentRows.push({
            id,
            tenantId,
            projectId: project.id,
            personId,
            role,
            participationKind,
            status,
            startsAt: project.startsAt,
            endsAt,
        });
        if (role === 'PUBLICO_ATENDIDO')
            project.atendidoEnrollmentIds.push(id);
        if (participationKind === 'TEAM')
            project.teamPersonIds.push(personId);
    };
    for (const project of projectRows) {
        const enrolledSet = new Set();
        const isFamilyFocused = project.programRow.spec.key === 'PAIF' || project.programRow.spec.key === 'PAEFI';
        const cycleIndex = project.programRow.spec.key === 'SCFV' ? project.index : -1;
        const atendidoIds = cycleIndex >= 0 && cycleIndex < CYCLE_KEYS.length
            ? people.cycleAssignments[CYCLE_KEYS[cycleIndex]]
            : faker_helpers_1.faker.helpers.arrayElements(people.atendidosAtivos, faker_helpers_1.faker.number.int({ min: 10, max: 25 }));
        for (const atendidoId of atendidoIds) {
            addEnrollment(project, atendidoId, 'PUBLICO_ATENDIDO', 'PARTICIPANT', enrolledSet);
            const familiarChance = isFamilyFocused ? 0.5 : 0.3;
            const familiares = people.familiaresByAtendido[atendidoId] ?? [];
            if (familiares.length > 0 && (0, faker_helpers_1.chance)(familiarChance)) {
                addEnrollment(project, (0, faker_helpers_1.pick)(familiares), 'FAMILIAR', 'PARTICIPANT', enrolledSet);
            }
        }
        const staffPool = staffCandidatesFor(project.programRow.spec.key, people);
        const staffPicks = faker_helpers_1.faker.helpers.arrayElements(staffPool, faker_helpers_1.faker.number.int({ min: 2, max: 5 }));
        for (const staff of staffPicks) {
            addEnrollment(project, staff.personId, staff.role, 'TEAM', enrolledSet);
        }
    }
    await insertInChunks(enrollmentRows, 500, (chunk) => prisma.projectEnrollment.createMany({ data: chunk }));
    // --- 5) ProjectTeamParticipation (equipe hierarquica do projeto) ------
    const teamParticipationRows = [];
    const usedTeamActiveKeys = new Set();
    for (const project of projectRows) {
        for (const personId of project.teamPersonIds) {
            const staffEntry = staffCandidatesFor(project.programRow.spec.key, people).find((candidate) => candidate.personId === personId);
            const role = actionRoleForStaffRole(staffEntry?.role ?? 'FUNCIONARIO');
            const activeKey = `${project.id}:${personId}:${role}`;
            if (usedTeamActiveKeys.has(activeKey))
                continue;
            usedTeamActiveKeys.add(activeKey);
            teamParticipationRows.push({
                id: (0, faker_helpers_1.newId)(),
                tenantId,
                projectId: project.id,
                personId,
                role,
                activeKey,
                isActive: true,
                startsAt: project.startsAt,
            });
        }
    }
    await insertInChunks(teamParticipationRows, 500, (chunk) => prisma.projectTeamParticipation.createMany({ data: chunk }));
    // --- 6) Goal (2 por projeto) -------------------------------------------
    const goalRows = [];
    for (const project of projectRows) {
        const titles = faker_helpers_1.faker.helpers.arrayElements(project.programRow.spec.goalPool, 2);
        for (const title of titles) {
            const id = (0, faker_helpers_1.newId)();
            project.goalIds.push(id);
            goalRows.push({
                id,
                tenantId,
                projectId: project.id,
                title,
                description: null,
            });
        }
    }
    await insertInChunks(goalRows, 500, (chunk) => prisma.goal.createMany({ data: chunk }));
    // --- 7) ActivityType (catalogo fixo, compartilhado pelo tenant) -------
    const activityTypeRows = ACTIVITY_TYPE_CATALOG.map((spec) => ({ id: (0, faker_helpers_1.newId)(), spec }));
    await prisma.activityType.createMany({
        data: activityTypeRows.map((t) => ({
            id: t.id,
            tenantId,
            name: t.spec.name,
            target: t.spec.target,
            isActive: true,
        })),
    });
    const typesByTarget = (target) => activityTypeRows.filter((t) => t.spec.target === target);
    const activityRows = [];
    const pendingPeopleGroupLinks = [];
    for (const project of projectRows) {
        const count = faker_helpers_1.faker.number.int({ min: 25, max: 35 });
        for (let i = 0; i < count; i += 1) {
            const targetCategory = (0, faker_helpers_1.pickWeighted)([
                { value: 'PROJECT', weight: 50 },
                { value: 'PEOPLE_GROUP', weight: 30 },
                { value: 'ENROLLMENT', weight: 20 },
            ]);
            const activityType = (0, faker_helpers_1.pick)(typesByTarget(targetCategory));
            const status = pickActivityStatus(project.status);
            const dates = activityDates({ startsAt: project.startsAt, endsAt: project.endsAt }, status);
            const titleBase = (0, faker_helpers_1.pick)(project.programRow.spec.activityPool);
            const title = (0, faker_helpers_1.chance)(0.6)
                ? `${titleBase} - ${(0, faker_helpers_1.pick)(ACTIVITY_TITLE_SUFFIXES)}`
                : titleBase;
            const id = (0, faker_helpers_1.newId)();
            let targetEnrollmentId = null;
            if (targetCategory === 'ENROLLMENT' && project.atendidoEnrollmentIds.length > 0) {
                targetEnrollmentId = (0, faker_helpers_1.pick)(project.atendidoEnrollmentIds);
            }
            if (targetCategory === 'PEOPLE_GROUP') {
                const peopleGroupId = project.participantGroupId ?? project.teamGroupId;
                pendingPeopleGroupLinks.push({ activityId: id, peopleGroupId });
            }
            activityRows.push({
                id,
                projectId: project.id,
                actionTypeId: activityType.id,
                goalId: (0, faker_helpers_1.chance)(0.5) ? (0, faker_helpers_1.pick)(project.goalIds) : null,
                targetEnrollmentId,
                title,
                status,
                dates,
                project,
            });
        }
    }
    await insertInChunks(activityRows, 500, (chunk) => prisma.activity.createMany({
        data: chunk.map((a) => ({
            id: a.id,
            tenantId,
            projectId: a.projectId,
            targetEnrollmentId: a.targetEnrollmentId,
            actionTypeId: a.actionTypeId,
            goalId: a.goalId,
            title: a.title,
            description: `${(0, faker_helpers_1.pick)(a.project.programRow.spec.activityPool)}. ${faker_helpers_1.faker.lorem.sentence()}`,
            tags: jsonTags([a.project.programRow.spec.key]),
            status: a.status,
            plannedStartAt: a.dates.plannedStartAt,
            plannedEndAt: a.dates.plannedEndAt,
            executedStartAt: a.dates.executedStartAt,
            executedEndAt: a.dates.executedEndAt,
            completionPercent: a.dates.completionPercent,
        })),
    }));
    // --- 9) ActivityPeopleGroup (satisfaz target=PEOPLE_GROUP) -------------
    await insertInChunks(pendingPeopleGroupLinks, 500, (chunk) => prisma.activityPeopleGroup.createMany({
        data: chunk.map((link) => ({
            id: (0, faker_helpers_1.newId)(),
            tenantId,
            actionId: link.activityId,
            peopleGroupId: link.peopleGroupId,
            participationKind: 'PARTICIPANT',
        })),
    }));
    // --- 10) ProjectActionPeopleParticipation (equipe por atividade) -------
    const actionPeopleRows = [];
    const usedActionActiveKeys = new Set();
    for (const activity of activityRows) {
        if (activity.project.teamPersonIds.length === 0)
            continue;
        const picks = faker_helpers_1.faker.helpers.arrayElements(activity.project.teamPersonIds, Math.min(activity.project.teamPersonIds.length, faker_helpers_1.faker.number.int({ min: 1, max: 2 })));
        for (const personId of picks) {
            const staffEntry = staffCandidatesFor(activity.project.programRow.spec.key, people).find((candidate) => candidate.personId === personId);
            const role = actionRoleForStaffRole(staffEntry?.role ?? 'FUNCIONARIO');
            const activeKey = `${activity.id}:${personId}:${role}`;
            if (usedActionActiveKeys.has(activeKey))
                continue;
            usedActionActiveKeys.add(activeKey);
            actionPeopleRows.push({
                id: (0, faker_helpers_1.newId)(),
                tenantId,
                actionId: activity.id,
                personId,
                participationKind: 'TEAM',
                role,
                activeKey,
                isActive: true,
                startsAt: activity.dates.plannedStartAt ?? activity.project.startsAt,
            });
        }
    }
    await insertInChunks(actionPeopleRows, 500, (chunk) => prisma.projectActionPeopleParticipation.createMany({ data: chunk }));
    return {
        programs: programRows.length,
        projects: projectRows.length,
        activities: activityRows.length,
        enrollments: enrollmentRows.length,
        teamParticipations: teamParticipationRows.length,
        goals: goalRows.length,
    };
}
//# sourceMappingURL=programs-projects-activities-fase3.js.map