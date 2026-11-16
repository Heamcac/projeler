import { AdminHeader } from "@/components/admin/display";
import { AdminForm } from "@/components/admin/forms";
import { Card, Field } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

function ServiceFields({ service }: { service?: { id: string; name: string; durationMinutes: number; isActive: boolean } }) {
  return <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
    {service && <input type="hidden" name="id" value={service.id} />}
    <Field title="Hizmet adı"><input className="input" name="name" required maxLength={120} defaultValue={service?.name} /></Field>
    <Field title="Süre (dk)"><input className="input" name="durationMinutes" type="number" min={1} max={1440} required defaultValue={service?.durationMinutes ?? 60} /></Field>
    <label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" name="isActive" className="h-4 w-4 accent-spark" defaultChecked={service?.isActive ?? true} /> Aktif</label>
  </div>;
}

export default async function Services() {
  await requireAdmin();
  const services = await db.service.findMany({ where: { archivedAt: null }, orderBy: [{ sort: "asc" }, { name: "asc" }] });
  return <>
    <AdminHeader title="Hizmetler">Aktif hizmetler müşteri sayfalarında ve yeni randevu formunda görünür.</AdminHeader>
    <Card className="mb-7 max-w-3xl p-5">
      <h2 className="mb-3 text-2xl font-bold">Yeni hizmet</h2>
      <AdminForm operation="service" label="Hizmet ekle" reset><ServiceFields /></AdminForm>
    </Card>
    <h2 className="mb-3 text-2xl font-bold">Mevcut hizmetler</h2>
    <div className="grid gap-3 lg:grid-cols-2">
      {services.map((service) => <Card key={service.id} className="min-w-0 p-4">
        <h3 className="mb-3 break-words text-xl font-bold">{service.name}</h3>
        <AdminForm key={JSON.stringify(service)} operation="service" label="Değişiklikleri kaydet">
          <ServiceFields service={service} />
        </AdminForm>
        <AdminForm operation="delete-service" label="Hizmeti sil" secondary className="mt-2"
          confirm={{ title: "Hizmet silinsin mi?", description: `${service.name} listelerden kaldırılır. Geçmiş randevulardaki hizmet bilgisi korunur.` }}>
          <input type="hidden" name="id" value={service.id} />
        </AdminForm>
      </Card>)}
    </div>
    {!services.length && <Card className="p-5 text-sm text-muted">Henüz hizmet yok.</Card>}
  </>;
}
