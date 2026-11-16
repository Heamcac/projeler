import Link from "next/link";
import type { BookingStatus } from "@/generated/prisma/client";
import type { ReactNode } from "react";
import type { BookingSummary } from "@/lib/admin";
import { statusLabels } from "@/lib/booking-status";
import { formatDate } from "@/lib/time";
import { Card } from "@/components/ui";

export function AdminHeader({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
      {children && <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>}
    </div>
    {actions}
  </header>;
}

const statusStyles: Record<BookingStatus, string> = {
  PENDING: "border-amber-300/40 text-amber-200",
  CONFIRMED: "border-sky-300/40 text-sky-200",
  COMPLETED: "border-emerald-300/40 text-emerald-200",
  CANCELLED: "border-line text-muted",
};

export function Status({ status }: { status: BookingStatus }) {
  return <span className={`inline-block shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}

export function BookingList({ items, empty, showDate = true }: { items: BookingSummary[]; empty: string; showDate?: boolean }) {
  if (!items.length) return <Card className="p-4 text-sm text-muted">{empty}</Card>;
  return <Card className="divide-y divide-line">
    {items.map((item) => <Link key={item.code} href={`/admin/rezervasyonlar/${item.code}`}
      className="grid gap-1 px-4 py-3 hover:bg-ink/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
      <div className="min-w-0">
        <span className="break-words font-semibold">{item.customerName}</span>
        <p className="mt-1 text-xs text-muted">{item.code} · {item.phone} · {item.category.label}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <time dateTime={`${item.date}T${item.timeSlot}:00+03:00`} className="text-sm font-medium">
          {showDate && `${formatDate(item.date)} · `}{item.timeSlot}
        </time>
        <Status status={item.status} />
      </div>
    </Link>)}
  </Card>;
}
