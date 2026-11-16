import { BookingStatus } from "@/generated/prisma/client";
import Link from "next/link";
import { AdminHeader, BookingList } from "@/components/admin/display";
import { Button, ButtonLink, Card, Field } from "@/components/ui";
import { searchableBookings } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { statusLabels } from "@/lib/booking-status";
import { db } from "@/lib/db";
import { isDate } from "@/lib/time";

export default async function Reservations({ searchParams }: PageProps<"/admin/rezervasyonlar">) {
  await requireAdmin();
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const search = value("ara").trim().slice(0, 100);
  const from = isDate(value("baslangic")) ? value("baslangic") : "";
  const to = isDate(value("bitis")) ? value("bitis") : "";
  const status = Object.values(BookingStatus).find((item) => item === value("durum"));
  const category = value("cc").slice(0, 100);
  const pageNumber = /^\d{1,9}$/.test(value("sayfa")) ? Math.max(1, Number(value("sayfa"))) : 1;
  const [categories, { bookings, page, total, pageCount }] = await Promise.all([
    db.ccCategory.findMany({ orderBy: { sort: "asc" } }),
    searchableBookings({ from: from || undefined, to: to || undefined, status, category: category || undefined, search, page: pageNumber }),
  ]);
  const pageLink = (next: number) => {
    const params = new URLSearchParams({ ara: search, baslangic: from, bitis: to, durum: status ?? "", cc: category, sayfa: String(next) });
    return `/admin/rezervasyonlar?${params}`;
  };

  return <>
    <AdminHeader title="Rezervasyonlar" actions={<ButtonLink href="/admin/rezervasyonlar/yeni">+ Yeni randevu</ButtonLink>} />
    <Card className="mb-5 p-4">
      <form method="get" action="/admin/rezervasyonlar" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field title="Ara"><input className="input" name="ara" defaultValue={search} placeholder="Ad, telefon veya kod" maxLength={100} /></Field>
        <Field title="Başlangıç"><input className="input" type="date" name="baslangic" defaultValue={from} /></Field>
        <Field title="Bitiş"><input className="input" type="date" name="bitis" defaultValue={to} /></Field>
        <Field title="Durum"><select className="input" name="durum" defaultValue={status ?? ""}>
          <option value="">Tüm durumlar</option>
          {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></Field>
        <Field title="CC grubu"><select className="input" name="cc" defaultValue={category}>
          <option value="">Tüm gruplar</option>
          {categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select></Field>
        <div className="flex flex-wrap gap-2 lg:col-span-5">
          <Button type="submit">Filtrele</Button>
          <ButtonLink href="/admin/rezervasyonlar" variant="secondary">Temizle</ButtonLink>
        </div>
      </form>
    </Card>
    {from && to && from > to && <p role="alert" className="error mb-3">Bitiş tarihi başlangıçtan önce olamaz.</p>}
    <p className="mb-2 text-sm text-muted">{total} randevu</p>
    <BookingList items={bookings} empty="Bu filtrelere uyan randevu bulunamadı." />
    {pageCount > 1 && <nav aria-label="Rezervasyon sayfaları" className="mt-4 flex items-center gap-4 text-sm">
      {page > 1 && <Link className="inline-flex min-h-11 items-center text-spark" href={pageLink(page - 1)}>Önceki</Link>}
      <span>Sayfa {page} / {pageCount}</span>
      {page < pageCount && <Link className="inline-flex min-h-11 items-center text-spark" href={pageLink(page + 1)}>Sonraki</Link>}
    </nav>}
  </>;
}
