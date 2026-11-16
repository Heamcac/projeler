import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import type { Database } from './db/client.js';
import { orders, orderItems, variants, products, productFabrics, measurements, stores } from './db/schema.js';
import type { OrderBody } from './api/schemas.js';
import { ownProfile } from './catalog.js';
import { calculateFitScore, FitInputError, type MeasurementInput } from './fit/engine.js';
import { ApiError, conflict, isUniqueViolation, notFound } from './errors.js';
import { digest } from './tryon/service.js';

export class OrderService {
  constructor(private db: Database) {}
  async create(userId: string, input: OrderBody, key: string) {
    const items = [...input.items].sort((a, b) => a.variantId.localeCompare(b.variantId));
    if (new Set(items.map(i => i.variantId)).size !== items.length) throw new ApiError(400, 'DUPLICATE_VARIANT', 'Ayni varyanti bir kez gonderin');
    const payloadHash = digest({ ...input, items });
    const existing = async () => {
      const [order] = await this.db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, key)));
      if (order && order.payloadHash !== payloadHash) conflict('Idempotency-Key farkli bir siparise ait');
      return order;
    };
    const prior = await existing();
    if (prior) return this.get(userId, prior.id);
    const profile = input.profileId ? await ownProfile(this.db, userId, input.profileId) : null;
    try {
      const orderId = await this.db.transaction(async tx => {
        let totalCents = 0;
        let currency: string | null = null;
        const snapshots: Array<Omit<typeof orderItems.$inferInsert, 'orderId'>> = [];
        for (const item of items) {
          // Conditional decrement locks the row; a concurrent buyer cannot oversell stock.
          const [variant] = await tx.update(variants).set({ stock: sql`${variants.stock} - ${item.quantity}` })
            .where(and(eq(variants.id, item.variantId), eq(variants.active, true), sql`${variants.stock} >= ${item.quantity}`)).returning();
          if (!variant) conflict('Varyant stokta yok');
          const [entry] = await tx.select({ product: products, store: stores, fabric: productFabrics, measurement: measurements })
            .from(products).innerJoin(stores, eq(products.storeId, stores.id))
            .innerJoin(productFabrics, eq(products.id, productFabrics.productId))
            .leftJoin(measurements, eq(measurements.variantId, variant.id))
            .where(and(eq(products.id, variant.productId), eq(products.active, true), eq(stores.active, true)));
          if (!entry) notFound();
          if (currency && currency !== variant.currency) conflict('Siparis tek para biriminde olmali');
          currency = variant.currency;
          totalCents += item.quantity * variant.priceCents;
          if (totalCents > 2_000_000_000) throw new ApiError(400, 'TOTAL_LIMIT', 'Siparis limiti asildi');
          const measurement: MeasurementInput | null = entry.measurement
            ? { ...entry.measurement, variantId: variant.id, size: variant.size, stock: variant.stock + item.quantity } : null;
          let fit = null;
          if (profile && measurement) {
            try { fit = calculateFitScore(profile, measurement, entry.fabric.elasticityRatio, [], entry.product.garmentType, entry.product.cut); }
            catch (error) { if (!(error instanceof FitInputError)) throw error; }
          }
          snapshots.push({ variantId: variant.id, storeId: entry.store.id, productName: entry.product.name,
            sku: variant.sku, size: variant.size, quantity: item.quantity, unitPriceCents: variant.priceCents,
            commissionBps: entry.store.commissionBps, bodySnapshot: profile,
            measurementSnapshot: measurement, fitSnapshot: fit });
        }
        const [order] = await tx.insert(orders).values({ userId, totalCents, currency: currency!,
          shippingAddress: input.shippingAddress, idempotencyKey: key, payloadHash }).returning();
        await tx.insert(orderItems).values(snapshots.map(s => ({ ...s, orderId: order!.id })));
        return order!.id;
      });
      return this.get(userId, orderId);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const order = await existing();
      if (!order) throw error;
      return this.get(userId, order.id);
    }
  }
  async get(userId: string, id: string) {
    const [order] = await this.db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, userId)));
    if (!order) notFound();
    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }
  async cancel(userId: string, id: string) {
    await this.db.transaction(async tx => {
      const [order] = await tx.update(orders).set({ status: 'cancelled' })
        .where(and(eq(orders.id, id), eq(orders.userId, userId), eq(orders.status, 'pending_payment'))).returning();
      if (!order) {
        const [existing] = await tx.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, userId)));
        if (!existing) notFound();
        if (existing.status === 'cancelled') return;
        conflict('Yalniz odeme bekleyen siparis iptal edilebilir');
      }
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.variantId);
      for (const item of items) await tx.update(variants).set({ stock: sql`${variants.stock} + ${item.quantity}` }).where(eq(variants.id, item.variantId));
    });
    return this.get(userId, id);
  }
  async expireReservations() {
    const expired = await this.db.select({ id: orders.id, userId: orders.userId }).from(orders)
      .where(and(eq(orders.status, 'pending_payment'), lt(orders.createdAt, new Date(Date.now() - 900_000)))).limit(100);
    for (const order of expired) {
      try { await this.cancel(order.userId, order.id); }
      catch (error) { if (!(error instanceof ApiError && error.statusCode === 409)) throw error; }
    }
  }
  async transition(id: string, status: 'paid' | 'shipped' | 'delivered') {
    const from = { paid: 'pending_payment', shipped: 'paid', delivered: 'shipped' } as const;
    const [order] = await this.db.update(orders).set({ status })
      .where(and(eq(orders.id, id), eq(orders.status, from[status]))).returning();
    if (!order) conflict('Gecersiz siparis durum gecisi');
    return order;
  }
}
