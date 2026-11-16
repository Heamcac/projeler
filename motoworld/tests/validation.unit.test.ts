import assert from "node:assert/strict";
import { test } from "node:test";
import { bookingSchema, lookupSchema, phoneSchema } from "../lib/validation";

const booking = {
  bikeBrand: "Honda", bikeModel: "CBF", bikeYear: "2021", ccCategoryId: "125-250",
  serviceIds: ["yag"], date: "2026-11-18", timeSlot: "09:30",
  customerName: "Örnek Sürücü", phone: "0543 123 45 67",
};

test("Türk cep telefonu boşluk ve ülke kodundan arındırılır", () => {
  assert.equal(phoneSchema.parse("0543 123 45 67"), "05431234567");
  assert.equal(phoneSchema.parse("+90 (543) 123-45-67"), "05431234567");
  assert.equal(phoneSchema.safeParse("0224 123 45 67").success, false);
  assert.equal(phoneSchema.safeParse("0543 ABC 12 34").success, false);
});

test("Randevu formu zorunlu ve isteğe bağlı alanları doğrular", () => {
  assert.equal(bookingSchema.parse(booking).bikeYear, 2021);
  assert.equal(bookingSchema.safeParse({ ...booking, email: "" }).success, true);
  const invalid = [
    { bikeBrand: " " }, { bikeYear: "2500" }, { serviceIds: [] }, { serviceIds: ["yag", "yag"] },
    { email: "geçersiz" }, { date: "2026-02-30" }, { timeSlot: "24:30" }, { website: "spam" },
  ];
  for (const fields of invalid) assert.equal(bookingSchema.safeParse({ ...booking, ...fields }).success, false);
});

test("Sorgu kodu büyük harfe çevrilir", () => {
  assert.equal(lookupSchema.parse({ code: " mw-ab123 ", phone: booking.phone }).code, "MW-AB123");
});
