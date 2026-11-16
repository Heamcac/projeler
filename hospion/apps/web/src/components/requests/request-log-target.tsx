'use client';

import Link from 'next/link';
import { History, FileText } from 'lucide-react';
import { KeyboardEvent, MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function RequestLogTarget({ requestId, children, className = '', showButton = true }: {
  requestId: string; children: ReactNode; className?: string; showButton?: boolean;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const logUrl = `/requests/${requestId}/logs`;

  useEffect(() => {
    if (!position) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const close = () => { setPosition(null); returnFocus.current?.focus(); };
    const outside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) close(); };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
        const index = items.indexOf(document.activeElement as HTMLElement);
        items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
      }
      if (event.key === 'Tab') setPosition(null);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [position]);

  function open(x: number, y: number) {
    returnFocus.current = document.activeElement as HTMLElement;
    setPosition({ x: Math.max(8, Math.min(x, window.innerWidth - 224)), y: Math.max(8, Math.min(y, window.innerHeight - 108)) });
  }
  function contextMenu(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    open(event.clientX, event.clientY);
  }
  function keyboardMenu(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    open(bounds.left + 24, bounds.top + 24);
  }

  return (
    <div onContextMenu={contextMenu} onKeyDown={keyboardMenu} data-request-id={requestId} className={`flex min-w-0 items-stretch ${className}`}>
      <div className="min-w-0 flex-1">{children}</div>
      {showButton && <Link href={logUrl} aria-label="Log takibi" title="Log takibi" className="focus-ring flex w-11 shrink-0 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-hospital"><History size={18} /></Link>}
      {position && createPortal(
        <div ref={menuRef} role="menu" aria-label="Talep işlemleri" style={{ left: position.x, top: position.y }} className="fixed z-50 w-52 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          <Link role="menuitem" href={logUrl} onClick={() => setPosition(null)} className="focus-ring flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-800 hover:bg-blue-50"><History size={16} />Log Takibi</Link>
          <Link role="menuitem" href={`/requests/${requestId}`} onClick={() => setPosition(null)} className="focus-ring flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-800 hover:bg-blue-50"><FileText size={16} />Talep Detayı</Link>
        </div>, document.body,
      )}
    </div>
  );
}
