'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('staff@hospion.local');
  const [password, setPassword] = useState('Demo1234!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(120deg,#f8fbff_0%,#eef4fb_50%,#f7f9fc_100%)] px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8">
          <div className="mb-4 grid size-12 place-items-center rounded-md bg-navy text-white">
            <LockKeyhole size={22} />
          </div>
          <h1 className="text-2xl font-bold text-navy">HOSPİON</h1>
          <p className="mt-1 text-sm text-slate-600">Hastane içi dijital işlem, talep ve onay yönetimi</p>
        </div>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="E-posta">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input className="w-full pl-10" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          </Field>
          <Field label="Parola">
            <Input className="w-full" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </Field>
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Giriş yap'}</Button>
        </form>
        <p className="mt-6 text-xs text-slate-500">Demo ortamı sentetik verilerle çalışır. Gerçek hasta verisi girilmemelidir.</p>
      </section>
    </main>
  );
}
