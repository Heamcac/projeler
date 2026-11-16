import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Heart, LoaderCircle, Minus, Package, Plus, Ruler, Search, ShoppingBag, SlidersHorizontal, Sparkles, Trash2, X } from 'lucide-react';
import { useStore } from './store';
import { api, ApiError, money, post } from './api';
import { EmptyState, IconButton, Modal, ProductCard, ProductImage, ProfileStrip } from './components';
import type { BodyInput, FitCheck, Order, Product, Profile } from './types';
import FittingRoom from './FittingRoom';

export function Collection({ mode = 'all' }: { mode?: 'all' | 'tailored' | 'favorites' }) {
  const store = useStore();
  const [category, setCategory] = useState('all'), [search, setSearch] = useState(''), [sort, setSort] = useState('featured');
  const [matched, setMatched] = useState<string[]>([]), [matching, setMatching] = useState(false), [matchError, setMatchError] = useState('');
  useEffect(() => {
    let active = true;
    setMatched([]); setMatchError('');
    if (mode !== 'tailored' || !store.profile) return;
    setMatching(true);
    const load = async () => {
      const ids = new Set<string>(); let cursor: string | null = null;
      do {
        const page: { items: Array<{ productId: string }>; nextCursor: string | null } = await api(`/api/v1/feed/tailored?profileId=${store.profile!.id}&limit=50${cursor ? `&cursor=${cursor}` : ''}`);
        page.items.forEach(i => ids.add(i.productId)); cursor = page.nextCursor;
      } while (cursor && active);
      if (active) setMatched([...ids]);
    };
    void load().catch(e => { if (active) setMatchError(e instanceof Error ? e.message : 'Uyumlu ürünler yüklenemedi.'); }).finally(() => { if (active) setMatching(false); });
    return () => { active = false; };
  }, [mode, store.profile?.id, store.profile?.revision]);
  let items = store.catalog.filter(p => mode === 'favorites' ? store.favorites.includes(p.product.id) : mode === 'tailored' ? matched.includes(p.product.id) : true);
  items = items.filter(p => (category === 'all' || category === 'denim' ? category !== 'denim' || p.product.name.toLowerCase().includes('denim')
    : category === 'pants' ? p.product.garmentType === 'bottom' && !p.product.name.toLowerCase().includes('denim') : p.product.garmentType === category)
    && p.media.displayName.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')));
  const price = (p: Product) => Math.min(...p.variants.map(v => v.variant.priceCents));
  if (sort === 'price-asc') items.sort((a, b) => price(a) - price(b));
  if (sort === 'price-desc') items.sort((a, b) => price(b) - price(a));
  return <main className="container collection-page">
    <ProfileStrip />
    <div className="collection-heading"><div><span className="eyebrow">FIT STUDIO / {mode === 'favorites' ? 'KAYDETTİKLERİN' : mode === 'tailored' ? 'KİŞİSEL SEÇKİN' : 'KOLEKSİYON'}</span><h1>{mode === 'favorites' ? 'Bir sonraki favorin.' : mode === 'tailored' ? 'Tam sana göre.' : 'Sana uyan parçalar.'}</h1><p>{mode === 'tailored' ? 'Bel ve iç bacak uyumu %90 ve üzeri.' : mode === 'favorites' ? 'Kaydettiğin parçalar bir arada.' : 'Denim, gömlek ve günlük favoriler.'}</p></div>
      <span className="collection-count">{items.length} parça</span></div>
    <div className="catalog-toolbar"><div className="category-tabs" role="tablist" aria-label="Kategoriler">{[['all', 'Tümü'], ['denim', 'Denim'], ['pants', 'Pantolon'], ['top', 'Gömlek'], ['dress', 'Elbise']].map(([value, label]) => <button key={value} role="tab" aria-selected={category === value} className={category === value ? 'selected' : ''} onClick={() => setCategory(value!)}>{label}</button>)}</div>
      <div className="catalog-tools"><label className="search-field"><Search size={17} /><input aria-label="Koleksiyonda ara" placeholder="Koleksiyonda ara" value={search} onChange={e => setSearch(e.target.value)} />{search && <button title="Aramayı temizle" aria-label="Aramayı temizle" onClick={() => setSearch('')}><X size={14} /></button>}</label><label className="sort-select"><SlidersHorizontal size={16} /><select aria-label="Sıralama" value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Öne çıkanlar</option><option value="price-asc">Artan fiyat</option><option value="price-desc">Azalan fiyat</option></select><ChevronDown size={14} /></label></div>
    </div>
    {store.catalogError || matchError ? <EmptyState title="Koleksiyon şu an yüklenemedi."><p>{store.catalogError || matchError}</p><button className="button dark" onClick={() => void store.reloadCatalog()}>Tekrar dene</button></EmptyState>
      : mode === 'tailored' && !store.profile ? <EmptyState title="Önce ölçülerini tanıyalım." icon={<Ruler size={35} />}><Link className="button dark" to="/measurements">Ölçülerimi ekle</Link></EmptyState>
      : (store.loading && !store.catalog.length) || matching ? <div className="product-grid">{Array.from({ length: 4 }, (_, i) => <div className="product-skeleton" key={i}><div /><span /><span /></div>)}</div>
      : items.length ? <div className="product-grid">{items.map(p => <ProductCard key={p.product.id} product={p} />)}</div>
      : <EmptyState title={mode === 'favorites' ? 'Henüz favori bir parçan yok.' : mode === 'tailored' ? 'Bu ölçülere uyan bir parça bulunamadı.' : 'Aradığın parça bulunamadı.'} icon={mode === 'favorites' ? <Heart size={35} /> : <Search size={35} />}><Link className="button outline" to="/">Koleksiyona dön</Link></EmptyState>}
    {store.hasMore && <div className="load-more"><button className="button outline" disabled={store.loading} onClick={() => void store.moreCatalog()}>{store.loading ? 'Yükleniyor…' : 'Daha fazla parça'}</button></div>}
  </main>;
}

export function ProductPage() {
  const { id } = useParams();
  const store = useStore();
  const [product, setProduct] = useState<Product | null>(null), [error, setError] = useState('');
  const [variantId, setVariant] = useState(''), [fit, setFit] = useState<FitCheck | null>(null), [fitError, setFitError] = useState('');
  const [fitLoading, setFitLoading] = useState(false), [fitting, setFitting] = useState(false), [tab, setTab] = useState('fabric');
  const manuallyChosen = useRef(false);
  useEffect(() => {
    let active = true; setProduct(null); setError(''); manuallyChosen.current = false;
    void api<Product>(`/api/v1/products/${id}`).then(p => { if (active) { setProduct(p); setVariant(p.variants.find(v => v.variant.stock > 0)?.variant.id ?? p.variants[0]?.variant.id ?? ''); } }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);
  useEffect(() => {
    let active = true;
    if (!product || !store.profile) { setFit(null); return; }
    if (!manuallyChosen.current) void store.getFit(product.product.id).then(best => { if (active) setVariant(best.variantId); }).catch(() => {});
    return () => { active = false; };
  }, [product?.product.id, store.getFit]);
  useEffect(() => {
    let active = true; setFit(null); setFitError('');
    if (product && variantId && store.profile) {
      setFitLoading(true);
      void store.getFit(product.product.id, variantId).then(result => { if (active) setFit(result); })
        .catch(e => { if (active) setFitError(e.message); }).finally(() => { if (active) setFitLoading(false); });
    }
    return () => { active = false; };
  }, [product?.product.id, variantId, store.getFit]);
  if (error) return <main className="container"><EmptyState title="Bu parça bulunamadı."><Link to="/" className="button dark">Koleksiyona dön</Link></EmptyState></main>;
  if (!product) return <main className="container page-loading"><LoaderCircle className="spin" />Parça yükleniyor…</main>;
  const selected = product.variants.find(v => v.variant.id === variantId);
  const variant = selected?.variant;
  const colors = [...new Set(product.variants.map(v => v.variant.color))];
  const colorValues: Record<string, string> = { blue: '#355977', black: '#242a28', white: '#f5f3ef', green: '#558069', red: '#a65b61', gray: '#959a97', navy: '#293d54' };
  const sizes = product.variants.filter(v => v.variant.color === variant?.color);
  const favorite = store.favorites.includes(product.product.id);
  return <main className="container product-page"><Link className="back-link" to="/"><ArrowLeft size={16} />Koleksiyon</Link><div className="product-detail-grid">
    <div className="detail-gallery"><div className="detail-image"><ProductImage product={product} variantId={variant?.id} /><span className="gallery-caption">{product.media.representative ? 'Temsili ürün görseli' : variant?.color}</span></div></div>
    <section className="detail-content"><span className="eyebrow">FIT STUDIO</span><h1>{product.media.displayName}</h1><p className="detail-subtitle">{product.media.tone} · {product.product.cut === 'regular' ? 'Regular kesim' : product.product.cut === 'slim' ? 'Slim kesim' : 'Rahat kesim'}</p><strong className="detail-price">{money(variant?.priceCents ?? 0, variant?.currency)}</strong>
      <div className="size-heading"><strong>Beden</strong><Link to="/measurements" className="text-link"><Ruler size={15} />Ölçülerim</Link></div>
      <div className="sizes" role="group" aria-label="Beden seçimi">{sizes.map(v => <button key={v.variant.id} className={v.variant.id === variantId ? 'selected' : ''} disabled={!v.variant.stock} aria-pressed={v.variant.id === variantId} onClick={() => { manuallyChosen.current = true; setVariant(v.variant.id); }}>{v.variant.size}</button>)}</div>
      {colors.length > 1 && <div className="color-options" role="group" aria-label="Renk seçimi">{colors.map(color => <button key={color} className={variant?.color === color ? 'selected' : ''} aria-pressed={variant?.color === color} title={color} aria-label={`${color} rengi`} style={{ background: colorValues[color.toLowerCase()] ?? '#83938b' }} onClick={() => {
        const next = product.variants.find(v => v.variant.color === color && v.variant.size === variant?.size && v.variant.stock > 0)
          ?? product.variants.find(v => v.variant.color === color && v.variant.stock > 0) ?? product.variants.find(v => v.variant.color === color);
        if (next) { manuallyChosen.current = true; setVariant(next.variant.id); }
      }} />)}</div>}
      <div className="fit-panel"><div className="fit-panel-heading"><Ruler size={20} /><strong>{store.profile ? `${store.profile.name} için uyum` : 'Sana nasıl uyacak?'}</strong>{fit && <span className={fit.fit.overallScore >= 90 ? 'good-text' : 'caution-text'}>%{fit.fit.overallScore}</span>}</div>
        {store.profile ? fitLoading ? <p className="muted"><LoaderCircle size={16} className="spin" />Uyum hesaplanıyor…</p> : fit ? <><p className="fit-verdict">{fit.fit.fitVerdict}</p><div className="dimension-list">{fit.fit.dimensions.map(d => <div key={d.dimension}><span>{dimensionLabel[d.dimension]}</span><span className={d.score >= 90 ? 'good-text' : 'caution-text'}>{statusLabel[d.status]}</span><div className="dimension-track"><i style={{ width: `${d.score}%`, background: d.score >= 90 ? 'var(--green)' : 'var(--amber)' }} /></div></div>)}</div>
          {fit.fit.recommendedVariantId && fit.fit.recommendedVariantId !== variantId && <button className="text-link good-text" onClick={() => { manuallyChosen.current = true; setVariant(fit.fit.recommendedVariantId!); }}>{fit.fit.recommendedSize} bedeni seç<ArrowUpRight size={16} /></button>}</> : <p className="form-error">{fitError}</p>
          : <Link className="text-link" to="/measurements">Ölçülerimi ekle<ArrowUpRight size={16} /></Link>}
      </div>
      <div className="purchase-actions"><button className="button dark" disabled={!variant?.stock} onClick={() => variant && store.addToCart(product.product.id, variant.id, variant.stock)}><ShoppingBag size={18} />{variant?.stock ? 'Sepete ekle' : 'Stokta yok'}</button><IconButton label={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'} className={favorite ? 'favorite-detail active' : 'favorite-detail'} onClick={() => store.toggleFavorite(product.product.id)}><Heart size={21} fill={favorite ? 'currentColor' : 'none'} /></IconButton></div>
      <button className="button outline full try-on-button" disabled={!variant} onClick={() => { if (!store.user) store.openAuth(); else if (!store.profile) store.notify('Prova için önce ölçü profili oluştur.'); else setFitting(true); }}><Sparkles size={18} />Prova odasına gir</button>
      <div className="detail-tabs" role="tablist" aria-label="Ürün bilgisi"><button role="tab" aria-selected={tab === 'fabric'} onClick={() => setTab('fabric')}>Kumaş & kesim</button><button role="tab" aria-selected={tab === 'measurements'} onClick={() => setTab('measurements')}>Ürün ölçüleri</button></div>
      {tab === 'fabric' ? <div className="fabric-info">{[[product.fabric.cottonPct, 'Pamuk'], [product.fabric.elastanePct, 'Elastan'], [product.fabric.polyesterPct, 'Polyester'], [product.fabric.otherPct, 'Diğer']].filter(([value]) => Number(value) > 0).map(([value, label]) => <div key={label}><span>{label}</span><strong>%{value}</strong></div>)}<div><span>Ölçülmüş esneme</span><strong>%{Math.round(product.fabric.elasticityRatio * 100)}</strong></div></div>
        : <div className="fabric-info">{Object.entries(selected?.measurements ?? {}).filter(([key, value]) => key in dimensionLabel && typeof value === 'number').map(([key, value]) => <div key={key}><span>{dimensionLabel[key]}</span><strong>{value} cm</strong></div>)}</div>}
    </section></div>
    {fitting && variant && <FittingRoom product={product} variant={variant} fit={fit} onClose={() => setFitting(false)} />}
  </main>;
}
export const dimensionLabel: Record<string, string> = { waist: 'Bel', hips: 'Basen', chest: 'Göğüs', inseam: 'İç bacak', outseam: 'Dış bacak', shoulderWidth: 'Omuz genişliği', totalLength: 'Toplam boy', hemWidth: 'Paça genişliği' };
const statusLabel: Record<string, string> = { ideal: 'Tam uyum', loose: 'Hafif bol', tight: 'Dar gelebilir', long: 'Tadilat gerekebilir', short: 'Kısa gelebilir' };

const bodyFields = [
  ['height', 'Boy', 'cm', 80, 250], ['weight', 'Kilo', 'kg', 15, 350], ['chest', 'Göğüs çevresi', 'cm', 30, 250],
  ['waist', 'Bel çevresi', 'cm', 25, 250], ['hips', 'Basen çevresi', 'cm', 30, 250], ['inseam', 'İç bacak boyu', 'cm', 20, 130],
  ['outseam', 'Dış bacak boyu', 'cm', 20, 250], ['shoulderWidth', 'Omuz genişliği', 'cm', 15, 90],
] as const;
export function Measurements() {
  const store = useStore();
  const [editing, setEditing] = useState<Profile | null>(null), [fresh, setFresh] = useState(false), [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const current = fresh ? null : editing ?? store.profile;
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(bodyFields.map(([key]) => [key, Number(data.get(key))])) as unknown as Omit<BodyInput, 'bodyShapeType'>;
    if (values.outseam < values.inseam || values.outseam > values.height) { setError('Dış bacak boyu, iç bacak boyundan kısa veya boyundan uzun olamaz.'); setBusy(false); return; }
    try {
      const profile = await post<Profile>('/api/v1/profile/measurements', { ...values, name: String(data.get('name')).trim(),
        bodyShapeType: String(data.get('shape')), isDefault: data.get('isDefault') === 'on', ...(current ? { profileId: current.id, expectedRevision: current.revision } : {}) });
      await store.refreshProfiles(profile.id); setEditing(null); setFresh(false); store.notify('Ölçü profilin kaydedildi.');
    } catch (e) { setError(e instanceof ApiError && e.status === 409 ? 'Profilin değişti. Sayfayı yenileyip tekrar kaydet.' : e instanceof Error ? e.message : 'Profil kaydedilemedi.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!current) return;
    setBusy(true); setError('');
    try { await api(`/api/v1/profile/measurements/${current.id}`, { method: 'DELETE' }); await store.refreshProfiles(); setEditing(null); setFresh(false); setConfirmDelete(false); store.notify('Profil silindi.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Profil silinemedi.'); }
    finally { setBusy(false); }
  };
  return <main className="container measurements-page"><div className="page-heading"><span className="eyebrow">SANA ÖZEL</span><h1>Ölçülerim.</h1></div>
    {!store.user ? <EmptyState title="Ölçülerini hesabında sakla." icon={<Ruler size={36} />}><button className="button dark" onClick={store.openAuth}>Giriş yap veya hesap oluştur</button></EmptyState>
      : <div className="measurements-layout"><aside className="profile-sidebar"><h2>Profillerim</h2>{store.profiles.map(p => <button key={p.id} className={!fresh && current?.id === p.id ? 'selected' : ''} onClick={() => { setFresh(false); setEditing(p); store.setProfileId(p.id); setError(''); }}><span>{p.name}{p.isDefault && <small>Varsayılan</small>}</span><Ruler size={17} /></button>)}<button className="new-profile" onClick={() => { setFresh(true); setEditing(null); setError(''); }}><Plus size={17} />Yeni profil</button><div className="profile-side-note"><span>Ölçü birimi</span><strong>Santimetre & kilogram</strong></div></aside>
        <section className="measurement-form-section"><div className="section-heading"><div><h2>{current ? current.name : 'Yeni ölçü profili'}</h2><p>Göğüs, bel ve basen için çevre ölçüsünü gir.</p></div>{current && <IconButton label="Profili sil" onClick={() => setConfirmDelete(true)}><Trash2 size={19} /></IconButton>}</div>
          <form key={current ? `${current.id}-${current.revision}` : 'new'} onSubmit={save} className="measurement-form"><div className="profile-name-row"><label>Profil adı<input name="name" defaultValue={current?.name ?? ''} placeholder="Örn. Kendim" required minLength={1} maxLength={80} /></label><label>Vücut tipi<select name="shape" defaultValue={current?.bodyShapeType ?? 'unspecified'}><option value="unspecified">Belirtmek istemiyorum</option><option value="hourglass">Kum saati</option><option value="pear">Armut</option><option value="apple">Elma</option><option value="rectangle">Dikdörtgen</option><option value="athletic">Atletik</option></select></label></div>
            <div className="measurements-fields">{bodyFields.map(([key, label, unit, min, max]) => <label key={key}>{label}<div className="unit-input"><input name={key} aria-label={label} type="number" inputMode="decimal" step="0.1" required min={min} max={max} defaultValue={current?.[key] ?? ''} /><span>{unit}</span></div></label>)}</div>
            <label className="checkbox-label"><input name="isDefault" type="checkbox" defaultChecked={current?.isDefault ?? !store.profiles.length} />Varsayılan profilim olsun</label>
            {error && <p role="alert" className="form-error">{error}</p>}<div className="form-footer"><Link to="/" className="text-link">Koleksiyona dön</Link><button className="button dark" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}Ölçülerimi kaydet</button></div>
          </form></section></div>}
    {confirmDelete && <Modal title="Bu profil silinsin mi?" onClose={() => setConfirmDelete(false)}><p>Bu profile ait prova sonuçları da silinecek.</p><div className="modal-actions"><button className="button outline" onClick={() => setConfirmDelete(false)}>Vazgeç</button><button className="button danger" disabled={busy} onClick={() => void remove()}>Profili sil</button></div>{error && <p className="form-error">{error}</p>}</Modal>}
  </main>;
}

export function CartPage() {
  const store = useStore(), navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const key = useRef<{ signature: string; value: string } | null>(null);
  const ids = [...new Set(store.cart.map(c => c.productId))].join(',');
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    void Promise.all(ids ? ids.split(',').map(id => api<Product>(`/api/v1/products/${id}`)) : []).then(p => { if (active) setProducts(p); })
      .catch(() => { if (active) setError('Sepetteki bir ürün artık mevcut değil. Sepeti temizleyip yeniden seçebilirsin.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ids]);
  const items = store.cart.map(item => { const product = products.find(p => p.product.id === item.productId); return { ...item, product, variant: product?.variants.find(v => v.variant.id === item.variantId)?.variant }; });
  const total = items.reduce((sum, item) => sum + (item.variant?.priceCents ?? 0) * item.quantity, 0);
  const currencies = new Set(items.map(i => i.variant?.currency).filter(Boolean));
  const mixedCurrencies = currencies.size > 1;
  const canOrder = items.length > 0 && items.every(i => i.variant && i.variant.stock >= i.quantity) && !loading && !mixedCurrencies;
  const checkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!store.user) { store.openAuth(); return; }
    setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    const body = { ...(store.profile ? { profileId: store.profile.id } : {}), items: store.cart.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      shippingAddress: { name: String(data.get('name')).trim(), address: String(data.get('address')).trim(), city: String(data.get('city')).trim(), postalCode: String(data.get('postalCode')).trim() } };
    const signature = JSON.stringify(body);
    if (key.current?.signature !== signature) key.current = { signature, value: crypto.randomUUID() };
    try { await post<Order>('/api/v1/orders', body, { 'Idempotency-Key': key.current.value }); store.clearCart(); await store.reloadCatalog(); store.notify('Siparişin oluşturuldu.'); navigate('/orders'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Sipariş oluşturulamadı.'); }
    finally { setBusy(false); }
  };
  return <main className="container cart-page"><div className="page-heading"><span className="eyebrow">SEÇTİKLERİN</span><h1>Sepetim.<small>{store.cart.reduce((sum, i) => sum + i.quantity, 0)} parça</small></h1></div>
    {!store.cart.length ? <EmptyState title="Sepetin yeni favorilerini bekliyor." icon={<ShoppingBag size={37} />}><Link className="button dark" to="/">Koleksiyona dön</Link></EmptyState>
      : <div className="cart-layout"><section>{loading && <p className="muted">Sepet yükleniyor…</p>}{items.map(item => <div className="cart-item" key={item.variantId}><Link to={`/products/${item.productId}`}>{item.product && <ProductImage product={item.product} />}</Link><div className="cart-item-info"><span className="eyebrow">FIT STUDIO</span><h2>{item.product?.media.displayName ?? 'Ürün yükleniyor'}</h2><p>{item.product?.media.tone} · {item.variant?.size} beden</p>{item.variant && item.quantity > item.variant.stock && <span className="form-error">Yeterli stok yok</span>}<div className="quantity-control"><IconButton label="Adedi azalt" onClick={() => store.changeQuantity(item.variantId, item.quantity - 1)}><Minus size={15} /></IconButton><span>{item.quantity}</span><IconButton label="Adedi artır" onClick={() => { if (item.quantity < Math.min(10, item.variant?.stock ?? 0)) store.changeQuantity(item.variantId, item.quantity + 1); else store.notify('Stok sınırına ulaştın.'); }}><Plus size={15} /></IconButton></div></div><div className="cart-item-end"><IconButton label="Ürünü sepetten çıkar" onClick={() => store.changeQuantity(item.variantId, 0)}><X size={18} /></IconButton><strong>{money((item.variant?.priceCents ?? 0) * item.quantity, item.variant?.currency)}</strong></div></div>)}<Link to="/" className="back-link"><ArrowLeft size={16} />Alışverişe devam et</Link></section>
        <aside className="checkout-section"><h2>Sipariş özeti</h2><div className="summary-row"><span>Ürün toplamı</span><strong>{mixedCurrencies ? 'Farklı para birimleri' : money(total, items[0]?.variant?.currency)}</strong></div><div className="summary-total"><span>Toplam</span><strong>{mixedCurrencies ? '—' : money(total, items[0]?.variant?.currency)}</strong></div>{mixedCurrencies && <p className="form-error">Aynı siparişteki ürünlerin para birimi aynı olmalı.</p>}
          {!store.user ? <button className="button dark full" onClick={store.openAuth}>Devam etmek için giriş yap</button>
            : <form className="form-stack checkout-form" onSubmit={checkout}><h3>Teslimat adresi</h3><label>Ad soyad<input name="name" autoComplete="name" defaultValue={store.user.name} required maxLength={120} /></label><label>Adres<textarea name="address" autoComplete="street-address" required minLength={5} maxLength={500} rows={2} /></label><div className="form-two-cols"><label>Şehir<input name="city" autoComplete="address-level2" required maxLength={100} /></label><label>Posta kodu<input name="postalCode" autoComplete="postal-code" required maxLength={20} /></label></div>{store.demoAccess && <p className="checkout-note">Demo ortamında ödeme alınmaz. Stok 15 dakika ayrılır.</p>}<button className="button dark full" disabled={busy || !canOrder}>{busy && <LoaderCircle size={17} className="spin" />}Sipariş oluştur</button></form>}
          {error && <p className="form-error" role="alert">{error}</p>}{error && <button className="text-link" onClick={store.clearCart}>Sepeti temizle</button>}
        </aside></div>}
  </main>;
}

const orderStatuses = { pending_payment: 'Ödeme bekleniyor', paid: 'Sipariş alındı', shipped: 'Kargoya verildi', delivered: 'Teslim edildi', cancelled: 'İptal edildi' };
export function OrdersPage() {
  const store = useStore();
  const [orders, setOrders] = useState<Order[]>([]), [cursor, setCursor] = useState<string | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [returnItem, setReturnItem] = useState<string | null>(null), [working, setWorking] = useState(false);
  const load = useCallback(async (after?: string) => {
    if (!store.user) return; setLoading(true); setError('');
    try { const page = await api<{ items: Order[]; nextCursor: string | null }>(`/api/v1/orders?limit=20${after ? `&cursor=${after}` : ''}`); setOrders(old => after ? [...old, ...page.items] : page.items); setCursor(page.nextCursor); }
    catch (e) { setError(e instanceof Error ? e.message : 'Siparişler yüklenemedi.'); } finally { setLoading(false); }
  }, [store.user?.id]);
  useEffect(() => { setOrders([]); setCursor(null); void load(); }, [load]);
  const cancel = async (id: string) => { setWorking(true); setError(''); try { await post(`/api/v1/orders/${id}/cancel`, {}); await load(); await store.reloadCatalog(); store.notify('Sipariş iptal edildi.'); } catch (e) { setError(e instanceof Error ? e.message : 'İptal edilemedi.'); } finally { setWorking(false); } };
  const requestReturn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setWorking(true); setError(''); const data = new FormData(event.currentTarget);
    try { await post('/api/v1/returns', { orderItemId: returnItem, reason: String(data.get('reason')), mismatchAreas: data.getAll('area'), comment: String(data.get('comment')) }); setReturnItem(null); await load(); store.notify('İade talebin alındı.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'İade talebi alınamadı.'); } finally { setWorking(false); }
  };
  return <main className="container orders-page"><div className="page-heading"><span className="eyebrow">HESABIM</span><h1>Siparişlerim.</h1></div>
    {!store.user ? <EmptyState title="Siparişlerin hesabında." icon={<Package size={37} />}><button className="button dark" onClick={store.openAuth}>Giriş yap</button></EmptyState>
      : loading && !orders.length ? <div className="page-loading"><LoaderCircle className="spin" />Siparişler yükleniyor…</div> : !orders.length ? <EmptyState title="Henüz bir siparişin yok." icon={<Package size={37} />}><Link className="button dark" to="/">Koleksiyonu keşfet</Link></EmptyState>
      : <div className="orders-list">{orders.map(order => <section className="order-block" key={order.id}><div className="order-heading"><div><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><span>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span></div><span className={`order-status ${order.status}`}>{orderStatuses[order.status]}</span></div>{order.items.map(item => <div className="order-item" key={item.id}><div><h3>{item.productName}</h3><p>{item.size} beden · {item.quantity} adet{item.fitSnapshot ? ` · %${item.fitSnapshot.overallScore} uyum` : ''}</p></div><strong>{money(item.unitPriceCents * item.quantity, order.currency)}</strong>{item.returnStatus ? <span className="muted">İade talebi alındı</span> : order.status === 'delivered' && <button className="text-link" onClick={() => setReturnItem(item.id)}>İade talebi</button>}</div>)}<div className="order-footer"><strong>Toplam {money(order.totalCents, order.currency)}</strong>{order.status === 'pending_payment' && <button className="text-link" disabled={working} onClick={() => void cancel(order.id)}>Siparişi iptal et</button>}</div></section>)}</div>}
    {error && <p className="form-error" role="alert">{error}</p>}{cursor && <div className="load-more"><button className="button outline" disabled={loading} onClick={() => void load(cursor)}>Önceki siparişler</button></div>}
    {returnItem && <Modal title="İade talebi" onClose={() => setReturnItem(null)}><form className="form-stack" onSubmit={requestReturn}><label>İade nedeni<select name="reason" defaultValue="size_mismatch"><option value="size_mismatch">Beden uyumsuzluğu</option><option value="damaged">Hasarlı ürün</option><option value="not_as_described">Açıklamadan farklı</option><option value="other">Diğer</option></select></label><fieldset className="return-areas"><legend>Uyumsuz bölge</legend>{[['waist', 'Bel'], ['hips', 'Basen'], ['chest', 'Göğüs'], ['inseam', 'İç bacak'], ['shoulderWidth', 'Omuz']].map(([value, label]) => <label className="checkbox-label" key={value}><input type="checkbox" name="area" value={value} />{label}</label>)}</fieldset><label>Notun<textarea name="comment" rows={3} maxLength={1000} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button dark" disabled={working}>Talebi gönder</button></form></Modal>}
  </main>;
}
