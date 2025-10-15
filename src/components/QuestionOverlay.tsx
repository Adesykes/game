import React from 'react';
import { Question } from '../types/game';
import { Socket } from 'socket.io-client';
import { useDeadlineTimer } from '../hooks/useDeadlineTimer';

interface QuestionOverlayProps {
  question: Question;
  isMyTurn: boolean;
  onSubmit: (answerIndex: number) => void;
  socket: Socket;
  lifelines: {
    fiftyFifty: number;
    passToRandom: number;
  };
  powerUps: {
    swap_question: number;
    steal_category: number;
  };
  playerId: string;
  roomCode: string;
  deadlineMs?: number | null;
  h2hInfo?: { active: boolean; challengerId?: string | null; opponentId?: string | null };
  // Total seconds for this question window (for progress bar); fallback handled if omitted
  windowSec?: number;
}

const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ question, isMyTurn, onSubmit, socket, lifelines, powerUps, playerId, roomCode, deadlineMs, h2hInfo, windowSec }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const { secondsLeft } = useDeadlineTimer(deadlineMs, 250);
  const isH2HParticipant = !!(h2hInfo?.active && (h2hInfo.challengerId === playerId || h2hInfo.opponentId === playerId));
  const totalWindow = Math.max(1, windowSec || 30);

  // --- lightweight sfx: confirm + gentle tick (last 5s) ---
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const ensureAudio = React.useCallback(async () => {
    if (typeof window === 'undefined') return null;
    const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }
    return ctx;
  }, []);
  const beep = React.useCallback(async (freq = 880, durMs = 70, vol = 0.15) => {
    const ctx = await ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durMs / 1000);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durMs / 1000 + 0.02);
  }, [ensureAudio]);
  const lastTickRef = React.useRef<number>(-1);
  React.useEffect(() => {
    const active = isMyTurn || isH2HParticipant;
    if (!active) return;
    if (secondsLeft > 0 && secondsLeft <= 5 && secondsLeft !== lastTickRef.current) {
      lastTickRef.current = secondsLeft;
      // softer and lower for urgency
      beep(700 - (5 - secondsLeft) * 40, 65, 0.12).catch(()=>{});
    }
  }, [secondsLeft, isMyTurn, isH2HParticipant, beep]);

  React.useEffect(() => {
    // Reset when question changes
    setSelectedAnswer(null);
  }, [question]);

  // Timer driven by server deadline via hook; no local countdown logic needed

  const handleSubmit = (answerIndex: number) => {
    if (!(isMyTurn || isH2HParticipant) || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    // tiny confirm bleep
    beep(980, 80, 0.18).catch(()=>{});
    onSubmit(answerIndex);
  };

  const handleFiftyFifty = () => {
    if (!isMyTurn || lifelines.fiftyFifty <= 0) return;
    beep(920, 80, 0.16).catch(()=>{});
    socket.emit('use-lifeline-fifty-fifty', roomCode, playerId);
  };

  const handlePassToRandom = () => {
    if (!isMyTurn || lifelines.passToRandom <= 0) return;
    beep(640, 90, 0.16).catch(()=>{});
    socket.emit('use-lifeline-pass-to-random', roomCode, playerId);
  };

  const handleSwapQuestion = () => {
    if (!isMyTurn || powerUps.swap_question <= 0) return;
    beep(560, 100, 0.18).catch(()=>{});
    socket.emit('powerup-swap-question', roomCode, playerId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-0 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden relative" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Top timer bar */}
        {(isMyTurn || isH2HParticipant) && (
          <div className="w-full h-1.5 bg-black/30">
            <div
              className={`h-full ${secondsLeft <= 5 ? 'bg-red-400' : secondsLeft <= 10 ? 'bg-yellow-400' : 'bg-green-400'}`}
              style={{ width: `${Math.max(0, Math.min(100, (secondsLeft / totalWindow) * 100))}%`, transition: 'width 250ms linear' }}
            />
          </div>
        )}
        <div className="p-6 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">{question.category}
            {h2hInfo?.active && (
              <span className="text-xs px-2 py-1 rounded-full bg-pink-600 text-white">Head-to-Head</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {/* Difficulty pill */}
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${
                question.difficulty === 'easy' ? 'bg-green-600/30 text-green-200 border border-green-400/40' :
                question.difficulty === 'medium' ? 'bg-yellow-600/30 text-yellow-200 border border-yellow-400/40' :
                'bg-red-600/30 text-red-200 border border-red-400/40'
              }`}
            >
              {question.difficulty}
            </span>
          {(isMyTurn || (h2hInfo?.active && (h2hInfo.challengerId === playerId || h2hInfo.opponentId === playerId))) && (
            <div className="flex items-center text-yellow-400">
              <span className="font-bold mr-1">⏱</span>
              <span className="font-bold">{secondsLeft}s</span>
            </div>
          )}
          </div>
        </div>
        <p className="text-lg mb-6 text-white">{question.question}</p>

  {/* Lifelines and Power-ups - only visible to current player */}
  {(isMyTurn || (h2hInfo?.active && (h2hInfo.challengerId === playerId || h2hInfo.opponentId === playerId))) && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                onClick={handleFiftyFifty}
                disabled={lifelines.fiftyFifty <= 0}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                50/50 ({lifelines.fiftyFifty})
              </button>
              <button
                onClick={handlePassToRandom}
                disabled={lifelines.passToRandom <= 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pass to Random ({lifelines.passToRandom})
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSwapQuestion}
                disabled={powerUps.swap_question <= 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Swap Question ({powerUps.swap_question})
              </button>
            </div>
          </div>
        )}

        {(isMyTurn || (h2hInfo?.active && (h2hInfo.challengerId === playerId || h2hInfo.opponentId === playerId))) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSubmit(index)}
                disabled={!(isMyTurn || (h2hInfo?.active && (h2hInfo.challengerId === playerId || h2hInfo.opponentId === playerId))) || selectedAnswer !== null}
                className={`p-4 rounded-lg text-left transition-all ${
                  selectedAnswer === index
                    ? 'bg-blue-600 text-white border-2 border-blue-400'
                    : 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-transparent'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="font-bold mr-2 text-yellow-400">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-center text-white/60">Waiting for the current player to answer…</div>
        )}
        {selectedAnswer !== null && (
          <div className="mt-4 text-center">
            <p className="text-white/70">Answer submitted! Waiting for result...</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default QuestionOverlay;
