import { useEffect, useRef } from 'react';
import { Route, Timer, Volume2, VolumeX } from 'lucide-react';
import type { CorridorMetrics, CorridorStatus } from '@/types/traffic';

/* -------------------------------------------------------------------------- */
/*  Görsel token'lar                                                          */
/* -------------------------------------------------------------------------- */

const STATUS_STYLE: Record<
  CorridorStatus,
  { label: string; text: string; solid: string; border: string; soft: string }
> = {
  SAFE: {
    label: 'Güvenli',
    text: 'text-[#3DDC97]',
    solid: 'bg-[#3DDC97]',
    border: 'border-[#3DDC97]/60',
    soft: 'bg-[#3DDC97]/10',
  },
  WARNING: {
    label: 'Dikkat',
    text: 'text-[#FFB020]',
    solid: 'bg-[#FFB020]',
    border: 'border-[#FFB020]/60',
    soft: 'bg-[#FFB020]/10',
  },
  CRITICAL: {
    label: 'Kritik',
    text: 'text-[#FF5A5F]',
    solid: 'bg-[#FF5A5F]',
    border: 'border-[#FF5A5F]/70',
    soft: 'bg-[#FF5A5F]/10',
  },
};

/** Dar, yüksek okunabilirlikli gösterge yazı tipi; yüklü değilse sistem yedeğine düşer. */
const HUD_FONT = '"Barlow Condensed", "Roboto Condensed", "Arial Narrow", system-ui, sans-serif';

/* -------------------------------------------------------------------------- */
/*  Yardımcılar                                                               */
/* -------------------------------------------------------------------------- */

function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatKm(km: number): string {
  return km >= 10 ? km.toFixed(1) : km.toFixed(2);
}

interface HudMessage {
  headline: string;
  detail: string;
}

function buildMessage(metrics: CorridorMetrics | null): HudMessage {
  if (!metrics) {
    return {
      headline: 'Koridor bekleniyor',
      detail: 'Bir hız koridoruna girdiğinizde ortalama hız takibi başlar.',
    };
  }

  const avg = Math.round(metrics.averageSpeedKmh);

  if (metrics.phase === 'COMPLETED') {
    if (metrics.status === 'CRITICAL') {
      return {
        headline: 'Koridor tamamlandı: limit aşıldı',
        detail: `Ortalamanız ${avg} km/s; tolerans ${Math.round(metrics.toleranceKmh)} km/s idi.`,
      };
    }
    return {
      headline: 'Koridor tamamlandı',
      detail: `Ortalamanız ${avg} km/s; tolerans içinde kaldınız.`,
    };
  }

  const rec = metrics.recommendedSpeedKmh;
  const recText = rec !== null ? Math.max(0, Math.floor(rec)) : null;

  if (metrics.fineUnavoidable) {
    return {
      headline: 'Ceza riski çok yüksek',
      detail: 'Bu koridorda ortalamayı tolerans altına çekmek için pratik bir hız kalmadı.',
    };
  }

  switch (metrics.status) {
    case 'CRITICAL':
      return {
        headline: 'Ortalama hız tolerans üstünde',
        detail: recText !== null ? `Hızınızı ${recText} km/s altına düşürün.` : 'Hızınızı düşürün.',
      };
    case 'WARNING':
      return {
        headline: 'Ortalama hız limiti aştı',
        detail:
          recText !== null
            ? `Kalan yolda ${recText} km/s altında kalın.`
            : 'Hızınızı limite yaklaştırın.',
      };
    default:
      return {
        headline: 'Ortalama hız limit içinde',
        detail:
          recText !== null
            ? `Kalan yolda ${recText} km/s altında kalırsanız cezasız çıkarsınız.`
            : 'Bu tempoyu koruyun.',
      };
  }
}

/* -------------------------------------------------------------------------- */
/*  Sesli uyarı                                                               */
/* -------------------------------------------------------------------------- */

function useCriticalBeep(active: boolean, enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!active || !enabled) return undefined;

    const beep = () => {
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current ??= new Ctor();
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') void ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } catch {
        /* Ses desteklenmiyorsa görsel uyarı yeterlidir. */
      }
    };

    beep();
    const id = window.setInterval(beep, 1500);
    return () => window.clearInterval(id);
  }, [active, enabled]);
}

/* -------------------------------------------------------------------------- */
/*  Bileşen                                                                   */
/* -------------------------------------------------------------------------- */

