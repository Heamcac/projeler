import { Prisma, type NotificationEvent } from "@/generated/prisma/client";
import { db } from "../db";
import { getSettings, siteUrl } from "../catalog";
import { shopClock } from "../time";
import { channelsFor } from "./channels";
import { notificationEntries } from "./entries";
import { normalizeMobile } from "./phone";
import { DeliveryError, notificationProviders, type Delivery, type NotificationProviders } from "./providers";
import { appointmentTime, dueReminder, reminderDeadline } from "./reminder-time";
import { getNotificationSettings } from "./settings";
import { bookingVariables, fillTemplate, isOwnerEvent, testTemplate } from "./templates";
import { singleSms, smsWithLink } from "./sms-text";

const maxAttempts = 4;
const bookingSelection = {
  code: true, customerName: true, date: true, timeSlot: true, phone: true, email: true,
  status: true, notificationConsentAt: true,
} satisfies Prisma.BookingSelect;
type Job = Prisma.NotificationLogGetPayload<{ include: { booking: { select: typeof bookingSelection } } }>;
type Preferences = Awaited<ReturnType<typeof getNotificationSettings>>;

function available(now: Date): Prisma.NotificationLogWhereInput {
  return { OR: [{ status: "QUEUED" }, { status: "FAILED", nextAttemptAt: { lte: now }, attempts: { lt: maxAttempts } }] };
}

