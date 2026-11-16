import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedDemo } from '../src/seed.js';
import { bodyProfiles, users, products, variants, measurements, tryOnJobs } from '../src/db/schema.js';

test('HTTP provider submission uses a stable idempotency key and retries errors', async t => {
  const config = loadConfig({ NODE_ENV: 'test', PGLITE_PATH: 'memory://', TRYON_PROVIDER: 'http',
    VTON_ENDPOINT: 'https://provider.example/render', VTON_API_KEY: 'test-key', WEBHOOK_SECRET: 'test-secret', RESULT_HOSTS: 'cdn.example' });
  const { app, db, tryOn } = await buildApp(config, { logger: false });
  t.after(async () => app.close());
  await seedDemo(db);
  const user = (await db.select().from(users).where(eq(users.email, 'customer@demo.local')))[0]!;
  const profile = (await db.select().from(bodyProfiles).where(eq(bodyProfiles.userId, user.id)))[0]!;
  const product = (await db.select().from(products).where(eq(products.name, 'Regular Denim')))[0]!;
  const variant = (await db.select().from(variants).where(eq(variants.productId, product.id)))[0]!;
  const measurement = (await db.select().from(measurements).where(eq(measurements.variantId, variant.id)))[0]!;
  const input = { body: profile, profileRevision: 1, mode: 'ai' as const, garmentType: 'bottom' as const,
    measurement: { ...measurement, size: variant.size, stock: 0 }, elasticityRatio: 0.04, assets: [], modelVersion: 'http-provider-v1' };
  const { job } = await tryOn.enqueue(user.id, profile.id, variant.id, input);
  const calls: Array<{ url: string; headers: Headers; payload: { clientJobId: string; callbackUrl: string } }> = [];
  let fail = true;
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), headers: new Headers(init?.headers), payload: JSON.parse(String(init?.body)) });
    return fail ? new Response('unavailable', { status: 503 })
      : Response.json({ status: 'completed', imageUrl: 'https://cdn.example/completed.png' });
  });
  await tryOn.process(job.id);
  const [retry] = await db.select().from(tryOnJobs).where(eq(tryOnJobs.id, job.id));
  assert.equal(retry!.status, 'queued');
  fail = false;
  await db.update(tryOnJobs).set({ nextAttemptAt: new Date(0) }).where(eq(tryOnJobs.id, job.id));
  await tryOn.process(job.id);
  assert.equal((await tryOn.get(user.id, job.id)).status, 'succeeded');
  assert.equal(calls.length, 2);
  assert.ok(calls.every(c => c.headers.get('idempotency-key') === job.id));
  assert.equal(calls[0]!.payload.clientJobId, job.id);
  assert.equal(calls[0]!.payload.callbackUrl, config.publicBaseUrl + '/api/v1/webhooks/vton');
});
