import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { Users, QrCode, Hash } from 'lucide-react';

interface JoinGameProps {
  socket: Socket;
  onJoinSuccess: (roomCode: string, playerId: string, gameState: GameState) => void;
  initialRoomCode?: string;
}

const JoinGame: React.FC<JoinGameProps> = ({ socket, onJoinSuccess, initialRoomCode = '' }) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) {
      setError('Please enter both your name and room code');
      return;
    }
    if (!socket) {
      setError('No connection to server. Please refresh the page and try again.');
      return;
    }
    setIsJoining(true);
    setError('');
    const timeout = setTimeout(() => {
      setIsJoining(false);
      setError('Server did not respond. Please check your connection and try again.');
    }, 10000);
    const storedPlayerId = localStorage.getItem(`playerId:${roomCode.trim().toUpperCase()}`);
    if (storedPlayerId) {
      // Try rejoin-room for reconnects
      console.log(`[JoinGame] Attempting rejoin-room for playerId=${storedPlayerId} in room ${roomCode.trim().toUpperCase()}`);
      socket.emit('rejoin-room', roomCode.trim().toUpperCase(), storedPlayerId, (response: { success: boolean; roomCode?: string; playerId?: string; gameState?: GameState; error?: string; }) => {
        console.log('[JoinGame] rejoin-room response:', response);
        clearTimeout(timeout);
        setIsJoining(false);
        if (response?.success) {
          localStorage.setItem('playerName', playerName.trim());
          onJoinSuccess(response.roomCode ?? roomCode.trim().toUpperCase(), response.playerId!, response.gameState!);
        } else {
          setError('[Reconnect] ' + (response?.error ?? 'Failed to rejoin room. Try again or contact host.'));
        }
      });
    } else {
      // New join
      console.log(`[JoinGame] Attempting join-room for ${playerName.trim()} in room ${roomCode.trim().toUpperCase()}`);
      socket.emit('join-room', roomCode.trim().toUpperCase(), playerName.trim(), (response: { success: boolean; roomCode?: string; playerId?: string; gameState?: GameState; error?: string; }) => {
        console.log('[JoinGame] join-room response:', response);
        clearTimeout(timeout);
        setIsJoining(false);
        if (response?.success) {
          localStorage.setItem('playerName', playerName.trim());
          // Store playerId for future reconnects
          localStorage.setItem(`playerId:${roomCode.trim().toUpperCase()}`, response.playerId!);
          onJoinSuccess(response.roomCode ?? roomCode.trim().toUpperCase(), response.playerId!, response.gameState!);
        } else {
          setError('[Join] ' + (response?.error ?? 'Failed to join room. Please check the room code and try again.'));
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Game</h1>
          <p className="text-white/80">Enter your details to join the trivia game</p>
        </div>

        <form onSubmit={joinRoom} className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">Your Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/10 border border-white/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                maxLength={20}
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-bold mb-2">Room Code</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="w-full bg-white/10 border border-white/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono"
                maxLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-400/50 rounded-xl p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || !playerName.trim() || !roomCode.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
          >
            {isJoining ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Users className="mr-2 w-5 h-5" />
                Join Game
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/20 text-center">
          <p className="text-white/60 text-sm flex items-center justify-center">
            <QrCode className="w-4 h-4 mr-1" />
            Or scan the QR code shown by the host
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;