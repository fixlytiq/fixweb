import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [RedisModule],
      useFactory: (redisService: RedisService, configService: ConfigService) => {
        const redisClient = redisService.getClient();
        
        // If Redis client is available, use it directly
        if (redisClient) {
          return {
            connection: redisClient,
          };
        }

        // Fallback: create connection from environment variables
        const host = configService.get<string>('REDIS_HOST', 'redis');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD');

        const connection = password
          ? { host, port, password }
          : { host, port };

        return {
          connection,
        };
      },
      inject: [RedisService, ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

