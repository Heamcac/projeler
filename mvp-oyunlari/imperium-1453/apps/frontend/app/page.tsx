"use client";

import { Castle, Coins, Flag, ShipWheel, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { Faction, Province } from "@imperium/shared";
import { StrategyMap } from "../components/StrategyMap";
import { factions, provinces } from "../lib/seed-data";

export default function Home() {
  const [selectedFactionId, setSelectedFactionId] = useState("ottomans");
  const [selectedProvince, setSelectedProvince] = useState<Province>(provinces[0]);

  const selectedFaction = useMemo(
    () => factions.find((faction) => faction.id === selectedFactionId) as Faction,
    [selectedFactionId],
  );

  return (
    <main className="min-h-screen bg-parchment">
      <header className="border-b border-black/10 bg-ink px-5 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Imperium 1453</h1>
            <p className="text-sm text-white/70">6 Nisan 1453 - Konstantinopolis kuşatma altında</p>
          </div>
          <select
            value={selectedFactionId}
            onChange={(event) => setSelectedFactionId(event.target.value)}
            className="h-10 rounded border border-white/20 bg-white/10 px-3 text-sm text-white"
            aria-label="Fraksiyon seç"
          >
            {factions.map((faction) => (
              <option key={faction.id} value={faction.id} className="text-ink">
                {faction.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[260px_1fr_320px]">
        <aside className="rounded border border-black/10 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Flag className="h-5 w-5 text-wine" />
            <h2 className="text-base font-semibold">{selectedFaction.name}</h2>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Metric icon={<Coins className="h-4 w-4" />} label="Hazine" value={selectedFaction.treasury} />
            <Metric icon={<Users className="h-4 w-4" />} label="İnsan gücü" value={selectedFaction.manpower} />
            <Metric icon={<Castle className="h-4 w-4" />} label="Prestij" value={selectedFaction.prestige} />
            <Metric icon={<ShipWheel className="h-4 w-4" />} label="Erzak" value={selectedFaction.foodStockpile} />
          </dl>
          <div className="mt-5 border-t border-black/10 pt-4 text-sm">
            <p className="font-medium">Hareket komutu</p>
            <p className="mt-1 text-ink/70">Seçili eyaletin komşuları hareket hedefi olarak hazırlanır.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedProvince.neighbors.map((neighborId) => (
                <span key={neighborId} className="rounded border border-black/10 px-2 py-1 text-xs">
                  {provinces.find((province) => province.id === neighborId)?.name ?? neighborId}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="h-[68vh] min-h-[520px] overflow-hidden rounded border border-black/10 bg-[#c8d8d6] shadow-sm">
          <StrategyMap
            provinces={provinces}
            factions={factions}
            selectedProvinceId={selectedProvince.id}
            onSelectProvince={setSelectedProvince}
          />
        </section>

        <aside className="rounded border border-black/10 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Castle className="h-5 w-5 text-brass" />
            <h2 className="text-base font-semibold">{selectedProvince.name}</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Detail label="Arazi" value={selectedProvince.terrain} />
            <Detail label="Sahip" value={nameOf(selectedProvince.ownerFactionId)} />
            <Detail label="Kontrol" value={nameOf(selectedProvince.controllerFactionId)} />
            <Detail label="Nüfus" value={selectedProvince.population.toLocaleString("tr-TR")} />
            <Detail label="Vergi" value={selectedProvince.taxIncome} />
            <Detail label="Gıda" value={selectedProvince.foodProduction} />
            <Detail label="Kale" value={selectedProvince.fortLevel} />
            <Detail label="Liman" value={selectedProvince.portLevel} />
            <Detail label="Ticaret" value={selectedProvince.tradeValue} />
            <Detail label="Kültür" value={selectedProvince.culture} />
            <Detail label="Din" value={selectedProvince.religion} />
          </dl>
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded border border-black/10 p-3">
      <dt className="flex items-center gap-1 text-xs text-ink/65">{icon}{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value.toLocaleString("tr-TR")}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-2">
      <dt className="text-ink/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function nameOf(factionId: string) {
  return factions.find((faction) => faction.id === factionId)?.name ?? factionId;
}
