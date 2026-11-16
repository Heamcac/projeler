import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";
import { db } from "./db";
import { notificationEntries } from "./notifications/entries";
import { addDays, availableSlots, bookingWindowDays, inBookingWindow, shopClock } from "./time";
import type { bookingSchema, lookupSchema } from "./validation";

type BookingInput = z.output<typeof bookingSchema>;
type LookupInput = z.output<typeof lookupSchema>;

export class BookingError extends Error {}

export async function bookableDates(now = new Date()) {
  const today = shopClock(now).date;
  const [hours, holidays] = await Promise.all([
    db.workingHours.findMany(),
    db.holiday.findMany({ where: { date: { gte: today, lte: addDays(today, bookingWindowDays) } } }),
  ]);
  const byWeekday = new Map(hours.map((day) => [day.weekday, day]));
  const closed = new Set(holidays.map(({ date }) => date));
  return Array.from({ length: bookingWindowDays + 1 }, (_, index) => addDays(today, index)).filter((date) => {
    const dayHours = byWeekday.get(new Date(date).getUTCDay()) ?? null;
    return availableSlots(date, dayHours, closed.has(date), [], now).length > 0;
  });
}

export async function slotsOn(date: string, client: Prisma.TransactionClient = db, now = new Date()) {
  if (!inBookingWindow(date, now)) return [];
  const hours = await client.workingHours.findUnique({ where: { weekday: new Date(date).getUTCDay() } });
  const holiday = await client.holiday.findUnique({ where: { date } });
  const occupied = await client.booking.groupBy({
    by: ["timeSlot"],
    where: { date, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  return availableSlots(date, hours, Boolean(holiday), occupied.map((slot) => ({
    timeSlot: slot.timeSlot, count: slot._count._all,
  })), now);
}

function bookingCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return "MW-" + Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export async function createBooking(input: BookingInput, status: "PENDING" | "CONFIRMED" = "PENDING") {
  const { serviceIds, notificationConsent, ...fields } = input;
  delete fields.website;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const category = await tx.ccCategory.findUnique({ where: { id: fields.ccCategoryId }, select: { id: true } });
        const services = await tx.service.count({ where: { id: { in: serviceIds }, isActive: true, archivedAt: null } });
        if (!category || services !== serviceIds.length) throw new BookingError("CC grubu veya hizmet seçimi değişti. Sayfayı yenileyin.");
        const duplicate = await tx.booking.findFirst({
          where: { date: fields.date, timeSlot: fields.timeSlot, phone: fields.phone, status: { not: "CANCELLED" } },
          select: { id: true },
        });
        if (duplicate) throw new BookingError("Bu telefonla aynı saatte zaten bir randevu var.");
        const slots = await slotsOn(fields.date, tx);
        if (!slots.includes(fields.timeSlot)) throw new BookingError("Bu saat artık müsait değil. Başka bir saat seçin.");
        return tx.booking.create({
          data: {
            ...fields,
            email: fields.email || null,
            plate: fields.plate || null,
            note: fields.note || null,
            status,
            notificationConsentAt: notificationConsent ? new Date() : null,
            code: bookingCode(),
            services: { create: serviceIds.map((serviceId) => ({ serviceId })) },
            notifications: { create: notificationEntries("BOOKING_CREATED", "OWNER_NEW_BOOKING") },
          },
          select: { code: true },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError
        && ["P1008", "P2002", "P2024", "P2028", "P2034"].includes(error.code);
      if (!retryable) throw error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 30 * (attempt + 1) + randomInt(30)));
    }
  }
  throw new BookingError("Bu saat şu anda kaydedilemedi. Müsait saatleri kontrol edip tekrar deneyin.");
}

export function findBooking({ code, phone }: LookupInput) {
  return db.booking.findUnique({
    where: { code, phone },
    select: {
      code: true, status: true, date: true, timeSlot: true, bikeBrand: true, bikeModel: true,
      services: { select: { service: { select: { name: true } } } },
    },
  });
}

export async function cancelBooking({ code, phone }: LookupInput) {
  try {
    await db.booking.update({
      where: { code, phone, status: { in: ["PENDING", "CONFIRMED"] } },
      data: {
        status: "CANCELLED",
        closedAt: new Date(),
        notifications: { create: notificationEntries("BOOKING_CANCELLED", "OWNER_CUSTOMER_CANCELLED") },
      },
      select: { id: true },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return false;
    throw error;
  }
}
