import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import RoadLimitCard from '@/components/RoadLimitCard';
import SimulationController, {
  type SimulationJumpPoint,
} from '@/components/SimulationController';
import SpeedHUD from '@/components/SpeedHUD';
import RouteMap from '@/components/RouteMap';
import {
  D200_PTS_CORRIDORS,
  D200_REQUIRED_PLACES,
  D200_ROUTE_PATH,
  D200_ROUTING_WAYPOINTS,
  D200_SEGMENTS,
} from '@/data/d200CorridorData';
import { useCorridorTracker } from '@/hooks/useCorridorTracker';
import { useGeolocationTelemetry } from '@/hooks/useGeolocationTelemetry';
import { useRoadRoute } from '@/hooks/useRoadRoute';
import type { TelemetrySample, VehicleType } from '@/types/traffic';
import {
  alignCorridorsToRoute,
  alignSegmentsToRoute,
  checkPlaces,
} from '@/utils/routeAlignment';
import {
  buildPathIndex,
  findNearestSegment,
  locateDistanceKm,
} from '@/utils/telemetryCalculator';

/** Modül seviyesinde sabit: hook bağımlılıkları her render'da değişmesin. */
const ROUTING_POINTS = D200_ROUTING_WAYPOINTS.map((w) => w.position);

export default function Page() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [useRealGps, setUseRealGps] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetrySample | null>(null);

  // Karayoluna oturtulmuş rota; servis yoksa kaba çizgiye düşer.
  const road = useRoadRoute(ROUTING_POINTS, D200_ROUTE_PATH);
  const route = road.route;

  const segments = useMemo(
    () => (road.status === 'road' ? alignSegmentsToRoute(D200_SEGMENTS, route) : D200_SEGMENTS),
    [road.status, route],
  );
  const corridors = useMemo(
    () => (road.status === 'road' ? alignCorridorsToRoute(D200_PTS_CORRIDORS, route) : D200_PTS_CORRIDORS),
    [road.status, route],
  );
  const placeChecks = useMemo(() => checkPlaces(route, D200_REQUIRED_PLACES), [route]);

  const { metrics, activeCorridor, ingest, reset } = useCorridorTracker(corridors, vehicleType);

  const handleSample = useCallback(
    (sample: TelemetrySample) => {
      setTelemetry(sample);
      ingest(sample);
    },
    [ingest],
  );

  const handleReset = useCallback(() => {
    setTelemetry(null);
    reset();
  }, [reset]);

  // Rota değişince (kaba çizgi → karayolu) takip durumunu sıfırla.
  useEffect(() => {
    handleReset();
  }, [route, handleReset]);

  const { error: gpsError } = useGeolocationTelemetry(useRealGps, handleSample);

  const routeIndex = useMemo(() => buildPathIndex(route), [route]);

  // Koridor girişinden 1,5 km önceye atlama noktaları
  const jumpPoints = useMemo<SimulationJumpPoint[]>(
    () =>
      corridors.map((c) => ({
        label: c.name.replace(' (örnek)', ''),
        distanceKm: Math.max(0, locateDistanceKm(routeIndex, c.start) - 1.5),
      })),
    [routeIndex, corridors],
  );

  const segment = useMemo(
    () => (telemetry ? findNearestSegment(telemetry.position, segments)?.segment ?? null : null),
    [telemetry, segments],
  );

  const toggleRealGps = () => {
    handleReset();
    setUseRealGps((v) => !v);
  };

  return (
    <main className="min-h-screen bg-[#070C11] px-4 py-6 text-[#E8EEF3] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">Bursa – Ankara hız koridoru paneli</h1>
          <p className="mt-1 max-w-[60ch] text-[#8FA0B0]">
            D-200 (E90) üzerinde koridor ortalamanızı ve yol limitini canlı izleyin. Veriler örnektir;
            trafik levhalarına ve kolluk talimatlarına her zaman uyun.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <SpeedHUD
              currentSpeedKmh={telemetry?.speedKmh ?? 0}
              corridorName={activeCorridor?.name ?? null}
              metrics={metrics}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((v) => !v)}
            />
            <RoadLimitCard
              segment={segment}
              vehicleType={vehicleType}
              onVehicleTypeChange={setVehicleType}
              currentSpeedKmh={telemetry?.speedKmh}
            />
          </div>

          <div className="space-y-5">
            {!useRealGps && (
              <SimulationController
                key={road.status}
                route={route}
                onTelemetry={handleSample}
                onReset={handleReset}
                jumpPoints={jumpPoints}
              />
            )}

            <section className="rounded-2xl border border-white/10 bg-[#0C141C] p-5">
              <button
                type="button"
                onClick={toggleRealGps}
                aria-pressed={useRealGps}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-[#C6D2DC] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CC4FF]"
              >
                <MapPin className="h-5 w-5" aria-hidden />
                {useRealGps ? 'Simülatöre dön' : 'Gerçek GPS kullan'}
              </button>
              {gpsError && (
                <p role="alert" className="mt-3 text-sm text-[#FF5A5F]">
                  {gpsError}
                </p>
              )}
              {useRealGps && !gpsError && (
                <p className="mt-3 text-sm text-[#8FA0B0]">
                  Konum izleniyor. Sürüş sırasında cihazla etkileşime girmeyin.
                </p>
              )}
            </section>
          </div>
        </div>

        <div className="mt-5">
          <RouteMap
            route={route}
            corridors={corridors}
            telemetry={telemetry}
            activeCorridorId={activeCorridor?.id ?? null}
            routeStatus={road.status}
            routeError={road.error}
            placeChecks={placeChecks}
            places={D200_REQUIRED_PLACES}
            onRetryRoute={road.retry}
          />
        </div>
      </div>
    </main>
  );
}
