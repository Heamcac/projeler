import { NotificationStatus } from "@/generated/prisma/client";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/display";
import { NotificationList, notificationStatuses } from "@/components/admin/notification-list";
import { Button, ButtonLink, Card, Field } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Notifications({ searchParams }: PageProps<"/admin/bildirimler">) {
  await requireAdmin();
  const { durum, sayfa } = await searchParams;
  const status = Object.values(NotificationStatus).find((value) => value === durum);
  const requestedPage = typeof sayfa === "string" && /^\d{1,9}$/.test(sayfa) ? Math.max(1, Number(sayfa)) : 1;
  const where = { status };
  const size = 25;
  const total = await db.notificationLog.count({ where });
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(requestedPage, pages);
  const rows = await db.notificationLog.findMany({
    where, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: (page - 1) * size, take: size,
    include: { booking: { select: { code: true } } },
  });
  const pageLink = (next: number) => `/admin/bildirimler?${new URLSearchParams({ durum: status ?? "", sayfa: String(next) })}`;

  return <>
    <AdminHeader title="Bildirim geçmişi" actions={<ButtonLink href="/admin/bildirimler/ayarlar">Bildirim ayarları</ButtonLink>}>
      Rezervasyonlara ait e-posta ve SMS gönderimleri
    </AdminHeader>
    <Card className="mb-5 p-4">
      <form method="get" action="/admin/bildirimler" className="flex flex-wrap items-end gap-3">
        <Field title="Gönderim durumu">
          <select className="input min-w-40" name="durum" defaultValue={status ?? ""}>
            <option value="">Tüm durumlar</option>
            {Object.entries(notificationStatuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select>
        </Field>
        <Button type="submit">Filtrele</Button>
        <ButtonLink href="/admin/bildirimler?durum=FAILED" variant="secondary">Başarısız gönderimler</ButtonLink>
      </form>
    </Card>
    <p className="mb-2 text-sm text-muted">{total} bildirim kaydı</p>
    <NotificationList rows={rows} />
    {pages > 1 && <nav aria-label="Bildirim geçmişi sayfaları" className="mt-4 flex items-center gap-4 text-sm">
      {page > 1 && <Link className="inline-flex min-h-11 items-center text-spark" href={pageLink(page - 1)}>Önceki</Link>}
      <span>Sayfa {page} / {pages}</span>
      {page < pages && <Link className="inline-flex min-h-11 items-center text-spark" href={pageLink(page + 1)}>Sonraki</Link>}
    </nav>}
  </>;
}
