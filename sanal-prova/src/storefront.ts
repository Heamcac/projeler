import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export async function registerStorefront(app: FastifyInstance) {
  const root = resolve('web/dist');
  const available = existsSync(resolve(root, 'index.html'));
  if (available) {
    await app.register(fastifyStatic, { root: resolve(root, 'assets'), prefix: '/assets/',
      maxAge: '1y', immutable: true, schemaHide: true });
  }
  app.get('/', { schema: { hide: true } }, async (_, reply) => available
    ? reply.header('cache-control', 'no-cache').sendFile('index.html', root) : reply.redirect('/docs/'));
  app.setNotFoundHandler((request, reply) => {
    if (available && request.method === 'GET' && !/^\/(api|docs|assets)(\/|$)/.test(request.url)
      && request.headers.accept?.includes('text/html'))
      return reply.header('cache-control', 'no-cache').sendFile('index.html', root);
    return reply.code(404).send({ code: 'NOT_FOUND', message: 'Route bulunamadi' });
  });
}
