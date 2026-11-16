import type { ContentType, Fields } from './payloads';
import { builders } from './payloads';
import type { QrOptions } from './qr';

export interface HistoryItem { id: string; type: ContentType; fields: Fields; options: QrOptions; date: string; }
const KEY = 'qr-atolyesi:history:v1';
export const MAX_HISTORY = 8;
function valid(item: unknown): item is HistoryItem {
  if (!item || typeof item !== 'object') return false;
  const x = item as HistoryItem, o = x.options;
  return typeof x.id === 'string' && Object.hasOwn(builders, x.type) && typeof x.date === 'string' && !isNaN(Date.parse(x.date)) && !!x.fields && typeof x.fields === 'object' && Object.values(x.fields).every(v => typeof v === 'string') && !!o &&
    /^#[\da-f]{6}$/i.test(o.foreground) && /^#[\da-f]{6}$/i.test(o.background) && Number.isInteger(o.size) && o.size >= 128 && o.size <= 1024 && Number.isInteger(o.margin) && o.margin >= 0 && o.margin <= 12 && ['L','M','Q','H'].includes(o.level) && ['square','rounded'].includes(o.style) && (!o.logo || /^data:image\/png;base64,[\da-z+/=]+$/i.test(o.logo));
}
export function readHistory(): HistoryItem[] {
  try { const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(parsed) ? parsed.filter(valid).slice(0, MAX_HISTORY) : []; } catch { return []; }
}
export function writeHistory(items: HistoryItem[]): boolean {
  try { if (!items.length) localStorage.removeItem(KEY); else localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_HISTORY))); return true; } catch { return false; }
}
export function preference(key: string, fallback: string) { try { return localStorage.getItem(`qr-atolyesi:${key}`) ?? fallback; } catch { return fallback; } }
export function setPreference(key: string, value: string) { try { localStorage.setItem(`qr-atolyesi:${key}`, value); } catch { /* Session still works without persistence. */ } }
