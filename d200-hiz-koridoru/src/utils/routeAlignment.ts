/**
 * Yol ağına oturtulmuş (road-snapped) rota üzerinde segment ve koridorları hizalayan
 * saf fonksiyonlar. Kaba örnek koordinatlar, rotadaki en yakın köşeye çekilir;
 * böylece koridor giriş/çıkışı ve segment tespiti gerçek yol çizgisi üzerinde çalışır.
 */

import type { GeoPoint, PtsCorridor, RoadSegment } from '@/types/traffic';
import {
  haversineKm,
  pathLengthKm,
  pointToSegmentDistanceKm,
} from '@/utils/telemetryCalculator';

/** `fromIndex` ve sonrasındaki köşeler arasında noktaya en yakın olanın indeksi. */
export function locateForwardIndex(route: GeoPoint[], point: GeoPoint, fromIndex: number): number {
  let best = Math.min(Math.max(0, fromIndex), route.length - 1);
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = best; i < route.length; i += 1) {
    const d = haversineKm(route[i], point);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** Segmentleri rotadan dilimleyerek yeniden çizer; sıra ve ardışıklık korunur. */
export function alignSegmentsToRoute(segments: RoadSegment[], route: GeoPoint[]): RoadSegment[] {
  if (route.length < 2) return segments;

  let startIdx = 0;
  return segments.map((segment, i) => {
    const isLast = i === segments.length - 1;
    const located = locateForwardIndex(route, segment.path[segment.path.length - 1], startIdx);
    const endIdx = isLast ? route.length - 1 : Math.min(route.length - 1, Math.max(startIdx + 1, located));
    const path = route.slice(startIdx, endIdx + 1);
    startIdx = endIdx;
    return { ...segment, path: path.length >= 2 ? path : segment.path };
  });
}

/** Koridorları (Bursa → Ankara sırasıyla verilmiş olmalı) rotaya oturtur ve uzunluğu yeniden hesaplar. */
export function alignCorridorsToRoute(corridors: PtsCorridor[], route: GeoPoint[]): PtsCorridor[] {
  if (route.length < 2) return corridors;

  let from = 0;
  return corridors.map((corridor) => {
    const startIdx = locateForwardIndex(route, corridor.start, from);
    const endIdx = locateForwardIndex(route, corridor.end, Math.min(route.length - 1, startIdx + 1));
    from = endIdx;

    const path = route.slice(startIdx, endIdx + 1);
    if (path.length < 2) return corridor;

    return {
      ...corridor,
      path,
      start: path[0],
      end: path[path.length - 1],
      lengthKm: pathLengthKm(path),
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Rotanın istenen yerlerden geçtiğinin doğrulanması                         */
/* -------------------------------------------------------------------------- */

export interface PlaceCheck {
  name: string;
  /** Rota çizgisine en kısa mesafe (km). */
  distanceKm: number;
  passed: boolean;
}

export function distanceToRouteKm(route: GeoPoint[], point: GeoPoint): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 1; i < route.length; i += 1) {
    const d = pointToSegmentDistanceKm(point, route[i - 1], route[i]);
    if (d < min) min = d;
  }
  return min;
}

export function checkPlaces(
  route: GeoPoint[],
  places: { name: string; position: GeoPoint }[],
  toleranceKm = 2,
): PlaceCheck[] {
  return places.map((place) => {
    const distanceKm = distanceToRouteKm(route, place.position);
    return { name: place.name, distanceKm, passed: distanceKm <= toleranceKm };
  });
}
