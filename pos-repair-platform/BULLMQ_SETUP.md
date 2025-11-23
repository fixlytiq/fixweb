# BullMQ Setup Guide

BullMQ is a Redis-based queue system for handling background jobs. This guide shows how to set it up with both local Redis and GCP Memorystore.

## Installation

```bash
cd apps/api
npm install bullmq
```

## Configuration

BullMQ is configured in `src/queue/queue.module.ts` to use the existing Redis connection from `RedisService`. It automatically works with both local Redis and GCP Memorystore.

## Usage Example

### 1. Create a Queue

```typescript
// src/notifications/notification.queue.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class NotificationQueue {
  private queue: Queue;

  constructor(private redisService: RedisService) {
    const redisClient = this.redisService.getClient();
    
    this.queue = new Queue('notifications', {
      connection: redisClient || {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    });
  }

  async addJob(data: any) {
    return await this.queue.add('send-notification', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

### 2. Create a Worker

```typescript
// src/notifications/notification.worker.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  constructor(
    private redisService: RedisService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    const redisClient = this.redisService.getClient();
    
    this.worker = new Worker(
      'notifications',
      async (job) => {
        const { ticketId, status } = job.data;
        await this.notificationsService.sendStatusUpdateNotification(ticketId, status);
      },
      {
        connection: redisClient || {
          host: process.env.REDIS_HOST || 'redis',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
        },
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
```

### 3. Use in Service

```typescript
// src/tickets/tickets.service.ts
import { NotificationQueue } from '../notifications/notification.queue';

@Injectable()
export class TicketsService {
  constructor(
    private notificationQueue: NotificationQueue,
    // ... other dependencies
  ) {}

  async update(user: UserPayload, id: string, updateTicketDto: UpdateTicketDto) {
    // ... update logic
    
    if (statusChanged) {
      // Add to queue instead of sending immediately
      await this.notificationQueue.addJob({
        ticketId: id,
        status: updateTicketDto.status,
      });
    }
    
    return updated;
  }
}
```

## Queue Management

### View Queue Status

```typescript
// Get queue metrics
const waiting = await queue.getWaiting();
const active = await queue.getActive();
const completed = await queue.getCompleted();
const failed = await queue.getFailed();
```

### Retry Failed Jobs

```typescript
const failedJobs = await queue.getFailed();
for (const job of failedJobs) {
  await job.retry();
}
```

### Clean Old Jobs

```typescript
// Clean completed jobs older than 24 hours
await queue.clean(24 * 60 * 60 * 1000, 100, 'completed');
```

## Monitoring

### Bull Board (Dashboard)

```bash
npm install @bull-board/api @bull-board/express
```

```typescript
// src/queue/queue-board.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

export function setupQueueBoard(queues: Queue[]) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: queues.map(q => new BullMQAdapter(q)),
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
```

## Best Practices

1. **Error Handling**: Always handle job failures gracefully
2. **Retry Logic**: Use exponential backoff for retries
3. **Job Timeouts**: Set appropriate timeouts for long-running jobs
4. **Concurrency**: Adjust worker concurrency based on your needs
5. **Monitoring**: Monitor queue sizes and processing times
6. **Cleanup**: Regularly clean old completed/failed jobs

## Environment Variables

```env
# Local Development
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=redispassword

# GCP Memorystore
REDIS_HOST=10.x.x.x  # Memorystore IP
REDIS_PORT=6379
REDIS_PASSWORD=  # Empty for Memorystore
```

## Next Steps

1. ✅ Install BullMQ
2. ✅ Configure queue module
3. 🔄 Create notification queue
4. 🔄 Create worker for processing
5. 🔄 Update ticket service to use queue
6. 🔄 Set up monitoring dashboard
7. 🔄 Configure alerts for failed jobs

