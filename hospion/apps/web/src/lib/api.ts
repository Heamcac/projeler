const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1';

async function csrfToken() {
  const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
  const json = await res.json();
  return json.data?.csrfToken as string | undefined;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method?.toUpperCase() ?? 'GET';
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await csrfToken();
    if (token) headers.set('x-csrf-token', token);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? 'İşlem tamamlanamadı.');
  }
  return json.data as T;
}

export const statusLabel: Record<string, string> = {
  PENDING: 'Bekliyor',
  IN_REVIEW: 'İncelemede',
  INFO_REQUIRED: 'Ek bilgi gerekli',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  IMPLEMENTATION_PENDING: 'HBYS uygulaması bekliyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'Geri çekildi',
};

export const priorityLabel: Record<string, string> = {
  LOW: 'Düşük',
  NORMAL: 'Normal',
  HIGH: 'Yüksek',
  URGENT: 'Acil',
};
