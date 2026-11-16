import { AdminHeader } from "@/components/admin/display";
import { AdminForm } from "@/components/admin/forms";
import { Card, Field } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, shopClock, weekdays } from "@/lib/time";

export default async function Schedule() {
  await requireAdmin();
  const [hours, holidays] = await Promise.all([
    db.workingHours.findMany({ orderBy: { weekday: "asc" } }),
    db.holiday.findMany({ orderBy: { date: "asc" } }),
  ]);
  return <>
    <AdminHeader title="Çalışma saatleri ve tatil">Günlük saatleri, randevu aralığını ve kapasiteyi düzenleyin. Tatil günleri yeni randevulara kapanır.</AdminHeader>
    <Card className="mb-7 p-4 sm:p-5">
      <h2 className="mb-3 text-2xl font-bold">Haftalık çalışma saatleri</h2>
      <AdminForm key={JSON.stringify(hours)} operation="hours" label="Çalışma saatlerini kaydet" buttonClassName="mt-4">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
            const row = hours.find((day) => day.weekday === weekday);
            const name = `day.${weekday}`;
            return <fieldset key={weekday} className="rounded-lg border border-line bg-ink/40 px-3 pb-3">
              <legend className="px-1 text-sm font-bold">{weekdays[weekday]}</legend>
              <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
                <Field title="Açılış"><input className="input" name={`${name}.opens`} type="time" required defaultValue={row?.opens ?? "08:30"} /></Field>
                <Field title="Kapanış"><input className="input" name={`${name}.closes`} type="time" required defaultValue={row?.closes ?? "18:30"} /></Field>
                <Field title="Slot süresi (dk)"><input className="input" name={`${name}.slotMinutes`} type="number" min={5} max={720} required defaultValue={row?.slotMinutes ?? 60} /></Field>
                <Field title="Slot kapasitesi"><input className="input" name={`${name}.maxPerSlot`} type="number" min={1} max={100} required defaultValue={row?.maxPerSlot ?? 2} /></Field>
                <label className="flex min-h-12 items-center gap-2 px-1 text-sm">
                  <input className="h-4 w-4 accent-spark" type="checkbox" name={`${name}.isClosed`} defaultChecked={row?.isClosed ?? true} /> Kapalı
                </label>
              </div>
            </fieldset>;
          })}
        </div>
      </AdminForm>
    </Card>
    <Card className="p-4 sm:p-5">
      <h2 className="mb-3 text-2xl font-bold">Tatil günleri</h2>
      <AdminForm operation="holiday" label="Tatil ekle" reset className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
        <Field title="Tarih"><input className="input" name="date" type="date" defaultValue={shopClock().date} required /></Field>
        <Field title="Açıklama"><input className="input" name="label" required maxLength={120} placeholder="Resmî tatil, izin…" /></Field>
      </AdminForm>
      {holidays.length ? <ul className="mt-5 divide-y divide-line border-t border-line">
        {holidays.map(({ date, label }) => <li key={date} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <div><strong className="block">{formatDate(date)}</strong><p className="break-words text-sm text-muted">{label}</p></div>
          <AdminForm operation="delete-holiday" label="Tatili sil" secondary
            confirm={{ title: "Tatil günü silinsin mi?", description: `${formatDate(date)} için normal çalışma saatleri yeniden uygulanır.` }}>
            <input type="hidden" name="date" value={date} />
          </AdminForm>
        </li>)}
      </ul> : <p className="mt-4 text-sm text-muted">Kayıtlı tatil günü yok.</p>}
    </Card>
  </>;
}
