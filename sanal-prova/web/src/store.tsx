import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, post, setToken, getToken } from './api';
import type { CartItem, FitCheck, Product, Profile, User } from './types';

interface Store {
  user: User | null; profiles: Profile[]; profile: Profile | null; setProfileId: (id: string) => void;
  catalog: Product[]; loading: boolean; catalogError: string; reloadCatalog: () => Promise<void>;
  moreCatalog: () => Promise<void>; hasMore: boolean;
  authOpen: boolean; openAuth: () => void; closeAuth: () => void;
  demoAccess: boolean; authenticate: (email: string, password: string, name?: string) => Promise<void>; logout: () => void;
  refreshProfiles: (selectId?: string) => Promise<void>; getFit: (productId: string, variantId?: string) => Promise<FitCheck>;
  favorites: string[]; toggleFavorite: (id: string) => void;
  cart: CartItem[]; addToCart: (productId: string, variantId: string, stock: number) => void;
  changeQuantity: (variantId: string, quantity: number) => void; clearCart: () => void;
  notify: (message: string) => void;
}
const Context = createContext<Store | null>(null);
export const useStore = () => { const store = useContext(Context); if (!store) throw new Error('Missing store'); return store; };
function readList<T>(key: string, valid: (item: unknown) => item is T): T[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(value) ? value.filter(valid) : []; }
  catch { return []; }
}
const fits = new Map<string, Promise<FitCheck>>();
export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfile] = useState(sessionStorage.getItem('fit-active-profile') ?? '');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [demoAccess, setDemoAccess] = useState(false);
  const [toast, setToast] = useState('');
  const [favorites, setFavorites] = useState(() => readList('fit-favorites', (i): i is string => typeof i === 'string'));
  const [cart, setCart] = useState(() => readList('fit-cart', (i): i is CartItem => {
    if (!i || typeof i !== 'object') return false;
    const item = i as Partial<CartItem>;
    return typeof item.productId === 'string' && typeof item.variantId === 'string' && Number.isInteger(item.quantity) && item.quantity! > 0 && item.quantity! <= 10;
  }));
  const profile = profiles.find(p => p.id === profileId) ?? profiles.find(p => p.isDefault) ?? profiles[0] ?? null;
  const setProfileId = useCallback((id: string) => { setProfile(id); sessionStorage.setItem('fit-active-profile', id); }, []);
  const notify = useCallback((message: string) => setToast(message), []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { localStorage.setItem('fit-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('fit-favorites', JSON.stringify(favorites)); }, [favorites]);

  const loadCatalog = useCallback(async (after?: string) => {
    setLoading(true); setCatalogError('');
    try {
      const result = await api<{ items: Array<{ id: string }>; nextCursor: string | null }>(`/api/v1/products?limit=20${after ? `&cursor=${after}` : ''}`);
      const details = await Promise.all(result.items.map(item => api<Product>(`/api/v1/products/${item.id}`)));
      const rank: Record<string, number> = { 'Regular Denim': 0, 'Pamuk Gomlek': 1, 'Uzun Pacali Pantolon': 2, 'Regular Elbise': 3 };
      setCatalog(previous => [...(after ? previous : []), ...details].sort((a, b) => (rank[a.product.name] ?? 10) - (rank[b.product.name] ?? 10)));
      setCursor(result.nextCursor);
    } catch (error) { setCatalogError(error instanceof Error ? error.message : 'Koleksiyon yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);
  const refreshProfiles = useCallback(async (selectId?: string) => {
    const result = await api<Profile[]>('/api/v1/profile/measurements');
    setProfiles(result); fits.clear();
    if (selectId) setProfileId(selectId);
  }, [setProfileId]);
  useEffect(() => {
    void loadCatalog();
    void api<{ demoAccess: boolean }>('/api/v1/storefront/config').then(c => setDemoAccess(c.demoAccess)).catch(() => {});
    if (getToken()) void api<User>('/api/v1/auth/me').then(async u => { setUser(u); await refreshProfiles(); }).catch(() => setToken(null));
  }, [loadCatalog, refreshProfiles]);
  const logout = useCallback(() => {
    setToken(null); setUser(null); setProfiles([]); fits.clear(); setProfileId('');
  }, [setProfileId]);
  useEffect(() => {
    const expired = () => { logout(); setAuthOpen(true); notify('Oturumun sona erdi. Yeniden giriş yapabilirsin.'); };
    window.addEventListener('fit-session-expired', expired);
    return () => window.removeEventListener('fit-session-expired', expired);
  }, [logout, notify]);
  const authenticate = async (email: string, password: string, name?: string) => {
    const result = await post<{ accessToken: string; user: User }>(`/api/v1/auth/${name ? 'register' : 'login'}`, { email, password, ...(name ? { name } : {}) });
    setToken(result.accessToken); setUser(result.user); setAuthOpen(false);
    await refreshProfiles();
  };
  const getFit = useCallback((productId: string, variantId?: string) => {
    if (!profile) return Promise.reject(new Error('Önce bir ölçü profili seç.'));
    const key = `${profile.id}-${profile.revision}-${productId}-${variantId ?? 'best'}`;
    let result = fits.get(key);
    if (!result) {
      result = api<FitCheck>(`/api/v1/products/${productId}/fit-check?profileId=${profile.id}${variantId ? `&variantId=${variantId}` : ''}`)
        .catch(error => { fits.delete(key); throw error; });
      fits.set(key, result);
    }
    return result;
  }, [profile?.id, profile?.revision]);
  const addToCart = (productId: string, variantId: string, stock: number) => {
    const current = cart.find(c => c.variantId === variantId)?.quantity ?? 0;
    if (current >= Math.min(10, stock)) { notify('Bu beden için stok sınırına ulaştın.'); return; }
    setCart(previous => previous.some(i => i.variantId === variantId)
      ? previous.map(i => i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i)
      : [...previous, { productId, variantId, quantity: 1 }]);
    notify('Ürün sepetine eklendi.');
  };
  const value: Store = {
    user, profiles, profile, setProfileId, catalog, loading, catalogError, reloadCatalog: () => loadCatalog(),
    moreCatalog: () => loadCatalog(cursor ?? undefined), hasMore: !!cursor, authOpen,
    openAuth: () => setAuthOpen(true), closeAuth: () => setAuthOpen(false), demoAccess, authenticate, logout,
    refreshProfiles, getFit, favorites, toggleFavorite: id => setFavorites(previous => previous.includes(id) ? previous.filter(i => i !== id) : [...previous, id]),
    cart, addToCart, changeQuantity: (id, quantity) => setCart(previous => quantity <= 0 ? previous.filter(i => i.variantId !== id)
      : previous.map(i => i.variantId === id ? { ...i, quantity: Math.min(10, quantity) } : i)),
    clearCart: () => setCart([]), notify,
  };
  return <Context.Provider value={value}>{children}{toast && <div className="toast" role="status">{toast}</div>}</Context.Provider>;
}
