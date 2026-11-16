import 'dotenv/config';
import { randomBytes } from 'node:crypto';

export interface Config {
  production: boolean; host: string; port: number; dbMode: 'pglite' | 'postgres';
  pglitePath: string; databaseUrl: string; queueMode: 'local' | 'redis'; redisUrl: string;
  jwtSecret: string; publicBaseUrl: string; corsOrigins: string[];
  provider: 'demo' | 'http'; vtonEndpoint: string; vtonApiKey: string;
  webhookSecret: string; resultHosts: string[]; modelVersion: string;
}

export function loadConfig(env = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const dbMode = env.DB_MODE ?? (production ? 'postgres' : 'pglite');
  const queueMode = env.QUEUE_MODE ?? (production ? 'redis' : 'local');
  const provider = env.TRYON_PROVIDER ?? 'demo';
  if (!['postgres', 'pglite'].includes(dbMode) || !['redis', 'local'].includes(queueMode)
    || !['demo', 'http'].includes(provider)) throw new Error('Invalid adapter configuration');
  const jwtSecret = env.JWT_SECRET || (production ? '' : randomBytes(48).toString('hex'));
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const port = Number(env.PORT ?? 3100);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const vtonEndpoint = env.VTON_ENDPOINT ?? '';
  const publicBaseUrl = env.PUBLIC_BASE_URL ?? `http://127.0.0.1:${port}`;
  const resultHosts = (env.RESULT_HOSTS ?? '').split(',').filter(Boolean);
  if (provider === 'http' && (!vtonEndpoint || !env.VTON_API_KEY || !env.WEBHOOK_SECRET || !resultHosts.length))
    throw new Error('HTTP provider needs endpoint, API key, webhook secret and RESULT_HOSTS');
  if (production && (dbMode !== 'postgres' || queueMode !== 'redis' || !env.DATABASE_URL || !env.REDIS_URL))
    throw new Error('Production requires PostgreSQL and Redis');
  if (production && !publicBaseUrl.startsWith('https://')) throw new Error('Production PUBLIC_BASE_URL needs HTTPS');
  if (provider === 'http' && new URL(vtonEndpoint).protocol !== 'https:') throw new Error('VTON_ENDPOINT needs HTTPS');
  return {
    production, host: env.HOST ?? '127.0.0.1', port, dbMode: dbMode as Config['dbMode'],
    pglitePath: env.PGLITE_PATH ?? '.data/postgres', databaseUrl: env.DATABASE_URL ?? '',
    queueMode: queueMode as Config['queueMode'], redisUrl: env.REDIS_URL ?? 'redis://localhost:6379',
    jwtSecret, publicBaseUrl, corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
    provider: provider as Config['provider'], vtonEndpoint, vtonApiKey: env.VTON_API_KEY ?? '',
    webhookSecret: env.WEBHOOK_SECRET ?? '', resultHosts, modelVersion: env.VTON_MODEL_VERSION ?? 'http-provider-v1',
  };
}
