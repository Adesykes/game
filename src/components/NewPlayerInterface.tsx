import React, { useState, useEffect } from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import { Socket } from 'socket.io-client';
import { GameState, Question, AnswerResult } from '../types/game';
import { Star, Heart, Clock, AlertTriangle } from 'lucide-react';
import { questionCategories } from '../data/questions';

interface PlayerInterfaceProps {
  socket: Socket;
  gameState: GameState;
  playerId: string;
  currentQuestion: Question | null;
  answerResult: AnswerResult | null;
  charadeDeadline?: number | null;
}

const PlayerInterface: React.FC<PlayerInterfaceProps> = ({
  socket,
  gameState,
  playerId,
  currentQuestion,
  answerResult,
  charadeDeadline,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [charadeTimeLeft, setCharadeTimeLeft] = useState(120);

  // Add null checks to prevent errors
  const player = gameState?.players?.find(p => p.id === playerId);
  const currentPlayer = gameState?.players?.[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const isEliminated = player?.isEliminated || false;
  
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

  // Keep screen awake during active phases
  const wakeActive = ['category_selection', 'question', 'forfeit', 'charade_guessing'].includes(gameState.gamePhase);
  useWakeLock(wakeActive);

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

  const selectCategory = (category: string) => {
    console.log(`Attempting to select category: ${category}`);
    console.log(`Is my turn: ${isMyTurn}, Game phase: ${gameState.gamePhase}`);
    console.log(`Current player: ${JSON.stringify(currentPlayer)}, My ID: ${playerId}`);
    if (!isMyTurn) {
      console.log('Cannot select category - not your turn');
      return;
    }
    if (gameState.gamePhase !== 'category_selection') {
      console.log(`Wrong game phase: ${gameState.gamePhase}`);
      return;
    }
    console.log(`Emitting select-category: gameId=${gameState.id}, playerId=${playerId}, category=${category}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Player Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 text-center">
          <div className="text-6xl mb-2">{player.avatar}</div>
          <h1 className="text-2xl font-bold text-white mb-1">{player.name}</h1>
          <div className="flex justify-center items-center space-x-6">
            <div className="flex items-center text-yellow-400">
              <Star className="w-5 h-5 mr-1" />
              <span className="font-bold">{player.score}</span>
            </div>
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
                <h2 className="text-xl font-bold text-white mb-2">Waiting for players...</h2>
                <p className="text-white/80">Room: {gameState.id}</p>
              </div>
            )}

            {gameState.gamePhase === 'category_selection' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {isMyTurn ? 'Choose a category' : `${currentPlayer.name} is choosing a category`}
                </h2>
                
                {isMyTurn && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {questionCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => selectCategory(category)}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl font-medium transition-colors text-sm"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {gameState.gamePhase === 'question' && currentQuestion && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{currentQuestion.category}</h3>
                  {isMyTurn && (
                    <div className="flex items-center text-yellow-400">
                      <Clock className="w-5 h-5 mr-1" />
                      <span className="font-bold">{timeLeft}s</span>
                    </div>
                  )}
                </div>
                
                <p className="text-white text-lg mb-6">{currentQuestion.question}</p>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => isMyTurn && submitAnswer(index)}
                      disabled={!isMyTurn || selectedAnswer !== null}
                      className={`w-full p-4 rounded-xl font-bold transition-all ${
                        selectedAnswer === index 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      } ${!isMyTurn || selectedAnswer !== null ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="mr-3 text-yellow-400">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {gameState.gamePhase === 'forfeit' && gameState.currentForfeit && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {isMyTurn ? 'Your Forfeit' : `${currentPlayer.name}'s Forfeit`}
                </h2>
                <div className={`${gameState.currentForfeit.type === 'shot' ? 'bg-amber-500/30 border-amber-500/50' : 'bg-red-500/20 border-red-500/40'} p-4 rounded-xl mb-4 border`}>
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
                <p className="text-white">You earned a point in this category!</p>
              ) : (
                <p className="text-white">You'll have to do a forfeit!</p>
              )}
            </div>
          </div>
        )}

        {/* Player Scores */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Players</h2>
          <div className="space-y-3">
            {gameState.players
              .sort((a, b) => b.score - a.score)
              .map((p) => (
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
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="font-bold">{p.score}</span>
                    </div>
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
