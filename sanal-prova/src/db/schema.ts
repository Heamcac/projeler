import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, uuid, text, varchar, integer, doublePrecision, boolean,
  timestamp, jsonb, index, uniqueIndex, check, type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import type { BodyInput, FitResult, MeasurementInput } from '../fit/engine.js';
import type { TryOnInput, TryOnResult } from '../tryon/types.js';

const id = () => uuid('id').defaultRandom().primaryKey();
const created = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
export const role = pgEnum('user_role', ['customer', 'seller', 'admin']);
export const shape = pgEnum('body_shape', ['hourglass', 'pear', 'apple', 'rectangle', 'athletic', 'unspecified']);
export const garment = pgEnum('garment_type', ['bottom', 'top', 'dress']);
export const fitCut = pgEnum('fit_cut', ['slim', 'regular', 'relaxed']);
export const assetType = pgEnum('asset_type', ['front', 'back', 'mask', 'glb', 'gltf']);
export const jobStatus = pgEnum('tryon_status', ['queued', 'processing', 'waiting', 'succeeded', 'failed']);
export const orderStatus = pgEnum('order_status', ['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled']);
export const returnReason = pgEnum('return_reason', ['size_mismatch', 'damaged', 'not_as_described', 'other']);

export const users = pgTable('users', {
  id: id(), email: varchar('email', { length: 254 }).notNull(), passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 120 }).notNull(), role: role('role').default('customer').notNull(),
  enabled: boolean('enabled').default(true).notNull(), createdAt: created(),
}, t => [uniqueIndex('users_email_uq').on(t.email)]);

export const bodyProfiles = pgTable('body_profiles', {
  id: id(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 80 }).notNull(), height: doublePrecision('height_cm').notNull(),
  weight: doublePrecision('weight_kg').notNull(), chest: doublePrecision('chest_cm').notNull(),
  waist: doublePrecision('waist_cm').notNull(), hips: doublePrecision('hips_cm').notNull(),
  inseam: doublePrecision('inseam_cm').notNull(), outseam: doublePrecision('outseam_cm').notNull(),
  shoulderWidth: doublePrecision('shoulder_width_cm').notNull(),
  bodyShapeType: shape('body_shape_type').default('unspecified').notNull(),
  isDefault: boolean('is_default').default(false).notNull(), revision: integer('revision').default(1).notNull(),
  createdAt: created(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [
  index('body_profiles_user_idx').on(t.userId),
  uniqueIndex('body_profiles_default_uq').on(t.userId).where(sql`${t.isDefault} = true`),
  check('body_profiles_bounds', sql`${t.height} between 80 and 250 and ${t.weight} between 15 and 350
    and ${t.chest} between 30 and 250 and ${t.waist} between 25 and 250 and ${t.hips} between 30 and 250
    and ${t.inseam} between 20 and 130 and ${t.outseam} between ${t.inseam} and ${t.height}
    and ${t.shoulderWidth} between 15 and 90 and ${t.revision} > 0`),
]);

export const vendors = pgTable('vendors', {
  id: id(), ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  legalName: text('legal_name').notNull(), taxId: text('tax_id').notNull(), createdAt: created(),
}, t => [uniqueIndex('vendors_owner_uq').on(t.ownerId), uniqueIndex('vendors_tax_uq').on(t.taxId)]);
export const stores = pgTable('stores', {
  id: id(), vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), slug: text('slug').notNull(), active: boolean('active').default(true).notNull(),
  commissionBps: integer('commission_bps').default(1500).notNull(), createdAt: created(),
}, t => [uniqueIndex('stores_slug_uq').on(t.slug), index('stores_vendor_idx').on(t.vendorId),
  check('commission_bounds', sql`${t.commissionBps} between 0 and 10000`)]);
export const storeMetrics = pgTable('store_metrics', {
  storeId: uuid('store_id').primaryKey().references(() => stores.id, { onDelete: 'cascade' }),
  deliveredItems: integer('delivered_items').default(0).notNull(),
  returnedItems: integer('returned_items').default(0).notNull(), sizeMismatchItems: integer('size_mismatch_items').default(0).notNull(),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [check('metrics_bounds', sql`${t.deliveredItems} >= 0 and ${t.returnedItems} >= 0
  and ${t.returnedItems} <= ${t.deliveredItems} and ${t.sizeMismatchItems} between 0 and ${t.returnedItems}`)]);
export const categories = pgTable('categories', {
  id: id(), parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'restrict' }), name: text('name').notNull(), slug: text('slug').notNull(),
}, t => [uniqueIndex('categories_slug_uq').on(t.slug), index('categories_parent_idx').on(t.parentId)]);
export const brands = pgTable('brands', { id: id(), name: text('name').notNull() }, t => [uniqueIndex('brands_name_uq').on(t.name)]);
export const products = pgTable('products', {
  id: id(), storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), description: text('description').notNull(),
  garmentType: garment('garment_type').notNull(), cut: fitCut('cut').default('regular').notNull(),
  active: boolean('active').default(false).notNull(), revision: integer('revision').default(1).notNull(), createdAt: created(),
}, t => [index('products_feed_idx').on(t.active, t.garmentType, t.id), index('products_store_idx').on(t.storeId),
  index('products_category_idx').on(t.categoryId), index('products_brand_idx').on(t.brandId)]);
