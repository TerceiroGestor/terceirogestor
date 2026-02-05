import { PrismaMySQL } from '@prisma/adapter-mysql';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import mysql from 'mysql2/promise';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = mysql.createPool(databaseUrl);
    const adapter = new PrismaMySQL(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
