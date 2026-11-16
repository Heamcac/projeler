import { loadConfig } from './config.js';
import { connectDatabase } from './db/client.js';
const connection = await connectDatabase(loadConfig(), true);
await connection.close();
console.log('Migrations applied.');
