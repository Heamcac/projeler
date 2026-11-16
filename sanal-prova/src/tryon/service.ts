import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq, inArray, lte, lt, sql } from 'drizzle-orm';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { Database } from '../db/client.js';
import { tryOnJobs, tryOnRequests, webhookEvents } from '../db/schema.js';
import type { Config } from '../config.js';
import type { TryOnInput, TryOnResult } from './types.js';
import { bodyToAvatar, nearestBaseline } from './avatar.js';
import { ApiError, conflict, isUniqueViolation, notFound } from '../errors.js';

const providerResponse = Type.Union([
  Type.Object({ status: Type.Literal('completed'), imageUrl: Type.String({ minLength: 1, maxLength: 2048 }) }),
  Type.Object({ status: Type.Literal('pending'), providerJobId: Type.String({ minLength: 1, maxLength: 200 }) }),
]);
export const webhookSchema = Type.Object({
  eventId: Type.String({ minLength: 1, maxLength: 150 }), jobId: Type.String({ format: 'uuid' }),
  status: Type.Union([Type.Literal('succeeded'), Type.Literal('failed')]),
  imageUrl: Type.Optional(Type.String({ format: 'uri', maxLength: 2048 })),
}, { additionalProperties: false });
export type WebhookBody = Static<typeof webhookSchema>;
export const digest = (input: unknown) => createHash('sha256').update(JSON.stringify(input)).digest('hex');
const DAY = 86_400_000;
type Job = typeof tryOnJobs.$inferSelect;

export class TryOnService {
  private redis?: Redis;
  private queue?: Queue<{ id: string }>;
  private worker?: Worker<{ id: string }>;
  private timer?: NodeJS.Timeout;
  private tickPromise?: Promise<void>;
  constructor(private db: Database, private config: Config, private log: (error: unknown) => void = () => {}) {}

  async start() {
    if (this.config.queueMode === 'redis') {
      this.redis = new Redis(this.config.redisUrl, { maxRetriesPerRequest: null });
      this.redis.on('error', this.log);
      await this.redis.ping();
      this.queue = new Queue('virtual-fit-tryon', { connection: this.redis });
      this.worker = new Worker('virtual-fit-tryon', async job => this.process(job.data.id),
        { connection: this.redis, concurrency: 4 });
      this.worker.on('error', this.log);
    }
    this.timer = setInterval(() => { void this.tick().catch(this.log); }, 500);
    this.timer.unref();
    await this.tick();
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    await this.tickPromise;
    await this.worker?.close();
    await this.queue?.close();
    await this.redis?.quit();
  }

  async enqueue(userId: string, profileId: string, variantId: string, input: TryOnInput, idempotencyKey?: string) {
    const payloadHash = digest({ profileId, variantId, input });
    if (idempotencyKey) {
      const [existing] = await this.db.select().from(tryOnRequests)
        .where(and(eq(tryOnRequests.userId, userId), eq(tryOnRequests.key, idempotencyKey)));
      if (existing) {
        if (existing.payloadHash !== payloadHash) conflict('Idempotency-Key farkli bir istek icin kullanildi');
        const job = await this.get(userId, existing.jobId);
        return { job, cached: job.status === 'succeeded' };
      }
    }
    const epoch = Math.floor(Date.now() / DAY);
    const cacheKey = digest({ userId, payloadHash, epoch });
    // This database row is also the durable outbox. Redis publication is retried by tick().
    try {
      const job = await this.db.transaction(async tx => {
        const [inserted] = await tx.insert(tryOnJobs).values({ userId, profileId, variantId,
          mode: input.mode, cacheKey, payloadHash, input, expiresAt: new Date((epoch + 1) * DAY) }).onConflictDoNothing().returning();
        const existing = inserted ?? (await tx.select().from(tryOnJobs).where(and(eq(tryOnJobs.userId, userId), eq(tryOnJobs.cacheKey, cacheKey))))[0];
        if (!existing) conflict('Eszamanli prova cakismasi');
        if (idempotencyKey) await tx.insert(tryOnRequests).values({ userId, key: idempotencyKey, payloadHash, jobId: existing.id });
        return existing;
      });
      return { job, cached: job.status === 'succeeded' };
    } catch (error) {
      if (!isUniqueViolation(error) || !idempotencyKey) throw error;
      const [binding] = await this.db.select().from(tryOnRequests).where(and(eq(tryOnRequests.userId, userId), eq(tryOnRequests.key, idempotencyKey)));
      if (binding?.payloadHash !== payloadHash) conflict('Idempotency-Key farkli bir istek icin kullanildi');
      const job = await this.get(userId, binding.jobId);
      return { job, cached: job.status === 'succeeded' };
    }
  }

