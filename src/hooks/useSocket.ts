import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Generate a unique player ID
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Ensure player has a persistent ID
const getPlayerPersistentId = (): string => {
  if (!localStorage.getItem('persistentPlayerId')) {
    localStorage.setItem('persistentPlayerId', generateUniqueId());
  }
  return localStorage.getItem('persistentPlayerId') as string;
};

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [persistentId] = useState(getPlayerPersistentId());
  const socketRef = useRef<Socket | null>(null);
  const socketCreatedRef = useRef(false);

  // Return the socket from ref, not state
  const socket = socketRef.current;

  useEffect(() => {
    // Only create socket once
    if (socketCreatedRef.current) {
      return;
    }
    
    console.log('Creating new socket connection...');
    socketCreatedRef.current = true;
    
    // Use window.location to dynamically determine server URL
    (async () => {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const host = window.location.hostname;
      // Allow manual override: set window.__GAME_SERVER_PORT or ?serverPort=####
      let overridePort: number | undefined;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qp = urlParams.get('serverPort');
        if (qp) overridePort = parseInt(qp, 10);
        // @ts-ignore optional global injection
        if (!overridePort && window.__GAME_SERVER_PORT) overridePort = parseInt(String(window.__GAME_SERVER_PORT), 10);
      } catch {}

      // Never treat the client dev port (5173) as a server candidate; server is separate (3001+)
      const BASE_SERVER_START = 3001;
      const fallbackRange = Array.from({length:15}, (_,i)=>BASE_SERVER_START+i);
      const candidatePorts = overridePort ? [overridePort, ...fallbackRange] : fallbackRange;
      const urls = (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.'))
        ? candidatePorts.map(p => `${protocol}//${host}:${p}`)
        : ['/'];

  let workingSocket: Socket | null = null;
      let connectedUrl: string | null = null;
      let handshakeReceived = false;

      const attempt = (url: string): Promise<boolean> => {
        return new Promise(resolve => {
          console.log(`[socket] Attempting connection to ${url}`);
          const candidate = io(url, {
            reconnectionAttempts: 0,
            timeout: 4000,
            transports: ['websocket','polling'],
            auth: { persistentId },
            forceNew: true,
            autoConnect: true
          });
          let done = false;
            const finish = (ok: boolean) => {
              if (done) return; done = true; resolve(ok);
              if (!ok) { try { candidate.close(); } catch {} }
            };
          const handshakeTimer = setTimeout(() => {
            if (!handshakeReceived) {
              console.warn('[socket] No handshake after connect; closing and trying next port');
              finish(false);
            }
          }, 1500);
          candidate.once('server-handshake', () => {
            handshakeReceived = true;
          });
          candidate.once('connect', () => {
            // We still wait for handshake; if not arrives in 1.5s we drop
            // keep candidate open tentatively
          });
          candidate.once('connect_error', () => {
            clearTimeout(handshakeTimer);
            finish(false);
          });
          candidate.once('disconnect', () => {
            if (!handshakeReceived) finish(false);
          });
          // If handshake arrives later
          candidate.on('server-handshake', (info) => {
            clearTimeout(handshakeTimer);
            if (!done) {
              workingSocket = candidate;
              connectedUrl = url;
              finish(true);
            }
            console.log('[socket] Handshake received', info);
            // If connect event already fired earlier, ensure we mark connected
            if (candidate.connected) {
              try { setConnected(true); } catch {}
            }
          });
        });
      };

      for (const url of urls) {
        handshakeReceived = false;
        const ok = await attempt(url);
        if (ok) break;
      }

      // Fallback: try origin port (dev server) only if all server ports failed
      if (!workingSocket) {
        const originPort = window.location.port;
        if (originPort) {
          const originUrl = `${protocol}//${host}:${originPort}`;
          console.warn('[socket] Trying fallback origin URL', originUrl);
          await attempt(originUrl);
        }
      }

      if (!workingSocket || !connectedUrl) {
        console.error('[socket] Could not connect to any server (including fallback). Will retry in 5s.');
        setTimeout(() => { socketCreatedRef.current = false; }, 5000); // allow retry
        return;
      }

      console.log(`[socket] Connected via ${connectedUrl}`);
      socketRef.current = workingSocket;
      const ws = workingSocket as Socket; // non-null assertion for listeners
      ws.on('server-port', (data: any) => console.log('[socket] Server active port broadcast', data));
      ws.on('server-heartbeat', () => {/* heartbeat */});
      ws.on('connect', () => { setConnected(true); });
      ws.on('disconnect', () => {
        setConnected(false);
        console.log('[socket] Disconnected; scheduling reconnect attempt');
        setTimeout(() => { socketCreatedRef.current = false; }, 3000);
      });
      try { fetch('/health').then(r=>r.json()).then(h=>console.log('[socket] Health endpoint', h)).catch(()=>{}); } catch {}
    })();

    // Legacy fallback (unused if early return above succeeds) -----------------
    // (Removed legacy single-endpoint fallback; dynamic logic above suffices)
  }, [persistentId]);

  return { socket, connected };
};
