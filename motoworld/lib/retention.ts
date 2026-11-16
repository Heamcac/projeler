import { randomBytes } from "node:crypto";
import { addDays, shopClock } from "./time";
import { db } from "./db";

export const retentionKey = "bookingRetentionDays";
export const retentionDefaults = { days: 365, min: 30, max: 3650 };

export async function getRetentionDays() {
  const row = await db.setting.findUnique({ where: { key: retentionKey } });
  const days = Number(row?.value);
  return Number.isInteger(days) && days >= retentionDefaults.min && days <= retentionDefaults.max ? days : retentionDefaults.days;
}

export async function anonymizeBookings(now = new Date()) {
  const days = await getRetentionDays();
  const dateCutoff = addDays(shopClock(now).date, -days);
  const timestamp = new Date(now.getTime() - days * 86_400_000);
  const eligible = {
    anonymizedAt: null,
    date: { lt: dateCutoff },
    createdAt: { lt: timestamp },
    OR: [{ closedAt: null }, { closedAt: { lt: timestamp } }],
    notifications: { none: { status: "SENDING" as const } },
  };
  const batch = await db.booking.findMany({ where: eligible, select: { id: true }, orderBy: [{ date: "asc" }, { id: "asc" }], take: 100 });
  let count = 0;
  for (const { id } of batch) {
    count += await db.$transaction(async (tx) => {
      // Delivery claims take the same parent lock before touching a notification.
      await tx.$queryRaw`SELECT "id" FROM "Booking" WHERE "id" = ${id} FOR UPDATE`;
      const result = await tx.booking.updateMany({
        where: { id, ...eligible },
        data: {
          code: `AN-${randomBytes(12).toString("hex")}`,
          customerName: "Anonim randevu", phone: "", email: null, plate: null, note: null,
          bikeBrand: "", bikeModel: "", bikeYear: 0, notificationConsentAt: null, anonymizedAt: now,
        },
      });
      if (!result.count) return 0;
      await tx.bookingNote.deleteMany({ where: { bookingId: id } });
      await tx.notificationLog.updateMany({
        where: { bookingId: id, OR: [{ status: "QUEUED" }, { nextAttemptAt: { not: null } }] },
        data: { status: "SKIPPED", nextAttemptAt: null },
      });
      await tx.notificationLog.updateMany({ where: { bookingId: id }, data: { errorMessage: null } });
      return 1;
    });
  }
  await Promise.all([
    db.loginThrottle.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.rateLimit.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.adminSession.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);
  return count;
}
