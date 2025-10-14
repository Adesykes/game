import { useState, useEffect, useRef, useCallback } from 'react';
// Import audio asset (ensures bundling for all clients)
// Adjust relative path if mp3 folder moves to /public or /src/assets
// @ts-ignore - module declaration added in vite-env.d.ts
import lobbyTrack from '../mp3/soulsweeper-252499.mp3';
// @ts-ignore - module declaration added in vite-env.d.ts
import dramaticTrack from '../mp3/dramatic-orchestral-cinematic-epic-background-music-313429.mp3';
import { useSocket } from './hooks/useSocket';
import { useGameEvents } from './hooks/useGameEvents';
import { useFullScreen } from './hooks/useFullScreen';
import type { Socket } from 'socket.io-client';
import WelcomeScreen from './components/WelcomeScreen';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import HostDashboard from './components/NewHostDashboard';
import ReadyScreen from './components/ReadyScreen';
import PlayerInterface from './components/NewPlayerInterface';
import KaraokeBreak from './components/KaraokeBreak';
import QuestionOverlay from './components/QuestionOverlay';
import ResultBanner from './components/ResultBanner';
import RoundBanner from './components/RoundBanner';
import { GameState } from './types/game';

type AppMode = 'welcome' | 'create' | 'join' | 'host' | 'player';

