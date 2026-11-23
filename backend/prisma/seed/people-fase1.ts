// Fase 1 do seed de homologacao (Pessoas) - ver PLAN.md. Gera um cenario
// grande e aleatorio (pelo Faker, `faker-helpers.ts`) em vez de dados
// fixos - escopo: Person + 7 sub-entidades (contato, endereco/household,
// documentos sensiveis criptografados, financeiro, saude, medicacao,
// escolaridade, reclusao), vinculos familiares e os grupos/ciclos.
//
// Fases seguintes (Atendimentos/Ocorrencias, Programas/Projetos/
// Atividades, Encontros) consomem o `PeopleFase1Result` devolvido daqui
// em vez de IDs fixos - cada rodada faz o seed inteiro do zero
// (`wipeDatabase()` em seed.ts), entao nao ha problema de dados antigos
// sobrarem.

import type {
  Prisma,
  PersonFinancialEntryType,
  PrismaClient,
} from '../../src/generated/prisma';
import {
  deriveTenantKey,
  encryptJson,
  parseMasterKey,
} from './pii-crypto-for-seed';
import {
  chance,
  faker,
  newId,
  pick,
  pickWeighted,
  randomAddress,
  randomCnsDigits,
  randomCpfDigits,
  randomNisDigits,
  randomPhone,
  randomRg,
} from './faker-helpers';

const SEX_OPTIONS = ['Masculino', 'Feminino'] as const;
const GENDER_BY_SEX: Record<string, string> = {
  Masculino: 'Homem',
  Feminino: 'Mulher',
};
const RACE_COLOR_OPTIONS = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indigena'];
const MARITAL_STATUS_OPTIONS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viuvo(a)',
];

const CYCLES = [
  { key: 'c1m', name: 'C1M', description: 'Ciclo 1 da manha.', ageMin: 6, ageMax: 8 },
  { key: 'c2m', name: 'C2M', description: 'Ciclo 2 da manha.', ageMin: 9, ageMax: 11 },
  { key: 'c3m', name: 'C3M', description: 'Ciclo 3 da manha.', ageMin: 12, ageMax: 14 },
  { key: 'c1t', name: 'C1T', description: 'Ciclo 1 da tarde.', ageMin: 6, ageMax: 8 },
  { key: 'c2t', name: 'C2T', description: 'Ciclo 2 da tarde.', ageMin: 9, ageMax: 11 },
  { key: 'c3t', name: 'C3T', description: 'Ciclo 3 da tarde.', ageMin: 12, ageMax: 14 },
] as const;

const SEGMENTS = [
  { key: 'familiares', name: 'Familiares', purpose: 'PUBLICO', description: 'Familiares e responsaveis legais.' },
  { key: 'funcionarios', name: 'Funcionarios', purpose: 'EQUIPE', description: 'Equipe contratada da instituicao.' },
  { key: 'voluntarios', name: 'Voluntarios', purpose: 'EQUIPE', description: 'Voluntarios ativos.' },
  { key: 'oficineiros', name: 'Oficineiros', purpose: 'EQUIPE', description: 'Oficineiros que conduzem atividades.' },
  { key: 'parceiros', name: 'Parceiros', purpose: 'PUBLICO', description: 'Organizacoes apoiadoras e patrocinadoras.' },
  { key: 'doadores', name: 'Doadores', purpose: 'PUBLICO', description: 'Doadores pessoa fisica/juridica.' },
] as const;

type GroupKey = (typeof CYCLES)[number]['key'] | (typeof SEGMENTS)[number]['key'];

export type PeopleFase1Result = {
  groups: Record<GroupKey, string>;
  atendidosAtivos: string[];
  atendidosDesligados: string[];
  atendidosEmEspera: string[];
  familiares: string[];
  funcionarios: string[];
  parceiros: string[];
  voluntarios: string[];
  oficineiros: string[];
  doadores: string[];
  assistentesSociais: string[];
  psicologas: string[];
  cycleAssignments: Record<(typeof CYCLES)[number]['key'], string[]>;
  // Usado pela Fase 2 (Atendimentos/Ocorrencias) pra vincular familiares e
  // atendidos do mesmo household como AttendancePeople/OccurrencePeople,
  // sem precisar reconsultar PersonRelation/HouseholdMember do banco.
  familiaresByAtendido: Record<string, string[]>;
  householdSiblingsByAtendido: Record<string, string[]>;
};

