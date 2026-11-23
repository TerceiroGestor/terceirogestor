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
import { createCipheriv, hkdfSync, randomBytes } from 'crypto';

export type EncryptedPayload = {
  dataEnc: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  tag: Uint8Array<ArrayBuffer>;
};

export function parseMasterKey(masterKey: string): Buffer {
  const trimmed = masterKey.trim();
  if (!trimmed) {
    throw new Error('PII_MASTER_KEY is not set');
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(trimmed, 'base64');
  } catch {
    throw new Error('PII_MASTER_KEY must be base64');
  }
  if (bytes.length < 32) {
    throw new Error('PII_MASTER_KEY must be at least 32 bytes (base64)');
  }
  return bytes;
}

export function deriveTenantKey(masterKey: Buffer, tenantId: string): Buffer {
  const salt = Buffer.from(tenantId, 'utf8');
  const info = Buffer.from('terceirogestor:pii:v1', 'utf8');
  return Buffer.from(hkdfSync('sha256', masterKey, salt, info, 32));
}

export function encryptJson(key: Buffer, payload: unknown): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const input = Buffer.from(JSON.stringify(payload), 'utf8');
  const dataEnc = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    dataEnc: Uint8Array.from(dataEnc),
    iv: Uint8Array.from(iv),
    tag: Uint8Array.from(tag),
  };
}
