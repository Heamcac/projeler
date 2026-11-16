import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react';
import type { GeoPoint, PtsCorridor, TelemetrySample } from '@/types/traffic';
import type { RoadRouteStatus } from '@/hooks/useRoadRoute';
import type { PlaceCheck } from '@/utils/routeAlignment';

interface RouteMapProps {
  route: GeoPoint[];
  corridors: PtsCorridor[];
  telemetry: TelemetrySample | null;
  activeCorridorId: string | null;
  routeStatus: RoadRouteStatus;
  routeError: string | null;
  placeChecks: PlaceCheck[];
  /** Haritada işaretlenecek, rotanın geçmesi istenen yerler. */
  places: { name: string; position: GeoPoint }[];
  onRetryRoute: () => void;
}

const point = (p: GeoPoint): L.LatLngTuple => [p.lat, p.lon];

export default function RouteMap({
  route,
  corridors,
  telemetry,
  activeCorridorId,
  routeStatus,
  routeError,
  placeChecks,
  places,
  onRetryRoute,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const positionRef = useRef<L.CircleMarker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);
  const corridorLayersRef = useRef<Map<string, L.Polyline>>(new Map());
  const [follow, setFollow] = useState(false);
  const followRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !route.length) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    mapRef.current = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const routeLine = L.polyline(route.map(point), {
      color: '#7CC4FF',
      weight: 4,
      opacity: 0.85,
      dashArray: routeStatus === 'road' ? undefined : '8 8',
    }).addTo(map);
    places.forEach((place) => {
      L.circleMarker(point(place.position), {
        radius: 6,
        color: '#0C141C',
        weight: 2,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
      })
        .bindTooltip(place.name, { permanent: true, direction: 'top', offset: [0, -6] })
        .addTo(map);
    });
    corridors.forEach((corridor) => {
      const line = L.polyline(corridor.path.map(point), { color: '#FFB020', weight: 6, opacity: 0.9 })
        .bindTooltip(`${corridor.name} · örnek veri`)
        .addTo(map);
      corridorLayersRef.current.set(corridor.id, line);
    });
    map.fitBounds(routeLine.getBounds(), { padding: [24, 24] });
    map.on('dragstart', () => {
      followRef.current = false;
      setFollow(false);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      positionRef.current = null;
      accuracyRef.current = null;
      corridorLayersRef.current.clear();
    };
  }, [route, corridors, places, routeStatus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!telemetry) {
      positionRef.current?.remove();
      positionRef.current = null;
      accuracyRef.current?.remove();
      accuracyRef.current = null;
      return;
    }

    const coords = point(telemetry.position);
    if (positionRef.current) positionRef.current.setLatLng(coords);
    else positionRef.current = L.circleMarker(coords, {
      radius: 9, color: '#FFFFFF', weight: 3, fillColor: '#3DDC97', fillOpacity: 1,
    }).bindTooltip('Güncel konum').addTo(map);

    if (telemetry.source === 'GPS' && telemetry.accuracyM) {
      if (accuracyRef.current) accuracyRef.current.setLatLng(coords).setRadius(telemetry.accuracyM);
      else accuracyRef.current = L.circle(coords, {
        radius: telemetry.accuracyM, color: '#3DDC97', weight: 1, fillOpacity: 0.08,
      }).addTo(map);
    } else {
      accuracyRef.current?.remove();
      accuracyRef.current = null;
    }

    if (followRef.current) map.panTo(coords, { animate: false });
  }, [telemetry]);

  useEffect(() => {
    corridorLayersRef.current.forEach((line, id) => {
      line.setStyle({ color: id === activeCorridorId ? '#3DDC97' : '#FFB020' });
    });
  }, [activeCorridorId]);

  const fitRoute = () => {
    if (mapRef.current && route.length) {
      mapRef.current.fitBounds(L.latLngBounds(route.map(point)), { padding: [24, 24] });
      followRef.current = false;
      setFollow(false);
    }
  };

  const toggleFollow = () => {
    const next = !followRef.current;
    followRef.current = next;
    setFollow(next);
    if (next && telemetry && mapRef.current) mapRef.current.setView(point(telemetry.position), 12);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0C141C]" aria-label="Güzergâh haritası">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="font-semibold">Güzergâh haritası</h2>
          <p className="text-xs text-[#8FA0B0]">
            Mavi: {routeStatus === 'road' ? 'karayolu rotası' : 'yaklaşık rota (kesikli)'} · Sarı: örnek koridor · Yeşil: etkin koridor ve konum
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={fitRoute} className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Rotayı göster</button>
          <button type="button" onClick={toggleFollow} aria-pressed={follow} className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">{follow ? 'Takibi kapat' : 'Konumu takip et'}</button>
        </div>
      </div>
      <div className="space-y-2 px-4 pb-3 text-sm" aria-live="polite">
        {routeStatus === 'loading' && (
          <p className="flex items-center gap-2 text-[#8FA0B0]">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            Rota karayoluna oturtuluyor…
          </p>
        )}
        {routeStatus === 'road' && (
          <p className="flex items-center gap-2 text-[#3DDC97]">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Rota OpenStreetMap yol ağı üzerinde.
          </p>
        )}
        {routeStatus === 'fallback' && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#FFB020]">
            <span className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
              Yönlendirme servisine ulaşılamadı; yaklaşık çizgi gösteriliyor.
            </span>
            <button type="button" onClick={onRetryRoute} className="rounded-md border border-[#FFB020]/50 px-2 py-0.5 hover:bg-[#FFB020]/10">
              Yeniden dene
            </button>
            {routeError && <span className="basis-full text-xs text-[#8FA0B0]">{routeError}</span>}
          </div>
        )}
        {routeStatus === 'road' && placeChecks.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[#C6D2DC]">
            {placeChecks.map((c) => (
              <li key={c.name} className={c.passed ? '' : 'text-[#FF5A5F]'}>
                {c.passed ? '✓' : '✗'} {c.name}
                <span className="text-xs text-[#8FA0B0]"> ({c.distanceKm.toFixed(1)} km)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={containerRef} className="h-[360px] w-full sm:h-[480px]" role="img" aria-label="Bursa Ankara yaklaşık güzergâhı ve örnek hız koridorları" />
    </section>
  );
}
