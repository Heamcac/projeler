"use client";

import { Button } from "@/components/ui";
import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="tr"><body className="font-sans">
    <main className="wrap py-16">
      <p className="text-sm font-bold text-spark">MOTOWORLD</p>
      <h1 className="my-3 text-4xl font-extrabold">Site şu anda açılamıyor</h1>
      <p className="mb-5 text-muted">Lütfen biraz sonra tekrar deneyin.</p>
      <Button onClick={reset}>Tekrar dene</Button>
    </main>
  </body></html>;
}
