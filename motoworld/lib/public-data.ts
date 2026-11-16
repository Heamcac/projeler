import { createHash } from "node:crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import { getCatalog, getSettings } from "./catalog";
import { db } from "./db";

type PublicTag = "public-settings" | "public-catalog" | "public-hours";
const namespace = createHash("sha256").update(process.env.DATABASE_URL ?? "").update("|").update(process.env.SITE_URL ?? "").digest("hex").slice(0, 24);
const cacheTag = (tag: PublicTag) => `${tag}:${namespace}`;

function cached<T>(tag: PublicTag, read: () => Promise<T>) {
  const key = cacheTag(tag);
  return unstable_cache(read, [key], { tags: [key], revalidate: 300 });
}

export const getPublicSettings = cached("public-settings", getSettings);
export const getPublicCatalog = cached("public-catalog", getCatalog);
export const getPublicHours = cached("public-hours", () => db.workingHours.findMany({ orderBy: { weekday: "asc" } }));

export function invalidatePublicData(tag: PublicTag) {
  revalidateTag(cacheTag(tag), { expire: 0 });
}
