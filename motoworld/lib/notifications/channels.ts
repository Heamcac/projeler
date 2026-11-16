import type { NotificationChannel, NotificationEvent } from "@/generated/prisma/client";
import { templates } from "./templates";

const enabledChannels: Record<NotificationChannel, boolean> = {
  EMAIL: true,
  SMS: false,
};

export function channelsFor(event: NotificationEvent): NotificationChannel[] {
  const channels: NotificationChannel[] = [];
  if (enabledChannels.EMAIL) channels.push("EMAIL");
  if (enabledChannels.SMS && "sms" in templates[event]) channels.push("SMS");
  return channels;
}
