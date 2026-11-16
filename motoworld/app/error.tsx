"use client";

import { Button, ButtonLink, Card } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="wrap py-16">
    <Card className="max-w-2xl p-6 sm:p-10">
      <p className="text-sm font-bold text-spark">MOTOWORLD</p>
      <h1 className="mt-2 text-4xl font-extrabold">Bir sorun oluştu</h1>
      <p className="mb-5 mt-2 text-muted">Biraz sonra tekrar deneyin veya ana sayfaya dönün.</p>
      <div className="flex flex-wrap gap-2"><Button onClick={reset}>Tekrar dene</Button><ButtonLink href="/" variant="secondary">Ana sayfa</ButtonLink></div>
    </Card>
  </section>;
}
