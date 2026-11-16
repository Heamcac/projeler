'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface NotificationItem {
  id: string;
  requestId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function load() {
    setItems(await api<NotificationItem[]>('/notifications'));
  }

  useEffect(() => {
    load().catch(() => setItems([]));
    const timer = window.setInterval(() => load().catch(() => undefined), 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' });
    await load();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Bildirim Merkezi</h1>
        <p className="text-sm text-slate-600">Hasta bilgileri önizlemelerde gösterilmez.</p>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white">
        {items.map((item) => (
          <div key={item.id} className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.body}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('tr-TR')}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.requestId && <Link className="text-sm font-medium text-hospital" href={`/requests/${item.requestId}`}>Talebe git</Link>}
              {!item.isRead && <Button onClick={() => markRead(item.id)}>Okundu</Button>}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-sm text-slate-500">Yeni bildirim yok.</p>}
      </section>
    </AppShell>
  );
}
