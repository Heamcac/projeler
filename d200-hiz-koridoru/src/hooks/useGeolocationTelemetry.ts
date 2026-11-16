import { useEffect, useRef, useState } from 'react';
import type { TelemetrySample } from '@/types/traffic';
import { haversineKm } from '@/utils/telemetryCalculator';

/**
 * Tarayıcı Geolocation API'sinden gerçek telemetri üretir.
 * Cihaz hız değeri vermezse (coords.speed = null) hız, ardışık konumlardan türetilir.
 */
export function useGeolocationTelemetry(
  enabled: boolean,
  onSample: (sample: TelemetrySample) => void,
) {
  const [error, setError] = useState<string | null>(null);
  const callbackRef = useRef(onSample);
  const prevRef = useRef<TelemetrySample | null>(null);

  useEffect(() => {
    callbackRef.current = onSample;
  }, [onSample]);

  useEffect(() => {
    if (!enabled) return undefined;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Bu cihaz veya tarayıcı konum servisini desteklemiyor.');
      return undefined;
    }

    prevRef.current = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        const position = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const prev = prevRef.current;

        let speedKmh = pos.coords.speed != null ? pos.coords.speed * 3.6 : 0;
        if (pos.coords.speed == null && prev) {
          const dtSec = (pos.timestamp - prev.timestampMs) / 1000;
          if (dtSec > 0) speedKmh = (haversineKm(prev.position, position) / dtSec) * 3600;
        }

        const sample: TelemetrySample = {
          position,
          speedKmh,
          timestampMs: pos.timestamp,
          accuracyM: pos.coords.accuracy,
          headingDeg: pos.coords.heading ?? undefined,
          source: 'GPS',
        };
        prevRef.current = sample;
        callbackRef.current(sample);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Konum izni verilmedi. Tarayıcı ayarlarından izin verin.'
            : 'Konum alınamadı. Açık alanda tekrar deneyin.',
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { error };
}
