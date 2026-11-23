"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMasterKey = parseMasterKey;
exports.deriveTenantKey = deriveTenantKey;
exports.encryptJson = encryptJson;
// Copia deliberada de `src/core/pii/pii-crypto.ts` (3 funcoes puras, sem
// nenhuma dependencia do Nest) - NAO importar o arquivo original daqui.
// `npm run build:seed` compila `prisma/seed.ts` isolado (um unico
// arquivo passado pro `tsc`, sem tsconfig/rootDir proprio - ver
// package.json). Um import de valor (nao so tipo) de fora de `prisma/`
// faz o `tsc` recalcular o rootDir comum pra `backend/` inteiro e
// aninhar a saida (`prisma/prisma/seed.js`, `prisma/src/...`) em vez de
// gerar `prisma/seed.js` no lugar esperado por `prisma.seed` no
// package.json e pelo `db:seed`/`seed` scripts (achado em 2026-11-22,
// construindo a Fase 1 do seed de Pessoas). Manter esse arquivo em sync
// manualmente se o algoritmo de `pii-crypto.ts` mudar - e só criptografia
// simetrica basica (AES-256-GCM), não deve mudar com frequência.
const crypto_1 = require("crypto");
function parseMasterKey(masterKey) {
    const trimmed = masterKey.trim();
    if (!trimmed) {
        throw new Error('PII_MASTER_KEY is not set');
    }
    let bytes;
    try {
        bytes = Buffer.from(trimmed, 'base64');
    }
    catch {
        throw new Error('PII_MASTER_KEY must be base64');
    }
    if (bytes.length < 32) {
        throw new Error('PII_MASTER_KEY must be at least 32 bytes (base64)');
    }
    return bytes;
}
function deriveTenantKey(masterKey, tenantId) {
    const salt = Buffer.from(tenantId, 'utf8');
    const info = Buffer.from('terceirogestor:pii:v1', 'utf8');
    return Buffer.from((0, crypto_1.hkdfSync)('sha256', masterKey, salt, info, 32));
}
function encryptJson(key, payload) {
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
    const input = Buffer.from(JSON.stringify(payload), 'utf8');
    const dataEnc = Buffer.concat([cipher.update(input), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        dataEnc: Uint8Array.from(dataEnc),
        iv: Uint8Array.from(iv),
        tag: Uint8Array.from(tag),
    };
}
//# sourceMappingURL=pii-crypto-for-seed.js.map