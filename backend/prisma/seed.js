"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = __importStar(require("bcrypt"));
const people_fase1_1 = require("./seed/people-fase1");
const attendances_occurrences_fase2_1 = require("./seed/attendances-occurrences-fase2");
const programs_projects_activities_fase3_1 = require("./seed/programs-projects-activities-fase3");
const meetings_fase4_1 = require("./seed/meetings-fase4");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createPrismaClientFromEnv } = require('../scripts/prisma-runtime');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadCorePermissionsModule } = require('../scripts/load-core-permissions');
const prisma = createPrismaClientFromEnv();
// Catalogo de permissoes/papeis padrao (producao): fonte unica em
// src/modules/permissions/core-permissions.ts, a mesma usada pelo fluxo
// real de cadastro de tenant (registration.service.ts) e pelo
// permissions:backfill. O seed de dados ficticios abaixo so adiciona o
// tenant/usuarios/pessoas de demonstracao por cima desse catalogo.
const { CORE_PERMISSIONS, CORE_PERMISSION_KEYS, DEFAULT_ROLE_DEFINITIONS, } = loadCorePermissionsModule();
// Fase 1 (Pessoas) adiante substitui os blocos estaticos de Programas/
// Projetos/Atividades/Ocorrencias que existiam aqui - dependiam de
// indices fixos do array `people` antigo (ver PLAN.md). Fases 2-4
// (Atendimentos/Ocorrencias, Programas/Projetos/Atividades, Encontros)
// trazem essas tabelas de volta, geradas a partir do `PeopleFase1Result`
// em vez de IDs fixos.
const ids = {
    tenant: '11111111-1111-4111-8111-111111111111',
    roles: {
        admin: '11111111-1111-4111-8111-111111111201',
        gestor: '11111111-1111-4111-8111-111111111202',
        atendimento: '11111111-1111-4111-8111-111111111203',
    },
    users: {
        admin: '11111111-1111-4111-8111-111111111301',
        gestor: '11111111-1111-4111-8111-111111111302',
        atendimento: '11111111-1111-4111-8111-111111111303',
    },
};
// Ids determinísticos e únicos por domínio (Pantry = '2', Deposit = '3'),
// no mesmo formato de UUID v4 falso que o resto do seed usa - precisa
// continuar parecendo v4 porque os controllers validam o :id da rota com
// `ParseUUIDPipe({ version: '4' })` (3º grupo comeca com '4', 4º com '8').
// `block` identifica o tipo de registro (1 item, 2 doador, 3 entrada, 4
// saida, 5 alocacao) e `n` é o índice sequencial dentro desse tipo.
function makeDomainId(domainDigit, block, n) {
    const octet = domainDigit.repeat(8);
    return `${octet}-${domainDigit.repeat(4)}-4${domainDigit.repeat(3)}-8${domainDigit.repeat(3)}-${octet}${block}${String(n).padStart(3, '0')}`;
}
// Gera pelo menos 10 registros em cada tela de Pantry/Deposit (Itens,
// Doadores/Fontes, Entradas, Saídas, Estoque e Histórico - as 2 últimas são
// derivadas de Item/Entrada/Saída, não têm tabela própria) - usado pros 2
// módulos por serem estruturalmente idênticos (ver pantry/deposit
// detail-layout-contract.tsx), só trocando terminologia/enum de saída.
async function seedPantryLikeDomain(tenantId, config) {
    const itemIds = config.itemCatalog.map((_, index) => makeDomainId(config.domainDigit, 1, index + 1));
    const donorIds = config.donorCatalog.map((_, index) => makeDomainId(config.domainDigit, 2, index + 1));
    await config.itemDelegate.createMany({
        data: config.itemCatalog.map((item, index) => ({
            id: itemIds[index],
            tenantId,
            name: item.name,
            group: item.group,
            unit: item.unit,
            minStock: item.minStock,
            defaultSector: index % 3 === 0 ? 'Despensa Central' : 'Geral',
            notes: `${item.name} cadastrado pelo seed de homologacao.`,
        })),
    });
    await config.donorDelegate.createMany({
        data: config.donorCatalog.map((donor, index) => ({
            id: donorIds[index],
            tenantId,
            name: donor.name,
            type: donor.type,
            contact: donor.contact,
        })),
    });
    // 2 entradas por item (20 no total) - doador roda entre os 10 cadastrados,
    // 1ª entrada maior/mais antiga, 2ª menor/mais recente, pra dar variação
    // de saldo e validade nas abas "Entradas"/"Histórico".
    const entries = [];
    config.itemCatalog.forEach((item, itemIndex) => {
        for (let k = 0; k < 2; k += 1) {
            const donorIndex = (itemIndex * 2 + k) % donorIds.length;
            entries.push({
                id: makeDomainId(config.domainDigit, 3, entries.length + 1),
                itemId: itemIds[itemIndex],
                donorId: donorIds[donorIndex],
                sector: itemIndex % 3 === 0 ? 'Despensa Central' : 'Geral',
                quantity: Math.round(item.minStock * (k === 0 ? 1.5 : 0.8)),
                unit: item.unit,
                entryDate: new Date(Date.UTC(2026, k === 0 ? 0 : 1, 10 + itemIndex)),
                expiryDate: new Date(Date.UTC(2026, 7 + (itemIndex % 5), 1)),
            });
        }
    });
    await config.entryDelegate.createMany({
        data: entries.map((entry) => ({
            id: entry.id,
            tenantId,
            itemId: entry.itemId,
            donorId: entry.donorId,
            sector: entry.sector,
            quantity: entry.quantity,
            unit: entry.unit,
            entryDate: entry.entryDate,
            expiryDate: entry.expiryDate,
            notes: 'Entrada registrada pelo seed de homologacao.',
        })),
    });
    // Saídas: os 5 primeiros itens recebem 1 saída, os 5 últimos recebem 2
    // (15 no total) - cada saída aloca contra a 1ª entrada do mesmo item, pra
    // "Saídas vinculadas" (Entrada) e "Lotes/Entradas vinculados" (Saída)
    // também terem dado de verdade, não só a lista de Saídas em si.
    const exits = [];
    config.itemCatalog.forEach((item, itemIndex) => {
        const exitsForItem = itemIndex < 5 ? 1 : 2;
        for (let k = 0; k < exitsForItem; k += 1) {
            const type = config.exitTypes[(itemIndex + k) % config.exitTypes.length];
            exits.push({
                id: makeDomainId(config.domainDigit, 4, exits.length + 1),
                itemId: itemIds[itemIndex],
                sector: itemIndex % 3 === 0 ? 'Despensa Central' : 'Geral',
                quantity: Math.max(1, Math.round(item.minStock * 0.3)),
                unit: item.unit,
                exitDate: new Date(Date.UTC(2026, 2 + k, 5 + itemIndex)),
                type,
                extraValue: config.exitExtraValueByType[type],
                allocatedEntryId: entries[itemIndex * 2].id,
            });
        }
    });
    await config.exitDelegate.createMany({
        data: exits.map((exit) => ({
            id: exit.id,
            tenantId,
            itemId: exit.itemId,
            sector: exit.sector,
            quantity: exit.quantity,
            unit: exit.unit,
            exitDate: exit.exitDate,
            type: exit.type,
            [config.exitExtraField]: exit.extraValue ?? null,
            notes: 'Saida registrada pelo seed de homologacao.',
        })),
    });
    await config.allocationDelegate.createMany({
        data: exits.map((exit, index) => ({
            id: makeDomainId(config.domainDigit, 5, index + 1),
            tenantId,
            exitId: exit.id,
            entryId: exit.allocatedEntryId,
            quantity: exit.quantity,
        })),
    });
}
const PANTRY_SEED_CONFIG = {
    domainDigit: '2',
    itemDelegate: prisma.pantryItem,
    donorDelegate: prisma.pantryDonor,
    entryDelegate: prisma.pantryEntry,
    exitDelegate: prisma.pantryExit,
    allocationDelegate: prisma.pantryExitAllocation,
    itemCatalog: [
        { name: 'Arroz', unit: 'kg', group: 'Grãos e Cereais', minStock: 50 },
        { name: 'Feijão', unit: 'kg', group: 'Leguminosas', minStock: 40 },
        { name: 'Óleo de soja', unit: 'l', group: 'Óleos e Gorduras', minStock: 20 },
        { name: 'Macarrão', unit: 'kg', group: 'Massas', minStock: 30 },
        { name: 'Leite em pó', unit: 'kg', group: 'Leite e Derivados', minStock: 15 },
        { name: 'Açúcar', unit: 'kg', group: 'Açúcares e Adoçantes', minStock: 25 },
        { name: 'Sal', unit: 'kg', group: 'Temperos e Condimentos', minStock: 10 },
        { name: 'Café', unit: 'kg', group: 'Café e Chás', minStock: 8 },
        { name: 'Farinha de trigo', unit: 'kg', group: 'Farinhas e Derivados', minStock: 20 },
        { name: 'Molho de tomate', unit: 'un', group: 'Molhos', minStock: 30 },
    ],
    donorCatalog: [
        { name: 'Mercado Central', type: 'COMPANY', contact: 'contato@mercadocentral.seed.local' },
        { name: 'Padaria Boa Vista', type: 'COMPANY', contact: 'contato@padariaboavista.seed.local' },
        { name: 'Distribuidora Alimentos SP', type: 'COMPANY', contact: 'vendas@distribuidorasp.seed.local' },
        { name: 'Maria Souza', type: 'PERSON', contact: '+55 11 98888-6001' },
        { name: 'João Lima', type: 'PERSON', contact: '+55 11 98888-6002' },
        { name: 'Supermercado Extra Bairro', type: 'COMPANY', contact: 'contato@extrabairro.seed.local' },
        { name: 'Hortifruti Raiz', type: 'COMPANY', contact: 'contato@hortifrutiraiz.seed.local' },
        { name: 'Alimentos ABC Ltda', type: 'COMPANY', contact: 'comercial@abcalimentos.seed.local' },
        { name: 'Ana Paula Ferreira', type: 'PERSON', contact: '+55 11 98888-6003' },
        { name: 'Atacadão Popular', type: 'COMPANY', contact: 'contato@atacadaopopular.seed.local' },
    ],
    exitTypes: ['ATTENDED', 'DONATION', 'EVENT', 'PARTY', 'CORRECTION'],
    exitExtraField: 'eventName',
    exitExtraValueByType: {
        EVENT: 'Festa Junina do bairro',
        PARTY: 'Aniversario comunitario',
    },
};
const DEPOSIT_SEED_CONFIG = {
    domainDigit: '3',
    itemDelegate: prisma.depositItem,
    donorDelegate: prisma.depositDonor,
    entryDelegate: prisma.depositEntry,
    exitDelegate: prisma.depositExit,
    allocationDelegate: prisma.depositExitAllocation,
    itemCatalog: [
        { name: 'Colchonetes', unit: 'un', group: 'Mobília', minStock: 20 },
        { name: 'Cadeiras plásticas', unit: 'un', group: 'Mobília', minStock: 30 },
        { name: 'Jogos de mesa', unit: 'kit', group: 'Brinquedos', minStock: 10 },
        { name: 'Caixas de som', unit: 'un', group: 'Eletrônicos', minStock: 5 },
        { name: 'Projetor multimídia', unit: 'un', group: 'Eletrônicos', minStock: 3 },
        { name: 'Kits de primeiros socorros', unit: 'kit', group: 'Material de Oficina', minStock: 8 },
        { name: 'Barracas de camping', unit: 'un', group: 'Material Esportivo', minStock: 6 },
        { name: 'Bicicletas', unit: 'un', group: 'Material Esportivo', minStock: 10 },
        { name: 'Kits de material escolar', unit: 'kit', group: 'Material Escolar', minStock: 40 },
        { name: 'Caixas de ferramentas', unit: 'cx', group: 'Material de Oficina', minStock: 12 },
    ],
    donorCatalog: [
        { name: 'Loja Materiais Unidos', type: 'COMPANY', contact: 'contato@materiaisunidos.seed.local' },
        { name: 'Construtora Horizonte', type: 'COMPANY', contact: 'contato@construtorahorizonte.seed.local' },
        { name: 'Escola Municipal Vista Alegre', type: 'COMPANY', contact: 'secretaria@emvistaalegre.seed.local' },
        { name: 'Rafael Tavares', type: 'PERSON', contact: '+55 11 97777-7001' },
        { name: 'Patricia Nogueira', type: 'PERSON', contact: '+55 11 97777-7002' },
        { name: 'Esportes Vitoria Ltda', type: 'COMPANY', contact: 'vendas@esportesvitoria.seed.local' },
        { name: 'Oficina do Bairro', type: 'COMPANY', contact: 'contato@oficinadobairro.seed.local' },
        { name: 'Clube Recreativo Sao Jose', type: 'COMPANY', contact: 'contato@clubesaojose.seed.local' },
        { name: 'Eduardo Martins', type: 'PERSON', contact: '+55 11 97777-7003' },
        { name: 'Papelaria Grafite', type: 'COMPANY', contact: 'contato@papelariagrafite.seed.local' },
    ],
    exitTypes: ['LOAN', 'FINAL_REMOVAL', 'TRANSFER', 'ADJUSTMENT', 'LOSS'],
    exitExtraField: 'destinationName',
    exitExtraValueByType: {
        LOAN: 'Escola Municipal Vista Alegre',
        TRANSFER: 'Unidade Zona Leste',
    },
};
async function createPermissionsAndRoles(tenantId) {
    await prisma.permission.createMany({
        data: CORE_PERMISSIONS.map((permission) => ({
            key: permission.key,
            description: permission.description,
        })),
        skipDuplicates: true,
    });
    await prisma.role.createMany({
        data: [
            {
                id: ids.roles.admin,
                tenantId,
                // 'Administrador' e um alias conhecido do papel 'Admin' do
                // catalogo (ver CORE_ROLE_PERMISSION_TEMPLATES em
                // core-permissions.ts) - mantido para nao mudar o nome do papel
                // do tenant de demonstracao que ja existe.
                name: 'Administrador',
                description: 'Acesso completo ao ambiente de teste.',
            },
            {
                id: ids.roles.gestor,
                tenantId,
                name: 'Gestor',
                description: 'Gestao operacional de people, projetos e acoes.',
            },
            {
                id: ids.roles.atendimento,
                tenantId,
                name: 'Atendimento',
                description: 'Atendimento e acompanhamento do publico.',
            },
        ],
    });
    const storedPermissions = await prisma.permission.findMany({
        where: { key: { in: CORE_PERMISSION_KEYS } },
    });
    const permissionIdByKey = new Map(storedPermissions.map((permission) => [permission.key, permission.id]));
    const permissionKeysByRoleName = (roleName) => DEFAULT_ROLE_DEFINITIONS.find((role) => role.name === roleName)
        ?.permissionKeys ?? [];
    const rolePermissions = [
        ...CORE_PERMISSION_KEYS.map((key) => ({
            tenantId,
            roleId: ids.roles.admin,
            permissionId: permissionIdByKey.get(key),
        })),
        ...permissionKeysByRoleName('Gestor').map((key) => ({
            tenantId,
            roleId: ids.roles.gestor,
            permissionId: permissionIdByKey.get(key),
        })),
        ...permissionKeysByRoleName('Atendimento').map((key) => ({
            tenantId,
            roleId: ids.roles.atendimento,
            permissionId: permissionIdByKey.get(key),
        })),
    ];
    await prisma.rolePermission.createMany({
        data: rolePermissions,
        skipDuplicates: true,
    });
}
async function createUsers(tenantId) {
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const userPasswordHash = await bcrypt.hash('User@123', 10);
    await prisma.user.createMany({
        data: [
            {
                id: ids.users.admin,
                tenantId,
                name: 'Administrador',
                email: 'admin@seed.local',
                passwordHash: adminPasswordHash,
                avatarUrl: '/avatar.jpg',
                isActive: true,
            },
            {
                id: ids.users.gestor,
                tenantId,
                name: 'Gestora de Projetos',
                email: 'gestor@seed.local',
                passwordHash: userPasswordHash,
                avatarUrl: '/avatar-female.jpg',
                isActive: true,
            },
            {
                id: ids.users.atendimento,
                tenantId,
                name: 'Equipe de Atendimento',
                email: 'atendimento@seed.local',
                passwordHash: userPasswordHash,
                avatarUrl: '/avatar.jpg',
                isActive: true,
            },
        ],
    });
    await prisma.userRole.createMany({
        data: [
            {
                tenantId,
                userId: ids.users.admin,
                roleId: ids.roles.admin,
            },
            {
                tenantId,
                userId: ids.users.gestor,
                roleId: ids.roles.gestor,
            },
            {
                tenantId,
                userId: ids.users.atendimento,
                roleId: ids.roles.atendimento,
            },
        ],
    });
}
async function wipeDatabase() {
    // Truncates every table instead of a hand-maintained ordered deleteMany
    // list: the schema has ~94 models and most Person/Household/PeopleGroup
    // relations are implicit RESTRICT, so any manual list drifts out of sync
    // (it already had, causing re-seed to fail with FK errors once real
    // records existed from prior app usage). TRUNCATE ... CASCADE clears
    // every table regardless of schema growth.
    const tables = await prisma.$queryRaw `
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;
    if (tables.length === 0)
        return;
    const tableList = tables.map((t) => `"${t.tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE`);
}
async function main() {
    await wipeDatabase();
    await prisma.tenant.create({
        data: {
            id: ids.tenant,
            name: 'Instituicao Exemplo',
            slug: 'instituicao-exemplo',
            logoUrl: '/avatar-female.jpg',
            cnpj: '12.345.678/0001-99',
            startYear: 2008,
            description: '<p>Base de testes com cenario realista de Pessoas (Fase 1 do seed de homologacao).</p>',
            status: 'ACTIVE',
        },
    });
    await createPermissionsAndRoles(ids.tenant);
    await createUsers(ids.tenant);
    // Fase 1 (Pessoas) - Person + 7 sub-entidades, documentos sensiveis
    // criptografados, vinculos familiares e os 12 grupos/ciclos, tudo
    // gerado via Faker (ver prisma/seed/people-fase1.ts). O resultado
    // (IDs por categoria) fica disponivel pras proximas fases.
    const peopleFase1 = await (0, people_fase1_1.seedPeopleFase1)(prisma, ids.tenant);
    // Fase 2 (Atendimentos/Ocorrencias) - historico de 3 anos (2024-2026)
    // em cima dos 120 atendidos ativos da Fase 1 (ver
    // prisma/seed/attendances-occurrences-fase2.ts). Fase 3 (Programas/
    // Projetos/Atividades) e Fase 4 (Encontros) ainda nao foram
    // implementadas - proximas rodadas.
    const fase2 = await (0, attendances_occurrences_fase2_1.seedAttendancesOccurrencesFase2)(prisma, ids.tenant, peopleFase1);
    // Fase 3 (Programas/Projetos/Atividades) - 5 programas, media de 10
    // projetos por programa, media de 30 atividades por projeto (ver
    // prisma/seed/programs-projects-activities-fase3.ts). Fase 4
    // (Encontros) ainda nao foi implementada - proxima rodada.
    const fase3 = await (0, programs_projects_activities_fase3_1.seedProgramsProjectsActivitiesFase3)(prisma, ids.tenant, peopleFase1);
    // Fase 4 (Encontros) - instancia concreta de cada Atividade que ja
    // aconteceu, com presenca (ver prisma/seed/meetings-fase4.ts). Ultima
    // fase do seed grande pedido pelo usuario.
    const fase4 = await (0, meetings_fase4_1.seedMeetingsFase4)(prisma, ids.tenant);
    await seedPantryLikeDomain(ids.tenant, PANTRY_SEED_CONFIG);
    await seedPantryLikeDomain(ids.tenant, DEPOSIT_SEED_CONFIG);
    console.log('Seed executado com sucesso.');
    console.log(`Tenant: instituicao-exemplo (${ids.tenant})`);
    console.log('Usuarios:');
    console.log('  admin@seed.local / Admin@123');
    console.log('  gestor@seed.local / User@123');
    console.log('  atendimento@seed.local / User@123');
    console.log('Pessoas (Fase 1):');
    console.log(`  Atendidos ativos: ${peopleFase1.atendidosAtivos.length}`);
    console.log(`  Atendidos desligados: ${peopleFase1.atendidosDesligados.length}`);
    console.log(`  Atendidos em espera: ${peopleFase1.atendidosEmEspera.length}`);
    console.log(`  Familiares: ${peopleFase1.familiares.length}`);
    console.log(`  Equipe/parceiros/voluntarios/oficineiros/doadores: ${peopleFase1.funcionarios.length +
        peopleFase1.parceiros.length +
        peopleFase1.voluntarios.length +
        peopleFase1.oficineiros.length +
        peopleFase1.doadores.length +
        peopleFase1.assistentesSociais.length +
        peopleFase1.psicologas.length}`);
    console.log('Pantry/Deposit seed: 10 itens, 10 doadores/fontes, 20 entradas e 15 saidas em cada modulo.');
    console.log('Atendimentos/Ocorrencias (Fase 2):');
    console.log(`  Ocorrencias: ${fase2.occurrences}`);
    console.log(`  Atendimentos: ${fase2.attendances}`);
    console.log(`  Evolucoes: ${fase2.evolutions}`);
    console.log(`  Beneficios: ${fase2.benefits}`);
    console.log(`  Redes de destino (ReferralDestination): ${fase2.referralDestinations}`);
    console.log('Programas/Projetos/Atividades (Fase 3):');
    console.log(`  Programas: ${fase3.programs}`);
    console.log(`  Projetos: ${fase3.projects}`);
    console.log(`  Atividades: ${fase3.activities}`);
    console.log(`  Matriculas (ProjectEnrollment): ${fase3.enrollments}`);
    console.log(`  Equipe de projeto (ProjectTeamParticipation): ${fase3.teamParticipations}`);
    console.log(`  Metas (Goal): ${fase3.goals}`);
    console.log(`  Participantes diretos (ProjectActionPeopleParticipation PARTICIPANT): ${fase3.directParticipants}`);
    console.log('Encontros (Fase 4):');
    console.log(`  Encontros (Meeting): ${fase4.meetings}`);
    console.log(`  Presencas (MeetingAttendance): ${fase4.attendances}`);
    console.log(`  Equipe por encontro (MeetingTeamParticipation): ${fase4.teamParticipations}`);
}
main()
    .catch((error) => {
    console.error('Erro ao executar o seed:', error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map