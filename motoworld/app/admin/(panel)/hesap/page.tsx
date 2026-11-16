import { AdminHeader } from "@/components/admin/display";
import { AdminForm } from "@/components/admin/forms";
import { Card, Field } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { bookingReturnPath } from "@/lib/admin-links";

export default async function Account({ searchParams }: PageProps<"/admin/hesap">) {
  const admin = await requireAdmin({ allowPasswordChange: true });
  const returnTo = bookingReturnPath((await searchParams).next);
  return <div className="max-w-xl">
    <AdminHeader title="Hesap" actions={<AdminForm operation="logout" label="Çıkış yap" secondary />}>{admin.email}</AdminHeader>
    <Card className="p-5">
      <h2 className="text-2xl font-bold">Şifre değiştir</h2>
      {admin.passwordChangeRequired && <p className="mt-3 rounded-lg border border-spark bg-ink p-3 text-sm">Yönetim panelini açmak için ilk giriş şifrenizi değiştirin.</p>}
      <p className="mb-4 mt-1 text-sm text-muted">En az 12 karakter kullanın. Şifre değiştiğinde tüm açık oturumlar kapatılır.</p>
      <AdminForm operation="password" label="Şifreyi değiştir" reset className="space-y-3">
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <Field title="Mevcut şifre"><input className="input" name="current" type="password" autoComplete="current-password" required maxLength={72} /></Field>
        <Field title="Yeni şifre"><input className="input" name="next" type="password" autoComplete="new-password" required minLength={12} maxLength={72} /></Field>
        <Field title="Yeni şifre (tekrar)"><input className="input" name="repeat" type="password" autoComplete="new-password" required minLength={12} maxLength={72} /></Field>
      </AdminForm>
    </Card>
  </div>;
}
