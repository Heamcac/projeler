/**
 * Saf (pure) matematiksel fonksiyonlar. Yan etki, global durum veya DOM erişimi yoktur.
 * Birimler: mesafe = km, süre = saniye, hız = km/s.
 */

import type {
  CorridorMetrics,
  CorridorStatus,
  GeoPoint,
  RoadSegment,
} from '@/types/traffic';

/* -------------------------------------------------------------------------- */
/*  Sabitler                                                                  */
/* -------------------------------------------------------------------------- */

export const EARTH_RADIUS_KM = 6371.0088;

/** Yasal tolerans oranı (limit × 1.10). Mevzuat değişirse tek noktadan güncellenir. */
export const DEFAULT_TOLERANCE_RATIO = 0.1;

/** Önerilen hızdan düşülen güvenlik payı (GPS/hız göstergesi sapmaları için). */
export const DEFAULT_SAFETY_MARGIN_RATIO = 0.02;

/** Ortalama hız hesabı için gereken asgari geçen süre (GPS gürültüsünü önler). */
export const MIN_ELAPSED_FOR_AVERAGE_SEC = 3;

/** Bunun altındaki "önerilen hız" yol güvenliği açısından pratik değildir. */
export const MIN_PRACTICAL_SPEED_KMH = 30;

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;
const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/* -------------------------------------------------------------------------- */
/*  Mesafe ve hız                                                             */
/* -------------------------------------------------------------------------- */

/** İki GPS koordinatı arasındaki büyük daire mesafesi (Haversine), km. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** V_ort = (d / t) * 3600  [km/s]  — d: km, t: sn. */
export function averageSpeedKmh(distanceKm: number, elapsedSec: number): number {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(elapsedSec) || elapsedSec <= 0) return 0;
  return (distanceKm / elapsedSec) * 3600;
}

/** Yasal Tolerans = V_limit * (1 + oran). */
export function toleranceSpeedKmh(
  limitKmh: number,
  toleranceRatio: number = DEFAULT_TOLERANCE_RATIO,
): number {
  return limitKmh * (1 + toleranceRatio);
}

/**
 * Cezasız geçiş için koridorda geçirilmesi gereken minimum süre (sn):
 * t_hedef_min = d_koridor / Yasal Tolerans.
 */
export function minCorridorTimeSec(
  corridorLengthKm: number,
  limitKmh: number,
  toleranceRatio: number = DEFAULT_TOLERANCE_RATIO,
): number {
  const tolerated = toleranceSpeedKmh(limitKmh, toleranceRatio);
  if (tolerated <= 0) return 0;
  return (corridorLengthKm / tolerated) * 3600;
}

/** Ortalama hızı limit ve toleransa göre sınıflandırır. */
export function classifyAverage(
  averageKmh: number,
  limitKmh: number,
  toleranceKmh: number,
): CorridorStatus {
  if (averageKmh > toleranceKmh) return 'CRITICAL';
  if (averageKmh > limitKmh) return 'WARNING';
  return 'SAFE';
}

/* -------------------------------------------------------------------------- */
/*  Koridor değerlendirmesi                                                   */
/* -------------------------------------------------------------------------- */

export interface EvaluateCorridorInput {
  corridorLengthKm: number;
  limitKmh: number;
  distanceCoveredKm: number;
  elapsedSec: number;
  toleranceRatio?: number;
  safetyMarginRatio?: number;
}

/**
 * Koridor içindeki anlık durumu hesaplar.
 *
 * V_onerilen = d_kalan / (t_hedef_min - t_gecen)
 *  - Bu değer, kalan mesafede aşılmaması gereken ORTALAMA hızdır.
 *  - Süre bütçesi bittiyse (t_hedef_min <= t_gecen) ceza riski kalmamıştır;
 *    öneri anlık limite eşitlenir.
 *  - Öneri hiçbir zaman anlık hız limitini aşmaz ve güvenlik payı düşülür.
 */
export function evaluateCorridor(input: EvaluateCorridorInput): CorridorMetrics {
  const toleranceRatio = input.toleranceRatio ?? DEFAULT_TOLERANCE_RATIO;
  const safetyMarginRatio = input.safetyMarginRatio ?? DEFAULT_SAFETY_MARGIN_RATIO;
  const { corridorLengthKm, limitKmh } = input;

  const elapsedSec = Math.max(0, input.elapsedSec);
  const covered = clamp(input.distanceCoveredKm, 0, corridorLengthKm);
  const remaining = corridorLengthKm - covered;
  const completed = remaining <= 1e-6;

  const toleranceKmh = toleranceSpeedKmh(limitKmh, toleranceRatio);
  const targetTimeSec = minCorridorTimeSec(corridorLengthKm, limitKmh, toleranceRatio);
  const timeBudgetRemainingSec = targetTimeSec - elapsedSec;

  const averageKmh =
    elapsedSec >= MIN_ELAPSED_FOR_AVERAGE_SEC ? averageSpeedKmh(covered, elapsedSec) : 0;

  let recommendedSpeedKmh: number | null = null;
  let fineUnavoidable = false;

  if (!completed) {
    const maxAverageForRest =
      timeBudgetRemainingSec > 0
        ? remaining / (timeBudgetRemainingSec / 3600)
        : Number.POSITIVE_INFINITY;

    recommendedSpeedKmh = Math.min(limitKmh, maxAverageForRest * (1 - safetyMarginRatio));
    fineUnavoidable = maxAverageForRest < MIN_PRACTICAL_SPEED_KMH;
  }

  return {
    phase: completed ? 'COMPLETED' : 'ACTIVE',
    status: classifyAverage(averageKmh, limitKmh, toleranceKmh),
    limitKmh,
    toleranceKmh,
    corridorLengthKm,
    distanceCoveredKm: covered,
    distanceRemainingKm: remaining,
    progressRatio: corridorLengthKm > 0 ? covered / corridorLengthKm : 0,
    elapsedSec,
    targetTimeSec,
    timeBudgetRemainingSec,
    timeUsedRatio: targetTimeSec > 0 ? elapsedSec / targetTimeSec : 0,
    averageSpeedKmh: averageKmh,
    recommendedSpeedKmh,
    fineUnavoidable,
  };
}

