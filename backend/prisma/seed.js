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
    programs: {
        musica: '11111111-1111-4111-8111-111111111401',
        familia: '11111111-1111-4111-8111-111111111402',
    },
    projects: {
        musicaManha: '11111111-1111-4111-8111-111111111501',
        apoioFamilias: '11111111-1111-4111-8111-111111111502',
    },
    peopleGroups: {
        c1m: '11111111-1111-4111-8111-111111111611',
        c2m: '11111111-1111-4111-8111-111111111612',
        c3m: '11111111-1111-4111-8111-111111111613',
        familiares: '11111111-1111-4111-8111-111111111614',
        funcionarios: '11111111-1111-4111-8111-111111111615',
        voluntarios: '11111111-1111-4111-8111-111111111616',
        parceiros: '11111111-1111-4111-8111-111111111617',
        c1t: '11111111-1111-4111-8111-111111111618',
    },
    actionTypes: {
        oficina: '11111111-1111-4111-8111-111111111901',
        encontro: '11111111-1111-4111-8111-111111111902',
        atendimento: '11111111-1111-4111-8111-111111111903',
    },
    actions: {
        acolhimento: '11111111-1111-4111-8111-111111112001',
        ensaioMeninos: '11111111-1111-4111-8111-111111112002',
        encontroC2m: '11111111-1111-4111-8111-111111112003',
        rodaFamilias: '11111111-1111-4111-8111-111111112004',
    },
    occurrences: {
        acolhimento: '11111111-1111-4111-8111-111111112101',
        encontroC2m: '11111111-1111-4111-8111-111111112102',
        rodaFamilias: '11111111-1111-4111-8111-111111112103',
    },
    goals: {
        frequenciaCoral: '11111111-1111-4111-8111-111111112301',
    },
    dailyAttendances: {
        acolhimentoPessoa0: '11111111-1111-4111-8111-111111112501',
        acolhimentoPessoa1: '11111111-1111-4111-8111-111111112502',
        encontroC2mPessoa2: '11111111-1111-4111-8111-111111112503',
        rodaFamiliasPessoa7: '11111111-1111-4111-8111-111111112504',
    },
    projectFundingSources: {
        musicaManhaMunicipal: '11111111-1111-4111-8111-111111112401',
        musicaManhaTerceiro: '11111111-1111-4111-8111-111111112402',
    },
};
const people = [
    {
        id: '11111111-1111-4111-8111-111111113001',
        fullName: 'Sabrina Melo',
        socialName: 'Sabrina Melo',
        birthDate: new Date('2017-03-11'),
        email: 'sabrina.melo@seed.local',
        phone: '+55 11 98888-1001',
        document: '101.101.101-01',
        rg: '10.101.101-1',
        nis: '101.10101.01-1',
        status: 'Ativo',
        personType: 'Funcionario',
        sex: 'Feminino',
        gender: 'Mulher',
        raceColor: 'Parda',
        maritalStatus: 'Solteira',
        nationality: 'Brasileira',
        avatarUrl: '/avatar-female.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113002',
        fullName: 'Ricardo Nunes',
        socialName: 'Ricardo Nunes',
        birthDate: new Date('2016-07-05'),
        email: 'ricardo.nunes@seed.local',
        phone: '+55 11 98888-1002',
        document: '102.102.102-02',
        rg: '10.202.202-2',
        nis: '102.10202.02-2',
        status: 'Ativo',
        personType: 'Oficineiro',
        sex: 'Masculino',
        gender: 'Homem',
        raceColor: 'Preta',
        maritalStatus: 'Solteiro',
        nationality: 'Brasileira',
        avatarUrl: '/avatar.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113003',
        fullName: 'Renata Vieira',
        socialName: 'Renata Vieira',
        birthDate: new Date('2014-09-20'),
        email: 'renata.vieira@seed.local',
        phone: '+55 11 98888-1003',
        document: '103.103.103-03',
        rg: '10.303.303-3',
        nis: '103.10303.03-3',
        status: 'Ativo',
        personType: 'Voluntario',
        sex: 'Feminino',
        gender: 'Mulher',
        raceColor: 'Branca',
        maritalStatus: 'Solteira',
        nationality: 'Brasileira',
        avatarUrl: '/avatar-female.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113004',
        fullName: 'Pedro Gomes',
        socialName: 'Pedro Gomes',
        birthDate: new Date('2012-01-14'),
        email: 'pedro.gomes@seed.local',
        phone: '+55 11 98888-1004',
        document: '104.104.104-04',
        rg: '10.404.404-4',
        nis: '104.10404.04-4',
        status: 'Ativo',
        personType: 'Voluntario',
        sex: 'Masculino',
        gender: 'Homem',
        raceColor: 'Parda',
        maritalStatus: 'Solteiro',
        nationality: 'Brasileira',
        avatarUrl: '/avatar.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113005',
        fullName: 'Lorena Castro',
        socialName: 'Lorena Castro',
        birthDate: new Date('2015-11-22'),
        email: 'lorena.castro@seed.local',
        phone: '+55 11 98888-1005',
        document: '105.105.105-05',
        rg: '10.505.505-5',
        nis: '105.10505.05-5',
        status: 'Ativo',
        personType: 'Atendido',
        sex: 'Feminino',
        gender: 'Mulher',
        raceColor: 'Parda',
        maritalStatus: 'Solteira',
        nationality: 'Brasileira',
        avatarUrl: '/avatar-female.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113006',
        fullName: 'Joao Pedro Lima',
        socialName: 'Joao Pedro',
        birthDate: new Date('2018-05-09'),
        email: 'joao.pedro@seed.local',
        phone: '+55 11 98888-1006',
        document: '106.106.106-06',
        rg: '10.606.606-6',
        nis: '106.10606.06-6',
        status: 'Ativo',
        personType: 'Atendido',
        sex: 'Masculino',
        gender: 'Homem',
        raceColor: 'Branca',
        maritalStatus: 'Solteiro',
        nationality: 'Brasileira',
        avatarUrl: '/avatar.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113007',
        fullName: 'Marcia Melo',
        socialName: 'Marcia Melo',
        birthDate: new Date('1988-02-10'),
        email: 'marcia.melo@seed.local',
        phone: '+55 11 97777-2001',
        document: '201.201.201-01',
        rg: '20.101.101-1',
        nis: '201.20101.01-1',
        status: 'Ativo',
        personType: 'Parceiro',
        sex: 'Feminino',
        gender: 'Mulher',
        raceColor: 'Parda',
        maritalStatus: 'Casada',
        nationality: 'Brasileira',
        avatarUrl: '/avatar-female.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113008',
        fullName: 'Carlos Nunes',
        socialName: 'Carlos Nunes',
        birthDate: new Date('1985-08-18'),
        email: 'carlos.nunes@seed.local',
        phone: '+55 11 97777-2002',
        document: '202.202.202-02',
        rg: '20.202.202-2',
        nis: '202.20202.02-2',
        status: 'Ativo',
        personType: 'Familiar',
        sex: 'Masculino',
        gender: 'Homem',
        raceColor: 'Preta',
        maritalStatus: 'Casado',
        nationality: 'Brasileira',
        avatarUrl: '/avatar.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113009',
        fullName: 'Silvana Rocha',
        socialName: 'Sil Rocha',
        birthDate: new Date('1990-12-01'),
        email: 'silvana.rocha@seed.local',
        phone: '+55 11 97777-2003',
        document: '203.203.203-03',
        rg: '20.303.303-3',
        nis: '203.20303.03-3',
        status: 'Ativo',
        personType: 'Familiar',
        sex: 'Feminino',
        gender: 'Mulher',
        raceColor: 'Branca',
        maritalStatus: 'Solteira',
        nationality: 'Brasileira',
        avatarUrl: '/avatar-female.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113010',
        fullName: 'Bianca Torres',
        socialName: 'Bianca Torres',
        birthDate: new Date('1994-01-04'),
        email: 'bianca.torres@seed.local',
        phone: '+55 11 96666-3001',
        document: '301.301.301-01',
        rg: '30.101.101-1',
        nis: '301.30101.01-1',
        status: 'Ativo',
        personType: 'Atendido',
        sex: 'Feminino',
        gender: 'Mulher',
        raceColor: 'Parda',
        maritalStatus: 'Solteira',
        nationality: 'Brasileira',
        avatarUrl: '/avatar-female.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113011',
        fullName: 'Diego Sampaio',
        socialName: 'Diego Sampaio',
        birthDate: new Date('1987-04-16'),
        email: 'diego.sampaio@seed.local',
        phone: '+55 11 96666-3002',
        document: '302.302.302-02',
        rg: '30.202.202-2',
        nis: '302.30202.02-2',
        status: 'Ativo',
        personType: 'Atendido',
        sex: 'Masculino',
        gender: 'Homem',
        raceColor: 'Parda',
        maritalStatus: 'Casado',
        nationality: 'Brasileira',
        avatarUrl: '/avatar.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113012',
        fullName: 'Leila Prado',
        socialName: 'Leila Prado',
        birthDate: new Date('1981-06-29'),
        email: 'leila.prado@seed.local',
        phone: '+55 11 95555-4001',
        document: '401.401.401-01',
        rg: '40.101.101-1',
        nis: '401.40101.01-1',
        status: 'Ativo',
        personType: 'Atendido',
        sex: 'Feminino',
        gender: 'Mulher',
        raceColor: 'Branca',
        maritalStatus: 'Casada',
        nationality: 'Brasileira',
        avatarUrl: '/avatar-female.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113013',
        fullName: 'Mateus Prado',
        socialName: 'Mateus Prado',
        birthDate: new Date('1998-10-07'),
        email: 'mateus.prado@seed.local',
        phone: '+55 11 95555-4002',
        document: '402.402.402-02',
        rg: '40.202.202-2',
        nis: '402.40202.02-2',
        status: 'Ativo',
        personType: 'Atendido',
        sex: 'Masculino',
        gender: 'Homem',
        raceColor: 'Preta',
        maritalStatus: 'Solteiro',
        nationality: 'Brasileira',
        avatarUrl: '/avatar.jpg',
    },
    {
        id: '11111111-1111-4111-8111-111111113014',
        fullName: 'Instituto Parceiro Aurora',
        socialName: 'Aurora',
        birthDate: null,
        email: 'contato@aurora.seed.local',
        phone: '+55 11 94444-5001',
        document: '50.501.501/0001-01',
        rg: 'ISENTO',
        nis: '000.00000.00-0',
        status: 'Ativo',
        personType: 'Familiar',
        sex: null,
        gender: null,
        raceColor: null,
        maritalStatus: null,
        nationality: 'Brasileira',
        avatarUrl: '/avatar.jpg',
    },
];
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
            description: '<p>Base de testes focada em people, people-groups, projects, groups e actions.</p>',
            status: 'ACTIVE',
        },
    });
    await createPermissionsAndRoles(ids.tenant);
    await createUsers(ids.tenant);
    await prisma.person.createMany({
        data: people.map((person) => ({
            ...person,
            tenantId: ids.tenant,
            notes: 'Pessoa criada pelo seed de homologacao.',
            tags: person.personType,
            profileSummary: `${person.fullName} participa dos cenarios de teste.`,
        })),
    });
    await prisma.peopleGroup.createMany({
        data: [
            {
                id: ids.peopleGroups.c1m,
                tenantId: ids.tenant,
                name: 'C1M',
                groupType: 'CYCLE',
                category: 'Ciclo',
                description: 'Ciclo 1 da manha para faixa etaria inicial.',
                ageMin: 6,
                ageMax: 8,
                isActive: true,
            },
            {
                id: ids.peopleGroups.c2m,
                tenantId: ids.tenant,
                name: 'C2M',
                groupType: 'CYCLE',
                category: 'Ciclo',
                description: 'Ciclo 2 da manha.',
                ageMin: 9,
                ageMax: 11,
                isActive: true,
            },
            {
                id: ids.peopleGroups.c3m,
                tenantId: ids.tenant,
                name: 'C3M',
                groupType: 'CYCLE',
                category: 'Ciclo',
                description: 'Ciclo 3 da manha.',
                ageMin: 12,
                ageMax: 14,
                isActive: true,
            },
            {
                id: ids.peopleGroups.familiares,
                tenantId: ids.tenant,
                name: 'Familiares',
                groupType: 'SEGMENT',
                category: 'Publico',
                description: 'Familiares e responsaveis legais.',
                isActive: true,
            },
            {
                id: ids.peopleGroups.funcionarios,
                tenantId: ids.tenant,
                name: 'Funcionarios',
                groupType: 'TEAM_POOL',
                category: 'Equipe',
                description: 'Equipe contratada da instituicao.',
                isActive: true,
            },
            {
                id: ids.peopleGroups.voluntarios,
                tenantId: ids.tenant,
                name: 'Voluntarios',
                groupType: 'SEGMENT',
                category: 'Equipe',
                description: 'Voluntarios ativos.',
                isActive: true,
            },
            {
                id: ids.peopleGroups.parceiros,
                tenantId: ids.tenant,
                name: 'Parceiros',
                groupType: 'NETWORK',
                category: 'Relacionamento',
                description: 'Organizacoes apoiadoras e patrocinadoras.',
                isActive: true,
            },
            {
                id: ids.peopleGroups.c1t,
                tenantId: ids.tenant,
                name: 'C1T',
                groupType: 'CYCLE',
                category: 'Ciclo',
                description: 'Ciclo 1 da tarde.',
                ageMin: 6,
                ageMax: 8,
                isActive: true,
            },
        ],
    });
    const peopleGroupParticipations = [
        [ids.peopleGroups.c1m, people[0].id],
        [ids.peopleGroups.c1m, people[1].id],
        [ids.peopleGroups.c2m, people[2].id],
        [ids.peopleGroups.c3m, people[3].id],
        [ids.peopleGroups.c2m, people[4].id],
        [ids.peopleGroups.c1m, people[5].id],
        [ids.peopleGroups.familiares, people[6].id],
        [ids.peopleGroups.familiares, people[7].id],
        [ids.peopleGroups.familiares, people[8].id],
        [ids.peopleGroups.funcionarios, people[9].id],
        [ids.peopleGroups.funcionarios, people[10].id],
        [ids.peopleGroups.voluntarios, people[11].id],
        [ids.peopleGroups.voluntarios, people[12].id],
        [ids.peopleGroups.parceiros, people[13].id],
        [ids.peopleGroups.c1t, people[5].id],
    ];
    await prisma.peopleGroupParticipation.createMany({
        data: peopleGroupParticipations.map(([peopleGroupId, personId], index) => ({
            id: `11111111-1111-4111-8111-111111117${String(index + 1).padStart(3, '0')}`,
            tenantId: ids.tenant,
            peopleGroupId,
            personId,
            activeKey: `${peopleGroupId}:${personId}`,
            isActive: true,
            startsAt: new Date('2026-02-01T08:00:00Z'),
            internalNotes: 'Participacao global criada pelo seed.',
        })),
    });
    await prisma.program.createMany({
        data: [
            {
                id: ids.programs.musica,
                tenantId: ids.tenant,
                name: 'Programa Musica e Convivencia',
                type: 'SCFV',
                description: 'Programa principal para oficinas de musica e convivio.',
                internalNotes: 'Programa usado como base de homologacao.',
                status: 'ACTIVE',
                startsAt: new Date('2026-01-15T08:00:00Z'),
            },
            {
                id: ids.programs.familia,
                tenantId: ids.tenant,
                name: 'Programa Rede de Apoio Familiar',
                type: 'PAIF',
                description: 'Programa dedicado ao fortalecimento familiar.',
                internalNotes: 'Programa de apoio sociofamiliar.',
                status: 'ACTIVE',
                startsAt: new Date('2026-01-20T08:00:00Z'),
            },
        ],
    });
    await prisma.project.createMany({
        data: [
            {
                id: ids.projects.musicaManha,
                tenantId: ids.tenant,
                programId: ids.programs.musica,
                name: 'Projeto Musica Manha',
                description: 'Projeto voltado aos ciclos matutinos.',
                internalNotes: 'Projeto principal do seed.',
                status: 'ACTIVE',
                startsAt: new Date('2026-02-01T08:00:00Z'),
                endsAt: new Date('2026-12-01T08:00:00Z'),
            },
            {
                id: ids.projects.apoioFamilias,
                tenantId: ids.tenant,
                programId: ids.programs.familia,
                name: 'Projeto Apoio as Familias',
                description: 'Projeto para acompanhamento e fortalecimento das familias.',
                internalNotes: 'Projeto secundario do seed.',
                status: 'ACTIVE',
                startsAt: new Date('2026-02-05T08:00:00Z'),
                endsAt: new Date('2026-12-15T08:00:00Z'),
            },
        ],
    });
    await prisma.projectFundingSource.createMany({
        data: [
            {
                id: ids.projectFundingSources.musicaManhaMunicipal,
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                source: 'MUNICIPAL',
                name: 'Convenio SMADS 2026',
            },
            {
                id: ids.projectFundingSources.musicaManhaTerceiro,
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                source: 'TERCEIRO',
                name: 'Patrocinio Instituto Cultural Urna',
            },
        ],
    });
    await prisma.goal.createMany({
        data: [
            {
                id: ids.goals.frequenciaCoral,
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                title: 'Aumentar a frequencia media do Coral',
                description: 'Meta do Plano de Trabalho: elevar a frequencia media mensal dos participantes do Coral.',
            },
        ],
    });
    await prisma.projectPeopleGroup.createMany({
        data: [
            {
                id: '11111111-1111-4111-8111-111111117901',
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                peopleGroupId: ids.peopleGroups.c1m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111117902',
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                peopleGroupId: ids.peopleGroups.c2m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111117903',
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                peopleGroupId: ids.peopleGroups.c3m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111117904',
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                peopleGroupId: ids.peopleGroups.familiares,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111117905',
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                peopleGroupId: ids.peopleGroups.funcionarios,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111117906',
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                peopleGroupId: ids.peopleGroups.voluntarios,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111117907',
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                peopleGroupId: ids.peopleGroups.parceiros,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111117908',
                tenantId: ids.tenant,
                projectId: ids.projects.apoioFamilias,
                peopleGroupId: ids.peopleGroups.familiares,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111117909',
                tenantId: ids.tenant,
                projectId: ids.projects.apoioFamilias,
                peopleGroupId: ids.peopleGroups.funcionarios,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111117910',
                tenantId: ids.tenant,
                projectId: ids.projects.apoioFamilias,
                peopleGroupId: ids.peopleGroups.voluntarios,
                participationKind: 'TEAM',
            },
        ],
    });
    const enrollments = [
        {
            id: '11111111-1111-4111-8111-111111114001',
            projectId: ids.projects.musicaManha,
            personId: people[0].id,
            role: 'PUBLICO_ATENDIDO',
            startsAt: new Date('2026-02-03T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114002',
            projectId: ids.projects.musicaManha,
            personId: people[1].id,
            role: 'PUBLICO_ATENDIDO',
            startsAt: new Date('2026-02-03T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114003',
            projectId: ids.projects.musicaManha,
            personId: people[2].id,
            role: 'PUBLICO_ATENDIDO',
            startsAt: new Date('2026-02-03T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114004',
            projectId: ids.projects.musicaManha,
            personId: people[3].id,
            role: 'PUBLICO_ATENDIDO',
            startsAt: new Date('2026-02-03T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114005',
            projectId: ids.projects.musicaManha,
            personId: people[6].id,
            role: 'FAMILIAR',
            startsAt: new Date('2026-02-10T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114006',
            projectId: ids.projects.musicaManha,
            personId: people[9].id,
            role: 'EQUIPE_TECNICA',
            startsAt: new Date('2026-02-01T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114007',
            projectId: ids.projects.musicaManha,
            personId: people[11].id,
            role: 'VOLUNTARIO',
            startsAt: new Date('2026-02-01T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114008',
            projectId: ids.projects.musicaManha,
            personId: people[13].id,
            role: 'PARCEIRO',
            startsAt: new Date('2026-02-01T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114009',
            projectId: ids.projects.apoioFamilias,
            personId: people[7].id,
            role: 'FAMILIAR',
            startsAt: new Date('2026-02-12T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114010',
            projectId: ids.projects.apoioFamilias,
            personId: people[8].id,
            role: 'FAMILIAR',
            startsAt: new Date('2026-02-12T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114011',
            projectId: ids.projects.apoioFamilias,
            personId: people[10].id,
            role: 'EQUIPE_TECNICA',
            startsAt: new Date('2026-02-05T08:00:00Z'),
        },
        {
            id: '11111111-1111-4111-8111-111111114012',
            projectId: ids.projects.apoioFamilias,
            personId: people[12].id,
            role: 'VOLUNTARIO',
            startsAt: new Date('2026-02-05T08:00:00Z'),
        },
    ];
    await prisma.projectEnrollment.createMany({
        data: enrollments.map((enrollment) => ({
            id: enrollment.id,
            tenantId: ids.tenant,
            projectId: enrollment.projectId,
            personId: enrollment.personId,
            status: 'ACTIVE',
            participationKind: enrollment.role === 'PUBLICO_ATENDIDO' || enrollment.role === 'FAMILIAR'
                ? 'PARTICIPANT'
                : 'TEAM',
            role: enrollment.role,
            startsAt: enrollment.startsAt,
        })),
    });
    await prisma.activityType.createMany({
        data: [
            {
                id: ids.actionTypes.oficina,
                tenantId: ids.tenant,
                name: 'Oficina',
                description: 'Acoes praticas do projeto.',
                target: 'PROJECT',
                isActive: true,
            },
            {
                id: ids.actionTypes.encontro,
                tenantId: ids.tenant,
                name: 'Encontro de Segmento',
                description: 'Acoes focadas em um segmento do projeto.',
                target: 'PEOPLE_GROUP',
                isActive: true,
            },
            {
                id: ids.actionTypes.atendimento,
                tenantId: ids.tenant,
                name: 'Atividade de Grupos',
                description: 'Atividades de Grupos operacionais.',
                target: 'PEOPLE_GROUP',
                isActive: true,
            },
        ],
    });
    await prisma.activity.createMany({
        data: [
            {
                id: ids.actions.acolhimento,
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                createdByUserId: ids.users.gestor,
                actionTypeId: ids.actionTypes.oficina,
                title: 'Acolhimento de abertura',
                description: 'Recepcao inicial de participantes e equipe.',
                completionPercent: 100,
                status: 'EXECUTED',
                plannedStartAt: new Date('2026-02-06T12:00:00Z'),
                plannedEndAt: new Date('2026-02-06T14:00:00Z'),
                executedStartAt: new Date('2026-02-06T12:10:00Z'),
                executedEndAt: new Date('2026-02-06T13:50:00Z'),
            },
            {
                id: ids.actions.ensaioMeninos,
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                createdByUserId: ids.users.gestor,
                actionTypeId: ids.actionTypes.atendimento,
                goalId: ids.goals.frequenciaCoral,
                title: 'Ensaio dos meninos da percussao',
                description: 'Atividade direcionada ao Grupos operacional.',
                completionPercent: 0,
                status: 'PLANNED',
                plannedStartAt: new Date('2026-03-18T13:00:00Z'),
                plannedEndAt: new Date('2026-03-18T15:00:00Z'),
            },
            {
                id: ids.actions.encontroC2m,
                tenantId: ids.tenant,
                projectId: ids.projects.musicaManha,
                createdByUserId: ids.users.gestor,
                actionTypeId: ids.actionTypes.encontro,
                title: 'Encontro do segmento C2M',
                description: 'Encontro especifico para o segmento C2M.',
                completionPercent: 0,
                status: 'PLANNED',
                plannedStartAt: new Date('2026-03-22T12:30:00Z'),
                plannedEndAt: new Date('2026-03-22T14:00:00Z'),
            },
            {
                id: ids.actions.rodaFamilias,
                tenantId: ids.tenant,
                projectId: ids.projects.apoioFamilias,
                createdByUserId: ids.users.admin,
                actionTypeId: ids.actionTypes.encontro,
                title: 'Roda de conversa com familias',
                description: 'Encontro de escuta e fortalecimento de vinculos.',
                completionPercent: 100,
                status: 'EXECUTED',
                plannedStartAt: new Date('2026-02-20T17:00:00Z'),
                plannedEndAt: new Date('2026-02-20T19:00:00Z'),
                executedStartAt: new Date('2026-02-20T17:10:00Z'),
                executedEndAt: new Date('2026-02-20T18:55:00Z'),
            },
        ],
    });
    await prisma.activityPeopleGroup.createMany({
        data: [
            {
                id: '11111111-1111-4111-8111-111111119111',
                tenantId: ids.tenant,
                actionId: ids.actions.ensaioMeninos,
                peopleGroupId: ids.peopleGroups.c1m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111119101',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                peopleGroupId: ids.peopleGroups.c1m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111119102',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                peopleGroupId: ids.peopleGroups.c2m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111119103',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                peopleGroupId: ids.peopleGroups.c3m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111119104',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                peopleGroupId: ids.peopleGroups.funcionarios,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111119105',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                peopleGroupId: ids.peopleGroups.voluntarios,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111119106',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                peopleGroupId: ids.peopleGroups.parceiros,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111119107',
                tenantId: ids.tenant,
                actionId: ids.actions.encontroC2m,
                peopleGroupId: ids.peopleGroups.c2m,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111119108',
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                peopleGroupId: ids.peopleGroups.familiares,
                participationKind: 'PARTICIPANT',
            },
            {
                id: '11111111-1111-4111-8111-111111119109',
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                peopleGroupId: ids.peopleGroups.funcionarios,
                participationKind: 'TEAM',
            },
            {
                id: '11111111-1111-4111-8111-111111119110',
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                peopleGroupId: ids.peopleGroups.voluntarios,
                participationKind: 'TEAM',
            },
        ],
    });
    // Um encontro por atividade já executada/agendada, pra presença (abaixo)
    // ter sempre um occurrenceId - Fase 3 do plano SCFV.
    await prisma.meeting.createMany({
        data: [
            {
                id: ids.occurrences.acolhimento,
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                scheduledDate: new Date('2026-02-06'),
                startTime: new Date('2026-02-06T12:10:00Z'),
                endTime: new Date('2026-02-06T13:50:00Z'),
                status: 'DONE',
                planHtml: '<p>Recepcao, alinhamento e apresentacao da proposta.</p>',
                executedHtml: '<p>Acolhimento realizado com roda inicial.</p>',
                conclusionHtml: '<p>Boa adesao do publico e da equipe.</p>',
            },
            {
                id: ids.occurrences.encontroC2m,
                tenantId: ids.tenant,
                actionId: ids.actions.encontroC2m,
                scheduledDate: new Date('2026-03-22'),
                startTime: new Date('2026-03-22T12:30:00Z'),
                endTime: new Date('2026-03-22T14:00:00Z'),
                status: 'SCHEDULED',
                planHtml: '<p>Trabalhar integracao e ritmo corporal.</p>',
            },
            {
                id: ids.occurrences.rodaFamilias,
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                scheduledDate: new Date('2026-02-20'),
                startTime: new Date('2026-02-20T17:10:00Z'),
                endTime: new Date('2026-02-20T18:55:00Z'),
                status: 'DONE',
                planHtml: '<p>Escuta ativa e orientacoes socioassistenciais.</p>',
                executedHtml: '<p>Participacao consistente das familias presentes.</p>',
                conclusionHtml: '<p>Encaminhamentos definidos para o proximo mes.</p>',
            },
        ],
    });
    await prisma.actionOccurrenceTeamGroup.createMany({
        data: [
            {
                id: '11111111-1111-4111-8111-111111112201',
                tenantId: ids.tenant,
                occurrenceId: ids.occurrences.acolhimento,
                peopleGroupId: ids.peopleGroups.funcionarios,
            },
            {
                id: '11111111-1111-4111-8111-111111112202',
                tenantId: ids.tenant,
                occurrenceId: ids.occurrences.acolhimento,
                peopleGroupId: ids.peopleGroups.voluntarios,
            },
        ],
    });
    await prisma.meetingAttendance.createMany({
        data: [
            {
                id: '11111111-1111-4111-8111-111111115001',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                occurrenceId: ids.occurrences.acolhimento,
                enrollmentId: '11111111-1111-4111-8111-111111114001',
                status: 'PRESENT',
                qualityScore: 5,
                qualityNotes: 'Chegou engajada e participou de toda a roda.',
                isHighlight: true,
            },
            {
                id: '11111111-1111-4111-8111-111111115002',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                occurrenceId: ids.occurrences.acolhimento,
                enrollmentId: '11111111-1111-4111-8111-111111114002',
                status: 'PRESENT',
                qualityScore: 4,
                qualityNotes: 'Participacao positiva no acolhimento.',
            },
            {
                id: '11111111-1111-4111-8111-111111115003',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                occurrenceId: ids.occurrences.acolhimento,
                enrollmentId: '11111111-1111-4111-8111-111111114003',
                status: 'ABSENT',
                notes: 'Faltou por consulta medica.',
            },
            {
                id: '11111111-1111-4111-8111-111111115004',
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                occurrenceId: ids.occurrences.rodaFamilias,
                enrollmentId: '11111111-1111-4111-8111-111111114009',
                status: 'PRESENT',
                qualityScore: 5,
                qualityNotes: 'Contribuiu com relatos relevantes.',
                isHighlight: true,
            },
            {
                id: '11111111-1111-4111-8111-111111115005',
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                occurrenceId: ids.occurrences.rodaFamilias,
                enrollmentId: '11111111-1111-4111-8111-111111114010',
                status: 'EXCUSED',
                notes: 'Ausencia justificada por trabalho.',
            },
            {
                id: '11111111-1111-4111-8111-111111115006',
                tenantId: ids.tenant,
                actionId: ids.actions.encontroC2m,
                occurrenceId: ids.occurrences.encontroC2m,
                enrollmentId: '11111111-1111-4111-8111-111111114003',
                status: 'PRESENT',
                qualityScore: 5,
                qualityNotes: 'Participacao ativa no encontro do segmento.',
            },
        ],
    });
    // Fase 3 do plano mestre: presenca diaria derivada das presencas PRESENT
    // acima - 1 linha por pessoa/dia, mesmo quando ha mais de um encontro no
    // mesmo dia (reflete o que syncDailyAttendanceForPersonDate calcularia).
    await prisma.dailyAttendance.createMany({
        data: [
            {
                id: ids.dailyAttendances.acolhimentoPessoa0,
                tenantId: ids.tenant,
                personId: people[0].id,
                date: new Date('2026-02-06'),
            },
            {
                id: ids.dailyAttendances.acolhimentoPessoa1,
                tenantId: ids.tenant,
                personId: people[1].id,
                date: new Date('2026-02-06'),
            },
            {
                id: ids.dailyAttendances.encontroC2mPessoa2,
                tenantId: ids.tenant,
                personId: people[2].id,
                date: new Date('2026-03-22'),
            },
            {
                id: ids.dailyAttendances.rodaFamiliasPessoa7,
                tenantId: ids.tenant,
                personId: people[7].id,
                date: new Date('2026-02-20'),
            },
        ],
    });
    await prisma.projectActionPeopleParticipation.createMany({
        data: [
            {
                id: '11111111-1111-4111-8111-111111116001',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                personId: people[9].id,
                enrollmentId: '11111111-1111-4111-8111-111111114006',
                participationKind: 'TEAM',
                role: 'RESPONSAVEL_TECNICO',
                activeKey: `${ids.actions.acolhimento}:${people[9].id}:RESPONSAVEL_TECNICO`,
                isActive: true,
            },
            {
                id: '11111111-1111-4111-8111-111111116002',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                personId: people[11].id,
                enrollmentId: '11111111-1111-4111-8111-111111114007',
                participationKind: 'TEAM',
                role: 'VOLUNTARIO',
                activeKey: `${ids.actions.acolhimento}:${people[11].id}:VOLUNTARIO`,
                isActive: true,
            },
            {
                id: '11111111-1111-4111-8111-111111116003',
                tenantId: ids.tenant,
                actionId: ids.actions.acolhimento,
                personId: people[13].id,
                enrollmentId: '11111111-1111-4111-8111-111111114008',
                participationKind: 'TEAM',
                role: 'APOIO',
                activeKey: `${ids.actions.acolhimento}:${people[13].id}:APOIO`,
                isActive: true,
            },
            {
                id: '11111111-1111-4111-8111-111111116004',
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                personId: people[10].id,
                enrollmentId: '11111111-1111-4111-8111-111111114011',
                participationKind: 'TEAM',
                role: 'FACILITADOR',
                activeKey: `${ids.actions.rodaFamilias}:${people[10].id}:FACILITADOR`,
                isActive: true,
            },
            {
                id: '11111111-1111-4111-8111-111111116005',
                tenantId: ids.tenant,
                actionId: ids.actions.rodaFamilias,
                personId: people[12].id,
                enrollmentId: '11111111-1111-4111-8111-111111114012',
                participationKind: 'TEAM',
                role: 'APOIO',
                activeKey: `${ids.actions.rodaFamilias}:${people[12].id}:APOIO`,
                isActive: true,
            },
        ],
    });
    await prisma.auditLog.createMany({
        data: [
            {
                id: '11111111-1111-4111-8111-111111118001',
                tenantId: ids.tenant,
                userId: ids.users.gestor,
                entity: 'PeopleGroup',
                entityId: ids.peopleGroups.c1m,
                action: 'CREATE',
                after: { name: 'C1M', category: 'Ciclo' },
                createdAt: new Date('2026-02-01T08:05:00Z'),
            },
            {
                id: '11111111-1111-4111-8111-111111118002',
                tenantId: ids.tenant,
                userId: ids.users.gestor,
                entity: 'PeopleGroupParticipation',
                entityId: '11111111-1111-4111-8111-111111117001',
                action: 'CREATE',
                after: { peopleGroup: 'C1M', person: people[0].fullName },
                createdAt: new Date('2026-02-01T08:10:00Z'),
            },
            {
                id: '11111111-1111-4111-8111-111111118003',
                tenantId: ids.tenant,
                userId: ids.users.admin,
                entity: 'Project',
                entityId: ids.projects.musicaManha,
                action: 'CREATE',
                after: { name: 'Projeto Musica Manha' },
                createdAt: new Date('2026-02-01T08:15:00Z'),
            },
            {
                id: '11111111-1111-4111-8111-111111118006',
                tenantId: ids.tenant,
                userId: ids.users.admin,
                entity: 'ProjectEnrollment',
                entityId: '11111111-1111-4111-8111-111111114006',
                action: 'UPDATE',
                before: { role: 'PUBLICO_ATENDIDO' },
                after: { role: 'EQUIPE_TECNICA' },
                createdAt: new Date('2026-02-05T10:00:00Z'),
            },
            {
                id: '11111111-1111-4111-8111-111111118007',
                tenantId: ids.tenant,
                userId: ids.users.gestor,
                entity: 'ProjectAction',
                entityId: ids.actions.rodaFamilias,
                action: 'CREATE',
                after: { title: 'Roda de conversa com familias' },
                createdAt: new Date('2026-02-20T16:40:00Z'),
            },
        ],
    });
    await seedPantryLikeDomain(ids.tenant, PANTRY_SEED_CONFIG);
    await seedPantryLikeDomain(ids.tenant, DEPOSIT_SEED_CONFIG);
    console.log('Seed executado com sucesso.');
    console.log(`Tenant: instituicao-exemplo (${ids.tenant})`);
    console.log('Usuarios:');
    console.log('  admin@seed.local / Admin@123');
    console.log('  gestor@seed.local / User@123');
    console.log('  atendimento@seed.local / User@123');
    console.log('Projetos seed: Projeto Musica Manha, Projeto Apoio as Familias');
    console.log('Pantry/Deposit seed: 10 itens, 10 doadores/fontes, 20 entradas e 15 saidas em cada modulo.');
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