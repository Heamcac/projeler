import Link from "next/link";
import { Card, PageIntro } from "@/components/ui";

export const metadata = {
  title: "Çerez politikası | MOTOWORLD",
  description: "MOTOWORLD oturum ve analitik tercih çerezleri hakkında bilgi.",
  alternates: { canonical: "/cerez-politikasi" },
};

export default function CookiesPolicy() {
  return <div className="wrap max-w-4xl py-10 sm:py-14">
    <PageIntro title="Çerez politikası">Oturum ve isteğe bağlı analitik tercihleri</PageIntro>
    <Card className="space-y-6 p-5 text-sm leading-relaxed text-muted sm:p-8">
      <section>
        <h2 className="mb-2 text-2xl font-bold text-paper">Gerekli çerezler</h2>
        <p><code>motoworld-admin</code> yönetim oturumunu en fazla sekiz saat koruyan birinci taraf çerezidir. Yönetici girişinden sonra kullanılır.</p>
        <p className="mt-2"><code>motoworld-analytics</code> analitik açık olduğunda kabul veya ret seçiminizi 180 gün saklayan birinci taraf tercih çerezidir.</p>
      </section>
      <section>
        <h2 className="mb-2 text-2xl font-bold text-paper">İsteğe bağlı analitik</h2>
        <p>Plausible yapılandırılmışsa ve kabul ederseniz, genel sayfa yolu Plausible’a iletilir. Randevu bilgileri ve URL sorgu parametreleri iletilmez. Plausible bu entegrasyonda analitik çerezi yerleştirmez. Alt menüdeki Çerez tercihleri düğmesiyle izninizi geri çekebilirsiniz.</p>
        <p className="mt-2">Google haritasını yüklemeyi seçerseniz tarayıcınız Google’a bağlanır. Google kendi hizmet kurallarına göre çerez kullanabilir.</p>
      </section>
      <p>Veri sorumlusu, işleme amaçları ve başvuru hakları için <Link className="text-spark underline" href="/gizlilik-ve-kvkk">Gizlilik ve KVKK</Link> metnini inceleyebilirsiniz.</p>
    </Card>
  </div>;
}
