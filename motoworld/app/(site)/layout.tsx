import type { ReactNode } from "react";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { Footer, Header } from "@/components/site-shell";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { analyticsDomain, preferenceCookie } from "@/lib/analytics";
import { getPublicSettings } from "@/lib/public-data";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  await connection();
  const settings = await getPublicSettings();
  const domain = analyticsDomain();
  const preference = domain ? (await cookies()).get(preferenceCookie)?.value : undefined;
  return <>
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3">İçeriğe geç</a>
    <Header shopName={settings.shopName} />
    <main id="main" className="flex-1">{children}</main>
    <Footer settings={settings} preferences={domain ? <AnalyticsConsent domain={domain}
      initial={preference === "allow" || preference === "deny" ? preference : undefined} /> : undefined} />
  </>;
}
