import "dotenv/config";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

const source = process.env.TEST_DATABASE_URL;
if (!source) throw new Error("TEST_DATABASE_URL, yalnızca testler için ayrılmış bir PostgreSQL sunucusuna işaret etmelidir.");
const mode = process.argv[2];
if (mode !== "integration" && mode !== "e2e") throw new Error("Geçersiz test grubu.");
const database = `motoworld_test_${randomUUID().replaceAll("-", "")}`;
const url = new URL(source);
url.pathname = `/${database}`;
const admin = new Client({ connectionString: source });
const env = {
  ...process.env,
  DATABASE_URL: url.href, DIRECT_URL: url.href,
  ADMIN_EMAIL: "test-admin@example.test", ADMIN_PASSWORD: "Test-start-password-2026!",
  SITE_URL: "http://127.0.0.1:3110", SMTP_HOST: "", SMTP_FROM: "", SMS_PROVIDER: "console",
  NOTIFICATION_OWNER_EMAIL: "", NOTIFICATION_OWNER_PHONE: "", CRON_SECRET: "motoworld-test-cron-secret", SENTRY_DSN: "", PLAUSIBLE_DOMAIN: "motoworld.example",
};

function run(...args: string[]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Test komutu başarısız oldu (${result.status}).`);
}

await admin.connect();
let created = false;
try {
  await admin.query(`CREATE DATABASE "${database}"`);
  created = true;
  run("node_modules/prisma/build/index.js", "migrate", "deploy");
  if (mode === "integration") run("--import", "tsx", "--test", "tests/bookings.test.ts");
  else {
    run("--import", "tsx", "prisma/seed.ts");
    run("node_modules/@playwright/test/cli.js", "test");
  }
} finally {
  if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
}
