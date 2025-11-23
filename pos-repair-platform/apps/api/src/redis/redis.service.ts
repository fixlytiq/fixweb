import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const host = this.configService.get<string>('REDIS_HOST', 'redis');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      const password = this.configService.get<string>('REDIS_PASSWORD');
      
      // Detect if using GCP Memorystore (IP address format)
      const isGcpMemorystore = /^\d+\.\d+\.\d+\.\d+$/.test(host);

      const url = password
        ? `redis://:${password}@${host}:${port}`
        : `redis://${host}:${port}`;

      this.logger.log(`Connecting to Redis at ${host}:${port} (${isGcpMemorystore ? 'GCP Memorystore' : 'Local Redis'})`);

      this.client = createClient({
        url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error('Redis reconnection attempts exceeded');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
          // GCP Memorystore doesn't require TLS for internal connections
          ...(isGcpMemorystore && { tls: false }),
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis Client Connecting...');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis Client Reconnecting...');
      });

      await this.client.connect();
      this.logger.log(`Redis connected to ${host}:${port}`);
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  private async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Helper methods for common operations

  async get<T = string>(key: string): Promise<T | null> {
    if (!this.isClientConnected()) {
      this.logger.warn('Redis client not connected, get operation skipped');
      return null;
    }

    try {
      const value = await this.client!.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isClientConnected()) {
      this.logger.warn('Redis client not connected, set operation skipped');
      return false;
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client!.setEx(key, ttlSeconds, stringValue);
      } else {
        await this.client!.set(key, stringValue);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isClientConnected()) {
      this.logger.warn('Redis client not connected, delete operation skipped');
      return false;
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isClientConnected()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isClientConnected()) {
      return false;
    }

    try {
      await this.client!.expire(key, seconds);
      return true;
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isClientConnected()) {
      return [];
    }

    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async flushAll(): Promise<boolean> {
    if (!this.isClientConnected()) {
      return false;
    }

    try {
      await this.client!.flushAll();
      this.logger.warn('Redis database flushed');
      return true;
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
      return false;
    }
  }
}

