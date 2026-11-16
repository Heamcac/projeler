/**
 * Bursa – Ankara (D-200 / E90) örnek veri seti.
 *
 * ÖNEMLİ: Bu dosyadaki koordinatlar güzergahı temsil eden YAKLAŞIK ara noktalardır;
 * hız limitleri genel kurallara dayalı örnek değerlerdir; PTS koridorları ve radar
 * noktaları ise GERÇEK denetim noktaları DEĞİLDİR (verified: false).
 * Canlı kullanımdan önce yol geometrisini (ör. OpenStreetMap) ve limit/denetim
 * verilerini resmî kaynaklardan (KGM, EGM Trafik Başkanlığı) doğrulayıp değiştirin.
 */

import type {
  GeoPoint,
  PtsCorridor,
  RadarPoint,
  RoadSegment,
  RoadType,
  SpeedLimitTable,
} from '@/types/traffic';
import { pathLengthKm } from '@/utils/telemetryCalculator';

/* -------------------------------------------------------------------------- */
/*  Yol türüne göre örnek limit tabloları (km/s)                              */
/* -------------------------------------------------------------------------- */

export const DEFAULT_LIMITS: Record<RoadType, SpeedLimitTable> = {
  URBAN: { CAR: 50, BUS: 50, TRUCK: 50 },
  DIVIDED: { CAR: 110, BUS: 90, TRUCK: 85 },
  SINGLE: { CAR: 90, BUS: 80, TRUCK: 70 },
  CURVE: { CAR: 80, BUS: 70, TRUCK: 60 },
  RING_ROAD: { CAR: 90, BUS: 80, TRUCK: 70 },
};

/* -------------------------------------------------------------------------- */
/*  Segmentler (Bursa → Ankara sırasıyla, uç uca bitişik)                     */
/* -------------------------------------------------------------------------- */

const p = (lat: number, lon: number): GeoPoint => ({ lat, lon });

function segment(
  id: string,
  name: string,
  roadType: RoadType,
  path: GeoPoint[],
  note?: string,
  limits: SpeedLimitTable = DEFAULT_LIMITS[roadType],
): RoadSegment {
  return { id, name, roadType, path, limits, note, verified: false };
}

