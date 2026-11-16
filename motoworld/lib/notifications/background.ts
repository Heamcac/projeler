import { after } from "next/server";
import { processDeliveryQueue } from "./queue";

export function deliverAfterResponse(code: string) {
  after(async () => {
    try {
      await processDeliveryQueue({ bookingCode: code, limit: 12 });
    } catch {
      // The cron route picks up rows that could not be processed here.
      console.error("Bildirim kuyruğu arka planda işlenemedi.");
    }
  });
}