  async get(userId: string, id: string): Promise<Job> {
    const [job] = await this.db.select().from(tryOnJobs).where(and(eq(tryOnJobs.id, id), eq(tryOnJobs.userId, userId)));
    if (!job) notFound();
    if (this.redis && job.status === 'succeeded' && job.expiresAt > new Date()) {
      // Cache stores only output; authorization always comes from the database.
      const cached = await this.redis.get(`tryon-result-${job.cacheKey}`).catch(() => null);
      if (cached) {
        try { return { ...job, result: JSON.parse(cached) as TryOnResult }; } catch { /* Database remains authoritative. */ }
      }
    }
    return job;
  }

  tick(): Promise<void> {
    if (this.tickPromise) return this.tickPromise;
    this.tickPromise = this.dispatch().finally(() => { this.tickPromise = undefined; });
    return this.tickPromise;
  }

  private async dispatch() {
    const now = new Date();
    await this.db.update(tryOnJobs).set({ status: 'queued', updatedAt: now })
      .where(and(eq(tryOnJobs.status, 'processing'), lt(tryOnJobs.updatedAt, new Date(Date.now() - 120_000)), lt(tryOnJobs.attempts, 3)));
    await this.db.update(tryOnJobs).set({ status: 'failed', errorCode: 'PROVIDER_TIMEOUT', updatedAt: now })
      .where(and(inArray(tryOnJobs.status, ['waiting', 'processing']),
        lt(tryOnJobs.updatedAt, new Date(Date.now() - 900_000))));
    const pending = await this.db.select().from(tryOnJobs)
      .where(and(eq(tryOnJobs.status, 'queued'), lte(tryOnJobs.nextAttemptAt, now)))
      .orderBy(tryOnJobs.createdAt).limit(4);
    for (const job of pending) {
      if (this.queue) await this.queue.add('render', { id: job.id }, {
        jobId: `${job.id}-${job.attempts}`, removeOnComplete: true, removeOnFail: 100,
      });
      else await this.process(job.id);
    }
  }