/* -------------------------------------------------------------------------- */
/*  Hat (polyline) yardımcıları                                               */
/* -------------------------------------------------------------------------- */

export interface PathIndex {
  points: GeoPoint[];
  /** cumulativeKm[i]: başlangıçtan i. noktaya kadar hat mesafesi. */
  cumulativeKm: number[];
  totalKm: number;
}

export interface PathPosition {
  position: GeoPoint;
  headingDeg: number;
  distanceKm: number;
}

export function pathLengthKm(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += haversineKm(points[i - 1], points[i]);
  return total;
}

export function buildPathIndex(points: GeoPoint[]): PathIndex {
  const cumulativeKm: number[] = [0];
  for (let i = 1; i < points.length; i += 1) {
    cumulativeKm.push(cumulativeKm[i - 1] + haversineKm(points[i - 1], points[i]));
  }
  return { points, cumulativeKm, totalKm: cumulativeKm[cumulativeKm.length - 1] ?? 0 };
}

/** Başlangıç → bitiş yönü, derece (0 = kuzey, saat yönünde). */
export function bearingDeg(a: GeoPoint, b: GeoPoint): number {
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Hat üzerinde başlangıçtan `distanceKm` uzaklıktaki noktayı döndürür. */
export function pointAtDistance(index: PathIndex, distanceKm: number): PathPosition {
  const { points, cumulativeKm, totalKm } = index;
  if (points.length === 0) throw new Error('pointAtDistance: boş hat');
  if (points.length === 1) return { position: points[0], headingDeg: 0, distanceKm: 0 };

  const d = clamp(distanceKm, 0, totalKm);

  let lo = 1;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulativeKm[mid] < d) lo = mid + 1;
    else hi = mid;
  }

  const a = points[lo - 1];
  const b = points[lo];
  const span = cumulativeKm[lo] - cumulativeKm[lo - 1];
  const t = span > 0 ? (d - cumulativeKm[lo - 1]) / span : 0;

  return {
    position: { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t },
    headingDeg: bearingDeg(a, b),
    distanceKm: d,
  };
}

/** Bir noktaya en yakın hat köşesinin başlangıçtan uzaklığı (km). */
export function locateDistanceKm(index: PathIndex, point: GeoPoint): number {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  index.points.forEach((p, i) => {
    const d = haversineKm(p, point);
    if (d < bestDist) {
      bestDist = d;
      best = index.cumulativeKm[i];
    }
  });
  return best;
}

/**
 * Nokta ile [a, b] doğru parçası arasındaki en kısa mesafe (km).
 * Kısa mesafelerde yerel düzlem (equirectangular) yaklaşımı yeterince doğrudur.
 */
export function pointToSegmentDistanceKm(p: GeoPoint, a: GeoPoint, b: GeoPoint): number {
  const kmPerDeg = (Math.PI / 180) * EARTH_RADIUS_KM;
  const cosLat = Math.cos(toRad(a.lat));

  const bx = (b.lon - a.lon) * cosLat * kmPerDeg;
  const by = (b.lat - a.lat) * kmPerDeg;
  const px = (p.lon - a.lon) * cosLat * kmPerDeg;
  const py = (p.lat - a.lat) * kmPerDeg;

  const lenSq = bx * bx + by * by;
  const t = lenSq > 0 ? clamp((px * bx + py * by) / lenSq, 0, 1) : 0;
  return Math.hypot(px - t * bx, py - t * by);
}

/** Konuma en yakın yol segmentini bulur; `maxDistanceKm` üstündeyse null (güzergah dışı). */
export function findNearestSegment(
  position: GeoPoint,
  segments: RoadSegment[],
  maxDistanceKm = 1.5,
): { segment: RoadSegment; distanceKm: number } | null {
  let best: { segment: RoadSegment; distanceKm: number } | null = null;

  for (const segment of segments) {
    for (let i = 1; i < segment.path.length; i += 1) {
      const d = pointToSegmentDistanceKm(position, segment.path[i - 1], segment.path[i]);
      if (!best || d < best.distanceKm) best = { segment, distanceKm: d };
    }
  }

  return best && best.distanceKm <= maxDistanceKm ? best : null;
}
