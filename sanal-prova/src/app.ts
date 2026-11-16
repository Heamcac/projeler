import Fastify, { LogController } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rawBody from 'fastify-raw-body';
import type { Config } from './config.js';
import { connectDatabase } from './db/client.js';
import { TryOnService } from './tryon/service.js';
import { OrderService } from './orders.js';
import { registerRoutes } from './api/routes.js';
import { registerSellerRoutes } from './api/seller-routes.js';
import { registerStorefront } from './storefront.js';
import { ApiError } from './errors.js';
import { FitInputError } from './fit/engine.js';

export async function buildApp(config: Config, options: { migrate?: boolean; workers?: boolean; logger?: boolean } = {}) {
  const connection = await connectDatabase(config, options.migrate ?? !config.production);
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 256 * 1024,
    ajv: { customOptions: { removeAdditional: false } },
    logController: new LogController({ disableRequestLogging: true }),
  });
  try {
    await app.register(jwt, { secret: config.jwtSecret, sign: { iss: 'virtual-fit', aud: 'virtual-fit-api' },
      verify: { allowedIss: 'virtual-fit', allowedAud: 'virtual-fit-api' } });
    await app.register(cors, { origin: config.corsOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'] });
    await app.register(helmet, { contentSecurityPolicy: false });
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute',
      errorResponseBuilder: () => ({ code: 'RATE_LIMIT', message: 'Cok fazla istek' }) });
    await app.register(swagger, { openapi: {
      info: { title: 'Virtual Fit API', version: '1.0.0', description: 'Measurements: cm/kg. Prices: integer minor units. Demo outputs are schematic.' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    } });
    await app.register(swaggerUi, { routePrefix: '/docs', uiConfig: { persistAuthorization: false } });
    await app.register(rawBody, { field: 'rawBody', global: false, encoding: false, runFirst: true });
    const tryOn = new TryOnService(connection.db, config, error => app.log.error({ errorType: error instanceof Error ? error.name : 'Unknown' }, 'Try-on dispatch failed'));
    const orderService = new OrderService(connection.db);
    registerRoutes(app, connection.db, config, tryOn, orderService);
    registerSellerRoutes(app, connection.db);
    app.setErrorHandler((error, _request, reply) => {
      if (error instanceof ApiError) return reply.code(error.statusCode).send({ code: error.code, message: error.message });
      if (error instanceof FitInputError) return reply.code(422).send({ code: 'INVALID_MEASUREMENTS', message: error.message });
      const err = error as Error & { validation?: unknown; statusCode?: number };
      if (err.validation || err.statusCode === 400) return reply.code(400).send({ code: 'VALIDATION_ERROR', message: 'Istek semasi gecersiz' });
      if (err.statusCode === 429) return reply.code(429).send({ code: 'RATE_LIMIT', message: 'Cok fazla istek' });
      if (err.statusCode === 413) return reply.code(413).send({ code: 'BODY_TOO_LARGE', message: 'Istek cok buyuk' });
      app.log.error({ errorType: err.name }, 'Internal request error');
      return reply.code(500).send({ code: 'INTERNAL_ERROR', message: 'Sunucu hatasi' });
    });
    await registerStorefront(app);
    let expiryTimer: NodeJS.Timeout | undefined;
    let expiryTask: Promise<void> | undefined;
    app.addHook('onClose', async () => {
      if (expiryTimer) clearInterval(expiryTimer);
      await expiryTask;
      await tryOn.stop();
      await connection.close();
    });
    await app.ready();
    if (options.workers) {
      await tryOn.start();
      expiryTimer = setInterval(() => {
        if (!expiryTask) expiryTask = orderService.expireReservations().catch(error => app.log.error(error))
          .finally(() => { expiryTask = undefined; });
      }, 30_000);
      expiryTimer.unref();
    }
    return { app, db: connection.db, tryOn, orderService };
  } catch (error) { await app.close(); await connection.close().catch(() => {}); throw error; }
}
