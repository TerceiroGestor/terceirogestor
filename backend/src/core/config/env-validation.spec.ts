import { randomBytes } from 'crypto';
import { validateEnv } from './env-validation';

const VALID_BASE64_KEY = randomBytes(32).toString('base64');
const VALID_HEX_KEY = randomBytes(32).toString('hex');

function validConfig(overrides: Record<string, unknown> = {}) {
  return {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'some-secret',
    PII_MASTER_KEY: VALID_BASE64_KEY,
    TOTP_ENCRYPTION_KEY: VALID_HEX_KEY,
    // alguma variável opcional, só pra provar que ela não é descartada
    WEB_URL: 'http://localhost:3000',
    ...overrides,
  };
}

describe('validateEnv', () => {
  it('aceita uma configuração com todas as variáveis obrigatórias presentes e válidas', () => {
    const config = validConfig();
    expect(validateEnv(config)).toEqual(config);
  });

  it.each([
    'DATABASE_URL',
    'JWT_SECRET',
    'PII_MASTER_KEY',
    'TOTP_ENCRYPTION_KEY',
  ])('recusa subir sem %s', (missingKey) => {
    const config = validConfig({ [missingKey]: undefined });
    expect(() => validateEnv(config)).toThrow();
  });

  it.each([
    'DATABASE_URL',
    'JWT_SECRET',
    'PII_MASTER_KEY',
    'TOTP_ENCRYPTION_KEY',
  ])('recusa subir com %s vazia', (emptyKey) => {
    const config = validConfig({ [emptyKey]: '' });
    expect(() => validateEnv(config)).toThrow();
  });

  it('recusa DATABASE_URL com formato inválido (não é postgres://)', () => {
    const config = validConfig({ DATABASE_URL: 'mysql://user:pass@host/db' });
    expect(() => validateEnv(config)).toThrow(/DATABASE_URL/);
  });

  it('recusa PII_MASTER_KEY com menos de 32 bytes', () => {
    const config = validConfig({ PII_MASTER_KEY: 'bem-curta' });
    expect(() => validateEnv(config)).toThrow(/PII_MASTER_KEY/);
  });

  it('recusa TOTP_ENCRYPTION_KEY com formato inválido', () => {
    const config = validConfig({ TOTP_ENCRYPTION_KEY: 'bem-curta' });
    expect(() => validateEnv(config)).toThrow(/TOTP_ENCRYPTION_KEY/);
  });

  it('não descarta variáveis opcionais que não fazem parte do schema', () => {
    const config = validConfig({ RESEND_API_KEY: 're_example' });
    const result = validateEnv(config);
    expect(result).toEqual(config);
  });
});
