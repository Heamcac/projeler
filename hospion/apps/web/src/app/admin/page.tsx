'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { api } from '@/lib/api';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

interface DepartmentRow {
  id: string;
  name: string;
  isActive: boolean;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);

  useEffect(() => {
    api<UserRow[]>('/admin/users').then(setUsers).catch(() => setUsers([]));
    api<DepartmentRow[]>('/admin/departments').then(setDepartments).catch(() => setDepartments([]));
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Yönetici Paneli</h1>
        <p className="text-sm text-slate-600">Kullanıcı, rol, birim ve lider atama yönetimi.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-navy">Kullanıcılar</h2></div>
          {users.map((user) => (
            <div key={user.id} className="border-b border-slate-100 px-5 py-4">
              <p className="font-medium text-slate-900">{user.fullName}</p>
              <p className="text-sm text-slate-500">{user.email} • {user.roles.join(', ')}</p>
            </div>
          ))}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-navy">Birimler</h2></div>
          {departments.map((department) => (
            <div key={department.id} className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <p className="font-medium text-slate-900">{department.name}</p>
              <span className="text-sm text-slate-500">{department.isActive ? 'Aktif' : 'Pasif'}</span>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
