import { z } from "zod";
import { bookingSchema, dateSchema, timeSchema } from "./validation";
import { safeMapEmbed } from "./catalog";

const id = z.string().min(1).max(100).regex(/^[\w+-]+$/, "Geçersiz kayıt.");
const code = z.string().regex(/^MW-[A-Z0-9]{5}$/, "Geçersiz randevu kodu.");
const status = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);
const checked = z.preprocess((value) => value === "on", z.boolean());
const note = z.string().trim().min(1, "Bir not yazın.").max(1000);
const text = (max: number) => z.string().trim().min(1, "Zorunlu alanı doldurun.").max(max);
const money = z.string().trim().regex(/^\d{1,8}$/, "Fiyatı tam TL olarak girin.").transform(Number);
const password = z.string().min(1).refine((value) => new TextEncoder().encode(value).length <= 72, "Şifre en fazla 72 bayt olabilir.");
const strongPassword = password.refine((value) =>
  value.length >= 12 && /\p{L}/u.test(value) && /[^\p{L}]/u.test(value)
  && !/^(?:admin|password|şifre|sifre|motoworld|qwerty)[\d!@#._-]*$/iu.test(value),
"Yeni şifre en az 12 karakter olmalı. Harflerin yanında sayı, simge veya boşluk kullanın.");
const webUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Bağlantılara http:// veya https:// ile başlayan bir adres girin.");

export const bookingStatusInput = z.object({ code, current: status, next: status });
export const bookingCodeInput = z.object({ code });
export const bookingNoteInput = z.object({ code, text: note });
export const serviceInput = z.object({
  id: id.optional(), name: text(120), durationMinutes: z.coerce.number().int().min(1).max(1440), isActive: checked,
});
export const serviceDeleteInput = z.object({ id });
export const holidayInput = z.object({ date: dateSchema, label: text(120) });
export const holidayDeleteInput = z.object({ date: dateSchema });
export const settingsInput = z.object({
  shopName: text(100),
  slogan: text(180),
  about: text(4000),
  address: text(300),
  phone: z.string().trim().max(30).refine((value) =>
    /^\+?[\d ()-]+$/.test(value) && /^(?:0\d{10}|90\d{10})$/.test(value.replace(/\D/g, "")), "Geçerli bir Türkiye telefon numarası girin."),
  whatsappUrl: webUrl, mapUrl: webUrl,
  mapEmbedUrl: webUrl.refine((value) => !value || Boolean(safeMapEmbed(value)), "Google Maps yerleştirme bağlantısını girin."),
  instagramUrl: webUrl, facebookUrl: webUrl,
});
export const passwordInput = z.object({
  current: password, next: strongPassword,
  repeat: password,
}).refine(({ next, repeat }) => next === repeat, "Yeni şifreler eşleşmiyor.")
  .refine(({ current, next }) => current !== next, "Yeni şifre mevcut şifreden farklı olmalı.");

const priceRow = z.object({
  serviceId: id, ccCategoryId: id, minPrice: money, maxPrice: money, isActive: checked,
}).refine(({ minPrice, maxPrice }) => minPrice <= maxPrice, "En düşük fiyat en yüksek fiyattan büyük olamaz.");
const priceRows = z.array(priceRow).min(1, "Kaydedilecek bir fiyat değişikliği yok.").max(500);

export function priceInput(form: FormData) {
  const keys = new Set(Array.from(form.keys()).filter((key) => key.startsWith("price.")).map((key) => key.split(".").slice(0, 3).join(".")));
  return priceRows.parse(Array.from(keys, (key) => {
    const [, serviceId, ccCategoryId] = key.split(".");
    return {
      serviceId, ccCategoryId, minPrice: form.get(`${key}.minPrice`), maxPrice: form.get(`${key}.maxPrice`),
      isActive: form.get(`${key}.isActive`),
    };
  }));
}

const timeMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const dayHours = z.object({
  weekday: z.number().int().min(0).max(6),
  opens: timeSchema,
  closes: timeSchema,
  isClosed: checked,
  slotMinutes: z.coerce.number().int().min(5).max(720),
  maxPerSlot: z.coerce.number().int().min(1).max(100),
}).refine(({ isClosed, opens, closes, slotMinutes }) =>
  isClosed || timeMinutes(closes) - timeMinutes(opens) >= slotMinutes,
"Açık günlerde kapanış saati en az bir randevu aralığına izin vermeli.");

export function hoursInput(form: FormData) {
  return Array.from({ length: 7 }, (_, weekday) => {
    const field = (name: string) => form.get(`day.${weekday}.${name}`);
    return dayHours.parse({
      weekday, opens: field("opens"), closes: field("closes"), isClosed: field("isClosed"),
      slotMinutes: field("slotMinutes"), maxPerSlot: field("maxPerSlot"),
    });
  });
}

export function manualBookingInput(form: FormData) {
  return bookingSchema.parse({
    ...Object.fromEntries(form),
    serviceIds: form.getAll("serviceIds"),
    notificationConsent: form.get("notificationConsent") === "on",
  });
}