type PersonRow = {
  id: string;
  tenantId: string;
  fullName: string;
  socialName: string | null;
  birthDate: Date;
  sex: string;
  gender: string;
  raceColor: string;
  maritalStatus: string | null;
  nationality: string;
  email: string;
  phone: string;
  personType: string;
  status: string | null;
  departureReason: string | null;
  tags: string;
  profileSummary: string;
  avatarUrl: string;
};

type Category =
  | 'atendido-ativo'
  | 'atendido-desligado'
  | 'atendido-em-espera'
  | 'familiar'
  | 'funcionario'
  | 'parceiro'
  | 'voluntario'
  | 'oficineiro'
  | 'doador'
  | 'assistente-social'
  | 'psicologa';

type Spec = { category: Category; row: PersonRow };

function fullNameToEmail(fullName: string, index: number): string {
  const slug = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.');
  return `${slug}.${index}@seed.local`;
}

function buildPersonRow(options: {
  tenantId: string;
  index: number;
  personType: string;
  status: string | null;
  departureReason?: string | null;
  birthDate: Date;
  tags: string;
  profileSummary: string;
}): PersonRow {
  const sex = pick(SEX_OPTIONS);
  const fullName = faker.person.fullName({
    sex: sex === 'Masculino' ? 'male' : 'female',
  });
  const avatarUrl = sex === 'Masculino' ? '/avatar.jpg' : '/avatar-female.jpg';
  return {
    id: newId(),
    tenantId: options.tenantId,
    fullName,
    socialName: chance(0.03) ? faker.person.firstName() : null,
    birthDate: options.birthDate,
    sex,
    gender: GENDER_BY_SEX[sex],
    raceColor: pick(RACE_COLOR_OPTIONS),
    maritalStatus:
      options.personType === 'Atendido' && isChildBirthdate(options.birthDate)
        ? null
        : pick(MARITAL_STATUS_OPTIONS),
    nationality: 'Brasileira',
    email: fullNameToEmail(fullName, options.index),
    phone: randomPhone(),
    personType: options.personType,
    status: options.status,
    departureReason: options.departureReason ?? null,
    tags: options.tags,
    profileSummary: options.profileSummary,
    avatarUrl,
  };
}

function isChildBirthdate(birthDate: Date): boolean {
  const ageMs = Date.now() - birthDate.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  return ageYears < 18;
}

/**
 * Lote generico com `createMany` - todo o Fase 1 fica dentro de poucos
 * milhares de linhas por tabela (nunca precisa dividir em chunks pelo
 * limite de parametros do Postgres, diferente do volume de Encontros da
 * Fase 4), mas o helper fica pronto pra reuso se algum array crescer.
 */
async function insertInChunks<T>(
  items: T[],
  chunkSize: number,
  insert: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    await insert(items.slice(i, i + chunkSize));
  }
}

