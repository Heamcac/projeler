import assert from "node:assert/strict";
import { test } from "node:test";
import { addBookingNote, archiveService, changeBookingStatus, dashboard, saveHours, savePrices, saveService, saveSiteSettings, searchableBookings } from "../lib/admin";
import { bookableDates, BookingError, cancelBooking, createBooking, findBooking, slotsOn } from "../lib/bookings";
import { getCatalog, getSettings } from "../lib/catalog";
import { db } from "../lib/db";
import { DeliveryError, type NotificationProviders } from "../lib/notifications/providers";
import { enqueueReminders, processDeliveryQueue } from "../lib/notifications/queue";
import { appointmentTime } from "../lib/notifications/reminder-time";
import { anonymizeBookings } from "../lib/retention";
import { reserveLoginAttempt } from "../lib/login-throttle";
import { incrementWindow } from "../lib/rate-limit";
import { addDays, shopClock } from "../lib/time";

test("PostgreSQL rezervasyon ve yönetim akışları", async (t) => {
  assert.match(new URL(process.env.DATABASE_URL ?? "file:/").pathname, /^\/motoworld_test_[a-f0-9]{32}$/);
  try {
    const date = addDays(shopClock().date, 1);
    await db.ccCategory.create({ data: { id: "125-250", label: "125-250 cc", sort: 0 } });
    await db.service.create({ data: { id: "yag", name: "Yağ değişimi", durationMinutes: 30 } });
    await db.workingHours.create({
      data: { weekday: new Date(date).getUTCDay(), opens: "08:30", closes: "09:30", slotMinutes: 60, maxPerSlot: 2 },
    });
    const request = {
      date, timeSlot: "08:30", ccCategoryId: "125-250", serviceIds: ["yag"],
      customerName: "Örnek Sürücü", bikeBrand: "Honda", bikeModel: "CBF", bikeYear: 2021, phone: "05431234567",
    };
    await t.test("Eşzamanlı kayıt kapasiteyi aşmaz, çift kayıt önlenir ve iptal yeri açar", async () => {
      assert.deepEqual(await slotsOn(date), ["08:30"]);
      assert.ok((await bookableDates()).includes(date));
      await db.holiday.create({ data: { date, label: "Tatil" } });
      assert.deepEqual(await slotsOn(date), []);
      assert.ok(!(await bookableDates()).includes(date));
      await db.holiday.delete({ where: { date } });
      const first = await createBooking(request);
      await assert.rejects(createBooking(request), { message: /aynı saatte/ });
      const attempts = await Promise.allSettled(["05431234568", "05431234569", "05431234570"].map((phone) =>
        createBooking({ ...request, phone }),
      ));
      assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1);
      for (const attempt of attempts) if (attempt.status === "rejected") assert.ok(attempt.reason instanceof BookingError);
      assert.equal(await db.booking.count(), 2);
      assert.deepEqual(await slotsOn(date), []);
      assert.equal(await findBooking({ code: first.code, phone: "05430000000" }), null);
      assert.equal(await cancelBooking({ code: first.code, phone: request.phone }), true);
      assert.equal(await cancelBooking({ code: first.code, phone: request.phone }), false);
      assert.equal((await findBooking({ code: first.code, phone: request.phone }))?.status, "CANCELLED");
      assert.deepEqual(await slotsOn(date), ["08:30"]);
    });

    await t.test("Panel filtreleri, durum geçişleri, özel notlar ve manuel randevu birlikte çalışır", async () => {
      const initial = await db.booking.findFirstOrThrow({ where: { status: "PENDING" } });
      assert.equal((await dashboard(date)).pendingCount, 1);
      assert.equal((await searchableBookings({ from: date, to: date, category: "125-250", status: "PENDING", search: "ornek surucu", page: 1 })).total, 1);
      assert.equal((await searchableBookings({ search: `+90 ${initial.phone.slice(1)}`, status: "PENDING", page: 1 })).total, 1);
      await assert.rejects(changeBookingStatus(initial.code, "PENDING", "COMPLETED"));
      await changeBookingStatus(initial.code, "PENDING", "CONFIRMED");
      await assert.rejects(changeBookingStatus(initial.code, "PENDING", "CANCELLED"));
      await addBookingNote(initial.code, "Parça siparişi alındı");
      assert.equal(await db.bookingNote.count({ where: { bookingId: initial.id } }), 1);
      assert.ok(!Object.hasOwn(await findBooking({ code: initial.code, phone: initial.phone }) ?? {}, "adminNotes"));
      await changeBookingStatus(initial.code, "CONFIRMED", "COMPLETED");
      const manual = await createBooking(request, "CONFIRMED");
      assert.equal((await findBooking({ code: manual.code, phone: request.phone }))?.status, "CONFIRMED");
      await assert.rejects(createBooking({ ...request, phone: "05437777777" }, "CONFIRMED"));
      assert.equal((await dashboard(date)).todayBookings.length, 3);
    });

    await t.test("Fiyat işlemi topluca kaydedilir ve arşivlenen hizmet eski kayıtlarda görünür", async () => {
      const key = { serviceId: "yag", ccCategoryId: "125-250" };
      await savePrices([{ ...key, minPrice: 100, maxPrice: 300, isActive: true }]);
      assert.equal((await getCatalog()).categories[0].prices[0].minPrice, 100);
      await assert.rejects(savePrices([
        { ...key, minPrice: 200, maxPrice: 400, isActive: true },
        { ...key, ccCategoryId: "eksik", minPrice: 200, maxPrice: 400, isActive: true },
      ]));
      assert.equal((await getCatalog()).categories[0].prices[0].minPrice, 100);
      await savePrices([{ ...key, minPrice: 100, maxPrice: 300, isActive: false }]);
      assert.equal((await getCatalog()).categories[0].prices.length, 0);
      await saveService("yag", { name: "Yağ ve filtre", durationMinutes: 45, isActive: true });
      assert.equal((await getCatalog()).services[0].durationMinutes, 45);
      await archiveService("yag");
      assert.equal((await getCatalog()).services.length, 0);
      assert.ok(await db.bookingService.count({ where: { serviceId: "yag" } }) > 0);
    });

    await t.test("Saat ve site ayarı değişiklikleri müşteri sorgularına yansır", async () => {
      const weekday = new Date(date).getUTCDay();
      await saveHours([{ weekday, opens: "09:00", closes: "10:00", slotMinutes: 30, maxPerSlot: 1 }]);
      assert.deepEqual(await slotsOn(date), ["09:00", "09:30"]);
      await saveSiteSettings({ shopName: "MOTOWORLD", slogan: "Yeni slogan" });
      assert.equal((await getSettings()).slogan, "Yeni slogan");
    });

    await t.test("Sağlayıcı hatası randevuyu engellemez ve en fazla üç kez yeniden denenir", async () => {
      const service = await db.service.create({ data: { name: "Deneme bakımı", durationMinutes: 30 } });
      const created = await createBooking({ ...request, email: "musteri@example.test", serviceIds: [service.id], timeSlot: "09:00" });
      const stored = await db.booking.findUniqueOrThrow({ where: { code: created.code } });
      assert.equal(stored.status, "PENDING");
      const logs = await db.notificationLog.findMany({ where: { bookingId: stored.id } });
      assert.equal(logs.length, 2);
      assert.ok(logs.every((entry) => entry.channel === "EMAIL"));
      assert.ok(logs.every((entry) => entry.status === "QUEUED"));
      let attempts = 0;
      const providers: NotificationProviders = {
        sms: { async send() { throw new Error("SMS kapalı"); } },
        email: { async send({ to }) {
          assert.equal(to, "musteri@example.test");
          attempts++;
          throw new DeliveryError("Geçici sağlayıcı hatası.", true);
        } },
      };
      const now = Date.now();
      for (const minutes of [0, 1, 6, 21, 60]) {
        await processDeliveryQueue({ bookingCode: stored.code, providers, now: new Date(now + minutes * 60_000) });
      }
      assert.equal(attempts, 4);
      const failed = await db.notificationLog.findFirstOrThrow({ where: { bookingId: stored.id, event: "BOOKING_CREATED", channel: "EMAIL" } });
      assert.equal(failed.status, "FAILED");
      assert.equal(failed.nextAttemptAt, null);
      assert.equal((await db.booking.findUniqueOrThrow({ where: { id: stored.id } })).status, "PENDING");
    });

    await t.test("Dükkan onay bağlantısını e-postayla alır ve eski SMS kuyruğu atlanır", async () => {
      const service = await db.service.create({ data: { name: "Dükkan bildirim testi", durationMinutes: 30 } });
      const created = await createBooking({ ...request, serviceIds: [service.id], timeSlot: "09:30" });
      const approvalLink = new URL(`/admin/rezervasyonlar/${created.code}`, process.env.SITE_URL).href;
      const stored = await db.booking.findUniqueOrThrow({ where: { code: created.code } });
      const oldSms = await db.notificationLog.create({ data: { bookingId: stored.id, event: "OWNER_NEW_BOOKING", channel: "SMS" } });
      let smsCount = 0;
      const actualMail = new Map<string, string>();
      await saveSiteSettings({ notifications: JSON.stringify({ rules: {
        OWNER_NEW_BOOKING: { emailEnabled: false, smsEnabled: true, subject: "Yönetim {kod}", email: "Yeni kayıt {kod}", sms: "Eski şablon" },
      } }) });
      process.env.NOTIFICATION_OWNER_EMAIL = "dukkan@example.test";
      process.env.NOTIFICATION_OWNER_PHONE = "+90 (555) 000 77 77";
      try {
        await processDeliveryQueue({ bookingCode: created.code, providers: {
          sms: { async send() { smsCount++; return { status: "SENT" }; } },
          email: { async send({ to, text }) { actualMail.set(to, text); return { status: "SENT" }; } },
        } });
      } finally {
        delete process.env.NOTIFICATION_OWNER_EMAIL;
        delete process.env.NOTIFICATION_OWNER_PHONE;
        await db.setting.delete({ where: { key: "notifications" } });
      }
      assert.equal(smsCount, 0);
      assert.equal((await db.notificationLog.findUniqueOrThrow({ where: { id: oldSms.id } })).status, "SKIPPED");
      assert.deepEqual([...actualMail], [["dukkan@example.test", `Yeni kayıt ${created.code}\n\n${approvalLink}`]]);
      assert.equal((await db.booking.findUniqueOrThrow({ where: { code: created.code } })).status, "PENDING");
    });

    await t.test("Onaylı ve izinli randevunun hatırlatmaları eşzamanlı cron çağrılarında bir kez gönderilir", async () => {
      const reminderDate = addDays(date, 9);
      const data = {
        customerName: request.customerName, phone: request.phone, email: "deneme@example.test",
        bikeBrand: request.bikeBrand, bikeModel: request.bikeModel, bikeYear: request.bikeYear,
        ccCategoryId: request.ccCategoryId, date: reminderDate, timeSlot: "09:00",
      };
      const consented = await db.booking.create({
        data: { ...data, code: "MW-RMD01", status: "CONFIRMED", notificationConsentAt: new Date() },
      });
      const unconsented = await db.booking.create({ data: { ...data, phone: "05431230002", code: "MW-RMD02", status: "CONFIRMED" } });
      const cancelled = await db.booking.create({
        data: { ...data, code: "MW-RMD03", status: "CANCELLED", notificationConsentAt: new Date() },
      });
      let sms = 0;
      let email = 0;
      const providers: NotificationProviders = {
        sms: { async send() { sms++; return { status: "SENT" }; } },
        email: { async send() { email++; return { status: "SENT" }; } },
      };
      const starts = appointmentTime(reminderDate, "09:00");
      for (const minutes of [1440, 120]) {
        const now = new Date(starts - minutes * 60_000);
        const enqueued = await Promise.all([enqueueReminders(now), enqueueReminders(now)]);
        assert.equal(enqueued[0] + enqueued[1], 2);
        const options = { now, providers, bookingCode: consented.code };
        const processed = await Promise.all([processDeliveryQueue(options), processDeliveryQueue(options)]);
        assert.equal(processed[0] + processed[1], 1);
        await processDeliveryQueue({ ...options, bookingCode: unconsented.code });
        assert.equal(await enqueueReminders(now), 0);
      }
      assert.equal(sms, 0);
      assert.equal(email, 2);
      assert.equal(await db.notificationLog.count({ where: { bookingId: consented.id, status: "SENT" } }), 2);
      assert.equal(await db.notificationLog.count({ where: { bookingId: unconsented.id, status: "SKIPPED" } }), 2);
      assert.equal(await db.notificationLog.count({ where: { bookingId: cancelled.id } }), 0);
    });

    await t.test("PostgreSQL sayaçları eşzamanlı artar ve beş başarısız giriş geçici kilit oluşturur", async () => {
      const now = new Date();
      const expiry = new Date(now.valueOf() + 60_000);
      const values = await Promise.all(Array.from({ length: 12 }, () => incrementWindow("race-test", expiry)));
      assert.deepEqual(values.sort((a, b) => a - b), Array.from({ length: 12 }, (_, index) => index + 1));
      const email = "locked@example.test";
      const reservations = await Promise.all(Array.from({ length: 12 }, () => reserveLoginAttempt(email, now)));
      assert.equal(reservations.filter(Boolean).length, 5);
      assert.equal(await reserveLoginAttempt(email, now), false);
      assert.equal(await reserveLoginAttempt(email, new Date(now.valueOf() + 16 * 60_000)), true);
    });

    await t.test("Müşteri, yönetici ve bildirim tablolarında satır düzeyi koruma etkindir", async () => {
      const rows = await db.$queryRaw<{ name: string; protected: boolean }[]>`
        SELECT relname AS name, relrowsecurity AS protected FROM pg_class
        WHERE relnamespace = current_schema()::regnamespace AND relname IN ('Booking', 'AdminUser', 'NotificationLog')
      `;
      assert.equal(rows.length, 3);
      assert.ok(rows.every(({ protected: enabled }) => enabled));
    });

    await t.test("Temizlik kişisel alanları ve notları silip iş istatistiklerini korur", async () => {
      const old = addDays(date, -400);
      const booking = await db.booking.create({ data: {
        code: "MW-PRV01", customerName: "Özel kişi", phone: "05431234343", email: "private@example.test",
        bikeBrand: "Honda", bikeModel: "CBF", bikeYear: 2021, plate: "16 TEST 1", note: "Özel not",
        ccCategoryId: request.ccCategoryId, date: old, timeSlot: "09:00", status: "COMPLETED",
        createdAt: new Date(old), closedAt: new Date(old), notificationConsentAt: new Date(old),
        adminNotes: { create: { text: "Özel yönetim notu" } },
        notifications: { create: { event: "BOOKING_COMPLETED", channel: "EMAIL", errorMessage: "Eski hata ayrıntısı" } },
      } });
      assert.equal(await anonymizeBookings(), 1);
      assert.equal(await anonymizeBookings(), 0);
      assert.equal(await findBooking({ code: booking.code, phone: booking.phone }), null);
      const next = await db.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { adminNotes: true, notifications: true } });
      assert.match(next.code, /^AN-/);
      assert.deepEqual([next.customerName, next.phone, next.email, next.plate, next.note, next.notificationConsentAt], ["Anonim randevu", "", null, null, null, null]);
      assert.equal(next.status, "COMPLETED");
      assert.equal(next.ccCategoryId, booking.ccCategoryId);
      assert.equal(next.adminNotes.length, 0);
      assert.equal(next.notifications[0].status, "SKIPPED");
      assert.equal(next.notifications[0].errorMessage, null);
    });
  } finally {
    await db.$disconnect();
  }
});
