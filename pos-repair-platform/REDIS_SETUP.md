# Redis Setup Guide

## Overview

Redis has been added to your Docker setup for caching, session storage, and queue management.

## What's Included

- ✅ Redis service in `docker-compose.yml`
- ✅ Redis client package (`redis` v4.7.0)
- ✅ Redis module and service for NestJS
- ✅ Helper methods for common Redis operations

## Configuration

### Environment Variables

Redis is configured via environment variables in `docker-compose.yml`:

```env
REDIS_HOST=redis          # Service name (default: redis)
REDIS_PORT=6379           # Redis port (default: 6379)
REDIS_PASSWORD=redispassword  # Redis password (default: redispassword)
```

### Default Configuration

- **Host**: `redis` (Docker service name)
- **Port**: `6379`
- **Password**: `redispassword` (change in production!)
- **Persistence**: Enabled with AOF (Append Only File)
- **Data Volume**: `redis_data` (persists data across restarts)

## Usage in Your Application

### Inject RedisService

```typescript
import { RedisService } from './redis/redis.service';

@Injectable()
export class YourService {
  constructor(private readonly redisService: RedisService) {}

  async example() {
    // Set a value
    await this.redisService.set('key', 'value', 3600); // TTL: 1 hour

    // Get a value
    const value = await this.redisService.get<string>('key');

    // Check if key exists
    const exists = await this.redisService.exists('key');

    // Delete a key
    await this.redisService.del('key');

    // Set expiry
    await this.redisService.expire('key', 1800); // 30 minutes

    // Get keys by pattern
    const keys = await this.redisService.keys('user:*');
  }
}
```

### Available Methods

- `get<T>(key: string)`: Get value by key
- `set(key: string, value: any, ttlSeconds?: number)`: Set value with optional TTL
- `del(key: string)`: Delete a key
- `exists(key: string)`: Check if key exists
- `expire(key: string, seconds: number)`: Set expiry time
- `keys(pattern: string)`: Get keys matching pattern
- `flushAll()`: Clear all data (use with caution!)
- `getClient()`: Get raw Redis client for advanced operations
- `isClientConnected()`: Check connection status

## Common Use Cases

### 1. Caching Database Queries

```typescript
async getStore(id: string) {
  const cacheKey = `store:${id}`;
  
  // Try cache first
  const cached = await this.redisService.get<Store>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const store = await this.prisma.store.findUnique({ where: { id } });
  
  // Cache for 1 hour
  if (store) {
    await this.redisService.set(cacheKey, store, 3600);
  }
  
  return store;
}
```

### 2. Session Storage

```typescript
async storeSession(sessionId: string, data: any) {
  await this.redisService.set(`session:${sessionId}`, data, 86400); // 24 hours
}

async getSession(sessionId: string) {
  return await this.redisService.get(`session:${sessionId}`);
}
```

### 3. Rate Limiting

```typescript
async checkRateLimit(userId: string, limit: number = 100) {
  const key = `ratelimit:${userId}`;
  const current = await this.redisService.get<number>(key) || 0;
  
  if (current >= limit) {
    throw new Error('Rate limit exceeded');
  }
  
  await this.redisService.set(key, current + 1, 3600); // Reset after 1 hour
  return true;
}
```

### 4. Queue Management

```typescript
// Add to queue
async addToQueue(queueName: string, job: any) {
  await this.redisService.set(`queue:${queueName}:${Date.now()}`, job);
}

// Process queue
async processQueue(queueName: string) {
  const keys = await this.redisService.keys(`queue:${queueName}:*`);
  // Process jobs...
}
```

## Testing Redis Connection

### Via Docker CLI

```bash
# Connect to Redis container
docker-compose exec redis redis-cli

# Authenticate (if password is set)
AUTH redispassword

# Test commands
PING
SET test "Hello Redis"
GET test
KEYS *
```

### Via API

You can test Redis in your NestJS application:

```typescript
// In a controller or service
async testRedis() {
  await this.redisService.set('test', 'Hello Redis', 60);
  const value = await this.redisService.get<string>('test');
  return { success: true, value };
}
```

## Monitoring

### Check Redis Status

```bash
# Check container status
docker-compose ps redis

# View logs
docker-compose logs -f redis

# Check Redis info
docker-compose exec redis redis-cli INFO
```

### Redis Commands

```bash
# Connect to Redis
docker-compose exec redis redis-cli -a redispassword

# Common commands:
# - PING: Test connection
# - INFO: Get server information
# - DBSIZE: Get number of keys
# - KEYS *: List all keys (use with caution in production)
# - FLUSHALL: Clear all data (use with caution!)
```

## Production Considerations

1. **Change Default Password**: Update `REDIS_PASSWORD` in production
2. **Enable Persistence**: Already enabled with AOF
3. **Set Memory Limits**: Add `maxmemory` and `maxmemory-policy` in Redis config
4. **Use Redis Sentinel**: For high availability
5. **Monitor Performance**: Use Redis monitoring tools
6. **Backup Strategy**: Regular backups of Redis data

## Troubleshooting

### Redis Not Connecting

1. Check if container is running: `docker-compose ps redis`
2. Check logs: `docker-compose logs redis`
3. Verify environment variables are set
4. Test connection: `docker-compose exec redis redis-cli PING`

### Connection Errors

- **"Connection refused"**: Redis container not running
- **"Authentication failed"**: Wrong password
- **"Network unreachable"**: Docker network issue

### Performance Issues

- Check memory usage: `docker-compose exec redis redis-cli INFO memory`
- Monitor connections: `docker-compose exec redis redis-cli INFO clients`
- Check slow queries: `docker-compose exec redis redis-cli SLOWLOG GET 10`

## Next Steps

1. ✅ Redis is running in Docker
2. ✅ RedisService is available in your NestJS app
3. 🔄 Start using Redis for caching, sessions, or queues
4. 🔄 Configure production settings (password, memory limits)
5. 🔄 Set up monitoring and alerts

## Example: Cache Ticket Data

```typescript
// In tickets.service.ts
async findOne(user: UserPayload, id: string) {
  const cacheKey = `ticket:${id}:${user.storeId}`;
  
  // Check cache
  const cached = await this.redisService.get<Ticket>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const ticket = await this.prisma.ticket.findFirst({
    where: { id, storeId: user.storeId },
    include: { Customer: true, Store: true, Employee: true },
  });

  if (!ticket) {
    throw new NotFoundException(`Ticket ${id} not found`);
  }

  // Cache for 5 minutes
  await this.redisService.set(cacheKey, ticket, 300);
  
  return ticket;
}
```

---

**Redis is now ready to use!** 🚀

