import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeMobile, whatsappLink } from "../lib/notifications/phone";
import { DeliveryError, NetgsmSmsProvider } from "../lib/notifications/providers";
import { appointmentTime, dueReminder } from "../lib/notifications/reminder-time";
import { singleSms, smsWithLink } from "../lib/notifications/sms-text";
import { adminEntry, bookingReturnPath } from "../lib/admin-links";
import { fillTemplate, validPlaceholders } from "../lib/notifications/templates";
import { notificationEntries } from "../lib/notifications/entries";

test("Yeni randevu işletme sahibi ve müşteri için yalnızca e-posta kuyruğuna alınır", () => {
  assert.deepEqual(notificationEntries("BOOKING_CREATED", "OWNER_NEW_BOOKING"), [
    { event: "BOOKING_CREATED", channel: "EMAIL" },
    { event: "OWNER_NEW_BOOKING", channel: "EMAIL" },
  ]);
});

test("Şablon değişkenleri her tekrarında değiştirilir ve bilinmeyen değişken reddedilir", () => {
  assert.equal(fillTemplate("Merhaba {isim}, {kod} saat {saat} ({kod})", {
    isim: "Çağla", kod: "MW-12345", saat: "08:30",
  }), "Merhaba Çağla, MW-12345 saat 08:30 (MW-12345)");
  assert.equal(validPlaceholders("{isim} {tarih} {saat}"), true);
  assert.equal(validPlaceholders("{müşteri_telefonu}"), false);
  assert.equal(validPlaceholders("{constructor}"), false);
  assert.equal(fillTemplate("{isim}", { isim: "{kod}", kod: "MW-12345" }), "{kod}");
});

test("Türkiye mobil numarası ve WhatsApp metni güvenli biçimde hazırlanır", () => {
  for (const number of ["0543 291 16 01", "+90 (543) 291-16-01", "00905432911601", "5432911601", "905432911601"]) {
    assert.equal(normalizeMobile(number), "905432911601");
  }
  for (const number of ["0224 123 45 67", "+44 5432911601", "abc05432911601", "054329116010"]) {
    assert.equal(normalizeMobile(number), null);
  }
  const link = new URL(whatsappLink("0543 291 16 01", "Türkçe & kod = 1")!);
  assert.equal(link.origin + link.pathname, "https://wa.me/905432911601");
  assert.equal(link.searchParams.get("text"), "Türkçe & kod = 1");
});

test("SMS metni tek GSM-7 mesaja sığar", () => {
  assert.equal(singleSms("Çağrı — şimdilik, öğleden sonra"), "Cagri - simdilik, ogleden sonra");
  assert.equal(singleSms("A".repeat(160)).length, 160);
  assert.equal(singleSms("A".repeat(161)), "A".repeat(157) + "...");
  assert.equal(singleSms("A".repeat(158) + "^^"), "A".repeat(157) + "...");
});

test("Dükkan SMS’inde metin kısaltılsa bile rezervasyon bağlantısı korunur", () => {
  const link = "https://motoworld.example/admin/rezervasyonlar/MW-12345";
  const message = smsWithLink("Yeni randevu " + "A".repeat(250), link);
  assert.ok(message.endsWith(`\n${link}`));
  assert.ok(message.length <= 160);
  const longLink = link + "a".repeat(180);
  assert.equal(smsWithLink("Yeni randevu", longLink), `Yeni randevu\n${longLink}`);
});

test("Giriş sonrası dönüş yalnızca yerel rezervasyon detayına izin verir", () => {
  const path = "/admin/rezervasyonlar/MW-12345";
  assert.equal(bookingReturnPath(path), path);
  assert.equal(new URL(adminEntry("/admin/giris", path), "https://motoworld.example").searchParams.get("next"), path);
  for (const invalid of ["//external.example", "https://external.example", "/admin/hesap", path + "?action=confirm"]) {
    assert.equal(adminEntry("/admin/giris", invalid), "/admin/giris");
  }
});

test("24 saat ve 2 saat pencereleri İstanbul saatine göre hesaplanır", () => {
  const starts = appointmentTime("2026-11-20", "01:30");
  const schedule = { early: 1440, late: 120 };
  const minute = 60_000;
  assert.equal(new Date(starts).toISOString(), "2026-11-19T22:30:00.000Z");
  assert.equal(dueReminder(starts, starts - 1440 * minute - 1, schedule), null);
  assert.equal(dueReminder(starts, starts - 1440 * minute, schedule), "REMINDER_EARLY");
  assert.equal(dueReminder(starts, starts - 1435 * minute, schedule), "REMINDER_EARLY");
  assert.equal(dueReminder(starts, starts - 1425 * minute, schedule), null);
  assert.equal(dueReminder(starts, starts - 120 * minute, schedule), "REMINDER_LATE");
  assert.equal(dueReminder(starts, starts - 110 * minute, schedule), "REMINDER_LATE");
  assert.equal(dueReminder(starts, starts, schedule), null);
  assert.equal(dueReminder(starts, starts - 8 * minute, { early: 10, late: 8 }), "REMINDER_LATE");
});

test("Netgsm adaptörü REST v2 gövdesini hazırlar ve açık sağlayıcı reddini işaretler", async () => {
  const config = { user: "test", password: "secret-example", header: "TEST" };
  const sent = new NetgsmSmsProvider(config, async (input, init) => {
    assert.equal(input, "https://api.netgsm.com.tr/sms/rest/v2/send");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      msgheader: "TEST", messages: [{ msg: "Deneme", no: "5432911601" }], encoding: "UTF-8",
    });
    return Response.json({ code: "00", jobid: "12345" });
  });
  const sample = { to: "905432911601", text: "Deneme" };
  assert.deepEqual(await sent.send(sample), { status: "SENT" });
  const failed = new NetgsmSmsProvider(config, async () => Response.json({ code: "100", description: "Gizli sağlayıcı içeriği" }));
  await assert.rejects(failed.send(sample), (error) =>
    error instanceof DeliveryError && error.retryable && !error.message.includes("Gizli"));
  const unknown = new NetgsmSmsProvider(config, async () => { throw new Error("timeout"); });
  await assert.rejects(unknown.send(sample), (error) => error instanceof DeliveryError && !error.retryable);
});
