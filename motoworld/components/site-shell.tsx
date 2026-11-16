import Link from "next/link";
import type { ReactNode } from "react";
import { dialNumber, safeUrl } from "@/lib/catalog";

export function Header({ shopName }: { shopName?: string }) {
  return <header className="border-b border-line/75 bg-ink">
    <div className="wrap flex min-h-16 flex-wrap items-center justify-between gap-x-5 gap-y-0 py-1.5">
      <Link href="/" className="flex min-h-11 items-center gap-2.5 font-display text-xl font-extrabold tracking-wide">
        <span aria-hidden="true" className="h-[1.15rem] w-1.5 -skew-x-12 rounded-sm bg-spark" />{shopName}
      </Link>
      <nav aria-label="Ana menü" className="flex flex-wrap items-center gap-x-4 text-sm font-medium sm:gap-x-6">
        <Link className="hidden min-h-11 items-center text-muted hover:text-paper md:inline-flex" href="/#hizmetler">Hizmetler</Link>
        <Link className="inline-flex min-h-11 items-center text-muted hover:text-paper" href="/fiyatlar">Fiyatlar</Link>
        <Link className="inline-flex min-h-11 items-center text-muted hover:text-paper" href="/randevu-sorgula">Randevu sorgula</Link>
        <Link className="hidden min-h-10 items-center rounded-md bg-action px-3 font-bold text-ink hover:bg-spark sm:inline-flex" href="/randevu">Randevu al</Link>
      </nav>
    </div>
  </header>;
}

export function Footer({ settings, preferences }: { settings: Record<string, string | undefined>; preferences?: ReactNode }) {
  const whatsapp = safeUrl(settings.whatsappUrl);
  const instagram = safeUrl(settings.instagramUrl);
  const facebook = safeUrl(settings.facebookUrl);
  return <>
    <footer className="mt-auto border-t border-line pb-20 pt-7 sm:pb-7">
      <div className="wrap flex flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div><strong className="font-display text-base tracking-wide text-paper">{settings.shopName}</strong>{settings.address && <p className="mt-1">{settings.address}</p>}</div>
        <div className="flex flex-wrap gap-4">
          {instagram && <a href={instagram}>Instagram</a>}
          {facebook && <a href={facebook}>Facebook</a>}
          <Link href="/gizlilik-ve-kvkk">Gizlilik ve KVKK</Link>
          <Link href="/cerez-politikasi">Çerez politikası</Link>
          <Link href="/admin">Yönetim</Link>
          {preferences}
        </div>
      </div>
    </footer>
    <nav aria-label="Hızlı işlemler" className="fixed inset-x-0 bottom-0 z-40 flex justify-around gap-1 border-t border-line bg-ink p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] text-sm font-semibold sm:hidden">
      {settings.phone && <a className="flex min-h-11 flex-1 items-center justify-center rounded-md bg-surface px-2" href={`tel:${dialNumber(settings.phone)}`}>Ara</a>}
      {whatsapp && <a className="flex min-h-11 flex-1 items-center justify-center rounded-md bg-surface px-2" href={whatsapp}>WhatsApp</a>}
      <Link className="flex min-h-11 flex-1 items-center justify-center rounded-md bg-action px-2 text-ink" href="/randevu">Randevu al</Link>
    </nav>
  </>;
}
