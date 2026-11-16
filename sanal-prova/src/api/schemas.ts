import { Type, type Static } from '@sinclair/typebox';

export const uuid = Type.String({ format: 'uuid' });
const cm = (minimum: number, maximum: number) => Type.Number({ minimum, maximum });
export const bodySchema = Type.Object({
  height: cm(80, 250), weight: cm(15, 350), chest: cm(30, 250), waist: cm(25, 250), hips: cm(30, 250),
  inseam: cm(20, 130), outseam: cm(20, 250), shoulderWidth: cm(15, 90),
  bodyShapeType: Type.Union((['hourglass', 'pear', 'apple', 'rectangle', 'athletic', 'unspecified'] as const).map(v => Type.Literal(v))),
}, { additionalProperties: false });
export const profileSchema = Type.Object({
  ...bodySchema.properties, name: Type.String({ minLength: 1, maxLength: 80 }),
  profileId: Type.Optional(uuid), expectedRevision: Type.Optional(Type.Integer({ minimum: 1 })),
  isDefault: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });
export type ProfileBody = Static<typeof profileSchema>;
export const authSchema = Type.Object({ email: Type.String({ format: 'email', maxLength: 254 }),
  password: Type.String({ minLength: 12, maxLength: 128 }) }, { additionalProperties: false });
export const registerSchema = Type.Object({ ...authSchema.properties, name: Type.String({ minLength: 1, maxLength: 120 }) }, { additionalProperties: false });
export const tryOnSchema = Type.Object({ profileId: uuid, variantId: uuid,
  mode: Type.Union([Type.Literal('ai'), Type.Literal('3d')]) }, { additionalProperties: false });
export const idParams = Type.Object({ id: uuid });
export const security = [{ bearerAuth: [] }];
export const errorSchema = Type.Object({ code: Type.String(), message: Type.String() });
export const errors = { 400: errorSchema, 401: errorSchema, 404: errorSchema, 409: errorSchema, 422: errorSchema, 429: errorSchema };
export const idempotencyHeaders = Type.Object({ 'idempotency-key': Type.Optional(Type.String({ minLength: 8, maxLength: 128 })) }, { additionalProperties: true });
export const profileResponse = Type.Object({
  ...bodySchema.properties, id: uuid, userId: uuid, name: Type.String(), isDefault: Type.Boolean(),
  revision: Type.Integer(), createdAt: Type.String(), updatedAt: Type.String(),
});
export const fitResponse = Type.Object({
  overallScore: Type.Integer({ minimum: 1, maximum: 100 }), fitVerdict: Type.String(), verdictCode: Type.String(),
  recommendedSize: Type.Union([Type.String(), Type.Null()]), recommendedVariantId: Type.Union([uuid, Type.Null()]),
  algorithmVersion: Type.String(), confidence: Type.Literal('measurement_based'), warnings: Type.Array(Type.String()),
  dimensions: Type.Array(Type.Object({ dimension: Type.String(), score: Type.Integer(), bodyCm: Type.Number(), garmentCm: Type.Number(),
    differenceCm: Type.Number(), comfortStretchCm: Type.Number(), status: Type.String() })),
});
export const tryOnResponse = Type.Object({ jobId: uuid, status: Type.String(), cached: Type.Boolean(),
  statusUrl: Type.String(), expiresAt: Type.String() });
export const orderSchema = Type.Object({
  profileId: Type.Optional(uuid),
  items: Type.Array(Type.Object({ variantId: uuid, quantity: Type.Integer({ minimum: 1, maximum: 10 }) }, { additionalProperties: false }), { minItems: 1, maxItems: 30 }),
  shippingAddress: Type.Object({ name: Type.String({ minLength: 1, maxLength: 120 }), address: Type.String({ minLength: 5, maxLength: 500 }),
    city: Type.String({ minLength: 1, maxLength: 100 }), postalCode: Type.String({ minLength: 1, maxLength: 20 }) }, { additionalProperties: false }),
}, { additionalProperties: false });
export type OrderBody = Static<typeof orderSchema>;
export const returnSchema = Type.Object({
  orderItemId: uuid, reason: Type.Union((['size_mismatch', 'damaged', 'not_as_described', 'other'] as const).map(v => Type.Literal(v))),
  mismatchAreas: Type.Array(Type.Union((['waist', 'hips', 'chest', 'inseam', 'shoulderWidth'] as const).map(v => Type.Literal(v))), { maxItems: 5, uniqueItems: true }),
  comment: Type.Optional(Type.String({ maxLength: 1000 })),
}, { additionalProperties: false });
export const measurementSchema = Type.Object({
  waist: Type.Union([cm(20, 300), Type.Null()]), hips: Type.Union([cm(20, 300), Type.Null()]),
  chest: Type.Union([cm(20, 300), Type.Null()]), inseam: Type.Union([cm(10, 150), Type.Null()]),
  outseam: Type.Union([cm(10, 250), Type.Null()]), totalLength: Type.Union([cm(10, 250), Type.Null()]),
  hemWidth: Type.Union([cm(1, 150), Type.Null()]), shoulderWidth: Type.Union([cm(10, 100), Type.Null()]),
  expectedRevision: Type.Integer({ minimum: 0 }), source: Type.Union([Type.Literal('manual'), Type.Literal('seller_table')]),
}, { additionalProperties: false });
