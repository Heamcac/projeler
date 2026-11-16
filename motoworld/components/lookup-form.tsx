"use client";

import { useState, type FormEvent } from "react";
import { manageBooking } from "@/app/actions";
import { statusLabels } from "@/lib/booking-status";
import { formatDate } from "@/lib/time";
import { Modal, Toast } from "./feedback";
import { Button, Card, Field } from "./ui";

type Result = NonNullable<Awaited<ReturnType<typeof manageBooking>>["booking"]>;

export function LookupForm() {
  const [fields, setFields] = useState({ code: "", phone: "" });
  const [booking, setBooking] = useState<Result>();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  async function lookup(cancel = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    setCancelled(false);
    if (!cancel) setBooking(undefined);
    try {
      const response = await manageBooking(fields, cancel);
      if (response.error) setError(response.error);
      if (response.booking) {
        setBooking(response.booking);
        setCancelled(cancel);
      }
    } catch {
      setError("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  function update(field: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setBooking(undefined);
    setCancelled(false);
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void lookup();
  }

  return <div className="space-y-4">
    <Card className="p-5 sm:p-7">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Rezervasyon kodu">
            <input className="input uppercase" required placeholder="MW-8K3F2" autoCapitalize="characters" maxLength={12}
              value={fields.code} disabled={busy} onChange={(event) => update("code", event.target.value)} />
          </Field>
          <Field title="Cep telefonu">
            <input className="input" required type="tel" autoComplete="tel" placeholder="05XX XXX XX XX" maxLength={24}
              value={fields.phone} disabled={busy} onChange={(event) => update("phone", event.target.value)} />
          </Field>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        <Button disabled={busy} type="submit">{busy && !confirm ? "Sorgulanıyor…" : "Randevuyu sorgula"}</Button>
      </form>
    </Card>
    {booking && <Card className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3" role="status">
        <h2 className="font-mono text-xl font-bold">{booking.code}</h2>
        <span className="rounded-full border border-line bg-ink px-3 py-1 text-sm font-semibold text-spark">{statusLabels[booking.status]}</span>
      </div>
      <dl className="my-4 space-y-2 text-sm">
        <div><dt className="inline font-semibold">Tarih ve saat </dt><dd className="inline text-muted">{formatDate(booking.date)} · {booking.timeSlot}</dd></div>
        <div><dt className="inline font-semibold">Motosiklet </dt><dd className="inline text-muted">{booking.bikeBrand} {booking.bikeModel}</dd></div>
        <div><dt className="inline font-semibold">Hizmetler </dt><dd className="inline text-muted">{booking.services.map(({ service }) => service.name).join(", ")}</dd></div>
      </dl>
      {["PENDING", "CONFIRMED"].includes(booking.status) && <Button type="button" variant="secondary" onClick={() => setConfirm(true)}>Randevuyu iptal et</Button>}
    </Card>}
    <Modal open={confirm} title="Randevuyu iptal etmek istiyor musunuz?" busy={busy}
      confirmLabel="Randevuyu iptal et" pendingLabel="İptal ediliyor…"
      onClose={() => setConfirm(false)} onConfirm={() => void lookup(true)}>
      İptal ederseniz ayrılan saat yeniden müsait olur.
    </Modal>
    {cancelled && <Toast>Randevu iptal edildi.</Toast>}
  </div>;
}
