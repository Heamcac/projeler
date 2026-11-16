import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { changePassword, getAdmin, signOut } from "@/lib/auth";
import { BookingError, createBooking } from "@/lib/bookings";
import { db } from "@/lib/db";
import {
  addBookingNote, AdminError, archiveService, changeBookingStatus, saveHours, savePrices, saveService, saveSiteSettings,
} from "@/lib/admin";
import {
  bookingCodeInput, bookingNoteInput, bookingStatusInput, holidayDeleteInput, holidayInput, hoursInput, manualBookingInput,
  passwordInput, priceInput, serviceDeleteInput, serviceInput, settingsInput,
} from "@/lib/admin-input";
import { rateAllowed } from "@/lib/rate-limit";
import { deliverAfterResponse } from "@/lib/notifications/background";
import { sendTestEmail } from "@/lib/notifications/queue";
import { DeliveryError } from "@/lib/notifications/providers";
import { updateNotificationSettings } from "@/lib/notifications/settings";
import { originError, readAdminForm, validOrigin } from "@/lib/security";
import { retentionDefaults, retentionKey } from "@/lib/retention";
import { invalidatePublicData } from "@/lib/public-data";
import { adminEntry } from "@/lib/admin-links";

export const maxDuration = 60;

const reply = (data: { error?: string; message?: string; redirectTo?: string }, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, { params }: RouteContext<"/api/admin/[operation]">) {
  const admin = await getAdmin();
  if (!admin) return reply({ error: "Oturumunuz sona erdi. Tekrar giriş yapın." }, 401);
  if (!validOrigin(request.headers.get("origin"), request.url)) return reply({ error: originError }, 403);
  const { operation } = await params;
  if (admin.passwordChangeRequired && !["password", "logout"].includes(operation)) {
    return reply({ error: "Önce yönetici şifrenizi değiştirin." }, 403);
  }
  const result = await readAdminForm(request);
  if (!result.form) return reply({ error: result.error }, result.status);
  const body = result.form;
  const fields = Object.fromEntries(body);

  try {
    switch (operation) {
      case "create-booking": {
        const { code } = await createBooking(manualBookingInput(body), "CONFIRMED");
        deliverAfterResponse(code);
        return reply({ message: "Randevu oluşturuldu.", redirectTo: `/admin/rezervasyonlar/${code}` });
      }
      case "booking-status": {
        const { code, current, next } = bookingStatusInput.parse(fields);
        await changeBookingStatus(code, current, next);
        deliverAfterResponse(code);
        return reply({ message: next === "CANCELLED" ? "Randevu iptal edildi." : next === "CONFIRMED" ? "Randevu onaylandı." : "Randevu tamamlandı." });
      }
      case "booking-note": {
        const { code, text } = bookingNoteInput.parse(fields);
        await addBookingNote(code, text);
        return reply({ message: "Yönetim notu eklendi." });
      }
      case "prices":
        await savePrices(priceInput(body));
        invalidatePublicData("public-catalog");
        revalidatePath("/");
        revalidatePath("/fiyatlar");
        revalidatePath("/randevu");
        return reply({ message: "Fiyatlar kaydedildi." });
      case "service": {
        const { id, ...values } = serviceInput.parse(fields);
        await saveService(id, values);
        invalidatePublicData("public-catalog");
        revalidatePath("/", "layout");
        return reply({ message: "Hizmet kaydedildi." });
      }
      case "delete-service":
        await archiveService(serviceDeleteInput.parse(fields).id);
        invalidatePublicData("public-catalog");
        revalidatePath("/", "layout");
        return reply({ message: "Hizmet silindi." });
      case "hours":
        await saveHours(hoursInput(body));
        invalidatePublicData("public-hours");
        revalidatePath("/", "layout");
        return reply({ message: "Çalışma saatleri kaydedildi." });
      case "holiday":
        await db.holiday.create({ data: holidayInput.parse(fields) });
        revalidatePath("/randevu");
        return reply({ message: "Tatil günü eklendi." });
      case "delete-holiday":
        await db.holiday.delete({ where: holidayDeleteInput.parse(fields) });
        revalidatePath("/randevu");
        return reply({ message: "Tatil günü silindi." });
      case "settings":
        await saveSiteSettings(settingsInput.parse(fields));
        invalidatePublicData("public-settings");
        revalidatePath("/", "layout");
        return reply({ message: "Site ayarları kaydedildi." });
      case "privacy-settings": {
        const days = z.coerce.number().int().min(retentionDefaults.min).max(retentionDefaults.max).parse(fields.days);
        await saveSiteSettings({ [retentionKey]: String(days) });
        return reply({ message: "Saklama süresi kaydedildi." });
      }
      case "notification-settings":
        await updateNotificationSettings(body);
        return reply({ message: "Bildirim ayarları kaydedildi." });
      case "notification-consent-withdraw":
        await db.booking.update({ where: bookingCodeInput.parse(fields), data: { notificationConsentAt: null } });
        return reply({ message: "İsteğe bağlı bildirim izni kaldırıldı." });
      case "notification-test": {
        if (!await rateAllowed(`notification-test:${admin.id}`, 5, 15 * 60_000)) {
          return reply({ error: "Test gönderim sınırı aşıldı. Birkaç dakika sonra tekrar deneyin." }, 429);
        }
        z.literal("EMAIL").parse(fields.channel);
        const to = z.string().trim().max(254).pipe(z.email("Geçerli bir e-posta girin.")).parse(fields.recipient);
        const result = await sendTestEmail(to);
        return result.status === "SENT" ? reply({ message: "Test mesajı sağlayıcıya iletildi." }) : reply({ message: result.reason });
      }
      case "password": {
        if (!await rateAllowed(`password:${admin.id}`, 8, 15 * 60_000)) return reply({ error: "Çok fazla deneme. Birkaç dakika sonra tekrar deneyin." }, 429);
        const { current, next } = passwordInput.parse(fields);
        if (!await changePassword(admin.id, current, next)) return reply({ error: "Mevcut şifre doğrulanamadı." }, 400);
        return reply({ message: "Şifre değiştirildi. Yeni şifrenizle giriş yapın.", redirectTo: adminEntry("/admin/giris", fields.returnTo) });
      }
      case "logout":
        await signOut();
        return reply({ message: "Çıkış yapıldı.", redirectTo: "/admin/giris" });
      default:
        return reply({ error: "İşlem bulunamadı." }, 404);
    }
  } catch (error) {
    if (error instanceof ZodError) return reply({ error: error.issues[0].message }, 400);
    if (error instanceof DeliveryError) return reply({ error: error.message }, 502);
    if (error instanceof AdminError || error instanceof BookingError) return reply({ error: error.message }, 409);
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2003", "P2025"].includes(error.code)) {
      return reply({ error: error.code === "P2002" ? "Bu kayıt zaten var." : "İlgili kayıt değişmiş veya bulunamadı. Sayfayı yenileyin." }, 409);
    }
    console.error("Admin işlemi başarısız", operation, error instanceof Error ? error.name : "Bilinmeyen hata");
    return reply({ error: "İşlem tamamlanamadı. Tekrar deneyin." }, 500);
  }
}
