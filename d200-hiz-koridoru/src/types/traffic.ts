/**
 * Akıllı Hız Koridoru (PTS) & Karayolu Hız Sınırları Telemetri Paneli
 * Ortak tip tanımları.
 */

/* -------------------------------------------------------------------------- */
/*  Temel türler                                                              */
/* -------------------------------------------------------------------------- */

export interface GeoPoint {
  lat: number;
  lon: number;
}

export type VehicleType = 'CAR' | 'BUS' | 'TRUCK';

export const VEHICLE_TYPES: readonly VehicleType[] = ['CAR', 'BUS', 'TRUCK'] as const;

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  CAR: 'Otomobil',
  BUS: 'Minibüs / Otobüs',
  TRUCK: 'Kamyon / Tır',
};

export type RoadType = 'URBAN' | 'DIVIDED' | 'SINGLE' | 'CURVE' | 'RING_ROAD';

export const ROAD_TYPE_LABELS: Record<RoadType, string> = {
  URBAN: 'Meskun mahal',
  DIVIDED: 'Bölünmüş yol',
  SINGLE: 'Bölünmemiş yol',
  CURVE: 'Viraj / boğaz geçişi',
  RING_ROAD: 'Çevre yolu',
};

/** Araç tipine göre km/s cinsinden hız limiti tablosu. */
export type SpeedLimitTable = Record<VehicleType, number>;

/* -------------------------------------------------------------------------- */
/*  Yol segmentleri                                                           */
/* -------------------------------------------------------------------------- */

export interface RoadSegment {
  id: string;
  name: string;
  roadType: RoadType;
  /** Segmentin sürüş yönündeki poligon hattı (en az 2 nokta). */
  path: GeoPoint[];
  limits: SpeedLimitTable;
  note?: string;
  /** Resmî kaynaktan doğrulandı mı? Örnek veri için false. */
  verified: boolean;
}

/* -------------------------------------------------------------------------- */
/*  PTS koridorları                                                           */
/* -------------------------------------------------------------------------- */

export type CorridorDirection = 'BURSA_TO_ANKARA' | 'ANKARA_TO_BURSA';

export interface PtsCorridor {
  id: string;
  name: string;
  segmentId: string;
  direction: CorridorDirection;
  start: GeoPoint;
  end: GeoPoint;
  /** Koridor hattı (start ilk, end son nokta). */
  path: GeoPoint[];
  /** Koridor uzunluğu (km) – hat üzerinden hesaplanır. */
  lengthKm: number;
  limits: SpeedLimitTable;
  verified: boolean;
}

/** Ortalama hızın limit ve toleransa göre durumu. */
export type CorridorStatus = 'SAFE' | 'WARNING' | 'CRITICAL';

/** Koridor takibinin evresi. Koridor dışındayken metrik yoktur (null). */
export type CorridorPhase = 'ACTIVE' | 'COMPLETED';

export interface CorridorMetrics {
  phase: CorridorPhase;
  status: CorridorStatus;
  /** Koridor hız limiti (km/s). */
  limitKmh: number;
  /** Yasal tolerans dahil üst sınır (km/s). */
  toleranceKmh: number;
  corridorLengthKm: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  /** 0..1 arası mesafe ilerlemesi. */
  progressRatio: number;
  elapsedSec: number;
  /** Cezasız geçiş için koridorda geçirilmesi gereken minimum süre (sn). */
  targetTimeSec: number;
  /** Cezasız geçiş için kalan süre bütçesi (sn); negatifse bütçe dolmuştur. */
  timeBudgetRemainingSec: number;
  /** 0..1+ arası: elapsed / targetTime. */
  timeUsedRatio: number;
  /** Anlık ortalama hız (km/s). Ölçüm çok kısaysa 0. */
  averageSpeedKmh: number;
  /**
   * Kalan mesafede cezasız çıkış için üst hız önerisi (km/s).
   * Anlık limitle sınırlandırılır ve güvenlik payı içerir. COMPLETED evresinde null.
   */
  recommendedSpeedKmh: number | null;
  /** Kalan mesafede pratikte makul bir hızla ceza riskinden kaçınılamıyorsa true. */
  fineUnavoidable: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Telemetri                                                                 */
/* -------------------------------------------------------------------------- */

export type TelemetrySource = 'GPS' | 'SIMULATOR';

export interface TelemetrySample {
  position: GeoPoint;
  speedKmh: number;
  /** Epoch ms. Simülatörde sanal saat kullanılır. */
  timestampMs: number;
  accuracyM?: number;
  headingDeg?: number;
  source: TelemetrySource;
}

/* -------------------------------------------------------------------------- */
/*  Radar / denetim noktaları                                                 */
/* -------------------------------------------------------------------------- */

export type RadarPointKind =
  | 'FIXED_CAMERA'
  | 'PTS_ENTRY'
  | 'PTS_EXIT'
  | 'MOBILE_ENFORCEMENT_ZONE';

export type EnforcementIntensity = 1 | 2 | 3;

export interface RadarPoint {
  id: string;
  kind: RadarPointKind;
  label: string;
  position: GeoPoint;
  /** 1: düşük, 3: yüksek denetim yoğunluğu. */
  intensity: EnforcementIntensity;
  source: 'SAMPLE' | 'OFFICIAL';
  verified: boolean;
}
