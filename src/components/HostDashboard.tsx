import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, BoardSquare, ChanceEvent, AnswerResult } from '../types/game';
import { Users, Play, Trophy, Dice6 } from 'lucide-react';
import { MAX_PLAYERS } from '../utils/gameLogic';
import GameBoard from './GameBoard';
import QRCodeDisplay from './QRCodeDisplay';
import { questionCategories } from '../data/questions';

interface HostDashboardProps {
  socket: Socket;
  gameState: GameState;
  board: BoardSquare[];
  roomCode: string;
  lastDiceRoll: number | null;
  lastChanceEvent: ChanceEvent | null;
  answerResult: AnswerResult | null;
}

const HostDashboard: React.FC<HostDashboardProps> = ({
  socket,
  gameState,
  board,
  roomCode,
  lastDiceRoll,
  lastChanceEvent,
  answerResult
}) => {
  // For new game button, just reload to welcome
  const startNewGame = () => {
    localStorage.clear();
    window.location.href = '/';
  };
  const [showQR, setShowQR] = useState(true);

  const startGame = () => {
    socket.emit('start-game', roomCode);
    setShowQR(false);
  };

  const rollDiceForCurrentPlayer = () => {
    if (gameState.gamePhase !== 'playing') return;
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current) return;
    socket.emit('roll-dice', roomCode, current.id);
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="text-yellow-400 w-8 h-8" />
              <h1 className="text-3xl font-bold text-white">Trivia Master</h1>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Room Code</p>
              <p className="text-2xl font-mono font-bold text-yellow-400">{roomCode}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Dice6 className="mr-2" />
                Game Board
              </h2>
              <GameBoard 
                board={board} 
                players={gameState.players} 
                currentPlayerIndex={gameState.currentPlayerIndex}
              />
              
              {/* Game Status */}
              {gameState.gamePhase === 'playing' && (
                <div className="mt-4 p-4 bg-white/10 rounded-xl">
                  <p className="text-white text-center">
                    <span className="font-bold" style={{ color: currentPlayer.color }}>
                      {currentPlayer.avatar} {currentPlayer.name}
                    </span>
                    's turn
                  </p>
                  <p className="text-white/70 text-center text-sm mt-1">Goal: collect 5 correct answers in EACH category to win.</p>
                  {lastDiceRoll && (
                    <p className="text-center text-yellow-400 font-bold mt-2">
                      🎲 Rolled: {lastDiceRoll}
                    </p>
                  )}
                </div>
              )}

              {/* Question Display */}
              {gameState.currentQuestion && (
                <div className="mt-4 p-6 bg-blue-600/20 rounded-xl border border-blue-400/30">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {gameState.currentQuestion.category} Question
                  </h3>
                  <p className="text-white mb-4">{gameState.currentQuestion.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.currentQuestion.options.map((option, index) => {
                      const isHostTurn = currentPlayer?.isHost && gameState.gamePhase === 'question';
                      if (isHostTurn) {
                        return (
                          <button
                            key={index}
                            onClick={() => socket.emit('submit-answer', roomCode, currentPlayer.id, index)}
                            className="p-3 rounded-lg text-white text-sm bg-blue-600/40 hover:bg-blue-600/60 font-bold"
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </button>
                        );
                      }
                      return (
                        <div key={index} className="p-2 bg-white/10 rounded-lg text-white text-sm">
                          {String.fromCharCode(65 + index)}. {option}
                        </div>
                      );
                    })}
                  </div>
                  {currentPlayer?.isHost && (
                    <p className="text-white/70 text-xs mt-2">As host and current player, you can answer here.</p>
                  )}
                </div>
              )}

              {/* Chance Event Display */}
              {lastChanceEvent && (
                <div className="mt-4 p-4 bg-orange-600/20 rounded-xl border border-orange-400/30">
                  <h3 className="text-lg font-bold text-orange-300 mb-2">Chance Event!</h3>
                  <p className="text-white">{lastChanceEvent.description}</p>
                </div>
              )}

              {/* Answer Result */}
              {answerResult && (
                <div className={`mt-4 p-4 rounded-xl ${answerResult.isCorrect ? 'bg-green-600/20 border-green-400/30' : 'bg-red-600/20 border-red-400/30'}`}>
                  <p className={`font-bold ${answerResult.isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                    {answerResult.isCorrect ? '✅ Correct!' : '❌ Incorrect!'}
                  </p>
                  <p className="text-white">
                    {answerResult.isCorrect ? `+${answerResult.points} points!` : `Correct answer was: ${String.fromCharCode(65 + answerResult.correctAnswer)}`}
                  </p>
                  {answerResult.isCorrect && answerResult.categoryLockMessage && (
                    <div className="mt-3 bg-blue-600/20 border border-blue-400/30 rounded-lg p-3">
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
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* QR Code */}
            {showQR && gameState.gamePhase === 'waiting' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 text-center">Join Game</h2>
                <QRCodeDisplay roomCode={roomCode} />
                <p className="text-white/80 text-center mt-4 text-sm">
                  Players scan this QR code or enter room code to join
                </p>
              </div>
            )}

            {/* Players Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Users className="mr-2" />
                Players ({gameState.players.length}/{MAX_PLAYERS})
              </h2>
              <div className="space-y-3">
                {gameState.players.map((player, index) => (
                  <div key={player.id} 
                       className={`p-3 rounded-xl transition-all ${
                         index === gameState.currentPlayerIndex ? 'bg-white/20 border border-yellow-400/50' : 'bg-white/5'
                       }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{player.avatar}</span>
                        <div>
                          <p className="font-bold text-white">{player.name}</p>
                          <p className="text-white/60 text-sm">Position: {player.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400">{player.score}</p>
                        <p className="text-white/60 text-xs">points</p>
                      </div>
                    </div>
                    {/* Category progress */}
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Game Controls</h2>
              
              {gameState.gamePhase === 'waiting' && (
                <button
                  onClick={startGame}
                  disabled={gameState.players.length < 2}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Start Game
                </button>
              )}

              {/* Dev-only helper: allow force start with 1 player */}
              {Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) && gameState.gamePhase === 'waiting' && gameState.players.length < 2 && (
                <button
                  onClick={startGame}
                  className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Force Start (dev)
                </button>
              )}

              {gameState.gamePhase === 'playing' && (
                <button
                  onClick={rollDiceForCurrentPlayer}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  <Dice6 className="mr-2 w-5 h-5" />
                  Roll Dice for {currentPlayer?.name}
                </button>
              )}

            {gameState.gamePhase === 'finished' && gameState.winner && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-2">Winner!</h3>
                  <p className="text-white text-lg">
                    {gameState.winner.avatar} {gameState.winner.name}
                  </p>
          <p className="text-white/80">Collected 5 in each category!</p>
                <button
                  onClick={startNewGame}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Start New Game
                </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;