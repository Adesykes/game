import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameEvents } from './hooks/useGameEvents';
import type { Socket } from 'socket.io-client';
import WelcomeScreen from './components/WelcomeScreen';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import HostDashboard from './components/NewHostDashboard';
import PlayerInterface from './components/NewPlayerInterface';
import { GameState } from './types/game';

type AppMode = 'welcome' | 'create' | 'join' | 'host' | 'player';

function App() {
  const { socket, connected } = useSocket();
  const [mode, setMode] = useState<AppMode>('welcome');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { currentQuestion, answerResult, charadeDeadline, pictionaryDeadline } = useGameEvents(socket, setGameState);
  
  // Check if we landed on a join URL from a QR code
  useEffect(() => {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    
    // Check if the URL is in the format /join/ROOMCODE
    if (pathParts.length >= 3 && pathParts[1].toLowerCase() === 'join') {
      const joinRoomCode = pathParts[2].toUpperCase();
      if (joinRoomCode && joinRoomCode.length > 0) {
        setRoomCode(joinRoomCode);
        setMode('join');
      }
    }
  }, []);

  const handleCreateSuccess = (newRoomCode: string, newGameState: GameState) => {
    setRoomCode(newRoomCode);
    setGameState(newGameState);
    setMode('host');
  };

  const handleJoinSuccess = (newRoomCode: string, newPlayerId: string, newGameState: GameState) => {
    setRoomCode(newRoomCode);
    setPlayerId(newPlayerId);
    setGameState(newGameState);
    setMode('player');
  };

  const renderContent = () => {
    switch (mode) {
      case 'create':
        return <CreateGame socket={socket as Socket} onCreateSuccess={handleCreateSuccess} />;
      case 'join':
        return <JoinGame socket={socket as Socket} onJoinSuccess={handleJoinSuccess} initialRoomCode={roomCode} />;
      case 'host':
        return (
          gameState && <HostDashboard
            socket={socket as Socket}
            gameState={gameState}
            roomCode={roomCode}
            charadeDeadline={charadeDeadline}
            pictionaryDeadline={pictionaryDeadline}
          />
        );
      case 'player':
        return (
          gameState && <PlayerInterface
            socket={socket as Socket}
            gameState={gameState}
            answerResult={answerResult}
            currentQuestion={currentQuestion}
            playerId={playerId}
            charadeDeadline={charadeDeadline}
            pictionaryDeadline={pictionaryDeadline}
          />
        );
      default:
        return <WelcomeScreen onModeSelect={setMode} />;
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white">
        <div className="text-2xl">Connecting to server...</div>
      </div>
    );
  }

  return (
    <>
      {renderContent()}
    </>
  );
}

export default App;