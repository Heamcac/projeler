import { shopClock } from "../time";

const minute = 60_000;
const window = 15 * minute;

export function appointmentTime(date: string, timeSlot: string) {
  const wall = Date.parse(`${date}T${timeSlot}:00Z`);
  const local = shopClock(new Date(wall));
  const offset = Date.parse(`${local.date}T${local.time}:00Z`) - wall;
  return wall - offset;
}

export function dueReminder(appointment: number, now: number, schedule: { early: number; late: number }) {
  if (now >= appointment) return null;
  const lateDue = appointment - schedule.late * minute;
  if (now >= lateDue) return now < lateDue + window ? "REMINDER_LATE" : null;
  const earlyDue = appointment - schedule.early * minute;
  return now >= earlyDue && now < earlyDue + window ? "REMINDER_EARLY" : null;
}

export function reminderDeadline(event: "REMINDER_EARLY" | "REMINDER_LATE", appointment: number, lateMinutes: number) {
  return event === "REMINDER_EARLY" ? appointment - lateMinutes * minute : appointment;
}
