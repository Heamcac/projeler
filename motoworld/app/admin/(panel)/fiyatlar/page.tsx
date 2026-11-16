import { AdminHeader } from "@/components/admin/display";
import { AdminForm } from "@/components/admin/forms";
import { PriceColumn, PriceColumns } from "@/components/admin/price-columns";
import type { CSSProperties } from "react";
import { Card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminPrices() {
  await requireAdmin();
  const [categories, services] = await Promise.all([
    db.ccCategory.findMany({ orderBy: { sort: "asc" } }),
    db.service.findMany({ where: { archivedAt: null }, orderBy: [{ sort: "asc" }, { name: "asc" }], include: { prices: true } }),
  ]);
  const columns = `minmax(105px, 0.9fr) repeat(${categories.length}, minmax(0, 1fr))`;
  return <>
    <AdminHeader title="Fiyat yönetimi">Hizmetin ilgili CC grubundaki en düşük ve en yüksek ücretini girin. Aktif kutusu, fiyatın sitede gösterilmesini sağlar.</AdminHeader>
    {services.length && categories.length ? <AdminForm operation="prices" onlyChangedPrices label="Fiyatları toplu kaydet" buttonClassName="sticky bottom-3 z-10 mt-5 shadow-lg">
      <PriceColumns groups={categories.map(({ id, label }) => ({ id, label }))}>
      <div className="mb-2 hidden gap-2 px-3 text-sm font-semibold text-muted lg:grid" style={{ gridTemplateColumns: columns }}>
        <span>Hizmet</span>{categories.map((category) => <span key={category.id}>{category.label}</span>)}
      </div>
      <div className="space-y-2">
        {services.map((service) => <Card key={service.id} className="p-3">
          <div className="grid items-start gap-2 lg:grid-cols-[var(--price-columns)]" style={{ "--price-columns": columns } as CSSProperties}>
              <h2 className="self-center break-words font-sans text-sm font-bold">
                {service.name}{!service.isActive && <span className="mt-1 block text-xs font-medium text-muted">Hizmet pasif</span>}
              </h2>
              {categories.map((category) => {
                const price = service.prices.find(({ ccCategoryId }) => ccCategoryId === category.id);
                const key = `price.${service.id}.${category.id}`;
                return <PriceColumn key={JSON.stringify([category.id, price])} id={category.id}><fieldset className="min-w-0 rounded-md border border-line bg-ink/60 p-2">
                  <legend className="px-1 text-xs font-medium lg:sr-only">{service.name} · {category.label}</legend>
                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="min-w-0 text-xs text-muted">Min ₺<input
                      className="input mt-1 min-h-11 px-1.5 text-xs tabular-nums" aria-label={`${service.name}, ${category.label}, minimum fiyat`}
                      name={`${key}.minPrice`} inputMode="numeric" maxLength={8} placeholder="—" defaultValue={price?.minPrice} /></label>
                    <label className="min-w-0 text-xs text-muted">Max ₺<input
                      className="input mt-1 min-h-11 px-1.5 text-xs tabular-nums" aria-label={`${service.name}, ${category.label}, maksimum fiyat`}
                      name={`${key}.maxPrice`} inputMode="numeric" maxLength={8} placeholder="—" defaultValue={price?.maxPrice} /></label>
                  </div>
                  <label className="mt-1 flex min-h-10 items-center gap-2 text-xs">
                    <input className="h-4 w-4 accent-spark" type="checkbox" name={`${key}.isActive`} defaultChecked={price?.isActive ?? false}
                      aria-label={`${service.name}, ${category.label}, fiyat aktif`} /> Aktif
                  </label>
                </fieldset></PriceColumn>;
              })}
          </div>
        </Card>)}
      </div>
      </PriceColumns>
    </AdminForm> : <Card className="p-5 text-sm text-muted">Fiyat eklemek için en az bir hizmet ve CC grubu gerekir.</Card>}
  </>;
}
