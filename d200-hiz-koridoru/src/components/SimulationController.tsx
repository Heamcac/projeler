import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FastForward, Pause, Play, RotateCcw } from 'lucide-react';
import type { GeoPoint, TelemetrySample } from '@/types/traffic';
import { buildPathIndex, pointAtDistance } from '@/utils/telemetryCalculator';

const TICK_MS = 200;
/** Sanal saniye başına hız değişimi (km/s). */
const ACCEL_KMH_PER_SEC = 12;
const BRAKE_KMH_PER_SEC = 20;
const MAX_SPEED_KMH = 160;
const TIME_SCALES = [1, 5, 10, 30] as const;

export interface SimulationJumpPoint {
  label: string;
  /** Güzergah başından itibaren km. */
  distanceKm: number;
}

export interface SimulationControllerProps {
  /** Sürülecek hat (ör. D200_ROUTE_PATH). */
  route: GeoPoint[];
  onTelemetry: (sample: TelemetrySample) => void;
  /** Sıfırlama veya atlama sonrası takip durumunu temizlemek için. */
  onReset?: () => void;
  /** Koridor girişlerine hızlı atlama noktaları. */
  jumpPoints?: SimulationJumpPoint[];
  initialSpeedKmh?: number;
}

export default function SimulationController({
  route,
  onTelemetry,
  onReset,
  jumpPoints = [],
  initialSpeedKmh = 100,
}: SimulationControllerProps) {
  const index = useMemo(() => buildPathIndex(route), [route]);

  const [running, setRunning] = useState(false);
  const [targetSpeed, setTargetSpeed] = useState(initialSpeedKmh);
  const [timeScale, setTimeScale] = useState<(typeof TIME_SCALES)[number]>(1);
  const [readout, setReadout] = useState({ speedKmh: 0, distanceKm: 0 });

  // Mutable sim durumu: interval içinde bayat closure oluşmasın diye ref'te tutulur.
  const speedRef = useRef(0);
  const distanceRef = useRef(0);
  const clockRef = useRef(Date.now());
  const targetRef = useRef(targetSpeed);
  const scaleRef = useRef<number>(timeScale);
  const onTelemetryRef = useRef(onTelemetry);

  useEffect(() => {
    targetRef.current = targetSpeed;
  }, [targetSpeed]);
  useEffect(() => {
    scaleRef.current = timeScale;
  }, [timeScale]);
  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  useEffect(() => {
    if (!running) return undefined;

    const id = window.setInterval(() => {
      const dtSim = (TICK_MS / 1000) * scaleRef.current;

      // Hızı hedefe doğru ivmelenme/frenleme sınırıyla yaklaştır.
      const diff = targetRef.current - speedRef.current;
      const maxStep = (diff > 0 ? ACCEL_KMH_PER_SEC : BRAKE_KMH_PER_SEC) * dtSim;
      speedRef.current = Math.abs(diff) <= maxStep ? targetRef.current : speedRef.current + Math.sign(diff) * maxStep;

      distanceRef.current = Math.min(
        index.totalKm,
        distanceRef.current + (speedRef.current / 3600) * dtSim,
      );
      clockRef.current += dtSim * 1000;

      const at = pointAtDistance(index, distanceRef.current);
      onTelemetryRef.current({
        position: at.position,
        speedKmh: speedRef.current,
        timestampMs: clockRef.current,
        headingDeg: at.headingDeg,
        source: 'SIMULATOR',
      });
      setReadout({ speedKmh: speedRef.current, distanceKm: distanceRef.current });

      if (distanceRef.current >= index.totalKm) setRunning(false);
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [running, index]);

  const handleReset = useCallback(() => {
    setRunning(false);
    speedRef.current = 0;
    distanceRef.current = 0;
    clockRef.current = Date.now();
    setReadout({ speedKmh: 0, distanceKm: 0 });
    onReset?.();
  }, [onReset]);

  const handleJump = useCallback(
    (distanceKm: number) => {
      // Atlama, önceki örnekle mevcut örnek arasında sahte bir "geçiş" oluşturmasın.
      onReset?.();
      distanceRef.current = Math.max(0, Math.min(index.totalKm, distanceKm));
      const at = pointAtDistance(index, distanceRef.current);
      clockRef.current += 1000;
      onTelemetryRef.current({
        position: at.position,
        speedKmh: speedRef.current,
        timestampMs: clockRef.current,
        headingDeg: at.headingDeg,
        source: 'SIMULATOR',
      });
      setReadout({ speedKmh: speedRef.current, distanceKm: distanceRef.current });
    },
    [index, onReset],
  );

  const finished = readout.distanceKm >= index.totalKm;
  const routeProgress = index.totalKm > 0 ? (readout.distanceKm / index.totalKm) * 100 : 0;

  return (
    <section
      aria-label="Sürüş simülatörü"
      className="rounded-2xl border border-white/10 bg-[#0C141C] p-5 text-[#E8EEF3]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Sanal sürüş: Bursa → Ankara</h2>
        <span className="text-sm text-[#8FA0B0]">GPS gerekmez</span>
      </div>

      {/* Hedef hız kaydırıcısı */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="sim-speed" className="text-[#C6D2DC]">
            Hedef hız
          </label>
          <output htmlFor="sim-speed" className="text-2xl font-semibold tabular-nums">
            {targetSpeed} km/s
          </output>
        </div>
        <input
          id="sim-speed"
          type="range"
          min={0}
          max={MAX_SPEED_KMH}
          step={1}
          value={targetSpeed}
          onChange={(e) => setTargetSpeed(Number(e.target.value))}
          className="mt-2 w-full accent-[#7CC4FF]"
        />
        <p className="mt-1 text-sm text-[#8FA0B0]">
          Araç bu hıza kademeli olarak ulaşır. Şu an: {Math.round(readout.speedKmh)} km/s
        </p>
      </div>

      {/* Zaman ölçeği */}
      <div className="mt-4">
        <p className="flex items-center gap-2 text-[#C6D2DC]">
          <FastForward className="h-4 w-4" aria-hidden />
          Simülasyon hızı
        </p>
        <div role="radiogroup" aria-label="Simülasyon hızı" className="mt-2 grid grid-cols-4 gap-2">
          {TIME_SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              role="radio"
              aria-checked={scale === timeScale}
              onClick={() => setTimeScale(scale)}
              className={`rounded-lg border py-2 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CC4FF] ${
                scale === timeScale
                  ? 'border-[#7CC4FF] bg-[#7CC4FF]/10'
                  : 'border-white/10 text-[#8FA0B0] hover:bg-white/5'
              }`}
            >
              {scale}×
            </button>
          ))}
        </div>
      </div>

      {/* Kontroller */}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          disabled={finished}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7CC4FF] px-4 py-3 font-semibold text-[#08131C] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {running ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5" aria-hidden />}
          {running ? 'Duraklat' : readout.distanceKm > 0 ? 'Devam et' : 'Sürüşü başlat'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-[#C6D2DC] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CC4FF]"
        >
          <RotateCcw className="h-5 w-5" aria-hidden />
          Sıfırla
        </button>
      </div>

      {/* Güzergah ilerlemesi */}
      <div className="mt-5">
        <div className="flex justify-between text-sm text-[#8FA0B0]">
          <span>Güzergah ilerlemesi</span>
          <span className="tabular-nums">
            {readout.distanceKm.toFixed(1)} / {index.totalKm.toFixed(1)} km
          </span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#16212D]"
          role="progressbar"
          aria-label="Güzergah ilerlemesi"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(routeProgress)}
        >
          <div className="h-full rounded-full bg-[#7CC4FF]" style={{ width: `${routeProgress}%` }} />
        </div>
        {finished && <p className="mt-2 text-[#3DDC97]">Ankara girişine ulaşıldı. Yeniden başlatmak için sıfırlayın.</p>}
      </div>

      {/* Koridora atla */}
      {jumpPoints.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-[#C6D2DC]">Koridor girişine atla</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {jumpPoints.map((jp) => (
              <button
                key={jp.label}
                type="button"
                onClick={() => handleJump(jp.distanceKm)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-[#C6D2DC] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CC4FF]"
              >
                {jp.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
