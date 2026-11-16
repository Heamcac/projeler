'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ClipboardList, History, Home, LogOut, Settings, ShieldCheck, WalletCards } from 'lucide-react';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-me';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/requests/new', label: 'Yeni Talep', icon: ClipboardList },
  { href: '/requests', label: 'Taleplerim', icon: ClipboardList },
  { href: '/logs', label: 'Log Takibi', icon: History },
  { href: '/approvals', label: 'Onay Kutusu', icon: ShieldCheck },
  { href: '/implementations', label: 'Fatura İşlemleri', icon: WalletCards },
  { href: '/notifications', label: 'Bildirimler', icon: Bell },
  { href: '/admin', label: 'Yönetim', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useMe();

  async function logout() {
    await api('/auth/logout', { method: 'POST', body: '{}' }).catch(() => undefined);
    router.push('/login');
  }

  if (loading) return <main className="p-8 text-sm text-slate-600">Yükleniyor...</main>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white md:block">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-navy text-white">
              <WalletCards size={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-navy">HOSPİON</p>
              <p className="text-xs text-slate-500">Dijital işlem yönetimi</p>
            </div>
          </div>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-blue-50 text-hospital' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div>
            <p className="text-sm font-semibold text-navy">{user.fullName}</p>
            <p className="text-xs text-slate-500">{user.roles.join(', ')}</p>
          </div>
          <button onClick={logout} className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <LogOut size={16} />
            Çıkış
          </button>
        </header>
        <div className="p-4 pb-24 md:p-8">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-slate-200 bg-white p-1 md:hidden">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="grid w-20 shrink-0 place-items-center gap-1 rounded-md py-2 text-[11px] text-slate-600">
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
