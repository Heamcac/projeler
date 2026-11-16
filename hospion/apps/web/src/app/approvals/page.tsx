'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Check, MessageSquareMore, X } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { api, priorityLabel, statusLabel } from '@/lib/api';
import { RequestItem } from '@/types';
import { RequestLogTarget } from '@/components/requests/request-log-target';

export default function ApprovalsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const data = await api<RequestItem[]>('/approvals/inbox');
    setItems(data);
    setSelected((current) => current ?? data[0] ?? null);
  }

  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function decide(decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') {
    if (!selected) return;
    setMessage('');
    await api(`/requests/${selected.id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason, version: selected.version }),
    });
    setReason('');
    setMessage('Karar kaydedildi.');
    setSelected(null);
    await load();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Ekip Lideri Paneli</h1>
        <p className="text-sm text-slate-600">Yetkili olduğunuz birimlerin bekleyen talepleri.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white">
          {items.map((item) => (
            <RequestLogTarget key={item.id} requestId={item.id} className="border-b border-slate-100">
            <button onClick={() => setSelected(item)} className={`w-full p-4 text-left hover:bg-slate-50 ${selected?.id === item.id ? 'bg-blue-50' : ''}`}>
              <p className="font-medium text-slate-900">{item.request_type_name}</p>
              <p className="text-sm text-slate-500">{item.department_name} • {priorityLabel[item.priority]}</p>
            </button>
            </RequestLogTarget>
          ))}
          {items.length === 0 && <p className="p-5 text-sm text-slate-500">Onay bekleyen talep yok.</p>}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          {!selected ? (
            <p className="text-sm text-slate-500">İncelemek için bir talep seçin.</p>
          ) : (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-navy">{selected.request_type_name}</h2>
                  <p className="text-sm text-slate-500">{statusLabel[selected.status]} • {selected.created_by_name}</p>
                </div>
                <Link href={`/requests/${selected.id}`} className="text-sm font-medium text-hospital">Detaya git</Link>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{selected.description}</p>
              <form
                onSubmit={(event: FormEvent) => {
                  event.preventDefault();
                }}
                className="grid gap-3"
              >
                <Field label="Ret veya ek bilgi gerekçesi">
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                {message && <p className="text-sm text-mint">{message}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => decide('APPROVE')}>
                    <Check size={16} /> Onayla
                  </Button>
                  <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={() => decide('REJECT')}>
                    <X size={16} /> Reddet
                  </Button>
                  <Button type="button" className="bg-warning hover:bg-yellow-700" onClick={() => decide('REQUEST_INFO')}>
                    <MessageSquareMore size={16} /> Ek bilgi iste
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
