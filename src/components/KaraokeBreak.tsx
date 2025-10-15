import React, { useEffect, useState, useRef } from 'react';
import { Mic, Music2, Timer } from 'lucide-react';
import { GameState } from '../types/game';
import { Socket } from 'socket.io-client';

interface KaraokeBreakProps {
  gameState: GameState;
  socket: Socket;
  playerId: string;
  roomCode: string;
}

const KaraokeBreak: React.FC<KaraokeBreakProps> = ({ gameState, socket, playerId, roomCode }) => {
  console.log('[KaraokeBreak] Component rendering with props:', { 
    playerId, 
    roomCode, 
    gamePhase: gameState.gamePhase,
    votingOptions: gameState.karaokeVotingOptions?.length || 0,
    karaokeVotes: gameState.karaokeVotes
  });
  
  const song = gameState.currentKaraokeSong;
  const isHost = gameState.players.find(p=>p.id===playerId)?.isHost;
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [selectedVotes, setSelectedVotes] = useState<number[]>([]);
  const syncPendingRef = useRef<boolean>(false);
  // Short guard window after a click/ack to ignore stale server snapshots that could clear highlights
  const ignoreUntilRef = useRef<number>(0);
  // Mirror pending in state so the Debug panel reflects it immediately (useRef alone won't rerender)
  const [pendingState, setPendingState] = useState<boolean>(false);
  const hydratedRef = useRef<boolean>(false);
  // Guard to prevent re-entrant click handling during rapid re-renders
  const clickInProgressRef = useRef<boolean>(false);
  // Track last emitted vote to prevent duplicate emissions
  const lastEmittedRef = useRef<{idx: number, ts: number} | null>(null);

  // Initialize (hydrate) selectedVotes from server; ignore while pending; run once per voting phase
  useEffect(() => {
    if (gameState.gamePhase !== 'karaoke_voting') {
      hydratedRef.current = false;
      setSelectedVotes([]);
      return;
    }
    if (hydratedRef.current) return;
    const serverVotesRaw = gameState.karaokeVotes?.[playerId];
    const serverVotes = Array.isArray(serverVotesRaw)
      ? (serverVotesRaw as number[])
      : (serverVotesRaw !== undefined ? [serverVotesRaw as unknown as number] : []);
    // Respect the ignore window to avoid adopting a stale snapshot right after a click
    if (!syncPendingRef.current && Date.now() >= ignoreUntilRef.current) {
      setSelectedVotes(serverVotes);
      hydratedRef.current = true;
    }
  }, [gameState.gamePhase, gameState.karaokeVotes, playerId, gameState.id]);
  const barsRef = useRef<number[]>(Array.from({length:24},()=>Math.random()));
  const [, forceTick] = useState(0);
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const confettiPieces = useRef<any[]>([]);
  const lastVoteClickAtRef = useRef<number>(0);

  // Sync local selections to server ack to avoid any drift
  useEffect(() => {
    const onAck = (data: { ok?: boolean; picked?: number[] }) => {
      if (data && Array.isArray(data.picked)) {
        // Ignore empty acks while we're in the pending/ignore window (server race)
        if (data.picked.length === 0 && Date.now() < ignoreUntilRef.current) {
          console.log('[karaoke] vote ack IGNORED (empty during pending window)', data.picked);
          return;
        }
        syncPendingRef.current = false;
        setPendingState(false);
        setSelectedVotes(Array.from(new Set(data.picked)));
        console.log('[karaoke] vote ack ACCEPTED', data.picked);
      }
    };
    socket.on('karaoke-vote-ack', onAck);
    return () => { socket.off('karaoke-vote-ack', onAck); };
  }, [socket]);

  // Timer based on synchronized start time
  useEffect(() => {
    if (!startedAt) return;
    const i = setInterval(()=> setElapsed(Math.floor((Date.now()-startedAt)/1000)), 500);
    return () => clearInterval(i);
  }, [startedAt]);

  // Initialize from gameState or wait for sync
  useEffect(() => {
    if (gameState.gamePhase === 'karaoke_break' && gameState.karaokeStartAt) {
      setStartedAt(gameState.karaokeStartAt);
    } else if (gameState.gamePhase === 'karaoke_voting' && gameState.karaokeVotingEndAt) {
      setStartedAt(gameState.karaokeVotingEndAt - 30000); // Voting starts 30s before end
    }
  }, [gameState.gamePhase, gameState.karaokeStartAt, gameState.karaokeVotingEndAt]);

  // Listen for karaoke-sync events for correction
  useEffect(() => {
    const handler = (data: { startAt: number; duration: number }) => {
      if (!startedAt || Math.abs(startedAt - data.startAt) > 500) {
        setStartedAt(data.startAt);
      }
    };
    socket.on('karaoke-sync', handler);
    return () => { socket.off('karaoke-sync', handler); };
  }, [socket, startedAt]);

  // Host periodically requests sync broadcast (or could directly emit if desired)
  useEffect(() => {
    if (!isHost) return;
    if (gameState.gamePhase !== 'karaoke_break' && gameState.gamePhase !== 'karaoke_voting') return;
    const id = setInterval(() => {
      socket.emit('request-karaoke-sync', roomCode, playerId);
    }, 4000);
    return () => clearInterval(id);
  }, [isHost, gameState.gamePhase, socket, roomCode, playerId]);

  // Equalizer animation
  useEffect(() => {
    let raf:number;
    const animate = () => {
  barsRef.current = barsRef.current.map((v) => {
        const target = Math.random();
        return v + (target - v) * 0.25;
      });
      forceTick(x=>x+1);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Simple confetti system
  useEffect(() => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    w();
    window.addEventListener('resize', w);
    // init pieces
    confettiPieces.current = Array.from({length:120}).map(()=>({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height - canvas.height,
      r: 4 + Math.random()*6,
      c: `hsl(${Math.random()*360},80%,60%)`,
      vy: 1 + Math.random()*3,
      vx: -1 + Math.random()*2,
      rot: Math.random()*Math.PI,
      vr: -0.05 + Math.random()*0.1
    }));
    let frame:number;
    const step = () => {
      if (!ctx) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      confettiPieces.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y - p.r > canvas.height) {
          p.y = -10; p.x = Math.random()*canvas.width; p.vy = 1 + Math.random()*3;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);
        ctx.restore();
      });
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', w); };
  }, []);

  // --- Voice selection helper (choose a realistic human-like voice if available) ---
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  function selectPreferredVoice() {
    if (!('speechSynthesis' in window)) return null;
    if (preferredVoiceRef.current) return preferredVoiceRef.current;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    const targetNames = [
      'Microsoft Aria Online', 'Microsoft Jenny Online', 'Microsoft Zira Online',
      'Google UK English Female', 'Google US English', 'Google English',
      'Microsoft Zira', 'Microsoft Aria', 'Microsoft Jenny', 'Samantha', 'Victoria', 'Zira'
    ].map(v => v.toLowerCase());
    const humanRegex = /online|neural|natural|aria|jenny|zira|samantha|victoria/i;
    let candidate = voices.find(v => targetNames.includes(v.name.toLowerCase()));
    if (!candidate) candidate = voices.find(v => humanRegex.test(v.name));
    if (!candidate) candidate = voices.find(v => /en-/i.test(v.lang));
    preferredVoiceRef.current = candidate || null;
    return preferredVoiceRef.current;
  }
  function speak(text: string, rate=0.95, pitch=1.0) { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voice = selectPreferredVoice();
    if (voice) utter.voice = voice;
    utter.rate = rate; utter.pitch = pitch; utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }
  // Re-select once voices load asynchronously
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const handle = () => { selectPreferredVoice(); };
    window.speechSynthesis.addEventListener('voiceschanged', handle);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handle);
  }, []);

  // Speak Alexa play only on host (using enhanced female voice selection)
  // Note: This TTS doesn't actually control Alexa - users must speak the command manually
  useEffect(() => {
    if (!song || !isHost) return;
    // Optional: Comment out TTS since Alexa can't hear browser audio
    speak(`Alexa, play ${song.alexaPhrase}`, 0.95, 1.0);
  }, [song, isHost]);

  // Speak Alexa stop on explicit server karaoke-ended event (covers auto + manual end)
  // Note: TTS doesn't control Alexa - this is just for user awareness
  useEffect(() => {
    const handler = () => { 
      // Optional: Comment out TTS since Alexa can't hear browser audio
      if (isHost) speak('Alexa, stop', 0.95, 1.0); 
    };
    socket.on('karaoke-ended', handler);
    return () => { socket.off('karaoke-ended', handler); };
  }, [socket, isHost]);

  if (gameState.gamePhase === 'karaoke_voting') {
    const votingOptions = gameState.karaokeVotingOptions || [];
    const nowTs = Date.now();
    const votingEndAtRaw = gameState.karaokeVotingEndAt || 0;
    // If server didn't provide an end time yet, assume 30s from a derived start (or from now)
    const assumedStart = startedAt ?? (votingEndAtRaw > 0 ? votingEndAtRaw - 30000 : nowTs);
    const effectiveEndAt = votingEndAtRaw > 0 ? votingEndAtRaw : (assumedStart + 30000);
    const timeLeft = Math.max(0, Math.floor((effectiveEndAt - nowTs) / 1000));
    const totalVotingWindowMs = Math.max(1000, effectiveEndAt - assumedStart);
    const voteProgress = Math.max(0, Math.min(1, (effectiveEndAt - nowTs) / totalVotingWindowMs));
    const playerVotes = Array.isArray(gameState.karaokeVotes?.[playerId])
      ? (gameState.karaokeVotes![playerId] as number[])
      : (gameState.karaokeVotes?.[playerId] !== undefined ? [gameState.karaokeVotes![playerId] as unknown as number] : []);
  // const hasCompletedVoting = playerVotes.length >= 2; // no longer used for disabling; kept server-side

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6 pointer-events-auto">
        <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-fuchsia-700/40 via-indigo-700/30 to-purple-800/40 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music2 className="w-8 h-8 text-pink-300 animate-pulse" />
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
                KARAOKE VOTING
              </h1>
              <Mic className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
            {/* Visible playerId check for debugging */}
            <div className="text-center text-white/60 text-xs mb-2">
              Voting as: {gameState.players.find(p => p.id === playerId)?.name || 'Unknown'} ({playerId})
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  <path d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" fill="none" stroke="url(#votegrad)" strokeWidth="4" strokeDasharray={`${Math.round(voteProgress*100)},100`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="votegrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FDE68A" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{timeLeft}s</div>
              </div>
              <p className="text-white/80 text-sm">Choose two songs you want to sing! Most votes win.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {votingOptions.map((option, index) => {
                const isSelected = selectedVotes.includes(index);
                const isVoted = playerVotes.includes(index);
                // Show selection state if either local or server reflects this choice
                const showAsSelected = isSelected || isVoted;
                // Compute vote bars using server votes for others, and local selections for self (optimistic)
                const rawVotes = gameState.karaokeVotes || {};
                const entries = Object.entries(rawVotes) as Array<[string, number | number[] | undefined]>;
                const othersVotes = entries.flatMap(([pid, v]) => (
                  pid === playerId ? [] : (Array.isArray(v) ? v : (v !== undefined ? [v as number] : []))
                )) as number[];
                const selfServerVotesRaw = gameState.karaokeVotes?.[playerId];
                const selfServerVotes = Array.isArray(selfServerVotesRaw)
                  ? (selfServerVotesRaw as number[])
                  : (selfServerVotesRaw !== undefined ? [selfServerVotesRaw as unknown as number] : []);
                const selfEffectiveVotes = (syncPendingRef.current || selectedVotes.length > 0) ? selectedVotes : selfServerVotes;
                const combinedVotes = [...othersVotes, ...selfEffectiveVotes];
                const votesFor = combinedVotes.filter(v => v === index).length;
                const perOptionCounts = votingOptions.map((_, i) => combinedVotes.filter(v => v === i).length);
                const maxVotes = Math.max(1, ...perOptionCounts);
                const pct = Math.round((votesFor / maxVotes) * 100);
                return (
                  <button
                    key={`${option.title}-${index}`}
                    data-index={index}
                    type="button"
                    onClick={(e) => {
                      console.log('[karaoke] CLICK FIRED', { index, playerId, roomCode, optionTitle: option.title, ts: Date.now() });
                      
                      // Prevent re-entrant handling if we're already processing a click
                      if (clickInProgressRef.current) {
                        console.log('[karaoke] click IGNORED (already in progress)');
                        return;
                      }
                      clickInProgressRef.current = true;
                      
                      const nowClick = Date.now();
                      if (nowClick >= effectiveEndAt) {
                        console.warn('[karaoke] vote ignored: voting closed', { nowClick, effectiveEndAt });
                        clickInProgressRef.current = false;
                        return;
                      }
                      const now = Date.now();
                      if (now - (lastVoteClickAtRef.current || 0) < 250) {
                        console.log('[karaoke] debounced (too fast)');
                        clickInProgressRef.current = false;
                        return;
                      }
                      lastVoteClickAtRef.current = now;
                      // Derive the index from dataset to avoid any closure mismatch
                      const target = e.currentTarget as HTMLButtonElement;
                      const idxAttr = target.getAttribute('data-index');
                      const idx = idxAttr ? parseInt(idxAttr, 10) : index;
                      console.log('[karaoke] vote click processing', { optionIndex: idx, optionTitle: option.title, playerId, roomCode, t: now });
                      // Mark pending before local state so server update won't override immediately and open a short ignore window
                      syncPendingRef.current = true;
                      setPendingState(true);
                      ignoreUntilRef.current = now + 800; // ignore server snapshots for 800ms
                      console.log('[karaoke] pending set to true; ignoreUntil', ignoreUntilRef.current);
                      // Fallback: clear pending if no ack within 3s
                      setTimeout(() => {
                        if (syncPendingRef.current && Date.now() > ignoreUntilRef.current) {
                          console.log('[karaoke] fallback timeout: clearing pending');
                          syncPendingRef.current = false;
                          setPendingState(false);
                        }
                      }, 3000);
                      
                      // Single state update with functional form to avoid stale closures
                      setSelectedVotes(prev => {
                        console.log('[karaoke] setSelectedVotes called', { prev, idx });
                        // Mirror server toggle logic exactly: if already in array, remove it; else add (capped at 2)
                        let next = [...prev];
                        const existingIdx = next.indexOf(idx);
                        if (existingIdx >= 0) {
                          // Already selected: remove it (toggle off)
                          next.splice(existingIdx, 1);
                          console.log('[karaoke] toggled OFF', idx);
                        } else {
                          // Not selected: add it (remove oldest if already at 2)
                          if (next.length >= 2) {
                            next.shift(); // remove oldest
                            console.log('[karaoke] replaced oldest; adding', idx);
                          } else {
                            console.log('[karaoke] adding', idx);
                          }
                          next.push(idx);
                        }
                        console.log('[karaoke] next selectedVotes', next);
                        // emit to server (guard against duplicate emission within 200ms)
                        const now = Date.now();
                        if (lastEmittedRef.current?.idx === idx && (now - lastEmittedRef.current.ts) < 200) {
                          console.log('[karaoke] skipping duplicate emission', idx);
                        } else {
                          socket.emit('karaoke-vote', roomCode, playerId, idx);
                          lastEmittedRef.current = { idx, ts: now };
                          console.log('[karaoke] emitted karaoke-vote', { roomCode, playerId, idx });
                        }
                        // Clear the click lock after a short delay to allow state to settle
                        setTimeout(() => { clickInProgressRef.current = false; }, 100);
                        return next;
                      });
                    }}
                    disabled={Date.now() >= effectiveEndAt}
                    className={`p-4 rounded-xl border transition-all ${
                      showAsSelected
                        ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                        : (Date.now() >= effectiveEndAt)
                        ? 'bg-gray-600/30 border-gray-500 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{option.title}</div>
                    <div className="text-sm opacity-80">by {option.artist}</div>
                    <div className="text-xs opacity-60 uppercase mt-1">{option.difficulty}</div>
                    <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden" aria-hidden>
                      <div className="h-full bg-gradient-to-r from-pink-400 to-yellow-300" style={{ width: `${pct}%`, transition: 'width 250ms linear' }} />
                    </div>
                    <div className="text-[10px] text-white/60 mt-1">Votes: {votesFor}</div>
                    {showAsSelected ? (
                      <div className="text-blue-300 font-semibold mt-2">
                        {isVoted ? '✓ Voted!' : 'Selected…'}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {/* Voting instructions / status */}
            {(Date.now() >= effectiveEndAt) ? (
              <div className="text-yellow-300 font-bold text-sm text-center">Voting closed — tallying votes…</div>
            ) : (
              <div className="text-white/70 text-sm text-center">Tap to select up to two songs. You can change your choices until the timer ends.</div>
            )}

            {import.meta.env.DEV && (
              <div className="mt-4 text-xs text-white/70 bg-black/30 rounded-lg p-2 border border-white/10">
                <div className="font-semibold mb-1">Debug (client-side)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div>room: {roomCode}</div>
                    <div>playerId: {playerId}</div>
                    <div>pending: {String(pendingState)}</div>
                    <div>local selected: [{selectedVotes.join(', ')}]</div>
                  </div>
                  <div>
                    <div>server self: [{(Array.isArray(gameState.karaokeVotes?.[playerId]) ? gameState.karaokeVotes?.[playerId] : (gameState.karaokeVotes?.[playerId] !== undefined ? [gameState.karaokeVotes?.[playerId] as unknown as number] : [])).join(', ')}]</div>
                    <div>server keys: [{Object.keys(gameState.karaokeVotes || {}).length}]</div>
                    <div>timeLeft: {Math.max(0, Math.floor((effectiveEndAt - Date.now()) / 1000))}s</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!song) return null;

  const duration = gameState.karaokeSettings?.durationSec || song.durationHintSec || 45;
  const remaining = duration - elapsed;
  const progress = Math.max(0, Math.min(1, remaining / duration));

  return (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 pointer-events-auto">
      <canvas ref={confettiRef} className="absolute inset-0 w-full h-full pointer-events-none" />
  <div className="relative max-w-xl w-full text-center bg-gradient-to-br from-fuchsia-700/40 via-indigo-700/30 to-purple-800/40 border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden">
        {/* Decorative particles */}
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{backgroundImage:'radial-gradient(circle at 30% 20%,rgba(255,255,255,0.15),transparent 60%),radial-gradient(circle at 70% 80%,rgba(255,255,255,0.12),transparent 65%)'}} />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mic className="w-8 h-8 text-pink-300 animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
              KARAOKE BREAK
            </h1>
            <Music2 className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          <p className="text-white/80 text-sm mb-6">Everyone sings! Say this command to Alexa:
            <span className="block mt-1 text-white font-semibold">Alexa, play {song.alexaPhrase}</span>
          </p>
          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-200 text-xs font-medium mb-2">
              💡 <strong>Alexa Integration Tips:</strong>
            </p>
            <ul className="text-yellow-200 text-xs space-y-1">
              <li>• Position Alexa device close to someone who can speak</li>
              <li>• Increase device volume before karaoke starts</li>
              <li>• Have someone say: "Alexa, play {song.alexaPhrase}"</li>
              <li>• Alternative: Use phone as Bluetooth speaker for Echo</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
            <div className="grid grid-cols-[80px,1fr] gap-4 items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  <path d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" fill="none" stroke="url(#grad)" strokeWidth="4" strokeDasharray={`${Math.round(progress*100)},100`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FDE68A" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{Math.max(0, remaining)}s</div>
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-white mb-1">{song.title}</div>
                {song.artist && <div className="text-white/70 text-sm mb-2">by {song.artist}</div>}
                <div className="flex items-center gap-2 text-white/70 text-xs tracking-wide">
                  <Timer className="w-4 h-4" />
                  <span>{Math.max(0, remaining)}s left</span>
                  <span className="opacity-40">•</span>
                  <span className="uppercase">Difficulty: {song.difficulty || 'easy'}</span>
                </div>
              </div>
            </div>
            {/* Equalizer */}
            <div className="mt-4 h-20 flex items-end justify-center gap-[3px]">
              {barsRef.current.map((v,i) => (
                <div key={i} className="w-[6px] rounded-t bg-gradient-to-b from-yellow-300 via-pink-300 to-purple-500" style={{height: `${10 + v*70}px`, opacity: 0.6 + v*0.4, animation: 'none'}} />
              ))}
            </div>
          </div>
          {isHost && (
            <button
              onClick={() => socket.emit('karaoke-end', roomCode, playerId)}
              className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-pink-500 to-amber-400 text-black shadow hover:from-pink-400 hover:to-amber-300 transition"
            >
              Resume Game
            </button>
          )}
          <div className="mt-6 text-[10px] tracking-widest uppercase text-white/40">Break #{gameState.karaokeBreakCount}</div>
        </div>
      </div>
    </div>
  );
};

export default KaraokeBreak;
