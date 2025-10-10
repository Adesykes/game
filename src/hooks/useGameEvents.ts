import { useEffect, useState } from 'react';
import { useSound } from './useSound';
import { Socket } from 'socket.io-client';
import { GameState, Question, AnswerResult } from '../types/game';

export const useGameEvents = (
  socket: Socket | null,
  setGameState: (gameState: GameState | null) => void
) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [charadeDeadline, setCharadeDeadline] = useState<number | null>(null);
  const [pictionaryDeadline, setPictionaryDeadline] = useState<number | null>(null);
  const [questionDeadline, setQuestionDeadline] = useState<number | null>(null);
  const [lightningCountdownEndAt, setLightningCountdownEndAt] = useState<number | null>(null);
  const [forfeitResult, setForfeitResult] = useState<{ playerId: string; success: boolean; forfeitType: string } | null>(null);
  const [forfeitFailureResult, setForfeitFailureResult] = useState<{ playerId: string; forfeitType: string } | null>(null);
  const [guessResult, setGuessResult] = useState<{ solverId: string; forfeitType: string; solution: string } | null>(null);
  const [lightningNoWinnerMessage, setLightningNoWinnerMessage] = useState<string | null>(null);
  const [sabotageResult, setSabotageResult] = useState<{ saboteurId: string; saboteurName: string; targetId: string; targetName: string } | null>(null);

  // Sound functions (hook must be top-level)
  const { playCorrect, playWrong, playReady, playStart } = useSound();

  useEffect(() => {
    if (!socket) return;

    // Always clone incoming game state to force React render even if reference reused server-side
    const cloneState = (gs: GameState) => JSON.parse(JSON.stringify(gs)) as GameState;

    const onPlayerJoined = ({ gameState }: { gameState: GameState }) => setGameState(cloneState(gameState));
    const onGameStarted = ({ gameState }: { gameState: GameState }) => {
      setGameState(cloneState(gameState));
    };

    // Added explicit handler for game state updates
    const onGameStateUpdate = ({ gameState, message }: { gameState: GameState, message?: string }) => {
      console.log(`[client] game-state-update received: ${message || 'No message'}`);
      setGameState(cloneState(gameState));
      setCharadeDeadline(null); // Reset charade deadline on state updates
      setPictionaryDeadline(null); // Reset pictionary deadline on state updates
      if (gameState.gamePhase !== 'question') {
        setQuestionDeadline(null);
      }
      if (gameState.gamePhase === 'ready_check' && message?.toLowerCase().includes('ready')) playReady();
      if (gameState.gamePhase === 'category_selection' && message && /starting|forced/i.test(message)) playStart();
    };

    const onNextTurn = ({ gameState }: { gameState: GameState }) => {
      console.log('[client] next-turn received, updating game state');
      console.log(`[client] next-turn: gamePhase=${gameState.gamePhase}, currentPlayerIndex=${gameState.currentPlayerIndex}, currentPlayer=${gameState.players[gameState.currentPlayerIndex]?.name} (${gameState.players[gameState.currentPlayerIndex]?.id})`);
      console.log(`[client] My socket ID: ${socket.id}`);
      console.log('[client] All players:', gameState.players.map(p => `${p.name} (${p.id})`).join(', '));
      // Immediate update with cloned state
      setGameState(cloneState(gameState));
  setCurrentQuestion(null);
  setQuestionDeadline(null);
      setAnswerResult(null);
      setCharadeDeadline(null);
      setPictionaryDeadline(null);
    };

    const onCategorySelected = ({ question, gameState }: { question: Question; gameState: GameState }) => {
      setGameState(cloneState(gameState));
      setCurrentQuestion(question);
      // Start a 30s deadline for answering
      setQuestionDeadline(Date.now() + 30000);
    };

  const onAnswerSubmitted = ({
      gameState,
      playerId,
      isCorrect,
      correctAnswer,
      categoryLocked,
      lockedCategories,
      recentCategories,
      categoryLockMessage,
    }: {
      gameState: GameState;
      playerId: string;
      isCorrect: boolean;
      correctAnswer: number;
      categoryLocked?: string;
      lockedCategories?: string[];
      recentCategories?: string[];
      categoryLockMessage?: string;
    }) => {
  console.log(`[client] answer-submitted by ${playerId}, isCorrect: ${isCorrect}, new phase: ${gameState.gamePhase}`);
  if (isCorrect) playCorrect(); else playWrong();

      // Update game state first
  setGameState(cloneState(gameState));

      // Set answer result for feedback with category locking info
      setAnswerResult({
        playerId,
        answerIndex: -1, // Not needed for this implementation
        isCorrect,
        correctAnswer: correctAnswer ?? currentQuestion?.correctAnswer ?? 0,
        categoryLocked,
        lockedCategories: lockedCategories || [],
        recentCategories: recentCategories || [],
        categoryLockMessage
      });

      // Only reset current question for incorrect answers initially
      // For correct answers, we'll clear it on next-turn or game-state-update
      if (!isCorrect) {
        setCurrentQuestion(null);
        setQuestionDeadline(null);
      } else {
        console.log('[client] Correct answer - waiting for turn advancement');
        // Add a backup timer to clear the question if we don't get a turn update
        setTimeout(() => {
          setCurrentQuestion(null);
          setQuestionDeadline(null);
        }, 2000);
      }
    };

    const onCharadeStarted = ({ gameState, deadline }: { gameState: GameState, deadline?: number }) => {
      console.log('[client] charade-started received! gamePhase:', gameState.gamePhase, 'deadline:', deadline);
  setGameState(cloneState(gameState));
      setCharadeDeadline(typeof deadline === 'number' ? deadline : null);
      // Clear any previous answer result when starting forfeit
      setAnswerResult(null);
    };

    const onCharadeSolved = ({ gameState, solverId }: { gameState: GameState, solverId: string }) => {
      console.log('[client] charade-solved by:', solverId);
  setGameState(cloneState(gameState));
      setCharadeDeadline(null);
      
      // Set guess result for banner display
      setGuessResult({
        solverId,
        forfeitType: 'charade',
        solution: gameState.charadeSolution || 'Unknown'
      });
    };

    const onCharadeFailed = ({ gameState, playerId }: { gameState: GameState, playerId: string }) => {
      console.log('[client] charade-failed by:', playerId, 'new gamePhase:', gameState.gamePhase);
      setGameState(cloneState(gameState));
      setCharadeDeadline(null);

      // Set forfeit failure result for banner display
      setForfeitFailureResult({
        playerId,
        forfeitType: 'charade'
      });

      // Clear failure result after 4 seconds
      setTimeout(() => setForfeitFailureResult(null), 4000);
    };

    const onPictionaryStarted = ({ gameState, deadline }: { gameState: GameState, deadline?: number }) => {
      console.log('[client] pictionary-started deadline:', deadline);
  setGameState(cloneState(gameState));
      setPictionaryDeadline(typeof deadline === 'number' ? deadline : null);
      // Clear any previous answer result when starting forfeit
      setAnswerResult(null);
    };

    const onPictionarySolved = ({ gameState, solverId }: { gameState: GameState, solverId: string }) => {
      console.log('[client] pictionary-solved by:', solverId);
  setGameState(cloneState(gameState));
      setPictionaryDeadline(null);
      
      // Set guess result for banner display
      setGuessResult({
        solverId,
        forfeitType: 'pictionary',
        solution: gameState.pictionarySolution || 'Unknown'
      });
    };

    const onPictionaryFailed = ({ gameState, playerId }: { gameState: GameState, playerId: string }) => {
      console.log('[client] pictionary-failed by:', playerId, 'new gamePhase:', gameState.gamePhase);
      setGameState(cloneState(gameState));
      setPictionaryDeadline(null);

      // Set forfeit failure result for banner display
      setForfeitFailureResult({
        playerId,
        forfeitType: 'pictionary'
      });

      // Clear failure result after 4 seconds
      setTimeout(() => setForfeitFailureResult(null), 4000);
    };

    const onDrawingUpdate = ({ gameState }: { gameState: GameState }) => {
  setGameState(cloneState(gameState));
    };

    const onGameFinished = ({ gameState }: { gameState: GameState }) => {
  setGameState(cloneState(gameState));
      setCharadeDeadline(null);
      setPictionaryDeadline(null);
    };

    const onForfeitCompleted = ({ gameState, forfeitType }: { gameState: GameState, forfeitType: string }) => {
      console.log(`[client] forfeit-completed of type: ${forfeitType}, new gamePhase: ${gameState.gamePhase}`);
      setGameState(cloneState(gameState));
      setCharadeDeadline(null);
      setPictionaryDeadline(null);

      // Set forfeit result for banner display
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer) {
        setForfeitResult({
          playerId: currentPlayer.id,
          success: true, // Forfeits are always "completed" successfully
          forfeitType
        });

        // Clear forfeit result after 3 seconds
        setTimeout(() => setForfeitResult(null), 3000);
      }
    };

    const onCategoryLocked = ({
      category,
      message,
      lockedCategories,
      recentCategories
    }: {
      category: string;
      message: string;
      lockedCategories: string[];
      recentCategories: string[];
    }) => {
      console.log(`[client] category-locked: ${category}`);
      // Show an alert to the user with detailed information
      const detailedMessage = `${message}\n\nLocked categories: ${lockedCategories.join(', ')}\nRecent categories: ${recentCategories.join(', ')} (${recentCategories.length}/3)`;
      alert(detailedMessage);
    };

    // Lightning round events (minimal wiring)
    const onLightningCountdown = ({ countdownEndAt }: { countdownEndAt: number }) => {
      console.log('[client] lightning-countdown:', countdownEndAt);
      setLightningCountdownEndAt(countdownEndAt);
    };

    const onLightningStart = ({ gameState, question, deadline, questionId }: { gameState: GameState; question: Question; deadline: number; questionId: string }) => {
      console.log('[client] lightning-start, questionId:', questionId);
      setGameState(cloneState(gameState));
      setCurrentQuestion(question);
      setQuestionDeadline(deadline);
      setLightningCountdownEndAt(null); // Clear countdown when lightning starts
    };

    const onLightningWinner = ({ gameState, winnerId }: { gameState: GameState; winnerId: string }) => {
      console.log('[client] lightning-winner:', winnerId);
      setGameState(cloneState(gameState));
    };

    const onLightningElimination = ({ gameState, eliminatedPlayerId }: { gameState: GameState; eliminatedPlayerId: string }) => {
      console.log('[client] lightning-elimination:', eliminatedPlayerId);
      setGameState(cloneState(gameState));
    };

    const onLightningEnded = ({ gameState, reason }: { gameState: GameState; reason?: string }) => {
      console.log('[client] lightning-ended, reason:', reason);
      setGameState(cloneState(gameState));
      setCurrentQuestion(null);
      setQuestionDeadline(null);
      
      // Show message if lightning round ended with no winners
      if (reason === 'timeout') {
        setLightningNoWinnerMessage('No one got the lightning question right!');
      }
    };

    const onLightningRewardChoice = ({ winnerId, options }: { winnerId: string; options: string[] }) => {
      // Minimal UX: if we are the winner (by playerId on current gameState), prompt for reward
      // We don't have direct access to the local playerId here; clients can handle UI elsewhere.
      // As a fallback, if exactly one player has lifelines changed in gameState, we skip.
      // For now, leave this as a no-op to avoid noisy prompts without knowing the local player.
      console.log('[client] lightning-reward-choice for winner:', winnerId, 'options:', options.join(','));
    };

    const onLifelineFiftyFiftyUsed = ({ gameState, playerId, removedIndices }: { gameState: GameState; playerId: string; removedIndices: number[] }) => {
      console.log(`[client] lifeline-fifty-fifty-used by ${playerId}, removed indices: ${removedIndices}`);
      const cloned = cloneState(gameState);
      setGameState(cloned);
      // Ensure the answering player UI receives the updated, reduced options
      if (cloned.currentQuestion) {
        setCurrentQuestion(cloned.currentQuestion);
      }
    };

    const onLifelinePassToRandomUsed = ({ gameState, fromPlayerId, toPlayerId }: { gameState: GameState; fromPlayerId: string; toPlayerId: string }) => {
      console.log(`[client] lifeline-pass-to-random-used from ${fromPlayerId} to ${toPlayerId}`);
      setGameState(gameState);
    };

    const onQuestionSwapped = ({ gameState, playerId, question }: { gameState: GameState; playerId: string; question: Question }) => {
      console.log(`[client] question-swapped by ${playerId} -> ${question?.category || 'unknown'} (${question?.id || 'no-id'})`);
      // Update state and replace the current question with the new one from server
      setGameState(cloneState(gameState));
      if (question) {
        setCurrentQuestion(question);
        // Preserve remaining time if a deadline exists; if missing, set a fresh 30s window
        setQuestionDeadline(prev => prev && prev > Date.now() ? prev : Date.now() + 30000);
      }
    };

    const onPowerupStealCategoryResult = ({ gameState, thiefId, targetId, category, amount }: { gameState: GameState; thiefId: string; targetId: string; category: string; amount: number; }) => {
      console.log(`[client] powerup-steal-category-result: ${thiefId} stole ${amount} from ${targetId} in ${category}`);
      setGameState(gameState);
    };

    const onSabotageGranted = ({ playerId, playerName, gameState }: { playerId: string; playerName: string; gameState: GameState }) => {
      console.log(`[client] sabotage-granted: ${playerName} (${playerId}) earned sabotage ability!`);
      setGameState(cloneState(gameState));
    };

    const onPlayerSabotaged = ({ saboteurId, saboteurName, targetId, targetName, gameState }: { saboteurId: string; saboteurName: string; targetId: string; targetName: string; gameState: GameState }) => {
      console.log(`[client] player-sabotaged: ${saboteurName} sabotaged ${targetName}!`);
      setGameState(cloneState(gameState));
      // Store sabotage event so target client can show a banner
      setSabotageResult({ saboteurId, saboteurName, targetId, targetName });
    };

    // Register event listeners
    socket.on('player-joined', onPlayerJoined);
    socket.on('game-started', (data) => {
      console.log('Game started event received:', data);
      onGameStarted(data);
    });
    socket.on('next-turn', onNextTurn);
    socket.on('category-selected', (data) => {
      console.log('Category selected event received:', data?.question?.category || 'Unknown', 'by player:', data?.gameState?.players?.[data?.gameState?.currentPlayerIndex]?.name || 'Unknown');
      onCategorySelected(data);
    });
    socket.on('answer-submitted', onAnswerSubmitted);
    socket.on('charade-started', onCharadeStarted);
    socket.on('charade-solved', onCharadeSolved);
    socket.on('charade-failed', onCharadeFailed);
    socket.on('pictionary-started', onPictionaryStarted);
    socket.on('pictionary-solved', onPictionarySolved);
    socket.on('pictionary-failed', onPictionaryFailed);
    socket.on('drawing-update', onDrawingUpdate);
    socket.on('forfeit-completed', onForfeitCompleted);
    socket.on('game-finished', onGameFinished);
    socket.on('game-state-update', onGameStateUpdate);
    socket.on('category-locked', onCategoryLocked);
    socket.on('lifeline-fifty-fifty-used', onLifelineFiftyFiftyUsed);
    socket.on('lifeline-pass-to-random-used', onLifelinePassToRandomUsed);
    socket.on('question-swapped', onQuestionSwapped);
    socket.on('powerup-steal-category-result', onPowerupStealCategoryResult);
    socket.on('sabotage-granted', onSabotageGranted);
    socket.on('player-sabotaged', onPlayerSabotaged);
  socket.on('lightning-countdown', onLightningCountdown);
  socket.on('lightning-start', onLightningStart);
  socket.on('lightning-winner', onLightningWinner);
  socket.on('lightning-elimination', onLightningElimination);
  socket.on('lightning-ended', onLightningEnded);
  socket.on('lightning-reward-choice', onLightningRewardChoice);

    // Clean up
    return () => {
      socket.off('player-joined', onPlayerJoined);
      socket.off('game-started', onGameStarted);
      socket.off('next-turn', onNextTurn);
      socket.off('category-selected', onCategorySelected);
      socket.off('answer-submitted', onAnswerSubmitted);
      socket.off('charade-started', onCharadeStarted);
      socket.off('charade-solved', onCharadeSolved);
      socket.off('charade-failed', onCharadeFailed);
      socket.off('pictionary-started', onPictionaryStarted);
      socket.off('pictionary-solved', onPictionarySolved);
      socket.off('pictionary-failed', onPictionaryFailed);
      socket.off('drawing-update', onDrawingUpdate);
      socket.off('forfeit-completed', onForfeitCompleted);
      socket.off('game-finished', onGameFinished);
      socket.off('game-state-update', onGameStateUpdate);
      socket.off('category-locked', onCategoryLocked);
      socket.off('lifeline-fifty-fifty-used', onLifelineFiftyFiftyUsed);
      socket.off('lifeline-pass-to-random-used', onLifelinePassToRandomUsed);
      socket.off('question-swapped', onQuestionSwapped);
      socket.off('powerup-steal-category-result', onPowerupStealCategoryResult);
      socket.off('sabotage-granted', onSabotageGranted);
      socket.off('player-sabotaged', onPlayerSabotaged);
  socket.off('lightning-countdown', onLightningCountdown);
  socket.off('lightning-start', onLightningStart);
  socket.off('lightning-winner', onLightningWinner);
  socket.off('lightning-elimination', onLightningElimination);
  socket.off('lightning-ended', onLightningEnded);
  socket.off('lightning-reward-choice', onLightningRewardChoice);
    };
  }, [socket, setGameState, currentQuestion, playCorrect, playWrong, playReady, playStart]);

  return { 
    currentQuestion, 
    answerResult, 
    charadeDeadline, 
    pictionaryDeadline, 
    questionDeadline, 
    lightningCountdownEndAt, 
    forfeitResult, 
    forfeitFailureResult, 
    guessResult,
    lightningNoWinnerMessage,
    sabotageResult,
    // Expose setters for result clearing
    setAnswerResult,
    setForfeitResult,
    setForfeitFailureResult,
    setGuessResult,
    setLightningNoWinnerMessage,
    setSabotageResult
  };
};
