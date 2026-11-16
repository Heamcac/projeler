'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api, statusLabel } from '@/lib/api';
import { RequestItem } from '@/types';
import { RequestLogTarget } from '@/components/requests/request-log-target';

export default function DashboardPage() {
  const [items, setItems] = useState<RequestItem[]>([]);

  useEffect(() => {
    api<{ items: RequestItem[] }>('/requests?pageSize=6').then((data) => setItems(data.items)).catch(() => setItems([]));
  }, []);

  const counts = {
    total: items.length,
    pending: items.filter((i) => ['PENDING', 'IN_REVIEW', 'IMPLEMENTATION_PENDING'].includes(i.status)).length,
    info: items.filter((i) => i.status === 'INFO_REQUIRED').length,
    done: items.filter((i) => i.status === 'COMPLETED').length,
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Personel Dashboard</h1>
          <p className="text-sm text-slate-600">Taleplerin ve son işlemler tek ekranda.</p>
        </div>
        <Link href="/requests/new" className="focus-ring rounded-md bg-hospital px-4 py-2 text-sm font-semibold text-white">
          Yeni talep oluştur
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Toplam taleplerim', counts.total],
          ['Bekleyen taleplerim', counts.pending],
          ['Ek bilgi isteyenler', counts.info],
          ['Tamamlanan talepler', counts.done],
        ].map(([label, value]) => (
          <section key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-navy">{value}</p>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-navy">Son işlemler</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {items.length === 0 && <p className="p-5 text-sm text-slate-500">Henüz görüntülenecek talep yok.</p>}
          {items.map((item) => (
            <RequestLogTarget key={item.id} requestId={item.id}>
            <Link href={`/requests/${item.id}`} className="grid gap-1 p-5 hover:bg-slate-50">
              <span className="font-medium text-slate-900">{item.request_type_name ?? item.request_type}</span>
              <span className="text-sm text-slate-500">{statusLabel[item.status] ?? item.status}</span>
            </Link>
            </RequestLogTarget>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
