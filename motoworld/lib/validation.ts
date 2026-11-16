import { z } from "zod";
import { isDate, shopClock } from "./time";

z.config({ ...z.locales.tr(), jitless: true });

export const dateSchema = z.string().refine(isDate, "Geçerli bir tarih seçin.");
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçerli bir saat seçin.");
const required = (label: string, limit: number) =>
  z.string().trim().min(1, `${label} alanını doldurun.`).max(limit, `${label} en fazla ${limit} karakter olabilir.`);

export const phoneSchema = z.string().trim()
  .refine((value) => /^\+?[\d ()-]+$/.test(value) && value.length <= 24, "Telefonu 05XX XXX XX XX biçiminde girin.")
  .transform((value) => value.replace(/\D/g, "").replace(/^905/, "05"))
  .refine((value) => /^05\d{9}$/.test(value), "Telefonu 05XX XXX XX XX biçiminde girin.");

const optional = (limit: number) => z.string().trim().max(limit, `En fazla ${limit} karakter girin.`).optional();
const email = z.email("Geçerli bir e-posta girin.").max(254, "E-posta en fazla 254 karakter olabilir.");

export const vehicleSchema = z.object({
  bikeBrand: required("Marka", 60),
  bikeModel: required("Model", 60),
  bikeYear: z.coerce.number().int().min(1900, "Geçerli bir model yılı girin.")
    .refine((year) => year <= Number(shopClock().date.slice(0, 4)) + 1, "Geçerli bir model yılı girin."),
  ccCategoryId: required("CC grubu", 100),
  plate: optional(16),
});

export const serviceSchema = z.object({
  serviceIds: z.array(z.string().min(1).max(100)).min(1, "En az bir hizmet seçin.")
    .max(30, "En fazla 30 hizmet seçin.")
    .refine((ids) => new Set(ids).size === ids.length, "Her hizmeti bir kez seçin."),
});

export const slotSchema = z.object({ date: dateSchema, timeSlot: timeSchema });
export const contactSchema = z.object({
  customerName: required("Ad soyad", 100),
  phone: phoneSchema,
  email: z.string().trim().pipe(z.union([email, z.literal("")])).optional(),
  note: optional(1000),
});

export const bookingSchema = vehicleSchema.merge(serviceSchema).merge(slotSchema).merge(contactSchema)
  .extend({
    website: z.literal("", "Form doğrulanamadı.").optional(),
    notificationConsent: z.boolean().optional(),
  });

export const lookupSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^MW-[A-Z0-9]{5}$/, "Rezervasyon kodunu MW-8K3F2 biçiminde girin."),
  phone: phoneSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(email),
  password: z.string().min(1, "Şifrenizi girin.")
    .refine((value) => new TextEncoder().encode(value).length <= 72, "Şifre en fazla 72 bayt olabilir."),
});
