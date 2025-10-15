import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Optional: Sentry for client-side error monitoring
try {
  // @ts-ignore env via Vite
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (dsn && typeof window !== 'undefined') {
    // Dynamically import to avoid bundling if not used
    // @ts-ignore transient types resolution in some editors
    import('@sentry/browser').then((Sentry: any) => {
      Sentry.init({ dsn, tracesSampleRate: 0.1 });
    }).catch(() => {/* ignore */});
  }
} catch {}

// Create history API fallback for QR code paths
// This ensures direct navigation to /join/ROOMCODE works properly
window.addEventListener('popstate', () => {
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
