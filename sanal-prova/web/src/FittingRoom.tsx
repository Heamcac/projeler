import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Box, Check, Image, LoaderCircle, Ruler, ShoppingBag, X } from 'lucide-react';
import { useStore } from './store';
import { api, post, privateImage } from './api';
import { IconButton } from './components';
import type { FitCheck, Product, TryOnJob, Variant } from './types';

const Avatar = lazy(() => import('./Avatar'));
export default function FittingRoom({ product, variant, fit, onClose }: { product: Product; variant: Variant; fit: FitCheck | null; onClose: () => void }) {
  const store = useStore();
  const [mode, setMode] = useState<'ai' | '3d'>('3d'), [job, setJob] = useState<TryOnJob | null>(null), [imageUrl, setImageUrl] = useState(''), [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null), close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!; element.showModal();
    const cancel = (e: Event) => { e.preventDefault(); close.current(); };
    element.addEventListener('cancel', cancel);
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { element.removeEventListener('cancel', cancel); element.close(); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    if (!store.profile) return;
    const controller = new AbortController(); let timeout: ReturnType<typeof setTimeout>; let blobUrl = '';
    setJob(null); setError(''); setImageUrl('');
    const run = async () => {
      const created = await post<{ statusUrl: string }>(`/api/v1/products/${product.product.id}/try-on`, { profileId: store.profile!.id, variantId: variant.id, mode });
      if (controller.signal.aborted) return;
      const poll = async () => {
        if (controller.signal.aborted) return;
        const result = await api<TryOnJob>(created.statusUrl, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setJob(result);
        if (result.status === 'failed') { setError('Prova hazırlanamadı. Yeniden deneyebilirsin.'); return; }
        if (result.status !== 'succeeded') { timeout = setTimeout(() => { void poll().catch(handleError); }, 1400); return; }
        if (result.result?.kind === 'demo') {
          blobUrl = await privateImage(result.result.previewUrl, controller.signal);
          if (controller.signal.aborted) URL.revokeObjectURL(blobUrl); else setImageUrl(blobUrl);
        } else if (result.result?.kind === 'ai') setImageUrl(result.result.imageUrl);
      };
      await poll();
    };
    const handleError = (e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Prova yüklenemedi.'); };
    void run().catch(handleError);
    return () => { controller.abort(); clearTimeout(timeout); if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [mode, product.product.id, variant.id, store.profile?.id, store.profile?.revision, generation]);
  return <dialog ref={dialog} className="fitting-room"><header className="fitting-header"><div><span className="eyebrow">FIT STUDIO</span><h2>Prova odası</h2></div><div className="segmented"><button className={mode === 'ai' ? 'selected' : ''} onClick={() => setMode('ai')}><Image size={17} />2D</button><button className={mode === '3d' ? 'selected' : ''} onClick={() => setMode('3d')}><Box size={17} />3D</button></div><IconButton label="Prova odasını kapat" onClick={onClose}><X size={24} /></IconButton></header>
    <div className="fitting-layout"><div className="fitting-stage">
      {error ? <div className="fitting-loading"><p role="alert">{error}</p><button className="button dark" onClick={() => setGeneration(g => g + 1)}>Tekrar dene</button></div>
        : job?.result?.kind === '3d' ? <Suspense fallback={<div className="fitting-loading"><LoaderCircle className="spin" size={28} />Avatar hazırlanıyor…</div>}><Avatar avatar={job.result.avatar} product={product} variant={variant} /></Suspense>
        : imageUrl ? <img className="fitting-image" src={imageUrl} alt={`${product.media.displayName} prova önizlemesi`} />
        : <div className="fitting-loading"><LoaderCircle className="spin" size={30} /><strong>{job?.status === 'waiting' ? 'Prova görselin hazırlanıyor…' : 'Provan hazırlanıyor…'}</strong></div>}
      <div className="fitting-caption">{mode === '3d' ? 'Şematik avatar. Kumaş fiziği uygulanmaz.' : job?.result?.kind === 'ai' ? 'AI görsel prova' : 'Demo önizleme. Gerçek AI prova değildir.'}</div>
    </div><aside className="fitting-info"><span className="eyebrow">SEÇTİĞİN PARÇA</span><h3>{product.media.displayName}</h3><p>{variant.size} beden · {product.media.tone}</p><hr /><div className="fitting-profile"><Ruler size={18} /><strong>{store.profile?.name}</strong></div><div className="fitting-body-stats">{[['Boy', store.profile?.height], ['Bel', store.profile?.waist], ['Basen', store.profile?.hips], ['İç bacak', store.profile?.inseam]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value} cm</strong></div>)}</div>
      {fit && <div className="fitting-fit"><span>Ölçüye göre uyum</span><strong>%{fit.fit.overallScore}</strong><p>{fit.fit.fitVerdict}</p>{fit.fit.warnings.map(w => <p className="caution-text" key={w}>{w}</p>)}</div>}
      <button className="button dark full" disabled={!variant.stock} onClick={() => store.addToCart(product.product.id, variant.id, variant.stock)}><ShoppingBag size={18} />Sepete ekle</button>
    </aside></div>
  </dialog>;
}
