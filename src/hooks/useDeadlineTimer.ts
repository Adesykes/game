import { useEffect, useMemo, useRef, useState } from 'react';

// Shared countdown hook driven by a server-authoritative absolute deadline (ms since epoch)
// Returns: secondsLeft (int), isExpired (bool), and drift (ms) estimate
export function useDeadlineTimer(deadlineMs?: number | null, tickMs: number = 250) {
  const [now, setNow] = useState<number>(() => Date.now());
  const lastTickRef = useRef<number>(Date.now());
  const [drift, setDrift] = useState<number>(0);

  useEffect(() => {
    if (!deadlineMs || deadlineMs <= Date.now()) {
      setNow(Date.now());
      return;
    }
    let id: any;
    const loop = () => {
      const t = Date.now();
      const elapsed = t - lastTickRef.current;
      lastTickRef.current = t;
      setDrift(Math.abs(elapsed - tickMs));
      setNow(t);
      id = setTimeout(loop, tickMs);
    };
    id = setTimeout(loop, tickMs);
    return () => clearTimeout(id);
  }, [deadlineMs, tickMs]);

  const secondsLeft = useMemo(() => {
    if (!deadlineMs) return 0;
    return Math.max(0, Math.ceil((deadlineMs - now) / 1000));
  }, [deadlineMs, now]);

  return { secondsLeft, isExpired: secondsLeft <= 0, drift } as const;
}
