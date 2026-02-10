import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PrismaClient as PrismaClientType } from '../../../generated/prisma';
import { createPrismaAdapter } from './prisma-adapter';
import { join } from 'path';

const { PrismaClient } = require(join(
  process.cwd(),
  'generated/prisma',
)) as { PrismaClient: typeof PrismaClientType };

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const databaseUrl = config.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = createPrismaAdapter(databaseUrl);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

