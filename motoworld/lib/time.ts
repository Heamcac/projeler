export const timezone = "Europe/Istanbul";
export const bookingWindowDays = 60;
export const weekdays = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const localClock = new Intl.DateTimeFormat("sv-SE", {
  timeZone: timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function shopClock(now = new Date()) {
  const [date, time] = localClock.format(now).split(" ");
  return { date, time };
}

export function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function weekStart(date: string) {
  return addDays(date, -((new Date(date).getUTCDay() + 6) % 7));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long", timeZone: "UTC",
  }).format(new Date(date));
}

export function inBookingWindow(date: string, now = new Date()) {
  const today = shopClock(now).date;
  return isDate(date) && date >= today && date <= addDays(today, bookingWindowDays);
}

type Hours = { opens: string; closes: string; isClosed: boolean; slotMinutes: number; maxPerSlot: number };
type Slot = { timeSlot: string; count: number };

function minutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function availableSlots(date: string, hours: Hours | null, holiday: boolean, occupied: Slot[], now = new Date()) {
  if (!inBookingWindow(date, now) || !hours || holiday || hours.isClosed || hours.slotMinutes < 1) return [];
  const { date: today, time } = shopClock(now);
  const counts = new Map(occupied.map(({ timeSlot, count }) => [timeSlot, count]));
  const slots: string[] = [];
  const closing = minutes(hours.closes);

  for (let start = minutes(hours.opens); start + hours.slotMinutes <= closing; start += hours.slotMinutes) {
    const slot = [Math.floor(start / 60), start % 60].map((part) => String(part).padStart(2, "0")).join(":");
    if ((date !== today || slot > time) && (counts.get(slot) ?? 0) < hours.maxPerSlot) slots.push(slot);
  }
  return slots;
}
