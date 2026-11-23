import type { PrismaClient } from '../../src/generated/prisma';
declare const CYCLES: readonly [{
    readonly key: "c1m";
    readonly name: "C1M";
    readonly description: "Ciclo 1 da manha.";
    readonly ageMin: 6;
    readonly ageMax: 8;
}, {
    readonly key: "c2m";
    readonly name: "C2M";
    readonly description: "Ciclo 2 da manha.";
    readonly ageMin: 9;
    readonly ageMax: 11;
}, {
    readonly key: "c3m";
    readonly name: "C3M";
    readonly description: "Ciclo 3 da manha.";
    readonly ageMin: 12;
    readonly ageMax: 14;
}, {
    readonly key: "c1t";
    readonly name: "C1T";
    readonly description: "Ciclo 1 da tarde.";
    readonly ageMin: 6;
    readonly ageMax: 8;
}, {
    readonly key: "c2t";
    readonly name: "C2T";
    readonly description: "Ciclo 2 da tarde.";
    readonly ageMin: 9;
    readonly ageMax: 11;
}, {
    readonly key: "c3t";
    readonly name: "C3T";
    readonly description: "Ciclo 3 da tarde.";
    readonly ageMin: 12;
    readonly ageMax: 14;
}];
declare const SEGMENTS: readonly [{
    readonly key: "familiares";
    readonly name: "Familiares";
    readonly purpose: "PUBLICO";
    readonly description: "Familiares e responsaveis legais.";
}, {
    readonly key: "funcionarios";
    readonly name: "Funcionarios";
    readonly purpose: "EQUIPE";
    readonly description: "Equipe contratada da instituicao.";
}, {
    readonly key: "voluntarios";
    readonly name: "Voluntarios";
    readonly purpose: "EQUIPE";
    readonly description: "Voluntarios ativos.";
}, {
    readonly key: "oficineiros";
    readonly name: "Oficineiros";
    readonly purpose: "EQUIPE";
    readonly description: "Oficineiros que conduzem atividades.";
}, {
    readonly key: "parceiros";
    readonly name: "Parceiros";
    readonly purpose: "PUBLICO";
    readonly description: "Organizacoes apoiadoras e patrocinadoras.";
}, {
    readonly key: "doadores";
    readonly name: "Doadores";
    readonly purpose: "PUBLICO";
    readonly description: "Doadores pessoa fisica/juridica.";
}];
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
    familiaresByAtendido: Record<string, string[]>;
    householdSiblingsByAtendido: Record<string, string[]>;
};
export declare function seedPeopleFase1(prisma: PrismaClient, tenantId: string): Promise<PeopleFase1Result>;
export {};
