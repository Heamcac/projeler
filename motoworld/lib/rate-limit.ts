import { createHash, randomInt } from "node:crypto";
import { headers } from "next/headers";
import { isIP } from "node:net";
import { db } from "./db";

export async function rateAllowed(scope: string, limit: number, windowMs: number) {
  const source = process.env.CLIENT_IP_HEADER || (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : "");
  const ip = source ? (await headers()).get(source)?.split(",").at(-1)?.trim() : undefined;
  const identity = ip && isIP(ip) ? ip : "shared";
  const current = Date.now();
  const window = Math.floor(current / windowMs);
  const key = createHash("sha256").update(`${scope}:${identity}:${window}`).digest("hex");
  const expiresAt = new Date((window + 1) * windowMs);
  return await incrementWindow(key, expiresAt) <= limit;
}

export async function incrementWindow(key: string, expiresAt: Date) {
  const [counter] = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimit"."count" + 1
    RETURNING "count"
  `;
  if (randomInt(100) === 0) {
    await db.rateLimit.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  }
  return counter.count;
}
