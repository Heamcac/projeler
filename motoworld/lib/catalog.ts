import { db } from "./db";

export async function getSettings() {
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map(({ key, value }) => [key, value])) as Record<string, string | undefined>;
}

export async function getCatalog() {
  const [categories, services] = await Promise.all([
    db.ccCategory.findMany({
      orderBy: { sort: "asc" },
      include: {
        prices: {
          where: { isActive: true, service: { isActive: true, archivedAt: null } },
          orderBy: { service: { sort: "asc" } },
          select: { minPrice: true, maxPrice: true, service: { select: { id: true, name: true } } },
        },
      },
    }),
    db.service.findMany({
      where: { isActive: true, archivedAt: null },
      orderBy: { sort: "asc" },
      select: { id: true, name: true, durationMinutes: true },
    }),
  ]);
  return { categories, services };
}

export const siteUrl = () => new URL(process.env.SITE_URL || "http://localhost:3000");
export function dialNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  return digits.startsWith("90") ? `+${digits}` : digits;
}

export function safeUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function safeMapEmbed(value?: string) {
  const candidate = safeUrl(value);
  if (!candidate) return undefined;
  const url = new URL(candidate);
  return url.protocol === "https:" && !url.port && !url.username && !url.password
    && ["www.google.com", "maps.google.com"].includes(url.hostname) && /^\/maps(?:\/|$)/.test(url.pathname)
    ? url.href : undefined;
}
