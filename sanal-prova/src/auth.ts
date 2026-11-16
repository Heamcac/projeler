import { randomBytes, scrypt as rawScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import type { Database } from './db/client.js';
import { users } from './db/schema.js';
import { ApiError } from './errors.js';

declare module '@fastify/jwt' {
  interface FastifyJWT { payload: { sub: string }; user: { sub: string } }
}
const scrypt = promisify(rawScrypt);
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [method, salt, expected] = hash.split('$');
  if (method !== 'scrypt' || !salt || !expected) return false;
  const key = await scrypt(password, salt, 64) as Buffer;
  const stored = Buffer.from(expected, 'hex');
  return stored.length === key.length && timingSafeEqual(stored, key);
}
export function authGuard(app: FastifyInstance, db: Database) {
  return async (request: FastifyRequest) => {
    try { await request.jwtVerify(); }
    catch { throw new ApiError(401, 'UNAUTHORIZED', 'Oturum gerekli'); }
    const [user] = await db.select({ enabled: users.enabled }).from(users).where(eq(users.id, request.user.sub));
    if (!user?.enabled) throw new ApiError(401, 'UNAUTHORIZED', 'Oturum gecersiz');
  };
}
