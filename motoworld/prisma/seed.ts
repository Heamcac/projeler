import { hash } from "bcryptjs";
import { loginSchema } from "../lib/validation";
import { db } from "../lib/db";

const settings = {
  shopName: "MOTOWORLD",
  slogan: "Motorunuz güvenilir ellerde",
  about: "Motosikletinizin bakım ve onarımını tecrübeli usta kadromuzla yapıyoruz. Kaliteli yedek parçalar kullanıyor, yapılacak işlemleri ve tahmini ücreti işe başlamadan önce sizinle paylaşıyoruz.",
  address: "Anadolu, Anadolu Cd. No:11, 16270 Yıldırım/Bursa",
  phone: "0543 291 16 01",
  whatsappUrl: "https://wa.me/905432911601",
  mapUrl: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x14ca3f837e5927d9:0x2226ba7d5bc3b1d2?hl=tr-TR",
  mapEmbedUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  heroImage: "",
  workshopImage: "",
  ogImage: "",
  priceNotice: "Fiyatlar tahminidir; motor modeli, yedek parça ve arızaya göre değişebilir. Kesin fiyat muayene sonrası verilir.",
  trustPoints: "Tecrübeli usta kadrosu\nKaliteli yedek parça\nŞeffaf fiyat aralıkları\nİşlem öncesi bilgilendirme",
};

const groups = ["0-50", "50-125", "125-250", "250-500", "500+"];
type ServiceSeed = [id: string, name: string, duration: number, prices?: [number, number][]];
const services: ServiceSeed[] = [
  ["bakim", "Periyodik bakım", 60, [[800,1500],[1200,2200],[1800,3200],[3000,5500],[5000,10000]]],
  ["yag", "Yağ + yağ filtresi", 30, [[500,900],[700,1300],[1000,1800],[1500,2800],[2200,4500]]],
  ["hava", "Hava filtresi", 25, [[250,500],[300,600],[400,800],[600,1200],[900,2000]]],
  ["buji", "Buji", 25, [[200,400],[250,500],[350,700],[600,1200],[1000,2500]]],
  ["fren-on", "Fren balatası (ön)", 40, [[400,800],[500,1000],[700,1400],[1000,2000],[1500,3500]]],
  ["fren-arka", "Fren balatası (arka)", 40, [[400,800],[500,1000],[700,1400],[1000,2000],[1500,3000]]],
  ["zincir", "Zincir-dişli seti", 60, [[1200,2200],[1800,3200],[2500,4500],[3500,6500],[5000,9000]]],
  ["lastik", "Lastik değişimi (işçilik, 1 adet)", 45, [[300,500],[400,700],[500,900],[700,1200],[900,1600]]],
  ["aku", "Akü değişimi", 30, [[600,1200],[800,1600],[1000,2000],[1500,3000],[2000,4500]]],
  ["kontrol", "Genel kontrol", 35, [[300,500],[400,600],[500,800],[700,1200],[1000,2000]]],
  ["fren", "Fren bakımı", 45],
  ["elektrik", "Elektrik arıza tespiti", 60],
  ["revizyon", "Motor revizyonu", 240],
];

async function seed() {
  const login = loginSchema.safeParse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  if (!login.success || login.data.password.length < 12) {
    throw new Error(".env dosyasında geçerli ADMIN_EMAIL ve en az 12 karakterlik ADMIN_PASSWORD tanımlayın.");
  }
  const { email, password } = login.data;
  const passwordHash = await hash(password, 12);

  await db.$transaction(async (tx) => {
    await tx.adminUser.upsert({ where: { email }, create: { email, passwordHash }, update: {} });
    for (const [key, value] of Object.entries(settings)) {
      await tx.setting.upsert({ where: { key }, create: { key, value }, update: {} });
    }
    for (const [sort, id] of groups.entries()) {
      await tx.ccCategory.upsert({ where: { id }, create: { id, label: `${id} cc`, sort }, update: {} });
    }
    for (const [sort, [id, name, durationMinutes, prices]] of services.entries()) {
      await tx.service.upsert({ where: { id }, create: { id, name, durationMinutes, sort }, update: {} });
      for (const [index, [minPrice, maxPrice]] of (prices ?? []).entries()) {
        const key = { ccCategoryId: groups[index], serviceId: id };
        await tx.priceItem.upsert({
          where: { ccCategoryId_serviceId: key },
          create: { ...key, minPrice, maxPrice },
          update: {},
        });
      }
    }
    for (let weekday = 0; weekday < 7; weekday++) {
      await tx.workingHours.upsert({
        where: { weekday }, create: { weekday, opens: "08:30", closes: "18:30", isClosed: weekday === 0 }, update: {},
      });
    }
  }, { timeout: 20_000 });
  console.log("Başlangıç verileri hazır.");
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Başlangıç verileri yazılamadı.");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
