"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Field } from "@/components/ui";

const ActiveCategory = createContext("");

export function PriceColumns({ groups, children }: { groups: { id: string; label: string }[]; children: ReactNode }) {
  const [active, setActive] = useState(groups[0]?.id ?? "");
  return <ActiveCategory.Provider value={active}>
    <div className="mb-4 max-w-sm lg:hidden">
      <Field title="Düzenlenecek CC grubu">
        <select value={active} onChange={(event) => setActive(event.target.value)} className="input">
          {groups.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </Field>
    </div>
    {children}
  </ActiveCategory.Provider>;
}

export function PriceColumn({ id, children }: { id: string; children: ReactNode }) {
  const active = useContext(ActiveCategory);
  return <div className={`min-w-0 ${active === id ? "" : "hidden lg:block"}`}>{children}</div>;
}
