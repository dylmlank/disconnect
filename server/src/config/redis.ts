import { createClient, RedisClientType } from 'redis';
import { env } from './env';

export let redis: RedisClientType;

let connected = false;

export function isRedisConnected(): boolean {
  return connected;
}

export async function connectRedis() {
  if (!env.REDIS_URL) {
    console.warn('⚠ REDIS_URL not set — rate limiting and caching disabled');
    return;
  }

  try {
    redis = createClient({ url: env.REDIS_URL });
    redis.on('error', (err) => {
      if (connected) console.error('Redis error:', err);
    });
    await redis.connect();
    connected = true;
    console.log('Redis connected');
  } catch (err) {
    if (env.NODE_ENV === 'development') {
      console.warn('⚠ Redis unavailable — running without it (rate limiting disabled)');
    } else {
      throw err;
    }
  }
}
