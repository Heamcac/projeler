import Link from "next/link";
import type { NotificationLog, NotificationStatus } from "@/generated/prisma/client";
import { Card } from "@/components/ui";
import { eventLabels } from "@/lib/notifications/templates";
import { timezone } from "@/lib/time";

export const notificationStatuses: Record<NotificationStatus, string> = {
  QUEUED: "Kuyrukta",
  SENDING: "Gönderiliyor",
  SENT: "Gönderildi",
  FAILED: "Başarısız",
  SKIPPED: "Atlandı",
};
const colors: Record<NotificationStatus, string> = {
  QUEUED: "text-muted",
  SENDING: "border-sky-400/40 text-sky-200",
  SENT: "border-emerald-400/40 text-emerald-200",
  FAILED: "border-red-400/40 text-red-200",
  SKIPPED: "text-muted",
};
const clock = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: timezone });
type Row = Pick<NotificationLog, "id" | "event" | "channel" | "status" | "errorMessage" | "attempts" | "nextAttemptAt" | "updatedAt"> & {
  booking?: { code: string };
};

export function NotificationList({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Card className="p-4 text-sm text-muted">Bu görünümde bildirim kaydı yok.</Card>;
  return <Card className="divide-y divide-line">
    {rows.map((row) => <article key={row.id} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-sans text-sm font-semibold">{eventLabels[row.event]}</h3>
          <span className="text-xs text-muted">{row.channel === "EMAIL" ? "E-posta" : "SMS"}</span>
          <span className={`rounded-full border border-line px-2.5 py-1 text-xs font-medium ${colors[row.status]}`}>{notificationStatuses[row.status]}</span>
        </div>
        {row.errorMessage && <p className="mt-1 break-words text-sm text-muted">{row.errorMessage}</p>}
        {row.nextAttemptAt && <p className="mt-1 text-xs text-muted">Tekrar deneme {clock.format(row.nextAttemptAt)}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted sm:max-w-[14rem] sm:justify-end">
        {row.booking && <Link className="font-mono font-semibold text-spark" href={`/admin/rezervasyonlar/${row.booking.code}`}>{row.booking.code}</Link>}
        <time dateTime={row.updatedAt.toISOString()}>{clock.format(row.updatedAt)}</time>
        {row.attempts > 0 && row.status !== "SKIPPED" && <span>{row.attempts} deneme</span>}
      </div>
    </article>)}
  </Card>;
}
