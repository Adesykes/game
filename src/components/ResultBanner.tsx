import React, { useEffect } from 'react';
import { GameState, Question, AnswerResult } from '../types/game';
import { useSound } from '../hooks/useSound';
import ParticleEffect from './ParticleEffect';

interface ResultBannerProps {
  gameState: GameState;
  currentQuestion: Question | null;
  answerResult: AnswerResult | null;
  forfeitResult: { playerId: string; success: boolean; forfeitType: string } | null;
  forfeitFailureResult: { playerId: string; forfeitType: string } | null;
  guessResult: { solverId: string; forfeitType: string; solution: string } | null;
  playerId: string;
  onClose: () => void;
}

const ResultBanner: React.FC<ResultBannerProps> = ({
  gameState,
  currentQuestion,
  answerResult,
  forfeitResult,
  forfeitFailureResult,
  guessResult,
  playerId,
  onClose
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [resultData, setResultData] = React.useState<{
    type: 'question' | 'forfeit' | 'lightning' | 'guess';
    isCorrect?: boolean;
    playerName?: string;
    correctAnswer?: string;
    message?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  } | null>(null);
  
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

  // Sound and voice hooks
  const { playCorrect, playWrong, playStreak, playMastery, playForfeit, playGuess } = useSound();

  // Handle question results
  useEffect(() => {
    if (answerResult && answerResult.playerId === playerId) {
      const player = gameState.players.find(p => p.id === answerResult.playerId);

      setResultData({
        type: 'question',
        isCorrect: answerResult.isCorrect,
        playerName: player?.name || 'Unknown Player',
        correctAnswer: undefined,
        message: answerResult.isCorrect ? 'Correct!' : 'Incorrect!',
        difficulty: currentQuestion?.difficulty
      });
      setIsVisible(true);

      // Enhanced sound feedback
      if (answerResult.isCorrect) {
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
      } else {
        playWrong();
        setParticleEffect({ type: 'skull', duration: 2000 });
        setParticleTrigger(true);
      }

      // Clear any existing question timer
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }

      // Auto-hide after 3 seconds
      questionTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onClose();
        questionTimerRef.current = null;
      }, 3000);
    }
  }, [answerResult, playerId, gameState.players, currentQuestion, onClose, playCorrect, playWrong, playStreak, playMastery]);

  // Handle forfeit results
  useEffect(() => {
    if (forfeitResult && forfeitResult.playerId === playerId) {
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
        onClose();
        forfeitTimerRef.current = null;
      }, 3000);

      return () => {
        if (forfeitTimerRef.current) {
          clearTimeout(forfeitTimerRef.current);
          forfeitTimerRef.current = null;
        }
      };
    }
  }, [forfeitResult, playerId, gameState.players, onClose, playForfeit]);

  // Handle forfeit failure results
  useEffect(() => {
    if (forfeitFailureResult && forfeitFailureResult.playerId === playerId) {
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
        onClose();
        forfeitFailureTimerRef.current = null;
      }, 3000);
    }
  }, [forfeitFailureResult, playerId, gameState.players, onClose]);

  // Handle lightning round results
  useEffect(() => {
    if (gameState.lightningWinnerId && gameState.lightningWinnerId !== lastLightningWinnerRef.current) {
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
        onClose();
        lightningTimerRef.current = null;
      }, 3000);
    }
  }, [gameState.lightningWinnerId, gameState.players, onClose]);

  // Handle guess results (charade/pictionary solved)
  useEffect(() => {
    if (guessResult) {
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
        onClose();
        guessTimerRef.current = null;
      }, 3000);
    }
  }, [guessResult, gameState.players, onClose]);

  // Clear banner when new results come in (to prevent overlapping banners)
  useEffect(() => {
    // Only clear for forfeit and guess results (not answer results, which trigger question banners)
    const hasClearingResult = forfeitResult || forfeitFailureResult || guessResult;
    if (hasClearingResult && isVisible && resultData) {
      // Don't clear if the current banner is the same type as the incoming result
      const shouldClear = 
        (resultData.type === 'guess' && !guessResult) ||
        (resultData.type === 'forfeit' && !forfeitResult && !forfeitFailureResult);
      
      if (shouldClear) {
        // Clear any existing banner when forfeit/guess results arrive
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
      }
    }
  }, [forfeitResult, forfeitFailureResult, guessResult, isVisible, resultData]);  if (!isVisible || !resultData) return null;

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
      default:
        return 'RESULT';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
      <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl border-4 border-white/20 transform animate-bounce pointer-events-auto ${getBackgroundColor()}`}>
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

          {/* Streak display for correct answers */}
          {resultData.isCorrect && resultData.type === 'question' && (() => {
            const currentPlayer = gameState.players.find(p => p.id === playerId);
            const currentStreak = currentPlayer?.currentStreak || 0;
            const bestStreak = currentPlayer?.bestStreak || 0;
            const categoryMastery = currentPlayer?.categoryMastery?.[currentQuestion?.category || ''];
            
            return (
              <div className="mb-4">
                {currentStreak >= 2 && (
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
              </div>
            );
          })()}

          {/* Special message for wrong answers */}
          {!resultData.isCorrect && resultData.type === 'question' && (
            <p className="text-2xl font-black text-white animate-pulse">
              {(() => {
                const messages = ["THICK AS FUCK", "LOSER", "EPIC FAIL", "WHAT A SPAZ", "FFS LOSER", "OMG HOW THICK", "RETARD", "CABBAGE"];
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

