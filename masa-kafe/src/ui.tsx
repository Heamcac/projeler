import { useEffect, useRef, useState, type ReactNode } from 'react'
import { local, money, t, type Key, type Lang } from './i18n'
import { type Category, type Line, type TableStatus } from './mock/mockApi'

export const icons = {
  coffee:'M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9Zm13 1h2a2.5 2.5 0 0 1 0 5h-2M2 21h18M8 3c-2 2 2 3 0 5m5-5c-2 2 2 3 0 5',
  grid:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
  check:'m5 12 4 4L19 6', arrow:'M4 12h15m-6-6 6 6-6 6', chevron:'m9 6 6 6-6 6',
  reset:'M3 12a9 9 0 1 1 3 7m-3-7V5m0 7h7', expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  monitor:'M3 4h18v12H3zm5 16h8m-4-4v4', phone:'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm4 17h2',
  qr:'M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h2v2h-2zm4 4h2v2h-2zm0-5h2v2h-2zm-5 5h2v2h-2z',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-4m-2-12a4 4 0 0 1 0 8',
  receipt:'M5 3l2 1 2-1 3 1 3-1 2 1 2-1v18l-2-1-2 1-3-1-3 1-2-1-2 1zm4 6h6m-6 4h6m-6 4h4',
  clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-16v6l4 2',
  bell:'M18 8a6 6 0 0 0-12 0c0 6-3 7-3 8h18c0-1-3-2-3-8zm-8 12a2 2 0 0 0 4 0',
  cart:'M2 4h3l3 12h11l2-9H6m4 14h.01m7 0h.01',
  play:'M7 4l14 8-14 8z', close:'m6 6 12 12M6 18 18 6', plus:'M12 5v14M5 12h14',
  search:'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm5-2 6 6',
  sound:'M3 9h4l5-4v14l-5-4H3zm13 0a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12',
  muted:'M3 9h4l5-4v14l-5-4H3zm13 1 5 5m0-5-5 5',
  spark:'M12 2c0 7 3 10 10 10-7 0-10 3-10 10 0-7-3-10-10-10 7 0 10-3 10-10z',
  settings:'M3 7h18M3 17h18M8 4v6m8 4v6', package:'M3 6l9-4 9 4v12l-9 4-9-4zm0 0 9 4 9-4m-9 4v12',
  bag:'M5 8h14l2 13H3zm4 0V5a3 3 0 0 1 6 0v3',
  bolt:'M13 2 4 14h7l-1 8 10-12h-7z', layers:'m3 7 9-4 9 4-9 4zm0 5 9 4 9-4M3 17l9 4 9-4',
} as const
export type IconName = keyof typeof icons
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]}/></svg>
}

export const statusMarks: Record<TableStatus, string> = {
  free:'○', active:'●', waiting:'◷', billRequested:'₺', cleaning:'✦', abandoned:'×', merged:'↔',
}

export function Status({ status, lang }: { status: TableStatus; lang: Lang }) {
  return <span className={'status ' + status}><span aria-hidden="true">{statusMarks[status]}</span>{t(lang, status)}</span>
}

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    ref.current?.showModal()
    const report = (event: Event) => setError((event as CustomEvent<string>).detail)
    window.addEventListener('demo-error', report)
    return () => window.removeEventListener('demo-error', report)
  }, [])
  return <dialog ref={ref} className="dialog" onCancel={event => { event.preventDefault(); onClose() }} aria-label={title}>
    <div className="dialog-head"><h2>{title}</h2><button className="icon-button" aria-label={title + ' ×'} onClick={onClose}><Icon name="close"/></button></div>
    {error && <p className="warning" role="alert">{error}</p>}
    {children}
  </dialog>
}

export function LineItems({ lines, lang, tags = false }: { lines: Line[]; lang: Lang; tags?: boolean }) {
  return <ul className="line-items">{lines.map((line, index) => <li key={index}>
    <div><strong>{local(line.title, lang)}</strong>{line.options.length > 0 && <small>{line.options.map(option => t(lang, option)).join(' · ')}</small>}</div>
    {tags && <span className="chip">{t(lang, line.station)}</span>}<span className="tabular">{money(line.price, lang)}</span>
  </li>)}</ul>
}

export function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="field"><span>{title}</span>{children}</label>
}

export function Stat({ label, value, icon, note }: { label: string; value: string | number; icon: IconName; note?: string }) {
  return <div className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={16}/></span></div><strong>{value}</strong>{note && <small>{note}</small>}</div>
}

