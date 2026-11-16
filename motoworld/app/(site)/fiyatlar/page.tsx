import { connection } from "next/server";
import { Prices } from "@/components/prices";
import { ButtonLink, PageIntro } from "@/components/ui";
import { getPublicCatalog, getPublicSettings } from "@/lib/public-data";

export const metadata = {
  title: "Tahmini motosiklet bakım fiyatları | MOTOWORLD",
  description: "Motor hacmine göre Bursa MOTOWORLD motosiklet bakım ve işçilik fiyat aralıklarını inceleyin.",
  alternates: { canonical: "/fiyatlar" },
};

export default async function PricePage() {
  await connection();
  const [{ categories }, settings] = await Promise.all([getPublicCatalog(), getPublicSettings()]);
  return <div className="wrap py-12 sm:py-16">
    <PageIntro title="Bakım fiyatları">Motosikletinizin CC grubunu seçerek hizmetlerin tahmini fiyat aralıklarını inceleyin.</PageIntro>
    <Prices categories={categories} notice={settings.priceNotice} />
    <div className="mt-6"><ButtonLink href="/randevu">Randevu al</ButtonLink></div>
  </div>;
}
