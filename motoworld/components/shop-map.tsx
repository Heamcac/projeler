"use client";

import { useState } from "react";
import { Button } from "./ui";

export function ShopMap({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return loaded ? <iframe src={src} title="MOTOWORLD harita konumu" loading="lazy" referrerPolicy="no-referrer"
    className="mt-4 h-48 w-full rounded-lg border border-line" /> : <div className="mt-4">
    <Button type="button" variant="secondary" onClick={() => setLoaded(true)}>Google haritasını yükle</Button>
    <p className="mt-1 text-xs text-muted">Harita yüklendiğinde tarayıcınız Google’a bağlanır.</p>
  </div>;
}
