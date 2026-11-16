const TOKEN_KEY = 'fit-studio-session';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export function setToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ code: 'NETWORK_ERROR', message: 'İstek tamamlanamadı.' })) as { code: string; message: string };
    if (response.status === 401 && token) { setToken(null); window.dispatchEvent(new Event('fit-session-expired')); }
    throw new ApiError(response.status, body.code, body.message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function privateImage(path: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${getToken() ?? ''}` }, signal });
  if (!response.ok) throw new Error('Önizleme yüklenemedi.');
  return URL.createObjectURL(await response.blob());
}
export const post = <T>(path: string, body: unknown, headers?: HeadersInit) => api<T>(path, { method: 'POST', body: JSON.stringify(body), headers });
export const money = (cents: number, currency = 'TRY') => new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(cents / 100);
