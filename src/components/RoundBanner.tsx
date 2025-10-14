import React, { useEffect, useRef } from 'react';
import { Volume2, Timer as TimerIcon, Info } from 'lucide-react';

interface RoundBannerProps {
  round: number;
  rules: string[];
  secondsPerTurn?: number;
  cyclesPerRound?: number;
  cycleInRound?: number;
  onClose?: () => void;
  intensity?: 'low' | 'med' | 'high' | 'ultra';
  roundIntroSrc?: string; // optional mp3 specific to this round intro
}

// Simple escalating intro tones (placeholder). You can replace with proper mp3s later.
const tones: Record<NonNullable<RoundBannerProps['intensity']>, number> = {
  low: 220,
  med: 330,
  high: 440,
  ultra: 660,
};

const RoundBanner: React.FC<RoundBannerProps> = ({ round, rules, secondsPerTurn = 30, cyclesPerRound = 1, cycleInRound = 0, onClose, intensity = 'low', roundIntroSrc }) => {
  const closeRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Display for 10s, then fade out over ~600ms before closing
  const FADE_DELAY_MS = 10000; // visible duration before fade
  const FADE_DURATION_MS = 600; // fade out length
  const [fading, setFading] = React.useState(false);

  useEffect(() => {
    // Start fade after delay
    closeRef.current = setTimeout(() => {
      setFading(true);
      // After fade duration, invoke onClose
      setTimeout(() => onClose?.(), FADE_DURATION_MS);
    }, FADE_DELAY_MS);
    return () => { if (closeRef.current) clearTimeout(closeRef.current); };
  }, [onClose]);

  // Play a short intro: prefer provided mp3; fallback to a synthesized tone
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const tryMp3 = async () => {
      if (!roundIntroSrc) return false;
      try {
        const el = new Audio(roundIntroSrc);
        el.volume = 0.8;
        audioRef.current = el as any;
        await el.play();
        cleanup = () => { try { el.pause(); el.currentTime = 0; } catch {} };
        return true;
      } catch {
        return false;
      }
    };
    const playTone = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = tones[intensity] || 330;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc.start();
        osc.stop(now + 0.85);
        cleanup = () => { try { osc.disconnect(); gain.disconnect(); ctx.close?.(); } catch {} };
      } catch {}
    };
    (async () => {
      const ok = await tryMp3();
      if (!ok) playTone();
    })();
    return () => { if (cleanup) cleanup(); };
  }, [intensity, roundIntroSrc]);

  return (
    <div className={`fixed inset-0 z-[60] flex items-start md:items-center justify-center p-4 transition-opacity duration-[${FADE_DURATION_MS}ms] ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500" />
      <div className={`relative w-full max-w-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl text-white overflow-hidden transition-transform duration-500 ${fading ? 'scale-95' : 'scale-100'}`}>
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15), transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1), transparent 60%)'}} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6 text-pink-300" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">Round {round}</h2>
            </div>
            <div className="text-sm text-white/60">
              Cycle {cycleInRound + 1}/{cyclesPerRound}
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TimerIcon className="w-4 h-4" />
              <span className="font-semibold">Time per turn: {secondsPerTurn}s</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-1 flex-shrink-0" />
              <ul className="list-disc list-inside space-y-1">
                {rules.map((r, i) => (
                  <li key={i} className="text-sm text-white/90">{r}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center text-white/70 text-xs">Press anywhere to continue</div>
        </div>
      </div>
    </div>
  );
};

export default RoundBanner;