export const productFabrics = pgTable('product_fabrics', {
  productId: uuid('product_id').primaryKey().references(() => products.id, { onDelete: 'cascade' }),
  cottonPct: integer('cotton_pct').default(0).notNull(), elastanePct: integer('elastane_pct').default(0).notNull(),
  polyesterPct: integer('polyester_pct').default(0).notNull(), otherPct: integer('other_pct').default(0).notNull(),
  elasticityRatio: doublePrecision('elasticity_ratio').default(0).notNull(),
  elasticitySource: text('elasticity_source').default('measured').notNull(),
}, t => [check('fabric_composition', sql`${t.cottonPct} between 0 and 100 and ${t.elastanePct} between 0 and 100
  and ${t.polyesterPct} between 0 and 100 and ${t.otherPct} between 0 and 100
  and ${t.cottonPct} + ${t.elastanePct} + ${t.polyesterPct} + ${t.otherPct} = 100`),
  check('elasticity_bounds', sql`${t.elasticityRatio} between 0 and 0.5`)]);
export const variants = pgTable('product_variants', {
  id: id(), productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  sku: text('sku').notNull(), size: text('size').notNull(), color: text('color').notNull(),
  priceCents: integer('price_cents').notNull(), currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  stock: integer('stock').default(0).notNull(), active: boolean('active').default(true).notNull(),
}, t => [uniqueIndex('variants_sku_uq').on(t.sku), uniqueIndex('variants_size_color_uq').on(t.productId, t.size, t.color),
  index('variants_product_idx').on(t.productId), check('variant_bounds', sql`${t.priceCents} > 0 and ${t.stock} >= 0`)]);
