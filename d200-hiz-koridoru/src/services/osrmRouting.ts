import type { GeoPoint } from '@/types/traffic';

/**
 * Karayolu yönlendirme istemcisi (OSRM, OpenStreetMap yol verisi).
 *
 * Varsayılan adres OSRM'nin herkese açık demo sunucusudur: ücretsizdir ama garanti
 * ve kota vermez. Üretimde kendi OSRM/Valhalla/GraphHopper sunucunuzu kurun ve
 * .env dosyasında VITE_ROUTING_BASE_URL ile adresi değiştirin, örn:
 *   VITE_ROUTING_BASE_URL=https://routing.ornek.com/route/v1/driving
 */
const DEFAULT_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

interface OsrmRouteResponse {
  code: string;
  message?: string;
  routes?: { geometry: { coordinates: [number, number][] }; distance: number }[];
}

export interface RoadRoute {
  path: GeoPoint[];
  distanceKm: number;
}

/**
 * Verilen ara noktalardan sırayla geçen, yol ağına oturtulmuş rotayı getirir.
 * `continue_straight` ara noktalarda ters yöne dönüşü engeller.
 */
export async function fetchRoadRoute(
  waypoints: GeoPoint[],
  signal?: AbortSignal,
): Promise<RoadRoute> {
  const baseUrl = import.meta.env.VITE_ROUTING_BASE_URL ?? DEFAULT_BASE_URL;
  const coords = waypoints.map((w) => `${w.lon.toFixed(5)},${w.lat.toFixed(5)}`).join(';');
  const url = `${baseUrl}/${coords}?overview=full&geometries=geojson&steps=false&continue_straight=true`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Yönlendirme servisi ${response.status} yanıtı verdi.`);

  const data = (await response.json()) as OsrmRouteResponse;
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) {
    throw new Error(data.message ?? 'Yönlendirme servisi rota üretemedi.');
  }

  return {
    path: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
    distanceKm: route.distance / 1000,
  };
}
