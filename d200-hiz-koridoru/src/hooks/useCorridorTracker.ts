import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CorridorMetrics,
  GeoPoint,
  PtsCorridor,
  TelemetrySample,
  VehicleType,
} from '@/types/traffic';
import {
  evaluateCorridor,
  haversineKm,
  pointToSegmentDistanceKm,
} from '@/utils/telemetryCalculator';

/** Koridor başlangıcına bu kadar yaklaşan hat, girişi tetikler (km). */
const ENTRY_RADIUS_KM = 0.06;
/** GPS titremesini elemek için asgari adım (km) ve hız (km/s). */
const MIN_STEP_KM = 0.002;
const MIN_MOVING_SPEED_KMH = 1;

interface ActiveRun {
  corridor: PtsCorridor;
  startedAtMs: number;
  coveredKm: number;
  lastPosition: GeoPoint;
}

interface TrackerOptions {
  toleranceRatio?: number;
  safetyMarginRatio?: number;
}

export function useCorridorTracker(
  corridors: PtsCorridor[],
  vehicleType: VehicleType,
  { toleranceRatio, safetyMarginRatio }: TrackerOptions = {},
) {
  const [metrics, setMetrics] = useState<CorridorMetrics | null>(null);
  const [activeCorridor, setActiveCorridor] = useState<PtsCorridor | null>(null);

  const runRef = useRef<ActiveRun | null>(null);
  const prevSampleRef = useRef<TelemetrySample | null>(null);
  const vehicleRef = useRef(vehicleType);

  useEffect(() => {
    vehicleRef.current = vehicleType;
  }, [vehicleType]);

  const reset = useCallback(() => {
    runRef.current = null;
    prevSampleRef.current = null;
    setMetrics(null);
    setActiveCorridor(null);
  }, []);

  const ingest = useCallback(
    (sample: TelemetrySample) => {
      const prev = prevSampleRef.current;
      prevSampleRef.current = sample;

      let run = runRef.current;
      let elapsedSec: number;

      if (!run) {
        // Koridora giriş: önceki → mevcut adım, koridor başlangıç noktasını kesmeli.
        if (!prev) return;
        const entered = corridors.find(
          (c) => pointToSegmentDistanceKm(c.start, prev.position, sample.position) <= ENTRY_RADIUS_KM,
        );
        if (!entered) return;

        // Giriş anını iki örnek arasında doğrusal olarak yorumla.
        const stepKm = haversineKm(prev.position, sample.position);
        const toStartKm = haversineKm(prev.position, entered.start);
        const frac = stepKm > 0 ? Math.min(1, toStartKm / stepKm) : 1;
        const startedAtMs = prev.timestampMs + (sample.timestampMs - prev.timestampMs) * frac;

        run = {
          corridor: entered,
          startedAtMs,
          coveredKm: haversineKm(entered.start, sample.position),
          lastPosition: sample.position,
        };
        runRef.current = run;
        setActiveCorridor(entered);
        elapsedSec = (sample.timestampMs - startedAtMs) / 1000;
      } else {
        const stepKm = haversineKm(run.lastPosition, sample.position);
        const before = run.coveredKm;
        elapsedSec = (sample.timestampMs - run.startedAtMs) / 1000;

        if (sample.speedKmh > MIN_MOVING_SPEED_KMH && stepKm >= MIN_STEP_KM) {
          run.coveredKm = before + stepKm;
          run.lastPosition = sample.position;

          // Bitiş çizgisi bu adımda geçildiyse çıkış anını interpolasyonla bul.
          if (run.coveredKm >= run.corridor.lengthKm) {
            const frac = Math.min(1, (run.corridor.lengthKm - before) / stepKm);
            const prevMs = prev ? prev.timestampMs : sample.timestampMs;
            const endMs = prevMs + (sample.timestampMs - prevMs) * frac;
            elapsedSec = (endMs - run.startedAtMs) / 1000;
          }
        }
      }

      const vehicle = vehicleRef.current;
      const next = evaluateCorridor({
        corridorLengthKm: run.corridor.lengthKm,
        limitKmh: run.corridor.limits[vehicle],
        distanceCoveredKm: run.coveredKm,
        elapsedSec,
        toleranceRatio,
        safetyMarginRatio,
      });

      setMetrics(next);
      if (next.phase === 'COMPLETED') runRef.current = null;
    },
    [corridors, toleranceRatio, safetyMarginRatio],
  );

  return { metrics, activeCorridor, ingest, reset };
}