export const measurements = pgTable('product_measurements', {
  variantId: uuid('variant_id').primaryKey().references(() => variants.id, { onDelete: 'cascade' }),
  waist: doublePrecision('waist_circumference_cm'), hips: doublePrecision('hips_circumference_cm'),
  chest: doublePrecision('chest_circumference_cm'), inseam: doublePrecision('inseam_cm'),
  outseam: doublePrecision('outseam_cm'), totalLength: doublePrecision('total_length_cm'),
  hemWidth: doublePrecision('hem_flat_width_cm'), shoulderWidth: doublePrecision('shoulder_width_cm'),
  source: text('source').default('manual').notNull(), revision: integer('revision').default(1).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [index('measurements_feed_idx').on(t.waist, t.inseam),
  check('measurement_positive', sql`(${t.waist} is null or ${t.waist} between 20 and 300)
    and (${t.hips} is null or ${t.hips} between 20 and 300) and (${t.chest} is null or ${t.chest} between 20 and 300)
    and (${t.inseam} is null or ${t.inseam} between 10 and 150) and (${t.outseam} is null or ${t.outseam} between 10 and 250)
    and (${t.totalLength} is null or ${t.totalLength} between 10 and 250)
    and (${t.hemWidth} is null or ${t.hemWidth} between 1 and 150)
    and (${t.shoulderWidth} is null or ${t.shoulderWidth} between 10 and 100) and ${t.revision} > 0`)]);
export const fittingAssets = pgTable('fitting_assets', {
  id: id(), variantId: uuid('variant_id').notNull().references(() => variants.id, { onDelete: 'cascade' }),
  type: assetType('type').notNull(), url: text('url').notNull(), sha256: varchar('sha256', { length: 64 }).notNull(),
  revision: integer('revision').default(1).notNull(), metadata: jsonb('metadata').$type<Record<string, unknown>>(), createdAt: created(),
}, t => [uniqueIndex('assets_variant_type_uq').on(t.variantId, t.type), index('assets_variant_idx').on(t.variantId)]);
export const fitAnalysisLogs = pgTable('fit_analysis_logs', {
  id: id(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => bodyProfiles.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').notNull().references(() => variants.id, { onDelete: 'restrict' }),
  profileRevision: integer('profile_revision').notNull(), algorithmVersion: text('algorithm_version').notNull(),
  score: integer('score').notNull(), analysis: jsonb('analysis').$type<FitResult>().notNull(), createdAt: created(),
}, t => [index('fit_logs_user_created_idx').on(t.userId, t.createdAt), index('fit_logs_variant_idx').on(t.variantId),
  index('fit_logs_profile_idx').on(t.profileId), check('fit_score_bounds', sql`${t.score} between 1 and 100`)]);
export const tryOnJobs = pgTable('tryon_jobs', {
  id: id(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => bodyProfiles.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').notNull().references(() => variants.id, { onDelete: 'restrict' }),
  mode: text('mode').$type<'ai' | '3d'>().notNull(), status: jobStatus('status').default('queued').notNull(),
  cacheKey: text('cache_key').notNull(),
  payloadHash: text('payload_hash').notNull(), input: jsonb('input').$type<TryOnInput>().notNull(),
  result: jsonb('result').$type<TryOnResult>(), errorCode: text('error_code'), providerJobId: text('provider_job_id'),
  attempts: integer('attempts').default(0).notNull(), nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), createdAt: created(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [uniqueIndex('tryon_user_cache_uq').on(t.userId, t.cacheKey),
  index('tryon_dispatch_idx').on(t.status, t.nextAttemptAt),
  index('tryon_profile_idx').on(t.profileId), index('tryon_variant_idx').on(t.variantId),
  check('tryon_mode', sql`${t.mode} in ('ai', '3d')`)]);
export const tryOnRequests = pgTable('tryon_requests', {
  id: id(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 128 }).notNull(), payloadHash: text('payload_hash').notNull(),
  jobId: uuid('job_id').notNull().references(() => tryOnJobs.id, { onDelete: 'cascade' }), createdAt: created(),
}, t => [uniqueIndex('tryon_requests_user_key_uq').on(t.userId, t.key), index('tryon_requests_job_idx').on(t.jobId)]);
export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(), jobId: uuid('job_id').notNull().references(() => tryOnJobs.id, { onDelete: 'cascade' }), createdAt: created(),
}, t => [index('webhook_job_idx').on(t.jobId)]);
export const orders = pgTable('orders', {
  id: id(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  status: orderStatus('status').default('pending_payment').notNull(), currency: varchar('currency', { length: 3 }).notNull(),
  totalCents: integer('total_cents').notNull(), shippingAddress: jsonb('shipping_address').$type<{ name: string; address: string; city: string; postalCode: string }>().notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(), payloadHash: text('payload_hash').notNull(), createdAt: created(),
}, t => [uniqueIndex('orders_user_idempotency_uq').on(t.userId, t.idempotencyKey), index('orders_user_created_idx').on(t.userId, t.createdAt),
  index('orders_status_idx').on(t.status), check('orders_total', sql`${t.totalCents} > 0`)]);
export const orderItems = pgTable('order_items', {
  id: id(), orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').notNull().references(() => variants.id, { onDelete: 'restrict' }),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'restrict' }),
  productName: text('product_name').notNull(), sku: text('sku').notNull(), size: text('size').notNull(),
  quantity: integer('quantity').notNull(), unitPriceCents: integer('unit_price_cents').notNull(), commissionBps: integer('commission_bps').notNull(),
  bodySnapshot: jsonb('body_snapshot').$type<BodyInput>(), measurementSnapshot: jsonb('measurement_snapshot').$type<MeasurementInput>(),
  fitSnapshot: jsonb('fit_snapshot').$type<FitResult>(),
}, t => [index('order_items_order_idx').on(t.orderId), index('order_items_store_idx').on(t.storeId), index('order_items_variant_idx').on(t.variantId),
  check('order_item_bounds', sql`${t.quantity} > 0 and ${t.unitPriceCents} > 0 and ${t.commissionBps} between 0 and 10000`)]);
export const returns = pgTable('returns', {
  id: id(), orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'restrict' }),
  reason: returnReason('reason').notNull(), mismatchAreas: jsonb('mismatch_areas').$type<string[]>().default([]).notNull(),
  comment: text('comment'), status: text('status').default('requested').notNull(), createdAt: created(),
}, t => [uniqueIndex('returns_item_uq').on(t.orderItemId), index('returns_reason_idx').on(t.reason),
  check('return_status', sql`${t.status} in ('requested', 'approved', 'rejected', 'refunded')`)]);
