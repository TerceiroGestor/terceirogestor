"use strict";
// Fase 2 do seed de homologacao (Atendimentos/Ocorrencias) - ver PLAN.md.
// Consome o `PeopleFase1Result` (atendidos ativos, familiares vinculados
// por atendido, profissionais) em vez de IDs fixos - mesmo padrao da
// Fase 1. Escopo pedido pelo usuario: historico de 3 anos (2024, 2025,
// 2026) com pelo menos ~15 Attendance ("atendimentos") por ano por
// atendido ativo cadastrado (120 atendidos) + Occurrence ("ocorrencias")
// esporadicas, parte delas gerando um Attendance de acompanhamento.
//
// Fica de fora de proposito (fora do escopo pedido, que fixou "120
// atendidos"): atendidos desligados/em espera, Meeting (meetingId sempre
// null aqui - Fase 4 ainda nao existe).
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAttendancesOccurrencesFase2 = seedAttendancesOccurrencesFase2;
const faker_helpers_1 = require("./faker-helpers");
const YEARS = [2024, 2025, 2026];
const OCCURRENCE_TITLES = [
    { title: 'Conflito entre atendidos durante atividade', description: 'Desentendimento registrado entre atendidos durante atividade em grupo.' },
    { title: 'Falta recorrente sem justificativa', description: 'Atendido acumulou faltas consecutivas sem justificativa da familia.' },
    { title: 'Comportamento agressivo em sala', description: 'Educador relatou comportamento agressivo do atendido durante a atividade.' },
    { title: 'Situacao de vulnerabilidade identificada', description: 'Equipe tecnica identificou indicios de vulnerabilidade social na familia.' },
    { title: 'Reclamacao da familia sobre atividade', description: 'Familiar registrou reclamacao sobre a condução de uma atividade.' },
    { title: 'Acidente leve durante oficina', description: 'Atendido sofreu um acidente leve durante oficina, sem necessidade de socorro externo.' },
    { title: 'Uso inadequado de equipamento', description: 'Atendido fez uso inadequado de equipamento/material da instituicao.' },
    { title: 'Desentendimento com educador', description: 'Registrado desentendimento entre atendido e educador responsavel.' },
    { title: 'Suspeita de negligencia familiar', description: 'Equipe tecnica relatou suspeita de negligencia no cuidado do atendido.' },
    { title: 'Agravamento de condicao de saude', description: 'Atendido apresentou agravamento de condicao de saude durante o periodo na instituicao.' },
];
const OUTCOME_NOTES = [
    'Situacao resolvida apos orientacao a familia e acompanhamento da equipe tecnica.',
    'Caso encaminhado para abertura de atendimento social continuado.',
    'Caso encaminhado para abertura de atendimento psicologico continuado.',
    'Resolvido internamente, sem necessidade de encaminhamento externo.',
    'Encaminhado a rede de protecao/saude do territorio.',
];
const ATTENDANCE_NOTES_BY_TYPE = {
    SOCIAL: [
        'Acompanhamento familiar devido a mudanca na renda do nucleo.',
        'Encaminhamento para avaliacao de beneficio social.',
        'Situacao de vulnerabilidade identificada no territorio.',
        'Dificuldade de acesso a servicos publicos relatada pela familia.',
        'Acompanhamento de frequencia e permanencia no servico.',
        'Visita domiciliar solicitada pela equipe tecnica.',
    ],
    PSICOLOGICO: [
        'Dificuldade de socializacao relatada pela educadora.',
        'Episodio de ansiedade observado durante atividade em grupo.',
        'Acompanhamento psicologico solicitado pela familia.',
        'Mudanca de comportamento observada apos evento familiar.',
        'Avaliacao psicologica de rotina do ciclo.',
        'Relato de dificuldade de concentracao em sala.',
    ],
};
const CLOSING_NOTES = [
    'Encerrado apos evolucao positiva, sem necessidade de continuidade imediata.',
    'Encerrado por mudanca de endereco/afastamento do servico.',
    'Encerrado com encaminhamento a rede de saude.',
    'Encerrado apos resolucao da situacao apresentada.',
    'Encerrado a pedido da familia, situacao estabilizada.',
];
const EVOLUTION_NOTES = [
    'Atendido compareceu, relatou melhora na rotina familiar.',
    'Familia compareceu junto, reforcada orientacao sobre direitos.',
    'Observado avanco no comportamento em sala apos intervencao.',
    'Agendado retorno para acompanhamento em 30 dias.',
    'Relato de dificuldade persistente, mantido acompanhamento.',
    'Realizada escuta individual, sem intercorrencias.',
    'Contato telefonico com a familia para alinhamento de encaminhamentos.',
];
const BENEFIT_NAMES = [
    'Cesta basica',
    'Kit de higiene',
    'Vale transporte',
    'Agasalho',
    'Material escolar',
];
function yearRange(year, now) {
    const from = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    const to = yearEnd.getTime() > now.getTime() ? now : yearEnd;
    return { from, to };
}
function daysBetween(from, to) {
    return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}
