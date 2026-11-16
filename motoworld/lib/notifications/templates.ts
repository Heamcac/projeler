import type { NotificationEvent } from "@/generated/prisma/client";
import { formatDate } from "../time";

type Template = { subject: string; email: string; sms?: string };

export const templates = {
  BOOKING_CREATED: {
    subject: "Randevu kaydınız alındı · {kod}",
    email: "{dukkan} randevu kaydınız alındı.\nKod: {kod}\nTarih: {tarih}\nSaat: {saat}\nAdres: {adres}\nTelefon: {telefon}",
    sms: "{kod} kaydedildi: {tarih_kisa} {saat}. Tel: {telefon}. Adres: {adres}",
  },
  OWNER_NEW_BOOKING: {
    subject: "Yeni randevu · {kod}",
    email: "{tarih} saat {saat} için yeni bir randevu var. Kod: {kod}. İncelemek ve onaylamak için aşağıdaki bağlantıyı açın.",
    sms: "Yeni randevu {kod}: {tarih_kisa} {saat}. İncelemek ve onaylamak için:",
  },
  BOOKING_CONFIRMED: {
    subject: "Randevunuz onaylandı · {kod}",
    email: "{kod} numaralı {dukkan} randevunuz {tarih} saat {saat} için onaylandı.\nAdres: {adres}\nTelefon: {telefon}",
    sms: "{kod} randevunuz onaylandı: {tarih_kisa} {saat}. Tel: {telefon}.",
  },
  BOOKING_CANCELLED: {
    subject: "Randevunuz iptal edildi · {kod}",
    email: "{tarih} saat {saat} için {kod} numaralı {dukkan} randevunuz iptal edildi. Sorularınız için: {telefon}.",
    sms: "{kod} randevunuz iptal edildi: {tarih_kisa} {saat}. Tel: {telefon}.",
  },
  BOOKING_COMPLETED: {
    subject: "Randevunuz tamamlandı · {kod}",
    email: "{kod} numaralı {dukkan} randevunuz tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz.",
    sms: "{kod} numaralı randevunuz tamamlandı. Teşekkür ederiz.",
  },
  OWNER_CUSTOMER_CANCELLED: {
    subject: "Müşteri randevuyu iptal etti · {kod}",
    email: "{tarih} saat {saat} için {kod} numaralı randevu müşteri tarafından iptal edildi.",
  },
  REMINDER_EARLY: {
    subject: "Randevu hatırlatması · {kod}",
    email: "{kod} numaralı {dukkan} randevunuzu hatırlatırız.\nTarih: {tarih}\nSaat: {saat}\nAdres: {adres}\nTelefon: {telefon}",
    sms: "Hatırlatma: {kod} randevunuz {tarih_kisa} {saat}. Tel: {telefon}.",
  },
  REMINDER_LATE: {
    subject: "Yaklaşan randevunuz · {kod}",
    email: "{kod} numaralı {dukkan} randevunuz yaklaşıyor.\nTarih: {tarih}\nSaat: {saat}\nAdres: {adres}\nTelefon: {telefon}",
    sms: "Randevunuz yaklaşıyor: {kod}, {tarih_kisa} {saat}. Tel: {telefon}.",
  },
} satisfies Record<NotificationEvent, Template>;

export const whatsappTemplate = "Merhaba {isim}, {dukkan} servisinden yazıyoruz. {kod} numaralı randevunuz {tarih} saat {saat} için kayıtlı. Sorularınız için {telefon}.";
export const testTemplate = { subject: "{dukkan} test bildirimi", body: "{dukkan} bildirim kanalı için test mesajıdır." };
export const events = Object.keys(templates) as NotificationEvent[];
export const eventLabels: Record<NotificationEvent, string> = {
  BOOKING_CREATED: "Yeni randevu · Müşteri",
  OWNER_NEW_BOOKING: "Yeni randevu · Dükkan",
  BOOKING_CONFIRMED: "Randevu onaylandı",
  BOOKING_CANCELLED: "Randevu iptal edildi",
  BOOKING_COMPLETED: "Randevu tamamlandı",
  OWNER_CUSTOMER_CANCELLED: "Müşteri iptali · Dükkan",
  REMINDER_EARLY: "İlk hatırlatma",
  REMINDER_LATE: "Son hatırlatma",
};

export const templateKeys = ["isim", "kod", "tarih", "tarih_kisa", "saat", "adres", "telefon", "dukkan"] as const;
export type TemplateValues = Partial<Record<typeof templateKeys[number], string>>;
const placeholder = /\{([^{}]+)\}/g;

export function fillTemplate(template: string, values: TemplateValues) {
  return template.replace(placeholder, (original, key: string) =>
    Object.hasOwn(values, key) ? values[key as keyof TemplateValues] ?? "" : original,
  );
}

export function validPlaceholders(template: string) {
  return [...template.matchAll(placeholder)].every((match) => templateKeys.some((key) => key === match[1]));
}

export function bookingVariables(
  booking: { customerName: string; code: string; date: string; timeSlot: string },
  shop: Record<string, string | undefined>,
): TemplateValues {
  return {
    isim: booking.customerName.trim().split(/\s+/)[0], kod: booking.code,
    tarih: formatDate(booking.date), tarih_kisa: booking.date.split("-").reverse().join("."),
    saat: booking.timeSlot, adres: shop.address ?? "", telefon: shop.phone ?? "", dukkan: shop.shopName ?? "MOTOWORLD",
  };
}

export function isOwnerEvent(event: NotificationEvent) {
  return event === "OWNER_NEW_BOOKING" || event === "OWNER_CUSTOMER_CANCELLED";
}

