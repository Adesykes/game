import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { questionCategories } from '../data/questions';

interface Round3SpinProps {
  locked: string[];
  onSpin?: () => void;
  socket: Socket;
  disabled?: boolean;
}

// Simple vertical wheel: highlights categories in sequence to simulate spinning.
const Round3Spin: React.FC<Round3SpinProps> = ({ locked, onSpin, socket, disabled }) => {
  const categories = useMemo(() => questionCategories, []);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const spinTimer = useRef<number | null>(null);
  const speedRef = useRef(80); // ms per step

  useEffect(() => {
    const onResult = ({ category }: { category: string }) => {
      setResult(category);
      // Slow down then stop on target category
      // Step 1: slow down
      speedRef.current = 160;
      // Step 2: after a short delay, snap to target and stop
      window.setTimeout(() => {
        const idx = Math.max(0, categories.indexOf(category));
        // Advance highlight until matches target index to make UX consistent
        setHighlightIndex(idx);
        setSpinning(false);
      }, 800);
    };
    socket.on('spin-result', onResult);
    return () => { socket.off('spin-result', onResult); };
  }, [socket, categories]);

  useEffect(() => {
    if (!spinning) {
      if (spinTimer.current) {
        window.clearInterval(spinTimer.current);
        spinTimer.current = null;
      }
      return;
    }
    // Clear previous
    if (spinTimer.current) window.clearInterval(spinTimer.current);
    const id = window.setInterval(() => {
      setHighlightIndex(prev => (prev + 1) % categories.length);
    }, speedRef.current);
    spinTimer.current = id as unknown as number;
    return () => { window.clearInterval(id); };
  }, [spinning, categories.length]);

  const handleSpin = () => {
    if (disabled || spinning) return;
    setResult(null);
    setSpinning(true);
    speedRef.current = 80;
    onSpin?.();
  };

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
      <div className="text-white font-bold mb-2">Round 3: Spin the Wheel</div>
      <div className="h-48 overflow-hidden rounded-xl border border-white/10 relative mx-auto max-w-xs">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="h-8 border-y-2 border-pink-500/70" />
        </div>
        <ul className="divide-y divide-white/10">
          {categories.map((cat, idx) => {
            const lockedCat = locked.includes(cat);
            const isActive = idx === highlightIndex;
            return (
              <li key={cat} className={`h-8 flex items-center justify-center text-sm ${isActive ? 'bg-pink-600/40 text-white font-bold' : 'text-white/80'} ${lockedCat ? 'opacity-60' : ''}`}>
                {cat} {lockedCat ? '🔒' : ''}
              </li>
            );
          })}
        </ul>
      </div>
      <button
        onClick={handleSpin}
        disabled={disabled || spinning}
        className={`mt-3 px-4 py-2 rounded-lg font-semibold ${disabled || spinning ? 'bg-gray-600 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'} text-white`}
      >
        {spinning ? 'Spinning…' : 'Spin'}
      </button>
      {result && (
        <div className="mt-2 text-white/80 text-sm">Selected: <span className="text-white font-bold">{result}</span></div>
      )}
      <div className="mt-2 text-white/60 text-xs">Locked categories are skipped if possible</div>
    </div>
  );
};

export default Round3Spin;
