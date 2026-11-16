import { Bus, Car, TriangleAlert, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  ROAD_TYPE_LABELS,
  VEHICLE_LABELS,
  VEHICLE_TYPES,
  type RoadSegment,
  type VehicleType,
} from '@/types/traffic';

const VEHICLE_ICONS: Record<VehicleType, LucideIcon> = {
  CAR: Car,
  BUS: Bus,
  TRUCK: Truck,
};

export interface RoadLimitCardProps {
  /** Bulunulan segment; güzergah dışındaysa null. */
  segment: RoadSegment | null;
  vehicleType: VehicleType;
  onVehicleTypeChange: (type: VehicleType) => void;
  currentSpeedKmh?: number;
}

export default function RoadLimitCard({
  segment,
  vehicleType,
  onVehicleTypeChange,
  currentSpeedKmh,
}: RoadLimitCardProps) {
  const limit = segment?.limits[vehicleType] ?? null;
  const overBy =
    limit !== null && currentSpeedKmh !== undefined ? Math.round(currentSpeedKmh - limit) : 0;

  return (
    <section
      aria-label="Yol hız sınırı"
      className="rounded-2xl border border-white/10 bg-[#0C141C] p-5 text-[#E8EEF3]"
    >
      {/* Araç tipi seçimi */}
      <div role="radiogroup" aria-label="Araç tipi" className="grid grid-cols-3 gap-2">
        {VEHICLE_TYPES.map((type) => {
          const Icon = VEHICLE_ICONS[type];
          const selected = type === vehicleType;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onVehicleTypeChange(type)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CC4FF] ${
                selected
                  ? 'border-[#7CC4FF] bg-[#7CC4FF]/10 text-[#E8EEF3]'
                  : 'border-white/10 text-[#8FA0B0] hover:bg-white/5'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {VEHICLE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* Limit levhası ve segment bilgisi */}
      <div className="mt-5 flex items-center gap-5">
        <div
          className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[9px] border-[#D7263D] bg-white text-black"
          role="img"
          aria-label={limit !== null ? `Hız sınırı ${limit} kilometre` : 'Hız sınırı bilinmiyor'}
        >
          <span className="text-5xl font-bold tabular-nums leading-none">{limit ?? '–'}</span>
        </div>

        <div className="min-w-0">
          {segment ? (
            <>
              <p className="text-xl font-semibold leading-snug">{segment.name}</p>
              <p className="mt-1 text-[#C6D2DC]">{ROAD_TYPE_LABELS[segment.roadType]}</p>
              {segment.note && <p className="mt-2 text-sm text-[#8FA0B0]">{segment.note}</p>}
            </>
          ) : (
            <>
              <p className="text-xl font-semibold">Güzergah dışı</p>
              <p className="mt-1 text-[#8FA0B0]">
                D-200 güzergahına yaklaştığınızda bu kart segmenti ve limiti gösterir.
              </p>
            </>
          )}
        </div>
      </div>

      {overBy > 0 && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#FF5A5F]/10 px-3 py-2 text-[#FF5A5F]"
        >
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          Anlık hız, yol limitinin {overBy} km/s üstünde.
        </p>
      )}

      {/* Diğer araç tiplerinin limitleri */}
      {segment && (
        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
          {VEHICLE_TYPES.map((type) => (
            <div key={type} className={type === vehicleType ? '' : 'opacity-60'}>
              <dt className="text-sm text-[#8FA0B0]">{VEHICLE_LABELS[type]}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{segment.limits[type]}</dd>
            </div>
          ))}
        </dl>
      )}

      {segment && !segment.verified && (
        <p className="mt-4 text-xs text-[#8FA0B0]">
          Örnek veri: limitler resmî kaynaktan doğrulanmamıştır. Trafik levhalarına uyun.
        </p>
      )}
    </section>
  );
}
