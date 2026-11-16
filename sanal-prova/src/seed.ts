import { eq } from 'drizzle-orm';
import type { Database } from './db/client.js';
import { users, vendors, stores, categories, brands, products, productFabrics, variants, measurements, bodyProfiles, fittingAssets } from './db/schema.js';
import { hashPassword } from './auth.js';
import { digest } from './tryon/service.js';

export const DEMO_PASSWORD = 'DemoOnly-2026!';
export const DEMO_BODY = { height: 172, weight: 68, chest: 94, waist: 76, hips: 100,
  inseam: 78, outseam: 102, shoulderWidth: 40, bodyShapeType: 'pear' as const };
export async function seedDemo(db: Database) {
  const [existing] = await db.select().from(users).where(eq(users.email, 'customer@demo.local'));
  if (existing) return;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db.transaction(async tx => {
    const [customer] = await tx.insert(users).values({ email: 'customer@demo.local', name: 'Demo Musteri', passwordHash }).returning();
    const [seller] = await tx.insert(users).values({ email: 'seller@demo.local', name: 'Demo Satici', role: 'seller', passwordHash }).returning();
    await tx.insert(users).values({ email: 'admin@demo.local', name: 'Demo Yonetici', role: 'admin', passwordHash });
    await tx.insert(bodyProfiles).values({ ...DEMO_BODY, name: 'Kendim', userId: customer!.id, isDefault: true });
    const [vendor] = await tx.insert(vendors).values({ ownerId: seller!.id, legalName: 'Demo Tekstil', taxId: 'DEMO-NOT-A-REAL-TAX-ID' }).returning();
    const [store] = await tx.insert(stores).values({ vendorId: vendor!.id, name: 'Fit Studio', slug: 'fit-studio', commissionBps: 1500 }).returning();
    const [category] = await tx.insert(categories).values({ name: 'Giyim', slug: 'giyim' }).returning();
    const [brand] = await tx.insert(brands).values({ name: 'Fit Studio' }).returning();
    for (const definition of [
      { name: 'Regular Denim', garmentType: 'bottom' as const, stretch: 0.04, cotton: 98, elastane: 2, price: 129900 },
      { name: 'Uzun Pacali Pantolon', garmentType: 'bottom' as const, stretch: 0, cotton: 100, elastane: 0, price: 99900 },
      { name: 'Pamuk Gomlek', garmentType: 'top' as const, stretch: 0, cotton: 100, elastane: 0, price: 79900 },
      { name: 'Regular Elbise', garmentType: 'dress' as const, stretch: 0.03, cotton: 97, elastane: 3, price: 159900 },
    ]) {
      const [product] = await tx.insert(products).values({ storeId: store!.id, categoryId: category!.id, brandId: brand!.id,
        name: definition.name, description: 'Olculeri kayitli demo urun', garmentType: definition.garmentType, cut: 'regular', active: true }).returning();
      await tx.insert(productFabrics).values({ productId: product!.id, cottonPct: definition.cotton, elastanePct: definition.elastane,
        elasticityRatio: definition.stretch, elasticitySource: 'demo_measurement' });
      for (const [size, offset] of [['S', -4], ['M', 0], ['L', 4]] as const) {
        const [variant] = await tx.insert(variants).values({ productId: product!.id, sku: `${definition.garmentType}-${definition.price}-${size}`,
          size, color: 'blue', stock: 20, priceCents: definition.price }).returning();
        await tx.insert(measurements).values({ variantId: variant!.id, waist: 78 + offset, hips: 104 + offset, chest: 100 + offset,
          inseam: definition.name === 'Uzun Pacali Pantolon' ? 88 : 78, outseam: 104, totalLength: 105,
          hemWidth: 18, shoulderWidth: 40 + offset / 2, source: 'demo' });
        await tx.insert(fittingAssets).values({ variantId: variant!.id, type: 'front', url: '/api/v1/demo-assets/garment.svg',
          sha256: digest({ productId: product!.id, size, type: 'front-demo' }) });
      }
    }
  });
}
