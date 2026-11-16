import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, availableSlots, inBookingWindow, shopClock } from "../lib/time";

const weekday = { opens: "08:30", closes: "12:00", isClosed: false, slotMinutes: 60, maxPerSlot: 2 };
const now = new Date("2026-11-16T06:30:10Z");

test("İstanbul tarihi ve saati UTC gün sınırında doğru hesaplanır", () => {
  assert.deepEqual(shopClock(new Date("2026-11-16T21:00:00Z")), { date: "2026-11-17", time: "00:00" });
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(inBookingWindow("2026-02-30", now), false);
  assert.equal(inBookingWindow(addDays("2026-11-16", 60), now), true);
  assert.equal(inBookingWindow(addDays("2026-11-16", 61), now), false);
});

test("Geçmiş, dolu ve kapanıştan sonra bitecek slotlar çıkarılır", () => {
  const occupied = [{ timeSlot: "10:30", count: 2 }];
  assert.deepEqual(availableSlots("2026-11-16", weekday, false, occupied, now), []);
  assert.deepEqual(availableSlots("2026-11-17", weekday, false, occupied, now), ["08:30", "09:30"]);
});

test("Tatil ve kapalı günlerde saat dönmez, slot ayarları uygulanır", () => {
  assert.deepEqual(availableSlots("2026-11-17", weekday, true, [], now), []);
  assert.deepEqual(availableSlots("2026-11-17", { ...weekday, isClosed: true }, false, [], now), []);
  assert.deepEqual(availableSlots("2026-11-17", { ...weekday, closes: "09:30", slotMinutes: 30, maxPerSlot: 1 },
    false, [{ timeSlot: "08:30", count: 1 }], now), ["09:00"]);
});
