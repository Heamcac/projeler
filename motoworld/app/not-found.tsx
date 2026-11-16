import { ButtonLink, Card } from "@/components/ui";

export default function NotFound() {
  return <main className="wrap flex flex-1 items-center py-16">
    <Card className="w-full max-w-2xl p-6 sm:p-10">
      <p className="text-sm font-bold text-spark">MOTOWORLD · 404</p>
      <h1 className="mt-2 text-4xl font-extrabold">Sayfa bulunamadı</h1>
      <p className="mb-5 mt-2 text-muted">Bağlantıyı kontrol edin veya ana sayfaya dönün.</p>
      <ButtonLink href="/">Ana sayfaya dön</ButtonLink>
    </Card>
  </main>;
}
