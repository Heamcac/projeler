import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedDemo, DEMO_PASSWORD } from '../src/seed.js';
import { tryOnJobs, bodyProfiles, users, products, variants } from '../src/db/schema.js';

test('signed HTTP-provider callbacks are replay-safe and private', async t => {
  const secret = 'webhook-test-secret-32-characters-long';
  const config = loadConfig({ NODE_ENV: 'test', PGLITE_PATH: 'memory://', TRYON_PROVIDER: 'http',
    VTON_ENDPOINT: 'https://provider.example/render', VTON_API_KEY: 'test-key', WEBHOOK_SECRET: secret, RESULT_HOSTS: 'cdn.example' });
  const { app, db } = await buildApp(config, { logger: false });
  t.after(async () => app.close());
  await seedDemo(db);
  const user = (await db.select().from(users).where(eq(users.email, 'customer@demo.local')))[0]!;
  const profile = (await db.select().from(bodyProfiles).where(eq(bodyProfiles.userId, user.id)))[0]!;
  const product = (await db.select().from(products).where(eq(products.name, 'Regular Denim')))[0]!;
  const variant = (await db.select().from(variants).where(eq(variants.productId, product.id)))[0]!;
  const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: user.email, password: DEMO_PASSWORD } });
  const created = await app.inject({ method: 'POST', url: `/api/v1/products/${product.id}/try-on`,
    headers: { authorization: `Bearer ${login.json().accessToken}` }, payload: { variantId: variant.id, profileId: profile.id, mode: 'ai' } });
  assert.equal(created.statusCode, 202, created.body);
  const jobId = created.json().jobId;
  await db.update(tryOnJobs).set({ status: 'waiting', attempts: 1 }).where(eq(tryOnJobs.id, jobId));
  const callback = async (body: object, timestamp = Math.floor(Date.now() / 1000).toString(), signature?: string) => {
    const raw = JSON.stringify(body);
    return app.inject({ method: 'POST', url: '/api/v1/webhooks/vton', payload: raw,
      headers: { 'content-type': 'application/json', 'x-vton-timestamp': timestamp,
        'x-vton-signature': signature ?? createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex') } });
  };
  const body = { eventId: 'evt-success', jobId, status: 'succeeded', imageUrl: 'https://cdn.example/result.png' };
  assert.equal((await callback(body, undefined, '0'.repeat(64))).statusCode, 401);
  assert.equal((await callback(body, '1')).statusCode, 401);
  assert.equal((await callback({ ...body, imageUrl: 'https://other.example/image.png' })).statusCode, 400);
  assert.equal((await callback(body)).statusCode, 200);
  assert.equal((await callback(body)).statusCode, 200);
  assert.equal((await callback({ eventId: 'evt-late-failure', jobId, status: 'failed' })).statusCode, 200);
  const result = (await db.select().from(tryOnJobs).where(eq(tryOnJobs.id, jobId)))[0]!;
  assert.equal(result.status, 'succeeded');
  assert.equal(result.result?.kind, 'ai');
});
