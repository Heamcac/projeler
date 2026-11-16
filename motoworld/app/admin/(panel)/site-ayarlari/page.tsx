import { AdminHeader } from "@/components/admin/display";
import { AdminForm } from "@/components/admin/forms";
import { Card, Field } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/catalog";
import { getRetentionDays, retentionDefaults } from "@/lib/retention";

const links = [
  ["whatsappUrl", "WhatsApp bağlantısı"],
  ["mapUrl", "Yol tarifi bağlantısı"],
  ["mapEmbedUrl", "Harita yerleştirme bağlantısı"],
  ["instagramUrl", "Instagram bağlantısı"],
  ["facebookUrl", "Facebook bağlantısı"],
] as const;

export default async function Settings() {
  await requireAdmin();
  const [settings, days] = await Promise.all([getSettings(), getRetentionDays()]);
  return <div className="max-w-3xl">
    <AdminHeader title="Site ayarları">Kaydedilen bilgiler ana sayfada ve iletişim bağlantılarında kullanılır.</AdminHeader>
    <Card className="p-5">
      <AdminForm key={JSON.stringify(settings)} operation="settings" label="Site ayarlarını kaydet" buttonClassName="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Dükkan adı"><input className="input" name="shopName" required maxLength={100} defaultValue={settings.shopName} /></Field>
          <Field title="Slogan"><input className="input" name="slogan" required maxLength={180} defaultValue={settings.slogan} /></Field>
          <div className="sm:col-span-2"><Field title="Hakkımızda"><textarea className="input" name="about" rows={4} required maxLength={4000} defaultValue={settings.about} /></Field></div>
          <Field title="Adres"><input className="input" name="address" required maxLength={300} defaultValue={settings.address} /></Field>
          <Field title="Telefon"><input className="input" name="phone" type="tel" required maxLength={30} defaultValue={settings.phone} /></Field>
          {links.map(([key, title]) => <Field key={key} title={title}>
            <input className="input" name={key} type="url" maxLength={2048} placeholder="https://" defaultValue={settings[key]} />
          </Field>)}
        </div>
      </AdminForm>
    </Card>
    <Card className="mt-5 p-5">
      <h2 className="mb-2 text-2xl font-bold">Kişisel veri saklama süresi</h2>
      <p className="mb-4 text-sm text-muted">Bu süreyi aşan geçmiş randevuların kişisel verileri günlük temizlikte anonimleştirilir.</p>
      <AdminForm key={days} operation="privacy-settings" label="Saklama süresini kaydet" className="space-y-3">
        <Field title="Saklama süresi (gün)"><input className="input max-w-xs" name="days" type="number"
          min={retentionDefaults.min} max={retentionDefaults.max} defaultValue={days} required /></Field>
      </AdminForm>
    </Card>
  </div>;
}
