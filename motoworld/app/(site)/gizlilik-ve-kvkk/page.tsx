import { connection } from "next/server";
import { Card, PageIntro } from "@/components/ui";
import { getSettings } from "@/lib/catalog";
import { getRetentionDays } from "@/lib/retention";

export const metadata = {
  title: "Gizlilik ve KVKK aydınlatma metni | MOTOWORLD",
  description: "Servis randevularında kişisel verilerin işlenmesi ve başvuru hakları.",
  alternates: { canonical: "/gizlilik-ve-kvkk" },
};

export default async function PrivacyNotice() {
  await connection();
  const [shop, days] = await Promise.all([getSettings(), getRetentionDays()]);
  return <div className="wrap max-w-4xl py-10 sm:py-14">
    <PageIntro title="KVKK aydınlatma metni">Motosiklet servis randevusu sırasında işlenen kişisel veriler</PageIntro>
    <Card className="space-y-6 p-5 text-sm leading-relaxed text-muted sm:p-8">
      <section>
        <h2 className="mb-1 text-2xl font-bold text-paper">Saklama süresi</h2>
        <p>Randevu sistemindeki kişisel veriler, kayıt ve hizmet sürecinin tamamlanmasından sonra {days} gün saklanır. Süresi dolan kayıtlardaki kimlik ve iletişim alanları temizlenir. Saklanması kanunen zorunlu diğer işletme kayıtları kendi yasal sürelerine tabidir.</p>
      </section>
      <section>
        <h2 className="mb-1 text-2xl font-bold text-paper">Veri sorumlusu</h2>
        <p>{shop.shopName} · {shop.address} · {shop.phone}</p>
      </section>
      <section>
        <h2 className="mb-1 text-2xl font-bold text-paper">Verilerin toplanması ve işlenmesi</h2>
        <p>Ad soyad, telefon, isteğe bağlı e-posta adresi, araç ve hizmet bilgileri, randevu zamanı ve eklediğiniz not randevu formu veya telefonla servis kaydı sırasında toplanır. Randevu talebinizi oluşturmak ve yürütmek, size kayıt, onay veya iptal durumunu bildirmek ve servisi planlamak için bu veriler işlenir. Bu işlemler 6698 sayılı Kanunun 5. maddesinin ikinci fıkrasındaki sözleşmenin kurulması veya ifasıyla doğrudan ilgili olma şartına dayanır.</p>
        <p className="mt-2">Randevu hatırlatmaları ve tamamlanma bildirimi, ayrı bildirim kutusunda verdiğiniz açık rızaya dayanır. Bu izni dilediğiniz zaman servisle iletişime geçerek geri çekebilirsiniz.</p>
      </section>
      <section>
        <h2 className="mb-1 text-2xl font-bold text-paper">Veri aktarımı</h2>
        <p>Web sitesi ve randevu kayıtları için barındırma hizmeti sağlayıcısı kullanılabilir. Bildirimler için, yapılandırılan e-posta veya SMS hizmet sağlayıcısına mesajı iletmek için gerekli iletişim bilgisi ve mesaj içeriği aktarılır. Servis WhatsApp üzerinden sizinle iletişime geçtiğinde telefon numaranız ve ilgili mesaj içeriği bu hizmet üzerinden işlenir.</p>
      </section>
      <section>
        <h2 className="mb-1 text-2xl font-bold text-paper">Başvuru ve haklarınız</h2>
        <p>Kanunun 11. maddesi kapsamındaki bilgi alma, düzeltme, silme ve diğer haklarınıza ilişkin taleplerinizi yukarıdaki adresten veri sorumlusuna iletebilirsiniz.</p>
      </section>
    </Card>
  </div>;
}
