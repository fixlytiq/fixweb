import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  url?: string;
  tls?: boolean;
}

export default registerAs('redis', () => {
  // Check if using GCP Memorystore (IP address format)
  const host = process.env.REDIS_HOST || 'redis';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;
  const isGcpMemorystore = /^\d+\.\d+\.\d+\.\d+$/.test(host); // IP address pattern

  // GCP Memorystore uses internal IP, no password by default
  // Local Redis may use password
  const config: RedisConfig = {
    host,
    port,
    ...(password && { password }),
    ...(isGcpMemorystore && {
      // GCP Memorystore configuration
      tls: false, // Memorystore doesn't require TLS for internal connections
    }),
  };

  // Build Redis URL
  if (password) {
    config.url = `redis://:${password}@${host}:${port}`;
  } else {
    config.url = `redis://${host}:${port}`;
  }

  return config;
});

