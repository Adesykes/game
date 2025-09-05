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
  const makeTone = (ctx: AudioContext, {
    freq = 440,
    type = 'sine' as OscillatorType,
    start = ctx.currentTime,
    duration = 0.4,
    attack = 0.01,
    decay = 0.08,
    sustain = 0.4,
    release = 0.15,
    gain = 0.08,
    detune = 0
  } = {}) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (detune) osc.detune.setValueAtTime(detune, start);
    osc.connect(g);
    g.connect(ctx.destination);
    // ADSR
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(gain * sustain, start + attack + decay);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);
    osc.start(start);
    osc.stop(start + duration + release + 0.02);
  };

  const noiseBurst = (ctx: AudioContext, start = ctx.currentTime, duration = 0.25, gain = 0.15, type: 'white' | 'pink' = 'white') => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let pink = 0;
    for (let i = 0; i < bufferSize; i++) {
      let v = Math.random() * 2 - 1;
      if (type === 'pink') {
        pink = 0.98 * pink + 0.02 * v;
        v = pink * 2;
      }
      data[i] = v * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    src.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.start(start);
    src.stop(start + duration + 0.01);
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
      // Layered success fanfare: chord + sparkle + noise shimmer
      const start = ctx.currentTime;
      const base = 523.25; // C5
      [0, 4, 7, 12].forEach((semi, i) => makeTone(ctx, { freq: base * Math.pow(2, semi / 12), type: i < 2 ? 'triangle' : 'sine', start, duration: 0.6, gain: 0.07, detune: i * 3 }));
      // Rising arpeggio
      [0, 4, 7].forEach((semi, i) => makeTone(ctx, { freq: base * Math.pow(2, semi / 12), type: 'square', start: start + 0.15 + i * 0.09, duration: 0.3, gain: 0.05, detune: -i * 2 }));
      // Sparkle noise
      noiseBurst(ctx, start + 0.05, 0.2, 0.12, 'pink');
    });
  }, [play]);

  const playWrong = useCallback(() => {
    play((ctx) => {
      const start = ctx.currentTime;
      const seq = [466.16, 392.0, 329.63, 246.94]; // Bb4 -> G4 -> E4 -> B3
      seq.forEach((f, i) => makeTone(ctx, { freq: f, type: 'sawtooth', start: start + i * 0.12, duration: 0.35, attack: 0.005, decay: 0.07, sustain: 0.3, release: 0.25, gain: 0.07 }));
      noiseBurst(ctx, start + 0.05, 0.25, 0.08, 'white');
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

  const playReady = useCallback(() => {
    play((ctx) => {
      const base = 493.88; // B4
      [0, 5, 7].forEach((semi, i) => makeTone(ctx, { freq: base * Math.pow(2, semi / 12), type: 'triangle', start: ctx.currentTime + i * 0.08, duration: 0.4, gain: 0.06 }));
    });
  }, [play]);

  const playStart = useCallback(() => {
    play((ctx) => {
      const start = ctx.currentTime;
      const seq = [261.63, 329.63, 392.0, 523.25, 659.25];
      seq.forEach((f, i) => makeTone(ctx, { freq: f, type: 'square', start: start + i * 0.09, duration: 0.5, gain: 0.07 }));
      noiseBurst(ctx, start + 0.15, 0.3, 0.1, 'pink');
    });
  }, [play]);

  return useMemo(() => ({ playDice, playCorrect, playWrong, playChance, playReady, playStart }), [playDice, playCorrect, playWrong, playChance, playReady, playStart]);
};
