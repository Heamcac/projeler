import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/fiyatlar", "/randevu", "/randevu-sorgula", "/gizlilik-ve-kvkk", "/cerez-politikasi"].map((path) => ({
    url: new URL(path, siteUrl()).href,
  }));
}
