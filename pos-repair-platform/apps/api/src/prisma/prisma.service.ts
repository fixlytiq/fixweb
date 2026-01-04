import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // Retry connection with exponential backoff
    let retries = 5;
    let delay = 1000; // Start with 1 second
    
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        retries--;
        if (retries === 0) {
          this.logger.error('Failed to connect to database after all retries', error);
          throw error;
        }
        this.logger.warn(`Database connection failed, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
