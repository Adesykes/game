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
  const song = gameState.currentKaraokeSong;
  const isHost = gameState.players.find(p=>p.id===playerId)?.isHost;
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const barsRef = useRef<number[]>(Array.from({length:24},()=>Math.random()));
  const [, forceTick] = useState(0);
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const confettiPieces = useRef<any[]>([]);

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
    }
  }, [gameState.gamePhase, gameState.karaokeStartAt]);

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
    if (gameState.gamePhase !== 'karaoke_break') return;
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

  // Speak Alexa play only on host
  useEffect(() => {
    if (!song || !isHost) return;
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(`Alexa, play ${song.alexaPhrase}`);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1;
      window.speechSynthesis.speak(u);
    }
  }, [song, isHost]);

  if (!song) return null;

  const duration = gameState.karaokeSettings?.durationSec || song.durationHintSec || 45;
  const remaining = duration - elapsed;

  // Speak Alexa stop only on host when karaoke ends
  useEffect(() => {
    if (!isHost) return;
    if (gameState.gamePhase !== 'karaoke_break' && song) {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('Alexa, stop');
        u.rate = 0.95; u.pitch = 1.0; u.volume = 1;
        window.speechSynthesis.speak(u);
      }
    }
  }, [gameState.gamePhase, song, isHost]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
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
          <p className="text-white/80 text-sm mb-6">Everyone sings! Alexa command spoken. If not heard, say:
            <span className="block mt-1 text-white font-semibold">Alexa, play {song.alexaPhrase}</span>
          </p>
          <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
            <div className="text-xl font-bold text-white mb-1">{song.title}</div>
            {song.artist && <div className="text-white/70 text-sm mb-2">by {song.artist}</div>}
            <div className="flex items-center justify-center gap-2 text-white/70 text-xs tracking-wide">
              <Timer className="w-4 h-4" />
              <span>{Math.max(0, remaining)}s left</span>
              <span className="opacity-40">•</span>
              <span className="uppercase">Difficulty: {song.difficulty || 'easy'}</span>
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
