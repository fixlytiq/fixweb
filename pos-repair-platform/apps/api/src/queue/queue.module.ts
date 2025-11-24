import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';

// QueueModule - BullMQ integration
// Note: BullMQ can be used directly in services without a NestJS module wrapper
// This module is a placeholder for future queue functionality
@Module({
  imports: [ConfigModule, RedisModule],
  exports: [RedisModule],
})
export class QueueModule {}

