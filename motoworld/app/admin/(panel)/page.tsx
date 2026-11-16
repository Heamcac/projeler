import Link from "next/link";
import { AdminHeader, BookingList } from "@/components/admin/display";
import { ButtonLink, Card } from "@/components/ui";
import { dashboard } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { statusLabels } from "@/lib/booking-status";
import { formatDate, shopClock } from "@/lib/time";

export default async function AdminPage() {
  await requireAdmin();
  const today = shopClock().date;
  const { todayBookings, pending, pendingCount, week } = await dashboard(today);
  return <>
    <AdminHeader title="Yönetim paneli" actions={<ButtonLink href="/admin/rezervasyonlar/yeni">+ Yeni randevu</ButtonLink>}>
      {formatDate(today)} · Türkiye saati
    </AdminHeader>
    <section className="mb-8" aria-labelledby="week">
      <h2 id="week" className="mb-3 text-2xl font-bold">Bu hafta</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(statusLabels).map(([status, label]) => <div key={status} className="rounded-xl border border-line bg-surface p-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="mt-1 font-display text-4xl font-extrabold tabular-nums">{week[status] ?? 0}</dd>
        </div>)}
      </dl>
    </section>
    <div className="grid gap-7 lg:grid-cols-2">
      <section aria-labelledby="today">
        <h2 id="today" className="mb-3 text-2xl font-bold">Bugünün randevuları <span className="text-spark">{todayBookings.length}</span></h2>
        <BookingList items={todayBookings} empty="Bugün için kayıtlı randevu yok." showDate={false} />
      </section>
      <section aria-labelledby="pending">
        <h2 id="pending" className="mb-3 text-2xl font-bold">Bekleyen onaylar <span className="text-spark">{pendingCount}</span></h2>
        <BookingList items={pending} empty="Onay bekleyen randevu yok." />
        {pendingCount > pending.length && <Card className="mt-3 px-4 py-3 text-sm"><Link className="text-spark" href="/admin/rezervasyonlar?durum=PENDING">Tüm bekleyen randevular</Link></Card>}
      </section>
    </div>
  </>;
}
