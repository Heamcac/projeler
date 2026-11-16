import Link from "next/link";
import { AdminHeader, BookingList, Status } from "@/components/admin/display";
import { Button, ButtonLink, Card, Field } from "@/components/ui";
import { bookingsBetween } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, formatDate, isDate, shopClock, weekdays, weekStart } from "@/lib/time";

export default async function Calendar({ searchParams }: PageProps<"/admin/takvim">) {
  await requireAdmin();
  const { tarih, gorunum } = await searchParams;
  const today = shopClock().date;
  const date = typeof tarih === "string" && isDate(tarih) && tarih >= "1900-01-01" && tarih < "9999-01-01" ? tarih : today;
  const week = gorunum === "hafta";
  const first = week ? weekStart(date) : date;
  const last = week ? addDays(first, 6) : first;
  const [items, hours, holidays] = await Promise.all([
    bookingsBetween(first, last),
    db.workingHours.findMany(),
    db.holiday.findMany({ where: { date: { gte: first, lte: last } } }),
  ]);
  const days = Array.from({ length: week ? 7 : 1 }, (_, index) => {
    const day = addDays(first, index);
    const weekday = new Date(day).getUTCDay();
    const schedule = hours.find((row) => row.weekday === weekday);
    const holiday = holidays.find((row) => row.date === day);
    const label = holiday ? `Tatil · ${holiday.label}` : !schedule || schedule.isClosed ? "Kapalı" : `${schedule.opens}–${schedule.closes}`;
    return { date: day, weekday, label, bookings: items.filter((item) => item.date === day) };
  });
  const link = (day: string, view: "gun" | "hafta") => `/admin/takvim?tarih=${day}&gorunum=${view}`;
  const view = week ? "hafta" : "gun";
  const increment = week ? 7 : 1;

  return <>
    <AdminHeader title="Takvim" actions={<ButtonLink href="/admin/rezervasyonlar/yeni">+ Yeni randevu</ButtonLink>}>
      {week ? `${formatDate(first)} – ${formatDate(last)}` : `${weekdays[days[0].weekday]}, ${formatDate(date)}`}
    </AdminHeader>
    <Card className="mb-6 flex flex-wrap items-end justify-between gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={link(date, "gun")} variant={week ? "secondary" : "primary"}>Günlük</ButtonLink>
        <ButtonLink href={link(date, "hafta")} variant={week ? "primary" : "secondary"}>Haftalık</ButtonLink>
      </div>
      <form method="get" action="/admin/takvim" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="gorunum" value={view} />
        <Field title="Takvim tarihi"><input className="input" name="tarih" type="date" min="1900-01-01" max="9998-12-31" defaultValue={date} required /></Field>
        <Button type="submit" variant="secondary">Göster</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <ButtonLink variant="secondary" href={link(addDays(date, -increment), view)}>Önceki</ButtonLink>
        <ButtonLink variant="secondary" href={link(today, view)}>Bugün</ButtonLink>
        <ButtonLink variant="secondary" href={link(addDays(date, increment), view)}>Sonraki</ButtonLink>
      </div>
    </Card>
    {week ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => <Card key={day.date} className={`min-w-0 overflow-hidden ${day.date === today ? "border-spark" : ""}`}>
        <div className="border-b border-line bg-ink/40 p-3">
          <Link href={link(day.date, "gun")} className="block font-bold text-spark">{weekdays[day.weekday]} {Number(day.date.slice(-2))}</Link>
          <p className="mt-1 break-words text-xs text-muted">{day.label}</p>
        </div>
        <div className="divide-y divide-line">
          {day.bookings.length ? day.bookings.map((booking) => <Link key={booking.code} href={`/admin/rezervasyonlar/${booking.code}`}
            className="block p-3 text-xs hover:bg-ink/50">
            <p className="font-bold">{booking.timeSlot}</p>
            <p className="my-1 break-words">{booking.customerName}</p>
            <Status status={booking.status} />
          </Link>) : <p className="p-3 text-xs text-muted">Randevu yok</p>}
        </div>
      </Card>)}
    </div> : <>
      <p className="mb-3 text-sm text-muted">{days[0].label}</p>
      <BookingList items={items} empty="Bu gün için kayıtlı randevu yok." showDate={false} />
    </>}
  </>;
}
