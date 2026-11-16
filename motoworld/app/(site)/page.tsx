import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { connection } from "next/server";
import { HeroSlider } from "@/components/hero-slider";
import { Prices } from "@/components/prices";
import { ShopMap } from "@/components/shop-map";
import { ButtonLink, Card } from "@/components/ui";
import { dialNumber, safeMapEmbed, safeUrl, siteUrl } from "@/lib/catalog";
import { getPublicCatalog, getPublicHours, getPublicSettings } from "@/lib/public-data";
import { weekdays } from "@/lib/time";

const atelierPhoto = "/images/servis-atolyesi.webp";
const maintenancePhoto = "/images/motosiklet-bakimi.webp";
const wheelPhoto = "/images/fren-ve-lastik.webp";

function photoUrl(path: string | undefined, fallback: string) {
  return path?.startsWith("/images/") ? path : safeUrl(path) ?? fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getPublicSettings();
  const title = `${settings.shopName} | Bursa Motosiklet Servisi`;
  const description = settings.about;
  const image = photoUrl(settings.ogImage, atelierPhoto);
  return {
    title, description, alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", locale: "tr_TR", type: "website", images: [image] },
  };
}

export default async function Home() {
  await connection();
  const [settings, { categories, services }, hours, requestHeaders] = await Promise.all([
    getPublicSettings(), getPublicCatalog(), getPublicHours(), headers(),
  ]);
  const phone = settings.phone && dialNumber(settings.phone);
  const map = safeUrl(settings.mapUrl);
  const embed = safeMapEmbed(settings.mapEmbedUrl);
  const whatsapp = safeUrl(settings.whatsappUrl);
  const socials = [settings.instagramUrl, settings.facebookUrl].flatMap((value) => safeUrl(value) ?? []);
  const ordered = [...hours.slice(1), ...hours.slice(0, 1)];
  const workshop = photoUrl(settings.workshopImage, maintenancePhoto);
  const slides = [
    { src: photoUrl(settings.heroImage, atelierPhoto), title: "Motosiklet servisi", alt: "Servis alanında koyu renkli motosiklet" },
    { src: maintenancePhoto, title: "Periyodik bakım", alt: "Usta, motosiklet motorunda tork anahtarı kullanıyor" },
    { src: wheelPhoto, title: "Fren ve lastik kontrolü", alt: "Motosikletin ön lastiği ve fren diski" },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: settings.shopName,
    description: settings.about,
    url: siteUrl().href,
    telephone: phone,
    address: { "@type": "PostalAddress", streetAddress: settings.address, addressLocality: "Bursa", addressCountry: "TR" },
    hasMap: map,
    sameAs: socials,
    openingHoursSpecification: hours.filter((day) => !day.isClosed).map((day) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.weekday]}`,
      opens: day.opens,
      closes: day.closes,
    })),
  };

  return <>
    <script type="application/ld+json" nonce={requestHeaders.get("x-nonce") ?? undefined}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <div className="mx-auto w-full max-w-[84rem] px-5 pt-5 sm:px-8 sm:pt-8">
      <HeroSlider slides={slides}>
        <p className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-spark sm:mb-5">
          <span className="h-px w-6 bg-spark" aria-hidden="true" /> Bursa · Motosiklet servisi
        </p>
        <h1 className={`home-hero__title ${settings.shopName?.toUpperCase() === "MOTOWORLD" ? "whitespace-nowrap" : "break-words"}`}>
          {settings.shopName}
        </h1>
        <p className="mt-3 text-lg font-medium text-paper sm:mt-5 sm:text-2xl">{settings.slogan}</p>
        <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-8">
          <ButtonLink href="/randevu">Randevu al <span aria-hidden="true">↗</span></ButtonLink>
          {phone && <ButtonLink href={`tel:${phone}`} variant="secondary">Ara</ButtonLink>}
        </div>
      </HeroSlider>
    </div>
    <section className="wrap py-11 sm:py-16" aria-labelledby="hizmetler">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="hizmetler" className="section-title scroll-mt-6">Servis hizmetleri</h2>
        <a href="/fiyatlar" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-spark hover:text-paper">Fiyatları incele <span aria-hidden="true">↗</span></a>
      </div>
      <ul className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(({ id, name, durationMinutes }) => <li key={id} className="home-service">
          <span className="flex min-w-0 items-center gap-3 font-semibold text-paper"><span className="h-2.5 w-[3px] shrink-0 -skew-x-12 rounded-sm bg-spark/75" aria-hidden="true" />{name}</span>
          <span className="shrink-0 rounded-full border border-line bg-ink/55 px-2.5 py-1 text-xs font-medium text-muted">{durationMinutes} dk</span>
        </li>)}
      </ul>
    </section>
    <section className="home-prices border-y border-line">
      <div className="wrap grid gap-7 py-12 sm:py-16 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="section-title">Tahmini bakım fiyatları</h2>
          <p className="mb-4 mt-3 text-muted">Motosikletinizin motor hacmini seçin.</p>
          <ButtonLink href="/fiyatlar" variant="secondary">Fiyat sayfası <span aria-hidden="true">↗</span></ButtonLink>
        </div>
        <Prices categories={categories} notice={settings.priceNotice} />
      </div>
    </section>
    <section className="wrap grid items-center gap-7 py-12 sm:grid-cols-2 sm:py-16 lg:gap-12">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-surface">
        <Image src={workshop} alt="Motosiklet bakım çalışması" fill sizes="(min-width: 1024px) 520px, (min-width: 640px) 50vw, 100vw"
          unoptimized={!workshop.startsWith("/images/")} className="object-cover" />
      </div>
      <div>
        <h2 className="section-title">Hakkımızda</h2>
        <p className="mt-3 leading-relaxed text-muted">{settings.about}</p>
        <ul className="mt-5 grid gap-2 text-sm font-medium lg:grid-cols-2">
          {settings.trustPoints?.split("\n").filter(Boolean).map((point) => <li key={point} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-spark">✓</span>{point}
          </li>)}
        </ul>
      </div>
    </section>
    <section className="border-t border-line bg-surface/30">
      <div className="wrap grid gap-4 py-12 sm:grid-cols-2 sm:py-16">
        <Card className="p-5 sm:p-7">
          <h2 className="text-2xl font-bold">Çalışma saatleri</h2>
          <dl className="mt-4 divide-y divide-line text-sm">
            {ordered.map((day) => <div key={day.weekday} className="flex justify-between gap-2 py-2.5">
              <dt>{weekdays[day.weekday]}</dt>
              <dd className="text-muted">{day.isClosed ? "Kapalı" : `${day.opens}–${day.closes}`}</dd>
            </div>)}
          </dl>
        </Card>
        <Card className="p-5 sm:p-7">
          <h2 className="text-2xl font-bold">Adres ve iletişim</h2>
          <address className="my-4 space-y-2 not-italic text-muted">
            <p>{settings.address}</p>
            {phone && <a className="inline-block text-spark" href={`tel:${phone}`}>{settings.phone}</a>}
          </address>
          <div className="flex flex-wrap gap-2">
            {map && <ButtonLink href={map}>Yol tarifi al</ButtonLink>}
            {whatsapp && <ButtonLink href={whatsapp} variant="secondary">WhatsApp</ButtonLink>}
          </div>
          {embed && <ShopMap src={embed} />}
        </Card>
      </div>
    </section>
    <div className="wrap py-8 sm:py-10">
      <div className="home-prices flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line p-5 sm:px-8 sm:py-6">
        <h2 className="text-3xl font-bold tracking-tight">Servis ziyaretinizi planlayın</h2>
        <ButtonLink href="/randevu">Randevu al <span aria-hidden="true">↗</span></ButtonLink>
      </div>
    </div>
  </>;
}
