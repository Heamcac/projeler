import type { NotificationEvent } from "@/generated/prisma/client";
import { channelsFor } from "./channels";

export function notificationEntries(...events: NotificationEvent[]) {
  return events.flatMap((event) => channelsFor(event).map((channel) => ({ event, channel })));
}
