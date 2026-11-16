'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, History, RefreshCw, Search } from 'lucide-react';
import { Field, Input, Select } from '@/components/ui/field';
import { api, statusLabel } from '@/lib/api';
import { eventLabels, RequestLogResult, roleLabels } from '@/lib/request-logs';

export function RequestLogView({ requestId }: { requestId?: string }) {
  const [filters, setFilters] = useState({ search: '', eventType: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<RequestLogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (requestId) params.set('requestId', requestId);
    if (filters.search) params.set('search', filters.search);
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.from) params.set('from', new Date(`${filters.from}T00:00:00`).toISOString());
    if (filters.to) {
      const end = new Date(`${filters.to}T00:00:00`);
      end.setDate(end.getDate() + 1);
      params.set('to', end.toISOString());
    }
    api<RequestLogResult>(`/request-logs?${params}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((err: unknown) => { if (!controller.signal.aborted) { setData(null); setError(err instanceof Error ? err.message : 'Kayıtlar alınamadı.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [requestId, filters, page, refresh]);

  function change(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }
  const iconButton = 'focus-ring grid size-10 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {requestId && <Link href={`/requests/${requestId}`} className="mb-2 inline-flex items-center gap-1 text-sm text-hospital"><ArrowLeft size={15} />Talep Detayı</Link>}
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy"><History size={24} />Log Takibi</h1>
          {requestId && <p className="mt-1 break-all text-xs text-slate-500">Talep #{requestId.slice(0, 8)}</p>}
        </div>
        <button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading} title="Kayıtları yenile" aria-label="Kayıtları yenile" className={iconButton}><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_200px_170px_170px]">
        <Field label="Ara">
          <div className="relative"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><Input value={filters.search} onChange={(e) => change('search', e.target.value)} placeholder="Referans, kullanıcı veya gerekçe" className="w-full pl-10" /></div>
        </Field>
        <Field label="İşlem"><Select value={filters.eventType} onChange={(e) => change('eventType', e.target.value)}><option value="">Tüm işlemler</option>{Object.entries(eventLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</Select></Field>
        <Field label="Başlangıç tarihi"><Input type="date" value={filters.from} onChange={(e) => change('from', e.target.value)} /></Field>
        <Field label="Bitiş tarihi"><Input type="date" value={filters.to} onChange={(e) => change('to', e.target.value)} /></Field>
      </div>
      <div aria-live="polite" aria-busy={loading} className="border-y border-slate-200 bg-white">
        {error ? <p role="alert" className="p-5 text-sm text-red-700">{error}</p> : loading ? <p className="p-5 text-sm text-slate-500">Kayıtlar yükleniyor...</p> : !data?.items.length ? <p className="p-5 text-sm text-slate-500">Bu filtrelerle işlem kaydı bulunamadı.</p> : <>
          <div className="hidden grid-cols-[145px_160px_160px_minmax(0,1fr)] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 xl:grid"><span>Tarih / Saat</span><span>Kullanıcı</span><span>İşlem</span><span>Talep / Gerekçe</span></div>
          {data.items.map((event) => (
            <article key={event.id} className="grid min-w-0 gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 xl:grid-cols-[145px_160px_160px_minmax(0,1fr)] xl:gap-4">
              <time dateTime={event.created_at} className="text-xs leading-5 text-slate-500">{new Date(event.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
              <div className="min-w-0"><p className="break-words text-sm font-medium text-slate-800">{event.actor_name}</p><p className="mt-1 text-xs text-slate-500">{event.actor_roles.map((role) => roleLabels[role] ?? role).join(', ')}</p></div>
              <div><p className={`text-sm font-semibold ${event.event_type === 'DECISION_REJECT' ? 'text-red-700' : event.event_type === 'DECISION_APPROVE' || event.event_type === 'REQUEST_COMPLETED' ? 'text-emerald-700' : 'text-slate-800'}`}>{eventLabels[event.event_type] ?? event.event_type}</p>{event.metadata.version && <p className="mt-1 text-xs text-slate-500">Sürüm {event.metadata.version}</p>}</div>
              <div className="min-w-0 break-words text-sm">
                <Link href={`/requests/${event.request_id}`} className="font-medium text-hospital hover:underline">{event.request_type_name} · #{event.request_id.slice(0, 8)}</Link>
                <p className="mt-1 text-xs text-slate-500">{event.department_name} · Protokol: {event.protocol_no ?? '-'} · Hasta: {event.patient_no ?? '-'}</p>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">{event.message}</p>
                {event.metadata.toStatus && <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">{event.metadata.fromStatus && <>{statusLabel[event.metadata.fromStatus] ?? event.metadata.fromStatus}<ArrowRight size={12} /></>}{statusLabel[event.metadata.toStatus] ?? event.metadata.toStatus}</p>}
                {event.metadata.hbysReference && <p className="mt-2 text-xs text-slate-500">HBYS referansı: {event.metadata.hbysReference}</p>}
                {event.metadata.resultNote && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{event.metadata.resultNote}</p>}
              </div>
            </article>
          ))}
        </>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{data?.total ? `${(page - 1) * data.pageSize + 1}-${Math.min(page * data.pageSize, data.total)} / ${data.total} kayıt` : '0 kayıt'}</span>
        <div className="flex items-center gap-2"><button title="Önceki sayfa" aria-label="Önceki sayfa" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} className={iconButton}><ChevronLeft size={18} /></button><span>{page}</span><button title="Sonraki sayfa" aria-label="Sonraki sayfa" disabled={loading || !data || page * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)} className={iconButton}><ChevronRight size={18} /></button></div>
      </div>
    </div>
  );
}
