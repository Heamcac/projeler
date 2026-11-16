import { writeFile } from 'node:fs/promises';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
const config = loadConfig({ NODE_ENV: 'test', PGLITE_PATH: 'memory://' });
const { app } = await buildApp(config, { migrate: false, logger: false });
try { await writeFile('openapi.json', JSON.stringify(app.swagger(), null, 2) + '\n'); }
finally { await app.close(); }
