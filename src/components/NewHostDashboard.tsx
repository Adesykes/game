import React, { useState, useEffect } from 'react';
import { useFullScreen } from '../hooks/useFullScreen';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { Users, Trophy, Clock, Maximize, Minimize } from 'lucide-react';
import { questionCategories } from '../data/questions';
import QRCodeDisplay from './QRCodeDisplay';
import { DrawingCanvas, DrawingDisplay } from './DrawingComponents';

interface HostDashboardProps {
  socket: Socket;
  gameState: GameState;
  roomCode: string;
  charadeDeadline?: number | null;
  pictionaryDeadline?: number | null;
  playerId: string;
  lightningCountdownEndAt?: number | null;
  answerResult?: { playerId: string; answerIndex: number; isCorrect: boolean; correctAnswer: number; categoryLocked?: string; lockedCategories?: string[]; recentCategories?: string[]; categoryLockMessage?: string } | null;
  forfeitResult?: { playerId: string; success: boolean; forfeitType: string } | null;
  forfeitFailureResult?: { playerId: string; forfeitType: string } | null;
  guessResult?: { solverId: string; forfeitType: string; solution: string } | null;
}

const HostDashboard: React.FC<HostDashboardProps> = ({
  socket,
  gameState,
  roomCode,
  charadeDeadline,
  pictionaryDeadline,
  playerId,
  lightningCountdownEndAt,
  answerResult,
  forfeitResult,
  forfeitFailureResult,
  guessResult,
}) => {
  const [showQR, setShowQR] = useState(true);
  const [guessInput, setGuessInput] = useState('');
  const [charadeTimeLeft, setCharadeTimeLeft] = useState(120);
  const [pictionaryTimeLeft, setPictionaryTimeLeft] = useState(60);
  const [tongueTwisterTimeLeft, setTongueTwisterTimeLeft] = useState(20);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(30);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [showKaraokeSettings, setShowKaraokeSettings] = useState(false);
  const [lightningCountdown, setLightningCountdown] = useState<number | null>(null);
  const [karaokeProbability, setKaraokeProbability] = useState<number>(gameState.karaokeSettings?.probability ?? 0.4);
  const [karaokeDuration, setKaraokeDuration] = useState<number>(gameState.karaokeSettings?.durationSec ?? 45);
  const [karaokeCooldown, setKaraokeCooldown] = useState<number>(gameState.karaokeSettings?.cooldownSec ?? 180);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [lightningTimeLeft, setLightningTimeLeft] = useState<number>(0);
  const [hostLightningSelectedIdx, setHostLightningSelectedIdx] = useState<number | null>(null);
  const [hostHasBuzzed, setHostHasBuzzed] = useState<boolean>(false);
  const [showLightningRewardHost, setShowLightningRewardHost] = useState<boolean>(false);
  const [rewardSubmittingHost, setRewardSubmittingHost] = useState<boolean>(false);
  
  // Update local state when gameState.karaokeSettings changes
  useEffect(() => {
    console.log('[Karaoke] Updating local state from gameState:', gameState.karaokeSettings);
    setKaraokeProbability(gameState.karaokeSettings?.probability ?? 0.4);
    setKaraokeDuration(gameState.karaokeSettings?.durationSec ?? 45);
    setKaraokeCooldown(gameState.karaokeSettings?.cooldownSec ?? 180);
  }, [gameState.karaokeSettings]);

  // Lightning countdown on host
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
  
  // Host lightning UI is read-only
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const hostPlayer = gameState.players.find(p => p.isHost);
  const isHostTurn = !!currentPlayer?.isHost;
  const viewerIsHost = playerId === hostPlayer?.id; // Check if the person viewing is actually the host

  // Lifeline and power-up handlers
  const handleFiftyFifty = () => {
    if (!isHostTurn || !hostPlayer || hostPlayer.lifelines.fiftyFifty <= 0) return;
    socket.emit('use-lifeline-fifty-fifty', roomCode, playerId);
  };

  const handlePassToRandom = () => {
    if (!isHostTurn || !hostPlayer || hostPlayer.lifelines.passToRandom <= 0) return;
    socket.emit('use-lifeline-pass-to-random', roomCode, playerId);
  };

  const handleSwapQuestion = () => {
    if (!isHostTurn || !hostPlayer || hostPlayer.powerUps.swap_question <= 0) return;
    socket.emit('powerup-swap-question', roomCode, playerId);
  };
  const handleStealCategory = () => {
    if (!isHostTurn || !hostPlayer) return;
    if (!hostPlayer.powerUps?.steal_category || hostPlayer.powerUps.steal_category <= 0) return;
    // Find eligible targets (other players with progress in categories)
    const eligibleTargets = gameState.players.filter(p =>
      p.id !== hostPlayer.id &&
      !p.isEliminated &&
      Object.values(p.categoryScores || {}).some(score => (score || 0) > 0)
    );
    if (eligibleTargets.length === 0) return;
    const targetPlayer = eligibleTargets[0];
    const availableCategories = Object.keys(targetPlayer.categoryScores || {}).filter(cat =>
      (targetPlayer.categoryScores[cat] || 0) > 0
    );
    if (availableCategories.length === 0) return;
    const categoryToSteal = availableCategories[0];
    socket.emit('powerup-steal-category', gameState.id, hostPlayer.id, targetPlayer.id, categoryToSteal);
  };
  const isCurrentPlayerTurn = currentPlayer?.id === hostPlayer?.id;
  // Host should always be able to manage karaoke regardless of whose turn it is
  const hostId = hostPlayer?.id;
  console.log('[Karaoke] hostId:', hostId, 'gameState.id:', gameState.id);
  
  const selectCategory = (category: string) => {
    if (gameState.gamePhase !== 'category_selection') return;
    if (!isHostTurn || !hostPlayer) return; // Only allow host to select categories on their turn
    // Use the host player's id
    socket.emit('select-category', gameState.id, hostPlayer.id, category);
  };

  const submitAnswer = (answerIndex: number) => {
    if (gameState.gamePhase !== 'question' || !gameState.currentQuestion) return;
    if (!isHostTurn || !hostPlayer) return; // Only allow host to answer on their turn
    console.log('[Host] Submitting answer on behalf of', hostPlayer.name, 'index:', answerIndex);
    socket.emit('submit-answer', gameState.id, hostPlayer.id, answerIndex);
  };

  const startCharade = () => {
    if (gameState.gamePhase !== 'forfeit' || !gameState.currentForfeit) return;
    console.log('[Host] Starting charade for', currentPlayer.name, 'forfeit type:', gameState.currentForfeit.type);
    socket.emit('start-charade', gameState.id, currentPlayer.id);
  };

  const submitCharadeGuess = () => {
    if (gameState.gamePhase !== 'charade_guessing' || isHostTurn) return;
    if (!guessInput.trim()) return;
    if (!hostPlayer) return;
    socket.emit('guess-charade', gameState.id, hostPlayer.id, guessInput.trim());
    setGuessInput('');
  };

  const submitPictionaryGuess = () => {
    if (gameState.gamePhase !== 'pictionary_drawing' || isHostTurn) return;
    if (!guessInput.trim()) return;
    if (!hostPlayer) return;
    socket.emit('guess-pictionary', gameState.id, hostPlayer.id, guessInput.trim());
    setGuessInput('');
  };
  
  const startGame = () => {
    if (gameState.players.length < 2) return;
    socket.emit('start-game', roomCode);
  };

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

  // Tongue twister countdown synced to server deadline
  useEffect(() => {
    if (gameState.gamePhase !== 'forfeit' || gameState.currentForfeit?.type !== 'tongue_twister') return;
    const id = setInterval(() => {
      const now = Date.now();
      const dl = gameState.tongueTwisterDeadline ?? now;
      const remaining = Math.max(0, Math.floor((dl - now) / 1000));
      setTongueTwisterTimeLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, [gameState.gamePhase, gameState.currentForfeit?.type, gameState.tongueTwisterDeadline]);

  // Question countdown timer
  useEffect(() => {
    if (gameState.gamePhase !== 'question' || !gameState.currentQuestion) return;
    if (questionTimeLeft <= 0) return;
    
    const timer = setTimeout(() => setQuestionTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameState.currentQuestion, gameState.gamePhase, questionTimeLeft]);

  // Reset question timer when a new question appears
  useEffect(() => {
    if (gameState.currentQuestion && gameState.gamePhase === 'question') {
      setQuestionTimeLeft(30);
    }
  }, [gameState.currentQuestion, gameState.gamePhase]);

  // Reset host selection/reward state when lightning starts
  useEffect(() => {
    if (gameState.gamePhase === 'lightning_round') {
      setHostLightningSelectedIdx(null);
      setHostHasBuzzed(false);
      setShowLightningRewardHost(false);
      setRewardSubmittingHost(false);
    }
  }, [gameState.gamePhase]);

  // Reset selection when a new lightning question starts
  useEffect(() => {
    if (gameState.gamePhase === 'lightning_round' && gameState.lightningQuestionId) {
      setHostLightningSelectedIdx(null);
      setHostHasBuzzed(false);
    }
  }, [gameState.lightningQuestionId, gameState.gamePhase]);

  // Sync karaoke settings when server updates
  useEffect(() => {
    const handler = (data: any) => {
      console.log('[Karaoke Sync] Received karaoke-settings-updated:', data);
      if (data?.karaokeSettings) {
        setKaraokeProbability(data.karaokeSettings.probability);
        setKaraokeDuration(data.karaokeSettings.durationSec);
        setKaraokeCooldown(data.karaokeSettings.cooldownSec);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000); // Hide after 3 seconds
      }
    };
    socket.on('karaoke-settings-updated', handler);
    return () => { socket.off('karaoke-settings-updated', handler); };
  }, [socket]);

  // Listen for lightning reward events for host (show modal if host wins)
  useEffect(() => {
    if (!socket) return;
    const onChoice = ({ winnerId }: { winnerId: string }) => {
      if (winnerId === hostPlayer?.id) {
        setShowLightningRewardHost(true);
      }
    };
    const onApplied = ({ playerId: rewardedId }: { playerId: string }) => {
      if (rewardedId === hostPlayer?.id) {
        setShowLightningRewardHost(false);
        setRewardSubmittingHost(false);
      }
    };
    socket.on('lightning-reward-choice', onChoice);
    socket.on('lightning-reward-applied', onApplied);
    return () => {
      socket.off('lightning-reward-choice', onChoice);
      socket.off('lightning-reward-applied', onApplied);
    };
  }, [socket, hostPlayer?.id]);

  // Lightning countdown timer
  useEffect(() => {
    if (lightningCountdownEndAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((lightningCountdownEndAt - now) / 1000);
        if (remaining > 0) {
          setLightningCountdown(remaining);
        } else {
          setLightningCountdown(null);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLightningCountdown(null);
    }
  }, [lightningCountdownEndAt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      {/* Lightning teaser banner */}
      {typeof gameState.turnsPlayed === 'number' && gameState.gamePhase !== 'lightning_round' && !answerResult && !forfeitResult && !forfeitFailureResult && !guessResult && (
        <div className="max-w-6xl mx-auto mb-3">
          <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-lg px-3 py-2 text-center">
            <span className="text-yellow-200 text-sm font-semibold">⚡ Lightning round in {((10 - ((gameState.turnsPlayed % 10) || 0)) % 10) || 10} turns</span>
          </div>
        </div>
      )}
      {/* Lightning countdown banner */}
      {lightningCountdown !== null && lightningCountdown > 0 && (
        <div className="max-w-6xl mx-auto mb-3">
          <div className="bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2 text-center animate-pulse">
            <span className="text-red-200 text-lg font-bold">⚡ Lightning Round Starting in {lightningCountdown}...</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Host Header */}
        <div className="lg:col-span-3 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center relative">
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
          
          <h1 className="text-3xl font-bold text-white mb-1">Game Host</h1>
          <p className="text-white/80 mb-4">Room Code: <span className="font-mono text-yellow-400 font-bold">{roomCode}</span></p>
          
          {gameState.gamePhase === 'waiting' && (
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowQR(!showQR)}
                className="mb-4 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg inline-flex items-center"
              >
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>
              
              {showQR && <QRCodeDisplay roomCode={roomCode} />}
              
              {/* Game Instructions */}
              <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-4xl w-full border border-white/20">
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
                    Need at least 2 players to start. Host controls game settings and can start when ready!
                  </p>
                </div>
              </div>
              
              <button
                onClick={startGame}
                disabled={gameState.players.length < 2}
                className={`mt-6 px-8 py-3 rounded-xl text-white font-bold ${
                  gameState.players.length < 2
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {gameState.players.length < 2 ? 'Waiting for Players...' : 'Start Game'}
              </button>
            </div>
          )}
          
          {gameState.gamePhase !== 'waiting' && gameState.gamePhase !== 'finished' && (
            <div className="text-center">
              <p className="text-lg font-bold text-white mb-1">Current Player:</p>
              <div className="inline-flex items-center bg-white/10 px-4 py-2 rounded-xl">
                <span className="text-2xl mr-2">{currentPlayer.avatar}</span>
                <span className="text-white font-bold">{currentPlayer.name}</span>
              </div>
      {hostId && (
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <button
        onClick={() => {
          console.log('[Karaoke Start] Emitting karaoke-start-manual');
          hostId && socket.emit('karaoke-start-manual', gameState.id, hostId);
        }}
                    className="bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-semibold px-4 py-2 rounded-lg shadow"
                  >
                    Start Karaoke 🎤
                  </button>
                  <button
                    onClick={() => setShowKaraokeSettings(s => !s)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
                  >
                    {showKaraokeSettings ? 'Hide' : 'Karaoke Settings'}
                  </button>
                  <button
                    onClick={() => {
                      if (!hostId) return;
                      console.log('[Lightning Start] Emitting start-lightning');
                      socket.emit('start-lightning', gameState.id, hostId);
                    }}
                    disabled={gameState.gamePhase === 'lightning_round' || gameState.gamePhase === 'karaoke_break' || gameState.gamePhase === 'karaoke_voting'}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow"
                  >
                    Start Lightning ⚡
                  </button>
                </div>
              )}
      {showKaraokeSettings && hostId && (
                <div className="mt-4 mx-auto max-w-md bg-black/40 rounded-xl p-4 border border-white/10 text-left">
                  <h3 className="text-white font-semibold mb-2 text-sm tracking-wide">Karaoke Settings</h3>
                  <div className="space-y-3 text-xs text-white/80">
                    <label className="block">Probability ({karaokeProbability.toFixed(2)})
                      <input type="range" min={0} max={1} step={0.05} value={karaokeProbability}
                        onChange={e=> setKaraokeProbability(parseFloat(e.target.value))}
                        className="w-full" />
                    </label>
                    <label className="block">Duration (sec): {karaokeDuration}
                      <input type="range" min={15} max={120} step={5} value={karaokeDuration}
                        onChange={e=> setKaraokeDuration(parseInt(e.target.value))}
                        className="w-full" />
                    </label>
                    <label className="block">Cooldown (sec): {karaokeCooldown}
                      <input type="range" min={30} max={600} step={30} value={karaokeCooldown}
                        onChange={e=> setKaraokeCooldown(parseInt(e.target.value))}
                        className="w-full" />
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button
        onClick={() => {
          if (!hostId) {
            console.log('[Karaoke Save] No hostId, cannot save');
            return;
          }
          console.log('[Karaoke Save] Emitting settings update:', { probability: karaokeProbability, durationSec: karaokeDuration, cooldownSec: karaokeCooldown });
          // Emit to server
          socket.emit('karaoke-settings-update', gameState.id, hostId, {
            probability: karaokeProbability,
            durationSec: karaokeDuration,
            cooldownSec: karaokeCooldown
          });
          // Local state will be updated via the sync effect when server responds
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
                      >Save</button>
                      <button
                        onClick={() => {
                          console.log('[Karaoke Reset] Resetting to defaults');
                          setKaraokeProbability(0.4);
                          setKaraokeDuration(45);
                          setKaraokeCooldown(180);
                        }}
                        className="px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                      >Reset</button>
                    </div>
                    {settingsSaved && (
                      <p className="text-green-400 text-sm mt-2 text-center">Settings saved!</p>
                    )}
                    {gameState.karaokeSettings?.lastTriggeredAt && (
                      <p className="text-[10px] text-white/40">Last: {Math.round((Date.now() - (gameState.karaokeSettings.lastTriggeredAt||0))/1000)}s ago</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                {gameState.gamePhase === 'category_selection' && (
                  <div>
                    {gameState.turnCooldownUntil && Date.now() < gameState.turnCooldownUntil ? (
                      <div className="text-center py-12">
                        <div className="text-white/70 text-lg mb-2">Preparing next turn…</div>
                        <p className="text-white/50 text-sm">Please wait a moment…</p>
                      </div>
                    ) : (
                      <>
                    {/* Host Sabotage Controls */}
                    {hostPlayer?.hasSabotage && (
                      <div className="mb-4 max-w-3xl mx-auto bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                        <div className="text-center text-red-300 font-bold mb-2">⚡ Sabotage Ready</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {gameState.players.filter(p => p.id !== hostPlayer.id && !p.isEliminated).map(p => (
                            <button
                              key={p.id}
                              onClick={() => socket.emit('sabotage-player', gameState.id, hostPlayer.id, p.id)}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
                            >
                              🎯 {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-white/80 mb-3">
                      {isHostTurn
                        ? 'Choose a category for your question:'
                        : `${currentPlayer.name} is choosing a category...`}
                    </p>
                    {isHostTurn && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-w-3xl mx-auto">
                        {/* Host power-up: Steal Category */}
                        {(hostPlayer?.powerUps?.steal_category || 0) > 0 && (
                          <div className="col-span-2 sm:col-span-3 md:col-span-5 mb-2 flex justify-center">
                            <button
                              onClick={handleStealCategory}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Steal 1 progress from another player's category"
                            >
                              🏴‍☠️ Steal Category ({hostPlayer?.powerUps?.steal_category || 0})
                            </button>
                          </div>
                        )}
                        {questionCategories.map((category) => {
                          const isLocked = gameState?.globalLockedCategories?.includes(category) || false;
                          const isRecent = gameState?.globalRecentCategories?.includes(category) || false;
                          
                          return (
                            <button
                              key={category}
                              onClick={() => {
                                if (gameState.turnCooldownUntil && Date.now() < gameState.turnCooldownUntil) return;
                                if (!isLocked) selectCategory(category);
                              }}
                              disabled={isLocked}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors relative ${
                                isLocked 
                                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-60' 
                                  : isRecent
                                    ? 'bg-green-600/30 hover:bg-green-600/40 text-green-200 border border-green-500/30'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                              title={
                                isLocked 
                                  ? `Locked: Select 3 different categories first (${gameState?.globalRecentCategories?.length || 0}/3)` 
                                  : isRecent 
                                    ? 'Recently selected category' 
                                    : 'Click to select this category'
                              }
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
                    
                    {isHostTurn && gameState?.globalLockedCategories && gameState.globalLockedCategories.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 max-w-3xl mx-auto">
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
                
                {gameState.gamePhase === 'question' && gameState.currentQuestion && (
                  <div className="mt-2 text-left bg-white/10 p-4 rounded-xl">
                    {/* Always show category + question to everyone to keep context */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-yellow-400 font-bold">{gameState.currentQuestion.category}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${questionTimeLeft <= 10 ? 'text-red-400' : 'text-white/80'}`}>
                          {questionTimeLeft}s
                        </span>
                        <Clock className="w-5 h-5 text-white/60" />
                      </div>
                    </div>
                    <p className="text-white text-lg mb-4">{gameState.currentQuestion.question}</p>

                    {/* Only the current player (host on their turn) sees options and controls */}
                    {isHostTurn && viewerIsHost ? (
                      <>
                        {hostPlayer && (
                          <div className="mb-6">
                            <div className="flex flex-wrap gap-3 mb-3">
                              <button
                                onClick={handleFiftyFifty}
                                disabled={hostPlayer.lifelines.fiftyFifty <= 0}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                50/50 ({hostPlayer.lifelines.fiftyFifty})
                              </button>
                              <button
                                onClick={handlePassToRandom}
                                disabled={hostPlayer.lifelines.passToRandom <= 0}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Pass to Random ({hostPlayer.lifelines.passToRandom})
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={handleSwapQuestion}
                                disabled={hostPlayer.powerUps.swap_question <= 0}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                🔄 Swap Question ({hostPlayer.powerUps.swap_question})
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          {gameState.currentQuestion.options.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => submitAnswer(idx)}
                              className="bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-left"
                            >
                              <span className="text-yellow-400 mr-2">{String.fromCharCode(65 + idx)}.</span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-2 text-white/60">
                        Waiting for {currentPlayer?.name} to answer...
                      </div>
                    )}
                  </div>
                )}

                {gameState.gamePhase === 'lightning_round' && (
                  <div className="mt-2 text-left bg-yellow-600/20 p-4 rounded-xl border border-yellow-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-300 font-bold">
                        ⚡ Lightning Round{gameState.lightningMode === 'sudden_death' ? ' - Sudden Death!' : ''}
                      </span>
                      <span className={`text-sm font-bold ${lightningTimeLeft <= 3 ? 'text-red-300' : 'text-yellow-200'}`}>⏱ {lightningTimeLeft}s</span>
                    </div>
                    {gameState.lightningMode === 'sudden_death' && (
                      <div className="mb-3 p-2 bg-red-900/30 border border-red-500/40 rounded">
                        <p className="text-red-200 text-xs font-bold mb-1">💀 SUDDEN DEATH: Wrong answers eliminate players!</p>
                        <div className="flex flex-wrap gap-1">
                          {gameState.players.filter(p => !p.isEliminated).map((p) => (
                            <span key={p.id} className="text-xs bg-green-600/30 px-1 py-0.5 rounded text-green-200">
                              {p.avatar} {p.name}
                            </span>
                          ))}
                          {gameState.players.filter(p => p.isEliminated).map((p) => (
                            <span key={p.id} className="text-xs bg-red-600/30 px-1 py-0.5 rounded text-red-200 line-through">
                              {p.avatar} {p.name} 💀
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-white text-lg mb-3">{gameState.lightningQuestion?.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(gameState.lightningQuestion?.options || []).map((opt, idx) => (
                        <button
                          key={idx}
                          disabled={!gameState.lightningQuestionId || hostHasBuzzed || !gameState.lightningAcceptingAnswers}
                          onClick={() => {
                            if (!hostPlayer || !gameState.lightningQuestionId || hostHasBuzzed || !gameState.lightningAcceptingAnswers) return;
                            const questionId = gameState.lightningQuestionId;
                            const submissionId = Math.random().toString(36).substring(2, 9);
                            setHostLightningSelectedIdx(idx);
                            setHostHasBuzzed(true);
                            console.log(`[host-lightning-buzz] Sending buzz: room=${gameState.id} player=${hostPlayer.id} idx=${idx} qId=${questionId} subId=${submissionId}`);
                            socket.emit('lightning-buzz', gameState.id, hostPlayer.id, idx, questionId, submissionId);
                          }}
                          className={`p-2 rounded text-left transition-colors ${
                            !gameState.lightningQuestionId || !gameState.lightningAcceptingAnswers
                              ? 'bg-gray-600/40 text-gray-400 cursor-not-allowed opacity-60'
                              : hostHasBuzzed
                              ? hostLightningSelectedIdx === idx
                                ? 'bg-yellow-600/60 border-2 border-yellow-400 text-white cursor-not-allowed'
                                : 'bg-gray-600/40 text-gray-400 cursor-not-allowed opacity-60'
                              : hostLightningSelectedIdx === idx
                              ? 'bg-yellow-600/40 border border-yellow-500/60 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <span className="font-bold text-yellow-300 mr-1">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                    <p className="text-white/60 text-xs mt-2">
                      {!gameState.lightningQuestionId 
                        ? '⚡ Get ready to buzz!'
                        : !gameState.lightningAcceptingAnswers
                        ? '⚡ Stand by… buzzing will open in a moment'
                        : hostHasBuzzed 
                        ? `⚡ Answer locked in: ${String.fromCharCode(65 + (hostLightningSelectedIdx ?? 0))}. Waiting for results...`
                        : 'Tap to buzz; first correct across all players wins.'
                      }
                    </p>
                  </div>
                )}

                {/* Lightning Reward Modal for Host */}
                {showLightningRewardHost && hostPlayer && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-white/10">
                      <h4 className="text-xl font-bold text-white mb-3">⚡ You won the Lightning Round!</h4>
                      <p className="text-white/80 mb-4">Choose your reward:</p>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          disabled={rewardSubmittingHost}
                          onClick={() => {
                            setRewardSubmittingHost(true);
                            socket.emit('choose-lightning-reward', gameState.id, hostPlayer.id, 'extra_life');
                          }}
                          className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-60"
                        >
                          +1 Extra Life
                        </button>
                        <button
                          disabled={rewardSubmittingHost}
                          onClick={() => {
                            setRewardSubmittingHost(true);
                            socket.emit('choose-lightning-reward', gameState.id, hostPlayer.id, 'lifeline');
                          }}
                          className="px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-60"
                        >
                          +1 Lifeline (50/50)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {gameState.gamePhase === 'forfeit' && gameState.currentForfeit && (
                  <div className={`text-left ${
                    gameState.currentForfeit.type === 'shot' 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : gameState.currentForfeit.type === 'pictionary' 
                        ? 'bg-purple-500/10 border-purple-500/30' 
                        : gameState.currentForfeit.type === 'tongue_twister'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                  } p-4 rounded-xl border`}>
                    <p className={`${
                      gameState.currentForfeit.type === 'shot' 
                        ? 'text-amber-300' 
                        : gameState.currentForfeit.type === 'pictionary' 
                          ? 'text-purple-300' 
                          : gameState.currentForfeit.type === 'tongue_twister'
                            ? 'text-green-300'
                            : 'text-red-300'
                    } font-semibold mb-2`}>
                      {
                        gameState.currentForfeit.type === 'shot' 
                          ? 'Shot Time!' 
                          : gameState.currentForfeit.type === 'pictionary' 
                            ? 'Pictionary!' 
                            : gameState.currentForfeit.type === 'tongue_twister'
                              ? '🤪 Tongue Twister!'
                              : 'Forfeit!'
                      }
                    </p>
                    <p className="text-white mb-3">{gameState.currentForfeit.description}</p>
                    {isHostTurn && gameState.currentForfeit.wordToAct && (
                      <div className="mb-4 select-none">
                        <div className="mt-2 text-2xl font-bold text-white bg-white/10 rounded-lg p-3 inline-block">
                          {gameState.currentForfeit.wordToAct}
                        </div>
                      </div>
                    )}
                    {isHostTurn && gameState.currentForfeit.tongueTwister && (
                      <div className="mb-4 select-none">
                        <div className="mt-2 text-2xl font-bold text-white bg-white/10 rounded-lg p-3 text-center">
                          🤪 {gameState.currentForfeit.tongueTwister}
                        </div>
                      </div>
                    )}
                    {gameState.currentForfeit.type === 'tongue_twister' && (
                      <div className="text-center mb-4">
                        <span className="text-white/80 text-sm">Time remaining:</span>
                        <span className="text-green-300 font-bold text-xl ml-2">{tongueTwisterTimeLeft}s</span>
                      </div>
                    )}
                    {isHostTurn && gameState.currentForfeit.type === 'shot' && (
                      <div className="mb-4 select-none">
                        <div className="mt-2 text-2xl text-yellow-300 p-3">
                          🥃 Shot time for {currentPlayer?.name}!
                        </div>
                      </div>
                    )}
                    {(() => {
                      if (isHostTurn && gameState.currentForfeit.type === 'charade') {
                        return (
                          <button
                            onClick={startCharade}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                          >
                            Start Charade
                          </button>
                        );
                      } else if (isHostTurn && gameState.currentForfeit.type === 'pictionary') {
                        return (
                          <button
                            onClick={startCharade}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
                          >
                            Start Pictionary
                          </button>
                        );
                      } else if (isHostTurn && gameState.currentForfeit.type === 'shot') {
                        return (
                          <button
                            onClick={startCharade}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg"
                          >
                            I'll Take a Shot!
                          </button>
                        );
                      } else {
                        return (
                          <p className="text-white/70">
                            {
                              gameState.currentForfeit.type === 'charade' 
                                ? `Waiting for ${currentPlayer.name} to start the charade...`
                                : gameState.currentForfeit.type === 'pictionary'
                                ? `Waiting for ${currentPlayer.name} to start the pictionary...`
                                : gameState.currentForfeit.type === 'tongue_twister'
                                ? `Tongue twister in progress...`
                                : `Waiting for ${currentPlayer.name} to take a shot...`
                            }
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}
                
                {gameState.gamePhase === 'charade_guessing' && (
                  <div className="mt-2 text-left bg-white/10 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/80">Charade in progress</span>
                      <span className="text-white/60 text-sm">
                        {Math.floor(charadeTimeLeft/60)}:{String(charadeTimeLeft%60).padStart(2,'0')}
                      </span>
                    </div>
                    {isHostTurn ? (
                      <div>
                        <p className="text-white/80 mb-2">Charade in progress! Act out this word:</p>
                        <div className="text-2xl font-bold text-white bg-white/10 rounded-lg p-3 inline-block">
                          {gameState.charadeSolution}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white/80 mb-4">Charade in progress! Guess the word:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            className="bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white flex-1"
                            placeholder="Enter your guess..."
                          />
                          <button
                            onClick={submitCharadeGuess}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg"
                          >
                            Guess
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {gameState.gamePhase === 'pictionary_drawing' && (
                  <div className="mt-2 text-left bg-white/10 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/80">Pictionary in progress</span>
                      <span className="text-white/60 text-sm">
                        {Math.floor(pictionaryTimeLeft/60)}:{String(pictionaryTimeLeft%60).padStart(2,'0')}
                      </span>
                    </div>
                    {isCurrentPlayerTurn ? (
                      <div>
                        <p className="text-white/80 mb-4">Draw this word:</p>
                        <div className="text-2xl font-bold text-white bg-white/10 rounded-lg p-3 inline-block mb-4">
                          {gameState.pictionarySolution}
                        </div>
                        <DrawingCanvas 
                          onDrawingUpdate={(data: string) => {
                            console.log('DrawingCanvas onDrawingUpdate called');
                            socket.emit('update-drawing', gameState.id, currentPlayer.id, data);
                          }}
                          width={400}
                          height={300}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-white/80 mb-4">{currentPlayer.name} is drawing a word!</p>
                        <DrawingDisplay 
                          drawingData={gameState.drawingData}
                          width={400}
                          height={300}
                        />
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            className="bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white flex-1"
                            placeholder="Enter your guess..."
                          />
                          <button
                            onClick={submitPictionaryGuess}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg"
                          >
                            Guess
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {gameState.gamePhase === 'finished' && gameState.winner && (
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
              <p className="text-white text-xl">
                <span className="font-bold text-yellow-400">
                  {gameState.winner.avatar} {gameState.winner.name}
                </span> won the game!
              </p>
            </div>
          )}
        </div>
        
        {/* Player List */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Users className="mr-2" />
              Players ({activePlayers.length} active)
            </h2>
            <span className="text-white/60 text-sm">Round {gameState.round}</span>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl ${
                    player.id === currentPlayer.id
                      ? 'bg-blue-600/30 border border-blue-400/50'
                      : player.isEliminated
                      ? 'bg-red-900/30 opacity-60'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{player.avatar}</span>
                      <div>
                        <div className={`font-bold ${player.isEliminated ? 'line-through text-white/60' : 'text-white'}`}>
                          {player.name}
                          {player.isHost && <span className="ml-2 text-xs bg-yellow-500/50 px-2 py-1 rounded">Host</span>}
                        </div>
                        <div className="flex mt-1">
                          <span className="text-red-400 text-xs">Lives: {player.lives}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Power Bar for each player */}
                  <div className="flex items-center space-2">
                    <span className="text-white/60 text-xs">Power:</span>
                    <div className="flex-1 bg-white/20 rounded-full h-2 mx-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${player.powerBar ?? 50}%` }}
                      ></div>
                    </div>
                    <span className="text-white/60 text-xs">{player.powerBar ?? 50}%</span>
                    {player.hasSabotage && <span className="text-red-400 text-xs">⚡</span>}
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        {/* Category Scores */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white flex items-center mb-4">
            <Trophy className="mr-2" />
            Categories
          </h2>
          
          <div className="space-y-4">
            {questionCategories.map(category => (
              <div key={category} className="bg-white/5 p-3 rounded-lg">
                <h3 className="font-bold text-white text-sm mb-2">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {gameState.players.filter(p => !p.isEliminated && p.categoryScores?.[category]).map(p => (
                    <div key={`${category}-${p.id}`} className="flex items-center text-xs">
                      <span className="w-4 h-4 flex items-center justify-center mr-1">{p.avatar}</span>
                      <span className="text-white/80 truncate">{p.name}:</span>
                      <span className="text-yellow-400 font-bold ml-1">{p.categoryScores?.[category] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
