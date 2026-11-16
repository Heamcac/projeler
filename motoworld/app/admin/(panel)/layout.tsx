import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin({ allowPasswordChange: true });
  return <>
    {!admin.passwordChangeRequired && <AdminNav />}
    <div className="wrap py-7 sm:py-10">{children}</div>
  </>;
}
