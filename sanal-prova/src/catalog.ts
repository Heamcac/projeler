import { and, eq } from 'drizzle-orm';
import type { Database } from './db/client.js';
import { bodyProfiles, products, productFabrics, variants, measurements, fittingAssets, stores } from './db/schema.js';
import { notFound, ApiError } from './errors.js';
import type { MeasurementInput } from './fit/engine.js';

export async function ownProfile(db: Database, userId: string, profileId: string) {
  const [profile] = await db.select().from(bodyProfiles).where(and(eq(bodyProfiles.id, profileId), eq(bodyProfiles.userId, userId)));
  if (!profile) notFound();
  return profile;
}
export async function getProduct(db: Database, productId: string) {
  const [entry] = await db.select({ product: products, fabric: productFabrics }).from(products)
    .innerJoin(productFabrics, eq(products.id, productFabrics.productId))
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(and(eq(products.id, productId), eq(products.active, true), eq(stores.active, true)));
  if (!entry) notFound();
  const rows = await db.select({ variant: variants, measurements }).from(variants)
    .leftJoin(measurements, eq(variants.id, measurements.variantId))
    .where(and(eq(variants.productId, productId), eq(variants.active, true)));
  const assets = await db.select().from(fittingAssets).innerJoin(variants, eq(fittingAssets.variantId, variants.id))
    .where(eq(variants.productId, productId));
  const demoMedia: Record<string, { url: string; displayName: string; tone: string }> = {
    'Regular Denim': { url: 'https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?auto=format&fit=max&w=1000&q=85', displayName: 'Regular denim', tone: 'İndigo' },
    'Uzun Pacali Pantolon': { url: 'https://www.y-a-s.com/on/demandware.static/-/Sites-pim-catalog/default/dw6887f99b/pim-static/YS/26037912/26037912_Black_001.jpg', displayName: 'Uzun paçalı pantolon', tone: 'Siyah' },
    'Pamuk Gomlek': { url: 'https://shirtonomy.se/cdn/shop/files/Shirtonomy-white-giro-inglese-2.jpg?v=1711285017', displayName: 'Pamuk gömlek', tone: 'Beyaz' },
    'Regular Elbise': { url: 'https://petalandpup.com/cdn/shop/files/petal-and-pup-usa-dresses-darby-midi-dress-ibiza-green-35733659713713.jpg?v=1716175684&width=1000', displayName: 'Regular midi elbise', tone: 'Yeşil' },
  };
  const sample = rows.some(r => r.measurements?.source === 'demo') ? demoMedia[entry.product.name] : undefined;
  const front = assets.find(a => a.fitting_assets.type === 'front')?.fitting_assets.url;
  return { ...entry, variants: rows, assets: assets.map(a => a.fitting_assets),
    media: { url: sample?.url ?? front ?? null, representative: !!sample,
      displayName: sample?.displayName ?? entry.product.name, tone: sample?.tone ?? rows[0]?.variant.color ?? '' } };
}
export type CatalogProduct = Awaited<ReturnType<typeof getProduct>>;
export function toMeasurement(row: CatalogProduct['variants'][number]): MeasurementInput {
  if (!row.measurements) throw new ApiError(422, 'MISSING_MEASUREMENTS', 'Varyant olculeri eksik');
  return { ...row.measurements, variantId: row.variant.id, size: row.variant.size, stock: row.variant.stock };
}
