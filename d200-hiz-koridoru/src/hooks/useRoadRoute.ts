import { useCallback, useEffect, useState } from 'react';
import type { GeoPoint } from '@/types/traffic';
import { fetchRoadRoute } from '@/services/osrmRouting';

export type RoadRouteStatus = 'loading' | 'road' | 'fallback';

interface State {
  status: RoadRouteStatus;
  route: GeoPoint[];
  error: string | null;
}

const CACHE_PREFIX = 'd200-road-route-v1:';

const cacheKey = (waypoints: GeoPoint[]) =>
  CACHE_PREFIX + waypoints.map((w) => `${w.lat.toFixed(4)},${w.lon.toFixed(4)}`).join(';');

/** Rota her açılışta yeniden istenmesin diye tarayıcıda saklanır (düz sayı dizisi olarak). */
function readCache(key: string): GeoPoint[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const flat = JSON.parse(raw) as number[];
    if (!Array.isArray(flat) || flat.length < 4 || flat.length % 2 !== 0) return null;
    const route: GeoPoint[] = [];
    for (let i = 0; i < flat.length; i += 2) route.push({ lat: flat[i], lon: flat[i + 1] });
    return route;
  } catch {
    return null;
  }
}

function writeCache(key: string, route: GeoPoint[]) {
  try {
    localStorage.setItem(key, JSON.stringify(route.flatMap((p) => [p.lat, p.lon])));
  } catch {
    /* Depolama dolu veya kapalıysa rota her açılışta yeniden istenir. */
  }
}

/**
 * Ara noktalardan geçen karayolu rotasını yönlendirme servisinden alır.
 * Servise ulaşılamazsa `fallback` (kaba çizgi) kullanılır ve status 'fallback' olur.
 */
export function useRoadRoute(waypoints: GeoPoint[], fallback: GeoPoint[]) {
  const key = cacheKey(waypoints);

  const [state, setState] = useState<State>(() => {
    const cached = readCache(key);
    return cached
      ? { status: 'road', route: cached, error: null }
      : { status: 'loading', route: fallback, error: null };
  });

  useEffect(() => {
    if (state.status !== 'loading') return undefined;

    const controller = new AbortController();
    fetchRoadRoute(waypoints, controller.signal)
      .then(({ path }) => {
        writeCache(key, path);
        setState({ status: 'road', route: path, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'fallback',
          route: fallback,
          error: err instanceof Error ? err.message : 'Rota alınamadı.',
        });
      });

    return () => controller.abort();
  }, [state.status, waypoints, fallback, key]);

  const retry = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* yoksay */
    }
    setState({ status: 'loading', route: fallback, error: null });
  }, [key, fallback]);

  return { ...state, retry };
}
