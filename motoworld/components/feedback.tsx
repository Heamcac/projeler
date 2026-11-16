"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./ui";

export function Modal({ open, title, children, onClose, onConfirm, busy, confirmLabel, pendingLabel }: {
  open: boolean; title: string; children: ReactNode; onClose: () => void; onConfirm: () => void; busy: boolean;
  confirmLabel: string; pendingLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => {
    event.preventDefault();
    if (!busy) onClose();
  }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-surface p-6 text-paper backdrop:bg-ink/80">
    <h2 id={titleId} className="text-xl font-bold">{title}</h2>
    <div className="my-4 text-muted">{children}</div>
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="secondary" autoFocus disabled={busy} onClick={onClose}>Vazgeç</Button>
      <Button type="button" disabled={busy} onClick={onConfirm}>{busy ? pendingLabel : confirmLabel}</Button>
    </div>
  </dialog>;
}

export function Toast({ children }: { children: ReactNode }) {
  return <div role="status" className="fixed bottom-20 right-4 z-50 max-w-[calc(100%-2rem)] rounded-lg border border-spark bg-surface p-4 text-sm shadow-xl sm:bottom-6">
    {children}
  </div>;
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return <ol aria-label="Randevu adımları" className="mb-5 grid grid-cols-5 gap-1.5 sm:gap-3">
    {steps.map((step, index) => <li key={step} aria-current={current === index ? "step" : undefined}
      className={`border-t-2 pt-2 text-[11px] sm:text-sm ${index <= current ? "border-spark text-paper" : "border-line text-muted"}`}>
      <span className="block font-bold">0{index + 1}</span>{step}
    </li>)}
  </ol>;
}
