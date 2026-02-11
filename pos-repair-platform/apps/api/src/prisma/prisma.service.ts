import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client (single instance per app via Nest DI).
 * Provided by PrismaModule (@Global), so one instance prevents connection pooling exhaustion during hot reloads.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('/cloudsql/')) {
      this.logger.warn(
        'DATABASE_URL uses Cloud SQL socket. Ensure Cloud SQL Proxy is running (e.g. cloud_sql_proxy -instances=...=tcp:5432) or use a local DB URL.',
      );
    }
    // Do not block startup on DB connection (Cloud Run needs container to listen on PORT quickly).
    setImmediate(() => this.connectWithRetry());
  }

  private async connectWithRetry(): Promise<void> {
    let delay = 1000;
    for (let attempt = 1; attempt <= 15; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        this.logger.warn(`Database connection attempt ${attempt}/15 failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 10000);
      }
    }
    this.logger.error('Database connection failed after 15 attempts; requests will fail until DB is reachable.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
