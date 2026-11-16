import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Pool } from 'pg';

const root = resolve(__dirname, '../../../..');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://hospion:hospion@localhost:5432/hospion',
});

async function runSqlFile(path: string) {
  const sql = await readFile(path, 'utf8');
  await pool.query(sql);
}

async function migrate() {
  await runSqlFile(join(root, 'database/migrations/001_init.sql'));
  const files = (await readdir(join(root, 'database/migrations'))).filter((name) => name.endsWith('.sql')).sort();
  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (applied.rowCount) continue;
    await runSqlFile(join(root, 'database/migrations', file));
    await pool.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING', [version]);
    console.log(`Applied ${file}`);
  }
}

async function seed() {
  await runSqlFile(join(root, 'database/seeds/001_demo.sql'));
  console.log('Seed data applied');
}

const command = process.argv[2];
const task = command === 'seed' ? seed() : migrate();
task.finally(() => pool.end());
