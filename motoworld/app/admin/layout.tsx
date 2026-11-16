import type { ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getSettings } from "@/lib/catalog";
import { AdminFeedback } from "@/components/admin/forms";

export const metadata = { title: "Yönetim | MOTOWORLD", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await connection();
  const { shopName } = await getSettings();
  return <>
    <header className="border-b border-line">
      <div className="wrap flex min-h-16 flex-wrap items-center justify-between gap-2">
        <Link href="/" className="font-display text-lg font-extrabold tracking-wide">{shopName}</Link>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-paper">Siteye dön <span aria-hidden="true" className="ml-1">↗</span></Link>
      </div>
    </header>
    <main className="flex-1"><AdminFeedback>{children}</AdminFeedback></main>
  </>;
}
