import { LookupForm } from "@/components/lookup-form";
import { PageIntro } from "@/components/ui";

export const metadata = {
  title: "Randevu sorgula | MOTOWORLD",
  description: "Rezervasyon kodunuz ve telefon numaranızla servis randevunuzun durumunu görün.",
  alternates: { canonical: "/randevu-sorgula" },
};

export default function LookupPage() {
  return <div className="wrap max-w-3xl py-10 sm:py-14">
    <PageIntro title="Randevu sorgula">Randevu durumunu görmek veya randevuyu iptal etmek için rezervasyon kodunuzu ve telefon numaranızı girin.</PageIntro>
    <LookupForm />
  </div>;
}