  async process(id: string) {
    const [job] = await this.db.update(tryOnJobs).set({ status: 'processing', updatedAt: new Date(), attempts: sql`${tryOnJobs.attempts} + 1` })
      .where(and(eq(tryOnJobs.id, id), eq(tryOnJobs.status, 'queued'), lte(tryOnJobs.nextAttemptAt, new Date()))).returning();
    if (!job) return;
    try {
      const input = job.input;
      if (input.mode === '3d') {
        await this.complete(job, { kind: '3d', avatar: bodyToAvatar(input.body),
          garmentAssetUrl: input.assets.find(a => ['glb', 'gltf'].includes(a.type))?.url ?? null, simulationStatus: 'parameters_only' });
      } else if (this.config.provider === 'demo') {
        await this.complete(job, { kind: 'demo', previewUrl: `/api/v1/try-on/jobs/${job.id}/preview`,
          isSimulation: true, baselineId: nearestBaseline(input.body), notice: 'Şematik demo; gerçek AI giydirme ve fiziksel kumaş simülasyonu değildir.' });
      } else {
        await this.db.update(tryOnJobs).set({ status: 'waiting', updatedAt: new Date() })
          .where(and(eq(tryOnJobs.id, id), eq(tryOnJobs.status, 'processing')));
        const response = await fetch(this.config.vtonEndpoint, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30_000),
          headers: { 'content-type': 'application/json', authorization: `Bearer ${this.config.vtonApiKey}`, 'idempotency-key': job.id },
          body: JSON.stringify({ clientJobId: job.id, callbackUrl: `${this.config.publicBaseUrl}/api/v1/webhooks/vton`,
            input, baselineId: nearestBaseline(input.body), avatar: bodyToAvatar(input.body) }),
        });
        if (!response.ok) throw new Error('Provider request failed');
        const data: unknown = await response.json();
        if (!Value.Check(providerResponse, data)) throw new Error('Invalid provider response');
        if (data.status === 'completed') await this.complete(job, this.aiResult(data.imageUrl));
        else await this.db.update(tryOnJobs).set({ providerJobId: data.providerJobId })
          .where(and(eq(tryOnJobs.id, id), eq(tryOnJobs.status, 'waiting')));
      }
    } catch {
      await this.db.update(tryOnJobs).set({ status: job.attempts < 3 ? 'queued' : 'failed',
        errorCode: job.attempts < 3 ? null : 'PROVIDER_FAILED', updatedAt: new Date(),
        nextAttemptAt: new Date(Date.now() + 1000 * 2 ** job.attempts) })
        .where(and(eq(tryOnJobs.id, id), inArray(tryOnJobs.status, ['processing', 'waiting'])));
    }
  }

  private aiResult(imageUrl: string): TryOnResult {
    let url: URL;
    try { url = new URL(imageUrl); }
    catch { throw new ApiError(400, 'INVALID_RESULT_URL', 'Sonuc URL gecersiz'); }
    if (url.protocol !== 'https:' || url.username || url.password || !this.config.resultHosts.includes(url.hostname))
      throw new ApiError(400, 'INVALID_RESULT_URL', 'Sonuc sunucusu izinli degil');
    return { kind: 'ai', imageUrl, modelVersion: this.config.modelVersion, isSimulation: false };
  }

  private async complete(job: Job, result: TryOnResult) {
    const [updated] = await this.db.update(tryOnJobs).set({ status: 'succeeded', result, errorCode: null, updatedAt: new Date() })
      .where(and(eq(tryOnJobs.id, job.id), inArray(tryOnJobs.status, ['processing', 'waiting', 'queued']))).returning();
    if (updated) await this.cache(updated);
  }
  private async cache(job: Job) {
    const seconds = Math.floor((job.expiresAt.getTime() - Date.now()) / 1000);
    if (this.redis && seconds > 0 && job.result)
      await this.redis.set(`tryon-result-${job.cacheKey}`, JSON.stringify(job.result), 'EX', seconds).catch(this.log);
  }

  verifyWebhook(rawBody: string | Buffer, timestamp: string, signature: string) {
    if (!this.config.webhookSecret || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
      throw new ApiError(401, 'INVALID_SIGNATURE', 'Webhook imzasi gecersiz');
    if (!/^[a-f0-9]{64}$/.test(signature)) throw new ApiError(401, 'INVALID_SIGNATURE', 'Webhook imzasi gecersiz');
    const expected = createHmac('sha256', this.config.webhookSecret).update(timestamp + '.').update(rawBody).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex')))
      throw new ApiError(401, 'INVALID_SIGNATURE', 'Webhook imzasi gecersiz');
  }

  async webhook(body: WebhookBody) {
    const [job] = await this.db.select().from(tryOnJobs).where(eq(tryOnJobs.id, body.jobId));
    if (!job || job.mode !== 'ai' || this.config.provider !== 'http' || !job.attempts) notFound();
    const result = body.status === 'succeeded' ? this.aiResult(body.imageUrl ?? '') : null;
    await this.db.transaction(async tx => {
      const [event] = await tx.insert(webhookEvents).values({ id: body.eventId, jobId: body.jobId }).onConflictDoNothing().returning();
      if (!event) return;
      await tx.update(tryOnJobs).set({ status: body.status, result, errorCode: body.status === 'failed' ? 'PROVIDER_FAILED' : null, updatedAt: new Date() })
        .where(and(eq(tryOnJobs.id, body.jobId), inArray(tryOnJobs.status, ['waiting', 'processing', 'queued'])));
    });
    const [updated] = await this.db.select().from(tryOnJobs).where(eq(tryOnJobs.id, body.jobId));
    if (updated?.status === 'succeeded') await this.cache(updated);
  }
}
