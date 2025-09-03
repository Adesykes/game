import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Trophy, Users, Play } from 'lucide-react';
import { GameState, BoardSquare } from '../types/game';

interface CreateGameProps {
  socket: Socket;
  onCreateSuccess: (roomCode: string, gameState: GameState, board: BoardSquare[]) => void;
}

const CreateGame: React.FC<CreateGameProps> = ({ socket, onCreateSuccess }) => {
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  console.log('CreateGame component rendered, socket connected:', socket?.connected);
  console.log('Socket ID:', socket?.id);

  const createRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) return;

    console.log('Create room button clicked');
    console.log('Socket connected:', socket.connected);
    console.log('Socket ID:', socket.id);

    if (!socket.connected) {
      console.error('Socket not connected!');
      alert('Not connected to game server. Please refresh the page.');
      return;
    }

    setIsCreating(true);
    console.log('Attempting to create room with host:', hostName);

  socket.emit('create-room', hostName.trim(), (response: { success: boolean; roomCode?: string; gameState?: GameState; board?: BoardSquare[]; error?: string; }) => {
      console.log('Create room response:', response);
      setIsCreating(false);
      
      if (response.success) {
        console.log('Room created successfully:', response.roomCode);
  onCreateSuccess(response.roomCode!, response.gameState!, response.board!);
      } else {
  console.error('Room creation failed:', response.error ?? 'Unknown error');
  alert('Failed to create room: ' + (response.error ?? 'Unknown error'));
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-white mb-2">Host Game</h1>
          <p className="text-white/80">Create a new trivia game room</p>
        </div>

        <form onSubmit={createRoom} className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">Host Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/10 border border-white/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                maxLength={20}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating || !hostName.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Trophy className="mr-2 w-5 h-5" />
                Create Game
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="text-center space-y-2">
            <p className="text-white/80 text-sm">Game Features:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                Up to 6 players
              </div>
              <div className="flex items-center">
                <Trophy className="w-3 h-3 mr-1" />
                500+ questions
              </div>
              <div className="flex items-center">
                <Play className="w-3 h-3 mr-1" />
                Real-time play
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                No login needed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGame;