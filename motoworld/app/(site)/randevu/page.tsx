import { connection } from "next/server";
import { BookingForm } from "@/components/booking-form";
import { PageIntro } from "@/components/ui";
import { bookableDates } from "@/lib/bookings";
import { getPublicCatalog } from "@/lib/public-data";
import { shopClock } from "@/lib/time";

export const metadata = {
  title: "Motosiklet servis randevusu | MOTOWORLD",
  description: "Bursa MOTOWORLD servis randevusu için motosikletinizi, hizmetleri ve uygun saati seçin.",
  alternates: { canonical: "/randevu" },
};

export default async function BookingPage() {
  await connection();
  const [{ categories, services }, dates] = await Promise.all([getPublicCatalog(), bookableDates()]);
  const today = shopClock().date;
  return <div className="wrap max-w-4xl py-10 sm:py-14">
    <PageIntro title="Servis randevusu">Motosikletinizi ve ihtiyacınız olan hizmetleri seçerek randevu isteği gönderin.</PageIntro>
    <BookingForm categories={categories} services={services} dates={dates} year={today.slice(0, 4)} />
  </div>;
}
