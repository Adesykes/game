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
  const [selectedVotes, setSelectedVotes] = useState<number[]>([]);

  // Initialize selectedVotes from server state
  useEffect(() => {
    if (gameState.gamePhase === 'karaoke_voting' && gameState.karaokeVotes?.[playerId]) {
      const playerVotes = Array.isArray(gameState.karaokeVotes[playerId])
        ? (gameState.karaokeVotes[playerId] as number[])
        : (gameState.karaokeVotes[playerId] !== undefined ? [gameState.karaokeVotes[playerId] as unknown as number] : []);
      setSelectedVotes(playerVotes);
    }
  }, [gameState.gamePhase, gameState.karaokeVotes, playerId]);
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
    const votingEndAt = gameState.karaokeVotingEndAt || 0;
    const timeLeft = Math.max(0, Math.floor((votingEndAt - Date.now()) / 1000));
    const playerVotes = Array.isArray(gameState.karaokeVotes?.[playerId])
      ? (gameState.karaokeVotes![playerId] as number[])
      : (gameState.karaokeVotes?.[playerId] !== undefined ? [gameState.karaokeVotes![playerId] as unknown as number] : []);
    const hasCompletedVoting = playerVotes.length >= 2;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6">
        <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-fuchsia-700/40 via-indigo-700/30 to-purple-800/40 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music2 className="w-8 h-8 text-pink-300 animate-pulse" />
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
                KARAOKE VOTING
              </h1>
              <Mic className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-white/80 text-sm mb-6">Choose two songs you want to sing! Most votes win. Voting ends in {timeLeft}s</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {votingOptions.map((option, index) => {
                const isSelected = selectedVotes.includes(index);
                const isVoted = hasCompletedVoting && playerVotes.includes(index);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (hasCompletedVoting) return;
                      setSelectedVotes(prev => {
                        let next = prev;
                        if (prev.includes(index)) {
                          next = prev.filter(i => i !== index);
                        } else if (prev.length < 2) {
                          next = [...prev, index];
                        } else {
                          // replace the first one to keep at most two
                          next = [prev[1], index];
                        }
                        // emit each change; server caps at two per player
                        socket.emit('karaoke-vote', roomCode, playerId, index);
                        return next;
                      });
                    }}
                    disabled={hasCompletedVoting}
                    className={`p-4 rounded-xl border transition-all ${
                      isVoted
                        ? 'bg-green-600/30 border-green-400 text-green-200'
                        : isSelected
                        ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                        : hasCompletedVoting
                        ? 'bg-gray-600/30 border-gray-500 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{option.title}</div>
                    <div className="text-sm opacity-80">by {option.artist}</div>
                    <div className="text-xs opacity-60 uppercase mt-1">{option.difficulty}</div>
                    {isVoted && <div className="text-green-300 font-bold mt-2">✓ Voted!</div>}
                  </button>
                );
              })}
            </div>
            {/* Submission notice */}
            {hasCompletedVoting && (
              <div className="text-green-400 font-bold text-xl">
                Votes submitted! Waiting for others...
              </div>
            )}
            {!hasCompletedVoting && (
              <div className="text-white/70 text-sm text-center">Tap to select up to two songs. Tap again to unselect. Your latest two choices are counted.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!song) return null;

  const duration = gameState.karaokeSettings?.durationSec || song.durationHintSec || 45;
  const remaining = duration - elapsed;

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
