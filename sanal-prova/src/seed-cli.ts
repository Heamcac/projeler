import { loadConfig } from './config.js';
import { connectDatabase } from './db/client.js';
import { seedDemo } from './seed.js';
const config = loadConfig();
if (config.production) throw new Error('Demo seed is disabled in production');
const connection = await connectDatabase(config, true);
try { await seedDemo(connection.db); console.log('Demo seed ready.'); }
finally { await connection.close(); }
