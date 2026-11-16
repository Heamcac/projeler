import { authorizeCron, cronResponse } from "@/lib/cron-auth";
import { anonymizeBookings } from "@/lib/retention";

export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = await authorizeCron(request, "privacy");
  if (denied) return denied;
  return cronResponse({ anonymized: await anonymizeBookings() });
}