export function SectionTitle({ eyebrow, title, detail, children }: { eyebrow?: string; title: string; detail?: string; children?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{detail && <p>{detail}</p>}</div>{children}</div>
}

export function CoffeeArt() {
  return <svg className="coffee-art" viewBox="0 0 325 175" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <pattern id="grid-art" width="23" height="23" patternUnits="userSpaceOnUse"><path d="M23 0H0v23" fill="none" stroke="#f6b198" strokeOpacity=".20"/></pattern>
      <radialGradient id="art-grad"><stop stopColor="#b85d48"/><stop offset="1" stopColor="#8d3f30"/></radialGradient>
      <radialGradient id="coffee-grad"><stop stopColor="#bf7d52"/><stop offset=".75" stopColor="#a65936"/><stop offset="1" stopColor="#75402e"/></radialGradient>
    </defs>
    <path fill="url(#art-grad)" d="M0 0h325v175H0z"/><path fill="url(#grid-art)" d="M0 0h325v175H0z"/>
    <g fill="none" stroke="#f4bf9e" opacity=".42"><circle cx="182" cy="94" r="115"/><circle cx="182" cy="94" r="103"/><circle cx="182" cy="94" r="95"/><path d="M5 126h60m214-54h43M56 13v30m243 93v20"/></g>
    <ellipse cx="187" cy="106" rx="79" ry="71" fill="#5a291e" opacity=".26"/>
    <circle cx="179" cy="87" r="69" fill="#e5b491"/><circle cx="179" cy="87" r="64" fill="#f2cfad" stroke="#ffe6ce" strokeWidth="1.4"/>
    <path d="M224 86q35-1 29 18-3 11-30 6" fill="none" stroke="#f9e2c6" strokeWidth="9"/>
    <circle cx="179" cy="87" r="51" fill="#f8e5cc" stroke="#fff3e4" strokeWidth="2"/>
    <circle cx="179" cy="87" r="44" fill="url(#coffee-grad)" stroke="#ad6542" strokeWidth="2"/>
    <path d="M177 117q-1-18-21-28-12-8-6-16 9-10 28 1 16-16 26-8 13 8-3 22-16 13-24 29z" fill="#eac5a0"/>
    <path d="M178 110q12-17 23-24m-22 12q-8-12-24-17m24 9q11-11 21-12m-22 4q-8-8-20-9" fill="none" stroke="#b97750" strokeWidth="2" strokeLinecap="round"/>
    <g fill="none" stroke="#ffdab8" strokeWidth="1.3"><path d="M69 57q0 9-9 9 9 0 9 9 0-9 9-9-9 0-9-9zm213-23q0 6-6 6 6 0 6 6 0-6 6-6-6 0-6-6zM89 130v14m-7-7h14m165 5v10m-5-5h10"/></g>
  </svg>
}

export function ProductArt({ category }: { category: Category }) {
  const shapes: Record<Category, ReactNode> = {
    hot:<><path d="M13 19h19v11a8 8 0 0 1-8 8h-3a8 8 0 0 1-8-8Z" fill="#b15b45"/><path d="M32 22h4a4 4 0 0 1 0 8h-4M8 40h33M19 15c-5-3 5-5 0-9m8 9c-5-3 5-5 0-9" fill="none" stroke="#895340" strokeWidth="2" strokeLinecap="round"/></>,
    cold:<><path d="M14 15h23l-4 25H18z" fill="#d4a176"/><path d="M18 23h15m-12 4 4 4m3-10 3 3m-6-8 5-10h7" stroke="#895340" fill="none" strokeWidth="2"/></>,
    dessert:<><path d="m9 32 28-13 4 8-3 12H10z" fill="#aa5b45"/><path d="m9 31 27-13 5 8-31 7z" fill="#e1a478"/><path d="M11 36h27m-13-13c-5 0-5-7 0-7s5 7 0 7z" stroke="#874530" strokeWidth="2" fill="none"/></>,
    snack:<><path d="M10 29a16 16 0 0 1 32 0zM10 34h32l-3 5H13z" fill="#c88153"/><path d="M10 31h32m-22-8 2 1m6-4 2 1m5 4 2 1" stroke="#895340" strokeWidth="2" strokeLinecap="round"/></>,
    breakfast:<><path d="M7 31q17 8 38 0-2 10-13 10H20Q10 41 7 31z" fill="#b15b45"/><path d="M11 29q3-8 9-7 2-9 9-6 3 2 3 7 6-4 10 6" fill="#d7a47d" stroke="#895340" strokeWidth="2"/></>,
  }
  return <svg className="product-art" viewBox="0 0 52 52" aria-hidden="true">{shapes[category]}</svg>
}
