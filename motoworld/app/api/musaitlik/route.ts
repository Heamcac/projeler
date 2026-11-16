import { slotsOn } from "@/lib/bookings";
import { inBookingWindow } from "@/lib/time";
import { rateAllowed } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("tarih") ?? "";
  const headers = { "Cache-Control": "no-store" };
  if (!await rateAllowed("availability", 120, 60_000)) {
    return Response.json({ error: "Bir dakika sonra tekrar deneyin." }, { status: 429, headers });
  }
  if (!inBookingWindow(date)) return Response.json({ error: "Geçerli bir tarih seçin." }, { status: 400, headers });
  return Response.json({ slots: await slotsOn(date) }, { headers });
}
