'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { api, priorityLabel, statusLabel } from '@/lib/api';
import { RequestItem } from '@/types';
import { RequestLogTarget } from '@/components/requests/request-log-target';

interface EventItem {
  id: string;
  event_type: string;
  message: string;
  actor_name?: string;
  created_at: string;
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<RequestItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [note, setNote] = useState('');
  const [hbysReference, setHbysReference] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const [request, timeline] = await Promise.all([
      api<RequestItem>(`/requests/${params.id}`),
      api<EventItem[]>(`/requests/${params.id}/events`),
    ]);
    setItem(request);
    setEvents(timeline);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [params.id]);

  async function complete(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    await api(`/requests/${params.id}/complete`, { method: 'POST', body: JSON.stringify({ hbysReference, resultNote: note }) });
    setMessage('Tamamlanma kaydı oluşturuldu.');
    await load();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Talep Detayı</h1>
        <p className="text-sm text-slate-600">Referans, onay geçmişi ve manuel HBYS bilgileri.</p>
      </div>
      {!item ? (
        <p className="text-sm text-slate-500">Yükleniyor...</p>
      ) : (
        <RequestLogTarget requestId={params.id}>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Durum" value={statusLabel[item.status] ?? item.status} />
              <Info label="Öncelik" value={priorityLabel[item.priority]} />
              <Info label="Protokol numarası" value={item.protocol_no ?? '-'} />
              <Info label="Hasta numarası" value={item.patient_no ?? '-'} />
              <Info label="Fatura numarası" value={item.invoice_no ?? '-'} />
              <Info label="Talep sahibi" value={item.created_by_name ?? '-'} />
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">Talep gerekçesi</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{item.description}</p>
            </div>
          </section>
          <aside className="grid gap-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-navy">İşlem zaman çizelgesi</h2>
              <div className="mt-4 grid gap-3">
                {events.map((event) => (
                  <div key={event.id} className="border-l-2 border-hospital pl-3">
                    <p className="text-sm font-medium text-slate-800">{event.message}</p>
                    <p className="text-xs text-slate-500">{event.actor_name ?? 'Sistem'} • {new Date(event.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </section>
            <form onSubmit={complete} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-navy">Manuel HBYS tamamlanma</h2>
              <Field label="HBYS referansı">
                <Input value={hbysReference} onChange={(e) => setHbysReference(e.target.value)} />
              </Field>
              <Field label="İşlem sonucu">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              {message && <p className="text-sm text-mint">{message}</p>}
              <Button>Kaydet</Button>
            </form>
          </aside>
        </div>
        </RequestLogTarget>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
