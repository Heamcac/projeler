import type { FastifyInstance } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { users, vendors, stores, categories, brands, products, productFabrics, variants, measurements, fittingAssets } from '../db/schema.js';
import { authGuard } from '../auth.js';
import { ApiError, conflict, isUniqueViolation, notFound } from '../errors.js';
import { assertMeasurements } from '../fit/engine.js';
import { idParams, measurementSchema, security, uuid } from './schemas.js';

const assetSchema = Type.Object({ type: Type.Union((['front', 'back', 'mask', 'glb', 'gltf'] as const).map(v => Type.Literal(v))),
  url: Type.String({ format: 'uri', maxLength: 2048 }), sha256: Type.String({ pattern: '^[a-f0-9]{64}$' }) }, { additionalProperties: false });
const fabricSchema = Type.Object({ cottonPct: Type.Integer({ minimum: 0, maximum: 100 }),
  elastanePct: Type.Integer({ minimum: 0, maximum: 100 }), polyesterPct: Type.Integer({ minimum: 0, maximum: 100 }),
  otherPct: Type.Integer({ minimum: 0, maximum: 100 }), elasticityRatio: Type.Number({ minimum: 0, maximum: 0.5 }),
  elasticitySource: Type.Union([Type.Literal('measured'), Type.Literal('supplier_test')]) }, { additionalProperties: false });
const productSchema = Type.Object({
  storeId: uuid, categoryId: uuid, brandId: Type.Optional(uuid), name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.String({ minLength: 1, maxLength: 10000 }),
  garmentType: Type.Union([Type.Literal('bottom'), Type.Literal('top'), Type.Literal('dress')]),
  cut: Type.Union([Type.Literal('slim'), Type.Literal('regular'), Type.Literal('relaxed')]),
  fabric: fabricSchema,
  variants: Type.Array(Type.Object({
    sku: Type.String({ minLength: 1, maxLength: 100 }), size: Type.String({ minLength: 1, maxLength: 30 }),
    color: Type.String({ minLength: 1, maxLength: 80 }), priceCents: Type.Integer({ minimum: 1, maximum: 100000000 }),
    currency: Type.String({ pattern: '^[A-Z]{3}$' }), stock: Type.Integer({ minimum: 0, maximum: 100000 }),
    measurements: Type.Omit(measurementSchema, ['expectedRevision']),
    assets: Type.Array(assetSchema, { maxItems: 5 }),
  }, { additionalProperties: false }), { minItems: 1, maxItems: 50 }),
}, { additionalProperties: false });
const vendorSchema = Type.Object({ ownerId: uuid, legalName: Type.String({ minLength: 2, maxLength: 200 }),
  taxId: Type.String({ minLength: 5, maxLength: 40 }), storeName: Type.String({ minLength: 2, maxLength: 150 }),
  storeSlug: Type.String({ pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 100 }),
  commissionBps: Type.Integer({ minimum: 0, maximum: 10000 }),
}, { additionalProperties: false });

