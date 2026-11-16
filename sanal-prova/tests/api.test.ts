import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedDemo, DEMO_PASSWORD, DEMO_BODY } from '../src/seed.js';
import { bodyProfiles, tryOnJobs, variants, orders, measurements } from '../src/db/schema.js';

test('API workflow against migrated PostgreSQL engine', async t => {
  const runtime = await buildApp(loadConfig({ NODE_ENV: 'test', PGLITE_PATH: 'memory://' }), { logger: false });
  const { app, db, tryOn, orderService } = runtime;
  t.after(async () => app.close());
  await seedDemo(db);
  const login = async (email: string) => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: DEMO_PASSWORD } });
    assert.equal(res.statusCode, 200, res.body);
    return res.json<{ accessToken: string; user: { id: string } }>();
  };
  const customer = await login('customer@demo.local');
  const seller = await login('seller@demo.local');
  const admin = await login('admin@demo.local');
  const auth = { authorization: `Bearer ${customer.accessToken}` };
  const profilesRes = await app.inject({ method: 'GET', url: '/api/v1/profile/measurements', headers: auth });
  const profile = profilesRes.json<Array<{ id: string; revision: number }>>()[0]!;
  const catalog = (await app.inject({ method: 'GET', url: '/api/v1/products' })).json<{ items: Array<{ id: string; name: string }> }>();
  const productId = catalog.items.find(p => p.name === 'Regular Denim')!.id;
  const product = (await app.inject({ method: 'GET', url: `/api/v1/products/${productId}` })).json<{
    product: { storeId: string }; variants: Array<{ variant: { id: string; size: string; stock: number } }> }>();
  const variant = product.variants.find(v => v.variant.size === 'M')!.variant;
  const tryOnBody = { profileId: profile.id, variantId: variant.id, mode: 'ai' as const };
  let jobId = '';

  await t.test('authorization and validation reject unsafe requests', async () => {
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/profile/measurements' })).statusCode, 401);
    const forbidden = await app.inject({ method: 'GET', url: `/api/v1/products/${productId}/fit-check?profileId=${profile.id}`,
      headers: { authorization: `Bearer ${seller.accessToken}` } });
    assert.equal(forbidden.statusCode, 404);
    const bad = await app.inject({ method: 'POST', url: '/api/v1/profile/measurements', headers: auth,
      payload: { ...DEMO_BODY, name: 'Bad', outseam: 70 } });
    assert.equal(bad.statusCode, 422);
    const roleEscalation = await app.inject({ method: 'POST', url: '/api/v1/auth/register',
      payload: { name: 'Escalation', email: 'x@test.local', password: DEMO_PASSWORD, role: 'admin' } });
    assert.equal(roleEscalation.statusCode, 400);
  });
  await t.test('fit score and tailored feed return measurable matches', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/products/${productId}/fit-check?profileId=${profile.id}&variantId=${variant.id}`, headers: auth });
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(res.json().fit.overallScore, 100);
    const feed = await app.inject({ method: 'GET', url: `/api/v1/feed/tailored?profileId=${profile.id}&limit=1`, headers: auth });
    assert.equal(feed.statusCode, 200, feed.body);
    assert.equal(feed.json().items.length, 1);
    assert.ok(feed.json().items.every((i: { fit: { overallScore: number } }) => i.fit.overallScore >= 90));
    assert.ok(feed.json().nextCursor);
    const next = await app.inject({ method: 'GET', url: `/api/v1/feed/tailored?profileId=${profile.id}&cursor=${feed.json().nextCursor}`, headers: auth });
    assert.ok(!next.json().items.some((i: { variantId: string }) => i.variantId === feed.json().items[0].variantId));
  });
  await t.test('try-on completes, deduplicates and protects previews', async () => {
    const created = await app.inject({ method: 'POST', url: `/api/v1/products/${productId}/try-on`,
      headers: { ...auth, 'idempotency-key': 'tryon-request-01' }, payload: tryOnBody });
    assert.equal(created.statusCode, 202, created.body);
    jobId = created.json().jobId;
    await tryOn.tick();
    const status = await app.inject({ method: 'GET', url: `/api/v1/try-on/jobs/${jobId}`, headers: auth });
    assert.equal(status.json().status, 'succeeded');
    assert.equal(status.json().result.kind, 'demo');
    const repeat = await app.inject({ method: 'POST', url: `/api/v1/products/${productId}/try-on`, headers: auth, payload: tryOnBody });
    assert.equal(repeat.json().jobId, jobId);
    assert.equal(repeat.json().cached, true);
    const alias = await app.inject({ method: 'POST', url: `/api/v1/products/${productId}/try-on`,
      headers: { ...auth, 'idempotency-key': 'tryon-alias-02' }, payload: tryOnBody });
    assert.equal(alias.json().jobId, jobId);
    const conflict = await app.inject({ method: 'POST', url: `/api/v1/products/${productId}/try-on`,
      headers: { ...auth, 'idempotency-key': 'tryon-alias-02' }, payload: { ...tryOnBody, mode: '3d' } });
    assert.equal(conflict.statusCode, 409);
    const preview = await app.inject({ method: 'GET', url: `/api/v1/try-on/jobs/${jobId}/preview`, headers: auth });
    assert.equal(preview.statusCode, 200);
    assert.match(preview.body, /<svg/);
    const other = await app.inject({ method: 'GET', url: `/api/v1/try-on/jobs/${jobId}`, headers: { authorization: `Bearer ${seller.accessToken}` } });
    assert.equal(other.statusCode, 404);
  });
  await t.test('3D job produces calibrated-unit parameters and no invented SMPL-X betas', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/products/${productId}/try-on`, headers: auth, payload: { ...tryOnBody, mode: '3d' } });
    await tryOn.tick();
    const job = await tryOn.get(customer.user.id, res.json().jobId);
    assert.equal(job.result?.kind, '3d');
    if (job.result?.kind === '3d') { assert.equal(job.result.avatar.height, 1.72); assert.equal(job.result.avatar.smplxBetas, null); }
  });
  await t.test('optimistic updates invalidate cached render snapshots', async () => {
    const update = await app.inject({ method: 'POST', url: '/api/v1/profile/measurements', headers: auth,
      payload: { ...DEMO_BODY, waist: 77, name: 'Kendim', profileId: profile.id, expectedRevision: 1 } });
    assert.equal(update.statusCode, 200, update.body);
    assert.equal(update.json().revision, 2);
    const stale = await app.inject({ method: 'POST', url: '/api/v1/profile/measurements', headers: auth,
      payload: { ...DEMO_BODY, name: 'Kendim', profileId: profile.id, expectedRevision: 1 } });
    assert.equal(stale.statusCode, 409);
    const render = await app.inject({ method: 'POST', url: `/api/v1/products/${productId}/try-on`, headers: auth, payload: tryOnBody });
    assert.notEqual(render.json().jobId, jobId);
    const second = await app.inject({ method: 'POST', url: '/api/v1/profile/measurements', headers: auth,
      payload: { ...DEMO_BODY, name: 'Kardesim', isDefault: true } });
    assert.equal(second.statusCode, 201);
    const all = await db.select().from(bodyProfiles).where(eq(bodyProfiles.userId, customer.user.id));
    assert.equal(all.filter(p => p.isDefault).length, 1);
  });
  const address = { name: 'Demo', address: 'Ornek sokak 12', city: 'Istanbul', postalCode: '34000' };
  await t.test('checkout is idempotent, inventory rollback and expiry work', async () => {
    const payload = { profileId: profile.id, items: [{ variantId: variant.id, quantity: 2 }], shippingAddress: address };
    const first = await orderService.create(customer.user.id, payload, 'order-request-01');
    const repeat = await orderService.create(customer.user.id, payload, 'order-request-01');
    assert.equal(first.id, repeat.id);
    assert.equal(first.status, 'pending_payment');
    const [stock] = await db.select().from(variants).where(eq(variants.id, variant.id));
    assert.equal(stock!.stock, 18);
    assert.ok(first.items[0]!.fitSnapshot);
    await assert.rejects(() => orderService.create(customer.user.id, { ...payload, items: [{ variantId: variant.id, quantity: 19 }] }, 'order-too-many'), /stokta/);
    assert.equal((await db.select().from(variants).where(eq(variants.id, variant.id)))[0]!.stock, 18);
    await db.update(orders).set({ createdAt: new Date(Date.now() - 901_000) }).where(eq(orders.id, first.id));
    await orderService.expireReservations();
    await orderService.expireReservations();
    assert.equal((await db.select().from(variants).where(eq(variants.id, variant.id)))[0]!.stock, 20);
    assert.equal((await orderService.get(customer.user.id, first.id)).status, 'cancelled');
  });
  await t.test('concurrent last-item buyers do not oversell', async () => {
    await db.update(variants).set({ stock: 1 }).where(eq(variants.id, variant.id));
    const body = { items: [{ variantId: variant.id, quantity: 1 }], shippingAddress: address };
    const results = await Promise.allSettled([
      orderService.create(customer.user.id, body, 'last-item-01'), orderService.create(customer.user.id, body, 'last-item-02'),
    ]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal((await db.select().from(variants).where(eq(variants.id, variant.id)))[0]!.stock, 0);
    for (const r of results) if (r.status === 'fulfilled') await orderService.cancel(customer.user.id, r.value.id);
  });
  await t.test('delivery and size-mismatch returns preserve fit evidence', async () => {
    const order = await orderService.create(customer.user.id, { profileId: profile.id,
      items: [{ variantId: variant.id, quantity: 1 }], shippingAddress: address }, 'return-order-01');
    const body = { orderItemId: order.items[0]!.id, reason: 'size_mismatch', mismatchAreas: ['hips'], comment: 'Dar geldi' };
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/returns', headers: auth, payload: body })).statusCode, 409);
    for (const status of ['paid', 'shipped', 'delivered']) {
      const res = await app.inject({ method: 'PATCH', url: `/api/v1/admin/orders/${order.id}/status`,
        headers: { authorization: `Bearer ${admin.accessToken}` }, payload: { status } });
      assert.equal(res.statusCode, 200, res.body);
    }
    const res = await app.inject({ method: 'POST', url: '/api/v1/returns', headers: auth, payload: body });
    assert.equal(res.statusCode, 201, res.body);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/returns', headers: auth, payload: body })).statusCode, 409);
    const metrics = await app.inject({ method: 'GET', url: `/api/v1/stores/${product.product.storeId}/metrics` });
    assert.equal(metrics.json().sizeMismatchRequestRate, 1);
    const orderList = await app.inject({ method: 'GET', url: '/api/v1/orders', headers: auth });
    assert.equal(orderList.statusCode, 200, orderList.body);
    assert.equal(orderList.json().items.find((o: { id: string }) => o.id === order.id).items[0].returnStatus, 'requested');
    const otherOrders = await app.inject({ method: 'GET', url: '/api/v1/orders', headers: { authorization: `Bearer ${seller.accessToken}` } });
    assert.equal(otherOrders.json().items.length, 0);
    const html = await app.inject({ method: 'GET', url: '/measurements', headers: { accept: 'text/html' } });
    if (html.statusCode === 200) assert.match(html.body, /id="root"/);
    const unknownApi = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist', headers: { accept: 'text/html' } });
    assert.equal(unknownApi.statusCode, 404);
    assert.equal(unknownApi.json().code, 'NOT_FOUND');
  });
  await t.test('seller can update only owned variant measurements', async () => {
    const payload = { waist: 78, hips: 104, chest: 100, inseam: 78, outseam: 104, totalLength: 105,
      hemWidth: 18, shoulderWidth: 40, source: 'manual', expectedRevision: 1 };
    assert.equal((await app.inject({ method: 'PUT', url: `/api/v1/seller/variants/${variant.id}/measurements`, headers: auth, payload })).statusCode, 404);
    const res = await app.inject({ method: 'PUT', url: `/api/v1/seller/variants/${variant.id}/measurements`,
      headers: { authorization: `Bearer ${seller.accessToken}` }, payload });
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(res.json().revision, 2);
  });
  await t.test('seller catalog creation validates fabric and ownership', async () => {
    const categoryId = (await app.inject({ method: 'GET', url: '/api/v1/categories' })).json()[0].id;
    const body = { storeId: product.product.storeId, categoryId, name: 'Yeni test pantolon', description: 'Gercek olculu urun',
      garmentType: 'bottom', cut: 'regular', fabric: { cottonPct: 98, elastanePct: 2, polyesterPct: 0, otherPct: 0,
        elasticityRatio: 0.04, elasticitySource: 'measured' }, variants: [{ sku: 'TEST-NEW-M', size: 'M', color: 'green',
        priceCents: 99000, currency: 'TRY', stock: 3, assets: [], measurements: { waist: 78, hips: 104, chest: null,
          inseam: 78, outseam: 104, totalLength: 104, hemWidth: 18, shoulderWidth: null, source: 'manual' } }] };
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/seller/products', headers: auth, payload: body })).statusCode, 404);
    const sellerAuth = { authorization: `Bearer ${seller.accessToken}` };
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/seller/products', headers: sellerAuth,
      payload: { ...body, fabric: { ...body.fabric, cottonPct: 90 } } })).statusCode, 422);
    const res = await app.inject({ method: 'POST', url: '/api/v1/seller/products', headers: sellerAuth, payload: body });
    assert.equal(res.statusCode, 201, res.body);
    assert.equal(res.json().variants[0].sku, 'TEST-NEW-M');
    const deactivate = await app.inject({ method: 'PATCH', url: `/api/v1/seller/products/${res.json().product.id}`,
      headers: sellerAuth, payload: { active: false } });
    assert.equal(deactivate.statusCode, 200);
    assert.equal((await app.inject({ method: 'GET', url: `/api/v1/products/${res.json().product.id}` })).statusCode, 404);
  });
  await t.test('durable outbox recovers a worker lease lost on restart', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/products/${productId}/try-on`, headers: auth, payload: tryOnBody });
    await db.update(tryOnJobs).set({ status: 'processing', attempts: 1, updatedAt: new Date(Date.now() - 121_000) }).where(eq(tryOnJobs.id, res.json().jobId));
    await tryOn.tick();
    assert.equal((await tryOn.get(customer.user.id, res.json().jobId)).status, 'succeeded');
  });
  await t.test('profile deletion removes render snapshots and rejects unknown identifiers', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/api/v1/profile/measurements/${profile.id}`, headers: auth });
    assert.equal(res.statusCode, 204, res.body);
    assert.equal((await app.inject({ method: 'GET', url: `/api/v1/try-on/jobs/${jobId}`, headers: auth })).statusCode, 404);
    assert.equal((await app.inject({ method: 'GET', url: `/api/v1/products/${randomUUID()}` })).statusCode, 404);
  });
  await t.test('OpenAPI contains request and response schemas for all required routes', async () => {
    const spec = app.swagger();
    for (const path of ['/api/v1/profile/measurements', '/api/v1/products/{id}/try-on', '/api/v1/products/{id}/fit-check', '/api/v1/feed/tailored'])
      assert.ok(spec.paths?.[path], path);
    assert.ok((await app.inject({ method: 'GET', url: '/docs/' })).body.includes('swagger'));
  });
});
