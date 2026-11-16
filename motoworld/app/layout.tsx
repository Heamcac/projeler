import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { siteUrl } from "@/lib/catalog";
import "@fontsource-variable/dm-sans";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-ext-800.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  manifest: "/manifest.webmanifest",
  title: "MOTOWORLD | Bursa Motosiklet Servisi",
  description: "Bursa Yıldırım motosiklet bakım ve onarım hizmetleri. Tahmini bakım fiyatlarını inceleyin ve servis randevusu alın.",
};

export default async function Layout({ children }: { children: ReactNode }) {
  await connection();
  return <html lang="tr"><body className="flex min-h-screen flex-col font-sans">{children}</body></html>;
}
