'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api, priorityLabel } from '@/lib/api';
import { RequestItem } from '@/types';
import { RequestLogTarget } from '@/components/requests/request-log-target';

export default function ImplementationsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);

  useEffect(() => {
    api<{ items: RequestItem[] }>('/requests?status=IMPLEMENTATION_PENDING&pageSize=50')
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Fatura Yetkilisi Paneli</h1>
        <p className="text-sm text-slate-600">Onaylanmış ve HBYS üzerinde manuel uygulama bekleyen talepler.</p>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white">
        {items.map((item) => (
          <RequestLogTarget key={item.id} requestId={item.id} className="border-b border-slate-100">
          <Link href={`/requests/${item.id}`} className="grid gap-2 px-5 py-4 hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_100px_160px]">
            <span>
              <strong className="block text-sm text-slate-900">{item.request_type_name}</strong>
              <span className="text-xs text-slate-500">{item.department_name}</span>
            </span>
            <span className="text-sm text-slate-700">{priorityLabel[item.priority]}</span>
            <span className="text-sm font-medium text-hospital">Tamamlama kaydı aç</span>
          </Link>
          </RequestLogTarget>
        ))}
        {items.length === 0 && <p className="p-6 text-sm text-slate-500">Manuel uygulama bekleyen talep yok.</p>}
      </section>
    </AppShell>
  );
}
