import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { questionCategories } from '../data/questions';

interface Round3SpinProps {
  locked: string[];
  onSpin?: () => void;
  socket: Socket;
  disabled?: boolean;
}

// Fancy circular wheel with smooth ease-out spin landing on server-selected category
const Round3Spin: React.FC<Round3SpinProps> = ({ locked, onSpin, socket, disabled }) => {
  const categories = useMemo(() => questionCategories, []);
  const seg = 360 / categories.length;

  // Visual states
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0); // degrees
  const [result, setResult] = useState<string | null>(null);
  const [showResultText, setShowResultText] = useState(false);
  const [landedIndex, setLandedIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [justLanded, setJustLanded] = useState(false);
  const [wobble, setWobble] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const transitionMsRef = useRef(5000);

  // --- Audio: whoosh + ticks ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const whooshGainRef = useRef<GainNode | null>(null);
  const whooshFilterRef = useRef<BiquadFilterNode | null>(null);
  const whooshSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const tickTimeoutsRef = useRef<number[]>([]);

  const ensureAudio = async () => {
    if (typeof window === 'undefined') return null;
    const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    if (!noiseBufferRef.current) {
      const seconds = 1.0;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      noiseBufferRef.current = buffer;
    }
    return ctx;
  };

  const startWhoosh = async () => {
    const ctx = await ensureAudio();
    if (!ctx || whooshSourceRef.current) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBufferRef.current!;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.12);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    whooshSourceRef.current = src;
    whooshFilterRef.current = filter;
    whooshGainRef.current = gain;
  };

  const stopWhoosh = () => {
    const ctx = audioCtxRef.current;
    const src = whooshSourceRef.current;
    const gain = whooshGainRef.current;
    if (!ctx || !src || !gain) return;
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      window.setTimeout(() => {
        try { src.stop(); } catch {}
        try { src.disconnect(); } catch {}
        try { whooshFilterRef.current?.disconnect(); } catch {}
        try { gain.disconnect(); } catch {}
        whooshSourceRef.current = null;
        whooshFilterRef.current = null;
        whooshGainRef.current = null;
      }, 140);
    } catch {}
  };

  const playTick = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 950 + Math.random() * 120; // subtle variation
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  };

  const clearTickTimeouts = () => {
    tickTimeoutsRef.current.forEach(id => window.clearTimeout(id));
    tickTimeoutsRef.current = [];
  };

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const scheduleTicks = (totalTicks: number, durationMs: number) => {
    clearTickTimeouts();
    if (totalTicks <= 0 || durationMs <= 0) return;
    for (let i = 1; i <= totalTicks; i++) {
      const t = i / totalTicks;
      const time = easeOutCubic(t) * durationMs;
      const id = window.setTimeout(() => playTick(), time) as unknown as number;
      tickTimeoutsRef.current.push(id);
    }
  };

  // Palette for segments
  const colors = useMemo(
    () => [
      '#667eea', // Rich Purple (History)
      '#f5576c', // Vibrant Pink-Red (Science)
      '#00f2fe', // Electric Cyan (Sports)
      '#43e97b', // Fresh Green (Entertainment)
      '#fee140', // Golden Yellow (Geography)
      '#330867', // Deep Purple (Technology)
      '#fed6e3', // Soft Pink (Music)
      '#ff6a88', // Coral (Food)
      '#fcb69f', // Warm Peach (Literature)
      '#bfe9ff', // Sky Blue (Animals)
    ],
    []
  );

  // Build conic gradient background for the wheel
  // Each segment is 36 degrees (360/10). Segment 0 is centered at 0° (12 o'clock)
  // BUT: CSS conic-gradient starts at 0° = 3 o'clock (right), not 12 o'clock (top)
  // So we need to offset all angles by -90° to rotate the gradient to start at 12 o'clock
  const wheelBg = useMemo(() => {
    const stops: string[] = [];
    const gradientOffset = -90; // Rotate gradient so 0° is at 12 o'clock instead of 3 o'clock
    for (let i = 0; i < categories.length; i++) {
      const c = colors[i % colors.length];
      // Segment i is centered at i * seg degrees
      // It spans from (i * seg - seg/2) to (i * seg + seg/2)
      // Add gradientOffset to move everything from 3 o'clock to 12 o'clock
      const start = i * seg - seg / 2 + gradientOffset;
      const end = i * seg + seg / 2 + gradientOffset;
      // Slightly dim locked categories
      const color = locked.includes(categories[i]) ? `${c}CC` : c;
      stops.push(`${color} ${start}deg ${end}deg`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  }, [categories, colors, seg, locked]);

  // Compute rotation to land selected category at 12 o'clock (0 degrees / top)
  // Segment i is naturally centered at i * seg degrees
  // To move segment i to 0°, we rotate by -i * seg
  const normalize = (a: number) => ((a % 360) + 360) % 360;
  
  const getIndexFromRotation = (rotDeg: number) => {
    // After rotating by rotDeg, which segment is at 0°?
    // Segment i started at i*seg, after rotation it's at i*seg + rotDeg
    // We want i*seg + rotDeg ≡ 0 (mod 360)
    // So i*seg ≡ -rotDeg (mod 360)
    const targetAngle = normalize(-rotDeg);
    const idx = Math.round(targetAngle / seg) % categories.length;
    return idx;
  };

  const computeTargetRotation = (category: string) => {
    const targetIdx = Math.max(0, categories.indexOf(category));
    
    // Segment targetIdx is centered at targetIdx * seg
    // We want to rotate so it ends up at 0° (12 o'clock)
    // To move a segment from its position (targetIdx * seg) to 0°, we need to rotate CLOCKWISE
    // which means we rotate by (360 - targetIdx * seg) to go the "long way" around
    // OR we can think of it as: segment at position X needs to move (360 - X) degrees clockwise to reach 0°
    // But we want to spin multiple times, so:
    // rotation = -targetIdx * seg + extraSpins * 360 (negative to go counter-clockwise to 12 o'clock)
    // Actually, let's reconsider: if segment 3 is at 108°, rotating by -108° moves it to 0°
    // But CSS transform rotates the WHEEL, not individual segments
    // So rotating the wheel by -108° moves segment 3 FROM 108° TO 0°
    // Wait, that's backwards. Let me think...
    // Initial: segment 3 at 108° (3 o'clock area)
    // We apply transform: rotate(-108deg) to the wheel
    // This rotates the ENTIRE wheel counter-clockwise by 108°
    // So segment 3 moves from 108° to (108° - 108°) = 0° ✓ Correct!
    // Except... in your logs segment 0 ends up at 12 o'clock when we want segment 3 there
    // This means we're rotating the wrong direction!
    
    // FIX: To move segment X to 12 o'clock, rotate by (360 - X * seg) CLOCKWISE
    // Since positive rotation = clockwise in CSS, we use POSITIVE values
    const baseRotation = targetIdx === 0 ? 0 : (360 - targetIdx * seg);
    
    // Add 3-4 full spins (at least 3 * 360 = 1080 degrees) - keep spinning clockwise
    const extraSpins = 3 + Math.floor(Math.random() * 2);
    const targetRotation = baseRotation + extraSpins * 360;
    
    // Calculate total ticks for sound
    const currentIdx = getIndexFromRotation(rotation);
    const deltaSegments = (targetIdx - currentIdx + categories.length) % categories.length;
    const totalTicks = extraSpins * categories.length + deltaSegments;
    
    return { targetRotation, totalTicks };
  };

  // When server sends result, animate to it
  useEffect(() => {
    const onResult = ({ category }: { category: string }) => {
      console.log(`[Round3Spin] Received category from server: "${category}"`);
      setResult(category);
      setShowResultText(false); // hide until after landing + highlight
      const idx = categories.indexOf(category);
      console.log(`[Round3Spin] Category "${category}" is at index ${idx}`);
      setTargetIndex(idx >= 0 ? idx : null);
      // Start the spin if not already spinning
      if (!spinning) setSpinning(true);
      const { targetRotation, totalTicks } = computeTargetRotation(category);
      console.log(`[Round3Spin] Target rotation: ${targetRotation}° to land segment ${idx} at 12 o'clock`);
      // Trigger CSS transition
      transitionMsRef.current = 5000;
      requestAnimationFrame(() => {
        setRotation(targetRotation);
      });
      // Sound: schedule ticks to decelerate across the transition duration
      scheduleTicks(totalTicks, transitionMsRef.current);
      // Start whoosh for all clients on spin-result too (may be blocked if no user gesture yet)
      startWhoosh();
    };
    socket.on('spin-result', onResult);
    return () => { socket.off('spin-result', onResult); };
  }, [socket, spinning]);

  // Handle transition end to clean up states, flash highlight, and play micro-overshoot wobble
  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    let clearId: number | null = null;
    let wobbleId: number | null = null;
    const onEnd = () => {
      setSpinning(false);
      // ALWAYS use targetIndex from server (it's set in spin-result handler)
      // The rotation state is stale in this closure
      if (targetIndex !== null && targetIndex >= 0) {
        const idx = targetIndex;
        console.log(`[Round3Spin] Wheel stopped. Landing on segment ${idx}: "${categories[idx]}"`);
        setLandedIndex(idx);
        setJustLanded(true);
        // Clear highlight after a moment
        clearId = window.setTimeout(() => {
          setJustLanded(false);
          setShowResultText(true);
        }, 2000) as unknown as number;
        // Stop audio effects
        stopWhoosh();
        clearTickTimeouts();
        // Trigger a brief overshoot wobble
        setWobble(true);
        wobbleId = window.setTimeout(() => setWobble(false), 520) as unknown as number;
        // Haptics: stronger pulse on land
        try { if (navigator?.vibrate) navigator.vibrate([8, 20, 18]); } catch {}
      }
    };
    el.addEventListener('transitionend', onEnd);
    return () => {
      el.removeEventListener('transitionend', onEnd);
      if (clearId) window.clearTimeout(clearId);
      if (wobbleId) window.clearTimeout(wobbleId);
    };
  }, [targetIndex, rotation]);

  const handleSpin = () => {
    if (disabled || spinning) return;
    setResult(null);
    setJustLanded(false);
    setSpinning(true);
    // Slight pre-rotation nudge for responsiveness
    setRotation(prev => prev - 30);
    onSpin?.();
    // Start audio whoosh on user gesture
    startWhoosh();
    // Mobile haptics: tiny pulse on spin start
    try { if (navigator?.vibrate) navigator.vibrate(12); } catch {}
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWhoosh();
      clearTickTimeouts();
    };
  }, []);

  // Radial slice-aligned labels: start near center and extend to edge within each slice
  const renderLabels = () => {
    const radius = 150; // approximate outer radius of the wheel area
    const innerR = 48;  // start a bit beyond center hub
    const barThickness = 32; // width of radial label bar (kept thin to stay within slice bounds)
    const length = radius - innerR - 6; // leave small margin before rim
    const gradientOffset = -90; // Same offset as the conic gradient to align with 12 o'clock
    return categories.map((cat, i) => {
      // Segment i is centered at i * seg degrees (segment 0 at 0°, segment 1 at 36°, etc.)
      // Add gradientOffset to align with the visual gradient position
      const angle = i * seg + gradientOffset;
      const lockedCat = locked.includes(cat);
      const isLanded = (landedIndex !== null && i === landedIndex) || (targetIndex !== null && justLanded && i === targetIndex);
      const dimThis = justLanded && ((landedIndex !== null && i !== landedIndex) || (targetIndex !== null && i !== targetIndex));
      return (
        <div
          key={cat}
          className="absolute left-1/2 top-1/2 select-none"
          style={{
            transform: `rotate(${angle}deg) translateX(${innerR}px)`,
            transformOrigin: 'center left',
            opacity: dimThis ? 0.35 : 1,
          }}
        >
          <div
            className="flex items-center justify-center rounded-md shadow-sm"
            style={{
              width: `${length}px`,
              height: `${barThickness}px`,
              background: isLanded ? 'linear-gradient(90deg, rgba(234,179,8,0.35), rgba(234,179,8,0.15))' : 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              border: isLanded ? '1px solid rgba(234,179,8,0.45)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isLanded ? '0 0 14px rgba(234,179,8,0.25)' : 'inset 0 0 6px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(1px)',
            }}
          >
            <span
              className="font-semibold text-[11px] md:text-xs"
              style={{
                color: lockedCat ? 'rgba(255,255,255,0.7)' : isLanded ? '#FFE08A' : 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)'
              }}
            >
              {cat} {lockedCat ? '🔒' : ''}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
      <div className="text-white font-bold mb-3">Round 3: Spin the Wheel</div>
      <div className="relative mx-auto" style={{ width: 320, height: 320, perspective: 900 }}>
        {/* Fixed selector at 12 o'clock */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-20" aria-hidden>
          <div 
            className={`w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent ${justLanded ? 'border-b-yellow-400' : 'border-b-white'}`}
            style={{ 
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              transition: 'border-color 0.3s'
            }} 
          />
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="absolute inset-0 rounded-full shadow-2xl"
          style={{
            backgroundImage: wheelBg,
            filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.35))',
            // Base rotation via CSS var to support wobble keyframes
            ['--base-rot' as any]: `${rotation}deg`,
            transform: `rotate(var(--base-rot)) rotateX(8deg)`,
            transformStyle: 'preserve-3d',
            transition: spinning ? 'transform 5s cubic-bezier(0.15, 0.9, 0.1, 1)' : 'transform 0s',
            animation: wobble ? 'wheel-wobble 480ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'none',
          }}
        >
          {/* Subtle per-slice separators and rim glow */}
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            background: `
              radial-gradient(circle at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 35%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.35) 100%),
              conic-gradient(from 0deg,
                rgba(0,0,0,0.25) 0deg 0.5deg,
                transparent 0.5deg 35.5deg,
                rgba(0,0,0,0.25) 35.5deg 36deg
              )
            `,
            mixBlendMode: 'overlay',
            transform: 'translateZ(4px)'
          }} />
          {/* Local keyframes for wobble using base rotation var */}
          <style>
            {`
              @keyframes wheel-wobble {
                0%   { transform: rotate(var(--base-rot)) rotateX(8deg); }
                55%  { transform: rotate(calc(var(--base-rot) + 2.2deg)) rotateX(8deg); }
                80%  { transform: rotate(calc(var(--base-rot) - 1.2deg)) rotateX(8deg); }
                92%  { transform: rotate(calc(var(--base-rot) + 0.5deg)) rotateX(8deg); }
                100% { transform: rotate(var(--base-rot)) rotateX(8deg); }
              }
            `}
          </style>
          {/* Center hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className={`rounded-full ${spinning ? 'bg-white/80' : 'bg-white'} text-pink-700 font-extrabold`} style={{ width: 86, height: 86, boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), 0 6px 10px rgba(0,0,0,0.25)', transform: 'translateZ(20px)' }}>
                <button
                  onClick={handleSpin}
                  disabled={disabled || spinning}
                  className={`w-full h-full rounded-full ${disabled || spinning ? 'cursor-not-allowed opacity-75' : 'hover:scale-105 active:scale-95 transition-transform'}`}
                  title={disabled ? 'Wait…' : 'Spin'}
                >
                  SPIN
                </button>
              </div>
              {/* Rim with glow */}
              <div className="absolute -inset-1 rounded-full pointer-events-none" style={{ transform: 'translateZ(10px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25), 0 0 18px rgba(255,255,255,0.15)' }} />
            </div>
          </div>

          {/* Labels */}
          {renderLabels()}

          {/* Landing glow */}
          {justLanded && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow: '0 0 0 8px rgba(234,179,8,0.25) inset, 0 0 18px rgba(234,179,8,0.35)',
                transform: 'translateZ(5px)'
              }}
            />
          )}
        </div>

        {/* Landed segment wedge highlight (2s) - OUTSIDE rotating wheel so it stays at 12 o'clock */}
        {justLanded && (() => {
          // Create a wedge centered at 0deg (12 o'clock/top) spanning one full segment
          // The wedge goes from -seg/2 to +seg/2 (e.g., -18° to +18° for 36° segments)
          const wedgeStart = -seg / 2;
          const wedgeEnd = seg / 2;
          return (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                transform: `rotateX(8deg)`,
                zIndex: 10,
                backgroundImage: `
                  /* Dim all slices except the wedge at top */
                  conic-gradient(
                    rgba(0,0,0,0.65) 0deg,
                    rgba(0,0,0,0.65) ${360 + wedgeStart}deg,
                    transparent ${360 + wedgeStart}deg,
                    transparent 360deg,
                    transparent 0deg,
                    transparent ${wedgeEnd}deg,
                    rgba(0,0,0,0.65) ${wedgeEnd}deg,
                    rgba(0,0,0,0.65) 360deg
                  ),
                  /* Bright gold wedge highlighting the entire winning slice */
                  conic-gradient(
                    transparent 0deg,
                    transparent ${360 + wedgeStart}deg,
                    rgba(234,179,8,0.6) ${360 + wedgeStart}deg,
                    rgba(234,179,8,0.6) 360deg,
                    rgba(234,179,8,0.6) 0deg,
                    rgba(234,179,8,0.6) ${wedgeEnd}deg,
                    transparent ${wedgeEnd}deg,
                    transparent 360deg
                  )
                `,
              }}
            />
          );
        })()}

        {/* Outer rim and glass */}
        <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" style={{ transform: 'translateZ(2px)' }} />
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)', transform: 'translateZ(2px)' }} />
      </div>

      {/* Footer info */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={handleSpin}
          disabled={disabled || spinning}
          className={`px-4 py-2 rounded-lg font-semibold ${disabled || spinning ? 'bg-gray-600 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'} text-white shadow-lg`}
        >
          {spinning ? 'Spinning…' : 'Spin'}
        </button>
        {result && showResultText && (
          <div className="text-white/80 text-sm">Selected: <span className="text-white font-bold">{result}</span></div>
        )}
      </div>
      <div className="mt-2 text-white/60 text-xs">Locked categories appear dimmed and are avoided when possible</div>
    </div>
  );
};

export default Round3Spin;
