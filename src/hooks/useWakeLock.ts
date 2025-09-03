import { useEffect, useRef } from 'react';

// Keeps the screen awake while `active` is true using the Screen Wake Lock API (where supported).
// Automatically re-acquires on visibility changes.
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<any | null>(null);

  useEffect(() => {
    const nav: any = navigator as any;
    const supported = typeof nav !== 'undefined' && 'wakeLock' in nav;
    if (!active || !supported || document.visibilityState !== 'visible') {
      return;
    }

    let cancelled = false;

    const requestWakeLock = async () => {
      try {
        // Some browsers require a user gesture; best-effort attempt.
        const wl = await nav.wakeLock.request('screen');
        if (cancelled) {
          try { await wl.release(); } catch {}
          return;
        }
        wakeLockRef.current = wl;
        wl.addEventListener?.('release', () => {
          // Optionally, we could try to re-acquire here.
        });
      } catch (err) {
        // Silent fallback; not all browsers support or allow it without gesture.
        console.debug('[wakeLock] request failed:', err);
      }
    };

    requestWakeLock();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      const current = wakeLockRef.current;
      if (current) {
        try { current.release(); } catch {}
        wakeLockRef.current = null;
      }
    };
  }, [active]);
}
