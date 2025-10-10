import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, Question, AnswerResult } from '../types/game';
import { Dice6, Clock, Trophy, Star } from 'lucide-react';
import { questionCategories } from '../data/questions';

interface PlayerInterfaceProps {
  socket: Socket;
  gameState: GameState;
  playerId: string;
  currentQuestion: Question | null;
  lastDiceRoll: number | null;
  answerResult: AnswerResult | null;
}

const PlayerInterface: React.FC<PlayerInterfaceProps> = ({
  socket,
  gameState,
  playerId,
  currentQuestion,
  lastDiceRoll,
  answerResult
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  const player = gameState.players.find(p => p.id === playerId);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  const rollDice = () => {
    if (!isMyTurn || gameState.gamePhase !== 'category_selection') return;
  console.log('Player rolling dice', { roomId: gameState.id, playerId });
    socket.emit('roll-dice', gameState.id, playerId);
  };

  const submitAnswer = (answerIndex: number) => {
    if (!isMyTurn || !currentQuestion) return;
    setSelectedAnswer(answerIndex);
  console.log('Submitting answer', { roomId: gameState.id, playerId, answerIndex });
    socket.emit('submit-answer', gameState.id, playerId, answerIndex);
  };

  // Reset selection and timer when a new question appears or on next turn
  useEffect(() => {
    if (currentQuestion && gameState.gamePhase === 'question') {
      setSelectedAnswer(null);
      setTimeLeft(30);
    }
  }, [currentQuestion, gameState.gamePhase]);

  // Countdown timer while a question is active on my turn
  useEffect(() => {
    if (!currentQuestion || !isMyTurn || gameState.gamePhase !== 'question') return;
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [currentQuestion, isMyTurn, gameState.gamePhase, timeLeft]);

  if (!player) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Player Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 text-center">
          <div className="text-6xl mb-2">{player.avatar}</div>
          <h1 className="text-2xl font-bold text-white mb-1">{player.name}</h1>
          <div className="flex justify-center items-center space-x-4">
            <div className="flex items-center text-yellow-400">
              <Star className="w-5 h-5 mr-1" />
              <span className="font-bold">{Object.values(player.categoryScores).reduce((sum, score) => sum + score, 0)}</span>
            </div>
            <div className="text-white/60">
              Position: {[...gameState.players].sort((a, b) => 
                Object.values(b.categoryScores).reduce((sum, score) => sum + score, 0) - 
                Object.values(a.categoryScores).reduce((sum, score) => sum + score, 0)
              ).findIndex(p => p.id === playerId) + 1}
            </div>
          </div>
          {/* Power Bar - Made more prominent */}
          <div className="mt-6 p-4 bg-gradient-to-r from-red-500/20 to-green-500/20 rounded-xl border border-white/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-bold text-lg">⚡ Power Bar</span>
              <span className="text-white font-bold text-lg">{player.powerBar ?? 50}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-green-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${player.powerBar ?? 50}%` }}
              ></div>
            </div>
            {player.hasSabotage && (
              <div className="text-center">
                <span className="text-red-400 font-bold text-sm animate-pulse">⚡ SABOTAGE READY ⚡</span>
              </div>
            )}
          </div>
        </div>

        {/* Sabotage Controls */}
        {player.hasSabotage && (gameState.gamePhase === 'category_selection' || gameState.gamePhase === 'question') && (
          <div className="bg-red-900/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-red-400/30">
            <h3 className="text-xl font-bold text-red-400 mb-4 text-center">⚡ SABOTAGE CONTROLS ⚡</h3>
            <div className="space-y-2">
              {gameState.players
                    .filter(p => p.id !== playerId && !p.isEliminated)
                    .map(target => (
                      <button
                        key={target.id}
                        onClick={() => {
                          socket.emit('sabotage-player', gameState.id, playerId, target.id);
                        }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    🎯 Sabotage {target.name}
                  </button>
                ))}
            </div>
          </div>
        )}

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
        <h2 className="text-lg font-bold text-white mb-2">Collect 5 in EACH category to win</h2>
                {isMyTurn ? (
                  <div>
                    <p className="text-green-400 font-bold mb-4">Your turn!</p>
                    <button
                      onClick={rollDice}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-colors flex items-center justify-center mx-auto transform hover:scale-105"
                    >
                      <Dice6 className="mr-2 w-6 h-6" />
                      Roll Dice
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-white/80 mb-2">Current player:</p>
                    <p className="font-bold text-yellow-400">
                      {currentPlayer?.avatar} {currentPlayer?.name}
                    </p>
                  </div>
                )}

                {lastDiceRoll && isMyTurn && (
                  <div className="mt-4 p-3 bg-yellow-600/20 rounded-xl">
                    <p className="text-yellow-300 font-bold">🎲 You rolled: {lastDiceRoll}</p>
                  </div>
                )}
              </div>
            )}

            {gameState.gamePhase === 'finished' && gameState.winner && (
              <div>
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
                <div className="text-center">
                  {gameState.winner.id === playerId ? (
                    <p className="text-green-400 text-xl font-bold">🎉 You won! 🎉</p>
                  ) : (
                    <div>
                      <p className="text-white mb-2">Winner:</p>
                      <p className="text-yellow-400 font-bold">
                        {gameState.winner.avatar} {gameState.winner.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Interface - This is now handled by the QuestionOverlay */}
        {/* {currentQuestion && isMyTurn && gameState.gamePhase === 'question' && (
          ...
        )} */}

        {/* Question (view-only) when it's not your turn */}
        {currentQuestion && !isMyTurn && gameState.gamePhase === 'question' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{currentQuestion.category}</h3>
              <div className="text-white/60">Waiting for {currentPlayer?.name}...</div>
            </div>
            <p className="text-white text-lg mb-6">{currentQuestion.question}</p>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  disabled
                  className="w-full p-4 rounded-xl font-bold bg-white/10 text-white cursor-not-allowed opacity-60"
                >
                  <span className="mr-3 text-yellow-400">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-white">
                {answerResult.isCorrect 
                  ? `Correct answer!` 
                  : `Correct answer was: ${String.fromCharCode(65 + answerResult.correctAnswer)}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Power Bars Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            ⚡ Power Bars
          </h2>
          <div className="space-y-3">
            {gameState.players
              .filter(p => !p.isEliminated)
              .sort((a, b) => (b.powerBar ?? 50) - (a.powerBar ?? 50))
              .map((p) => (
                <div key={p.id} className={`p-3 rounded-xl ${p.id === playerId ? 'bg-blue-600/30 border border-blue-400/50' : 'bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{p.avatar}</span>
                      <span className={`font-bold ${p.id === playerId ? 'text-blue-300' : 'text-white'}`}>
                        {p.name}
                        {p.id === playerId && <span className="ml-2 text-xs">(You)</span>}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/80 text-sm">{p.powerBar || 50}%</span>
                      {p.hasSabotage && <span className="text-red-400 text-lg">⚡</span>}
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${p.powerBar || 50}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Trophy className="mr-2" />
            Leaderboard
          </h2>
          {/* Category progress row for me */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {questionCategories.map((cat) => {
              const cur = player.categoryScores?.[cat] ?? 0;
              return (
                <div key={cat} className="bg-white/10 rounded-lg px-2 py-1 flex items-center justify-between">
                  <span className="text-white/80 text-xs">{cat}</span>
                  <span className={`text-xs font-bold ${cur >= 5 ? 'text-green-400' : 'text-yellow-300'}`}>{cur}/5</span>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {[...gameState.players]
              .sort((a, b) => 
                Object.values(b.categoryScores).reduce((sum, score) => sum + score, 0) - 
                Object.values(a.categoryScores).reduce((sum, score) => sum + score, 0)
              )
              .map((p, index) => (
                <div key={p.id} 
                     className={`p-3 rounded-xl ${
                       p.id === playerId ? 'bg-blue-600/30 border border-blue-400/50' : 'bg-white/5'
                     }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400 font-bold">#{index + 1}</span>
                      <span className="text-xl">{p.avatar}</span>
                      <span className="text-white font-bold">{p.name}</span>
                    </div>
                    <span className="text-yellow-400 font-bold">{Object.values(p.categoryScores).reduce((sum, score) => sum + score, 0)}</span>
                  </div>
                  {/* Power Bar for each player */}
                  <div className="flex items-center space-2">
                    <span className="text-white/60 text-xs">Power:</span>
                    <div className="flex-1 bg-white/20 rounded-full h-2 mx-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${p.powerBar ?? 50}%` }}
                      ></div>
                    </div>
                    <span className="text-white/60 text-xs">{p.powerBar ?? 50}%</span>
                    {p.hasSabotage && <span className="text-red-400 text-xs">⚡</span>}
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