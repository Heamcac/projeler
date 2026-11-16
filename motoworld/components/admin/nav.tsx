"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin", "Panel"],
  ["/admin/rezervasyonlar", "Rezervasyonlar"],
  ["/admin/takvim", "Takvim"],
  ["/admin/fiyatlar", "Fiyatlar"],
  ["/admin/hizmetler", "Hizmetler"],
  ["/admin/calisma-saatleri", "Çalışma saatleri ve tatil"],
  ["/admin/site-ayarlari", "Site ayarları"],
  ["/admin/bildirimler", "Bildirimler"],
  ["/admin/hesap", "Hesap"],
];

export function AdminNav() {
  const path = usePathname();
  return <nav aria-label="Yönetim menüsü" className="border-b border-line bg-surface/50">
    <div className="wrap flex flex-wrap gap-1 py-2">
      {items.map(([href, title]) => {
        const active = path === href || (href !== "/admin" && path.startsWith(href + "/"));
        return <Link key={href} href={href} aria-current={active ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold ${active ? "bg-spark/15 text-spark" : "text-muted hover:bg-surface hover:text-paper"}`}>
          {title}
        </Link>;
      })}
    </div>
  </nav>;
}
