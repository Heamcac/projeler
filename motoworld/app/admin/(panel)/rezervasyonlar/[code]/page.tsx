import { notFound } from "next/navigation";
import { AdminHeader, Status } from "@/components/admin/display";
import { AdminForm } from "@/components/admin/forms";
import { NotificationList } from "@/components/admin/notification-list";
import { ButtonLink, Card, Field } from "@/components/ui";
import { allowedTransitions } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/catalog";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/notifications/phone";
import { getNotificationSettings } from "@/lib/notifications/settings";
import { bookingVariables, fillTemplate } from "@/lib/notifications/templates";
import { formatDate, timezone } from "@/lib/time";

const actions = { CONFIRMED: "Onayla", CANCELLED: "İptal et", COMPLETED: "Tamamla", PENDING: "Beklemeye al" };
const timestamp = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: timezone });

export default async function BookingDetail({ params }: PageProps<"/admin/rezervasyonlar/[code]">) {
  await requireAdmin();
  const { code } = await params;
  const [booking, shop, preferences] = await Promise.all([
    db.booking.findUnique({
      where: { code },
      include: {
        category: true, services: { include: { service: true } }, adminNotes: { orderBy: { createdAt: "desc" } },
        notifications: { orderBy: [{ updatedAt: "desc" }, { id: "desc" }] },
      },
    }),
    getSettings(),
    getNotificationSettings(),
  ]);
  if (!booking) notFound();
  const whatsapp = booking.anonymizedAt ? null : whatsappLink(booking.phone, fillTemplate(preferences.whatsapp, bookingVariables(booking, shop)));
  const details = [
    ["Müşteri", booking.customerName], ["Telefon", booking.phone && <a className="text-spark" href={`tel:${booking.phone}`}>{booking.phone}</a>],
    ["E-posta", booking.email], ["Motosiklet", booking.bikeYear ? `${booking.bikeBrand} ${booking.bikeModel} · ${booking.bikeYear}` : ""],
    ["Plaka", booking.plate], ["CC grubu", booking.category.label],
    ["Hizmetler", booking.services.map(({ service }) => service.name).join(", ")],
    ["Müşteri notu", booking.note], ["Kayıt zamanı", timestamp.format(booking.createdAt)],
    ["Bildirim izni", booking.notificationConsentAt ? `Var · ${timestamp.format(booking.notificationConsentAt)}` : "Yok"],
  ];

  return <>
    <AdminHeader title={code} actions={<div className="flex flex-wrap gap-2">
      <ButtonLink href="/admin/rezervasyonlar" variant="secondary">Rezervasyonlara dön</ButtonLink>
      {whatsapp && <ButtonLink href={whatsapp} variant="secondary" target="_blank">WhatsApp ile mesaj gönder</ButtonLink>}
    </div>}>
      {formatDate(booking.date)} · {booking.timeSlot} <span className="ml-2"><Status status={booking.status} /></span>
    </AdminHeader>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-2xl font-bold">Randevu bilgileri</h2>
        <dl className="mt-3 divide-y divide-line text-sm">
          {details.map(([label, value]) => <div className="grid gap-1 py-2.5 sm:grid-cols-[8rem_1fr]" key={String(label)}>
            <dt className="text-muted">{label}</dt><dd className="min-w-0 whitespace-pre-wrap break-words">{value || "—"}</dd>
          </div>)}
        </dl>
        <div className="mt-4 flex flex-wrap items-start gap-2">
          {!booking.anonymizedAt && allowedTransitions[booking.status].map((next) => <AdminForm key={next} operation="booking-status" label={actions[next]}
            secondary={next === "CANCELLED"} confirm={next === "CANCELLED" ? {
              title: "Randevu iptal edilsin mi?", description: "Randevu iptal edilir ve ayrılan yer boşalır.",
            } : undefined}>
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="current" value={booking.status} />
            <input type="hidden" name="next" value={next} />
          </AdminForm>)}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="text-2xl font-bold">Yönetim notları</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Bu notları yalnızca yöneticiler görebilir.</p>
        {!booking.anonymizedAt && <AdminForm operation="booking-note" label="Not ekle" reset className="space-y-3">
          <input type="hidden" name="code" value={code} />
          <Field title="Yeni not"><textarea className="input" name="text" required rows={3} maxLength={1000} /></Field>
        </AdminForm>}
        {booking.anonymizedAt && <p className="text-sm text-muted">Kişisel veriler {timestamp.format(booking.anonymizedAt)} tarihinde anonimleştirildi.</p>}
        {booking.adminNotes.length > 0 && <ul className="mt-5 divide-y divide-line border-t border-line">
          {booking.adminNotes.map((note) => <li key={note.id} className="py-3">
            <time dateTime={note.createdAt.toISOString()} className="text-xs text-muted">{timestamp.format(note.createdAt)}</time>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{note.text}</p>
          </li>)}
        </ul>}
      </Card>
    </div>
    <section className="mt-7" aria-labelledby="booking-notifications">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="booking-notifications" className="text-2xl font-bold">Bildirim geçmişi</h2>
        {booking.notificationConsentAt && <AdminForm operation="notification-consent-withdraw" label="Bildirim iznini kaldır" secondary
          confirm={{ title: "Bildirim izni kaldırılsın mı?", description: "Randevu hatırlatmaları ve tamamlanma mesajı artık gönderilmeyecek." }}>
          <input type="hidden" name="code" value={code} />
        </AdminForm>}
      </div>
      <NotificationList rows={booking.notifications} />
    </section>
  </>;
}
