import type { NotificationEvent } from "@/generated/prisma/client";
import { z } from "zod";
import { db } from "../db";
import { events, templates, validPlaceholders, whatsappTemplate } from "./templates";

const template = (length: number) => z.string().trim().min(1, "Şablon alanı boş bırakılamaz.").max(length)
  .refine(validPlaceholders, "Şablonda tanınmayan bir değişken var.");
const eventRule = z.object({
  subject: template(180),
  email: template(2000),
  sms: z.union([z.literal(""), template(400)]),
});
type EventRule = z.infer<typeof eventRule>;
const limit = 7 * 24 * 60;
const schedule = z.object({
  early: z.coerce.number().int().min(1).max(limit),
  late: z.coerce.number().int().min(1).max(limit),
}).refine(({ early, late }) => early > late, "İlk hatırlatma, son hatırlatmadan daha önce olmalı. Daha büyük dakika değeri girin.");

const settingKey = "notifications";
type NotificationSettings = {
  schedule: z.infer<typeof schedule>;
  rules: Record<NotificationEvent, EventRule>;
  whatsapp: string;
};

function defaults(): NotificationSettings {
  const rules = Object.fromEntries(events.map((event) => {
    const { subject, email } = templates[event];
    const entry = templates[event];
    return [event, { subject, email, sms: "sms" in entry ? entry.sms : "" }];
  })) as NotificationSettings["rules"];
  return { schedule: { early: 1440, late: 120 }, rules, whatsapp: whatsappTemplate };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const row = await db.setting.findUnique({ where: { key: settingKey } });
  const base = defaults();
  if (!row) return base;
  try {
    const stored = JSON.parse(row.value);
    const overrides = z.object({
      schedule: schedule.optional(),
      whatsapp: template(1000).optional(),
      rules: z.partialRecord(z.enum(events), eventRule).optional(),
    }).parse(stored);
    const rules = { ...base.rules, ...overrides.rules };
    if (!rules.OWNER_NEW_BOOKING.sms) rules.OWNER_NEW_BOOKING.sms = templates.OWNER_NEW_BOOKING.sms;
    return { schedule: overrides.schedule ?? base.schedule, whatsapp: overrides.whatsapp ?? base.whatsapp, rules };
  } catch {
    return base;
  }
}

export async function updateNotificationSettings(form: FormData) {
  const current = await getNotificationSettings();
  const rules = Object.fromEntries(events.map((event) => {
    const read = (field: string) => form.get(`${event}.${field}`);
    return [event, eventRule.parse({
      subject: read("subject"), email: read("email"), sms: current.rules[event].sms,
    })];
  }));
  const value = JSON.stringify({
    schedule: schedule.parse({ early: form.get("early"), late: form.get("late") }),
    whatsapp: template(1000).parse(form.get("whatsapp")),
    rules,
  });
  await db.setting.upsert({ where: { key: settingKey }, create: { key: settingKey, value }, update: { value } });
}
