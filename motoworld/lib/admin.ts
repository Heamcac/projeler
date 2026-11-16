import { Prisma, type BookingStatus, type NotificationEvent } from "@/generated/prisma/client";
import { db } from "./db";
import { notificationEntries } from "./notifications/entries";
import { addDays, weekStart } from "./time";

export class AdminError extends Error {}

const bookingOrder = [{ date: "asc" }, { timeSlot: "asc" }, { createdAt: "asc" }] satisfies Prisma.BookingOrderByWithRelationInput[];
const summary = {
  code: true, customerName: true, phone: true, date: true, timeSlot: true, status: true,
  category: { select: { label: true } },
} satisfies Prisma.BookingSelect;

export type BookingSummary = Prisma.BookingGetPayload<{ select: typeof summary }>;

export function bookingsBetween(start: string, end: string) {
  return db.booking.findMany({
    where: { date: { gte: start, lte: end } }, select: summary, orderBy: bookingOrder,
  });
}

export async function dashboard(today: string) {
  const start = weekStart(today);
  const [todayBookings, pending, pendingCount, groups] = await Promise.all([
    bookingsBetween(today, today),
    db.booking.findMany({ where: { status: "PENDING" }, select: summary, orderBy: bookingOrder, take: 8 }),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.groupBy({
      by: ["status"], where: { date: { gte: start, lte: addDays(start, 6) } }, _count: { _all: true },
    }),
  ]);
  const week = Object.fromEntries(groups.map(({ status, _count }) => [status, _count._all]));
  return { todayBookings, pending, pendingCount, week };
}

function fold(text: string) {
  return text.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{M}/gu, "").replace(/ı/g, "i");
}

export async function searchableBookings(filters: {
  from?: string; to?: string; status?: BookingStatus; category?: string; search?: string; page: number;
}) {
  const size = 25;
  const where: Prisma.BookingWhereInput = {
    date: { gte: filters.from, lte: filters.to },
    ccCategoryId: filters.category,
    status: filters.status,
  };
  const orderBy: Prisma.BookingOrderByWithRelationInput[] = [{ date: "desc" }, { timeSlot: "asc" }, { code: "asc" }];
  if (filters.search) {
    const search = fold(filters.search);
    const phone = /^[+\d ().-]+$/.test(search) ? search.replace(/\D/g, "").replace(/^905/, "05") : "";
    const candidates = await db.booking.findMany({ where, select: summary, orderBy });
    const matches = candidates.filter((row) =>
      fold(row.customerName).includes(search) || fold(row.code).includes(search) || (phone && row.phone.includes(phone)),
    );
    const pageCount = Math.max(1, Math.ceil(matches.length / size));
    const page = Math.min(pageCount, filters.page);
    return { bookings: matches.slice((page - 1) * size, page * size), page, pageCount, total: matches.length };
  }
  const total = await db.booking.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(pageCount, filters.page);
  const bookings = await db.booking.findMany({
    where, select: summary, orderBy,
    skip: (page - 1) * size, take: size,
  });
  return { bookings, page, pageCount, total };
}

export const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function changeBookingStatus(code: string, current: BookingStatus, next: BookingStatus) {
  if (!allowedTransitions[current].includes(next)) throw new AdminError("Bu durum değişikliği yapılamaz.");
  const event: NotificationEvent = next === "CONFIRMED" ? "BOOKING_CONFIRMED" : next === "CANCELLED" ? "BOOKING_CANCELLED" : "BOOKING_COMPLETED";
  try {
    await db.booking.update({
      where: { code, status: current, anonymizedAt: null },
      data: {
        status: next,
        closedAt: next === "COMPLETED" || next === "CANCELLED" ? new Date() : undefined,
        notifications: { create: notificationEntries(event) },
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AdminError("Randevu durumu değişmiş. Sayfayı yenileyip tekrar deneyin.");
    }
    throw error;
  }
}

export async function addBookingNote(code: string, text: string) {
  await db.booking.update({ where: { code, anonymizedAt: null }, data: { adminNotes: { create: { text } } } });
}

export type PriceUpdate = { serviceId: string; ccCategoryId: string; minPrice: number; maxPrice: number; isActive: boolean };

export async function savePrices(updates: PriceUpdate[]) {
  await db.$transaction(async (tx) => {
    const ids = [...new Set(updates.map(({ serviceId }) => serviceId))];
    if (await tx.service.count({ where: { id: { in: ids }, archivedAt: null } }) !== ids.length) {
      throw new AdminError("Hizmet listesi değişmiş. Sayfayı yenileyin.");
    }
    for (const { ccCategoryId, serviceId, ...price } of updates) {
      const key = { ccCategoryId, serviceId };
      await tx.priceItem.upsert({
        where: { ccCategoryId_serviceId: key }, create: { ...key, ...price }, update: price,
      });
    }
  }, { timeout: 20_000 });
}

export async function saveService(id: string | undefined, fields: { name: string; durationMinutes: number; isActive: boolean }) {
  if (id) {
    await db.service.update({ where: { id, archivedAt: null }, data: fields });
    return;
  }
  const { _max } = await db.service.aggregate({ _max: { sort: true } });
  await db.service.create({ data: { ...fields, sort: (_max.sort ?? -1) + 1 } });
}

export async function archiveService(id: string) {
  await db.service.update({ where: { id, archivedAt: null }, data: { isActive: false, archivedAt: new Date() } });
}

export async function saveHours(hours: Prisma.WorkingHoursCreateInput[]) {
  await db.$transaction(hours.map((fields) => db.workingHours.upsert({
    where: { weekday: fields.weekday }, create: fields, update: fields,
  })));
}

export async function saveSiteSettings(settings: Record<string, string>) {
  await db.$transaction(Object.entries(settings).map(([key, value]) =>
    db.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
  ));
}
