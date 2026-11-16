import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui";
import { getAdmin } from "@/lib/auth";
import { bookingReturnPath } from "@/lib/admin-links";

export default async function AdminLogin({ searchParams }: PageProps<"/admin/giris">) {
  const returnTo = bookingReturnPath((await searchParams).next);
  if (await getAdmin()) redirect(returnTo ?? "/admin");
  return <div className="wrap max-w-lg py-12 sm:py-20">
    <Card className="p-6 sm:p-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Yönetici girişi</h1>
      <LoginForm returnTo={returnTo} />
    </Card>
  </div>;
}
