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
    if (!isMyTurn || gameState.gamePhase !== 'playing') return;
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
              <span className="font-bold">{player.score}</span>
            </div>
            <div className="text-white/60">
              Position: {player.position}
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

      {gameState.gamePhase === 'playing' && (
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
                  ? `You earned ${answerResult.points} points!` 
                  : `Correct answer was: ${String.fromCharCode(65 + answerResult.correctAnswer)}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Trophy className="mr-2" />
            Leaderboard
          </h2>
          {/* Category progress row for me */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {questionCategories.map((cat) => {
              const cur = player.categoryProgress?.[cat] ?? 0;
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
              .sort((a, b) => b.score - a.score)
              .map((p, index) => (
                <div key={p.id} 
                     className={`flex items-center justify-between p-3 rounded-xl ${
                       p.id === playerId ? 'bg-blue-600/30 border border-blue-400/50' : 'bg-white/5'
                     }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400 font-bold">#{index + 1}</span>
                    <span className="text-xl">{p.avatar}</span>
                    <span className="text-white font-bold">{p.name}</span>
                  </div>
                  <span className="text-yellow-400 font-bold">{p.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerInterface;