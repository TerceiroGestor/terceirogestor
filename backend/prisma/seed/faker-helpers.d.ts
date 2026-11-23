export declare const faker: import("@faker-js/faker").Faker;
export declare function newId(): string;
export declare function chance(probability: number): boolean;
export declare function pick<T>(items: readonly T[]): T;
export declare function pickWeighted<T>(options: {
    value: T;
    weight: number;
}[]): T;
/**
 * CPF com digitos verificadores validos de verdade (mesmo algoritmo de
 * `src/core/utils/cpf.ts` - `isValidCpfDigits`) - sem isso, qualquer tela
 * que reabra o CPF gerado e tente salvar de novo (ex.: editar outro campo
 * do mesmo registro de documentos) seria rejeitada pela validacao real do
 * backend (`normalizeCpfDigitsOrNull`, `people.service.ts`).
 */
export declare function randomCpfDigits(): string;
/** Sem digito verificador real (nao validado pelo backend, so tamanho). */
export declare function randomNisDigits(): string;
/** Sem digito verificador real (nao validado pelo backend, so tamanho). */
export declare function randomCnsDigits(): string;
export declare function randomRg(): string;
export declare function formatCpf(digits: string): string;
export declare function randomAddress(): {
    cep: "05816000" | "04890000" | "04281000" | "08471000" | "02960000" | "04840000" | "03960000" | "08210000";
    street: string;
    number: string;
    neighborhood: "Capão Redondo" | "Jardim Ângela" | "Heliópolis" | "Cidade Tiradentes" | "Brasilândia" | "Grajaú" | "São Mateus" | "Itaquera";
    city: string;
    state: string;
    ddd: string;
};
export declare function randomPhone(): string;
export declare function randomDateBetween(from: Date | string, to: Date | string): Date;
export declare function ageToBirthdate(min: number, max: number, mode?: 'age'): Date;