export const D200_SEGMENTS: RoadSegment[] = [
  segment('bursa-cikis', 'Bursa şehir çıkışı', 'URBAN', [
    p(40.1885, 29.061),
    p(40.199, 29.13),
    p(40.196, 29.19),
  ]),
  segment('kestel-gecisi', 'Kestel geçişi', 'URBAN', [
    p(40.196, 29.19),
    p(40.1936, 29.2117),
    p(40.175, 29.245),
  ], 'Meskun mahal geçişi: hız sınırı için levhaları esas alın.'),
  segment('kestel-turankoy', 'Kestel – Turanköy yolu', 'DIVIDED', [
    p(40.175, 29.245),
    p(40.17, 29.285),
  ]),
  segment('turankoy-umitalan', 'Turanköy – Ümitalan yolu', 'DIVIDED', [
    p(40.17, 29.285),
    p(40.167, 29.367),
  ]),
  segment('umitalan-inegol', 'Ümitalan – İnegöl bölünmüş yol', 'DIVIDED', [
    p(40.167, 29.367),
    p(40.11, 29.46),
    p(40.095, 29.49),
  ]),
  segment('inegol-gecisi', 'İnegöl geçişi', 'URBAN', [
    p(40.095, 29.49),
    p(40.078, 29.513),
    p(40.064, 29.55),
  ], 'Meskun mahal: yaya geçidi ve kavşak yoğunluğu yüksek.'),
  segment('inegol-mezitler', 'İnegöl – Mezitler bölünmüş yol', 'DIVIDED', [
    p(40.064, 29.55),
    p(40.03, 29.7),
    p(40.005, 29.83),
  ]),
  segment('mezitler-bogazi', 'Mezitler Boğazı', 'CURVE', [
    p(40.005, 29.83),
    p(39.98, 29.9),
    p(39.95, 29.96),
  ], 'Dar ve virajlı boğaz geçişi; kamyon trafiği yoğun.'),
  segment('bozuyuk', 'Bozüyük geçişi', 'URBAN', [
    p(39.95, 29.96),
    p(39.9066, 30.0417),
    p(39.89, 30.09),
  ]),
  segment('bozuyuk-eskisehir', 'Bozüyük – Eskişehir bölünmüş yol', 'DIVIDED', [
    p(39.89, 30.09),
    p(39.84, 30.3),
    p(39.79, 30.47),
  ]),
  segment('eskisehir-cevre', 'Eskişehir çevre yolu', 'RING_ROAD', [
    p(39.79, 30.47),
    p(39.75, 30.52),
    p(39.735, 30.58),
    p(39.715, 30.65),
  ]),
  segment('eskisehir-sivrihisar', 'Eskişehir – Sivrihisar bölünmüş yol', 'DIVIDED', [
    p(39.715, 30.65),
    p(39.6, 31.0),
    p(39.49, 31.45),
  ]),
  segment('sivrihisar', 'Sivrihisar geçişi', 'URBAN', [
    p(39.49, 31.45),
    p(39.45, 31.54),
    p(39.43, 31.6),
  ]),
  segment('sivrihisar-polatli', 'Sivrihisar – Polatlı bölünmüş yol', 'DIVIDED', [
    p(39.43, 31.6),
    p(39.5, 31.9),
    p(39.56, 32.1),
  ]),
  segment('polatli', 'Polatlı geçişi', 'URBAN', [
    p(39.56, 32.1),
    p(39.577, 32.147),
    p(39.59, 32.2),
  ]),
  segment('polatli-ankara', 'Polatlı – Ankara bölünmüş yol', 'DIVIDED', [
    p(39.59, 32.2),
    p(39.72, 32.45),
    p(39.85, 32.65),
  ]),
  segment('ankara-girisi', 'Ankara girişi', 'URBAN', [
    p(39.85, 32.65),
    p(39.9, 32.75),
    p(39.9334, 32.8597),
  ]),
];

/** Tüm segmentlerin birleştirilmiş, tekrarsız ana güzergah hattı. */
export const D200_ROUTE_PATH: GeoPoint[] = D200_SEGMENTS.flatMap((s, i) =>
  i === 0 ? s.path : s.path.slice(1),
);

/* -------------------------------------------------------------------------- */
/*  Örnek PTS koridorları                                                     */
/* -------------------------------------------------------------------------- */

function corridor(
  id: string,
  name: string,
  segmentId: string,
  path: GeoPoint[],
  limits: SpeedLimitTable,
): PtsCorridor {
  return {
    id,
    name,
    segmentId,
    direction: 'BURSA_TO_ANKARA',
    start: path[0],
    end: path[path.length - 1],
    path,
    lengthKm: pathLengthKm(path),
    limits,
    verified: false,
  };
}

export const D200_PTS_CORRIDORS: PtsCorridor[] = [
  corridor(
    'pts-umitalan-inegol',
    'Ümitalan – İnegöl koridoru (örnek)',
    'umitalan-inegol',
    [p(40.167, 29.367), p(40.11, 29.46)],
    DEFAULT_LIMITS.DIVIDED,
  ),
  corridor(
    'pts-mezitler',
    'Mezitler Boğazı koridoru (örnek)',
    'mezitler-bogazi',
    [p(40.03, 29.7), p(40.005, 29.83), p(39.98, 29.9), p(39.95, 29.96)],
    { CAR: 90, BUS: 80, TRUCK: 70 },
  ),
  corridor(
    'pts-eskisehir-sivrihisar',
    'Eskişehir – Sivrihisar koridoru (örnek)',
    'eskisehir-sivrihisar',
    [p(39.715, 30.65), p(39.6, 31.0), p(39.49, 31.45)],
    DEFAULT_LIMITS.DIVIDED,
  ),
  corridor(
    'pts-polatli-ankara',
    'Polatlı – Ankara koridoru (örnek)',
    'polatli-ankara',
    [p(39.59, 32.2), p(39.72, 32.45), p(39.85, 32.65)],
    DEFAULT_LIMITS.DIVIDED,
  ),
];