function addDaysCapped(date, days, cap) {
    const result = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    return result.getTime() > cap.getTime() ? cap : result;
}
function pickOccurrenceStatus(ageDays) {
    if (ageDays > 45) {
        return (0, faker_helpers_1.pickWeighted)([
            { value: 'DESFECHO_DEFINIDO', weight: 9 },
            { value: 'EM_ANALISE', weight: 1 },
        ]);
    }
    if (ageDays > 10) {
        return (0, faker_helpers_1.pickWeighted)([
            { value: 'EM_ANALISE', weight: 6 },
            { value: 'DESFECHO_DEFINIDO', weight: 3 },
            { value: 'REGISTRADA', weight: 1 },
        ]);
    }
    return (0, faker_helpers_1.pickWeighted)([
        { value: 'REGISTRADA', weight: 6 },
        { value: 'EM_ANALISE', weight: 4 },
    ]);
}
function pickAttendanceType() {
    return (0, faker_helpers_1.pickWeighted)([
        { value: 'SOCIAL', weight: 65 },
        { value: 'PSICOLOGICO', weight: 35 },
    ]);
}
function professionalFor(type, people) {
    return type === 'SOCIAL' ? (0, faker_helpers_1.pick)(people.assistentesSociais) : (0, faker_helpers_1.pick)(people.psicologas);
}
/**
 * Mesmo padrao de `insertInChunks` da Fase 1 (`people-fase1.ts`) -
 * duplicado aqui de proposito, cada arquivo de fase do seed fica
 * independente (ver comentario sobre `pii-crypto-for-seed.ts` no
 * PLAN.md a respeito do build de `prisma/seed.ts`).
 */
