import { useCallback, useMemo, useRef } from 'react';

type AudioWindow = Window & { webkitAudioContext?: {
  new(): AudioContext;
} };

export const useSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(async () => {
    if (!audioCtxRef.current) {
      const w = window as AudioWindow;
      const Ctx: { new(): AudioContext } | undefined = typeof AudioContext !== 'undefined' ? AudioContext : w.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      try { await audioCtxRef.current.resume(); } catch (e) { void e; }
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback(async (pattern: (ctx: AudioContext) => void) => {
    const ctx = await getCtx();
    if (!ctx) return;
    pattern(ctx);
  }, [getCtx]);

  // Helpers
  const makeNoise = (ctx: AudioContext, duration = 0.4, type: OscillatorType = 'square', freq = 440, gain = 0.06) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playDice = useCallback(() => {
    play((ctx) => {
      // Rapid random pitches to simulate rattling dice
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const t = ctx.currentTime + i * 0.05;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 200 + Math.random() * 800;
        osc.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.03, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.06);
      }
      // A soft thud
      const thud = ctx.createOscillator();
      const tg = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(120, ctx.currentTime + 0.55);
      thud.connect(tg);
      tg.connect(ctx.destination);
      tg.gain.setValueAtTime(0.06, ctx.currentTime + 0.55);
      tg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      thud.start(ctx.currentTime + 0.55);
      thud.stop(ctx.currentTime + 0.85);
    });
  }, [play]);

  const playCorrect = useCallback(() => {
    play((ctx) => {
      // Ascending arpeggio
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((f, i) => makeNoise(ctx, 0.18, 'sine', f, 0.05 + i * 0.01));
    });
  }, [play]);

  const playWrong = useCallback(() => {
    play((ctx) => {
      // Descending tones
      const freqs = [392.0, 329.63, 261.63];
      freqs.forEach((f, i) => makeNoise(ctx, 0.18, 'sawtooth', f, 0.05 - i * 0.005));
    });
  }, [play]);

  const playChance = useCallback(() => {
    play((ctx) => {
      // Whoosh effect via noise-like bursts
      for (let i = 0; i < 6; i++) {
        const t = ctx.currentTime + i * 0.03;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 100 + i * 40;
        osc.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.02, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.14);
      }
    });
  }, [play]);

  return useMemo(() => ({ playDice, playCorrect, playWrong, playChance }), [playDice, playCorrect, playWrong, playChance]);
};