export async function enqueueReminders(now = new Date()) {
  const { schedule } = await getNotificationSettings();
  const until = new Date(now.valueOf() + schedule.early * 60_000);
  const candidates = await db.booking.findMany({
    where: { status: "CONFIRMED", anonymizedAt: null, date: { gte: shopClock(now).date, lte: shopClock(until).date } },
    select: {
      id: true, date: true, timeSlot: true,
      notifications: { where: { event: { in: ["REMINDER_EARLY", "REMINDER_LATE"] } }, select: { event: true, channel: true } },
    },
  });
  let count = 0;
  for (const booking of candidates) {
    const event = dueReminder(appointmentTime(booking.date, booking.timeSlot), now.valueOf(), schedule);
    if (!event) continue;
    for (const entry of notificationEntries(event)) {
      if (booking.notifications.some((job) => job.event === event && job.channel === entry.channel)) continue;
      const key = { bookingId: booking.id, ...entry };
      try {
        await db.notificationLog.create({ data: key });
        count++;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
    }
  }
  return count;
}

function skipReason(event: NotificationEvent, booking: Job["booking"], now: Date, preferences: Preferences) {
  if (event === "REMINDER_EARLY" || event === "REMINDER_LATE") {
    if (!booking.notificationConsentAt) return "Müşterinin bilgilendirme izni yok.";
    if (booking.status !== "CONFIRMED") return "Randevu artık onaylı durumda değil.";
    const appointment = appointmentTime(booking.date, booking.timeSlot);
    if (now.valueOf() >= reminderDeadline(event, appointment, preferences.schedule.late)) return "Hatırlatma süresi geçti.";
  }
  if (event === "BOOKING_COMPLETED" && !booking.notificationConsentAt) return "Müşterinin bilgilendirme izni yok.";
  if (event === "BOOKING_CONFIRMED" && booking.status === "CANCELLED") return "Randevu zaten iptal edildi.";
}

async function deliver(job: Job, booking: Job["booking"], now: Date, preferences: Preferences, shop: Awaited<ReturnType<typeof getSettings>>, providers: NotificationProviders): Promise<Delivery> {
  const rule = preferences.rules[job.event];
  const email = job.channel === "EMAIL";
  if (!channelsFor(job.event).includes(job.channel)) return { status: "SKIPPED", reason: "Bu olay için kanal kapalı." };
  const reason = skipReason(job.event, booking, now, preferences);
  if (reason) return { status: "SKIPPED", reason };
  const owner = isOwnerEvent(job.event);
  const approvalLink = job.event === "OWNER_NEW_BOOKING"
    ? new URL(`/admin/rezervasyonlar/${encodeURIComponent(booking.code)}`, siteUrl()).href
    : undefined;
  const variables = bookingVariables(booking, shop);
  if (email) {
    const to = owner ? process.env.NOTIFICATION_OWNER_EMAIL?.trim() : booking.email;
    if (!to) return { status: "SKIPPED", reason: owner ? "Dükkan e-posta adresi ayarlanmamış." : "Müşteri e-posta girmemiş." };
    if (!providers.email) return { status: "SKIPPED", reason: "SMTP ayarlanmamış." };
    const text = fillTemplate(rule.email, variables);
    return providers.email.send({ to, subject: fillTemplate(rule.subject, variables), text: approvalLink ? `${text}\n\n${approvalLink}` : text });
  }
  const to = normalizeMobile(owner ? process.env.NOTIFICATION_OWNER_PHONE?.trim() || shop.phone || "" : booking.phone);
  if (!to) return { status: "SKIPPED", reason: owner ? "Dükkan bildirim telefonu ayarlanmamış veya geçersiz." : "Geçerli cep telefonu bulunamadı." };
  const body = fillTemplate(rule.sms, variables);
  const text = approvalLink ? smsWithLink(body, approvalLink) : singleSms(body);
  if (!text) return { status: "SKIPPED", reason: "SMS metni boş." };
  return providers.sms.send({ to, text });
}

export async function processDeliveryQueue({ bookingCode, now = new Date(), providers = notificationProviders(), limit = 24 }: {
  bookingCode?: string; now?: Date; providers?: NotificationProviders; limit?: number;
} = {}) {
  const scope = bookingCode ? { booking: { code: bookingCode } } : {};
  await db.notificationLog.updateMany({
    where: { ...scope, status: "SENDING", updatedAt: { lt: new Date(now.valueOf() - 3 * 60_000) } },
    data: { status: "FAILED", nextAttemptAt: null, errorMessage: "Gönderim sonucu doğrulanamadı." },
  });
  const jobs = await db.notificationLog.findMany({
    where: { ...scope, ...available(now) }, take: limit, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { booking: { select: bookingSelection } },
  });
  if (!jobs.length) return 0;
  const [preferences, shop] = await Promise.all([getNotificationSettings(), getSettings()]);

  async function process(job: Job) {
    const booking = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Booking" WHERE "id" = ${job.bookingId} FOR UPDATE`;
      const claimed = await tx.notificationLog.updateMany({
        where: { id: job.id, attempts: job.attempts, booking: { anonymizedAt: null }, ...available(now) },
        data: { status: "SENDING", attempts: { increment: 1 }, nextAttemptAt: null, updatedAt: now },
      });
      if (!claimed.count) return null;
      return tx.booking.findUniqueOrThrow({ where: { id: job.bookingId }, select: bookingSelection });
    });
    if (!booking) return 0;
    let result: Prisma.NotificationLogUpdateManyMutationInput;
    try {
      const delivery = await deliver(job, booking, now, preferences, shop, providers);
      result = { status: delivery.status, errorMessage: delivery.status === "SKIPPED" ? delivery.reason : null };
    } catch (error) {
      const known = error instanceof DeliveryError;
      const delays = [1, 5, 15];
      const retry = known && error.retryable && job.attempts + 1 < maxAttempts;
      result = {
        status: "FAILED",
        errorMessage: known ? error.message : "Bildirim sağlayıcısında gönderim hatası.",
        nextAttemptAt: retry ? new Date(now.valueOf() + delays[job.attempts] * 60_000) : null,
      };
    }
    await db.notificationLog.updateMany({ where: { id: job.id, status: "SENDING" }, data: result });
    return 1;
  }

  let count = 0;
  for (let offset = 0; offset < jobs.length; offset += 6) {
    const batch = await Promise.all(jobs.slice(offset, offset + 6).map(process));
    count += batch.reduce<number>((total, processed) => total + processed, 0);
  }
  return count;
}

export async function sendTestEmail(recipient: string) {
  const { email } = notificationProviders();
  if (!email) return { status: "SKIPPED", reason: "SMTP ayarlanmamış." } as const;
  const shop = await getSettings();
  const variables = { dukkan: shop.shopName ?? "MOTOWORLD" };
  const text = fillTemplate(testTemplate.body, variables);
  return email.send({ to: recipient, text, subject: fillTemplate(testTemplate.subject, variables) });
}
