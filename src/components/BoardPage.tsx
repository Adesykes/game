import React from 'react';
import { GameState, Question, AnswerResult } from '../types/game';
import type { Socket } from 'socket.io-client';
import HostDashboard from './NewHostDashboard';
import NewPlayerInterface from './NewPlayerInterface'; // Using the new player interface

interface BoardPageProps {
  socket: Socket;
  gameState: GameState | null;
  mode: 'host' | 'player' | 'spectator';
  roomCode: string;
  answerResult: AnswerResult | null;
  currentQuestion: Question | null;
  playerId: string;
}

const BoardPage: React.FC<BoardPageProps> = (props) => {
  const { gameState, mode, currentQuestion, playerId } = props;

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white">
        <div className="text-2xl">Loading game...</div>
      </div>
    );
  }

  const isHost = mode === 'host';

  return (
    <div className="relative min-h-screen">
      {/* UI for Host/Player */}
      {isHost ? (
        <HostDashboard
          socket={props.socket}
          gameState={gameState}
          roomCode={props.roomCode}
          answerResult={props.answerResult}
        />
      ) : (
        <NewPlayerInterface
          socket={props.socket}
          gameState={gameState}
          playerId={playerId}
          currentQuestion={currentQuestion}
          answerResult={props.answerResult}
        />
      )}
    </div>
  );
};

export default BoardPage;
