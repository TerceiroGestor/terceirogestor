import { randomUUID } from 'crypto';
import { fakerPT_BR } from '@faker-js/faker';

// Seed fixo - todo `npx prisma db seed` gera exatamente os mesmos dados
// (mesma convencao do resto do seed.ts, que usa UUIDs fixos em vez de
// gerados - reprodutibilidade entre ambientes/maquinas).
fakerPT_BR.seed(20260101);

export const faker = fakerPT_BR;

export function newId(): string {
  return randomUUID();
}

export function chance(probability: number): boolean {
  return faker.number.float({ min: 0, max: 1 }) < probability;
}

export function pick<T>(items: readonly T[]): T {
  return faker.helpers.arrayElement(items as T[]);
}

export function pickWeighted<T>(
  options: { value: T; weight: number }[],
): T {
  return faker.helpers.weightedArrayElement(options);
}

/**
 * CPF com digitos verificadores validos de verdade (mesmo algoritmo de
 * `src/core/utils/cpf.ts` - `isValidCpfDigits`) - sem isso, qualquer tela
 * que reabra o CPF gerado e tente salvar de novo (ex.: editar outro campo
 * do mesmo registro de documentos) seria rejeitada pela validacao real do
 * backend (`normalizeCpfDigitsOrNull`, `people.service.ts`).
 */
export function randomCpfDigits(): string {
  const base = Array.from({ length: 9 }, () => faker.number.int({ min: 0, max: 9 }));
  const calc = (digits: number[], len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) sum += digits[i] * (len + 1 - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(base, 9);
  const withD1 = [...base, d1];
  const d2 = calc(withD1, 10);
  return [...withD1, d2].join('');
}

/** Sem digito verificador real (nao validado pelo backend, so tamanho). */
export function randomNisDigits(): string {
  return faker.string.numeric(11);
}

/** Sem digito verificador real (nao validado pelo backend, so tamanho). */
export function randomCnsDigits(): string {
  return faker.string.numeric(15);
}

export function randomRg(): string {
  const n = faker.string.numeric(9);
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}-${n.slice(8, 9)}`;
}

export function formatCpf(digits: string): string {
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
] as const;

export function randomAddress() {
  const spot = pick(NEIGHBORHOODS);
  return {
    cep: spot.cep,
    street: faker.location.street(),
    number: String(faker.number.int({ min: 1, max: 2400 })),
    neighborhood: spot.neighborhood,
    city: 'São Paulo',
    state: 'SP',
    ddd: '11',
  };
}

export function randomPhone(): string {
  return `+55 11 9${faker.string.numeric(4)}-${faker.string.numeric(4)}`;
}

export function randomDateBetween(from: Date | string, to: Date | string): Date {
  return faker.date.between({ from, to });
}

export function ageToBirthdate(min: number, max: number, mode: 'age' = 'age'): Date {
  return faker.date.birthdate({ min, max, mode });
}
