import { loadConfig } from './config.js';
import { buildApp } from './app.js';
import { seedDemo } from './seed.js';

const config = loadConfig();
const { app, db } = await buildApp(config, { workers: true });
try {
  if (!config.production) await seedDemo(db);
  await app.listen({ host: config.host, port: config.port });
} catch (error) { app.log.error(error); await app.close(); process.exitCode = 1; }
let closing = false;
const shutdown = async () => { if (closing) return; closing = true; await app.close(); };
process.on('SIGINT', () => { void shutdown(); });
process.on('SIGTERM', () => { void shutdown(); });
