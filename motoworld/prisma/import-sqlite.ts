import "dotenv/config";
import { DatabaseSync, type SQLOutputValue } from "node:sqlite";
import { Client } from "pg";

const tables = ["AdminUser", "Setting", "CcCategory", "Service", "PriceItem", "WorkingHours", "Holiday",
  "Booking", "BookingService", "BookingNote", "NotificationLog"] as const;
const booleans = new Set(["isActive", "isClosed"]);
const timestamps = new Set(["createdAt", "updatedAt", "nextAttemptAt", "archivedAt", "notificationConsentAt"]);
const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;

function pgValue(column: string, value: SQLOutputValue) {
  if (value === null) return null;
  if (booleans.has(column)) return value === 1 || value === "1" || value === "true";
  if (timestamps.has(column)) {
    if (typeof value === "string" && !/^-?\d+$/.test(value)) {
      const date = value.replace(" ", "T");
      const utc = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(date) ? date : `${date}Z`;
      return new Date(utc).toISOString().slice(0, -1);
    }
    return new Date(Number(value)).toISOString().slice(0, -1);
  }
  return value;
}

const input = process.argv[2];
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!input || !url || !/^postgres(?:ql)?:\/\//.test(url)) {
  throw new Error("Kullanım: DATABASE_URL/DIRECT_URL ayarlayın ve npm run import:sqlite -- <SQLite yedeği> çalıştırın.");
}

const sqlite = new DatabaseSync(input, { readOnly: true });
const target = new Client({ connectionString: url });
try {
  await target.connect();
  await target.query("BEGIN");
  sqlite.exec("BEGIN");
  // Obtain all locks before inspecting the destination so storefront writes cannot interleave.
  await target.query(`LOCK TABLE ${tables.map(quote).join(", ")} IN SHARE ROW EXCLUSIVE MODE`);
  for (const table of tables) {
    const { rows: [result] } = await target.query<{ populated: boolean }>(`SELECT EXISTS (SELECT 1 FROM ${quote(table)}) AS populated`);
    if (result.populated) throw new Error("Aktarım hedefi boş olmalıdır. Seed işleminden önce yeni bir PostgreSQL veritabanı kullanın.");
  }
  for (const table of tables) {
    if (!sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)) continue;
    let count = 0;
    for (const record of sqlite.prepare(`SELECT * FROM ${quote(table)}`).iterate()) {
      if (table === "NotificationLog" && (record.status === "QUEUED" || record.status === "SENDING" || record.nextAttemptAt)) {
        record.status = "SKIPPED";
        record.errorMessage = "Veritabanı aktarımında bekleyen gönderim kapatıldı.";
        record.nextAttemptAt = null;
      }
      const columns = Object.keys(record);
      const params = columns.map((_, index) => `$${index + 1}`).join(", ");
      await target.query(`INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${params})`,
        columns.map((column) => pgValue(column, record[column])));
      count++;
    }
    console.log(`${table}: ${count}`);
  }
  await target.query("COMMIT");
  console.log("Aktarım tamamlandı. Kaynak SQLite dosyası korundu.");
} catch {
  await target.query("ROLLBACK").catch(() => {});
  console.error("Aktarım tamamlanamadı. Hedefin boş ve migration’ların uygulanmış olduğunu kontrol edin. Kaynak dosya korundu.");
  process.exitCode = 1;
} finally {
  sqlite.close();
  await target.end();
}
