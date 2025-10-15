import React, { useEffect, useMemo, useState } from 'react';
import { GameState } from '../types/game';
import { Trophy, Heart, Flame } from 'lucide-react';

interface ScoreboardInterludeProps {
  gameState: GameState;
  visible: boolean;
  onClose: () => void;
  durationMs?: number; // default ~12s
}

const ScoreboardInterlude: React.FC<ScoreboardInterludeProps> = ({ gameState, visible, onClose, durationMs = 12000 }) => {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setFading(false);
    const t1 = setTimeout(() => setFading(true), Math.max(0, durationMs - 600));
    const t2 = setTimeout(() => onClose(), durationMs);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, durationMs, onClose]);

  const stats = useMemo(() => {
    const active = gameState.players.filter(p => !p.isEliminated);
    const leaders = [...active].sort((a,b) => (b.powerBar ?? 0) - (a.powerBar ?? 0)).slice(0, 3);
    const streakLeader = [...active].sort((a,b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0))[0];
    const livesLeader = [...active].sort((a,b) => b.lives - a.lives)[0];
    return { leaders, streakLeader, livesLeader };
  }, [gameState.players]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[55] flex items-center justify-center p-4 transition-opacity ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative w-full max-w-3xl bg-white/10 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl text-white overflow-hidden ${fading ? 'scale-95' : 'scale-100'} transition-transform`}>
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{backgroundImage:'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15), transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1), transparent 60%)'}} />
        <div className="relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-7 h-7 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">Round Summary</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm text-white/70 mb-2">Top Power</h3>
              <div className="space-y-2">
                {stats.leaders.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.avatar}</span>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <div className="text-yellow-300 font-bold">{p.powerBar ?? 0}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm text-white/70 mb-2">Most Lives</h3>
              {stats.livesLeader && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stats.livesLeader.avatar}</span>
                    <span className="font-semibold">{stats.livesLeader.name}</span>
                  </div>
                  <div className="flex items-center text-red-300 font-bold">
                    <Heart className="w-4 h-4 mr-1" />
                    {stats.livesLeader.lives}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm text-white/70 mb-2">Longest Streak</h3>
              {stats.streakLeader && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stats.streakLeader.avatar}</span>
                    <span className="font-semibold">{stats.streakLeader.name}</span>
                  </div>
                  <div className="flex items-center text-orange-300 font-bold">
                    <Flame className="w-4 h-4 mr-1" />
                    {stats.streakLeader.currentStreak ?? 0}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-center mt-6 text-white/70 text-xs">Interlude — resuming shortly…</div>
        </div>
      </div>
    </div>
  );
};

export default ScoreboardInterlude;