/* -------------------------------------------------------------------------- */
/*  Örnek radar / denetim noktaları (gerçek konumlar değildir)                */
/* -------------------------------------------------------------------------- */

const corridorGates: RadarPoint[] = D200_PTS_CORRIDORS.flatMap((c) => [
  {
    id: `${c.id}-entry`,
    kind: 'PTS_ENTRY' as const,
    label: `${c.name} – giriş`,
    position: c.start,
    intensity: 3 as const,
    source: 'SAMPLE' as const,
    verified: false,
  },
  {
    id: `${c.id}-exit`,
    kind: 'PTS_EXIT' as const,
    label: `${c.name} – çıkış`,
    position: c.end,
    intensity: 3 as const,
    source: 'SAMPLE' as const,
    verified: false,
  },
]);

export const D200_RADAR_POINTS: RadarPoint[] = [
  ...corridorGates,
  {
    id: 'fixed-inegol',
    kind: 'FIXED_CAMERA',
    label: 'Sabit kamera (örnek) – İnegöl girişi',
    position: p(40.095, 29.49),
    intensity: 2,
    source: 'SAMPLE',
    verified: false,
  },
  {
    id: 'fixed-bozuyuk',
    kind: 'FIXED_CAMERA',
    label: 'Sabit kamera (örnek) – Bozüyük',
    position: p(39.9066, 30.0417),
    intensity: 2,
    source: 'SAMPLE',
    verified: false,
  },
  {
    id: 'mobile-eskisehir',
    kind: 'MOBILE_ENFORCEMENT_ZONE',
    label: 'Mobil denetim bölgesi (örnek) – Eskişehir çevre yolu',
    position: p(39.735, 30.58),
    intensity: 1,
    source: 'SAMPLE',
    verified: false,
  },
  {
    id: 'mobile-polatli',
    kind: 'MOBILE_ENFORCEMENT_ZONE',
    label: 'Mobil denetim bölgesi (örnek) – Polatlı çıkışı',
    position: p(39.72, 32.45),
    intensity: 2,
    source: 'SAMPLE',
    verified: false,
  },
];

/* -------------------------------------------------------------------------- */
/*  Karayolu yönlendirme (road snapping) ara noktaları                        */
/* -------------------------------------------------------------------------- */

export interface NamedPlace {
  name: string;
  position: GeoPoint;
}

/**
 * Yönlendirme servisine sırayla verilen ara noktalar. Rota bu noktalardan geçmek
 * zorundadır; Kestel → Turanköy → Ümitalan sırası İnegöl Yolu'nu (D-200) sabitler.
 * Turanköy konumu yaklaşıktır (±2 km); haritada rota beklenmedik bir yan yola sapıyorsa
 * bu noktayı D-200 üzerindeki bir koordinatla değiştirin.
 */
export const D200_ROUTING_WAYPOINTS: NamedPlace[] = [
  { name: 'Bursa', position: p(40.1885, 29.061) },
  { name: 'Kestel', position: p(40.1936, 29.2117) },
  { name: 'Turanköy', position: p(40.17, 29.285) },
  { name: 'Ümitalan', position: p(40.167, 29.367) },
  { name: 'İnegöl', position: p(40.078, 29.513) },
  { name: 'Bozüyük', position: p(39.9066, 30.0417) },
  { name: 'Sivrihisar', position: p(39.45, 31.54) },
  { name: 'Polatlı', position: p(39.577, 32.147) },
  { name: 'Ankara', position: p(39.9334, 32.8597) },
];

/** Rotanın mutlaka geçmesi istenen yerler; haritada doğrulama listesi olarak gösterilir. */
export const D200_REQUIRED_PLACES: NamedPlace[] = D200_ROUTING_WAYPOINTS.filter((w) =>
  ['Kestel', 'Turanköy', 'Ümitalan'].includes(w.name),
);
