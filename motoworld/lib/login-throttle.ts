import { createHash } from "node:crypto";
import { db } from "./db";

const threshold = 5;
const windowMs = 15 * 60_000;
const keyFor = (email: string) => createHash("sha256").update(email).digest("hex");

export async function reserveLoginAttempt(email: string, now = new Date()) {
  const key = keyFor(email);
  const deadline = new Date(now.valueOf() + windowMs);
  const rows = await db.$queryRaw<{ failures: number }[]>`
    INSERT INTO "LoginThrottle" ("key", "failures", "expiresAt") VALUES (${key}, 1, ${deadline})
    ON CONFLICT ("key") DO UPDATE SET
      "failures" = CASE WHEN "LoginThrottle"."expiresAt" <= ${now} THEN 1
                        ELSE "LoginThrottle"."failures" + 1 END,
      "expiresAt" = CASE WHEN "LoginThrottle"."expiresAt" <= ${now}
                           OR "LoginThrottle"."failures" = ${threshold - 1} THEN ${deadline}
                         ELSE "LoginThrottle"."expiresAt" END
    WHERE "LoginThrottle"."expiresAt" <= ${now} OR "LoginThrottle"."failures" < ${threshold}
    RETURNING "failures"
  `;
  return rows.length > 0;
}

export async function clearLoginFailures(email: string) {
  await db.loginThrottle.deleteMany({ where: { key: keyFor(email) } });
}
