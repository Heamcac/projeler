"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { preferenceCookie, preferenceLifetime } from "@/lib/analytics";
import { Button } from "./ui";

type Choice = "allow" | "deny";
const publicPaths = new Set(["/", "/fiyatlar", "/randevu", "/randevu-sorgula", "/gizlilik-ve-kvkk", "/cerez-politikasi"]);

export function AnalyticsConsent({ domain, initial }: { domain: string; initial?: Choice }) {
  const [choice, setChoice] = useState<Choice | undefined>(initial);
  const [open, setOpen] = useState(!initial);
  const path = usePathname();
  const previous = useRef("");

  useEffect(() => {
    if (choice !== "allow") {
      previous.current = "";
      return;
    }
    if (!publicPaths.has(path) || previous.current === path) return;
    previous.current = path;
    void fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ name: "pageview", domain, url: new URL(path, window.location.origin).href }),
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    }).catch(() => {});
  }, [choice, domain, path]);

  function save(value: Choice) {
    document.cookie = `${preferenceCookie}=${value}; Path=/; Max-Age=${preferenceLifetime}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setChoice(value);
    setOpen(false);
  }

  return <>
    <button type="button" className="min-h-11 text-sm text-muted underline underline-offset-4" onClick={() => setOpen(true)}>Çerez tercihleri</button>
    {open && <section aria-labelledby="cookie-preferences" className="fixed bottom-16 left-4 right-4 z-50 max-w-lg rounded-xl border border-line bg-surface p-4 shadow-xl sm:bottom-4">
      <h2 id="cookie-preferences" className="text-xl font-bold">Analitik tercihi</h2>
      <p className="my-2 text-sm text-muted">İzin verirseniz sayfa görüntülemeleri Plausible’a iletilir. Tercihinizi istediğiniz zaman değiştirebilirsiniz.</p>
      <Link className="text-sm text-spark underline" href="/cerez-politikasi">Çerez politikası</Link>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => save("deny")}>Reddet</Button>
        <Button type="button" variant="secondary" onClick={() => save("allow")}>Kabul et</Button>
      </div>
    </section>}
  </>;
}