export function registerSellerRoutes(app: FastifyInstance, db: Database) {
  const guard = authGuard(app, db);
  app.post<{ Body: Static<typeof vendorSchema> }>('/api/v1/admin/vendors', {
    preHandler: guard, schema: { tags: ['seller'], security, body: vendorSchema },
  }, async (request, reply) => {
    const [admin] = await db.select().from(users).where(eq(users.id, request.user.sub));
    if (admin?.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Yonetici yetkisi gerekli');
    const [owner] = await db.select().from(users).where(eq(users.id, request.body.ownerId));
    if (!owner?.enabled) notFound();
    try {
      const result = await db.transaction(async tx => {
        const [vendor] = await tx.insert(vendors).values({ ownerId: owner.id, legalName: request.body.legalName, taxId: request.body.taxId }).returning();
        const [store] = await tx.insert(stores).values({ vendorId: vendor!.id, name: request.body.storeName,
          slug: request.body.storeSlug, commissionBps: request.body.commissionBps }).returning();
        if (owner.role === 'customer') await tx.update(users).set({ role: 'seller' }).where(eq(users.id, owner.id));
        return { vendor, store };
      });
      return reply.code(201).send(result);
    } catch (error) { if (isUniqueViolation(error)) conflict('Satici, vergi kimligi veya magaza adi mevcut'); throw error; }
  });
  app.get('/api/v1/categories', { schema: { tags: ['products'] } }, () => db.select().from(categories).orderBy(categories.name));
  app.get('/api/v1/brands', { schema: { tags: ['products'] } }, () => db.select().from(brands).orderBy(brands.name));
  const categorySchema = Type.Object({ name: Type.String({ minLength: 1, maxLength: 100 }),
    slug: Type.String({ pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 100 }), parentId: Type.Optional(uuid) }, { additionalProperties: false });
  app.post<{ Body: Static<typeof categorySchema> }>('/api/v1/admin/categories', {
    preHandler: guard, schema: { tags: ['seller'], security, body: categorySchema },
  }, async (request, reply) => {
    const [user] = await db.select().from(users).where(eq(users.id, request.user.sub));
    if (user?.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Yonetici yetkisi gerekli');
    if (request.body.parentId && !(await db.select().from(categories).where(eq(categories.id, request.body.parentId)))[0]) notFound();
    try {
      const [category] = await db.insert(categories).values(request.body).returning();
      return reply.code(201).send(category);
    } catch (error) { if (isUniqueViolation(error)) conflict('Kategori slug zaten mevcut'); throw error; }
  });
  app.get('/api/v1/seller/stores', { preHandler: guard, schema: { tags: ['seller'], security } }, request =>
    db.select({ store: stores }).from(stores).innerJoin(vendors, eq(stores.vendorId, vendors.id)).where(eq(vendors.ownerId, request.user.sub)));
  app.post<{ Body: Static<typeof productSchema> }>('/api/v1/seller/products', {
    preHandler: guard, schema: { tags: ['seller'], security, body: productSchema },
  }, async (request, reply) => {
    const body = request.body;
    const [store] = await db.select({ id: stores.id }).from(stores).innerJoin(vendors, eq(stores.vendorId, vendors.id))
      .where(and(eq(stores.id, body.storeId), eq(stores.active, true), eq(vendors.ownerId, request.user.sub)));
    if (!store) notFound();
    if (!(await db.select().from(categories).where(eq(categories.id, body.categoryId)))[0]) notFound();
    if (body.brandId && !(await db.select().from(brands).where(eq(brands.id, body.brandId)))[0]) notFound();
    const f = body.fabric;
    if (f.cottonPct + f.elastanePct + f.polyesterPct + f.otherPct !== 100)
      throw new ApiError(422, 'INVALID_COMPOSITION', 'Kumas yuzdeleri toplam 100 olmali');
    for (const variant of body.variants) {
      assertMeasurements({ ...variant.measurements, variantId: '', size: variant.size, stock: variant.stock }, body.garmentType);
      if (new Set(variant.assets.map(a => a.type)).size !== variant.assets.length)
        throw new ApiError(400, 'DUPLICATE_ASSET_TYPE', 'Varyant basina her asset tipi tek olmali');
      for (const asset of variant.assets) {
        const url = new URL(asset.url);
        if (url.protocol !== 'https:' || url.username || url.password)
          throw new ApiError(400, 'INVALID_ASSET_URL', 'Asset URL HTTPS olmali');
      }
    }
    try {
      const result = await db.transaction(async tx => {
        const [product] = await tx.insert(products).values({ storeId: body.storeId, categoryId: body.categoryId, brandId: body.brandId,
          name: body.name, description: body.description, garmentType: body.garmentType, cut: body.cut, active: true }).returning();
        await tx.insert(productFabrics).values({ ...body.fabric, productId: product!.id });
        const createdVariants = [];
        for (const v of body.variants) {
          const { measurements: m, assets, ...data } = v;
          const [variant] = await tx.insert(variants).values({ ...data, productId: product!.id }).returning();
          await tx.insert(measurements).values({ ...m, variantId: variant!.id });
          if (assets.length) await tx.insert(fittingAssets).values(assets.map(a => ({ ...a, variantId: variant!.id })));
          createdVariants.push(variant);
        }
        return { product, variants: createdVariants };
      });
      return reply.code(201).send(result);
    } catch (error) { if (isUniqueViolation(error)) conflict('SKU veya beden/renk zaten mevcut'); throw error; }
  });
  app.patch<{ Params: { id: string }; Body: { active: boolean } }>('/api/v1/seller/products/:id', {
    preHandler: guard, schema: { tags: ['seller'], security, params: idParams,
      body: Type.Object({ active: Type.Boolean() }, { additionalProperties: false }) },
  }, async request => {
    const [owned] = await db.select({ id: products.id }).from(products).innerJoin(stores, eq(products.storeId, stores.id))
      .innerJoin(vendors, eq(stores.vendorId, vendors.id)).where(and(eq(products.id, request.params.id), eq(vendors.ownerId, request.user.sub)));
    if (!owned) notFound();
    const [product] = await db.update(products).set({ active: request.body.active }).where(eq(products.id, owned.id)).returning();
    return product;
  });
}
