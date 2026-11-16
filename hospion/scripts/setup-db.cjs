const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Pool } = require('pg');
const root = resolve(__dirname, '..');
require('dotenv').config({ path: resolve(root, '.env') });

async function main() {
  const target = new URL(process.env.DATABASE_URL);
  const pool = new Pool({
    host: '127.0.0.1', port: 5432, database: 'postgres', user: 'hospion_admin',
    password: readFileSync(resolve(root, '.local/admin-password'), 'utf8').trim(),
  });
  try {
    const password = decodeURIComponent(target.password).replace(/'/g, "''");
    const role = await pool.query("SELECT 1 FROM pg_roles WHERE rolname = 'hospion'");
    if (!role.rowCount) await pool.query(`CREATE ROLE hospion LOGIN PASSWORD '${password}'`);
    const db = await pool.query("SELECT 1 FROM pg_database WHERE datname = 'hospion'");
    if (!db.rowCount) await pool.query('CREATE DATABASE hospion OWNER hospion');
    console.log('HOSPION database ready.');
  } finally {
    await pool.end();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
