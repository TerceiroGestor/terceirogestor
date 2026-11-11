import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';
import { createPrismaAdapter } from '../prisma/prisma-adapter';
import { parseMasterKey } from '../pii/pii-crypto';
import { parseKey as parseTotpEncryptionKey } from '../auth/mfa/mfa-crypto.service';

/**
 * Variáveis que o app precisa pra subir corretamente. Sem isso, ele hoje
 * sobe normalmente e só quebra depois, na primeira requisição que usa a
 * variável faltante (foi o que causou o crash do backend em 2026-11-05,
 * com chaves placeholder no `.env` — ver item 9 de docs/auditoria-riscos.md).
 */
export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL é obrigatória' })
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET é obrigatória' })
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty({ message: 'PII_MASTER_KEY é obrigatória' })
  PII_MASTER_KEY!: string;

  @IsString()
  @IsNotEmpty({ message: 'TOTP_ENCRYPTION_KEY é obrigatória' })
  TOTP_ENCRYPTION_KEY!: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    throw new Error(
      `Configuração inválida — variáveis de ambiente obrigatórias ausentes ou vazias:\n${messages.join('\n')}`,
    );
  }

  // As três linhas abaixo reaproveitam o mesmo parsing que cada serviço já
  // faz (PrismaService, PiiCryptoService, MfaCryptoService), só que agora
  // no boot, pra falhar rápido se a variável existe mas tem formato errado
  // (não é mais uma simples ausência, pega chave malformada também).
  try {
    createPrismaAdapter(validated.DATABASE_URL);
  } catch (error) {
    throw new Error(`DATABASE_URL inválida: ${(error as Error).message}`);
  }
  try {
    parseMasterKey(validated.PII_MASTER_KEY);
  } catch (error) {
    throw new Error(`PII_MASTER_KEY inválida: ${(error as Error).message}`);
  }
  try {
    parseTotpEncryptionKey(validated.TOTP_ENCRYPTION_KEY);
  } catch (error) {
    throw new Error(
      `TOTP_ENCRYPTION_KEY inválida: ${(error as Error).message}`,
    );
  }

  return config;
}
