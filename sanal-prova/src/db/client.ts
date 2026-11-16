import { PGlite } from '@electric-sql/pglite';
import { drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import { migrate as pgliteMigrate } from 'drizzle-orm/pglite/migrator';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { migrate as pgMigrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { resolve } from 'node:path';
import * as schema from './schema.js';
import type { Config } from '../config.js';

export async function connectDatabase(config: Config, migrate = false) {
  const folder = resolve('drizzle');
  if (config.dbMode === 'pglite') {
    const client = new PGlite(config.pglitePath);
    await client.waitReady;
    const db = pgliteDrizzle(client, { schema });
    if (migrate) await pgliteMigrate(db, { migrationsFolder: folder });
    return { db, close: () => client.close() };
  }
  const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });
  const db = pgDrizzle(pool, { schema });
  if (migrate) await pgMigrate(db, { migrationsFolder: folder });
  return { db, close: () => pool.end() };
}
export type Database = Awaited<ReturnType<typeof connectDatabase>>['db'];
