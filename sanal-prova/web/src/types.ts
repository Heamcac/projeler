import type { BodyInput, FitResult, GarmentType, FitCut } from '../../src/fit/engine.js';
import type { TryOnResult } from '../../src/tryon/types.js';
export type { BodyInput, FitResult, GarmentType, FitCut, TryOnResult };
export interface User { id: string; name: string; email: string; role: string }
export interface Profile extends BodyInput { id: string; userId: string; name: string; isDefault: boolean; revision: number }
export interface Variant { id: string; productId: string; sku: string; size: string; color: string; priceCents: number; currency: string; stock: number; active: boolean }
export interface Product {
  product: { id: string; name: string; description: string; storeId: string; garmentType: GarmentType; cut: FitCut };
  fabric: { cottonPct: number; elastanePct: number; polyesterPct: number; otherPct: number; elasticityRatio: number };
  variants: Array<{ variant: Variant; measurements: Record<string, number | string | null> | null }>;
  assets: Array<{ id: string; variantId: string; type: string; url: string }>;
  media: { url: string | null; representative: boolean; displayName: string; tone: string };
}
export interface FitCheck { variantId: string; profileRevision: number; fit: FitResult }
export interface CartItem { productId: string; variantId: string; quantity: number }
export interface OrderItem { id: string; variantId: string; productName: string; quantity: number; unitPriceCents: number; size: string; fitSnapshot: FitResult | null; returnStatus?: string | null }
export interface Order { id: string; status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled'; totalCents: number; currency: string; createdAt: string; items: OrderItem[] }
export interface TryOnJob { jobId: string; status: 'queued' | 'processing' | 'waiting' | 'succeeded' | 'failed'; result: TryOnResult | null; errorCode: string | null }