function App() {
  const { socket, connected } = useSocket();
  const { enterFullScreen } = useFullScreen();
  const [mode, setMode] = useState<AppMode>('welcome');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { currentQuestion, answerResult, charadeDeadline, pictionaryDeadline, questionDeadline, lightningCountdownEndAt, forfeitResult, forfeitFailureResult, guessResult, lightningNoWinnerMessage, sabotageResult, setAnswerResult, setForfeitResult, setForfeitFailureResult, setGuessResult, setLightningNoWinnerMessage, setSabotageResult } = useGameEvents(socket, setGameState);
  
  // Memoize onClose handler to prevent ResultBanner effects from re-running
  // Memoize onClose handler to prevent ResultBanner effects from re-running
  const handleBannerClose = useCallback(() => {
    // Could add additional cleanup logic here if needed
  }, []);

  // Handle clearing specific result types
  const handleResultClear = useCallback((type: 'answer' | 'forfeit' | 'forfeitFailure' | 'guess' | 'lightning') => {
    switch (type) {
      case 'answer':
        setAnswerResult(null);
        break;
      case 'forfeit':
        setForfeitResult(null);
        break;
      case 'forfeitFailure':
        setForfeitFailureResult(null);
        break;
      case 'guess':
        setGuessResult(null);
        break;
      case 'lightning':
        setLightningNoWinnerMessage(null);
        break;
    }
  }, []);
  // Also support sabotage clears without widening the public prop types across app
  const handleResultClearWithSabotage = useCallback((type: 'answer' | 'forfeit' | 'forfeitFailure' | 'guess' | 'lightning' | 'sabotage') => {
    if (type === 'sabotage') {
      setSabotageResult(null);
      return;
    }
    handleResultClear(type);
  }, [handleResultClear, setSabotageResult]);
  // Global background music only during waiting / ready phases (all clients)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  // Dramatic music for lightning rounds
  const dramaticAudioRef = useRef<HTMLAudioElement | null>(null);
  const [showRoundBanner, setShowRoundBanner] = useState<{ round: number; cyclesPerRound: number; cycleInRound: number } | null>(null);
  const [lastRoundBannerShown, setLastRoundBannerShown] = useState<number | null>(null);

  // Create element once
  useEffect(() => {
    if (!bgAudioRef.current) {
      const el = new Audio(lobbyTrack);
      el.loop = true;
      el.volume = 0.25;
      el.preload = 'auto';
      bgAudioRef.current = el;
    }
    if (!dramaticAudioRef.current) {
      const el = new Audio(dramaticTrack);
      el.loop = true;
      el.volume = 0.4; // Slightly louder for dramatic effect
      el.preload = 'auto';
      dramaticAudioRef.current = el;
    }
  }, []);

  // Explicit lobby music stop signal from server
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      const audio = bgAudioRef.current;
      if (!audio) return;
      // Fade out over 600ms
      const fadeSteps = 12;
      const startVol = audio.volume;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const v = startVol * (1 - step / fadeSteps);
        audio.volume = Math.max(0, v);
        if (step >= fadeSteps) {
          clearInterval(interval);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = startVol; // reset for next lobby
        }
      }, 50);
    };
    socket.on('lobby-music-stop', handler);
    return () => { socket.off('lobby-music-stop', handler); };
  }, [socket]);

  // Show round banners when server announces or on first entry into category_selection
  useEffect(() => {
    if (!socket) return;
    const onRoundStart = (data: { gameState: GameState; round: number; cyclesPerRound?: number }) => {
      setGameState(data.gameState);
      // Only show once per round
      setLastRoundBannerShown(prev => {
        if (prev === data.round) return prev;
        setShowRoundBanner({ round: data.round, cyclesPerRound: data.cyclesPerRound ?? (data.gameState.cyclesPerRound || 1), cycleInRound: data.gameState.cycleInRound || 0 });
        return data.round;
      });
    };
    socket.on('round-start', onRoundStart);
    return () => { socket.off('round-start', onRoundStart); };
  }, [socket]);

  // Also detect the start of round 1 when we first switch into category_selection
  useEffect(() => {
    if (!gameState) return;
    if (gameState.round === 1 && gameState.gamePhase === 'category_selection' && lastRoundBannerShown !== 1) {
      setShowRoundBanner({ round: 1, cyclesPerRound: gameState.cyclesPerRound || 2, cycleInRound: gameState.cycleInRound || 0 });
      setLastRoundBannerShown(1);
    }
  }, [gameState, lastRoundBannerShown]);

  // Dramatic music start/stop for lightning rounds
  useEffect(() => {
    if (!socket) return;
    const startHandler = () => {
      const audio = dramaticAudioRef.current;
      if (!audio) return;
      // Stop lobby music if playing
      const lobbyAudio = bgAudioRef.current;
      if (lobbyAudio && !lobbyAudio.paused) {
        lobbyAudio.pause();
        lobbyAudio.currentTime = 0;
      }
      // Play dramatic music
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('Failed to play dramatic music:', e));
    };
    const stopHandler = () => {
      const audio = dramaticAudioRef.current;
      if (!audio) return;
      // Fade out over 600ms
      const fadeSteps = 12;
      const startVol = audio.volume;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const v = startVol * (1 - step / fadeSteps);
        audio.volume = Math.max(0, v);
        if (step >= fadeSteps) {
          clearInterval(interval);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = startVol; // reset for next time
        }
      }, 50);
    };
    socket.on('dramatic-music-start', startHandler);
    socket.on('dramatic-music-stop', stopHandler);
    return () => {
      socket.off('dramatic-music-start', startHandler);
      socket.off('dramatic-music-stop', stopHandler);
    };
  }, [socket]);

  const shouldPlay = (
    mode === 'welcome' || mode === 'create' || mode === 'join' ||
    (mode === 'host' && (gameState?.gamePhase === 'waiting' || gameState?.gamePhase === 'ready_check')) ||
    (mode === 'player' && (gameState?.gamePhase === 'waiting' || gameState?.gamePhase === 'ready_check'))
  );

  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    let interactionBound = false;

    const gesturePlay = () => {
      audio.play().finally(() => {
        window.removeEventListener('pointerdown', gesturePlay);
        window.removeEventListener('keydown', gesturePlay);
        window.removeEventListener('visibilitychange', visibilityAttempt);
      });
    };

    const visibilityAttempt = () => {
      if (document.visibilityState === 'visible' && shouldPlay && audio.paused) {
        audio.play().catch(() => {/* gesture still needed */});
      }
    };

    const attempt = () => {
      if (!shouldPlay) return;
      audio.play().catch(() => {
        if (!interactionBound) {
          interactionBound = true;
          window.addEventListener('pointerdown', gesturePlay, { once: true });
          window.addEventListener('keydown', gesturePlay, { once: true });
          window.addEventListener('visibilitychange', visibilityAttempt);
        }
      });
    };

    if (shouldPlay) {
      attempt();
    } else {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
      window.removeEventListener('pointerdown', gesturePlay);
      window.removeEventListener('keydown', gesturePlay);
      window.removeEventListener('visibilitychange', visibilityAttempt);
    }

    return () => {
      window.removeEventListener('pointerdown', gesturePlay);
      window.removeEventListener('keydown', gesturePlay);
      window.removeEventListener('visibilitychange', visibilityAttempt);
    };
  }, [shouldPlay]);

  // Start & sync handlers
  useEffect(() => {
    if (!socket) return;
    const handleStart = () => {
      const audio = bgAudioRef.current; if (!audio) return;
      audio.currentTime = 0; audio.play().catch(()=>{});
    };
    const handleSync = (data: { t: number; ts: number }) => {
      const audio = bgAudioRef.current; if (!audio) return;
      if (!shouldPlay) return; // only adjust while in lobby
      const hostTime = data.t;
      const diff = Math.abs(audio.currentTime - hostTime);
      if (diff > 0.35) {
        audio.currentTime = hostTime;
      }
    };
    socket.on('lobby-music-start', handleStart);
    socket.on('lobby-music-sync', handleSync);
    return () => {
      socket.off('lobby-music-start', handleStart);
      socket.off('lobby-music-sync', handleSync);
    };
  }, [socket, shouldPlay]);

  // Host periodically sends current playback time for sync
  useEffect(() => {
    if (!socket || !gameState) return;
    const hostPlayer = gameState.players.find(p => p.isHost);
    const isHostClient = hostPlayer && gameState.players.some(p => p.isHost && p.id === hostPlayer.id) && mode === 'host';
    if (!isHostClient) return;
    let interval: any;
    interval = setInterval(() => {
      const audio = bgAudioRef.current; if (!audio) return;
      if (shouldPlay && !audio.paused) {
        socket.emit('lobby-music-time', roomCode || gameState.id, audio.currentTime);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [socket, gameState, mode, shouldPlay, roomCode]);
  
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

  // Enter full screen when game starts
  useEffect(() => {
    if ((mode === 'host' || mode === 'player') && gameState && !document.fullscreenElement) {
      console.log('Entering full screen mode for game');
      enterFullScreen().catch(error => {
        console.log('Full screen request failed (this is normal on first load):', error.message);
      });
    }
  }, [mode, enterFullScreen]);

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
        return gameState && (
          gameState.gamePhase === 'ready_check' ? (
            <ReadyScreen socket={socket as Socket} gameState={gameState} playerId={gameState.players.find(p=>p.isHost)?.id || ''} roomCode={roomCode} />
          ) : (gameState.gamePhase === 'karaoke_break' || gameState.gamePhase === 'karaoke_voting') ? (
            <>
              <HostDashboard
                key={`host-karaoke-${gameState.currentQuestion?.id || 'none'}`}
                socket={socket as Socket}
                gameState={gameState}
                roomCode={roomCode}
                charadeDeadline={charadeDeadline}
                pictionaryDeadline={pictionaryDeadline}
                playerId={gameState.players.find(p=>p.isHost)?.id || ''}
                lightningCountdownEndAt={lightningCountdownEndAt}
                answerResult={answerResult}
                forfeitResult={forfeitResult}
                forfeitFailureResult={forfeitFailureResult}
                guessResult={guessResult}
              />
              <KaraokeBreak gameState={gameState} socket={socket as Socket} playerId={gameState.players.find(p=>p.isHost)?.id || ''} roomCode={roomCode} />
            </>
          ) : (
            <HostDashboard
              key={`host-main-${gameState.currentQuestion?.id || 'none'}`}
              socket={socket as Socket}
              gameState={gameState}
              roomCode={roomCode}
              charadeDeadline={charadeDeadline}
              pictionaryDeadline={pictionaryDeadline}
              playerId={gameState.players.find(p=>p.isHost)?.id || ''}
              lightningCountdownEndAt={lightningCountdownEndAt}
              answerResult={answerResult}
              forfeitResult={forfeitResult}
              forfeitFailureResult={forfeitFailureResult}
              guessResult={guessResult}
            />
          )
        );
      case 'player':
        return gameState && (
          (gameState.gamePhase === 'ready_check' || gameState.gamePhase === 'waiting') ? (
            <ReadyScreen socket={socket as Socket} gameState={gameState} playerId={playerId} roomCode={roomCode} />
          ) : (gameState.gamePhase === 'karaoke_break' || gameState.gamePhase === 'karaoke_voting') ? (
            <>
              <PlayerInterface
                socket={socket as Socket}
                gameState={gameState}
                answerResult={answerResult}
                currentQuestion={currentQuestion}
                playerId={playerId}
                charadeDeadline={charadeDeadline}
                pictionaryDeadline={pictionaryDeadline}
                lightningCountdownEndAt={lightningCountdownEndAt}
                forfeitResult={forfeitResult}
                forfeitFailureResult={forfeitFailureResult}
                guessResult={guessResult}
              />
              <KaraokeBreak gameState={gameState} socket={socket as Socket} playerId={playerId} roomCode={roomCode} />
            </>
          ) : (
            <PlayerInterface
              socket={socket as Socket}
              gameState={gameState}
              answerResult={answerResult}
              currentQuestion={currentQuestion}
              playerId={playerId}
              charadeDeadline={charadeDeadline}
              pictionaryDeadline={pictionaryDeadline}
              lightningCountdownEndAt={lightningCountdownEndAt}
              forfeitResult={forfeitResult}
              forfeitFailureResult={forfeitFailureResult}
              guessResult={guessResult}
            />
          )
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
    <div className={mode === 'player' ? 'overflow-auto' : ''}>
      {renderContent()}
      {showRoundBanner && (
        <div onClick={() => setShowRoundBanner(null)}>
          <RoundBanner
            round={showRoundBanner.round}
            cyclesPerRound={showRoundBanner.cyclesPerRound}
            cycleInRound={showRoundBanner.cycleInRound}
            secondsPerTurn={showRoundBanner.round === 2 ? 25 : showRoundBanner.round === 3 ? 20 : showRoundBanner.round === 4 ? 15 : showRoundBanner.round === 5 ? 15 : 30}
            rules={[
              showRoundBanner.round === 1 ? 'Standard rules. Earn points by answering correctly.' :
              showRoundBanner.round === 2 ? 'Head-to-Head: Choose an opponent. Both get the same question. Correct: +1 life, +10% power. Wrong: -1 life, -10% power. 25s timer.' :
              showRoundBanner.round === 3 ? 'Spin the Wheel: No manual choice. A random category is selected. 20s timer. Forfeits, lives, power-ups, and category locking same as Round 1.' :
              showRoundBanner.round === 4 ? 'Standard rules return. 15s timer. Forfeits, lives, power-ups, and category locking same as Round 1.' :
              showRoundBanner.round === 5 ? 'Sudden Death: Head-to-Head duels each turn. Two players face the same question. Wrong answers lose 1 life; correct is safe. 15s per duel. Continues until one player remains. Everyone plays everyone at least once.' :
              'Rules will be announced for this round.',
              `Round ${showRoundBanner.round} lasts ${showRoundBanner.cyclesPerRound} full cycles around the table.`,
            ]}
            intensity={showRoundBanner.round >= 5 ? 'ultra' : showRoundBanner.round >= 3 ? 'high' : showRoundBanner.round >= 2 ? 'med' : 'low'}
            roundIntroSrc={showRoundBanner.round === 2 ? '/round2-intro.mp3' : undefined}
            onClose={() => setShowRoundBanner(null)}
          />
        </div>
      )}
      {mode === 'player' && gameState && currentQuestion && socket && (() => {
        const mine = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
        const h2h = !!(gameState.h2hActive && (gameState.h2hChallengerId === playerId || gameState.h2hOpponentId === playerId));
        return gameState.gamePhase === 'question' && (mine || h2h);
      })() && (
        <QuestionOverlay
          key={`${currentQuestion.id}-${currentQuestion.options.length}`}
          question={currentQuestion}
          isMyTurn={gameState.players[gameState.currentPlayerIndex]?.id === playerId}
          onSubmit={(answerIndex) => {
            socket.emit('submit-answer', gameState.id, playerId, answerIndex);
          }}
          socket={socket}
          playerId={playerId}
          roomCode={roomCode}
          lifelines={gameState.players.find(p => p.id === playerId)?.lifelines || { fiftyFifty: 0, passToRandom: 0 }}
          powerUps={gameState.players.find(p => p.id === playerId)?.powerUps || { swap_question: 0, steal_category: 0 }}
          deadlineMs={questionDeadline || null}
          h2hInfo={{ active: !!gameState.h2hActive, challengerId: gameState.h2hChallengerId, opponentId: gameState.h2hOpponentId }}
        />
      )}
      {mode === 'host' && gameState && currentQuestion && socket && (() => {
        const host = gameState.players.find(p => p.isHost);
        if (!host) return false;
        const mine = gameState.players[gameState.currentPlayerIndex]?.id === host.id;
        const h2h = !!(gameState.h2hActive && (gameState.h2hChallengerId === host.id || gameState.h2hOpponentId === host.id));
        return gameState.gamePhase === 'question' && (mine || h2h);
      })() && (
        (() => {
          const host = gameState.players.find(p => p.isHost)!;
          return (
            <QuestionOverlay
              key={`host-${currentQuestion.id}-${currentQuestion.options.length}`}
              question={currentQuestion}
              isMyTurn={gameState.players[gameState.currentPlayerIndex]?.id === host.id}
              onSubmit={(answerIndex) => {
                socket.emit('submit-answer', gameState.id, host.id, answerIndex);
              }}
              socket={socket}
              playerId={host.id}
              roomCode={roomCode}
              lifelines={host.lifelines || { fiftyFifty: 0, passToRandom: 0 }}
              powerUps={host.powerUps || { swap_question: 0, steal_category: 0 }}
              deadlineMs={questionDeadline || null}
              h2hInfo={{ active: !!gameState.h2hActive, challengerId: gameState.h2hChallengerId, opponentId: gameState.h2hOpponentId }}
            />
          );
        })()
      )}
      {mode === 'player' && gameState && (
        <ResultBanner
          gameState={gameState}
          currentQuestion={currentQuestion}
          answerResult={answerResult}
          forfeitResult={forfeitResult}
          forfeitFailureResult={forfeitFailureResult}
          guessResult={guessResult}
          lightningNoWinnerMessage={lightningNoWinnerMessage}
          sabotageResult={sabotageResult}
          playerId={playerId}
          onClose={handleBannerClose}
          onResultClear={handleResultClearWithSabotage}
        />
      )}
      {mode === 'host' && gameState && (
        <ResultBanner
          gameState={gameState}
          currentQuestion={currentQuestion}
          answerResult={answerResult}
          forfeitResult={forfeitResult}
          forfeitFailureResult={forfeitFailureResult}
          guessResult={guessResult}
          lightningNoWinnerMessage={lightningNoWinnerMessage}
          sabotageResult={sabotageResult}
          playerId={gameState.players.find(p=>p.isHost)?.id || ''}
          onClose={handleBannerClose}
          onResultClear={handleResultClearWithSabotage}
        />
      )}
    </div>
  );
}

export default App;