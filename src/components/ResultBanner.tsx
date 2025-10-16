import React, { useEffect, useRef } from 'react';
import { GameState, Question, AnswerResult } from '../types/game';
import { useSound } from '../hooks/useSound';
import { useVoiceLines } from '../hooks/useVoiceLines';
import ParticleEffect from './ParticleEffect';

interface ResultBannerProps {
  gameState: GameState;
  currentQuestion: Question | null;
  answerResult: AnswerResult | null;
  forfeitResult: { playerId: string; success: boolean; forfeitType: string } | null;
  forfeitFailureResult: { playerId: string; forfeitType: string } | null;
  guessResult: { solverId: string; forfeitType: string; solution: string } | null;
  lightningNoWinnerMessage?: string | null;
  sabotageResult?: { saboteurId: string; saboteurName: string; targetId: string; targetName: string } | null;
  playerId: string;
  onClose: () => void;
  onResultClear?: (type: 'answer' | 'forfeit' | 'forfeitFailure' | 'guess' | 'lightning' | 'sabotage') => void;
}

const ResultBanner: React.FC<ResultBannerProps> = ({
  gameState,
  currentQuestion,
  answerResult,
  forfeitResult,
  forfeitFailureResult,
  guessResult,
  lightningNoWinnerMessage,
  sabotageResult,
  playerId,
  onClose,
  onResultClear
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [resultData, setResultData] = React.useState<{
    type: 'question' | 'forfeit' | 'lightning' | 'guess' | 'sabotage';
    isCorrect?: boolean;
    playerName?: string;
    correctAnswer?: string;
    message?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    deltas?: {
      streakDelta?: number;
      powerDelta?: number;
      lockedCategories?: string[];
      recentCategories?: string[];
    };
  } | null>(null);
  // Track previous snapshot to compute deltas for the local player
  const prevPlayerSnapshotRef = React.useRef<{ streak: number; power: number; locked: string[]; recents: string[] } | null>(null);
  useEffect(() => {
    const me = gameState.players.find(p => p.id === playerId);
    if (!me) return;
    prevPlayerSnapshotRef.current = {
      streak: me.currentStreak || 0,
      power: me.powerBar ?? 50,
      locked: [...(me.lockedCategories || [])],
      recents: [...(me.recentCategories || [])]
    };
  }, [gameState.players, playerId]);
  
  // Particle effect state
  const [particleEffect, setParticleEffect] = React.useState<{
    type: 'celebration' | 'explosion' | 'sparkle' | 'hearts' | 'skull';
    duration: number;
  } | null>(null);
  const [particleTrigger, setParticleTrigger] = React.useState(false);
  
  // Track lightning winners that have already been shown
  const lastLightningWinnerRef = React.useRef<string | null>(null);
  
  // Track active timers to prevent resetting
  const questionTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const forfeitTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const forfeitFailureTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lightningTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const guessTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const sabotageTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Guards to prevent duplicate timer scheduling (for StrictMode)
  const questionTimerScheduled = React.useRef(false);
  const forfeitTimerScheduled = React.useRef(false);
  const forfeitFailureTimerScheduled = React.useRef(false);
  const lightningTimerScheduled = React.useRef(false);
  const guessTimerScheduled = React.useRef(false);
  const sabotageTimerScheduled = React.useRef(false);

  // Ref for onClose to avoid dependency issues
  const onCloseRef = useRef(onClose);

  // Update ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Sound and voice hooks
  const { playCorrect, playWrong, playStreak, playMastery, playForfeit } = useSound();
  // Handle sabotage banners (target only)
  useEffect(() => {
    if (sabotageResult && sabotageResult.targetId === playerId) {
      if (sabotageTimerScheduled.current) return;
      sabotageTimerScheduled.current = true;

      setResultData({
        type: 'sabotage',
        playerName: sabotageResult.saboteurName,
        message: `You were sabotaged by ${sabotageResult.saboteurName}!`
      });
      setIsVisible(true);

      // Visual impact: skull explosion
      setParticleEffect({ type: 'skull', duration: 2000 });
      setParticleTrigger(true);

      if (sabotageTimerRef.current) clearTimeout(sabotageTimerRef.current);
      sabotageTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onCloseRef.current?.();
        onResultClear?.('sabotage');
        sabotageTimerRef.current = null;
        sabotageTimerScheduled.current = false;
      }, 3000);
    } else {
      sabotageTimerScheduled.current = false;
    }
  }, [sabotageResult, playerId]);
  const { getRandomVoiceLine } = useVoiceLines();

  // Handle question results
  useEffect(() => {
    if (answerResult && answerResult.playerId === playerId) {
      // Prevent duplicate scheduling in StrictMode
      if (questionTimerScheduled.current) return;
      questionTimerScheduled.current = true;
      const player = gameState.players.find(p => p.id === answerResult.playerId);

      // Only show banner for correct answers
      if (answerResult.isCorrect) {
        // Compute deltas vs. last snapshot for local player
        const prev = prevPlayerSnapshotRef.current;
        const meNow = gameState.players.find(p => p.id === playerId);
        const streakDelta = prev && meNow ? (meNow.currentStreak || 0) - prev.streak : undefined;
        const powerDelta = prev && meNow ? Math.round((meNow.powerBar ?? 0) - (prev.power ?? 0)) : undefined;
        setResultData({
          type: 'question',
          isCorrect: answerResult.isCorrect,
          playerName: player?.name || 'Unknown Player',
          correctAnswer: undefined,
          message: 'Correct!',
          difficulty: currentQuestion?.difficulty,
          deltas: {
            streakDelta,
            powerDelta,
            lockedCategories: answerResult.lockedCategories || [],
            recentCategories: answerResult.recentCategories || []
          }
        });
        setIsVisible(true);

        // Enhanced sound feedback
        playCorrect();
        const currentPlayer = gameState.players.find(p => p.id === playerId);
        const currentStreak = currentPlayer?.currentStreak || 0;
        const categoryMastery = currentPlayer?.categoryMastery?.[currentQuestion?.category || ''];
        
        if (currentStreak >= 3) {
          playStreak();
          setParticleEffect({ type: 'celebration', duration: 3000 });
          setParticleTrigger(true);
        } else if (categoryMastery && categoryMastery !== 'novice') {
          playMastery();
          setParticleEffect({ type: 'sparkle', duration: 2000 });
          setParticleTrigger(true);
        } else {
          setParticleEffect({ type: 'celebration', duration: 2000 });
          setParticleTrigger(true);
        }

        // Clear any existing question timer
        if (questionTimerRef.current) {
          clearTimeout(questionTimerRef.current);
        }

        // Auto-hide after 3 seconds
        questionTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          onCloseRef.current?.();
          onResultClear?.('answer');
          questionTimerRef.current = null;
          questionTimerScheduled.current = false; // Reset guard
        }, 3000);
      } else {
        // For wrong answers, show insult banner for 3 seconds then clear
        const insult = getRandomVoiceLine('wrong_epic');
        // Compute deltas (streak likely resets or changes; power drop)
        const prev = prevPlayerSnapshotRef.current;
        const meNow = gameState.players.find(p => p.id === playerId);
        const streakDelta = prev && meNow ? (meNow.currentStreak || 0) - prev.streak : undefined;
        const powerDelta = prev && meNow ? Math.round((meNow.powerBar ?? 0) - (prev.power ?? 0)) : undefined;
        setResultData({
          type: 'question',
          isCorrect: answerResult.isCorrect,
          playerName: player?.name || 'Unknown Player',
          correctAnswer: undefined,
          message: insult.text,
          difficulty: currentQuestion?.difficulty,
          deltas: {
            streakDelta,
            powerDelta,
            lockedCategories: answerResult.lockedCategories || [],
            recentCategories: answerResult.recentCategories || []
          }
        });
        setIsVisible(true);

        // Play wrong sound and skull effect
        playWrong();
        setParticleEffect({ type: 'skull', duration: 2000 });
        setParticleTrigger(true);

        // Clear any existing question timer
        if (questionTimerRef.current) {
          clearTimeout(questionTimerRef.current);
        }

        // Auto-hide after 3 seconds, then clear result to let forfeit system take over
        questionTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          onCloseRef.current?.();
          onResultClear?.('answer');
          questionTimerRef.current = null;
          questionTimerScheduled.current = false; // Reset guard
        }, 3000);
      }
    } else {
      // Reset guard if no result
      questionTimerScheduled.current = false;
    }
  }, [answerResult, playerId, gameState.players, currentQuestion, playCorrect, playWrong, playStreak, playMastery, getRandomVoiceLine]);

  // Handle forfeit results
  useEffect(() => {
    if (forfeitResult && forfeitResult.playerId === playerId) {
      // Prevent duplicate scheduling in StrictMode
      if (forfeitTimerScheduled.current) return;
      forfeitTimerScheduled.current = true;
      const player = gameState.players.find(p => p.id === forfeitResult.playerId);
      const forfeitTypeMessage = forfeitResult.forfeitType === 'shot' ? 'Take a shot!' :
                                forfeitResult.forfeitType === 'charade' ? 'Charade completed!' :
                                forfeitResult.forfeitType === 'pictionary' ? 'Pictionary completed!' :
                                'Forfeit completed!';

      setResultData({
        type: 'forfeit',
        playerName: player?.name || 'Unknown Player',
        message: forfeitTypeMessage
      });
      setIsVisible(true);

      // Enhanced forfeit feedback
      playForfeit();
      if (forfeitResult.forfeitType === 'shot') {
        setParticleEffect({ type: 'explosion', duration: 2000 });
        setParticleTrigger(true);
      } else if (forfeitResult.forfeitType === 'charade') {
        setParticleEffect({ type: 'celebration', duration: 2000 });
        setParticleTrigger(true);
      } else if (forfeitResult.forfeitType === 'pictionary') {
        setParticleEffect({ type: 'sparkle', duration: 2000 });
        setParticleTrigger(true);
      }

      // Clear any existing forfeit timer
      if (forfeitTimerRef.current) {
        clearTimeout(forfeitTimerRef.current);
      }

      // Auto-hide after 3 seconds
      forfeitTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onCloseRef.current?.();
        onResultClear?.('forfeit');
        forfeitTimerRef.current = null;
        forfeitTimerScheduled.current = false; // Reset guard
      }, 3000);

      return () => {
        if (forfeitTimerRef.current) {
          clearTimeout(forfeitTimerRef.current);
          forfeitTimerRef.current = null;
          forfeitTimerScheduled.current = false; // Reset guard on cleanup
        }
      };
    } else {
      // Reset guard if no result
      forfeitTimerScheduled.current = false;
    }
  }, [forfeitResult, playerId, gameState.players, playForfeit]);

  // Handle forfeit failure results
  useEffect(() => {
    if (forfeitFailureResult && forfeitFailureResult.playerId === playerId) {
      // Prevent duplicate scheduling in StrictMode
      if (forfeitFailureTimerScheduled.current) return;
      forfeitFailureTimerScheduled.current = true;
      const player = gameState.players.find(p => p.id === forfeitFailureResult.playerId);
      const failureMessage = forfeitFailureResult.forfeitType === 'charade' ? 'Charade failed!' :
                            forfeitFailureResult.forfeitType === 'pictionary' ? 'Pictionary failed!' :
                            'Forfeit failed!';

      setResultData({
        type: 'forfeit',
        isCorrect: false,
        playerName: player?.name || 'Unknown Player',
        message: failureMessage
      });
      setIsVisible(true);

      // Clear any existing forfeit failure timer
      if (forfeitFailureTimerRef.current) {
        clearTimeout(forfeitFailureTimerRef.current);
      }

      // Auto-hide after 3 seconds
      forfeitFailureTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onCloseRef.current?.();
        onResultClear?.('forfeitFailure');
        forfeitFailureTimerRef.current = null;
        forfeitFailureTimerScheduled.current = false; // Reset guard
      }, 3000);
    } else {
      // Reset guard if no result
      forfeitFailureTimerScheduled.current = false;
    }
  }, [forfeitFailureResult, playerId, gameState.players]);

  // Handle lightning round results
  useEffect(() => {
    if (gameState.lightningWinnerId && gameState.lightningWinnerId !== lastLightningWinnerRef.current) {
      // Prevent duplicate scheduling in StrictMode
      if (lightningTimerScheduled.current) return;
      lightningTimerScheduled.current = true;
      const winner = gameState.players.find(p => p.id === gameState.lightningWinnerId);
      setResultData({
        type: 'lightning',
        playerName: winner?.name || 'Unknown Player',
        message: 'Lightning Round Winner!'
      });
      setIsVisible(true);
      
      // Add particle effect for lightning win
      setParticleEffect({ type: 'celebration', duration: 4000 });
      setParticleTrigger(true);
      
      // Mark this winner as shown
      lastLightningWinnerRef.current = gameState.lightningWinnerId;

      // Clear any existing lightning timer
      if (lightningTimerRef.current) {
        clearTimeout(lightningTimerRef.current);
      }

      // Auto-hide after 3 seconds
      lightningTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onCloseRef.current?.();
        lightningTimerRef.current = null;
        lightningTimerScheduled.current = false; // Reset guard
      }, 3000);
    } else {
      // Reset guard if no new winner
      lightningTimerScheduled.current = false;
    }
  }, [gameState.lightningWinnerId, gameState.players]);

  // Handle guess results (charade/pictionary solved)
  useEffect(() => {
    if (guessResult) {
      // Prevent duplicate scheduling in StrictMode
      if (guessTimerScheduled.current) return;
      guessTimerScheduled.current = true;

      const solver = gameState.players.find(p => p.id === guessResult.solverId);
      const forfeitTypeMessage = guessResult.forfeitType === 'charade' ? 'guessed the charade!' : 'guessed the pictionary!';

      setResultData({
        type: 'guess',
        playerName: solver?.name || 'Unknown Player',
        message: forfeitTypeMessage
      });
      setIsVisible(true);

      // Add particle effect for successful guess
      setParticleEffect({ type: 'sparkle', duration: 2000 });
      setParticleTrigger(true);

      // Clear any existing guess timer
      if (guessTimerRef.current) {
        clearTimeout(guessTimerRef.current);
      }

      // Auto-hide after 3 seconds
      guessTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onCloseRef.current?.();
        onResultClear?.('guess');
        guessTimerRef.current = null;
        guessTimerScheduled.current = false; // Reset guard
      }, 3000);
    } else {
      // Reset guard if no result
      guessTimerScheduled.current = false;
    }
  }, [guessResult, gameState.players]);

  // Clear banner when new results come in (to prevent overlapping banners)
  useEffect(() => {
    // Determine incoming result type
    const incomingType = sabotageResult ? 'sabotage' : guessResult ? 'guess' : (forfeitResult || forfeitFailureResult) ? 'forfeit' : null;
    
    // If we have an incoming result and it's different from the currently visible banner type, clear the current banner
    if (incomingType && isVisible && resultData && resultData.type !== incomingType) {
      // Clear any existing banner when a different type of result arrives
      setIsVisible(false);
      setResultData(null);
      setParticleEffect(null);
      setParticleTrigger(false);

      // Clear all timers
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      if (forfeitTimerRef.current) {
        clearTimeout(forfeitTimerRef.current);
        forfeitTimerRef.current = null;
      }
      if (forfeitFailureTimerRef.current) {
        clearTimeout(forfeitFailureTimerRef.current);
        forfeitFailureTimerRef.current = null;
      }
      if (lightningTimerRef.current) {
        clearTimeout(lightningTimerRef.current);
        lightningTimerRef.current = null;
      }
      if (guessTimerRef.current) {
        clearTimeout(guessTimerRef.current);
        guessTimerRef.current = null;
      }
      if (sabotageTimerRef.current) {
        clearTimeout(sabotageTimerRef.current);
        sabotageTimerRef.current = null;
      }
    }
  }, [forfeitResult, forfeitFailureResult, guessResult, sabotageResult, isVisible, resultData]);

  // Handle lightning no winner message
  useEffect(() => {
    if (lightningNoWinnerMessage) {
      // Prevent duplicate scheduling in StrictMode
      if (lightningTimerScheduled.current) return;
      lightningTimerScheduled.current = true;

      setResultData({
        type: 'lightning',
        message: lightningNoWinnerMessage
      });
      setIsVisible(true);

      // Play wrong sound and skull effect for no winners
      playWrong();
      setParticleEffect({ type: 'skull', duration: 2000 });
      setParticleTrigger(true);

      // Clear any existing lightning timer
      if (lightningTimerRef.current) {
        clearTimeout(lightningTimerRef.current);
      }

      // Auto-hide after 4 seconds
      lightningTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onCloseRef.current?.();
        onResultClear?.('lightning');
        lightningTimerRef.current = null;
        lightningTimerScheduled.current = false; // Reset guard
      }, 4000);
    } else {
      // Reset guard if no message
      lightningTimerScheduled.current = false;
    }
  }, [lightningNoWinnerMessage, playWrong]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      if (forfeitTimerRef.current) {
        clearTimeout(forfeitTimerRef.current);
        forfeitTimerRef.current = null;
      }
      if (forfeitFailureTimerRef.current) {
        clearTimeout(forfeitFailureTimerRef.current);
        forfeitFailureTimerRef.current = null;
      }
      if (lightningTimerRef.current) {
        clearTimeout(lightningTimerRef.current);
        lightningTimerRef.current = null;
      }
      if (guessTimerRef.current) {
        clearTimeout(guessTimerRef.current);
        guessTimerRef.current = null;
      }
      if (sabotageTimerRef.current) {
        clearTimeout(sabotageTimerRef.current);
        sabotageTimerRef.current = null;
      }
      // Reset all guards
      questionTimerScheduled.current = false;
      forfeitTimerScheduled.current = false;
      forfeitFailureTimerScheduled.current = false;
      lightningTimerScheduled.current = false;
      guessTimerScheduled.current = false;
      sabotageTimerScheduled.current = false;
    };
  }, []);  if (!isVisible || !resultData) return null;

  const getBackgroundColor = () => {
    switch (resultData.type) {
      case 'question':
        return resultData.isCorrect ? 'bg-green-600' : 'bg-red-600';
      case 'forfeit':
        return 'bg-purple-600';
      case 'lightning':
        return 'bg-yellow-600';
      case 'guess':
        return 'bg-blue-600';
      case 'sabotage':
        return 'bg-red-700';
      default:
        return 'bg-gray-600';
    }
  };

  const getTitle = () => {
    switch (resultData.type) {
      case 'question':
        return resultData.isCorrect ? 'CORRECT!' : 'WRONG!';
      case 'forfeit':
        return 'FORFEIT';
      case 'lightning':
        return 'LIGHTNING WINNER';
      case 'guess':
        return 'CORRECT GUESS!';
      case 'sabotage':
        return 'SABOTAGED!';
      default:
        return 'RESULT';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
      <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl border-4 border-white/20 transform ${gameState.round !== 5 ? 'animate-bounce' : ''} pointer-events-auto ${getBackgroundColor()}`}>
        {/* Particle Effect */}
        {particleEffect && (
          <ParticleEffect
            trigger={particleTrigger}
            type={particleEffect.type}
            duration={particleEffect.duration}
            onComplete={() => {
              setParticleTrigger(false);
              setParticleEffect(null);
            }}
          />
        )}
        
        <div className="p-8 text-center">
          {/* Title */}
          <h2 className="text-3xl font-black text-white mb-2 tracking-wider">
            {getTitle()}
          </h2>

          {/* Player Name */}
          <p className="text-xl font-bold text-white/90 mb-4">
            {resultData.playerName}
          </p>

          {/* Message */}
          <p className="text-lg text-white/80 mb-4">
            {resultData.message}
          </p>

          {/* Recap: streak, power, and global locks */}
          {resultData.type === 'question' && (() => {
            const currentPlayer = gameState.players.find(p => p.id === playerId);
            const currentStreak = currentPlayer?.currentStreak || 0;
            const bestStreak = currentPlayer?.bestStreak || 0;
            const categoryMastery = currentPlayer?.categoryMastery?.[currentQuestion?.category || ''];
            const streakDelta = resultData.deltas?.streakDelta ?? 0;
            const powerDelta = resultData.deltas?.powerDelta ?? 0;
            const lockedCats = resultData.deltas?.lockedCategories || [];
            const recentCats = resultData.deltas?.recentCategories || [];
            
            return (
              <div className="mb-4">
                {/* Streak visuals when correct */}
                {resultData.isCorrect && currentStreak >= 2 && (
                  <p className="text-xl font-bold text-yellow-300 animate-pulse mb-2">
                    🔥 {currentStreak} IN A ROW! 🔥
                  </p>
                )}
                {currentStreak === bestStreak && currentStreak >= 3 && (
                  <p className="text-lg text-yellow-200 mb-2">
                    🏆 NEW BEST STREAK! 🏆
                  </p>
                )}
                {categoryMastery && categoryMastery !== 'novice' && (
                  <p className="text-lg text-blue-300 mb-2">
                    ⭐ {categoryMastery.toUpperCase()} in {currentQuestion?.category}! ⭐
                  </p>
                )}
                {resultData.difficulty && (
                  <p className="text-sm text-gray-300">
                    Difficulty: {resultData.difficulty.toUpperCase()}
                  </p>
                )}
                {/* Deltas row */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
                  {typeof streakDelta === 'number' && streakDelta !== 0 && (
                    <span className={`px-2 py-1 rounded-full ${streakDelta > 0 ? 'bg-green-600/30 text-green-200' : 'bg-red-600/30 text-red-200'}`}>
                      Streak {streakDelta > 0 ? `+${streakDelta}` : streakDelta}
                    </span>
                  )}
                  {typeof powerDelta === 'number' && powerDelta !== 0 && (
                    <span className={`px-2 py-1 rounded-full ${powerDelta > 0 ? 'bg-green-600/30 text-green-200' : 'bg-red-600/30 text-red-200'}`}>
                      Power {powerDelta > 0 ? `+${powerDelta}%` : `${powerDelta}%`}
                    </span>
                  )}
                  {lockedCats.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-blue-600/30 text-blue-200" title={`Locked: ${lockedCats.join(', ')}`}>
                      🔒 {lockedCats.length} locked
                    </span>
                  )}
                  {recentCats.length > 0 && (
                    <span className="px-2 py-1 rounded-full bg-green-600/30 text-green-200" title={`Recent: ${recentCats.join(', ')}`}>
                      ✓ {recentCats.length}/3 recent
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Special message for wrong answers */}
          {!resultData.isCorrect && resultData.type === 'question' && (
            <p className="text-2xl font-black text-white animate-pulse">
              {(() => {
                const messages = [
                  "THICK AS FUCK", "WHAT A SPAZ", "OMG HOW THICK", "RETARD", "CABBAGE",
                  "BRAIN DEAD MORON", "COMPLETE IDIOT", "UTTER SHIT", "FUCKING DOLT", "STUPID CUNT", "DUMB FUCK", "WORTHLESS SHIT",
                  "PATHETIC LOSER", "TOTAL FUCKUP", "ABSOLUTE WANKER", "SHIT FOR BRAINS", "FUCKING RETARD", "DENSE AS FUCK",
                  "BRAINLESS CUNT", "UTTER BOLLOCKS", "COMPLETE TOSSER", "FUCKING IMBECILE", "STUPID AS SHIT", "WORTHLESS PRICK",
                  "TOTAL COCKUP", "ABSOLUTE SHITHEAD", "BRAINDEAD FUCK", "UTTER PRAT", "COMPLETE ARSEHOLE", "FUCKING MORON",
                  "STUPID BASTARD", "WORTHLESS TWAT", "TOTAL FUCKWIT", "ABSOLUTE CUNT", "BRAINLESS SHIT", "UTTER WANKER",
                  "COMPLETE DICKHEAD", "FUCKING IDIOT", "STUPID COCK", "WORTHLESS BOLLOCKS", "TOTAL PRICK", "ABSOLUTE TOSSER",
                  "BRAINDEAD CUNT", "UTTER ARSE", "COMPLETE SHIT", "FUCKING DOLT", "STUPID TWAT", "WORTHLESS FUCK",
                  "TOTAL MORON", "ABSOLUTE BASTARD", "BRAINLESS PRAT", "UTTER COCK", "COMPLETE WANKER", "FUCKING SHITHEAD",
                  "STUPID ARSEHOLE", "WORTHLESS IMBECILE", "TOTAL CUNT", "ABSOLUTE FUCKUP", "BRAINDEAD TOSSER", "UTTER DICK",
                  "COMPLETE PRICK", "FUCKING BOLLOCKS", "STUPID SHIT", "WORTHLESS MORON", "TOTAL IDIOT", "ABSOLUTE TWAT",
                  "BRAINLESS FUCKWIT", "UTTER BASTARD", "COMPLETE COCK", "FUCKING PRAT", "STUPID WANKER", "WORTHLESS ARSE",
                  "TOTAL SHITHEAD", "ABSOLUTE IMBECILE", "BRAINDEAD DOLT", "UTTER FUCK", "COMPLETE TOSSER", "FUCKING CUNT",
                  "STUPID PRICK", "WORTHLESS BASTARD", "TOTAL ARSEHOLE", "ABSOLUTE MORON", "BRAINLESS TWAT", "UTTER SHIT",
                  "COMPLETE FUCKWIT", "FUCKING DICKHEAD", "STUPID BOLLOCKS", "WORTHLESS COCK", "TOTAL WANKER", "ABSOLUTE PRAT",
                  "BRAINDEAD ARSE", "UTTER CUNT", "COMPLETE SHIT", "FUCKING TOSSER", "STUPID FUCKUP", "WORTHLESS DICK",
                  "TOTAL IMBECILE", "ABSOLUTE BOLLOCKS", "BRAINLESS SHITHEAD", "UTTER MORON", "COMPLETE IDIOT", "FUCKING TWAT",
                  "STUPID COCK", "WORTHLESS PRAT", "TOTAL ARSE", "ABSOLUTE FUCK", "BRAINDEAD WANKER", "UTTER BASTARD",
                  "COMPLETE DOLT", "FUCKING SHIT", "STUPID TOSSER", "WORTHLESS CUNT", "TOTAL FUCK", "ABSOLUTE SHITHEAD"
                ];
                return messages[Math.floor(Math.random() * messages.length)] + "!";
              })()}
            </p>
          )}

          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultBanner;

