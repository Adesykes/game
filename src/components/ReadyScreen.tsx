import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Users } from 'lucide-react';
import { GameState } from '../types/game';
import { Socket } from 'socket.io-client';

interface ReadyScreenProps {
  socket: Socket;
  gameState: GameState;
  playerId: string;
  roomCode: string;
}

const ReadyScreen: React.FC<ReadyScreenProps> = ({ socket, gameState, playerId, roomCode }) => {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const i = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(i);
  }, []);

  const me = gameState.players.find(p => p.id === playerId);

  // Global forced music handled centrally (remove local toggle)
  const handleReady = () => {
    if (!me?.isReady) socket.emit('player-ready', roomCode, playerId);
  };

  const readyCount = gameState.players.filter(p => p.isReady).length;
  const isHost = me?.isHost;
  const total = gameState.players.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-pink-900 via-indigo-900 to-black relative">
      {/* Floating sparkles */}
      <div className="pointer-events-none absolute inset-0 opacity-40 animate-pulse" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15), transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1), transparent 60%)' }} />
  <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_60%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.1),transparent_65%)]" />

      <div className={`relative z-10 text-center transform transition-all ${pulse ? 'scale-[1.02]' : 'scale-100'}`}>
        <div className="flex items-center justify-center mb-6 gap-4 relative">
          <Sparkles className="w-10 h-10 text-yellow-300 animate-spin-slow" />
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
            WELCOME TO DRUNK GAMES NIGHT
          </h1>
          <Sparkles className="w-10 h-10 text-pink-300 animate-spin-slow-rev" />
          <span className="absolute -right-4 -top-8 md:right-0 md:top-1 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-white/10 text-white/60 backdrop-blur border border-white/15">Music Active</span>
        </div>
        <p className="text-white/80 max-w-xl mx-auto mb-10 text-sm md:text-base leading-relaxed">
          Get your drinks ready 🍻 – once everyone hits <span className="text-yellow-300 font-semibold">READY</span>, the madness begins.
        </p>

        <button
          disabled={me?.isReady}
          onClick={handleReady}
          className={`group relative inline-flex items-center justify-center px-10 py-5 rounded-full font-bold text-lg transition-all ${me?.isReady ? 'bg-green-600/60 text-white cursor-default' : 'bg-gradient-to-r from-fuchsia-500 to-amber-400 hover:from-fuchsia-400 hover:to-amber-300 text-black'} shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)]`}
        >
          {me?.isReady ? (
            <span className="flex items-center gap-2"><CheckCircle2 className="w-6 h-6" /> READY</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles className="w-6 h-6" /> READY TO PLAY</span>
          )}
          {!me?.isReady && <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/20" />}
        </button>

        <div className="mt-8 text-white/90 flex flex-col items-center">
          <div className="flex items-center gap-2 text-sm tracking-wide">
            <Users className="w-5 h-5" />
            <span>{readyCount} / {total} players ready</span>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-md">
            {gameState.players.map(p => (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm backdrop-blur bg-white/10 border ${p.isReady ? 'border-green-400/50' : 'border-white/10'} ${p.isReady ? 'shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}`}>
                <span className="text-lg">{p.avatar}</span>
                <span className={`font-semibold ${p.isReady ? 'text-green-300' : 'text-white/80'}`}>{p.name}</span>
                {p.isReady && <CheckCircle2 className="w-4 h-4 text-green-300 ml-auto" />}
              </div>
            ))}
          </div>
          {gameState.allReady ? (
            <div className="mt-8 text-green-300 font-semibold animate-pulse">All players ready! Starting...</div>
          ) : isHost && (
            <button
              onClick={() => socket.emit('host-force-start', roomCode, playerId)}
              className="mt-8 text-xs tracking-wide px-4 py-2 rounded-md bg-red-600/70 hover:bg-red-600 text-white font-semibold shadow inline-flex items-center gap-2"
            >
              Force Start
            </button>
          )}
          <div className="mt-10 text-[10px] uppercase tracking-widest text-white/30">Room Code: {gameState.id}</div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes spin-slow-rev { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
        .animate-spin-slow { animation: spin-slow 9s linear infinite; }
        .animate-spin-slow-rev { animation: spin-slow-rev 11s linear infinite; }
      `}</style>
    </div>
  );
};

export default ReadyScreen;
