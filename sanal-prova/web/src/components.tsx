import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, Check, ChevronDown, Heart, LogOut, Menu, Ruler, Search, ShoppingBag, UserRound, X, Shirt, LoaderCircle } from 'lucide-react';
import { useStore } from './store';
import { money } from './api';
import type { FitCheck, Product } from './types';

export function IconButton({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick: () => void; className?: string }) {
  return <button type="button" className={`icon-button ${className}`} title={label} aria-label={label} onClick={onClick}>{children}</button>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const cancel = (event: Event) => { event.preventDefault(); closeRef.current(); };
    element.addEventListener('cancel', cancel);
    return () => { element.removeEventListener('cancel', cancel); element.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className={`modal ${wide ? 'wide' : ''}`} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-heading"><h2>{title}</h2><IconButton label="Kapat" onClick={onClose}><X size={21} /></IconButton></div>{children}
  </dialog>;
}
export function ProductImage({ product, className = '', variantId }: { product: Product; className?: string; variantId?: string }) {
  const [failed, setFailed] = useState(false);
  const url = !product.media.representative && variantId ? product.assets.find(a => a.variantId === variantId && a.type === 'front')?.url ?? product.media.url : product.media.url;
  useEffect(() => setFailed(false), [url]);
  return url && !failed
    ? <img className={`product-photo ${className}`} src={url} alt={product.media.displayName} loading="lazy" onError={() => setFailed(true)} />
    : <div className={`photo-fallback ${className}`}><Shirt size={44} strokeWidth={1} /><span>Görsel mevcut değil</span></div>;
}
export function Header() {
  const store = useStore();
  const [menu, setMenu] = useState(false), [account, setAccount] = useState(false);
  const count = store.cart.reduce((sum, item) => sum + item.quantity, 0);
  return <>
    <div className="announcement"><span>FIT STUDIO</span><span>Örnek koleksiyon</span></div>
    <header className="header">
      <div className="header-inner">
        <Link className="wordmark" to="/" aria-label="Fit Studio ana sayfa">FIT<span>STUDIO</span><i /></Link>
        <nav className="desktop-nav" aria-label="Ana gezinme"><NavLink to="/" end>Koleksiyon</NavLink><NavLink to="/tailored">Bana uyanlar</NavLink><NavLink to="/favorites">Favorilerim</NavLink></nav>
        <div className="header-actions">
          <Link className="icon-button measurements-shortcut" to="/measurements" title="Ölçülerim" aria-label="Ölçülerim"><Ruler size={21} /></Link>
          <div className="account-wrapper"><IconButton label={store.user ? 'Hesabım' : 'Giriş yap'} onClick={() => store.user ? setAccount(!account) : store.openAuth()}><UserRound size={21} />{store.user && <span className="account-dot" />}</IconButton>
            {account && store.user && <div className="account-menu"><strong>{store.user.name}</strong><span>{store.user.email}</span><Link to="/orders" onClick={() => setAccount(false)}>Siparişlerim</Link><Link to="/measurements" onClick={() => setAccount(false)}>Ölçülerim</Link><button onClick={() => { store.logout(); setAccount(false); }}><LogOut size={16} />Çıkış yap</button></div>}
          </div>
          <Link to="/cart" className="icon-button bag-button" title="Sepetim" aria-label={`Sepetim${count ? `, ${count} ürün` : ''}`}><ShoppingBag size={22} />{count > 0 && <span className="bag-count">{count}</span>}</Link>
          <IconButton className="mobile-menu-button" label="Menü" onClick={() => setMenu(!menu)}>{menu ? <X size={22} /> : <Menu size={22} />}</IconButton>
        </div>
      </div>
      {menu && <nav className="mobile-nav" aria-label="Mobil gezinme">{[['/', 'Koleksiyon'], ['/tailored', 'Bana uyanlar'], ['/favorites', 'Favorilerim'], ['/measurements', 'Ölçülerim'], ['/orders', 'Siparişlerim']].map(([url, label]) => <Link key={url} to={url!} onClick={() => setMenu(false)}>{label}</Link>)}</nav>}
    </header>
  </>;
}
export function ProfileStrip() {
  const store = useStore();
  return <section className="profile-strip">
    <div className="profile-intro"><span className="profile-symbol"><Ruler size={23} /></span><div><span className="eyebrow">ÖLÇÜ PROFİLİN</span>{store.profile
      ? <label className="profile-select"><select aria-label="Aktif ölçü profili" value={store.profile.id} onChange={e => store.setProfileId(e.target.value)}>{store.profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><ChevronDown size={16} /></label>
      : <strong>Sana özel bir başlangıç</strong>}</div></div>
    {store.profile ? <><div className="profile-stats">{[['Boy', store.profile.height], ['Bel', store.profile.waist], ['Basen', store.profile.hips], ['İç bacak', store.profile.inseam]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}<small> cm</small></strong></div>)}</div><Link className="text-link" to="/measurements">Ölçülerimi düzenle<ArrowUpRight size={17} /></Link></>
      : <div className="profile-invitation">{store.demoAccess && !store.user && <button className="text-link" onClick={store.openAuth}>Örnek profille keşfet</button>}<Link className="button small dark" to="/measurements"><Ruler size={16} />Ölçülerimi ekle</Link></div>}
  </section>;
}
export function ProductCard({ product }: { product: Product }) {
  const store = useStore();
  const [fit, setFit] = useState<FitCheck | null>(null), [fitError, setFitError] = useState(false);
  useEffect(() => {
    let active = true; setFit(null); setFitError(false);
    if (store.profile) void store.getFit(product.product.id).then(result => { if (active) setFit(result); }).catch(() => { if (active) setFitError(true); });
    return () => { active = false; };
  }, [store.getFit, product.product.id]);
  const inStock = product.variants.filter(v => v.variant.stock > 0);
  const price = product.variants.length ? Math.min(...product.variants.map(v => v.variant.priceCents)) : 0;
  const favorite = store.favorites.includes(product.product.id);
  return <article className="product-card">
    <div className="product-image-area"><Link to={`/products/${product.product.id}`} className="product-image-link"><ProductImage product={product} /></Link>
      <IconButton label={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'} className={favorite ? 'favorite active' : 'favorite'} onClick={() => store.toggleFavorite(product.product.id)}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></IconButton>
      {fit && <span className={`fit-badge ${fit.fit.overallScore >= 90 ? 'good' : 'moderate'}`}><Check size={14} />%{fit.fit.overallScore} uyum</span>}
      {!inStock.length && <span className="sold-out">Tükendi</span>}
    </div>
    <div className="product-meta"><span>{product.product.garmentType === 'bottom' ? 'ALT GİYİM' : product.product.garmentType === 'top' ? 'ÜST GİYİM' : 'ELBİSE'}</span><span>{product.media.tone}</span></div>
    <h3><Link to={`/products/${product.product.id}`}>{product.media.displayName}</Link></h3>
    <div className="product-price-row"><strong>{money(price, product.variants[0]?.variant.currency)}</strong><span className="size-summary">{inStock.map(v => v.variant.size).join(' · ')}</span></div>
    <Link className={`card-fit-line ${fit?.fit.overallScore && fit.fit.overallScore >= 90 ? 'good-text' : ''}`} to={`/products/${product.product.id}`}>
      {store.profile ? fit ? <><span className="mini-dot" />{fit.fit.recommendedSize ? `${fit.fit.recommendedSize} beden öneriliyor` : 'Uyum detaylarını gör'}</> : fitError ? 'Ölçü bilgisi eksik' : <><LoaderCircle size={13} className="spin" />Uyum hesaplanıyor</> : <><Ruler size={15} />Bedenini bul</>}
    </Link>
  </article>;
}
export function AuthDialog() {
  const store = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const submit = async (email: string, password: string, name?: string) => {
    setBusy(true); setError('');
    try { await store.authenticate(email, password, name); }
    catch (e) { setError(e instanceof Error ? e.message : 'Giriş yapılamadı.'); }
    finally { setBusy(false); }
  };
  return <Modal title={mode === 'login' ? 'Yeniden hoş geldin.' : 'FIT STUDIO’ya katıl.'} onClose={store.closeAuth}>
    <div className="segmented auth-tabs"><button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>Giriş yap</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>Hesap oluştur</button></div>
    <form className="form-stack" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(String(data.get('email')), String(data.get('password')), mode === 'register' ? String(data.get('name')) : undefined); }}>
      {mode === 'register' && <label>Adın<input name="name" autoComplete="name" required minLength={1} maxLength={120} /></label>}
      <label>E-posta<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Şifre<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={12} maxLength={128} /></label>
      {mode === 'register' && <p className="muted small-text">Şifren en az 12 karakter olmalı.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button dark full" disabled={busy}>{busy && <LoaderCircle size={18} className="spin" />}{mode === 'login' ? 'Giriş yap' : 'Hesabımı oluştur'}</button>
    </form>
    {store.demoAccess && <><div className="or-divider">veya</div><button className="button outline full" disabled={busy} onClick={() => void submit('customer@demo.local', 'DemoOnly-2026!')}>Demo hesabıyla keşfet</button></>}
  </Modal>;
}
export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return <div className="empty-state">{icon}<h2>{title}</h2>{children}</div>;
}
export function Footer() {
  return <footer className="footer"><span className="footer-logo">FIT STUDIO</span><span>Örnek koleksiyon. Ürün fotoğrafları temsilidir.</span><span>© {new Date().getFullYear()} Fit Studio</span></footer>;
}
