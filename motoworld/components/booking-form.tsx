"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { submitBooking } from "@/app/actions";
import { formatDate, weekdays } from "@/lib/time";
import { contactSchema, serviceSchema, slotSchema, vehicleSchema } from "@/lib/validation";
import { Stepper, Toast } from "./feedback";
import { priceRange, type PriceCategory } from "./prices";
import { Button, ButtonLink, Card, Field } from "./ui";
import { sendAdminForm } from "./admin/forms";

const steps = ["Motor", "Hizmet", "Tarih", "İletişim", "Onay"];
const headings = ["Motosiklet bilgileri", "Hizmetleri seçin", "Tarih ve saat seçin", "İletişim bilgileri", "Randevuyu kontrol edin"];
const validators = [vehicleSchema, serviceSchema, slotSchema, contactSchema];

export function BookingForm({ categories, services, dates, year, staff = false }: {
  categories: PriceCategory[];
  services: { id: string; name: string; durationMinutes: number }[];
  dates: string[];
  year: string;
  staff?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState({
    bikeBrand: "", bikeModel: "", bikeYear: "", ccCategoryId: "", plate: "",
    date: "", timeSlot: "", customerName: "", phone: "", email: "", note: "", website: "",
  });
  const [servicesSelected, setServicesSelected] = useState<string[]>([]);
  const [notificationConsent, setNotificationConsent] = useState(false);
  const [availability, setAvailability] = useState<{ date: string; slots: string[]; error?: string }>();
  const [reload, setReload] = useState(0);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const category = categories.find(({ id }) => id === fields.ccCategoryId);
  const selected = services.filter(({ id }) => servicesSelected.includes(id));
  const pricesByService = new Map(category?.prices.map((price) => [price.service.id, price]));
  const subtotal = selected.reduce((total, service) => {
    const price = pricesByService.get(service.id);
    return price ? { min: total.min + price.minPrice, max: total.max + price.maxPrice, count: total.count + 1 } : total;
  }, { min: 0, max: 0, count: 0 });
  const currentAvailability = availability?.date === fields.date ? availability : undefined;

  useEffect(() => {
    const date = fields.date;
    if (!date) return;
    const controller = new AbortController();
    fetch(`/api/musaitlik?tarih=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (controller.signal.aborted) return;
        setAvailability({ date, slots: data.slots ?? [], error: response.ok ? undefined : data.error });
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability({ date, slots: [], error: "Müsait saatler yüklenemedi." });
      });
    return () => controller.abort();
  }, [fields.date, reload]);

  function update(name: keyof typeof fields, value: string) {
    if (name === "date") setAvailability(undefined);
    setFields((current) => ({ ...current, [name]: value, ...(name === "date" ? { timeSlot: "" } : {}) }));
    setIssues((current) => ({ ...current, [name]: "", form: "" }));
  }

  function move(next: number) {
    setStep(next);
    setIssues({});
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || code) return;
    const payload = { ...fields, serviceIds: servicesSelected, notificationConsent };
    if (step < validators.length) {
      const validated = validators[step].safeParse(payload);
      if (!validated.success) {
        const nextIssues = Object.fromEntries(validated.error.issues.map((issue) => [issue.path[0], issue.message]));
        setIssues(nextIssues);
        requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
      move(step + 1);
      return;
    }

    setBusy(true);
    try {
      let result;
      if (staff) {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields)) form.set(key, value);
        for (const id of servicesSelected) form.append("serviceIds", id);
        if (notificationConsent) form.set("notificationConsent", "on");
        const response = await sendAdminForm("create-booking", form);
        result = response.error ? { error: response.error } : { code: response.redirectTo?.split("/").at(-1) };
      } else {
        result = await submitBooking(payload);
      }
      if ("error" in result && result.error) {
        setIssues({ form: result.error });
        setReload((current) => current + 1);
      } else if ("code" in result && result.code) {
        setCode(result.code);
        requestAnimationFrame(() => heading.current?.focus());
      }
    } catch {
      setIssues({ form: "Randevu kaydedilemedi. Lütfen tekrar deneyin." });
    } finally {
      setBusy(false);
    }
  }

  const messages = (name: string) => issues[name] && <span className="text-sm text-red-200" id={`error-${name}`}>{issues[name]}</span>;
  const accessibility = (name: string) => ({
    "aria-invalid": Boolean(issues[name]), "aria-describedby": issues[name] ? `error-${name}` : undefined,
  });
  function input(name: keyof typeof fields, title: string, options: { type?: string; autoComplete?: string; maxLength?: number; placeholder?: string } = {}) {
    return <Field title={title}>
      <input className="input" name={name} {...options} {...accessibility(name)} value={fields[name]}
        onChange={(event) => update(name, event.target.value)} />
      {messages(name)}
    </Field>;
  }
  const estimate = selected.length > 0 && <div className="rounded-lg border border-line bg-ink/60 p-4 text-sm" aria-live="polite">
    {subtotal.count > 0 && <p>Tahmini {subtotal.count < selected.length ? "ara toplam" : "toplam"}
      <strong className="ml-2 text-spark">{priceRange(subtotal.min, subtotal.max)}</strong>
    </p>}
    {subtotal.count < selected.length && <p className="mt-1 text-muted">Fiyatı listelenmeyen hizmetler için servis bilgilendirecektir.</p>}
  </div>;

  if (code) return <Card className="p-6 sm:p-8">
    <h2 className="text-2xl font-bold" tabIndex={-1} ref={heading}>{staff ? "Randevu oluşturuldu" : "Randevu isteğiniz alındı"}</h2>
    <p className="mt-3 text-muted">{staff ? "Durumu onaylandı. Sorgulama kodunu müşterinizle paylaşabilirsiniz." : "Durumunuz beklemede. Sorgulama ve iptal için rezervasyon kodunuzu saklayın."}</p>
    <p className="my-5 inline-block rounded-md border border-line bg-ink px-4 py-2 font-mono text-2xl font-bold text-spark">{code}</p>
    <div><ButtonLink href={staff ? `/admin/rezervasyonlar/${code}` : "/randevu-sorgula"} variant="secondary">{staff ? "Randevu detayına git" : "Randevu sorgula"}</ButtonLink></div>
    <Toast>{staff ? "Randevu oluşturuldu." : "Randevu isteği kaydedildi."}</Toast>
  </Card>;

  return <>
    <Stepper steps={steps} current={step} />
    <Card className="p-5 sm:p-8">
      <h2 tabIndex={-1} ref={heading} className="mb-5 text-2xl font-bold">{headings[step]}</h2>
      <form ref={form} onSubmit={next} noValidate>
        <div hidden aria-hidden="true"><label>Web sitesi<input name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(event) => update("website", event.target.value)} /></label></div>
        {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
          {input("bikeBrand", "Marka", { maxLength: 60 })}
          {input("bikeModel", "Model", { maxLength: 60 })}
          {input("bikeYear", "Model yılı", { type: "number", placeholder: year })}
          <Field title="CC grubu">
            <select className="input" name="ccCategoryId" value={fields.ccCategoryId} {...accessibility("ccCategoryId")} onChange={(event) => update("ccCategoryId", event.target.value)}>
              <option value="">Grup seçin</option>
              {categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
            {messages("ccCategoryId")}
          </Field>
          {input("plate", "Plaka (isteğe bağlı)", { maxLength: 16 })}
        </div>}
        {step === 1 && <div className="space-y-4">
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-3 text-sm text-muted">Bir veya birden fazla hizmet seçebilirsiniz.</legend>
            {services.map(({ id, name, durationMinutes }) => <label key={id} className="flex min-h-14 items-start gap-3 rounded-lg border border-line bg-ink/70 p-3 text-sm has-[:checked]:border-spark">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-spark" {...accessibility("serviceIds")} checked={servicesSelected.includes(id)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setServicesSelected((current) => checked ? [...current, id] : current.filter((value) => value !== id));
                  setIssues({});
                }} />
              <span>{name}<small className="block text-muted">{durationMinutes} dk</small></span>
            </label>)}
          </fieldset>
          {messages("serviceIds")}
          {estimate}
        </div>}
        {step === 2 && <div className="space-y-5">
          <Field title="Tarih">
            <select className="input" name="date" value={fields.date} disabled={!dates.length}
              {...accessibility("date")} onChange={(event) => update("date", event.target.value)}>
              <option value="">{dates.length ? "Tarih seçin" : "Açık gün bulunamadı"}</option>
              {dates.map((date) => <option key={date} value={date}>{formatDate(date)} {weekdays[new Date(date).getUTCDay()]}</option>)}
            </select>
            {messages("date")}
          </Field>
          {fields.date && <fieldset>
            <legend className="mb-2 text-sm font-medium">Müsait saatler</legend>
            {currentAvailability?.error ? <div className="flex flex-wrap items-center gap-3">
              <p role="alert" className="error">{currentAvailability.error}</p>
              <Button type="button" variant="secondary" onClick={() => { setAvailability(undefined); setReload((current) => current + 1); }}>Tekrar dene</Button>
            </div> : !currentAvailability ? <p role="status" className="text-sm text-muted">Saatler yükleniyor…</p>
              : currentAvailability.slots.length === 0 ? <p role="status" className="text-sm text-muted">Bu tarihte müsait saat yok. Başka bir tarih seçin.</p>
              : <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {currentAvailability.slots.map((slot) => <label key={slot} className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line text-sm font-semibold has-[:checked]:border-spark has-[:checked]:bg-spark has-[:checked]:text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-spark">
                  <input type="radio" name="timeSlot" className="sr-only" checked={fields.timeSlot === slot}
                    {...accessibility("timeSlot")} onChange={() => update("timeSlot", slot)} />{slot}
                </label>)}
              </div>}
            {messages("timeSlot")}
          </fieldset>}
          <p className="text-xs text-muted">Saatler Türkiye saatiyle gösterilir.</p>
        </div>}
        {step === 3 && <div className="grid gap-4 sm:grid-cols-2">
          {input("customerName", "Ad soyad", { autoComplete: "name", maxLength: 100 })}
          {input("phone", "Cep telefonu", { type: "tel", autoComplete: "tel", placeholder: "05XX XXX XX XX", maxLength: 24 })}
          {input("email", "E-posta (isteğe bağlı)", { type: "email", autoComplete: "email", maxLength: 254 })}
          <div className="sm:col-span-2"><Field title="Not (isteğe bağlı)">
            <textarea className="input" rows={3} maxLength={1000} value={fields.note} {...accessibility("note")} onChange={(event) => update("note", event.target.value)} />
            {messages("note")}
          </Field></div>
          <div className="rounded-lg border border-line bg-ink/50 p-4 text-sm sm:col-span-2">
            <Link href="/gizlilik-ve-kvkk" target="_blank" rel="noopener noreferrer" className="font-medium text-spark underline underline-offset-4">
              KVKK aydınlatma metni
            </Link>
            <Link href="/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="ml-3 inline-block text-spark underline underline-offset-4">
              Çerez politikası
            </Link>
            <label className="mt-3 flex min-h-10 items-start gap-3">
              <input type="checkbox" name="notificationConsent" className="mt-0.5 h-4 w-4 shrink-0 accent-spark"
                checked={notificationConsent} onChange={(event) => setNotificationConsent(event.target.checked)} />
              <span>{staff ? "Müşteri isteğe bağlı bilgilendirme mesajlarını almayı kabul etti." : "Bilgilendirme mesajları almayı kabul ediyorum (isteğe bağlı)."}</span>
            </label>
            <p className="text-muted">Bu izin hatırlatma ve randevu tamamlandı mesajlarını kapsar. Kayıt, onay ve iptal bildirimleri randevu işleminin parçasıdır.</p>
          </div>
        </div>}
        {step === 4 && <div className="space-y-4">
          <dl className="divide-y divide-line text-sm">
            {[
              ["Motosiklet", `${fields.bikeBrand} ${fields.bikeModel} · ${fields.bikeYear} · ${category?.label}${fields.plate ? ` · ${fields.plate}` : ""}`],
              ["Hizmetler", selected.map(({ name }) => name).join(", ")],
              ["Randevu", `${formatDate(fields.date)} · ${fields.timeSlot}`],
              ["İletişim", [fields.customerName, fields.phone, fields.email].filter(Boolean).join(" · ")],
              ["Not", fields.note],
              ["Bilgilendirme izni", notificationConsent ? "Var" : "Yok"],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]">
              <dt className="text-muted">{label}</dt><dd className="break-words font-medium">{value}</dd>
            </div>)}
          </dl>
          {estimate}
        </div>}
        {issues.form && <p role="alert" className="error mt-4">{issues.form}</p>}
        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-line pt-5">
          {step > 0 && <Button type="button" variant="secondary" disabled={busy} onClick={() => move(step - 1)}>Geri</Button>}
          {step === 4 && issues.form && <Button variant="secondary" type="button" onClick={() => move(2)}>Saatleri kontrol et</Button>}
          <Button type="submit" className="ml-auto" disabled={busy || (step === 2 && !currentAvailability?.slots.includes(fields.timeSlot))}>
            {busy ? "Kaydediliyor…" : step === 4 ? (staff ? "Randevu oluştur" : "Randevu isteği gönder") : "Devam et"}
          </Button>
        </div>
      </form>
    </Card>
  </>;
}
