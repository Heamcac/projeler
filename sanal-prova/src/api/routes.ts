import type { FastifyInstance } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';
import { and, eq, gt, lt, desc, or, inArray, sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import type { Config } from '../config.js';
import { users, bodyProfiles, products, variants, measurements, productFabrics, fitAnalysisLogs,
  tryOnJobs, orders, orderItems, returns, stores, vendors } from '../db/schema.js';
import { hashPassword, verifyPassword, authGuard } from '../auth.js';
import { ApiError, conflict, isUniqueViolation, notFound } from '../errors.js';
import { getProduct, ownProfile, toMeasurement } from '../catalog.js';
import { calculateFitScore, FitInputError, validateBody, ALGORITHM_VERSION } from '../fit/engine.js';
import { TryOnService, webhookSchema, type WebhookBody } from '../tryon/service.js';
import { OrderService } from '../orders.js';
import * as S from './schemas.js';

export function registerRoutes(app: FastifyInstance, db: Database, config: Config, tryOn: TryOnService, orderService: OrderService) {
  const guard = authGuard(app, db);
  const admin = async (request: Parameters<typeof guard>[0]) => {
    await guard(request);
    const [user] = await db.select().from(users).where(eq(users.id, request.user.sub));
    if (user?.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Yonetici yetkisi gerekli');
  };
  const authResponse = Type.Object({ accessToken: Type.String(), expiresIn: Type.Integer(),
    user: Type.Object({ id: S.uuid, name: Type.String(), email: Type.String(), role: Type.String() }) });
  const authResult = (user: typeof users.$inferSelect) => ({ accessToken: app.jwt.sign({ sub: user.id }, { expiresIn: '15m' }),
    expiresIn: 900, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

  app.get('/health', { schema: { tags: ['system'] } }, async () => {
    await db.execute(sql`select 1`);
    return { status: 'ok', database: config.dbMode, queue: config.queueMode, tryOnProvider: config.provider };
  });
  app.get('/api/v1/storefront/config', { schema: { tags: ['system'] } }, async () => ({ demoAccess: !config.production }));
  app.post<{ Body: Static<typeof S.registerSchema> }>('/api/v1/auth/register', {
    schema: { tags: ['auth'], body: S.registerSchema, response: { 201: authResponse, ...S.errors } },
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    try {
      const [user] = await db.insert(users).values({ email: request.body.email.toLowerCase().trim(),
        name: request.body.name, passwordHash: await hashPassword(request.body.password) }).returning();
      return reply.code(201).send(authResult(user!));
    } catch (error) { if (isUniqueViolation(error)) conflict('E-posta zaten kayitli'); throw error; }
  });
  app.post<{ Body: Static<typeof S.authSchema> }>('/api/v1/auth/login', {
    schema: { tags: ['auth'], body: S.authSchema, response: { 200: authResponse, ...S.errors } },
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async request => {
    const [user] = await db.select().from(users).where(eq(users.email, request.body.email.toLowerCase().trim()));
    // A dummy hash prevents skipping password work for unknown accounts.
    const dummy = 'scrypt$00000000000000000000000000000000$' + '00'.repeat(64);
    const valid = await verifyPassword(request.body.password, user?.passwordHash ?? dummy);
    if (!user?.enabled || !valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya sifre gecersiz');
    return authResult(user);
  });
  app.get('/api/v1/auth/me', { preHandler: guard, schema: { tags: ['auth'], security: S.security } }, async request => {
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role }).from(users).where(eq(users.id, request.user.sub));
    return user;
  });

  app.get('/api/v1/profile/measurements', { preHandler: guard, schema: { tags: ['profiles'], security: S.security,
    response: { 200: Type.Array(S.profileResponse), ...S.errors } } }, request =>
    db.select().from(bodyProfiles).where(eq(bodyProfiles.userId, request.user.sub)).orderBy(bodyProfiles.createdAt));
  app.post<{ Body: S.ProfileBody }>('/api/v1/profile/measurements', {
    preHandler: guard, schema: { tags: ['profiles'], security: S.security, body: S.profileSchema,
      response: { 200: S.profileResponse, 201: S.profileResponse, ...S.errors } },
  }, async (request, reply) => {
    validateBody(request.body);
    const { profileId, expectedRevision, isDefault, ...values } = request.body;
    if (profileId && expectedRevision === undefined) throw new ApiError(400, 'REVISION_REQUIRED', 'Guncelleme icin expectedRevision gerekli');
    if (!profileId && expectedRevision !== undefined) throw new ApiError(400, 'INVALID_REVISION', 'Yeni profil revision alamaz');
    if (profileId) await ownProfile(db, request.user.sub, profileId);
    try {
      const profile = await db.transaction(async tx => {
        if (isDefault) await tx.update(bodyProfiles).set({ isDefault: false }).where(eq(bodyProfiles.userId, request.user.sub));
        if (profileId) {
          const [updated] = await tx.update(bodyProfiles).set({ ...values, ...(isDefault === undefined ? {} : { isDefault }),
            revision: sql`${bodyProfiles.revision} + 1`, updatedAt: new Date() })
            .where(and(eq(bodyProfiles.id, profileId), eq(bodyProfiles.userId, request.user.sub), eq(bodyProfiles.revision, expectedRevision!))).returning();
          if (!updated) conflict('Profil degisti; guncel revision ile tekrar deneyin');
          return updated;
        }
        const [created] = await tx.insert(bodyProfiles).values({ ...values, isDefault: isDefault ?? false, userId: request.user.sub }).returning();
        return created!;
      });
      return reply.code(profileId ? 200 : 201).send(profile);
    } catch (error) { if (isUniqueViolation(error)) conflict('Varsayilan profil ayni anda degistirildi'); throw error; }
  });
  app.delete<{ Params: { id: string } }>('/api/v1/profile/measurements/:id', {
    preHandler: guard, schema: { tags: ['profiles'], security: S.security, params: S.idParams },
  }, async (request, reply) => {
    await ownProfile(db, request.user.sub, request.params.id);
    await db.transaction(async tx => {
      await tx.delete(tryOnJobs).where(eq(tryOnJobs.profileId, request.params.id));
      await tx.delete(fitAnalysisLogs).where(eq(fitAnalysisLogs.profileId, request.params.id));
      await tx.delete(bodyProfiles).where(and(eq(bodyProfiles.id, request.params.id), eq(bodyProfiles.userId, request.user.sub)));
    });
    return reply.code(204).send();
  });

  const listQuery = Type.Object({ cursor: Type.Optional(S.uuid), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 20 })) });
  app.get<{ Querystring: Static<typeof listQuery> }>('/api/v1/products', {
    schema: { tags: ['products'], querystring: listQuery },
  }, async request => {
    const rows = await db.select({ id: products.id, name: products.name, garmentType: products.garmentType, cut: products.cut })
      .from(products).innerJoin(stores, eq(products.storeId, stores.id))
      .where(and(eq(products.active, true), eq(stores.active, true), request.query.cursor ? gt(products.id, request.query.cursor) : undefined))
      .orderBy(products.id).limit((request.query.limit ?? 20) + 1);
    const items = rows.slice(0, request.query.limit ?? 20);
    return { items, nextCursor: rows.length > items.length ? items.at(-1)!.id : null };
  });
  app.get<{ Params: { id: string } }>('/api/v1/products/:id', { schema: { tags: ['products'], params: S.idParams } }, request => getProduct(db, request.params.id));

  const fitQuery = Type.Object({ profileId: S.uuid, variantId: Type.Optional(S.uuid) });
  app.get<{ Params: { id: string }; Querystring: Static<typeof fitQuery> }>('/api/v1/products/:id/fit-check', {
    preHandler: guard, schema: { tags: ['fit'], security: S.security, params: S.idParams, querystring: fitQuery,
      response: { 200: Type.Object({ variantId: S.uuid, profileRevision: Type.Integer(), fit: S.fitResponse }), ...S.errors } },
  }, async request => {
    const profile = await ownProfile(db, request.user.sub, request.query.profileId);
    const catalog = await getProduct(db, request.params.id);
    const selected = request.query.variantId ? catalog.variants.filter(v => v.variant.id === request.query.variantId) : catalog.variants.filter(v => v.variant.stock > 0);
    if (request.query.variantId && !selected.length) notFound();
    const results = [];
    for (const row of selected) {
      try {
        const alternatives = catalog.variants.filter(v => v.measurements && v.variant.color === row.variant.color).map(toMeasurement);
        results.push({ variantId: row.variant.id, fit: calculateFitScore(profile, toMeasurement(row), catalog.fabric.elasticityRatio,
          alternatives, catalog.product.garmentType, catalog.product.cut) });
      } catch (error) {
        if (request.query.variantId || !(error instanceof FitInputError || error instanceof ApiError && error.code === 'MISSING_MEASUREMENTS')) throw error;
      }
    }
    results.sort((a, b) => b.fit.overallScore - a.fit.overallScore || a.variantId.localeCompare(b.variantId));
    const best = results[0];
    if (!best) throw new ApiError(422, 'NO_MEASURABLE_VARIANT', 'Olculebilir stoklu varyant bulunamadi');
    await db.insert(fitAnalysisLogs).values({ userId: request.user.sub, profileId: profile.id, variantId: best.variantId,
      profileRevision: profile.revision, algorithmVersion: ALGORITHM_VERSION, score: best.fit.overallScore, analysis: best.fit });
    return { ...best, profileRevision: profile.revision };
  });

  app.post<{ Params: { id: string }; Body: Static<typeof S.tryOnSchema>; Headers: { 'idempotency-key'?: string } }>('/api/v1/products/:id/try-on', {
    preHandler: guard, schema: { tags: ['try-on'], security: S.security, params: S.idParams, body: S.tryOnSchema,
      headers: S.idempotencyHeaders, response: { 200: S.tryOnResponse, 202: S.tryOnResponse, ...S.errors } },
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const profile = await ownProfile(db, request.user.sub, request.body.profileId);
    const catalog = await getProduct(db, request.params.id);
    const row = catalog.variants.find(v => v.variant.id === request.body.variantId);
    if (!row) notFound();
    const measurement = toMeasurement(row);
    const assets = catalog.assets.filter(a => a.variantId === row.variant.id)
      .map(a => ({ type: a.type, url: a.url, sha256: a.sha256, revision: a.revision })).sort((a, b) => a.type.localeCompare(b.type));
    if (request.body.mode === 'ai' && config.provider === 'http' && !assets.some(a => a.type === 'front'))
      throw new ApiError(422, 'MISSING_ASSET', 'AI prova icin on dekupe gerekli');
    const { job, cached } = await tryOn.enqueue(request.user.sub, profile.id, row.variant.id, {
      body: { height: profile.height, weight: profile.weight, chest: profile.chest, waist: profile.waist,
        hips: profile.hips, inseam: profile.inseam, outseam: profile.outseam, shoulderWidth: profile.shoulderWidth, bodyShapeType: profile.bodyShapeType },
      profileRevision: profile.revision, measurement: { ...measurement, stock: 0 }, assets, garmentType: catalog.product.garmentType,
      elasticityRatio: catalog.fabric.elasticityRatio, mode: request.body.mode,
      modelVersion: request.body.mode === '3d' ? 'parametric-v1' : config.provider === 'demo' ? 'demo-v1' : config.modelVersion,
    }, request.headers['idempotency-key']);
    return reply.code(job.status === 'succeeded' || job.status === 'failed' ? 200 : 202).send({ jobId: job.id,
      status: job.status, cached, statusUrl: `/api/v1/try-on/jobs/${job.id}`, expiresAt: job.expiresAt.toISOString() });
  });
  app.get<{ Params: { id: string } }>('/api/v1/try-on/jobs/:id', {
    preHandler: guard, schema: { tags: ['try-on'], security: S.security, params: S.idParams,
      response: { 200: Type.Object({ jobId: S.uuid, status: Type.String(), result: Type.Union([Type.Object({}, { additionalProperties: true }), Type.Null()]),
        errorCode: Type.Union([Type.String(), Type.Null()]), expiresAt: Type.String() }), ...S.errors } },
  }, async request => {
    const job = await tryOn.get(request.user.sub, request.params.id);
    return { jobId: job.id, status: job.status, result: job.result, errorCode: job.errorCode, expiresAt: job.expiresAt.toISOString() };
  });
  app.get('/api/v1/demo-assets/garment.svg', { schema: { hide: true } }, async (_, reply) => {
    if (config.production) notFound();
    return reply.type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#f4f7f8"/><path d="M65 40H235L220 360H165L150 145L135 360H80Z" fill="#258777"/><text x="150" y="390" font-size="12" text-anchor="middle">DEMO GARMENT</text></svg>');
  });
  app.get<{ Params: { id: string } }>('/api/v1/try-on/jobs/:id/preview', {
    preHandler: guard, schema: { tags: ['try-on'], security: S.security, params: S.idParams },
  }, async (request, reply) => {
    const job = await tryOn.get(request.user.sub, request.params.id);
    if (job.result?.kind !== 'demo') notFound();
    const b = job.input.body;
    const chest = Math.min(105, b.chest * 0.7), waist = Math.min(100, b.waist * 0.7), hips = Math.min(110, b.hips * 0.7);
    const x = 200;
    const silhouette = `${x-chest},155 ${x+chest},155 ${x+waist},235 ${x+hips},300 ${x+55},475 ${x+5},475 ${x},325 ${x-5},475 ${x-55},475 ${x-hips},300 ${x-waist},235`;
    const clothing = job.input.garmentType === 'top'
      ? `<polygon points="${x-chest},155 ${x+chest},155 ${x+waist},250 ${x-waist},250" fill="#258777"/>`
      : job.input.garmentType === 'dress'
      ? `<polygon points="${x-chest},155 ${x+chest},155 ${x+waist},235 ${x+hips+20},400 ${x-hips-20},400 ${x-waist},235" fill="#258777"/>`
      : `<path d="M${x-hips} 300 L${x-55} 475 L${x-5} 475 L${x} 325 L${x+5} 475 L${x+55} 475 L${x+hips} 300Z" fill="#258777"/>`;
    return reply.header('cache-control', 'private, no-store').type('image/svg+xml').send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550" viewBox="0 0 400 550"><rect width="400" height="550" fill="#f4f7f8"/><circle cx="200" cy="92" r="38" fill="#c2ccd1"/><polygon points="${silhouette}" fill="#8c9ca5"/>${clothing}<text x="200" y="520" font-family="sans-serif" font-size="14" text-anchor="middle">DEMO / SCHEMATIC PREVIEW</text></svg>`);
  });
  app.post<{ Body: WebhookBody; Headers: { 'x-vton-timestamp': string; 'x-vton-signature': string } }>('/api/v1/webhooks/vton', {
    config: { rawBody: true }, schema: { tags: ['webhooks'], body: webhookSchema,
      headers: Type.Object({ 'x-vton-timestamp': Type.String(), 'x-vton-signature': Type.String() }, { additionalProperties: true }) },
  }, async request => {
    if (!request.rawBody) throw new ApiError(400, 'INVALID_BODY', 'Ham istek gerekli');
    tryOn.verifyWebhook(request.rawBody, request.headers['x-vton-timestamp'], request.headers['x-vton-signature']);
    if (request.body.status === 'succeeded' && !request.body.imageUrl) throw new ApiError(400, 'MISSING_IMAGE', 'imageUrl gerekli');
    await tryOn.webhook(request.body);
    return { received: true };
  });

  const feedQuery = Type.Object({ profileId: S.uuid, ...listQuery.properties });
  app.get<{ Querystring: Static<typeof feedQuery> }>('/api/v1/feed/tailored', {
    preHandler: guard, schema: { tags: ['fit'], security: S.security, querystring: feedQuery,
      response: { 200: Type.Object({ items: Type.Array(Type.Object({ productId: S.uuid, productName: Type.String(), variantId: S.uuid,
        size: Type.String(), priceCents: Type.Integer(), currency: Type.String(), fit: S.fitResponse })),
        nextCursor: Type.Union([S.uuid, Type.Null()]), scanned: Type.Integer() }), ...S.errors } },
  }, async request => {
    const profile = await ownProfile(db, request.user.sub, request.query.profileId);
    const rows = await db.select({ product: products, variant: variants, measurement: measurements, fabric: productFabrics })
      .from(variants).innerJoin(products, eq(variants.productId, products.id)).innerJoin(stores, eq(products.storeId, stores.id))
      .innerJoin(measurements, eq(measurements.variantId, variants.id)).innerJoin(productFabrics, eq(productFabrics.productId, products.id))
      .where(and(eq(products.active, true), eq(stores.active, true), eq(products.garmentType, 'bottom'), eq(variants.active, true), gt(variants.stock, 0),
        sql`${measurements.waist} between ${profile.waist / 1.3} and ${profile.waist + 10}`,
        sql`${measurements.inseam} between ${profile.inseam - 4} and ${profile.inseam + 4}`,
        request.query.cursor ? gt(variants.id, request.query.cursor) : undefined)).orderBy(variants.id).limit(201);
    const items = [];
    let scanned = 0, last: string | null = null;
    for (const row of rows.slice(0, 200)) {
      scanned++; last = row.variant.id;
      try {
        const fit = calculateFitScore(profile, toMeasurement({ variant: row.variant, measurements: row.measurement }), row.fabric.elasticityRatio, [], 'bottom', row.product.cut);
        if (fit.overallScore >= 90 && fit.dimensions.filter(d => d.dimension === 'waist' || d.dimension === 'inseam').every(d => d.score >= 90))
          items.push({ productId: row.product.id, productName: row.product.name, variantId: row.variant.id, size: row.variant.size,
            priceCents: row.variant.priceCents, currency: row.variant.currency, fit });
      } catch (error) { if (!(error instanceof FitInputError)) throw error; }
      if (items.length === (request.query.limit ?? 20)) break;
    }
    return { items, nextCursor: scanned < rows.length ? last : null, scanned };
  });

  app.post<{ Body: S.OrderBody; Headers: { 'idempotency-key': string } }>('/api/v1/orders', {
    preHandler: guard, schema: { tags: ['orders'], security: S.security, body: S.orderSchema,
      headers: Type.Object({ 'idempotency-key': Type.String({ minLength: 8, maxLength: 128 }) }, { additionalProperties: true }) },
  }, async (request, reply) => reply.code(201).send(await orderService.create(request.user.sub, request.body, request.headers['idempotency-key'])));
  app.get<{ Params: { id: string } }>('/api/v1/orders/:id', { preHandler: guard,
    schema: { tags: ['orders'], security: S.security, params: S.idParams } }, request => orderService.get(request.user.sub, request.params.id));
  app.get<{ Querystring: Static<typeof listQuery> }>('/api/v1/orders', {
    preHandler: guard, schema: { tags: ['orders'], security: S.security, querystring: listQuery },
  }, async request => {
    const cursor = request.query.cursor ? await orderService.get(request.user.sub, request.query.cursor) : null;
    const rows = await db.select().from(orders).where(and(eq(orders.userId, request.user.sub), cursor
      ? or(lt(orders.createdAt, cursor.createdAt), and(eq(orders.createdAt, cursor.createdAt), lt(orders.id, cursor.id))) : undefined))
      .orderBy(desc(orders.createdAt), desc(orders.id)).limit((request.query.limit ?? 20) + 1);
    const visible = rows.slice(0, request.query.limit ?? 20);
    const items = visible.length ? await db.select({ item: orderItems, returnStatus: returns.status }).from(orderItems)
      .leftJoin(returns, eq(returns.orderItemId, orderItems.id)).where(inArray(orderItems.orderId, visible.map(o => o.id))) : [];
    return { items: visible.map(o => ({ ...o, items: items.filter(i => i.item.orderId === o.id).map(i => ({ ...i.item, returnStatus: i.returnStatus })) })),
      nextCursor: rows.length > visible.length ? visible.at(-1)!.id : null };
  });
  app.post<{ Params: { id: string } }>('/api/v1/orders/:id/cancel', { preHandler: guard,
    schema: { tags: ['orders'], security: S.security, params: S.idParams } }, request => orderService.cancel(request.user.sub, request.params.id));
  app.post<{ Body: Static<typeof S.returnSchema> }>('/api/v1/returns', {
    preHandler: guard, schema: { tags: ['returns'], security: S.security, body: S.returnSchema },
  }, async (request, reply) => {
    const [entry] = await db.select({ item: orderItems, order: orders }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orderItems.id, request.body.orderItemId), eq(orders.userId, request.user.sub)));
    if (!entry) notFound();
    if (entry.order.status !== 'delivered') conflict('Iade icin siparis teslim edilmis olmali');
    if (request.body.reason === 'size_mismatch' && !request.body.mismatchAreas.length)
      throw new ApiError(400, 'MISMATCH_AREA_REQUIRED', 'Uyumsuz olcu bolgesini belirtin');
    try {
      const [created] = await db.insert(returns).values(request.body).returning();
      return reply.code(201).send(created);
    } catch (error) { if (isUniqueViolation(error)) conflict('Bu kalem icin iade zaten acildi'); throw error; }
  });
  const statusSchema = Type.Object({ status: Type.Union([Type.Literal('paid'), Type.Literal('shipped'), Type.Literal('delivered')]) }, { additionalProperties: false });
  app.patch<{ Params: { id: string }; Body: Static<typeof statusSchema> }>('/api/v1/admin/orders/:id/status', {
    preHandler: admin, schema: { tags: ['orders'], security: S.security, params: S.idParams, body: statusSchema },
  }, request => {
    if (request.body.status === 'paid' && config.production) throw new ApiError(422, 'PAYMENT_INTEGRATION_REQUIRED', 'Odeme saglayicisi entegrasyonu gerekli');
    return orderService.transition(request.params.id, request.body.status);
  });

  app.put<{ Params: { id: string }; Body: Static<typeof S.measurementSchema> }>('/api/v1/seller/variants/:id/measurements', {
    preHandler: guard, schema: { tags: ['seller'], security: S.security, params: S.idParams, body: S.measurementSchema },
  }, async request => {
    const [entry] = await db.select({ product: products }).from(variants).innerJoin(products, eq(variants.productId, products.id))
      .innerJoin(stores, eq(products.storeId, stores.id)).innerJoin(vendors, eq(stores.vendorId, vendors.id))
      .where(and(eq(variants.id, request.params.id), eq(vendors.ownerId, request.user.sub)));
    if (!entry) notFound();
    const { expectedRevision, ...values } = request.body;
    try {
      return await db.transaction(async tx => {
        let updated;
        if (expectedRevision === 0) {
          [updated] = await tx.insert(measurements).values({ ...values, variantId: request.params.id }).returning();
        } else {
          [updated] = await tx.update(measurements).set({ ...values, revision: sql`${measurements.revision} + 1`, updatedAt: new Date() })
            .where(and(eq(measurements.variantId, request.params.id), eq(measurements.revision, expectedRevision))).returning();
          if (!updated) conflict('Olcu revision degisti');
        }
        await tx.update(products).set({ revision: sql`${products.revision} + 1` }).where(eq(products.id, entry.product.id));
        return updated;
      });
    } catch (error) { if (isUniqueViolation(error)) conflict('Olcu tablosu zaten mevcut'); throw error; }
  });
  app.get<{ Params: { id: string } }>('/api/v1/stores/:id/metrics', { schema: { tags: ['seller'], params: S.idParams } }, async request => {
    const [store] = await db.select({ id: stores.id }).from(stores).where(and(eq(stores.id, request.params.id), eq(stores.active, true)));
    if (!store) notFound();
    const [metrics] = await db.select({
      deliveredItems: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      returnRequestedItems: sql<number>`coalesce(sum(case when ${returns.id} is not null then ${orderItems.quantity} else 0 end), 0)::int`,
      sizeMismatchRequestedItems: sql<number>`coalesce(sum(case when ${returns.reason} = 'size_mismatch' then ${orderItems.quantity} else 0 end), 0)::int`,
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).leftJoin(returns, eq(returns.orderItemId, orderItems.id))
      .where(and(eq(orderItems.storeId, request.params.id), eq(orders.status, 'delivered')));
    return { ...metrics, sizeMismatchRequestRate: metrics!.deliveredItems ? metrics!.sizeMismatchRequestedItems / metrics!.deliveredItems : 0 };
  });
}
