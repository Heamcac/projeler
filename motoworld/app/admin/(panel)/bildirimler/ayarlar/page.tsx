import { AdminHeader } from "@/components/admin/display";
import { AdminForm } from "@/components/admin/forms";
import { ButtonLink, Card, Field } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { notificationProviders } from "@/lib/notifications/providers";
import { getNotificationSettings } from "@/lib/notifications/settings";
import { eventLabels, events, templateKeys } from "@/lib/notifications/templates";

export default async function NotificationsSettings() {
  await requireAdmin();
  const settings = await getNotificationSettings();
  const providers = notificationProviders();
  return <>
    <AdminHeader title="Bildirim ayarları" actions={<ButtonLink href="/admin/bildirimler" variant="secondary">Bildirim geçmişi</ButtonLink>}>
      E-posta · {providers.email ? "SMTP yapılandırıldı" : "SMTP ayarlanmamış"}
    </AdminHeader>
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <Card className="p-4">
        <h2 className="mb-3 text-2xl font-bold">Test e-postası</h2>
        <AdminForm operation="notification-test" label="Test e-postası gönder" secondary className="space-y-3">
          <input type="hidden" name="channel" value="EMAIL" />
          <Field title="Alıcı e-posta"><input className="input" name="recipient" type="email" maxLength={254} required /></Field>
        </AdminForm>
      </Card>
    </div>
    <AdminForm key={JSON.stringify(settings)} operation="notification-settings" label="Bildirim ayarlarını kaydet" className="space-y-5">
      <Card className="p-4 sm:p-5">
        <h2 className="mb-2 text-2xl font-bold">Hatırlatma zamanları</h2>
        <p className="mb-4 text-sm text-muted">Randevudan önceki dakika cinsinden girin. 1440 dakika 24 saate, 120 dakika 2 saate karşılık gelir.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field title="İlk hatırlatma (dk)"><input className="input" name="early" type="number" min={1} max={10080} defaultValue={settings.schedule.early} required /></Field>
          <Field title="Son hatırlatma (dk)"><input className="input" name="late" type="number" min={1} max={10080} defaultValue={settings.schedule.late} required /></Field>
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <h2 className="mb-2 text-2xl font-bold">Olaylar ve şablonlar</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Şablon değişkenleri {templateKeys.map((key) => <code className="mr-1 text-spark" key={key}>{`{${key}}`}</code>)}.
        </p>
        <div className="space-y-2">
          {events.map((event) => {
            const rule = settings.rules[event];
            return <details key={event} className="rounded-lg border border-line bg-ink/50">
              <summary className="cursor-pointer p-3 text-sm font-semibold">
                {eventLabels[event]}
              </summary>
              <fieldset className="space-y-3 border-t border-line px-3 pb-4 pt-3">
                <legend className="sr-only">{eventLabels[event]}</legend>
                {event === "OWNER_NEW_BOOKING" && <p className="text-sm text-muted">Randevuyu incelemek ve onaylamak için yönetim bağlantısı e-postaya otomatik eklenir.</p>}
                <Field title="E-posta konusu"><input className="input" name={`${event}.subject`} maxLength={180} defaultValue={rule.subject} /></Field>
                <Field title="E-posta metni"><textarea className="input" name={`${event}.email`} rows={4} maxLength={2000} defaultValue={rule.email} /></Field>
              </fieldset>
            </details>;
          })}
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-2xl font-bold">WhatsApp hazır mesajı</h2>
        <Field title="WhatsApp metni"><textarea className="input" name="whatsapp" rows={3} maxLength={1000} defaultValue={settings.whatsapp} required /></Field>
      </Card>
    </AdminForm>
  </>;
}
