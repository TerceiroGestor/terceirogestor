"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.faker = void 0;
exports.newId = newId;
exports.chance = chance;
exports.pick = pick;
exports.pickWeighted = pickWeighted;
exports.randomCpfDigits = randomCpfDigits;
exports.randomNisDigits = randomNisDigits;
exports.randomCnsDigits = randomCnsDigits;
exports.randomRg = randomRg;
exports.formatCpf = formatCpf;
exports.randomAddress = randomAddress;
exports.randomPhone = randomPhone;
exports.randomDateBetween = randomDateBetween;
exports.ageToBirthdate = ageToBirthdate;
const crypto_1 = require("crypto");
const faker_1 = require("@faker-js/faker");
// Seed fixo - todo `npx prisma db seed` gera exatamente os mesmos dados
// (mesma convencao do resto do seed.ts, que usa UUIDs fixos em vez de
// gerados - reprodutibilidade entre ambientes/maquinas).
faker_1.fakerPT_BR.seed(20260101);
exports.faker = faker_1.fakerPT_BR;
function newId() {
    return (0, crypto_1.randomUUID)();
}
function chance(probability) {
    return exports.faker.number.float({ min: 0, max: 1 }) < probability;
}
function pick(items) {
    return exports.faker.helpers.arrayElement(items);
}
function pickWeighted(options) {
    return exports.faker.helpers.weightedArrayElement(options);
}
/**
 * CPF com digitos verificadores validos de verdade (mesmo algoritmo de
 * `src/core/utils/cpf.ts` - `isValidCpfDigits`) - sem isso, qualquer tela
 * que reabra o CPF gerado e tente salvar de novo (ex.: editar outro campo
 * do mesmo registro de documentos) seria rejeitada pela validacao real do
 * backend (`normalizeCpfDigitsOrNull`, `people.service.ts`).
 */
function randomCpfDigits() {
    const base = Array.from({ length: 9 }, () => exports.faker.number.int({ min: 0, max: 9 }));
    const calc = (digits, len) => {
        let sum = 0;
        for (let i = 0; i < len; i += 1)
            sum += digits[i] * (len + 1 - i);
        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    };
    const d1 = calc(base, 9);
    const withD1 = [...base, d1];
    const d2 = calc(withD1, 10);
    return [...withD1, d2].join('');
}
/** Sem digito verificador real (nao validado pelo backend, so tamanho). */
function randomNisDigits() {
    return exports.faker.string.numeric(11);
}
/** Sem digito verificador real (nao validado pelo backend, so tamanho). */
function randomCnsDigits() {
    return exports.faker.string.numeric(15);
}
function randomRg() {
    const n = exports.faker.string.numeric(9);
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}-${n.slice(8, 9)}`;
}
function formatCpf(digits) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}
/**
 * Bairros/CEPs de uma unica regiao (zona sul/leste de Sao Paulo, DDD 11) -
 * de proposito, nao sorteado em qualquer cidade do Brasil: uma
 * organizacao do terceiro setor atende uma regiao, nao o pais inteiro, e
 * manter cidade/UF/DDD consistentes entre as pessoas e mais realista pra
 * quem for conferir os dados na tela.
 */
const NEIGHBORHOODS = [
    { neighborhood: 'Capão Redondo', cep: '05816000' },
    { neighborhood: 'Jardim Ângela', cep: '04890000' },
    { neighborhood: 'Heliópolis', cep: '04281000' },
    { neighborhood: 'Cidade Tiradentes', cep: '08471000' },
    { neighborhood: 'Brasilândia', cep: '02960000' },
    { neighborhood: 'Grajaú', cep: '04840000' },
    { neighborhood: 'São Mateus', cep: '03960000' },
    { neighborhood: 'Itaquera', cep: '08210000' },
];
function randomAddress() {
    const spot = pick(NEIGHBORHOODS);
    return {
        cep: spot.cep,
        street: exports.faker.location.street(),
        number: String(exports.faker.number.int({ min: 1, max: 2400 })),
        neighborhood: spot.neighborhood,
        city: 'São Paulo',
        state: 'SP',
        ddd: '11',
    };
}
function randomPhone() {
    return `+55 11 9${exports.faker.string.numeric(4)}-${exports.faker.string.numeric(4)}`;
}
function randomDateBetween(from, to) {
    return exports.faker.date.between({ from, to });
}
function ageToBirthdate(min, max, mode = 'age') {
    return exports.faker.date.birthdate({ min, max, mode });
}
//# sourceMappingURL=faker-helpers.js.map