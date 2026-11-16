import { AdminHeader } from "@/components/admin/display";
import { BookingForm } from "@/components/booking-form";
import { requireAdmin } from "@/lib/auth";
import { bookableDates } from "@/lib/bookings";
import { getCatalog } from "@/lib/catalog";
import { shopClock } from "@/lib/time";

export default async function NewBooking() {
  await requireAdmin();
  const [{ categories, services }, dates] = await Promise.all([getCatalog(), bookableDates()]);
  return <div className="max-w-3xl">
    <AdminHeader title="Yeni randevu">Telefonla gelen randevular onaylı olarak kaydedilir.</AdminHeader>
    <BookingForm categories={categories} services={services} dates={dates} year={shopClock().date.slice(0, 4)} staff />
  </div>;
}
