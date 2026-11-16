'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { api, priorityLabel } from '@/lib/api';

interface OptionItem {
  id?: string;
  code?: string;
  name: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [types, setTypes] = useState<OptionItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    requestType: '',
    departmentId: '',
    protocolNo: '',
    patientNo: '',
    invoiceNo: '',
    reasonCode: 'FATURA_IPTAL',
    description: '',
    priority: 'NORMAL',
  });

  useEffect(() => {
    api<OptionItem[]>('/departments').then(setDepartments).catch(() => setDepartments([]));
    api<OptionItem[]>('/request-types').then((data) => {
      setTypes(data);
      setForm((prev) => ({ ...prev, requestType: data[0]?.code ?? '' }));
    });
  }, []);

  useEffect(() => {
    if (departments[0] && !form.departmentId) setForm((prev) => ({ ...prev, departmentId: departments[0].id ?? '' }));
  }, [departments, form.departmentId]);

  const referenceValid = useMemo(() => Boolean(form.protocolNo.trim() || form.patientNo.trim()), [form.protocolNo, form.patientNo]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!referenceValid) {
      setError('Protokol numarası veya hasta numarasından en az biri girilmelidir.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await api<{ id: string }>('/requests', { method: 'POST', body: JSON.stringify(form) });
      router.push(`/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Yeni Talep</h1>
        <p className="text-sm text-slate-600">Protokol veya hasta numarasından en az biri yeterlidir.</p>
      </div>
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="İşlem türü">
              <Select value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })}>
                {types.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Birim">
              <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Protokol numarası">
              <Input value={form.protocolNo} onChange={(e) => setForm({ ...form, protocolNo: e.target.value })} placeholder="Örn. 00012345" />
            </Field>
            <Field label="Hasta numarası">
              <Input value={form.patientNo} onChange={(e) => setForm({ ...form, patientNo: e.target.value })} placeholder="Örn. 00098765" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Fatura numarası">
              <Input value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} placeholder="Opsiyonel" />
            </Field>
            <Field label="Gerekçe kodu">
              <Input value={form.reasonCode} onChange={(e) => setForm({ ...form, reasonCode: e.target.value })} />
            </Field>
            <Field label="Öncelik">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {Object.entries(priorityLabel).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Açıklama">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Talebin nedenini ve HBYS üzerinde manuel yapılacak işlemi açıklayın." />
          </Field>
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button disabled={saving}>{saving ? 'Gönderiliyor...' : 'Talebi gönder'}</Button>
        </section>
        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-navy">Gönderim özeti</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="text-slate-500">Referans kuralı</dt><dd className={referenceValid ? 'text-mint' : 'text-red-600'}>{referenceValid ? 'Geçerli' : 'Eksik'}</dd></div>
            <div><dt className="text-slate-500">Hasta bilgisi</dt><dd>Bildirim önizlemelerinde gösterilmez.</dd></div>
            <div><dt className="text-slate-500">HBYS durumu</dt><dd>Onay, HBYS’de iptal yapıldığı anlamına gelmez.</dd></div>
          </dl>
        </aside>
      </form>
    </AppShell>
  );
}