export interface SpeedHUDProps {
  currentSpeedKmh: number;
  corridorName?: string | null;
  metrics: CorridorMetrics | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function SpeedHUD({
  currentSpeedKmh,
  corridorName,
  metrics,
  soundEnabled,
  onToggleSound,
}: SpeedHUDProps) {
  const status: CorridorStatus = metrics?.status ?? 'SAFE';
  const style = STATUS_STYLE[status];
  const isActive = metrics?.phase === 'ACTIVE';
  const isCritical = isActive && (metrics?.status === 'CRITICAL' || metrics?.fineUnavoidable === true);

  useCriticalBeep(isCritical, soundEnabled);

  const message = buildMessage(metrics);

  // Ortalama göstergesi: 0 … tolerans × 1.25 ölçeği
  const scaleMax = metrics ? metrics.toleranceKmh * 1.25 : 1;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / scaleMax) * 100));
  const limitPct = metrics ? pct(metrics.limitKmh) : 0;
  const tolerancePct = metrics ? pct(metrics.toleranceKmh) : 0;
  const avgPct = metrics ? pct(metrics.averageSpeedKmh) : 0;

  const speedRounded = Math.max(0, Math.round(currentSpeedKmh));
  const avgRounded = metrics ? Math.round(metrics.averageSpeedKmh) : null;

  return (
    <section
      aria-label="Hız koridoru göstergesi"
      className={`rounded-2xl border-2 bg-[#0C141C] p-5 text-[#E8EEF3] transition-colors duration-300 sm:p-7 ${
        metrics ? style.border : 'border-white/10'
      }`}
      style={{ fontFamily: HUD_FONT }}
    >
      {/* Üst satır: koridor adı + ses */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[#8FA0B0]">
          <Route className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate text-base">{corridorName ?? 'Koridor dışında'}</span>
        </div>
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-[#C6D2DC] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CC4FF]"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
          {soundEnabled ? 'Sesli uyarı açık' : 'Sesli uyarı kapalı'}
        </button>
      </div>

      {/* Ana okumalar */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-8">
        <div>
          <p className="text-base text-[#8FA0B0]">Anlık hız</p>
          <p
            className="text-[5.5rem] font-semibold leading-none tabular-nums sm:text-[8rem]"
            aria-label={`Anlık hız ${speedRounded} kilometre`}
          >
            {speedRounded}
          </p>
          <p className="text-lg text-[#8FA0B0]">km/s</p>
        </div>

        <div className="text-right">
          <p className="text-base text-[#8FA0B0]">Koridor ortalaması</p>
          <p
            className={`text-[5.5rem] font-semibold leading-none tabular-nums transition-colors duration-300 sm:text-[8rem] ${
              metrics ? style.text : 'text-[#4A5A69]'
            }`}
          >
            {avgRounded ?? '–'}
          </p>
          <p className="text-lg text-[#8FA0B0]">
            {metrics ? `limit ${metrics.limitKmh} · tolerans ${Math.round(metrics.toleranceKmh)}` : 'km/s'}
          </p>
        </div>
      </div>

      {/* Ortalama göstergesi: limit ve tolerans bölgeleri */}
      <div className="mt-6">
        <div
          className="relative h-5 overflow-hidden rounded-full bg-[#16212D]"
          role="img"
          aria-label={
            metrics
              ? `Ortalama ${avgRounded} km/s, limit ${metrics.limitKmh}, tolerans ${Math.round(metrics.toleranceKmh)}`
              : 'Ortalama göstergesi boş'
          }
        >
          {metrics && (
            <>
              <div className="absolute inset-y-0 left-0 bg-[#3DDC97]/35" style={{ width: `${limitPct}%` }} />
              <div
                className="absolute inset-y-0 bg-[#FFB020]/40"
                style={{ left: `${limitPct}%`, width: `${tolerancePct - limitPct}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-[#FF5A5F]/40"
                style={{ left: `${tolerancePct}%` }}
              />
              <div
                className={`absolute inset-y-0 w-1.5 -translate-x-1/2 rounded-full transition-[left] duration-500 ${style.solid}`}
                style={{ left: `${avgPct}%` }}
              />
            </>
          )}
        </div>
        {metrics && (
          <div className="relative mt-1 h-5 text-sm text-[#8FA0B0]">
            <span className="absolute -translate-x-1/2" style={{ left: `${limitPct}%` }}>
              {metrics.limitKmh}
            </span>
            <span className="absolute -translate-x-1/2" style={{ left: `${tolerancePct}%` }}>
              {Math.round(metrics.toleranceKmh)}
            </span>
          </div>
        )}
      </div>

      {/* İlerleme: mesafe ve süre bütçesi */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-base text-[#C6D2DC]">
            <span className="flex items-center gap-2">
              <Route className="h-4 w-4 text-[#8FA0B0]" aria-hidden />
              Kalan mesafe
            </span>
            <span className="tabular-nums">{metrics ? `${formatKm(metrics.distanceRemainingKm)} km` : '–'}</span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#16212D]"
            role="progressbar"
            aria-label="Koridor mesafe ilerlemesi"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={metrics ? Math.round(metrics.progressRatio * 100) : 0}
          >
            <div
              className="h-full rounded-full bg-[#7CC4FF] transition-[width] duration-500"
              style={{ width: `${(metrics?.progressRatio ?? 0) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-base text-[#C6D2DC]">
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-[#8FA0B0]" aria-hidden />
              Geçen süre
            </span>
            <span className="tabular-nums">
              {metrics
                ? `${formatDuration(metrics.elapsedSec)} / ${formatDuration(metrics.targetTimeSec)}`
                : '–'}
            </span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#16212D]"
            role="progressbar"
            aria-label="Cezasız geçiş için süre bütçesi"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={metrics ? Math.min(100, Math.round(metrics.timeUsedRatio * 100)) : 0}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${metrics ? style.solid : 'bg-[#4A5A69]'}`}
              style={{ width: `${Math.min(100, (metrics?.timeUsedRatio ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Durum mesajı */}
      <div
        role="status"
        aria-live={isCritical ? 'assertive' : 'polite'}
        className={`mt-6 rounded-xl px-4 py-3 ${metrics ? style.soft : 'bg-white/5'} ${
          isCritical ? 'motion-safe:animate-pulse' : ''
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className={`text-2xl font-semibold ${metrics ? style.text : 'text-[#C6D2DC]'}`}>
            {message.headline}
          </p>
          {metrics && isActive && (
            <span className={`shrink-0 text-base ${style.text}`}>{style.label}</span>
          )}
        </div>
        <p className="mt-1 text-xl text-[#E8EEF3]">{message.detail}</p>
      </div>
    </section>
  );
}
