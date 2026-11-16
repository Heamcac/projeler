import assert from "node:assert/strict";
import { test } from "node:test";
import { hoursInput, passwordInput, priceInput, settingsInput } from "../lib/admin-input";

test("Fiyat düzeninde boş, ters ve negatif fiyat reddedilir; aktif seçimi okunur", () => {
  const form = new FormData();
  const key = "price.yag.125-250";
  form.set(`${key}.minPrice`, "950");
  form.set(`${key}.maxPrice`, "1300");
  form.set(`${key}.isActive`, "on");
  assert.deepEqual(priceInput(form), [{ serviceId: "yag", ccCategoryId: "125-250", minPrice: 950, maxPrice: 1300, isActive: true }]);
  for (const value of ["", "1500", "-50"]) {
    form.set(`${key}.minPrice`, value);
    assert.throws(() => priceInput(form));
  }
});

test("Açık gün, kapasite ve slot süresi doğrulanır", () => {
  const form = new FormData();
  for (let day = 0; day < 7; day++) {
    for (const [key, value] of Object.entries({ opens: "08:30", closes: "09:30", slotMinutes: "30", maxPerSlot: "2" })) {
      form.set(`day.${day}.${key}`, value);
    }
  }
  assert.equal(hoursInput(form)[1].slotMinutes, 30);
  form.set("day.1.closes", "09:00");
  form.set("day.1.slotMinutes", "60");
  assert.throws(() => hoursInput(form));
  form.set("day.1.isClosed", "on");
  assert.equal(hoursInput(form)[1].isClosed, true);
  form.set("day.2.maxPerSlot", "0");
  assert.throws(() => hoursInput(form));
});

test("Site bağlantıları ve yeni şifre alanları doğrulanır", () => {
  const settings = {
    shopName: "MOTOWORLD", slogan: "Güvenilir bakım", about: "Bakım ve onarım", address: "Bursa",
    phone: "0224 123 45 67", whatsappUrl: "https://wa.me/905432911601", instagramUrl: "",
    mapUrl: "", mapEmbedUrl: "", facebookUrl: "",
  };
  assert.equal(settingsInput.safeParse(settings).success, true);
  assert.equal(settingsInput.safeParse({ ...settings, mapEmbedUrl: "javascript:alert(1)" }).success, false);
  assert.equal(passwordInput.safeParse({ current: "Örnek şifre 1", next: "Örnek şifre 2", repeat: "Örnek şifre 2" }).success, true);
  assert.equal(passwordInput.safeParse({ current: "Örnek şifre 1", next: "Örnek şifre 2", repeat: "Örnek şifre 3" }).success, false);
});
