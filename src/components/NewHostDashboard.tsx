import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { Users, Trophy, Clock } from 'lucide-react';
import { questionCategories } from '../data/questions';
import QRCodeDisplay from './QRCodeDisplay';

interface HostDashboardProps {
  socket: Socket;
  gameState: GameState;
  roomCode: string;
  charadeDeadline?: number | null;
}

const HostDashboard: React.FC<HostDashboardProps> = ({
  socket,
  gameState,
  roomCode,
  charadeDeadline,
}) => {
  const [showQR, setShowQR] = useState(true);
  const [guessInput, setGuessInput] = useState('');
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const isHostTurn = !!currentPlayer?.isHost;
  const hostPlayer = gameState.players.find(p => p.isHost);
  
  const selectCategory = (category: string) => {
    if (gameState.gamePhase !== 'category_selection') return;
    if (!isHostTurn || !hostPlayer) return; // Only allow host to select categories on their turn
    // Use the host player's id
    socket.emit('select-category', gameState.id, hostPlayer.id, category);
  };

  const submitAnswer = (answerIndex: number) => {
    if (gameState.gamePhase !== 'question' || !gameState.currentQuestion) return;
    if (!isHostTurn || !hostPlayer) return; // Only allow host to answer on their turn
    // Submit on behalf of the host
    console.log('[Host] Submitting answer on behalf of', hostPlayer.name, 'index:', answerIndex);
    socket.emit('submit-answer', gameState.id, hostPlayer.id, answerIndex);
  };

  const startCharade = () => {
    if (gameState.gamePhase !== 'forfeit' || !gameState.currentForfeit) return;
    console.log('[Host] Starting charade for', currentPlayer.name);
    socket.emit('start-charade', gameState.id, currentPlayer.id);
  };

  const submitCharadeGuess = () => {
    if (gameState.gamePhase !== 'charade_guessing' || isHostTurn) return;
    if (!guessInput.trim()) return;
    if (!hostPlayer) return;
    socket.emit('guess-charade', gameState.id, hostPlayer.id, guessInput.trim());
    setGuessInput('');
  };
  
  const startGame = () => {
    if (gameState.players.length < 2) return;
    socket.emit('start-game', roomCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Host Header */}
        <div className="lg:col-span-3 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
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
              
              <div className="mt-4">
                {gameState.gamePhase === 'category_selection' && (
                  <div>
                    <p className="text-white/80 mb-3">
                      {isHostTurn
                        ? 'Choose a category for your question:'
                        : `${currentPlayer.name} is choosing a category...`}
                    </p>
                    {isHostTurn && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-w-3xl mx-auto">
                        {questionCategories.map((category) => {
                          const isLocked = gameState?.globalLockedCategories?.includes(category) || false;
                          const isRecent = gameState?.globalRecentCategories?.includes(category) || false;
                          
                          return (
                            <button
                              key={category}
                              onClick={() => !isLocked && selectCategory(category)}
                              disabled={isLocked}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors relative ${
                                isLocked 
                                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-60' 
                                  : isRecent
                                    ? 'bg-green-600/30 hover:bg-green-600/40 text-green-200 border border-green-500/30'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
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
                  </div>
                )}
                
                {gameState.gamePhase === 'question' && gameState.currentQuestion && (
                  <div className="mt-2 text-left bg-white/10 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-yellow-400 font-bold">{gameState.currentQuestion.category}</span>
                      <Clock className="w-5 h-5 text-white/60" />
                    </div>
                    <p className="text-white text-lg mb-4">{gameState.currentQuestion.question}</p>
                    
                    {isHostTurn ? (
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
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-white/60">Waiting for {currentPlayer?.name} to answer...</p>
                      </div>
                    )}
                  </div>
                )}
                
                {gameState.gamePhase === 'forfeit' && gameState.currentForfeit && (
                  <div className={`text-left ${gameState.currentForfeit.type === 'shot' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'} p-4 rounded-xl border`}>
                    <p className={`${gameState.currentForfeit.type === 'shot' ? 'text-amber-300' : 'text-red-300'} font-semibold mb-2`}>
                      {gameState.currentForfeit.type === 'shot' ? 'Shot Time!' : 'Forfeit!'}
                    </p>
                    <p className="text-white mb-3">{gameState.currentForfeit.description}</p>
                    {isHostTurn && gameState.currentForfeit.wordToAct && (
                      <div className="mb-4 select-none">
                        <div className="mt-2 text-2xl font-bold text-white bg-white/10 rounded-lg p-3 inline-block">
                          {gameState.currentForfeit.wordToAct}
                        </div>
                      </div>
                    )}
                    {isHostTurn && gameState.currentForfeit.type === 'shot' && (
                      <div className="mb-4 select-none">
                        <div className="mt-2 text-2xl text-yellow-300 p-3">
                          🥃 Shot time for {currentPlayer?.name}!
                        </div>
                      </div>
                    )}
                    {isHostTurn && gameState.currentForfeit.type === 'charade' ? (
                      <button
                        onClick={startCharade}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        Start Charade
                      </button>
                    ) : isHostTurn && gameState.currentForfeit.type === 'shot' ? (
                      <button
                        onClick={startCharade}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        I'll Take a Shot!
                      </button>
                    ) : (
                      <p className="text-white/70">
                        {gameState.currentForfeit.type === 'charade' 
                          ? `Waiting for ${currentPlayer.name} to start the charade...`
                          : `Waiting for ${currentPlayer.name} to take a shot...`
                        }
                      </p>
                    )}
                  </div>
                )}
                
                {gameState.gamePhase === 'charade_guessing' && (
                  <div className="mt-2 text-left bg-white/10 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/80">Charade in progress</span>
                      <span className="text-white/60 text-sm">
                        {(() => {
                          const now = Date.now();
                          const dl = charadeDeadline ?? now;
                          const remaining = Math.max(0, dl - now);
                          const secs = Math.floor(remaining / 1000);
                          const mm = Math.floor(secs / 60);
                          const ss = String(secs % 60).padStart(2, '0');
                          return `${mm}:${ss}`;
                        })()}
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
            {gameState.players
              .sort((a, b) => b.score - a.score)
              .map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    player.id === currentPlayer.id
                      ? 'bg-blue-600/30 border border-blue-400/50'
                      : player.isEliminated
                      ? 'bg-red-900/30 opacity-60'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{player.avatar}</span>
                    <div>
                      <div className={`font-bold ${player.isEliminated ? 'line-through text-white/60' : 'text-white'}`}>
                        {player.name}
                        {player.isHost && <span className="ml-2 text-xs bg-yellow-500/50 px-2 py-1 rounded">Host</span>}
                      </div>
                      <div className="flex mt-1">
                        <span className="text-yellow-400 text-xs mr-3">Score: {player.score}</span>
                        <span className="text-red-400 text-xs">Lives: {player.lives}</span>
                      </div>
                    </div>
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
