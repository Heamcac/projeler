"use client";

import { useId, useRef, useState } from "react";
import { Card } from "./ui";

export type PriceCategory = {
  id: string; label: string;
  prices: { minPrice: number; maxPrice: number; service: { id: string; name: string } }[];
};

const money = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
export const priceRange = (min: number, max: number) => `${money.format(min)}–${money.format(max)} ₺`;

export function Prices({ categories, notice }: { categories: PriceCategory[]; notice?: string }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const category = categories[active];
  if (!category) return <p className="text-muted">Fiyat bilgisi henüz eklenmedi.</p>;

  return <Card className="overflow-hidden">
    <div role="tablist" aria-label="Motor hacmi" className="flex flex-wrap gap-2 border-b border-line bg-ink/30 p-3 sm:p-4">
      {categories.map(({ id: key, label }, index) => <button key={key} type="button" role="tab"
        ref={(element) => { tabs.current[index] = element; }}
        id={`${id}-tab-${index}`} aria-selected={index === active} aria-controls={`${id}-panel`}
        tabIndex={index === active ? 0 : -1} onClick={() => setActive(index)}
        onKeyDown={(event) => {
          const last = categories.length - 1;
          const next = { ArrowLeft: index === 0 ? last : index - 1, ArrowRight: index === last ? 0 : index + 1, Home: 0, End: last }[event.key];
          if (next === undefined) return;
          event.preventDefault();
          setActive(next);
          tabs.current[next]?.focus();
        }}
        className={`min-h-11 rounded-md px-3 text-xs font-semibold sm:px-4 sm:text-sm ${index === active ? "bg-spark text-ink" : "border border-line text-muted hover:text-paper"}`}>
        {label}
      </button>)}
    </div>
    <div role="tabpanel" tabIndex={0} id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} className="px-4 sm:px-6">
      {category.prices.length ? <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted">
          <tr><th scope="col" className="py-4">Hizmet</th><th scope="col" className="py-4 text-right">Tahmini fiyat</th></tr>
        </thead>
        <tbody>{category.prices.map(({ service, minPrice, maxPrice }) => <tr key={service.id} className="border-t border-line">
          <th scope="row" className="py-3 pr-2 font-medium">{service.name}</th>
          <td className="whitespace-nowrap py-3 text-right font-bold tabular-nums text-spark">{priceRange(minPrice, maxPrice)}</td>
        </tr>)}</tbody>
      </table> : <p className="py-5 text-muted">Bu grupta henüz fiyat yayımlanmadı.</p>}
    </div>
    {notice && <p className="border-t border-line bg-ink/30 p-4 text-xs leading-relaxed text-muted sm:px-6">{notice}</p>}
  </Card>;
}
