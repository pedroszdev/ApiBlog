import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. Cria a conexão usando o driver nativo (ele lê a DATABASE_URL do .env)
    const connectionString = process.env.DATABASE_URL;
    console.log('Minha URL de conexão é:', connectionString);
    const pool = new Pool({ connectionString });
    // 2. Cria o adaptador do Prisma para o Postgres
    const adapter = new PrismaPg(pool);

    // 3. Passa o adaptador para o construtor do PrismaClient
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'], // Opcional: mantém os logs
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
