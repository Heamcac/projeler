"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { BookingError, cancelBooking, createBooking, findBooking } from "@/lib/bookings";
import { deliverAfterResponse } from "@/lib/notifications/background";
import { rateAllowed } from "@/lib/rate-limit";
import { inBookingWindow } from "@/lib/time";
import { clearLoginFailures, reserveLoginAttempt } from "@/lib/login-throttle";
import { originError, validActionOrigin } from "@/lib/security";
import { bookingReturnPath } from "@/lib/admin-links";
import { bookingSchema, loginSchema, lookupSchema } from "@/lib/validation";

const tooMany = "Çok fazla istek gönderdiniz. Birkaç dakika sonra tekrar deneyin.";

export async function submitBooking(payload: unknown) {
  if (!await validActionOrigin()) return { error: originError };
  if (!await rateAllowed("create", 12, 10 * 60_000)) return { error: tooMany };
  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!inBookingWindow(parsed.data.date)) return { error: "Randevu aralığında bir tarih seçin." };
  try {
    const result = await createBooking(parsed.data);
    deliverAfterResponse(result.code);
    return result;
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    throw error;
  }
}

export async function manageBooking(payload: unknown, cancel = false) {
  if (!await validActionOrigin()) return { error: originError };
  if (!await rateAllowed("lookup", 20, 10 * 60_000)) return { error: tooMany };
  const parsed = lookupSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (cancel) {
    if (!await cancelBooking(parsed.data)) return { error: "Randevu iptal edilemedi. Durumu yeniden sorgulayın." };
    deliverAfterResponse(parsed.data.code);
  }
  const booking = await findBooking(parsed.data);
  return booking ? { booking } : { error: "Kod ve telefonla eşleşen randevu bulunamadı." };
}

export async function login(_previous: { error: string }, form: FormData) {
  if (!await validActionOrigin()) return { error: originError };
  if (!await rateAllowed("login", 20, 15 * 60_000)) return { error: tooMany };
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;
  const failure = "Giriş yapılamadı. Bilgilerinizi kontrol edin veya 15 dakika sonra tekrar deneyin.";
  if (!await reserveLoginAttempt(email) || !await signIn(email, password)) return { error: failure };
  await clearLoginFailures(email);
  redirect(bookingReturnPath(form.get("returnTo")) ?? "/admin");
}

