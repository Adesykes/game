import React, { useState, useEffect, useRef } from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import { useFullScreen } from '../hooks/useFullScreen';
import { Socket } from 'socket.io-client';
import { GameState, Question, AnswerResult } from '../types/game';
import { Heart, Clock, AlertTriangle, Maximize, Minimize } from 'lucide-react';
import { questionCategories } from '../data/questions';
import { DrawingCanvas, DrawingDisplay } from './DrawingComponents';

interface PlayerInterfaceProps {
  socket: Socket;
  gameState: GameState;
  playerId: string;
  currentQuestion: Question | null;
  answerResult: AnswerResult | null;
  charadeDeadline?: number | null;
  pictionaryDeadline?: number | null;
}

const PlayerInterface: React.FC<PlayerInterfaceProps> = ({
  socket,
  gameState,
  playerId,
  currentQuestion,
  answerResult,
  charadeDeadline,
  pictionaryDeadline,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [charadeTimeLeft, setCharadeTimeLeft] = useState(120);
  const [pictionaryGuessInput, setPictionaryGuessInput] = useState('');
  const [pictionaryTimeLeft, setPictionaryTimeLeft] = useState(60);
  const [lightningTimeLeft, setLightningTimeLeft] = useState<number>(0);
  const [hasBuzzed, setHasBuzzed] = useState<boolean>(false);
  const [selectedLightningIndex, setSelectedLightningIndex] = useState<number | null>(null);
  const [showLightningReward, setShowLightningReward] = useState<boolean>(false);
  const [rewardSubmitting, setRewardSubmitting] = useState<boolean>(false);
  const { isFullScreen, toggleFullScreen } = useFullScreen();

  // Ref to track the latest game state for race condition prevention
  const gameStateRef = useRef(gameState);

  // Add null checks to prevent errors
  const player = gameState?.players?.find(p => p.id === playerId);
  // Always derive current player fresh from currentPlayerIndex to avoid any stale references
  const currentPlayerIdFromState = gameState.players[gameState.currentPlayerIndex]?.id;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayerIdFromState === playerId;
  const isEliminated = player?.isEliminated || false;
  
  // Debug logging
  console.log(`[NewPlayerInterface] gamePhase: ${gameState.gamePhase}, currentPlayerIndex: ${gameState.currentPlayerIndex}, isMyTurn: ${isMyTurn}, playerId: ${playerId}, currentPlayerId: ${currentPlayer?.id}`);
  
  // Early return for loading state
  if (!gameState || !socket || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-pulse mb-4">Loading game...</div>
          <div className="text-sm text-white/70">
            Room Code: {gameState?.id || "Connecting..."}
          </div>
        </div>
      </div>
    );
  }

  // Update ref whenever gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  // Only keep the screen awake during active gameplay phases
  // We've reduced this to only forfeit, charade_guessing, and pictionary_drawing
  // to allow scrolling in other phases
  const wakeActive = ['forfeit', 'charade_guessing', 'pictionary_drawing'].includes(gameState.gamePhase);
  useWakeLock(wakeActive);
  
  // Control body scroll locking based on game phase
  useEffect(() => {
    const needsScrollLock = ['charade_guessing', 'pictionary_drawing'].includes(gameState.gamePhase);
    
    if (needsScrollLock) {
      // Disable scrolling on body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Re-enable scrolling
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      // Cleanup - re-enable scrolling when component unmounts
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [gameState.gamePhase]);

  // Countdown timer for questions
  useEffect(() => {
    if (gameState.gamePhase !== 'question' || !isMyTurn || !currentQuestion) return;
    if (timeLeft <= 0) return;
    
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [currentQuestion, isMyTurn, gameState.gamePhase, timeLeft]);

  // Reset timer when a new question appears
  useEffect(() => {
    if (currentQuestion && gameState.gamePhase === 'question') {
      setSelectedAnswer(null);
      setTimeLeft(30);
    }
  }, [currentQuestion, gameState.gamePhase]);

  // Charade countdown synced to server deadline
  useEffect(() => {
    if (gameState.gamePhase !== 'charade_guessing') return;
    const id = setInterval(() => {
      const now = Date.now();
      const dl = charadeDeadline ?? now;
      const remaining = Math.max(0, Math.floor((dl - now) / 1000));
      setCharadeTimeLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, [gameState.gamePhase, charadeDeadline]);

  // Pictionary countdown synced to server deadline
  useEffect(() => {
    if (gameState.gamePhase !== 'pictionary_drawing') return;
    const id = setInterval(() => {
      const now = Date.now();
      const dl = pictionaryDeadline ?? now;
      const remaining = Math.max(0, Math.floor((dl - now) / 1000));
      setPictionaryTimeLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, [gameState.gamePhase, pictionaryDeadline]);

  // Lightning countdown synced to server
  useEffect(() => {
    if (gameState.gamePhase !== 'lightning_round') return;
    const id = setInterval(() => {
      const now = Date.now();
      const dl = gameState.lightningEndAt ?? now;
      const remaining = Math.max(0, Math.ceil((dl - now) / 1000));
      setLightningTimeLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, [gameState.gamePhase, gameState.lightningEndAt]);

  // Reset buzz flag when entering/exiting lightning phase
  useEffect(() => {
    if (gameState.gamePhase === 'lightning_round') {
      setHasBuzzed(false);
      setSelectedLightningIndex(null);
    }
  }, [gameState.gamePhase]);

  // Listen for reward choice prompt and applied result
  useEffect(() => {
    if (!socket) return;
    const onChoice = ({ winnerId }: { winnerId: string }) => {
      if (winnerId === playerId) {
        setShowLightningReward(true);
      }
    };
    const onApplied = ({ playerId: rewardedId }: { playerId: string }) => {
      if (rewardedId === playerId) {
        setShowLightningReward(false);
        setRewardSubmitting(false);
      }
    };
    socket.on('lightning-reward-choice', onChoice);
    socket.on('lightning-reward-applied', onApplied);
    return () => {
      socket.off('lightning-reward-choice', onChoice);
      socket.off('lightning-reward-applied', onApplied);
    };
  }, [socket, playerId]);

  const selectCategory = (category: string) => {
    // Re-derive turn at call time for maximum safety
    const liveCurrentPlayerId = gameState.players[gameState.currentPlayerIndex]?.id;
    const liveIsMyTurn = liveCurrentPlayerId === playerId;
    console.log(`[selectCategory] click category=${category} liveIsMyTurn=${liveIsMyTurn} storedIsMyTurn=${isMyTurn} phase=${gameState.gamePhase} currentIndex=${gameState.currentPlayerIndex}`);
    if (!liveIsMyTurn) {
      console.log('[selectCategory] BLOCK: not your turn (live check)');
      return;
    }
    if (gameState.gamePhase !== 'category_selection') {
      console.log(`[selectCategory] BLOCK: wrong phase ${gameState.gamePhase}`);
      return;
    }
    socket.emit('select-category', gameState.id, playerId, category);
  };

  const submitAnswer = (answerIndex: number) => {
    if (!isMyTurn || gameState.gamePhase !== 'question' || !currentQuestion) return;
    setSelectedAnswer(answerIndex);
    socket.emit('submit-answer', gameState.id, playerId, answerIndex);
  };
  
  const submitCharadeGuess = () => {
    if (gameState.gamePhase !== 'charade_guessing' || isMyTurn) return;
    if (!guessInput.trim()) return;
    
    socket.emit('guess-charade', gameState.id, playerId, guessInput.trim());
    setGuessInput('');
  };

  const submitPictionaryGuess = () => {
    if (gameState.gamePhase !== 'pictionary_drawing' || isMyTurn) return;
    if (!pictionaryGuessInput.trim()) return;
    
    socket.emit('guess-pictionary', gameState.id, playerId, pictionaryGuessInput.trim());
    setPictionaryGuessInput('');
  };

  if (!player || isEliminated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 p-4 text-center">
        <div className="max-w-md mx-auto bg-black/30 p-8 rounded-xl mt-20">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">
            {isEliminated ? 'You were eliminated!' : 'Disconnected'}
          </h1>
          <p className="text-white/80 mb-6">
            {isEliminated ? 
              'You lost all your lives and are out of the game.' : 
              'You are not connected to the game.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Determine if we need fixed positioning or scrollable
  const needsFixedPosition = ['charade_guessing', 'pictionary_drawing'].includes(gameState.gamePhase);
  const containerClass = needsFixedPosition
    ? "min-h-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4"
    : "min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 pb-24 overflow-auto"; // Extra padding and explicit overflow

  return (
    <div className={containerClass}>
      {/* Lightning teaser banner */}
      {typeof gameState.turnsPlayed === 'number' && gameState.gamePhase !== 'lightning_round' && (
        <div className="max-w-md mx-auto mb-3">
          <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-lg px-3 py-2 text-center">
            <span className="text-yellow-200 text-sm font-semibold">⚡ Lightning round in {((10 - ((gameState.turnsPlayed % 10) || 0)) % 10) || 10} turns</span>
          </div>
        </div>
      )}
      <div className="max-w-md mx-auto">
        {/* Player Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 text-center relative">
          {/* Full Screen Toggle Button */}
          <button
            onClick={toggleFullScreen}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullScreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
          
          <div className="text-6xl mb-2">{player.avatar}</div>
          <h1 className="text-2xl font-bold text-white mb-1">{player.name}</h1>
          <div className="flex justify-center items-center space-x-6">
            <div className="flex items-center text-red-400">
              <Heart className="w-5 h-5 mr-1" />
              <span className="font-bold">{player.lives}</span>
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="text-center">
            {gameState.gamePhase === 'waiting' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Waiting for players...</h2>
                <p className="text-white/80 mb-6">Room: {gameState.id}</p>
                
                {/* Game Instructions */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-4xl w-full border border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">🎮 How to Play Drunk Games Night</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-bold text-yellow-400 mb-2">🎯 Game Objective</h4>
                      <p className="text-white/80 mb-4">
                        Be the first player to complete all trivia categories! Answer questions correctly to progress in each category.
                      </p>
                      
                      <h4 className="text-lg font-bold text-yellow-400 mb-2">📋 Categories & Progress</h4>
                      <p className="text-white/80 mb-4">
                        There are multiple trivia categories. Each correct answer advances you one level in that category. Reach the required level in ALL categories to win!
                      </p>
                      
                      <h4 className="text-lg font-bold text-yellow-400 mb-2">❤️ Lives System</h4>
                      <p className="text-white/80 mb-4">
                        Each player starts with 3 lives. Wrong answers trigger forfeits (charades, pictionary, or shots). Lose all lives and you're eliminated!
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-yellow-400 mb-2">🛡️ Lifelines</h4>
                      <p className="text-white/80 mb-4">
                        Each player gets 2 lifelines:
                        <br />• <strong>50/50:</strong> Removes two wrong answers, leaving the correct answer and one wrong choice
                        <br />• <strong>Pass to Random:</strong> Passes the question to another random player
                      </p>
                      
                      <h4 className="text-lg font-bold text-yellow-400 mb-2">⚡ Power-ups</h4>
                      <p className="text-white/80 mb-4">
                        Strategic abilities you can use:
                        <br />• <strong>Swap Question:</strong> Replace the current question with a new one
                        <br />• <strong>Steal Category:</strong> Take progress points from another player's category
                      </p>
                      
                      <h4 className="text-lg font-bold text-yellow-400 mb-2">🎭 Forfeits</h4>
                      <p className="text-white/80 mb-4">
                        When you answer incorrectly:
                        <br />• <strong>Charade:</strong> Act out a word/phrase for others to guess
                        <br />• <strong>Pictionary:</strong> Draw a word/phrase for others to guess
                        <br />• <strong>Shot:</strong> Take a drink (or skip if preferred)
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                    <h4 className="text-lg font-bold text-yellow-300 mb-2">🎉 Special Events</h4>
                    <p className="text-yellow-200">
                      Occasionally, the game triggers karaoke breaks where everyone votes on songs to sing! These are fun interruptions that happen randomly during gameplay.
                    </p>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-white/60 text-sm">
                      Waiting for the host to start the game. Make sure you're ready!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {gameState.gamePhase === 'category_selection' && (
              <div>
                {/* Hide categories during server-scheduled turn cooldown */}
                {gameState.turnCooldownUntil && Date.now() < gameState.turnCooldownUntil ? (
                  <div className="text-center py-12">
                    <div className="text-white/70 text-lg mb-2">Preparing next turn…</div>
                    <p className="text-white/50 text-sm">Please wait a moment…</p>
                  </div>
                ) : (
                  <>
                <h2 className="text-xl font-bold text-white mb-4">
                  {isMyTurn ? 'Choose a category' : `${currentPlayer.name} is choosing a category`}
                  {!isMyTurn && (
                    <div className="text-sm text-white/60 mt-1">
                      Waiting for {currentPlayer.name} to select a category...
                    </div>
                  )}
                </h2>
                
                {/* Defensive double-guard: only render buttons if still the current player */}
                {isMyTurn && currentPlayerIdFromState === playerId && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        const currentPlayer = gameState.players.find(p => p.id === playerId);
                        if (!currentPlayer?.powerUps?.steal_category || currentPlayer.powerUps.steal_category <= 0) return;
                        
                        // Find eligible targets (other players with progress in categories)
                        const eligibleTargets = gameState.players.filter(p => 
                          p.id !== playerId && 
                          !p.isEliminated && 
                          Object.values(p.categoryScores || {}).some(score => (score || 0) > 0)
                        );
                        
                        if (eligibleTargets.length === 0) return;
                        
                        // For simplicity, pick first target and first category they have progress in
                        const targetPlayer = eligibleTargets[0];
                        const availableCategories = Object.keys(targetPlayer.categoryScores || {}).filter(cat => 
                          (targetPlayer.categoryScores[cat] || 0) > 0
                        );
                        
                        if (availableCategories.length === 0) return;
                        
                        const categoryToSteal = availableCategories[0];
                        
                        socket.emit('powerup-steal-category', gameState.id, playerId, targetPlayer.id, categoryToSteal);
                      }}
                      disabled={(gameState.players.find(p => p.id === playerId)?.powerUps?.steal_category || 0) <= 0}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                      🏴‍☠️ Steal Category ({gameState.players.find(p => p.id === playerId)?.powerUps?.steal_category || 0})
                    </button>
                  </div>
                )}
                
                {isMyTurn && currentPlayerIdFromState === playerId && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2" data-test="category-button-grid">
                    {questionCategories.map(category => {
                      const isLocked = gameState?.globalLockedCategories?.includes(category) || false;
                      const isRecent = gameState?.globalRecentCategories?.includes(category) || false;
                      
                      return (
                        <button
                          key={category}
                          onClick={() => {
                            if (gameState.turnCooldownUntil && Date.now() < gameState.turnCooldownUntil) {
                              return;
                            }
                            // Double-check it's still our turn before emitting using latest game state
                            const latestGameState = gameStateRef.current;
                            const currentPlayerCheck = latestGameState.players?.[latestGameState.currentPlayerIndex];
                            const isStillMyTurn = currentPlayerCheck?.id === playerId;
                            console.log(`[client] Category click: ${category}, isStillMyTurn: ${isStillMyTurn}, currentPlayer: ${currentPlayerCheck?.id}, myId: ${playerId}`);
                            if (!isStillMyTurn) {
                              console.log('Turn changed before click was processed, ignoring');
                              return;
                            }
                            !isLocked && selectCategory(category);
                          }}
                          disabled={isLocked}
                          className={`p-2 rounded-xl font-medium transition-colors text-sm relative ${
                            isLocked 
                              ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-60' 
                              : isRecent
                                ? 'bg-green-600/30 hover:bg-green-600/40 text-green-200 border border-green-500/30'
                                : 'bg-white/20 hover:bg-white/30 text-white'
                          }`}
                          title={isLocked ? `Locked: Select 3 different categories first (${gameState?.globalRecentCategories?.length || 0}/3)` : 
                                isRecent ? 'Recently selected category' : 
                                'Click to select this category'}
                        >
                          {category}
                          {isLocked && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">🔒</span>
                            </div>
                          )}
                          {isRecent && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {!isMyTurn && (
                  <div className="text-center py-8">
                    <div className="text-white/60 text-lg mb-2">⏳</div>
                    <p className="text-white/60">Waiting for {currentPlayer?.name} to choose a category...</p>
                  </div>
                )}
                
                {gameState?.globalLockedCategories && gameState.globalLockedCategories.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                    <p className="text-blue-200 text-sm">
                      <span className="font-semibold">Category Lock System:</span> Maximum 3 categories can be locked at once for ALL players. 
                      When a category is answered correctly, it gets locked globally. Select 3 different categories to unlock the oldest one.
                      Currently {gameState.globalLockedCategories.length}/3 categories locked globally.
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs bg-green-600/30 text-green-200 px-2 py-1 rounded">✓ Recent</span>
                      <span className="text-xs bg-gray-600/50 text-gray-400 px-2 py-1 rounded">🔒 Locked</span>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {gameState.gamePhase === 'question' && currentQuestion && isMyTurn && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{currentQuestion.category}</h3>
                  <div className="flex items-center text-yellow-400">
                    <Clock className="w-5 h-5 mr-1" />
                    <span className="font-bold">{timeLeft}s</span>
                  </div>
                </div>
                <p className="text-white text-lg mb-6">{currentQuestion.question}</p>
                <div className="space-y-3" data-test="answer-options">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => submitAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`w-full p-4 rounded-xl font-bold transition-all ${
                        selectedAnswer === index 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      } ${selectedAnswer !== null ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="mr-3 text-yellow-400">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lightning Round UI */}
            {gameState.gamePhase === 'lightning_round' && (
              <div className="bg-yellow-600/20 border border-yellow-500/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-yellow-300">⚡ Lightning Round!</h3>
                  <div className={`text-sm font-bold ${lightningTimeLeft <= 3 ? 'text-red-300' : 'text-yellow-200'}`}>⏱ {lightningTimeLeft}s</div>
                </div>
                <p className="text-white text-base mb-4">{gameState.lightningQuestion?.question || currentQuestion?.question}</p>
                <div className="space-y-2">
                  {(gameState.lightningQuestion?.options || currentQuestion?.options || []).map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Allow multiple attempts; server only accepts first correct globally
                        setHasBuzzed(true);
                        setSelectedLightningIndex(idx);
                        socket.emit('lightning-buzz', gameState.id, playerId, idx);
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedLightningIndex === idx
                          ? 'bg-yellow-600/40 border border-yellow-500/60 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <span className="mr-2 text-yellow-300 font-bold">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
                {hasBuzzed && (
                  <p className="text-white/60 text-sm mt-2 text-center">You buzzed{selectedLightningIndex !== null ? ` on ${String.fromCharCode(65 + selectedLightningIndex)}` : ''}! You can change your choice until someone wins.</p>
                )}
              </div>
            )}

            {gameState.gamePhase === 'question' && currentQuestion && !isMyTurn && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4" data-test="waiting-question-only">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{currentQuestion.category}</h3>
                </div>
                <p className="text-white text-base mb-3">{currentQuestion.question}</p>
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-1">{currentPlayer?.name} is answering...</p>
                  <p className="text-white/40 text-xs">Answer choices hidden until turn ends</p>
                </div>
              </div>
            )}
            
            {gameState.gamePhase === 'forfeit' && gameState.currentForfeit && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {isMyTurn ? 'Your Forfeit' : `${currentPlayer.name}'s Forfeit`}
                </h2>
                <div className={`${gameState.currentForfeit.type === 'shot' ? 'bg-amber-500/30 border-amber-500/50' : gameState.currentForfeit.type === 'pictionary' ? 'bg-purple-500/30 border-purple-500/50' : 'bg-red-500/20 border-red-500/40'} p-4 rounded-xl mb-4 border`}>
                  <p className="text-white mb-2">{gameState.currentForfeit.description}</p>
                  {isMyTurn && gameState.currentForfeit.wordToAct && (
                    <p className="text-2xl font-bold mt-4 bg-white/10 p-3 rounded-lg">
                      {gameState.currentForfeit.wordToAct}
                    </p>
                  )}
                  {isMyTurn && gameState.currentForfeit.type === 'shot' && (
                    <p className="text-2xl mt-4 text-yellow-300">
                      🥃 Time for a shot!
                    </p>
                  )}
                </div>
                {isMyTurn && gameState.currentForfeit.type === 'charade' && (
                  <button 
                    onClick={() => socket.emit('start-charade', gameState.id, playerId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl w-full"
                  >
                    Start Charade
                  </button>
                )}
                {isMyTurn && gameState.currentForfeit.type === 'pictionary' && (
                  <button 
                    onClick={() => socket.emit('start-charade', gameState.id, playerId)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl w-full"
                  >
                    Start Pictionary
                  </button>
                )}
                {isMyTurn && gameState.currentForfeit.type === 'shot' && (
                  <button 
                    onClick={() => socket.emit('start-charade', gameState.id, playerId)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl w-full"
                  >
                    I'll Take a Shot!
                  </button>
                )}
              </div>
            )}
            
            {gameState.gamePhase === 'charade_guessing' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {isMyTurn ? 'Act out your word!' : 'Guess the charade!'}
                </h2>
                
                <div className="flex items-center justify-between mb-3">
                  <span />
                  <div className="flex items-center text-yellow-400">
                    <Clock className="w-5 h-5 mr-1" />
                    <span className="font-bold">{Math.floor(charadeTimeLeft/60)}:{String(charadeTimeLeft%60).padStart(2,'0')}</span>
                  </div>
                </div>
                {isMyTurn ? (
                  <div className="bg-blue-500/20 p-4 rounded-xl mb-4 border border-blue-500/40">
                    <p className="text-white mb-2">Act out this word:</p>
                    <p className="text-2xl font-bold">{gameState.charadeSolution}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-white/80 mb-4">{currentPlayer.name} is acting out a word or phrase!</p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        className="bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white flex-1"
                        placeholder="Enter your guess..."
                      />
                      <button
                        onClick={submitCharadeGuess}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Guess
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {gameState.gamePhase === 'pictionary_drawing' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {isMyTurn ? 'Draw your word!' : 'Guess the pictionary!'}
                </h2>
                
                <div className="flex items-center justify-between mb-3">
                  <span />
                  <div className="flex items-center text-yellow-400">
                    <Clock className="w-5 h-5 mr-1" />
                    <span className="font-bold">{Math.floor(pictionaryTimeLeft/60)}:{String(pictionaryTimeLeft%60).padStart(2,'0')}</span>
                  </div>
                </div>
                {isMyTurn ? (
                  <div className="bg-purple-500/20 p-4 rounded-xl mb-4 border border-purple-500/40">
                    <p className="text-white mb-2">Draw this word:</p>
                    <p className="text-2xl font-bold">{gameState.pictionarySolution}</p>
                    <div className="mt-4">
                      <DrawingCanvas 
                        onDrawingUpdate={(drawingData) => {
                          console.log('Player DrawingCanvas onDrawingUpdate called');
                          socket.emit('update-drawing', gameState.id, playerId, drawingData);
                        }}
                        width={300}
                        height={200}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-white/80 mb-4">{currentPlayer.name} is drawing a word!</p>
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <DrawingDisplay drawingData={gameState.drawingData} width={300} height={200} />
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={pictionaryGuessInput}
                        onChange={(e) => setPictionaryGuessInput(e.target.value)}
                        className="bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white flex-1"
                        placeholder="Enter your guess..."
                      />
                      <button
                        onClick={submitPictionaryGuess}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                      >
                        Guess
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {gameState.gamePhase === 'finished' && gameState.winner && (
              <div>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
                <div>
                  {gameState.winner.id === playerId ? (
                    <p className="text-green-400 text-xl font-bold">🎉 You won! 🎉</p>
                  ) : (
                    <p className="text-white">
                      <span className="font-bold text-yellow-400">
                        {gameState.winner.avatar} {gameState.winner.name}
                      </span> won the game!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Answer Result */}
        {answerResult && answerResult.playerId === playerId && (
          <div className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border ${
            answerResult.isCorrect ? 'border-green-400/50' : 'border-red-400/50'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-2">
                {answerResult.isCorrect ? '✅' : '❌'}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                answerResult.isCorrect ? 'text-green-400' : 'text-red-400'
              }`}>
                {answerResult.isCorrect ? 'Correct!' : 'Incorrect!'}
              </h3>
              {answerResult.isCorrect ? (
                <div>
                  <p className="text-white mb-2">You earned a point in this category!</p>
                  {answerResult.categoryLockMessage && (
                    <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-3 mt-3">
                      <p className="text-blue-300 text-sm font-medium">
                        {answerResult.categoryLockMessage}
                      </p>
                      {answerResult.lockedCategories && answerResult.lockedCategories.length > 0 && (
                        <div className="mt-2">
                          <p className="text-white/70 text-xs">Locked categories:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {answerResult.lockedCategories.map((cat, index) => (
                              <span key={index} className="bg-red-600/30 text-red-300 text-xs px-2 py-1 rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {answerResult.recentCategories && answerResult.recentCategories.length > 0 && (
                        <div className="mt-2">
                          <p className="text-white/70 text-xs">Recent categories ({answerResult.recentCategories.length}/3):</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {answerResult.recentCategories.map((cat, index) => (
                              <span key={index} className="bg-green-600/30 text-green-300 text-xs px-2 py-1 rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-white">You'll have to do a forfeit!</p>
              )}
            </div>
          </div>
        )}

        {/* Lightning Reward Modal */}
        {showLightningReward && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-white/10">
              <h4 className="text-xl font-bold text-white mb-3">⚡ You won the Lightning Round!</h4>
              <p className="text-white/80 mb-4">Choose your reward:</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  disabled={rewardSubmitting}
                  onClick={() => {
                    setRewardSubmitting(true);
                    socket.emit('choose-lightning-reward', gameState.id, playerId, 'extra_life');
                  }}
                  className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-60"
                >
                  +1 Extra Life
                </button>
                <button
                  disabled={rewardSubmitting}
                  onClick={() => {
                    setRewardSubmitting(true);
                    socket.emit('choose-lightning-reward', gameState.id, playerId, 'lifeline');
                  }}
                  className="px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-60"
                >
                  +1 Lifeline (50/50)
                </button>
              </div>
            </div>
          </div>
        )}

    {/* Player List (no scores) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Players</h2>
          <div className="space-y-3">
      {gameState.players.map((p) => (
                <div key={p.id} 
                     className={`flex items-center justify-between p-3 rounded-xl ${
                       p.isEliminated ? 'bg-red-900/30 opacity-60' : 
                       p.id === playerId ? 'bg-blue-600/30 border border-blue-400/50' : 'bg-white/5'
                     }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{p.avatar}</span>
                    <span className={`font-bold ${p.isEliminated ? 'line-through text-white/60' : 'text-white'}`}>{p.name}</span>
                    {p.isEliminated && (
                      <span className="text-xs bg-red-500/50 px-2 py-1 rounded text-white">Eliminated</span>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex items-center text-red-400">
                      <Heart className="w-4 h-4 mr-1" />
                      <span className="font-bold">{p.lives}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerInterface;