async function insertInChunks(items, chunkSize, insert) {
    for (let i = 0; i < items.length; i += chunkSize) {
        await insert(items.slice(i, i + chunkSize));
    }
}
const REFERRAL_DESTINATIONS = [
    {
        name: 'CRAS Vila Nova',
        contactInfo: '(11) 4000-1001',
        responsibleName: 'Coordenacao CRAS Vila Nova',
        address: 'Rua das Acacias, 120 - Vila Nova',
    },
    {
        name: 'CREAS Centro',
        contactInfo: '(11) 4000-1002',
        responsibleName: 'Coordenacao CREAS Centro',
        address: 'Av. Central, 450 - Centro',
    },
    {
        name: 'Hospital Municipal',
        contactInfo: '(11) 4000-1003',
        responsibleName: 'Servico Social Hospitalar',
        address: 'Av. da Saude, 800 - Centro',
    },
    {
        name: 'Conselho Tutelar',
        contactInfo: '(11) 4000-1004',
        responsibleName: 'Conselheiro de turno',
        address: 'Rua da Justica, 55 - Centro',
    },
    {
        name: 'Escola Municipal Jardim das Flores',
        contactInfo: '(11) 4000-1005',
        responsibleName: 'Direcao Escolar',
        address: 'Rua das Flores, 300 - Jardim das Flores',
    },
];
async function seedAttendancesOccurrencesFase2(prisma, tenantId, people) {
    const now = new Date();
    // --- 1) Occurrence + OccurrencePeople ---------------------------------
    // ~25% de chance por atendido/ano - nao todo atendido tem uma ocorrencia
    // todo ano, mas o volume agregado (120 atendidos x 3 anos) ainda cobre
    // uma boa variedade de status/desfechos.
    const occurrencePlans = [];
    for (const atendidoId of people.atendidosAtivos) {
        for (const year of YEARS) {
            if (!(0, faker_helpers_1.chance)(0.25))
                continue;
            const { from, to } = yearRange(year, now);
            if (from.getTime() > to.getTime())
                continue;
            const createdAt = faker_helpers_1.faker.date.between({ from, to });
            const ageDays = daysBetween(createdAt, now);
            const status = pickOccurrenceStatus(ageDays);
            const entry = (0, faker_helpers_1.pick)(OCCURRENCE_TITLES);
            const witnessPool = [
                ...(people.familiaresByAtendido[atendidoId] ?? []),
                ...people.funcionarios,
            ];
            const updatedAt = status === 'REGISTRADA'
                ? createdAt
                : addDaysCapped(createdAt, faker_helpers_1.faker.number.int({ min: 2, max: 25 }), now);
            occurrencePlans.push({
                id: (0, faker_helpers_1.newId)(),
                atendidoId,
                createdAt,
                updatedAt,
                status,
                title: entry.title,
                description: `${entry.description} ${faker_helpers_1.faker.lorem.sentence()}`,
                outcomeNotes: status === 'DESFECHO_DEFINIDO' ? (0, faker_helpers_1.pick)(OUTCOME_NOTES) : null,
                witnessId: witnessPool.length > 0 && (0, faker_helpers_1.chance)(0.3) ? (0, faker_helpers_1.pick)(witnessPool) : null,
            });
        }
    }
    await insertInChunks(occurrencePlans, 500, (chunk) => prisma.occurrence.createMany({
        data: chunk.map((o) => ({
            id: o.id,
            tenantId,
            title: o.title,
            description: o.description,
            status: o.status,
            outcomeNotes: o.outcomeNotes,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        })),
    }));
    const occurrencePeopleRows = [];
    for (const o of occurrencePlans) {
        occurrencePeopleRows.push({
            id: (0, faker_helpers_1.newId)(),
            tenantId,
            occurrenceId: o.id,
            personId: o.atendidoId,
            role: 'ENVOLVIDO',
            createdAt: o.createdAt,
        });
        if (o.witnessId) {
            occurrencePeopleRows.push({
                id: (0, faker_helpers_1.newId)(),
                tenantId,
                occurrenceId: o.id,
                personId: o.witnessId,
                role: 'TESTEMUNHA',
                createdAt: o.createdAt,
            });
        }
    }
    await insertInChunks(occurrencePeopleRows, 500, (chunk) => prisma.occurrencePeople.createMany({ data: chunk }));
    // --- 2) Attendance -----------------------------------------------------
    // Base: ~15 atendimentos/ano/atendido (pedido do usuario). Extra: parte
    // das Occurrence acima (40%) gera um Attendance de acompanhamento
    // vinculado (`occurrenceId`), poucos dias depois do registro.
    const attendancePlans = [];
    const buildAttendance = (atendidoId, scheduledDate, occurrenceId) => {
        const type = pickAttendanceType();
        const professionalId = professionalFor(type, people);
        const ageDays = daysBetween(scheduledDate, now);
        const status = ageDays > 21 ? 'ENCERRADO' : (0, faker_helpers_1.chance)(0.5) ? 'ENCERRADO' : 'ABERTO';
        const createdAt = scheduledDate;
        const updatedAt = status === 'ENCERRADO'
            ? addDaysCapped(scheduledDate, faker_helpers_1.faker.number.int({ min: 1, max: 14 }), now)
            : scheduledDate;
        return {
            id: (0, faker_helpers_1.newId)(),
            atendidoId,
            occurrenceId,
            type,
            professionalId,
            scheduledDate,
            status,
            notes: (0, faker_helpers_1.pick)(ATTENDANCE_NOTES_BY_TYPE[type]),
            closingNotes: status === 'ENCERRADO' ? (0, faker_helpers_1.pick)(CLOSING_NOTES) : null,
            createdAt,
            updatedAt,
        };
    };
    for (const atendidoId of people.atendidosAtivos) {
        for (const year of YEARS) {
            const { from, to } = yearRange(year, now);
            if (from.getTime() > to.getTime())
                continue;
            const count = faker_helpers_1.faker.number.int({ min: 13, max: 18 });
            for (let i = 0; i < count; i += 1) {
                const scheduledDate = faker_helpers_1.faker.date.between({ from, to });
                attendancePlans.push(buildAttendance(atendidoId, scheduledDate, null));
            }
        }
    }
    for (const o of occurrencePlans) {
        if (!(0, faker_helpers_1.chance)(0.4))
            continue;
        const followUpDate = addDaysCapped(o.createdAt, faker_helpers_1.faker.number.int({ min: 1, max: 10 }), now);
        attendancePlans.push(buildAttendance(o.atendidoId, followUpDate, o.id));
    }
    await insertInChunks(attendancePlans, 500, (chunk) => prisma.attendance.createMany({
        data: chunk.map((a) => ({
            id: a.id,
            tenantId,
            occurrenceId: a.occurrenceId,
            type: a.type,
            scheduledDate: a.scheduledDate,
            professionalId: a.professionalId,
            status: a.status,
            notes: a.notes,
            closingNotes: a.closingNotes,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        })),
    }));
    // --- 3) AttendancePeople ------------------------------------------------
    const attendancePeopleRows = [];
    const addAttendancePerson = (attendanceId, personId, role, createdAt) => {
        attendancePeopleRows.push({ id: (0, faker_helpers_1.newId)(), tenantId, attendanceId, personId, role, createdAt });
    };
    for (const a of attendancePlans) {
        addAttendancePerson(a.id, a.atendidoId, 'ATENDIDO_PRINCIPAL', a.createdAt);
        const familiares = people.familiaresByAtendido[a.atendidoId] ?? [];
        if (familiares.length > 0 && (0, faker_helpers_1.chance)(0.4)) {
            addAttendancePerson(a.id, (0, faker_helpers_1.pick)(familiares), 'FAMILIAR', a.createdAt);
        }
        const siblings = people.householdSiblingsByAtendido[a.atendidoId] ?? [];
        if (siblings.length > 0 && (0, faker_helpers_1.chance)(0.08)) {
            addAttendancePerson(a.id, (0, faker_helpers_1.pick)(siblings), 'ATENDIDO_SECUNDARIO', a.createdAt);
        }
    }
    await insertInChunks(attendancePeopleRows, 500, (chunk) => prisma.attendancePeople.createMany({ data: chunk }));
    // --- 4) AttendanceEvolution ----------------------------------------------
    // Captura o(s) id(s) de evolucao gerados por atendimento - Beneficio e
    // (futuramente) Encaminhamento vinculam na Evolucao, nao mais direto no
    // Attendance (revisao de arquitetura de 2026-11-25, ver PLAN.md).
    const evolutionRows = [];
    const evolutionIdsByAttendance = new Map();
    for (const a of attendancePlans) {
        const windowEnd = a.status === 'ENCERRADO' ? a.updatedAt : now;
        const evolutionCount = faker_helpers_1.faker.number.int({ min: 1, max: 3 });
        const ids = [];
        for (let i = 0; i < evolutionCount; i += 1) {
            const date = windowEnd.getTime() > a.scheduledDate.getTime()
                ? faker_helpers_1.faker.date.between({ from: a.scheduledDate, to: windowEnd })
                : a.scheduledDate;
            const id = (0, faker_helpers_1.newId)();
            ids.push(id);
            evolutionRows.push({
                id,
                tenantId,
                attendanceId: a.id,
                date,
                notes: (0, faker_helpers_1.pick)(EVOLUTION_NOTES),
                createdAt: date,
                updatedAt: date,
            });
        }
        evolutionIdsByAttendance.set(a.id, ids);
    }
    await insertInChunks(evolutionRows, 500, (chunk) => prisma.attendanceEvolution.createMany({ data: chunk }));
    // --- 5) AttendanceBenefit -------------------------------------------------
    // Vinculado a uma Evolucao especifica (nao mais direto ao Attendance) -
    // attendanceId fica denormalizado, derivado da propria evolucao escolhida.
    const benefitRows = [];
    for (const a of attendancePlans) {
        if (!(0, faker_helpers_1.chance)(0.12))
            continue;
        const evolutionIds = evolutionIdsByAttendance.get(a.id) ?? [];
        if (!evolutionIds.length)
            continue;
        const evolutionId = (0, faker_helpers_1.pick)(evolutionIds);
        const windowEnd = a.status === 'ENCERRADO' ? a.updatedAt : now;
        const date = windowEnd.getTime() > a.scheduledDate.getTime()
            ? faker_helpers_1.faker.date.between({ from: a.scheduledDate, to: windowEnd })
            : a.scheduledDate;
        benefitRows.push({
            id: (0, faker_helpers_1.newId)(),
            tenantId,
            attendanceId: a.id,
            evolutionId,
            name: (0, faker_helpers_1.pick)(BENEFIT_NAMES),
            date,
            quantity: faker_helpers_1.faker.number.int({ min: 1, max: 3 }),
            notes: null,
            createdAt: date,
            updatedAt: date,
        });
    }
    await insertInChunks(benefitRows, 500, (chunk) => prisma.attendanceBenefit.createMany({ data: chunk }));
    // --- 6) ReferralDestination ------------------------------------------------
    // Cadastro de rede de destino (Fase 7, revisao de 2026-11-25) - catalogo
    // fixo de exemplo, independente de attendancePlans.
    const referralDestinationRows = REFERRAL_DESTINATIONS.map((destination) => ({
        id: (0, faker_helpers_1.newId)(),
        tenantId,
        name: destination.name,
        contactInfo: destination.contactInfo,
        responsibleName: destination.responsibleName,
        address: destination.address,
        isActive: true,
    }));
    await prisma.referralDestination.createMany({ data: referralDestinationRows });
    return {
        occurrences: occurrencePlans.length,
        attendances: attendancePlans.length,
        evolutions: evolutionRows.length,
        benefits: benefitRows.length,
        referralDestinations: referralDestinationRows.length,
    };
}
//# sourceMappingURL=attendances-occurrences-fase2.js.map