export async function seedPeopleFase1(
  prisma: PrismaClient,
  tenantId: string,
): Promise<PeopleFase1Result> {
  let index = 0;
  const nextIndex = () => {
    index += 1;
    return index;
  };

  // --- 1) Especificacoes de cada pessoa -----------------------------

  const specs: Spec[] = [];

  const addAtendido = (status: 'Ativo' | 'Desligado' | 'Em espera') => {
    const birthDate = faker.date.birthdate({ min: 6, max: 15, mode: 'age' });
    const category: Category =
      status === 'Ativo'
        ? 'atendido-ativo'
        : status === 'Desligado'
          ? 'atendido-desligado'
          : 'atendido-em-espera';
    const row = buildPersonRow({
      tenantId,
      index: nextIndex(),
      personType: 'Atendido',
      status,
      departureReason:
        status === 'Desligado'
          ? pick([
              'Mudanca de endereco',
              'Concluiu o ciclo de atendimento',
              'Solicitacao da familia',
              'Transferencia para outra instituicao',
            ])
          : null,
      birthDate,
      tags: 'Atendido',
      profileSummary: 'Pessoa atendida pelo servico de convivencia.',
    });
    specs.push({ category, row });
  };

  for (let i = 0; i < 120; i += 1) addAtendido('Ativo');
  for (let i = 0; i < 30; i += 1) addAtendido('Desligado');
  for (let i = 0; i < 50; i += 1) addAtendido('Em espera');

  const addFamiliar = () => {
    const birthDate = faker.date.birthdate({ min: 20, max: 70, mode: 'age' });
    const row = buildPersonRow({
      tenantId,
      index: nextIndex(),
      personType: 'Familiar',
      status: 'Ativo',
      birthDate,
      tags: 'Familiar',
      profileSummary: 'Familiar/responsavel de pessoa atendida.',
    });
    specs.push({ category: 'familiar', row });
  };
  for (let i = 0; i < 200; i += 1) addFamiliar();

  const addStaff = (
    category: Category,
    personType: string,
    count: number,
    extraTag?: string,
  ) => {
    for (let i = 0; i < count; i += 1) {
      const birthDate = faker.date.birthdate({ min: 20, max: 65, mode: 'age' });
      const row = buildPersonRow({
        tenantId,
        index: nextIndex(),
        personType,
        status: 'Ativo',
        birthDate,
        tags: extraTag ? `${personType},${extraTag}` : personType,
        profileSummary: extraTag
          ? `${extraTag} da equipe tecnica.`
          : `${personType} da instituicao.`,
      });
      specs.push({ category, row });
    }
  };

  addStaff('funcionario', 'Funcionario', 15);
  addStaff('parceiro', 'Parceiro', 10);
  addStaff('voluntario', 'Voluntario', 10);
  addStaff('oficineiro', 'Oficineiro', 10);
  addStaff('doador', 'Doador', 10);
  addStaff('assistente-social', 'Funcionario', 2, 'Assistente Social');
  addStaff('psicologa', 'Funcionario', 2, 'Psicologa');

  // --- 2) Person -------------------------------------------------------

  await insertInChunks(specs, 500, (chunk) =>
    prisma.person.createMany({ data: chunk.map((spec) => spec.row) }),
  );

  const byCategory = (category: Category) =>
    specs.filter((spec) => spec.category === category);

  const atendidosAtivos = byCategory('atendido-ativo');
  const atendidosDesligados = byCategory('atendido-desligado');
  const atendidosEmEspera = byCategory('atendido-em-espera');
  const familiares = byCategory('familiar');
  const funcionarios = byCategory('funcionario');
  const parceiros = byCategory('parceiro');
  const voluntarios = byCategory('voluntario');
  const oficineiros = byCategory('oficineiro');
  const doadores = byCategory('doador');
  const assistentesSociais = byCategory('assistente-social');
  const psicologas = byCategory('psicologa');

  const allAtendidos = [...atendidosAtivos, ...atendidosDesligados, ...atendidosEmEspera];
  const allAdults = [
    ...familiares,
    ...funcionarios,
    ...parceiros,
    ...voluntarios,
    ...oficineiros,
    ...doadores,
    ...assistentesSociais,
    ...psicologas,
  ];
  const allPeople = [...allAtendidos, ...allAdults];

  // --- 3) Household / HouseholdProfile / HouseholdMember ---------------

  type HouseholdPlan = { id: string; memberIds: string[] };
  const households: HouseholdPlan[] = [];
  const householdIdByPerson = new Map<string, string>();

  for (const atendido of allAtendidos) {
    const householdId = newId();
    households.push({ id: householdId, memberIds: [atendido.row.id] });
    householdIdByPerson.set(atendido.row.id, householdId);
  }

  // Familiares entram no household do atendido vinculado quando moram
  // juntos (decidido junto com o vinculo, abaixo) - os que nao moram
  // junto (ou atendidos sem nenhum familiar sorteado) ganham household
  // proprio, pra toda pessoa ter uma aba Endereco preenchida.
  const standaloneHouseholds: Spec[] = [];
  for (const adult of allAdults) {
    if (!householdIdByPerson.has(adult.row.id)) standaloneHouseholds.push(adult);
  }

  // --- 4) PersonRelation (vinculo familiar) -----------------------------

  type RelationPlan = {
    familiar: Spec;
    atendido: Spec;
    familiarToAtendido: string;
    atendidoToFamiliar: string;
    livesTogether: boolean;
    isLegalGuardian: boolean;
  };

  const RECIPROCAL: Record<string, string> = {
    Pai: 'Filho(a)',
    Mae: 'Filho(a)',
    'Irmao(a)': 'Irmao(a)',
    'Avo(a)': 'Dependente',
    'Tio(a)': 'Dependente',
    'Primo(a)': 'Primo(a)',
    Responsavel: 'Dependente',
  };
  // "Pai"/"Mae" tem genero implicito no nome do vinculo - sorteado so
  // entre os tipos sem genero (ou o correspondente ao sexo do familiar),
  // senao "Valentina" (nome feminino) podia sair com vinculo "Pai"
  // (achado ao verificar o seed rodando, 2026-11-22).
  const GENDERLESS_TYPES = ['Irmao(a)', 'Avo(a)', 'Tio(a)', 'Primo(a)', 'Responsavel'];

  const relationPlans: RelationPlan[] = [];
  for (const familiar of familiares) {
    const atendido = pick(allAtendidos);
    const type = chance(0.35)
      ? familiar.row.sex === 'Masculino'
        ? 'Pai'
        : 'Mae'
      : pick(GENDERLESS_TYPES);
    const isGuardianType = type === 'Pai' || type === 'Mae' || type === 'Responsavel';
    const livesTogether = isGuardianType ? chance(0.85) : chance(0.5);
    relationPlans.push({
      familiar,
      atendido,
      familiarToAtendido: type,
      atendidoToFamiliar: RECIPROCAL[type],
      livesTogether,
      isLegalGuardian: isGuardianType && chance(0.9),
    });

    if (livesTogether) {
      const householdId = householdIdByPerson.get(atendido.row.id)!;
      householdIdByPerson.set(familiar.row.id, householdId);
      const household = households.find((h) => h.id === householdId)!;
      household.memberIds.push(familiar.row.id);
    } else {
      const idx = standaloneHouseholds.findIndex((s) => s.row.id === familiar.row.id);
      if (idx >= 0) standaloneHouseholds.splice(idx, 1);
      const householdId = newId();
      households.push({ id: householdId, memberIds: [familiar.row.id] });
      householdIdByPerson.set(familiar.row.id, householdId);
    }
  }

  for (const adult of standaloneHouseholds) {
    const householdId = newId();
    households.push({ id: householdId, memberIds: [adult.row.id] });
    householdIdByPerson.set(adult.row.id, householdId);
  }

  await insertInChunks(households, 500, (chunk) =>
    prisma.household.createMany({
      data: chunk.map((h) => ({ id: h.id, tenantId })),
    }),
  );

  await insertInChunks(households, 500, (chunk) =>
    prisma.householdProfile.createMany({
      data: chunk.map((h) => {
        const address = randomAddress();
        return {
          id: newId(),
          tenantId,
          householdId: h.id,
          type: pick(['Casa', 'Apartamento', 'Casa de vila']),
          condition: pick(['Propria', 'Alugada', 'Cedida', 'Ocupacao']),
          ownership: pick(['Propria', 'Alugada', 'Cedida']),
          areaM2: faker.number.int({ min: 28, max: 140 }),
          rooms: faker.number.int({ min: 1, max: 5 }),
          bathrooms: faker.number.int({ min: 1, max: 2 }),
          cep: address.cep,
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          ddd: address.ddd,
          notes: null,
        };
      }),
    }),
  );

  const householdMemberRows: Prisma.HouseholdMemberCreateManyInput[] = [];
  for (const household of households) {
    household.memberIds.forEach((personId, memberIndex) => {
      householdMemberRows.push({
        id: newId(),
        tenantId,
        householdId: household.id,
        personId,
        role: memberIndex === 0 ? 'Responsavel' : pick(['Morador', 'Dependente']),
        isHouseholdHead: memberIndex === 0,
        isLegalGuardian: memberIndex === 0,
        isIncomeContributor: memberIndex === 0 || chance(0.4),
        isProvider: memberIndex === 0 && chance(0.6),
        isDependent: memberIndex !== 0 && chance(0.5),
      });
    });
  }
  await insertInChunks(householdMemberRows, 500, (chunk) =>
    prisma.householdMember.createMany({ data: chunk }),
  );

  const relationRows: Prisma.PersonRelationCreateManyInput[] = [];
  const seenPairs = new Set<string>();
  for (const plan of relationPlans) {
    const forward = `${plan.familiar.row.id}:${plan.atendido.row.id}:${plan.familiarToAtendido}`;
    const backward = `${plan.atendido.row.id}:${plan.familiar.row.id}:${plan.atendidoToFamiliar}`;
    if (seenPairs.has(forward) || seenPairs.has(backward)) continue;
    seenPairs.add(forward);
    seenPairs.add(backward);

    relationRows.push({
      id: newId(),
      tenantId,
      personId: plan.familiar.row.id,
      relatedPersonId: plan.atendido.row.id,
      type: plan.familiarToAtendido,
      livesTogether: plan.livesTogether,
      isLegalGuardian: plan.isLegalGuardian,
    });
    relationRows.push({
      id: newId(),
      tenantId,
      personId: plan.atendido.row.id,
      relatedPersonId: plan.familiar.row.id,
      type: plan.atendidoToFamiliar,
      livesTogether: plan.livesTogether,
      isLegalGuardian: false,
    });
  }
  await insertInChunks(relationRows, 500, (chunk) =>
    prisma.personRelation.createMany({ data: chunk }),
  );

  // --- 5) PersonContact --------------------------------------------------

  const contactRows: Prisma.PersonContactCreateManyInput[] = [];
  for (const spec of allPeople) {
    contactRows.push({
      id: newId(),
      tenantId,
      personId: spec.row.id,
      role: 'SELF',
      type: 'EMAIL',
      value: spec.row.email,
      isPrimary: true,
    });
    contactRows.push({
      id: newId(),
      tenantId,
      personId: spec.row.id,
      role: 'SELF',
      type: 'PHONE',
      value: spec.row.phone,
      isPrimary: true,
      isWhatsapp: chance(0.8),
    });
  }
  // Contato de emergencia pra parte dos atendidos (telefone de um
  // familiar vinculado, quando existe) - so texto livre, nao referencia
  // outro Person por FK (mesmo campo "value" usado pelo cadastro manual).
  for (const plan of relationPlans) {
    if (!chance(0.4)) continue;
    contactRows.push({
      id: newId(),
      tenantId,
      personId: plan.atendido.row.id,
      role: 'EMERGENCY',
      type: 'PHONE',
      value: plan.familiar.row.phone,
      name: plan.familiar.row.fullName,
      relationship: plan.familiarToAtendido,
      isPrimary: false,
    });
  }
  await insertInChunks(contactRows, 500, (chunk) =>
    prisma.personContact.createMany({ data: chunk, skipDuplicates: true }),
  );

  // --- 6) PersonSensitiveDocument (criptografado) -----------------------

  const masterKey = parseMasterKey(process.env.PII_MASTER_KEY ?? '');
  const tenantKey = deriveTenantKey(masterKey, tenantId);
  const sensitiveDocRows: Prisma.PersonSensitiveDocumentCreateManyInput[] = [];
  for (const spec of allPeople) {
    const cpfDigits = randomCpfDigits();
    const payload = {
      cpf: cpfDigits,
      rg: randomRg(),
      nis: randomNisDigits(),
      cns: randomCnsDigits(),
    };
    const encrypted = encryptJson(tenantKey, payload);
    sensitiveDocRows.push({
      id: newId(),
      tenantId,
      personId: spec.row.id,
      schemaVersion: 1,
      dataEnc: Buffer.from(encrypted.dataEnc),
      iv: Buffer.from(encrypted.iv),
      tag: Buffer.from(encrypted.tag),
    });
  }
  await insertInChunks(sensitiveDocRows, 500, (chunk) =>
    prisma.personSensitiveDocument.createMany({ data: chunk }),
  );

  // --- 7) PersonFinancialEntry (so adultos) ------------------------------

  const FINANCIAL_CATEGORY: Record<PersonFinancialEntryType, string[]> = {
    INCOME: ['Salario', 'Renda extra', 'Pensao', 'Ajuda familiar'],
    EXPENSE: ['Aluguel', 'Alimentacao', 'Agua', 'Luz', 'Transporte', 'Saude'],
    BENEFIT: ['Bolsa familia', 'BPC', 'Auxilio aluguel', 'Cesta basica'],
    // Nao sorteado abaixo (transferencia entre residencias e um cenario
    // de familia, Fase 3+ se precisar) - presente so pra satisfazer o
    // tipo do enum inteiro.
    TRANSFER: ['Transferencia'],
  };
  const financialRows: Prisma.PersonFinancialEntryCreateManyInput[] = [];
  for (const adult of allAdults) {
    if (!chance(0.7)) continue;
    const entryCount = chance(0.3) ? 2 : 1;
    for (let i = 0; i < entryCount; i += 1) {
      const entryType = pickWeighted<PersonFinancialEntryType>([
        { value: 'INCOME', weight: 5 },
        { value: 'EXPENSE', weight: 4 },
        { value: 'BENEFIT', weight: 2 },
      ]);
      const householdId = householdIdByPerson.get(adult.row.id) ?? null;
      financialRows.push({
        id: newId(),
        tenantId,
        personId: adult.row.id,
        householdId,
        entryType,
        category: pick(FINANCIAL_CATEGORY[entryType]),
        status: pick(['Ativo', 'Pausado', 'Encerrado']),
        amount: faker.number.float({ min: 80, max: 2800, fractionDigits: 2 }),
        frequency: pickWeighted([
          { value: 'MONTHLY', weight: 6 },
          { value: 'WEEKLY', weight: 1 },
          { value: 'BIWEEKLY', weight: 1 },
          { value: 'ONCE', weight: 2 },
        ]),
        includeInHouseholdBudget: chance(0.8),
      });
    }
  }
  await insertInChunks(financialRows, 500, (chunk) =>
    prisma.personFinancialEntry.createMany({ data: chunk }),
  );

  // --- 8) PersonHealthCondition -------------------------------------------

  const HEALTH_TYPES = [
    'Deficiencia Auditiva',
    'Deficiencia Visual',
    'Deficiencia Motora',
    'Deficiencia Intelectual',
    'Condicao Cronica',
    'Alergia',
    'Transtorno',
  ];
  const HEALTH_SEVERITY = ['Leve', 'Moderada', 'Severa'];
  const peopleWithHealthCondition = new Set<string>();
  const healthRows: Prisma.PersonHealthConditionCreateManyInput[] = [];
  for (const spec of allPeople) {
    if (!chance(0.25)) continue;
    peopleWithHealthCondition.add(spec.row.id);
    healthRows.push({
      id: newId(),
      tenantId,
      personId: spec.row.id,
      type: pick(HEALTH_TYPES),
      severity: pick(HEALTH_SEVERITY),
      diagnosisDate: faker.date.past({ years: 8 }),
    });
  }
  await insertInChunks(healthRows, 500, (chunk) =>
    prisma.personHealthCondition.createMany({ data: chunk }),
  );

  // --- 9) PersonMedication (correlacionado com saude) ----------------------

  const MEDICATIONS = [
    { medication: 'Ritalina', reason: 'TDAH' },
    { medication: 'Sertralina', reason: 'Ansiedade' },
    { medication: 'Losartana', reason: 'Hipertensao' },
    { medication: 'Metformina', reason: 'Diabetes' },
    { medication: 'Loratadina', reason: 'Alergia' },
  ];
  const medicationRows: Prisma.PersonMedicationCreateManyInput[] = [];
  for (const spec of allPeople) {
    const base = peopleWithHealthCondition.has(spec.row.id) ? 0.5 : 0.08;
    if (!chance(base)) continue;
    const med = pick(MEDICATIONS);
    medicationRows.push({
      id: newId(),
      tenantId,
      personId: spec.row.id,
      medication: med.medication,
      reason: med.reason,
      dosage: pick(['5mg', '10mg', '20mg', '500mg']),
      schedule: pick(['1x ao dia', '2x ao dia', '08h/20h']),
      startDate: faker.date.past({ years: 3 }),
    });
  }
  await insertInChunks(medicationRows, 500, (chunk) =>
    prisma.personMedication.createMany({ data: chunk }),
  );

  // --- 10) PersonEducation --------------------------------------------------

  const SCHOOL_LEVEL_BY_AGE = (birthDate: Date): string => {
    const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age <= 8) return 'Ensino fundamental incompleto';
    if (age <= 11) return 'Ensino fundamental incompleto';
    return 'Ensino fundamental incompleto';
  };
  const ADULT_EDUCATION_LEVELS = [
    'Ensino fundamental incompleto',
    'Ensino fundamental completo',
    'Ensino medio incompleto',
    'Ensino medio completo',
    'Ensino superior incompleto',
    'Ensino superior completo',
  ];
  const educationRows: Prisma.PersonEducationCreateManyInput[] = [];
  for (const spec of allPeople) {
    if (!chance(0.8)) continue;
    const isAtendidoChild = spec.category.startsWith('atendido');
    const level = isAtendidoChild
      ? SCHOOL_LEVEL_BY_AGE(spec.row.birthDate)
      : pick(ADULT_EDUCATION_LEVELS);
    educationRows.push({
      id: newId(),
      tenantId,
      personId: spec.row.id,
      level,
      status: isAtendidoChild ? 'Cursando' : pick(['Cursando', 'Concluido']),
      institution: isAtendidoChild
        ? pick(['EMEF Jardim das Flores', 'EMEF Vila Esperanca', 'EMEF Sao Mateus'])
        : null,
      isCurrent: isAtendidoChild ? true : chance(0.2),
    });
  }
  await insertInChunks(educationRows, 500, (chunk) =>
    prisma.personEducation.createMany({ data: chunk }),
  );

  // --- 11) PersonDetention (raro, so adultos) -------------------------------

  const detentionRows: Prisma.PersonDetentionCreateManyInput[] = [];
  for (const adult of allAdults) {
    if (!chance(0.04)) continue;
    detentionRows.push({
      id: newId(),
      tenantId,
      personId: adult.row.id,
      status: pick(['Em reclusao', 'Medida socioeducativa', 'Liberdade condicional']),
      type: pick(['Fechado', 'Semiaberto', 'Aberto']),
      unit: pick(['Unidade Zona Sul', 'Unidade Central', 'Unidade Leste']),
      startDate: faker.date.past({ years: 4 }),
    });
  }
  await insertInChunks(detentionRows, 500, (chunk) =>
    prisma.personDetention.createMany({ data: chunk }),
  );

  // --- 12) PeopleGroup + PeopleGroupParticipation ---------------------------

  const groupIds = {} as Record<GroupKey, string>;
  const groupRows: Prisma.PeopleGroupCreateManyInput[] = [];
  for (const cycle of CYCLES) {
    const id = newId();
    groupIds[cycle.key] = id;
    groupRows.push({
      id,
      tenantId,
      name: cycle.name,
      groupType: 'CYCLE',
      purpose: 'PUBLICO',
      category: 'Ciclo',
      description: cycle.description,
      ageMin: cycle.ageMin,
      ageMax: cycle.ageMax,
    });
  }
  for (const segment of SEGMENTS) {
    const id = newId();
    groupIds[segment.key] = id;
    groupRows.push({
      id,
      tenantId,
      name: segment.name,
      groupType: segment.key === 'familiares' ? 'SEGMENT' : segment.key === 'parceiros' ? 'NETWORK' : segment.key === 'doadores' ? 'SEGMENT' : 'TEAM_POOL',
      purpose: segment.purpose as 'PUBLICO' | 'EQUIPE',
      category: segment.key === 'familiares' ? 'Publico' : 'Equipe',
      description: segment.description,
    });
  }
  await prisma.peopleGroup.createMany({ data: groupRows });

  // 120 ativos, 20 por ciclo (6 ciclos) - todos acima do minimo de 15
  // pedido.
  const shuffledAtivos = faker.helpers.shuffle([...atendidosAtivos]);
  const cycleAssignments = {} as Record<(typeof CYCLES)[number]['key'], string[]>;
  CYCLES.forEach((cycle, cycleIndex) => {
    const slice = shuffledAtivos.slice(cycleIndex * 20, cycleIndex * 20 + 20);
    cycleAssignments[cycle.key] = slice.map((s) => s.row.id);
  });

  const participationRows: Prisma.PeopleGroupParticipationCreateManyInput[] = [];
  const addParticipation = (groupKey: GroupKey, personId: string) => {
    const peopleGroupId = groupIds[groupKey];
    participationRows.push({
      id: newId(),
      tenantId,
      peopleGroupId,
      personId,
      activeKey: `${peopleGroupId}:${personId}`,
      isActive: true,
    });
  };

  CYCLES.forEach((cycle) => {
    cycleAssignments[cycle.key].forEach((personId) => addParticipation(cycle.key, personId));
  });
  familiares.forEach((spec) => addParticipation('familiares', spec.row.id));
  [...funcionarios, ...assistentesSociais, ...psicologas].forEach((spec) =>
    addParticipation('funcionarios', spec.row.id),
  );
  voluntarios.forEach((spec) => addParticipation('voluntarios', spec.row.id));
  oficineiros.forEach((spec) => addParticipation('oficineiros', spec.row.id));
  parceiros.forEach((spec) => addParticipation('parceiros', spec.row.id));
  doadores.forEach((spec) => addParticipation('doadores', spec.row.id));

  await insertInChunks(participationRows, 500, (chunk) =>
    prisma.peopleGroupParticipation.createMany({ data: chunk }),
  );

  // Familiar -> atendido(s) vinculado(s) (so o sentido familiar->atendido,
  // o que a Fase 2 precisa pra sortear um FAMILIAR como AttendancePeople/
  // testemunha de uma Occurrence).
  const familiaresByAtendido: Record<string, string[]> = {};
  for (const plan of relationPlans) {
    const atendidoId = plan.atendido.row.id;
    const familiarId = plan.familiar.row.id;
    (familiaresByAtendido[atendidoId] ??= []).push(familiarId);
  }

  // Atendidos que moram no mesmo household (irmaos, por exemplo) - usado
  // pela Fase 2 pra sortear um segundo atendido (ATENDIDO_SECUNDARIO) no
  // mesmo caso.
  const householdSiblingsByAtendido: Record<string, string[]> = {};
  const atendidoIdSet = new Set(allAtendidos.map((s) => s.row.id));
  for (const household of households) {
    const atendidosInHousehold = household.memberIds.filter((id) => atendidoIdSet.has(id));
    if (atendidosInHousehold.length < 2) continue;
    for (const id of atendidosInHousehold) {
      householdSiblingsByAtendido[id] = atendidosInHousehold.filter((other) => other !== id);
    }
  }

  return {
    groups: groupIds,
    atendidosAtivos: atendidosAtivos.map((s) => s.row.id),
    atendidosDesligados: atendidosDesligados.map((s) => s.row.id),
    atendidosEmEspera: atendidosEmEspera.map((s) => s.row.id),
    familiares: familiares.map((s) => s.row.id),
    funcionarios: funcionarios.map((s) => s.row.id),
    parceiros: parceiros.map((s) => s.row.id),
    voluntarios: voluntarios.map((s) => s.row.id),
    oficineiros: oficineiros.map((s) => s.row.id),
    doadores: doadores.map((s) => s.row.id),
    assistentesSociais: assistentesSociais.map((s) => s.row.id),
    psicologas: psicologas.map((s) => s.row.id),
    cycleAssignments,
    familiaresByAtendido,
    householdSiblingsByAtendido,
  };
}
