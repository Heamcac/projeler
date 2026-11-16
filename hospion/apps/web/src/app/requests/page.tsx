'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Input, Select } from '@/components/ui/field';
import { api, priorityLabel, statusLabel } from '@/lib/api';
import { RequestItem } from '@/types';
import { RequestLogTarget } from '@/components/requests/request-log-target';

export default function RequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    api<{ items: RequestItem[] }>(`/requests?${params}`).then((data) => setItems(data.items)).catch(() => setItems([]));
  }, [status, search]);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Taleplerim</h1>
        <p className="text-sm text-slate-600">Durum, tarih ve referans numarasına göre takip.</p>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <Input className="w-full pl-10" placeholder="Protokol, hasta veya fatura numarası ara" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm durumlar</option>
          {Object.entries(statusLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="hidden grid-cols-[1fr_160px_120px_130px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid">
          <span>Talep</span>
          <span>Durum</span>
          <span>Öncelik</span>
          <span>Tarih</span>
        </div>
        {items.map((item) => (
          <RequestLogTarget key={item.id} requestId={item.id} className="border-b border-slate-100">
          <Link href={`/requests/${item.id}`} className="grid gap-2 px-4 py-4 hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_160px_100px_100px]">
            <span>
              <strong className="block text-sm text-slate-900">{item.request_type_name ?? item.request_type}</strong>
              <span className="text-xs text-slate-500">Protokol: {item.protocol_no ?? '-'} • Hasta: {item.patient_no ?? '-'}</span>
            </span>
            <span className="text-sm text-slate-700">{statusLabel[item.status] ?? item.status}</span>
            <span className="text-sm text-slate-700">{priorityLabel[item.priority]}</span>
            <span className="text-sm text-slate-500">{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
          </Link>
          </RequestLogTarget>
        ))}
        {items.length === 0 && <p className="p-6 text-sm text-slate-500">Bu filtrelerle talep bulunamadı.</p>}
      </section>
    </AppShell>
  );
}
