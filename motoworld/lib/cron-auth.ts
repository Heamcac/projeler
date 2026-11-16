import { createHash, timingSafeEqual } from "node:crypto";
import { rateAllowed } from "./rate-limit";

const hash = (value: string) => createHash("sha256").update(value).digest();
export const cronResponse = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function authorizeCron(request: Request, task: string) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !timingSafeEqual(hash(request.headers.get("authorization") ?? ""), hash(`Bearer ${secret}`))) {
    return cronResponse({ error: "Yetkisiz istek." }, 401);
  }
  if (!await rateAllowed(`cron:${task}`, 6, 60_000)) return cronResponse({ error: "İstek sınırı aşıldı." }, 429);
  return null;
}
