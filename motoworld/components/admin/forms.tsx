"use client";

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Modal, Toast } from "@/components/feedback";
import { Button } from "@/components/ui";

const Feedback = createContext<(message: string) => void>(() => {});

export function AdminFeedback({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string }>();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(undefined), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  return <Feedback.Provider value={(text) => setMessage({ text })}>
    {children}
    {message && <Toast>{message.text}</Toast>}
  </Feedback.Provider>;
}

export async function sendAdminForm(operation: string, form: FormData) {
  const response = await fetch(`/api/admin/${operation}`, { method: "POST", body: form });
  return await response.json() as { error?: string; message?: string; redirectTo?: string };
}

function changedPrices(form: HTMLFormElement) {
  const groups = new Set<string>();
  const fields = Array.from(form.querySelectorAll<HTMLInputElement>("input[name^='price.']"));
  for (const field of fields) {
    const changed = field.type === "checkbox" ? field.checked !== field.defaultChecked : field.value !== field.defaultValue;
    if (changed) groups.add(field.name.slice(0, field.name.lastIndexOf(".")));
  }
  const result = new FormData();
  for (const field of fields) {
    if (!groups.has(field.name.slice(0, field.name.lastIndexOf(".")))) continue;
    if (field.type !== "checkbox" || field.checked) result.append(field.name, field.value);
  }
  return result;
}

export function AdminForm({ operation, children, label, confirm, reset, className, secondary, buttonClassName, onlyChangedPrices }: {
  operation: string; children?: ReactNode; label: string; confirm?: { title: string; description: string };
  reset?: boolean; className?: string; secondary?: boolean; buttonClassName?: string; onlyChangedPrices?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const notify = useContext(Feedback);
  const [payload, setPayload] = useState<FormData>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(form: HTMLFormElement, data: FormData) {
    setBusy(true);
    setError("");
    try {
      const result = await sendAdminForm(operation, data);
      if (result.error) {
        setError(result.error);
        notify(result.error);
        return;
      }
      if (reset) form.reset();
      if (result.message) notify(result.message);
      if (result.redirectTo) router.replace(result.redirectTo);
      router.refresh();
    } catch {
      setError("İşlem tamamlanamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setBusy(false);
      setPayload(undefined);
    }
  }

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = onlyChangedPrices ? changedPrices(form) : new FormData(form);
    if (confirm) {
      setPayload(data);
      return;
    }
    void submit(form, data);
  }

  return <form ref={formRef} onSubmit={prepare} className={className}>
    {children}
    {error && <p role="alert" className="error my-2">{error}</p>}
    <Button type="submit" className={buttonClassName} variant={secondary ? "secondary" : "primary"} disabled={busy}>
      {busy ? "İşleniyor…" : label}
    </Button>
    {confirm && <Modal open={Boolean(payload)} title={confirm.title} confirmLabel={label} pendingLabel="İşleniyor…" busy={busy}
      onClose={() => setPayload(undefined)} onConfirm={() => { if (payload && formRef.current) void submit(formRef.current, payload); }}>
      {confirm.description}
    </Modal>}
  </form>;
}
