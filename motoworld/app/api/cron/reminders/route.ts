import { enqueueReminders, processDeliveryQueue } from "@/lib/notifications/queue";
import { authorizeCron, cronResponse } from "@/lib/cron-auth";

export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = await authorizeCron(request, "reminders");
  if (denied) return denied;
  const enqueued = await enqueueReminders();
  const processed = await processDeliveryQueue();
  return cronResponse({ enqueued, processed });
}
